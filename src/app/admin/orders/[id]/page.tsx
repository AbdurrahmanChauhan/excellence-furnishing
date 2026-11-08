'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Calendar,
  CreditCard,
  Download,
  Eye,
  FileText,
  MapPin,
  Phone,
  Printer,
  Scissors,
  CheckCircle2,
  Clock,
  Truck,
  Home,
  AlertTriangle,
  XCircle,
  PlusCircle,
  Receipt,
  User,
  ShieldCheck,
  ChevronRight,
  ArrowRight,
  ShoppingBag,
} from 'lucide-react';
import jsPDF from 'jspdf';
import { fetchOrderById, modifyOrder, fetchLastInvoiceNumber, saveInvoice } from '@/lib/firebase/firestore';
import { Order, OrderStatus, PaymentStatus, PaymentMethod, PaymentRecord } from '@/types/order';
import { Invoice, InvoiceItem } from '@/types/invoice';
import { generateNextInvoiceNumber } from '@/lib/pricing/calculator';
import { formatINR, formatDate, convertRupeesToWords, toRupees, toPaise } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { OrderStepper } from '@/components/dashboard/OrderStepper';

const STAGE_ORDER: OrderStatus[] = ['draft', 'confirmed', 'in_production', 'ready', 'delivered'];

const STAGE_LABELS: Record<OrderStatus, string> = {
  draft: 'Draft Quote',
  confirmed: 'Confirmed (Deposit Received)',
  in_production: 'In Tailoring & Cutting',
  ready: 'Ready for Fitting / QC Passed',
  delivered: 'Delivered & Installed',
  cancelled: 'Order Cancelled',
};

const NEXT_STAGE_BUTTON: Partial<Record<OrderStatus, { next: OrderStatus; label: string }>> = {
  draft: { next: 'confirmed', label: 'Advance to Confirmed' },
  confirmed: { next: 'in_production', label: 'Start Workshop Tailoring' },
  in_production: { next: 'ready', label: 'Mark Ready for Delivery' },
  ready: { next: 'delivered', label: 'Complete Delivery & Installation' },
};

export default function AdminOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params?.id as string;

  const [order, setOrder] = React.useState<Order | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [updatingStatus, setUpdatingStatus] = React.useState(false);
  const [generatingInvoice, setGeneratingInvoice] = React.useState(false);

  // Payment Logging Modal state
  const [showPaymentModal, setShowPaymentModal] = React.useState(false);
  const [paymentAmount, setPaymentAmount] = React.useState(0);
  const [paymentMethod, setPaymentMethod] = React.useState<PaymentMethod>('upi');
  const [paymentRef, setPaymentRef] = React.useState('');
  const [paymentNotes, setPaymentNotes] = React.useState('');
  const [recordingPayment, setRecordingPayment] = React.useState(false);
  const [paymentError, setPaymentError] = React.useState<string | null>(null);

  const loadOrder = React.useCallback(async () => {
    if (!orderId) return;
    try {
      setLoading(true);
      const found = await fetchOrderById(orderId);
      setOrder(found);
      if (found) {
        setPaymentAmount(toRupees(found.balanceAmountPaise));
      }
    } catch (err) {
      console.error('Failed to load order details:', err);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  React.useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  // Status Advancement
  const handleAdvanceStatus = async (nextStatus: OrderStatus) => {
    if (!order) return;
    try {
      setUpdatingStatus(true);
      const updated = await modifyOrder(order.id, {
        status: nextStatus,
        ...(nextStatus === 'delivered' ? { actualDeliveryDate: new Date().toISOString() } : {}),
      });
      if (updated) {
        setOrder(updated);
      }
    } catch (err) {
      console.error('Failed to advance order status:', err);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!order) return;
    if (!confirm('Are you sure you want to cancel this order?')) return;
    try {
      setUpdatingStatus(true);
      const updated = await modifyOrder(order.id, { status: 'cancelled' });
      if (updated) {
        setOrder(updated);
      }
    } catch (err) {
      console.error('Failed to cancel order:', err);
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Payment Recording
  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;
    setPaymentError(null);

    const amountPaiseToAdd = toPaise(paymentAmount);
    if (amountPaiseToAdd <= 0) {
      setPaymentError('Payment amount must be greater than zero.');
      return;
    }

    try {
      setRecordingPayment(true);
      const timestamp = new Date().toISOString();
      const newPayment: PaymentRecord = {
        id: `pay-${Date.now().toString().slice(-6)}`,
        amountPaise: amountPaiseToAdd,
        method: paymentMethod,
        date: timestamp,
        referenceNumber: paymentRef.trim() || undefined,
        notes: paymentNotes.trim() || undefined,
        recordedBy: 'Mr. Altaf Chauhan',
      };

      const updatedPayments = [...(order.payments || []), newPayment];
      const newPaidPaise = (order.paidAmountPaise || 0) + amountPaiseToAdd;
      const newBalancePaise = Math.max(0, order.grandTotalPaise - newPaidPaise);

      const newPaymentStatus: PaymentStatus =
        newBalancePaise === 0
          ? 'paid'
          : newPaidPaise > 0
          ? 'partial'
          : 'pending';

      const updatedOrder = await modifyOrder(order.id, {
        payments: updatedPayments,
        paidAmountPaise: newPaidPaise,
        balanceAmountPaise: newBalancePaise,
        paymentStatus: newPaymentStatus,
      });

      if (updatedOrder) {
        setOrder(updatedOrder);
        setShowPaymentModal(false);
        setPaymentRef('');
        setPaymentNotes('');
      }
    } catch (err: any) {
      console.error('Failed to record payment:', err);
      setPaymentError(err.message || 'Error recording payment.');
    } finally {
      setRecordingPayment(false);
    }
  };

  // Generate GST Tax Invoice Action
  const handleGenerateInvoice = async () => {
    if (!order) return;

    if (order.invoiceId) {
      router.push(`/admin/invoices/${order.invoiceId}`);
      return;
    }

    try {
      setGeneratingInvoice(true);
      const timestamp = new Date().toISOString();

      // Retrieve last invoice number and increment sequentially
      const lastNumber = await fetchLastInvoiceNumber();
      const nextInvoiceNumber = generateNextInvoiceNumber(lastNumber);
      const invoiceId = `inv-${nextInvoiceNumber.replace(/[^a-zA-Z0-9]/g, '')}`;

      // Convert order items to invoice items
      const invoiceItems: InvoiceItem[] = order.items.map((item) => ({
        description: item.productName,
        hsnCode: item.category === 'wallpapers' ? '4814' : item.category === 'mattresses_sleep_solutions' ? '9404' : '5407',
        quantity: item.quantity,
        unit: item.unit,
        unitRatePaise: item.unitPricePaise,
        amountPaise: item.lineTotalPaise,
      }));

      // Add tailoring service line if needed
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 15);

      const invoicePayload: Invoice = {
        id: invoiceId,
        invoiceNumber: nextInvoiceNumber,
        orderId: order.id,
        orderNumber: order.orderNumber,
        clientId: order.clientId,
        clientDetails: {
          name: order.clientName,
          phone: order.clientPhone,
          email: order.clientEmail,
          billingAddress: order.deliveryAddress,
          shippingAddress: order.deliveryAddress,
        },
        businessDetails: {
          legalName: 'Excellence The Furnishing Gallery',
          proprietor: 'Mr. Altaf Chauhan',
          address: 'Shop No. 226, Sajid Tower, S.V. Road, Opp. Amboli Railway Crossing, Andheri West, Mumbai — 400058',
          phone: '+91 91462 77255',
          email: 'altamashchauhanexcellence@gmail.com',
          gstin: '27ANMPC9233E1Z1',
          pan: 'AABCU9603R',
          bankDetails: {
            bankName: 'HDFC Bank',
            accountName: 'Excellence The Furnishing Gallery',
            accountNumber: '50200012345678',
            ifscCode: 'HDFC0000128',
            branch: 'Andheri West Branch, Mumbai',
            upiId: 'excellencefurnishing@okhdfcbank',
          },
        },
        items: invoiceItems,
        subtotalPaise: order.subtotalPaise,
        discountPaise: order.discountPaise || 0,
        gstBreakdown: order.gstBreakdown,
        grandTotalPaise: order.grandTotalPaise,
        grandTotalWords: convertRupeesToWords(toRupees(order.grandTotalPaise)),
        status: order.paymentStatus === 'paid' ? 'paid' : 'sent',
        issueDate: timestamp,
        dueDate: dueDate.toISOString(),
        paidDate: order.paymentStatus === 'paid' ? timestamp : undefined,
        termsAndConditions: [
          '1. Goods once custom-cut or stitched cannot be returned or exchanged.',
          '2. 50% advance payable on confirmation; balance strictly on delivery/installation.',
          '3. Motorized tracks carry manufacturer warranty as per OEM Somfy guidelines.',
          '4. All disputes subject to Mumbai jurisdiction.',
        ],
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      await saveInvoice(invoicePayload);

      // Link invoice ID back to order
      const updatedOrder = await modifyOrder(order.id, {
        invoiceId: invoicePayload.id,
        invoiceNumber: invoicePayload.invoiceNumber,
      });

      if (updatedOrder) {
        setOrder(updatedOrder);
      }

      router.push(`/admin/invoices/${invoicePayload.id}`);
    } catch (err) {
      console.error('Failed to generate invoice:', err);
    } finally {
      setGeneratingInvoice(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 max-w-5xl mx-auto py-12 text-center text-brand-charcoal/60">
        <Clock className="w-8 h-8 text-brand-gold/40 animate-spin mx-auto mb-2" />
        <p className="text-sm">Loading order specifications for #{orderId}...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16 space-y-4">
        <AlertTriangle className="w-12 h-12 text-brand-burgundy/60 mx-auto" />
        <h2 className="font-display text-2xl font-bold text-brand-espresso">Order Not Found</h2>
        <p className="text-sm text-brand-charcoal/70">
          The requested order ID #{orderId} could not be found.
        </p>
        <Link href="/admin/orders">
          <Button className="bg-brand-gold hover:bg-brand-gold-dark text-brand-espresso text-xs font-semibold gap-2">
            <ArrowLeft className="w-4 h-4" /> Back to Orders
          </Button>
        </Link>
      </div>
    );
  }

  const nextAction = NEXT_STAGE_BUTTON[order.status];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Navigation & Action Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Link
          href="/admin/orders"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-gold hover:text-brand-gold-dark"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Orders
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          {/* Cancel button if not delivered */}
          {order.status !== 'delivered' && order.status !== 'cancelled' && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleCancelOrder}
              disabled={updatingStatus}
              className="text-xs border-red-300 text-red-700 hover:bg-red-50 hover:text-red-800"
            >
              <XCircle className="w-3.5 h-3.5 mr-1" />
              <span>Cancel Order</span>
            </Button>
          )}

          {/* Record Payment Button */}
          {order.balanceAmountPaise > 0 && order.status !== 'cancelled' && (
            <Button
              size="sm"
              onClick={() => {
                setPaymentAmount(toRupees(order.balanceAmountPaise));
                setShowPaymentModal(true);
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold gap-1.5 shadow-xs"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Record Payment</span>
            </Button>
          )}

          {/* Generate Invoice Action */}
          <Button
            size="sm"
            onClick={handleGenerateInvoice}
            disabled={generatingInvoice}
            className="bg-brand-gold hover:bg-brand-gold-dark text-brand-espresso text-xs font-bold gap-1.5 shadow-xs"
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>
              {generatingInvoice
                ? 'Generating...'
                : order.invoiceId
                ? `View Invoice (${order.invoiceNumber})`
                : 'Generate Tax Invoice'}
            </span>
          </Button>
        </div>
      </div>

      {/* Main Order Card */}
      <Card className="bg-white border-brand-gold/30 shadow-card">
        <CardHeader className="pb-4 border-b border-brand-gold/15">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <CardTitle className="text-2xl sm:text-3xl text-brand-espresso font-display">
                  {order.orderNumber}
                </CardTitle>
                <Badge variant={order.status as any} className="text-xs px-3 py-1">
                  {order.status.replace('_', ' ').toUpperCase()}
                </Badge>
                {order.invoiceNumber && (
                  <Link
                    href={`/admin/invoices/${order.invoiceId}`}
                    className="text-xs font-mono text-brand-gold-dark bg-brand-ivory px-2 py-0.5 rounded border border-brand-gold/30 hover:underline"
                  >
                    Invoice: {order.invoiceNumber} ↗
                  </Link>
                )}
              </div>
              <CardDescription className="text-xs text-brand-charcoal/70 mt-1">
                Created on {formatDate(order.createdAt)} · Client:{' '}
                <Link
                  href={`/admin/clients/${order.clientId}`}
                  className="font-bold text-brand-espresso hover:underline"
                >
                  {order.clientName}
                </Link>{' '}
                (+91 {order.clientPhone})
              </CardDescription>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-xs text-brand-charcoal/60 uppercase font-semibold block">
                Total (Inc. 18% GST)
              </span>
              <span className="font-display text-2xl sm:text-3xl font-bold text-brand-gold-dark">
                {formatINR(order.grandTotalPaise, true)}
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-6 space-y-8">
          {/* Milestone Status Stepper & Next Stage Button */}
          <div className="p-4 rounded-card bg-brand-pearl/50 border border-brand-gold/20 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Scissors className="w-4 h-4 text-brand-gold" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-brand-espresso">
                  Workshop Production & Delivery Stepper
                </h3>
              </div>

              {/* Next Stage Advancement Button */}
              {nextAction && order.status !== 'cancelled' && (
                <Button
                  size="sm"
                  onClick={() => handleAdvanceStatus(nextAction.next)}
                  disabled={updatingStatus}
                  className="bg-brand-espresso hover:bg-brand-gold hover:text-brand-espresso text-brand-ivory text-xs font-semibold gap-1.5 h-8 shadow-xs"
                >
                  <span>{updatingStatus ? 'Advancing...' : nextAction.label}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>

            <OrderStepper
              status={order.status}
              createdAt={order.createdAt}
              estimatedDeliveryDate={order.estimatedDeliveryDate}
            />
          </div>

          {/* Itemized Specification Table */}
          <div className="space-y-3">
            <h3 className="font-display text-lg font-bold text-brand-espresso flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-brand-gold" /> Bespoke Soft Furnishings & Workshop Items
            </h3>

            <div className="overflow-x-auto border border-brand-gold/20 rounded-card">
              <table className="w-full text-left text-xs text-brand-espresso">
                <thead className="bg-brand-ivory border-b border-brand-gold/20 text-[11px] font-bold uppercase text-brand-charcoal">
                  <tr>
                    <th className="py-3 px-4">#</th>
                    <th className="py-3 px-4">Product / Specification</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4 text-center">Quantity</th>
                    <th className="py-3 px-4 text-right">Unit Rate</th>
                    <th className="py-3 px-4 text-right">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-gold/10">
                  {order.items.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-brand-pearl/40">
                      <td className="py-3.5 px-4 font-medium text-brand-charcoal/70">{idx + 1}</td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          {item.swatchImageUrl && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={item.swatchImageUrl}
                              alt={item.productName}
                              className="w-10 h-10 rounded-soft object-cover border border-brand-gold/30 shrink-0"
                            />
                          )}
                          <div>
                            <span className="font-semibold block text-sm">{item.productName}</span>
                            {item.measurementId && (
                              <span className="text-[10px] text-brand-gold-dark font-mono block">
                                Linked Measurement: {item.measurementId}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-brand-charcoal/70 capitalize">
                        {item.category.replace(/_/g, ' ')}
                      </td>
                      <td className="py-3.5 px-4 text-center font-medium">
                        {item.quantity} {item.unit}
                      </td>
                      <td className="py-3.5 px-4 text-right font-medium">
                        {formatINR(item.unitPricePaise, true)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-brand-gold-dark">
                        {formatINR(item.lineTotalPaise, true)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Payment & GST Financial Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* Payment Tracking & History */}
            <div className="p-4 rounded-card bg-brand-pearl/40 border border-brand-gold/20 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-brand-espresso flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-brand-gold" /> Payment Ledger
                </span>
                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded-pill ${
                    order.paymentStatus === 'paid'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : order.paymentStatus === 'partial'
                      ? 'bg-blue-100 text-blue-800 border border-blue-300'
                      : 'bg-amber-100 text-amber-900 border border-amber-300'
                  }`}
                >
                  {order.paymentStatus.toUpperCase()}
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-brand-charcoal pt-1">
                <div className="flex justify-between">
                  <span>Total Amount Paid:</span>
                  <span className="font-bold text-emerald-800">
                    {formatINR(order.paidAmountPaise, true)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Balance Due on Handover:</span>
                  <span className="font-bold text-brand-burgundy">
                    {formatINR(order.balanceAmountPaise, true)}
                  </span>
                </div>
              </div>

              {/* Logged Transactions List */}
              <div className="pt-2 border-t border-brand-gold/15 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-brand-espresso text-[11px] uppercase tracking-wider">
                    Recorded Payments ({order.payments?.length || 0}):
                  </span>
                  {order.balanceAmountPaise > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setPaymentAmount(toRupees(order.balanceAmountPaise));
                        setShowPaymentModal(true);
                      }}
                      className="text-[11px] font-bold text-brand-gold hover:underline flex items-center gap-1"
                    >
                      <PlusCircle className="w-3 h-3" /> Log Payment
                    </button>
                  )}
                </div>

                {order.payments && order.payments.length > 0 ? (
                  <div className="space-y-1.5">
                    {order.payments.map((p) => (
                      <div
                        key={p.id}
                        className="p-2 rounded bg-white border border-brand-gold/15 flex items-center justify-between text-[11px]"
                      >
                        <div>
                          <span className="font-bold uppercase text-brand-espresso block">
                            {p.method.replace(/_/g, ' ')}
                          </span>
                          <span className="text-brand-charcoal/60">
                            {formatDate(p.date)} · Ref: {p.referenceNumber || 'N/A'}
                          </span>
                        </div>
                        <span className="font-bold text-emerald-700">
                          {formatINR(p.amountPaise, true)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-brand-charcoal/60 italic">
                    No payments logged yet.
                  </p>
                )}
              </div>
            </div>

            {/* GST Summary Card */}
            <div className="p-4 rounded-card bg-brand-ivory/60 border border-brand-gold/30 space-y-2.5 text-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-espresso block pb-1 border-b border-brand-gold/20">
                GST Tax Split & Grand Total (18%)
              </span>

              <div className="flex justify-between text-brand-charcoal/80">
                <span>Subtotal (Paise Integer Precision):</span>
                <span className="font-medium">{formatINR(order.subtotalPaise, true)}</span>
              </div>

              {order.discountPaise > 0 && (
                <div className="flex justify-between text-green-700">
                  <span>Promotional Discount:</span>
                  <span>- {formatINR(order.discountPaise, true)}</span>
                </div>
              )}

              <div className="flex justify-between text-brand-charcoal/80">
                <span>CGST ({order.gstBreakdown.ratePercent / 2}%):</span>
                <span>{formatINR(order.gstBreakdown.cgstPaise, true)}</span>
              </div>

              <div className="flex justify-between text-brand-charcoal/80">
                <span>SGST ({order.gstBreakdown.ratePercent / 2}%):</span>
                <span>{formatINR(order.gstBreakdown.sgstPaise, true)}</span>
              </div>

              <div className="flex justify-between text-sm font-bold text-brand-espresso pt-2 border-t border-brand-gold/20">
                <span>Grand Total:</span>
                <span className="text-base text-brand-gold-dark">
                  {formatINR(order.grandTotalPaise, true)}
                </span>
              </div>

              <p className="text-[11px] text-brand-charcoal/70 italic pt-1">
                {convertRupeesToWords(toRupees(order.grandTotalPaise))}
              </p>
            </div>
          </div>

          {/* Site Address & Workshop Staff */}
          <div className="p-4 rounded-card bg-white border border-brand-gold/20 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <span className="font-bold text-brand-espresso flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                <MapPin className="w-3.5 h-3.5 text-brand-gold" /> Site / Installation Address
              </span>
              <p className="text-brand-charcoal/80">
                {order.deliveryAddress.street}
                {order.deliveryAddress.landmark && `, ${order.deliveryAddress.landmark}`}
                <br />
                {order.deliveryAddress.city}, {order.deliveryAddress.state} —{' '}
                {order.deliveryAddress.pincode}
              </p>
            </div>

            <div className="space-y-1">
              <span className="font-bold text-brand-espresso flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                <ShieldCheck className="w-3.5 h-3.5 text-brand-gold" /> Master Tailoring Team
              </span>
              <p className="text-brand-charcoal/80">
                Mr. Altamash & Mr. Ahmed (Senior Workshop Supervisors)
                <br />
                <span className="text-brand-gold-dark font-medium">
                  Workshop Hotline: Shop 226, Sajid Tower, Andheri West
                </span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Logging Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-card shadow-2xl border border-brand-gold/30 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-brand-gold/20 pb-3">
              <h3 className="font-display font-bold text-lg text-brand-espresso flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-brand-gold" />
                <span>Log Payment for {order.orderNumber}</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="text-brand-charcoal/60 hover:text-brand-espresso text-sm p-1"
              >
                ✕
              </button>
            </div>

            {paymentError && (
              <div className="p-3 rounded-card bg-red-50 border border-red-200 text-xs text-red-700">
                {paymentError}
              </div>
            )}

            <form onSubmit={handleRecordPayment} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-brand-espresso">
                  Payment Amount in ₹ (Balance: {formatINR(order.balanceAmountPaise, true)})
                </label>
                <Input
                  type="number"
                  step="any"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                  placeholder="e.g. 15000"
                  className="text-xs h-9 bg-brand-pearl/40 border-brand-gold/30 focus:border-brand-gold font-bold text-base"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-brand-espresso">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full text-xs h-9 px-3 rounded-card border border-brand-gold/30 bg-white text-brand-espresso focus:outline-none focus:border-brand-gold"
                >
                  <option value="upi">UPI (GPay / PhonePe / Paytm / QR)</option>
                  <option value="credit_debit_card">Credit / Debit Card</option>
                  <option value="cash">Cash Received at Showroom</option>
                  <option value="cheque">Cheque</option>
                  <option value="net_banking">Net Banking / NEFT / RTGS</option>
                  <option value="bank_neft_rtgs">Direct Bank Transfer</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-brand-espresso">Transaction Reference / UTR / Cheque #</label>
                <Input
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  placeholder="e.g. UPI-928190184918 or Cheque 004128"
                  className="text-xs h-9 bg-brand-pearl/40 border-brand-gold/30 focus:border-brand-gold font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-brand-espresso">Notes (Optional)</label>
                <Input
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="e.g. Cleared via Andheri West POS terminal"
                  className="text-xs h-9 bg-brand-pearl/40 border-brand-gold/30 focus:border-brand-gold"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-brand-gold/20">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPaymentModal(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={recordingPayment}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{recordingPayment ? 'Recording...' : 'Record Payment'}</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

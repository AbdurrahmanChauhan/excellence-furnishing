'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Download,
  Calendar,
  MapPin,
  User,
  Scissors,
  CheckCircle2,
  Receipt,
  Printer,
  ShieldCheck,
  CreditCard,
} from 'lucide-react';
import jsPDF from 'jspdf';
import { fetchOrderById } from '@/lib/firebase/firestore';
import { Order } from '@/types/order';
import { formatINR, formatDate, convertRupeesToWords, toRupees } from '@/lib/utils';
import { OrderStepper } from '@/components/dashboard/OrderStepper';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params?.id as string;

  const [order, setOrder] = React.useState<Order | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [generatingPdf, setGeneratingPdf] = React.useState(false);

  React.useEffect(() => {
    async function loadOrder() {
      if (!orderId) return;
      setLoading(true);
      try {
        const found = await fetchOrderById(orderId);
        setOrder(found);
      } catch (err) {
        console.warn('Failed to fetch order detail:', err);
      } finally {
        setLoading(false);
      }
    }

    loadOrder();
  }, [orderId]);

  const handleDownloadInvoice = () => {
    if (!order) return;
    setGeneratingPdf(true);

    try {
      const doc = new jsPDF();

      // Header Banner
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(44, 24, 16); // #2C1810
      doc.text('EXCELLENCE THE FURNISHING GALLERY', 14, 20);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(114, 47, 55); // #722F37
      doc.text('Where Every Thread Tells a Story of Excellence · Est. 2003', 14, 25);

      doc.setTextColor(80, 80, 80);
      doc.text(
        'Shop No. 226, Sajid Tower, S.V. Road, Opp. Amboli Railway Stn, Andheri West, Mumbai — 400058',
        14,
        30
      );
      doc.text('GSTIN: 27AABCE1234F1Z5 | Phone: +91 98200 XXXXX | Email: contact@excellencefurnishing.in', 14, 35);

      doc.setDrawColor(184, 134, 11); // #B8860B
      doc.setLineWidth(0.5);
      doc.line(14, 38, 196, 38);

      // Tax Invoice Title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(44, 24, 16);
      doc.text('TAX INVOICE & WORKSHOP SPECIFICATION', 14, 46);

      // Metadata block
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`Invoice No: ${order.invoiceNumber || order.orderNumber}`, 14, 54);
      doc.text(`Order Ref: ${order.orderNumber}`, 14, 60);
      doc.text(`Date: ${formatDate(order.createdAt)}`, 14, 66);

      doc.text(`Client: ${order.clientName}`, 120, 54);
      doc.text(`Phone: ${order.clientPhone}`, 120, 60);
      doc.text(`Site: ${order.deliveryAddress.street}, ${order.deliveryAddress.city}`, 120, 66);

      doc.line(14, 72, 196, 72);

      // Table Header
      let y = 80;
      doc.setFillColor(250, 243, 224); // #FAF3E0
      doc.rect(14, y - 6, 182, 9, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(44, 24, 16);
      doc.text('#', 16, y);
      doc.text('Description & Bespoke Tailoring Specs', 26, y);
      doc.text('Qty', 125, y);
      doc.text('Rate', 145, y);
      doc.text('Amount (INR)', 170, y);

      // Items
      doc.setFont('helvetica', 'normal');
      order.items.forEach((item, idx) => {
        y += 10;
        doc.text(`${idx + 1}`, 16, y);
        doc.text(item.productName.substring(0, 48), 26, y);
        doc.text(`${item.quantity} ${item.unit}`, 125, y);
        doc.text(formatINR(item.unitPricePaise, true), 145, y);
        doc.text(formatINR(item.lineTotalPaise, true), 170, y);
      });

      // Financials Summary
      y += 16;
      doc.line(14, y, 196, y);
      y += 8;

      doc.setFont('helvetica', 'normal');
      doc.text('Subtotal:', 130, y);
      doc.text(formatINR(order.subtotalPaise, true), 170, y);

      y += 6;
      doc.text(`CGST (${order.gstBreakdown.ratePercent / 2}%):`, 130, y);
      doc.text(formatINR(order.gstBreakdown.cgstPaise, true), 170, y);

      y += 6;
      doc.text(`SGST (${order.gstBreakdown.ratePercent / 2}%):`, 130, y);
      doc.text(formatINR(order.gstBreakdown.sgstPaise, true), 170, y);

      y += 8;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('Grand Total:', 130, y);
      doc.text(formatINR(order.grandTotalPaise, true), 170, y);

      y += 8;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(
        `Amount in Words: ${convertRupeesToWords(toRupees(order.grandTotalPaise))}`,
        14,
        y
      );

      // Terms
      y += 14;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text('Terms & Conditions:', 14, y);
      doc.setFont('helvetica', 'normal');
      doc.text(
        '1. Custom tailored goods are manufactured to approved measurements. 2. Motorized Somfy tracks include 2-year warranty.',
        14,
        y + 5
      );
      doc.text(
        '3. Thank you for choosing Excellence The Furnishing Gallery, Andheri West.',
        14,
        y + 10
      );

      doc.save(`Invoice_${order.orderNumber}.pdf`);
    } catch (err) {
      console.warn('PDF generation fallback to print:', err);
      window.print();
    } finally {
      setGeneratingPdf(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 max-w-5xl mx-auto py-8">
        <div className="h-8 w-40 bg-gray-200 rounded animate-pulse" />
        <Card className="p-8 bg-white border-brand-gold/20 animate-pulse">
          <div className="h-10 w-1/3 bg-gray-200 rounded mb-4" />
          <div className="h-20 w-full bg-gray-100 rounded" />
        </Card>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16 space-y-4">
        <h2 className="font-display text-2xl font-bold text-brand-espresso">Order Not Found</h2>
        <p className="text-sm text-brand-charcoal/70">
          The requested order #{orderId} could not be located in your client record.
        </p>
        <Link href="/dashboard/orders">
          <Button variant="gold" size="sm" className="gap-2">
            <ArrowLeft className="w-4 h-4" /> Back to My Orders
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Back button & Action Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Link
          href="/dashboard/orders"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-gold hover:text-brand-gold-dark"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Orders
        </Link>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.print()}
            className="gap-1.5 text-xs border-brand-gold/30 hover:bg-brand-ivory"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Print Sheet</span>
          </Button>

          <Button
            size="sm"
            variant="gold"
            onClick={handleDownloadInvoice}
            disabled={generatingPdf}
            className="gap-1.5 text-xs shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{generatingPdf ? 'Generating PDF...' : 'Download Tax Invoice (PDF)'}</span>
          </Button>
        </div>
      </div>

      {/* Main Order Header Card */}
      <Card className="border-brand-gold/30 shadow-card bg-white">
        <CardHeader className="pb-4 border-b border-brand-gold/15">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <CardTitle className="text-2xl sm:text-3xl text-brand-espresso">
                  {order.orderNumber}
                </CardTitle>
                <Badge variant={order.status as any} className="text-xs px-3 py-1">
                  {order.status.replace('_', ' ').toUpperCase()}
                </Badge>
                {order.invoiceNumber && (
                  <span className="text-xs font-mono text-brand-gold-dark bg-brand-ivory px-2 py-0.5 rounded border border-brand-gold/30">
                    Invoice: {order.invoiceNumber}
                  </span>
                )}
              </div>
              <CardDescription className="text-xs text-brand-charcoal/70 mt-1">
                Ordered on {formatDate(order.createdAt)} · Client: {order.clientName} ({order.clientPhone})
              </CardDescription>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-xs text-brand-charcoal/60 uppercase font-semibold block">
                Grand Total (Inc. GST)
              </span>
              <span className="font-display text-2xl sm:text-3xl font-bold text-brand-gold-dark">
                {formatINR(order.grandTotalPaise, true)}
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-6 space-y-8">
          {/* 5-Stage Milestone Progress Stepper */}
          <div className="p-4 rounded-card bg-brand-pearl/50 border border-brand-gold/20">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Scissors className="w-4 h-4 text-brand-gold" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-brand-espresso">
                  Tailoring & Installation Milestones
                </h3>
              </div>
              {order.estimatedDeliveryDate && (
                <span className="text-xs font-medium text-brand-gold-dark">
                  Target Handover: {formatDate(order.estimatedDeliveryDate)}
                </span>
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
              <Receipt className="w-4 h-4 text-brand-gold" /> Bespoke Soft Furnishings & Tailoring Specs
            </h3>

            <div className="overflow-x-auto border border-brand-gold/20 rounded-card">
              <table className="w-full text-left text-xs text-brand-espresso">
                <thead className="bg-brand-ivory border-b border-brand-gold/20 text-[11px] font-bold uppercase text-brand-charcoal">
                  <tr>
                    <th className="py-3 px-4">#</th>
                    <th className="py-3 px-4">Product / Fabric</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4 text-center">Quantity</th>
                    <th className="py-3 px-4 text-right">Unit Rate</th>
                    <th className="py-3 px-4 text-right">Amount</th>
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
                                Ref: {item.measurementId}
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

          {/* Financial Breakdown & GST Split */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* Payment & Receipts Card */}
            <div className="p-4 rounded-card bg-brand-pearl/40 border border-brand-gold/20 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-brand-espresso flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-brand-gold" /> Payment Status
                </span>
                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded-pill ${
                    order.paymentStatus === 'paid'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-amber-100 text-amber-900 border border-amber-300'
                  }`}
                >
                  {order.paymentStatus.toUpperCase()}
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-brand-charcoal pt-1">
                <div className="flex justify-between">
                  <span>Advance / Received:</span>
                  <span className="font-bold text-emerald-800">
                    {formatINR(order.paidAmountPaise, true)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Balance Due on Delivery:</span>
                  <span className="font-bold text-brand-burgundy">
                    {formatINR(order.balanceAmountPaise, true)}
                  </span>
                </div>
              </div>

              {order.payments && order.payments.length > 0 && (
                <div className="pt-2 border-t border-brand-gold/15 space-y-1 text-[11px] text-brand-charcoal/80">
                  <span className="font-semibold block text-brand-espresso">Recorded Payments:</span>
                  {order.payments.map((p) => (
                    <div key={p.id} className="flex justify-between text-brand-charcoal/70">
                      <span>
                        {p.method.toUpperCase()} ({p.referenceNumber || 'Cash/POS'}) ·{' '}
                        {formatDate(p.date)}
                      </span>
                      <span className="font-medium">{formatINR(p.amountPaise, true)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* GST Summary Card */}
            <div className="p-4 rounded-card bg-brand-ivory/60 border border-brand-gold/30 space-y-2 text-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-espresso block pb-1 border-b border-brand-gold/20">
                Tax & Financial Breakdown (GST 18%)
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
            </div>
          </div>

          {/* Delivery & Master Tailor Details */}
          <div className="p-4 rounded-card bg-white border border-brand-gold/20 flex flex-col sm:flex-row justify-between gap-4 text-xs">
            <div className="space-y-1">
              <span className="font-bold text-brand-espresso flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                <MapPin className="w-3.5 h-3.5 text-brand-gold" /> Installation Address
              </span>
              <p className="text-brand-charcoal/80">
                {order.deliveryAddress.street}
                {order.deliveryAddress.landmark && `, ${order.deliveryAddress.landmark}`}
                <br />
                {order.deliveryAddress.city}, {order.deliveryAddress.state} —{' '}
                {order.deliveryAddress.pincode}
              </p>
            </div>

            <div className="space-y-1 sm:text-right">
              <span className="font-bold text-brand-espresso flex items-center gap-1.5 sm:justify-end uppercase tracking-wider text-[11px]">
                <ShieldCheck className="w-3.5 h-3.5 text-brand-gold" /> Assigned Fitting Team
              </span>
              <p className="text-brand-charcoal/80">
                Mr. Alim & Workshop Fitting Crew
                <br />
                <span className="text-brand-gold-dark font-medium">
                  Direct Helpline: +91 98200 XXXXX
                </span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

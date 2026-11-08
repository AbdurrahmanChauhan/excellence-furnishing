'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  ShoppingBag,
  Users,
  CreditCard,
  AlertCircle,
  Package,
} from 'lucide-react';
import { fetchClients, fetchProducts, saveOrder } from '@/lib/firebase/firestore';
import { Client } from '@/types/client';
import { Product } from '@/types/product';
import { Order, OrderItem, PaymentRecord } from '@/types/order';
import { calculateGST } from '@/lib/pricing/calculator';
import { formatINR, toPaise, toRupees } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface NewOrderItemState {
  productId?: string;
  productName: string;
  category: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  swatchImageUrl?: string;
}

export default function AdminNewOrderPage() {
  const router = useRouter();

  const [clients, setClients] = React.useState<Client[]>([]);
  const [products, setProducts] = React.useState<Product[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Client selection state
  const [selectedClientId, setSelectedClientId] = React.useState<string>('');
  const [clientName, setClientName] = React.useState('');
  const [clientPhone, setClientPhone] = React.useState('');
  const [clientEmail, setClientEmail] = React.useState('');
  const [streetAddress, setStreetAddress] = React.useState('');
  const [city, setCity] = React.useState('Mumbai');
  const [pincode, setPincode] = React.useState('400058');

  // Items state
  const [items, setItems] = React.useState<NewOrderItemState[]>([
    {
      productId: '',
      productName: '',
      category: 'curtains_window_treatments',
      quantity: 1,
      unit: 'meter',
      unitPrice: 1200,
    },
  ]);

  // Financial adjustments
  const [discountRupees, setDiscountRupees] = React.useState(0);
  const [internalNotes, setInternalNotes] = React.useState('');

  // Initial Advance Payment
  const [advanceAmount, setAdvanceAmount] = React.useState(0);
  const [advanceMethod, setAdvanceMethod] = React.useState<'upi' | 'credit_debit_card' | 'net_banking' | 'cheque' | 'cash' | 'bank_neft_rtgs'>('upi');
  const [advanceRef, setAdvanceRef] = React.useState('');

  React.useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [clientsData, productsData] = await Promise.all([
          fetchClients(),
          fetchProducts(),
        ]);
        setClients(clientsData);
        setProducts(productsData);

        if (clientsData.length > 0) {
          const first = clientsData[0];
          setSelectedClientId(first.id);
          setClientName(first.name);
          setClientPhone(first.phone);
          setClientEmail(first.email);
          setStreetAddress(first.siteAddress?.street || first.billingAddress.street);
          setCity(first.siteAddress?.city || first.billingAddress.city);
          setPincode(first.siteAddress?.pincode || first.billingAddress.pincode);
        }
      } catch (err) {
        console.error('Failed to load initial clients or products:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSelectClient = (clientId: string) => {
    setSelectedClientId(clientId);
    const found = clients.find((c) => c.id === clientId);
    if (found) {
      setClientName(found.name);
      setClientPhone(found.phone);
      setClientEmail(found.email);
      setStreetAddress(found.siteAddress?.street || found.billingAddress.street);
      setCity(found.siteAddress?.city || found.billingAddress.city);
      setPincode(found.siteAddress?.pincode || found.billingAddress.pincode);
    }
  };

  const handleItemProductSelect = (index: number, productId: string) => {
    const found = products.find((p) => p.id === productId);
    if (!found) return;

    setItems((prev) => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        productId: found.id,
        productName: found.name,
        category: found.category,
        unit: found.unit,
        unitPrice: toRupees(found.pricePerUnitPaise),
        swatchImageUrl: found.swatchImage,
      };
      return copy;
    });
  };

  const handleItemFieldChange = (index: number, field: keyof NewOrderItemState, value: any) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        productId: '',
        productName: '',
        category: 'curtains_window_treatments',
        quantity: 1,
        unit: 'meter',
        unitPrice: 1000,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Financial calculations
  const subtotalPaise = items.reduce(
    (sum, item) => sum + Math.round(item.quantity * item.unitPrice * 100),
    0
  );
  const discountPaise = Math.round(discountRupees * 100);
  const taxablePaise = Math.max(0, subtotalPaise - discountPaise);
  const gstBreakdown = calculateGST(taxablePaise, false, 18);
  const grandTotalPaise = taxablePaise + gstBreakdown.totalTaxPaise;

  const advancePaise = Math.round(advanceAmount * 100);
  const balancePaise = Math.max(0, grandTotalPaise - advancePaise);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!clientName.trim() || !clientPhone.trim()) {
      setError('Client name and a valid 10-digit phone number are required.');
      return;
    }

    if (items.some((item) => !item.productName.trim() || item.quantity <= 0 || item.unitPrice <= 0)) {
      setError('Please provide valid product details, positive quantities, and unit rates for all items.');
      return;
    }

    try {
      setSubmitting(true);
      const timestamp = new Date().toISOString();
      const orderSeq = Math.floor(10000 + Math.random() * 90000);
      const orderId = `order-${orderSeq}`;
      const orderNumber = `EF-ORD-2026-${orderSeq}`;

      // Convert items state to OrderItem[]
      const orderItems: OrderItem[] = items.map((item, idx) => ({
        id: `item-${Date.now().toString().slice(-4)}-${idx}`,
        productId: item.productId || undefined,
        productName: item.productName,
        category: item.category,
        quantity: item.quantity,
        unit: item.unit,
        unitPricePaise: Math.round(item.unitPrice * 100),
        swatchImageUrl: item.swatchImageUrl,
        lineTotalPaise: Math.round(item.quantity * item.unitPrice * 100),
      }));

      // Initial payment record if entered
      const payments: PaymentRecord[] = [];
      if (advancePaise > 0) {
        payments.push({
          id: `pay-${Date.now().toString().slice(-5)}`,
          amountPaise: advancePaise,
          method: advanceMethod,
          date: timestamp,
          referenceNumber: advanceRef || undefined,
          notes: 'Advance deposit on order placement',
          recordedBy: 'Mr. Altab Chauhan',
        });
      }

      const paymentStatus: Order['paymentStatus'] =
        advancePaise >= grandTotalPaise
          ? 'paid'
          : advancePaise > 0
          ? 'partial'
          : 'pending';

      const newOrder: Order = {
        id: orderId,
        orderNumber,
        clientId: selectedClientId || `client-${Date.now().toString().slice(-4)}`,
        clientName,
        clientPhone,
        clientEmail: clientEmail || undefined,
        items: orderItems,
        subtotalPaise,
        discountPaise,
        gstBreakdown,
        grandTotalPaise,
        paymentStatus,
        paidAmountPaise: advancePaise,
        balanceAmountPaise: balancePaise,
        payments,
        status: advancePaise > 0 ? 'confirmed' : 'draft',
        deliveryAddress: {
          street: streetAddress || 'Sajid Tower, S.V. Road',
          city: city || 'Mumbai',
          state: 'Maharashtra',
          pincode: pincode || '400058',
          country: 'India',
        },
        internalNotes: internalNotes || 'Manually created sales order',
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      await saveOrder(newOrder);
      router.push(`/admin/orders/${newOrder.id}`);
    } catch (err: any) {
      console.error('Failed to create order:', err);
      setError(err.message || 'An error occurred while creating the order.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-5xl mx-auto">
      {/* Back and Action Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Link
          href="/admin/orders"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-gold hover:text-brand-gold-dark"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Orders
        </Link>

        <div className="flex items-center gap-2">
          <Link href="/admin/orders">
            <Button type="button" variant="ghost" size="sm" className="text-xs">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={submitting}
            className="bg-brand-gold hover:bg-brand-gold-dark text-brand-espresso font-semibold gap-1.5 shadow-sm text-xs sm:text-sm"
          >
            <Save className="w-4 h-4" />
            <span>{submitting ? 'Creating Order...' : 'Confirm & Save Order'}</span>
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-card bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Client Information Card */}
      <Card className="bg-white border-brand-gold/30 shadow-xs">
        <CardHeader className="pb-3 border-b border-brand-gold/15">
          <CardTitle className="text-lg font-bold font-display text-brand-espresso flex items-center gap-2">
            <Users className="w-5 h-5 text-brand-gold" /> Client Details & Delivery Site
          </CardTitle>
          <CardDescription className="text-xs text-brand-charcoal/70">
            Select an existing showroom client or enter client coordinates directly.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Quick Client Picker */}
          <div className="space-y-1.5 md:col-span-3">
            <label className="text-xs font-bold text-brand-espresso">
              Select Existing Client (Optional)
            </label>
            <select
              value={selectedClientId}
              onChange={(e) => handleSelectClient(e.target.value)}
              className="w-full text-xs h-9 px-3 rounded-card border border-brand-gold/30 bg-white text-brand-espresso focus:outline-none focus:border-brand-gold"
            >
              <option value="">-- Choose from Registered Clients --</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} (+91 {c.phone}) — {c.siteAddress?.city || c.billingAddress?.city}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-brand-espresso">
              Client Full Name <span className="text-red-500">*</span>
            </label>
            <Input
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="e.g. Mrs. Sunita Kapoor"
              className="text-xs h-9 bg-brand-pearl/40 border-brand-gold/30 focus:border-brand-gold"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-brand-espresso">
              10-Digit Mobile <span className="text-red-500">*</span>
            </label>
            <Input
              value={clientPhone}
              onChange={(e) => setClientPhone(e.target.value)}
              placeholder="e.g. 9820199999"
              className="text-xs h-9 bg-brand-pearl/40 border-brand-gold/30 focus:border-brand-gold"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-brand-espresso">Email (Optional)</label>
            <Input
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
              placeholder="client@gmail.com"
              className="text-xs h-9 bg-brand-pearl/40 border-brand-gold/30 focus:border-brand-gold"
            />
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs font-bold text-brand-espresso">
              Site / Delivery Address <span className="text-red-500">*</span>
            </label>
            <Input
              value={streetAddress}
              onChange={(e) => setStreetAddress(e.target.value)}
              placeholder="e.g. Flat 1204, Oberoi Sky City, Borivali East"
              className="text-xs h-9 bg-brand-pearl/40 border-brand-gold/30 focus:border-brand-gold"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-brand-espresso">Pincode</label>
            <Input
              value={pincode}
              onChange={(e) => setPincode(e.target.value)}
              placeholder="400058"
              className="text-xs h-9 bg-brand-pearl/40 border-brand-gold/30 focus:border-brand-gold font-mono"
            />
          </div>
        </CardContent>
      </Card>

      {/* Itemized Products Card */}
      <Card className="bg-white border-brand-gold/30 shadow-xs">
        <CardHeader className="pb-3 border-b border-brand-gold/15 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg font-bold font-display text-brand-espresso flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-brand-gold" /> Order Line Items & Fabrics
            </CardTitle>
            <CardDescription className="text-xs text-brand-charcoal/70">
              Pick from our catalog or define custom furnishing items and tailoring yardage.
            </CardDescription>
          </div>
          <Button
            type="button"
            size="sm"
            onClick={handleAddItem}
            className="bg-brand-gold/20 hover:bg-brand-gold text-brand-espresso font-semibold text-xs gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> Add Another Item
          </Button>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          {items.map((item, index) => {
            const lineTotal = item.quantity * item.unitPrice;

            return (
              <div
                key={index}
                className="p-3 rounded-card bg-brand-pearl/40 border border-brand-gold/20 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-brand-gold-dark uppercase tracking-wider">
                    Item #{index + 1}
                  </span>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      className="text-red-600 hover:text-red-800 text-xs flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Remove
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  {/* Select from catalog */}
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-[11px] font-semibold text-brand-charcoal">
                      Pick from Catalog:
                    </label>
                    <select
                      value={item.productId || ''}
                      onChange={(e) => handleItemProductSelect(index, e.target.value)}
                      className="w-full text-xs h-8 px-2 rounded-card border border-brand-gold/30 bg-white text-brand-espresso focus:outline-none focus:border-brand-gold"
                    >
                      <option value="">-- Custom or Non-Catalog Item --</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} (₹{toRupees(p.pricePerUnitPaise)}/{p.unit})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Item Name */}
                  <div className="space-y-1 sm:col-span-3">
                    <label className="text-[11px] font-semibold text-brand-charcoal">
                      Item Description / Specification:
                    </label>
                    <Input
                      value={item.productName}
                      onChange={(e) => handleItemFieldChange(index, 'productName', e.target.value)}
                      placeholder="e.g. Royal Velvet Sheen Drapes (Gold)"
                      className="text-xs h-8 bg-white border-brand-gold/30 focus:border-brand-gold"
                    />
                  </div>

                  {/* Quantity */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-brand-charcoal">Quantity:</label>
                    <Input
                      type="number"
                      step="any"
                      value={item.quantity}
                      onChange={(e) =>
                        handleItemFieldChange(index, 'quantity', parseFloat(e.target.value) || 0)
                      }
                      className="text-xs h-8 bg-white border-brand-gold/30 focus:border-brand-gold font-semibold"
                    />
                  </div>

                  {/* Unit */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-brand-charcoal">Unit:</label>
                    <select
                      value={item.unit}
                      onChange={(e) => handleItemFieldChange(index, 'unit', e.target.value)}
                      className="w-full text-xs h-8 px-2 rounded-card border border-brand-gold/30 bg-white text-brand-espresso focus:outline-none focus:border-brand-gold"
                    >
                      <option value="meter">Meter</option>
                      <option value="roll">Roll</option>
                      <option value="piece">Piece</option>
                      <option value="sq.ft">Sq.ft</option>
                    </select>
                  </div>

                  {/* Unit Price */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-brand-charcoal">Rate (₹):</label>
                    <Input
                      type="number"
                      step="any"
                      value={item.unitPrice}
                      onChange={(e) =>
                        handleItemFieldChange(index, 'unitPrice', parseFloat(e.target.value) || 0)
                      }
                      className="text-xs h-8 bg-white border-brand-gold/30 focus:border-brand-gold font-semibold"
                    />
                  </div>

                  {/* Line Total Display */}
                  <div className="space-y-1 sm:col-span-2 flex flex-col justify-end">
                    <div className="h-8 px-3 rounded-card bg-brand-ivory/80 border border-brand-gold/30 flex items-center justify-between text-xs font-bold text-brand-espresso">
                      <span>Line Total:</span>
                      <span className="text-brand-gold-dark">{formatINR(lineTotal, false)}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Financials & Advance Payment Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Advance Payment Logging */}
        <Card className="bg-white border-brand-gold/30 shadow-xs">
          <CardHeader className="pb-3 border-b border-brand-gold/15">
            <CardTitle className="text-base font-bold font-display text-brand-espresso flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-brand-gold" /> Advance Deposit Recording
            </CardTitle>
            <CardDescription className="text-xs text-brand-charcoal/70">
              Optional upfront advance payment received upon placing this order.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-brand-espresso">Advance Amount (₹)</label>
              <Input
                type="number"
                step="any"
                value={advanceAmount}
                onChange={(e) => setAdvanceAmount(parseFloat(e.target.value) || 0)}
                placeholder="e.g. 15000"
                className="text-xs h-9 bg-brand-pearl/40 border-brand-gold/30 focus:border-brand-gold font-semibold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-brand-espresso">Payment Method</label>
              <select
                value={advanceMethod}
                onChange={(e) => setAdvanceMethod(e.target.value as any)}
                className="w-full text-xs h-9 px-3 rounded-card border border-brand-gold/30 bg-white text-brand-espresso focus:outline-none focus:border-brand-gold"
              >
                <option value="upi">UPI (GPay, PhonePe, Paytm)</option>
                <option value="credit_debit_card">Credit / Debit Card</option>
                <option value="cash">Cash</option>
                <option value="cheque">Cheque</option>
                <option value="net_banking">Net Banking / NEFT</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-brand-espresso">Reference / Transaction UTR</label>
              <Input
                value={advanceRef}
                onChange={(e) => setAdvanceRef(e.target.value)}
                placeholder="e.g. UPI-UTR-32819034"
                className="text-xs h-9 bg-brand-pearl/40 border-brand-gold/30 focus:border-brand-gold font-mono"
              />
            </div>

            <div className="space-y-1.5 pt-1">
              <label className="text-xs font-bold text-brand-espresso">Internal Notes</label>
              <textarea
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                rows={2}
                placeholder="Workshop instructions, rush timeline, or pleating preferences..."
                className="w-full text-xs p-2 rounded-card border border-brand-gold/30 bg-brand-pearl/40 text-brand-espresso focus:outline-none focus:border-brand-gold"
              />
            </div>
          </CardContent>
        </Card>

        {/* GST & Totals Summary */}
        <Card className="bg-brand-ivory/60 border-brand-gold/30 shadow-xs">
          <CardHeader className="pb-3 border-b border-brand-gold/20">
            <CardTitle className="text-base font-bold font-display text-brand-espresso">
              Summary & GST Breakdown (18%)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-2.5 text-xs">
            <div className="flex justify-between text-brand-charcoal">
              <span>Subtotal:</span>
              <span className="font-semibold">{formatINR(subtotalPaise, true)}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-brand-charcoal">Discount (₹):</span>
              <Input
                type="number"
                value={discountRupees}
                onChange={(e) => setDiscountRupees(parseFloat(e.target.value) || 0)}
                className="w-24 text-right text-xs h-7 bg-white border-brand-gold/30"
              />
            </div>

            <div className="flex justify-between text-brand-charcoal">
              <span>Taxable Value:</span>
              <span className="font-semibold">{formatINR(taxablePaise, true)}</span>
            </div>

            <div className="flex justify-between text-brand-charcoal">
              <span>CGST (9.0%):</span>
              <span className="font-semibold">{formatINR(gstBreakdown.cgstPaise, true)}</span>
            </div>

            <div className="flex justify-between text-brand-charcoal">
              <span>SGST (9.0%):</span>
              <span className="font-semibold">{formatINR(gstBreakdown.sgstPaise, true)}</span>
            </div>

            <div className="border-t border-brand-gold/20 pt-2 flex justify-between text-sm font-bold text-brand-espresso">
              <span>Grand Total:</span>
              <span className="text-base text-brand-gold-dark">{formatINR(grandTotalPaise, true)}</span>
            </div>

            <div className="border-t border-brand-gold/20 pt-2 space-y-1">
              <div className="flex justify-between text-emerald-800 font-semibold">
                <span>Advance Paid:</span>
                <span>{formatINR(advancePaise, true)}</span>
              </div>
              <div className="flex justify-between text-brand-burgundy font-bold text-sm">
                <span>Balance to Collect:</span>
                <span>{formatINR(balancePaise, true)}</span>
              </div>
            </div>

            <div className="pt-4">
              <Button
                type="submit"
                disabled={submitting}
                className="w-full bg-brand-gold hover:bg-brand-gold-dark text-brand-espresso font-bold py-2 shadow-sm text-sm"
              >
                {submitting ? 'Creating Order...' : 'Confirm & Create Order'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </form>
  );
}

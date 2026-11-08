'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Download,
  Printer,
  Calendar,
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  ShieldCheck,
  Building,
  CreditCard,
  AlertTriangle,
  Receipt,
  FileCheck,
} from 'lucide-react';
import { fetchInvoiceById, modifyInvoice } from '@/lib/firebase/firestore';
import { Invoice, InvoiceStatus } from '@/types/invoice';
import { generateInvoicePDF } from '@/lib/pdf/invoice-generator';
import { formatINR, formatDate, convertRupeesToWords, toRupees } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function AdminInvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const invoiceId = params?.id as string;

  const [invoice, setInvoice] = React.useState<Invoice | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [downloadingPdf, setDownloadingPdf] = React.useState(false);
  const [updatingStatus, setUpdatingStatus] = React.useState(false);

  const loadInvoice = React.useCallback(async () => {
    if (!invoiceId) return;
    try {
      setLoading(true);
      const data = await fetchInvoiceById(invoiceId);
      setInvoice(data);
    } catch (err) {
      console.error('Failed to load invoice:', err);
    } finally {
      setLoading(false);
    }
  }, [invoiceId]);

  React.useEffect(() => {
    loadInvoice();
  }, [loadInvoice]);

  const handleDownloadPDF = () => {
    if (!invoice) return;
    try {
      setDownloadingPdf(true);
      const doc = generateInvoicePDF(invoice);
      doc.save(`Invoice_${invoice.invoiceNumber}.pdf`);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleUpdateStatus = async (newStatus: InvoiceStatus) => {
    if (!invoice) return;
    try {
      setUpdatingStatus(true);
      const updated = await modifyInvoice(invoice.id, {
        status: newStatus,
        ...(newStatus === 'paid' ? { paidDate: new Date().toISOString() } : {}),
      });
      if (updated) {
        setInvoice(updated);
      }
    } catch (err) {
      console.error('Failed to update invoice status:', err);
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 max-w-4xl mx-auto py-12 text-center text-brand-charcoal/60">
        <Receipt className="w-8 h-8 text-brand-gold/40 animate-spin mx-auto mb-2" />
        <p className="text-sm">Loading invoice #{invoiceId}...</p>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16 space-y-4">
        <AlertTriangle className="w-12 h-12 text-brand-burgundy/60 mx-auto" />
        <h2 className="font-display text-2xl font-bold text-brand-espresso">Invoice Not Found</h2>
        <p className="text-sm text-brand-charcoal/70">
          The requested invoice #{invoiceId} could not be located.
        </p>
        <Link href="/admin/invoices">
          <Button className="bg-brand-gold hover:bg-brand-gold-dark text-brand-espresso text-xs font-semibold gap-2">
            <ArrowLeft className="w-4 h-4" /> Back to Invoices
          </Button>
        </Link>
      </div>
    );
  }

  const grandTotalRupees = toRupees(invoice.grandTotalPaise);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Action & Navigation Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
        <Link
          href="/admin/invoices"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-gold hover:text-brand-gold-dark"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Invoices
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Quick-Toggles */}
          {invoice.status !== 'paid' && (
            <Button
              size="sm"
              variant="outline"
              disabled={updatingStatus}
              onClick={() => handleUpdateStatus('paid')}
              className="text-xs border-emerald-500 text-emerald-800 hover:bg-emerald-50 gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Mark as Paid</span>
            </Button>
          )}

          {invoice.status === 'draft' && (
            <Button
              size="sm"
              variant="outline"
              disabled={updatingStatus}
              onClick={() => handleUpdateStatus('sent')}
              className="text-xs border-blue-400 text-blue-800 hover:bg-blue-50 gap-1.5"
            >
              <FileCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>Mark as Sent</span>
            </Button>
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={() => window.print()}
            className="text-xs border-brand-gold/30 hover:bg-brand-ivory gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Print</span>
          </Button>

          <Button
            size="sm"
            onClick={handleDownloadPDF}
            disabled={downloadingPdf}
            className="bg-brand-gold hover:bg-brand-gold-dark text-brand-espresso text-xs font-bold gap-1.5 shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{downloadingPdf ? 'Generating PDF...' : 'Download Invoice PDF'}</span>
          </Button>
        </div>
      </div>

      {/* Official GST Tax Invoice Sheet Container */}
      <div className="bg-white rounded-card shadow-card border border-brand-gold/30 p-6 sm:p-10 text-brand-espresso font-body relative overflow-hidden">
        {/* Brand Accent Top Bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-brand-gold via-brand-espresso to-brand-burgundy" />

        {/* Business Header & Logo */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 border-b border-brand-gold/20 pb-6 pt-2">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-card bg-brand-gold text-brand-espresso flex items-center justify-center font-display font-bold text-lg shadow-xs">
                E
              </span>
              <h1 className="font-display font-bold text-xl sm:text-2xl text-brand-espresso tracking-tight">
                {invoice.businessDetails?.legalName || 'EXCELLENCE THE FURNISHING GALLERY'}
              </h1>
            </div>
            <p className="text-xs font-serif italic text-brand-burgundy">
              &quot;Where Every Thread Tells a Story of Excellence&quot; · Est. 2003 (23+ Years)
            </p>
            <p className="text-xs text-brand-charcoal/80 max-w-md mt-1 leading-relaxed">
              {invoice.businessDetails?.address ||
                'Shop No. 226, Sajid Tower, S.V. Road, Opp. Amboli Railway Station, Andheri West, Mumbai — 400058'}
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-brand-charcoal/70 pt-1">
              <span><strong>GSTIN:</strong> {invoice.businessDetails?.gstin || '27ANMPC9233E1Z1'}</span>
              <span><strong>PAN:</strong> {invoice.businessDetails?.pan || 'AABCU9603R'}</span>
              <span><strong>State:</strong> 27 (Maharashtra)</span>
            </div>
          </div>

          <div className="text-left sm:text-right space-y-1 sm:shrink-0">
            <span className="inline-block bg-brand-gold/15 text-brand-espresso font-bold text-xs uppercase tracking-widest px-3 py-1 rounded-pill border border-brand-gold/30">
              TAX INVOICE
            </span>
            <h2 className="text-xl sm:text-2xl font-bold font-mono text-brand-espresso mt-1">
              {invoice.invoiceNumber}
            </h2>
            <div className="text-xs text-brand-charcoal/70 space-y-0.5">
              <p>
                <strong>Order Ref:</strong>{' '}
                <Link
                  href={`/admin/orders/${invoice.orderId}`}
                  className="font-mono text-brand-gold-dark hover:underline"
                >
                  {invoice.orderNumber}
                </Link>
              </p>
              <p><strong>Date:</strong> {formatDate(invoice.issueDate)}</p>
              <p><strong>Due Date:</strong> {formatDate(invoice.dueDate)}</p>
            </div>
          </div>
        </div>

        {/* Client & Billed To Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-6 border-b border-brand-gold/20 text-xs">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-brand-gold-dark block">
              Billed To (Buyer):
            </span>
            <p className="font-bold text-sm text-brand-espresso">{invoice.clientDetails.name}</p>
            <p className="text-brand-charcoal/80 flex items-center gap-1">
              <Phone className="w-3 h-3 text-brand-gold" /> +91 {invoice.clientDetails.phone}
            </p>
            {invoice.clientDetails.email && (
              <p className="text-brand-charcoal/80">{invoice.clientDetails.email}</p>
            )}
            <p className="text-brand-charcoal/80 pt-1 leading-relaxed">
              {invoice.clientDetails.billingAddress.street}
              {invoice.clientDetails.billingAddress.landmark && `, ${invoice.clientDetails.billingAddress.landmark}`}
              <br />
              {invoice.clientDetails.billingAddress.city}, {invoice.clientDetails.billingAddress.state} —{' '}
              {invoice.clientDetails.billingAddress.pincode}
            </p>
            {invoice.clientDetails.gstin && (
              <p className="font-mono pt-1">
                <strong>Buyer GSTIN:</strong> {invoice.clientDetails.gstin}
              </p>
            )}
          </div>

          <div className="space-y-1 sm:text-right">
            <span className="text-[11px] font-bold uppercase tracking-wider text-brand-gold-dark block">
              Place of Supply & Delivery Site:
            </span>
            <p className="font-semibold text-brand-espresso">
              State: 27 (Maharashtra, Mumbai)
            </p>
            <p className="text-brand-charcoal/80 pt-1 leading-relaxed">
              {invoice.clientDetails.shippingAddress.street}
              <br />
              {invoice.clientDetails.shippingAddress.city}, {invoice.clientDetails.shippingAddress.state} —{' '}
              {invoice.clientDetails.shippingAddress.pincode}
            </p>
            <div className="pt-2 sm:justify-end flex">
              <span
                className={`text-[11px] font-bold px-2.5 py-0.5 rounded-pill uppercase border ${
                  invoice.status === 'paid'
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : 'bg-amber-100 text-amber-900 border-amber-300'
                }`}
              >
                Payment: {invoice.status.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Itemized Table */}
        <div className="py-6 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-brand-pearl border-b border-brand-gold/20 text-brand-espresso font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-2.5 px-3">#</th>
                <th className="py-2.5 px-3">Description & Specifications</th>
                <th className="py-2.5 px-3 text-center">HSN/SAC</th>
                <th className="py-2.5 px-3 text-center">Qty</th>
                <th className="py-2.5 px-3 text-right">Unit Rate (₹)</th>
                <th className="py-2.5 px-3 text-right">Amount (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-gold/10">
              {invoice.items.map((item, idx) => (
                <tr key={idx} className="hover:bg-brand-pearl/30">
                  <td className="py-3 px-3 text-brand-charcoal/70">{idx + 1}</td>
                  <td className="py-3 px-3">
                    <span className="font-bold text-brand-espresso block text-xs">
                      {item.description}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center font-mono text-brand-charcoal/80">
                    {item.hsnCode || '5407'}
                  </td>
                  <td className="py-3 px-3 text-center font-medium">
                    {item.quantity} {item.unit}
                  </td>
                  <td className="py-3 px-3 text-right font-medium">
                    {formatINR(item.unitRatePaise, true)}
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-brand-espresso">
                    {formatINR(item.amountPaise, true)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Financial Totals & Tax Split */}
        <div className="border-t border-brand-gold/20 pt-4 grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          {/* Amount in words & Bank info */}
          <div className="space-y-4">
            <div>
              <span className="font-bold text-brand-espresso uppercase text-[10px] tracking-wider block">
                Total Amount in Words:
              </span>
              <p className="font-serif italic font-semibold text-brand-burgundy mt-1 text-xs">
                {invoice.grandTotalWords || convertRupeesToWords(grandTotalRupees)}
              </p>
            </div>

            {/* Bank Remittance Details */}
            <div className="p-3.5 rounded-card bg-brand-pearl/60 border border-brand-gold/20 space-y-1">
              <span className="font-bold text-brand-espresso text-[11px] uppercase tracking-wider block">
                Showroom Bank Details for NEFT / RTGS / UPI:
              </span>
              <p className="text-brand-charcoal/80">
                Bank: <strong>HDFC Bank</strong>, Andheri West Branch
              </p>
              <p className="text-brand-charcoal/80">
                A/C Name: <strong>Excellence The Furnishing Gallery</strong>
              </p>
              <p className="text-brand-charcoal/80 font-mono">
                A/C No: <strong>50200012345678</strong> | IFSC: <strong>HDFC0000128</strong>
              </p>
              <p className="text-brand-gold-dark font-mono">
                UPI ID: <strong>excellencefurnishing@okhdfcbank</strong>
              </p>
            </div>
          </div>

          {/* Tax Calculation Column */}
          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-brand-charcoal">
              <span>Taxable Value (Subtotal):</span>
              <span className="font-semibold">{formatINR(invoice.subtotalPaise, true)}</span>
            </div>

            {invoice.discountPaise > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>Discount:</span>
                <span>- {formatINR(invoice.discountPaise, true)}</span>
              </div>
            )}

            <div className="flex justify-between text-brand-charcoal">
              <span>CGST ({invoice.gstBreakdown.ratePercent / 2}%):</span>
              <span className="font-medium">{formatINR(invoice.gstBreakdown.cgstPaise, true)}</span>
            </div>

            <div className="flex justify-between text-brand-charcoal">
              <span>SGST ({invoice.gstBreakdown.ratePercent / 2}%):</span>
              <span className="font-medium">{formatINR(invoice.gstBreakdown.sgstPaise, true)}</span>
            </div>

            {invoice.gstBreakdown.igstPaise > 0 && (
              <div className="flex justify-between text-brand-charcoal">
                <span>IGST ({invoice.gstBreakdown.ratePercent}%):</span>
                <span className="font-medium">{formatINR(invoice.gstBreakdown.igstPaise, true)}</span>
              </div>
            )}

            <div className="flex justify-between text-base font-bold text-brand-espresso border-t-2 border-brand-gold/40 pt-2 bg-brand-ivory/60 p-2.5 rounded">
              <span>Grand Total:</span>
              <span className="text-brand-gold-dark font-display text-lg">
                {formatINR(invoice.grandTotalPaise, true)}
              </span>
            </div>
          </div>
        </div>

        {/* Terms & Conditions and Signature */}
        <div className="mt-8 pt-6 border-t border-brand-gold/20 grid grid-cols-1 sm:grid-cols-2 gap-6 text-[11px] text-brand-charcoal/80">
          <div>
            <span className="font-bold text-brand-espresso block mb-1">Terms & Conditions:</span>
            <ul className="list-disc list-inside space-y-0.5 text-[10px]">
              {invoice.termsAndConditions?.map((term, i) => (
                <li key={i}>{term}</li>
              ))}
            </ul>
          </div>

          <div className="sm:text-right flex flex-col justify-end">
            <p className="font-bold text-brand-espresso text-xs">
              For EXCELLENCE THE FURNISHING GALLERY
            </p>
            <div className="h-10" />
            <p className="text-[10px] text-brand-charcoal/60 uppercase tracking-wider">
              Authorized Signatory
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

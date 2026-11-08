'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Receipt,
  Download,
  Eye,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  IndianRupee,
  FileText,
  Calendar,
  Phone,
  ArrowRight,
} from 'lucide-react';
import { fetchInvoices } from '@/lib/firebase/firestore';
import { Invoice, InvoiceStatus } from '@/types/invoice';
import { generateInvoicePDF } from '@/lib/pdf/invoice-generator';
import { formatINR, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const STATUS_FILTERS: Array<{ id: string; label: string }> = [
  { id: 'all', label: 'All Invoices' },
  { id: 'sent', label: 'Issued / Sent' },
  { id: 'paid', label: 'Paid & Settled' },
  { id: 'draft', label: 'Draft' },
  { id: 'overdue', label: 'Overdue' },
  { id: 'cancelled', label: 'Cancelled' },
];

export default function AdminInvoicesPage() {
  const [invoices, setInvoices] = React.useState<Invoice[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedStatus, setSelectedStatus] = React.useState('all');
  const [downloadingId, setDownloadingId] = React.useState<string | null>(null);

  const loadInvoices = React.useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchInvoices();
      setInvoices(data);
    } catch (err) {
      console.error('Failed to load invoices:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  const handleDownloadPDF = async (invoice: Invoice) => {
    try {
      setDownloadingId(invoice.id);
      const pdf = generateInvoicePDF(invoice);
      pdf.save(`Invoice_${invoice.invoiceNumber}.pdf`);
    } catch (err) {
      console.error('Failed to download invoice PDF:', err);
    } finally {
      setDownloadingId(null);
    }
  };

  // Filter invoices
  const filteredInvoices = React.useMemo(() => {
    return invoices.filter((inv) => {
      if (selectedStatus !== 'all' && inv.status !== selectedStatus) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesNo = inv.invoiceNumber.toLowerCase().includes(q);
        const matchesOrder = inv.orderNumber.toLowerCase().includes(q);
        const matchesClient = inv.clientDetails.name.toLowerCase().includes(q);
        const matchesPhone = inv.clientDetails.phone.includes(q);
        if (!matchesNo && !matchesOrder && !matchesClient && !matchesPhone) {
          return false;
        }
      }

      return true;
    });
  }, [invoices, selectedStatus, searchQuery]);

  // Derived KPI metrics
  const totalInvoicedCount = invoices.length;
  const totalInvoicedPaise = invoices.reduce((sum, inv) => sum + (inv.grandTotalPaise || 0), 0);
  const paidInvoices = invoices.filter((inv) => inv.status === 'paid');
  const paidTotalPaise = paidInvoices.reduce((sum, inv) => sum + (inv.grandTotalPaise || 0), 0);
  const pendingInvoices = invoices.filter((inv) => inv.status !== 'paid' && inv.status !== 'cancelled');
  const pendingTotalPaise = pendingInvoices.reduce((sum, inv) => sum + (inv.grandTotalPaise || 0), 0);
  const overdueCount = invoices.filter((inv) => inv.status === 'overdue').length;

  const getStatusBadge = (status: InvoiceStatus) => {
    switch (status) {
      case 'paid':
        return (
          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300">
            Paid
          </Badge>
        );
      case 'sent':
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
            Sent / Due
          </Badge>
        );
      case 'draft':
        return (
          <Badge variant="outline" className="text-gray-700 border-gray-300">
            Draft
          </Badge>
        );
      case 'overdue':
        return (
          <Badge className="bg-rose-100 text-rose-800 border-rose-300">
            Overdue
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            Cancelled
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-display text-brand-espresso">
            GST Tax Invoices & Billing
          </h2>
          <p className="text-xs text-brand-charcoal/70">
            Official tax invoices adhering to Central Goods & Services Tax (CGST 9% + SGST 9%) guidelines.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/admin/orders">
            <Button className="bg-brand-gold hover:bg-brand-gold-dark text-brand-espresso font-semibold gap-1.5 shadow-sm text-xs sm:text-sm">
              <FileText className="w-4 h-4" />
              <span>Generate from Orders</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Financial Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="bg-white border-brand-gold/20 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase text-brand-charcoal/70">Total Invoiced</p>
              <h3 className="text-xl sm:text-2xl font-bold font-display text-brand-espresso mt-0.5">
                {formatINR(totalInvoicedPaise, true)}
              </h3>
              <p className="text-[11px] text-brand-charcoal/60 mt-0.5">
                {totalInvoicedCount} invoice{totalInvoicedCount === 1 ? '' : 's'} issued
              </p>
            </div>
            <div className="w-9 h-9 rounded-card bg-brand-gold/15 flex items-center justify-center text-brand-gold-dark">
              <Receipt className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-brand-gold/20 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase text-brand-charcoal/70">Total Collected</p>
              <h3 className="text-xl sm:text-2xl font-bold font-display text-emerald-700 mt-0.5">
                {formatINR(paidTotalPaise, true)}
              </h3>
              <p className="text-[11px] text-emerald-800/80 mt-0.5">
                {paidInvoices.length} settled in full
              </p>
            </div>
            <div className="w-9 h-9 rounded-card bg-emerald-50 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-brand-gold/20 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase text-brand-charcoal/70">Receivables Due</p>
              <h3 className="text-xl sm:text-2xl font-bold font-display text-brand-burgundy mt-0.5">
                {formatINR(pendingTotalPaise, true)}
              </h3>
              <p className="text-[11px] text-brand-charcoal/60 mt-0.5">
                {pendingInvoices.length} awaiting settlement
              </p>
            </div>
            <div className="w-9 h-9 rounded-card bg-rose-50 flex items-center justify-center text-rose-700">
              <Clock className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-brand-gold/20 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase text-brand-charcoal/70">Overdue Invoices</p>
              <h3 className="text-xl sm:text-2xl font-bold font-display text-amber-600 mt-0.5">
                {overdueCount}
              </h3>
              <p className="text-[11px] text-amber-700/80 mt-0.5">Payment overdue &gt;15 days</p>
            </div>
            <div className="w-9 h-9 rounded-card bg-amber-50 flex items-center justify-center text-amber-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-card border border-brand-gold/20 p-4 shadow-xs space-y-4">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
          {STATUS_FILTERS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedStatus(tab.id)}
              className={`px-3 py-1.5 rounded-pill text-xs font-medium whitespace-nowrap transition-colors ${
                selectedStatus === tab.id
                  ? 'bg-brand-espresso text-brand-gold font-semibold shadow-xs'
                  : 'bg-brand-pearl hover:bg-brand-ivory text-brand-charcoal'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1 border-t border-brand-gold/15">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-brand-charcoal/40 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              type="text"
              placeholder="Search invoice #, order ref, client..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-xs h-9 bg-brand-pearl/50 border-brand-gold/30 focus:border-brand-gold font-mono"
            />
          </div>

          <span className="text-xs text-brand-charcoal/60">
            Showing <strong>{filteredInvoices.length}</strong> of {totalInvoicedCount} invoices
          </span>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-card border border-brand-gold/20 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-sm text-brand-charcoal/60">
            <Receipt className="w-8 h-8 text-brand-gold/40 animate-bounce mx-auto mb-2" />
            Loading billing records...
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="p-12 text-center">
            <Receipt className="w-10 h-10 text-brand-gold/40 mx-auto mb-2" />
            <p className="text-sm font-semibold text-brand-espresso">No invoices found</p>
            <p className="text-xs text-brand-charcoal/60 mt-1">
              {searchQuery ? `No results matching "${searchQuery}"` : 'No invoices generated yet.'}
            </p>
            <div className="mt-4 flex justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedStatus('all');
                }}
                className="text-xs border-brand-gold/40 text-brand-gold-dark"
              >
                Reset Filters
              </Button>
              <Link href="/admin/orders">
                <Button size="sm" className="bg-brand-gold text-brand-espresso text-xs font-semibold">
                  Go to Orders to Generate
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-brand-pearl/70 border-b border-brand-gold/15 text-brand-espresso font-semibold">
                <tr>
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Client & Contact</th>
                  <th className="py-3 px-4">Order Reference</th>
                  <th className="py-3 px-4">Issue / Due Date</th>
                  <th className="py-3 px-4 text-right">Grand Total (₹)</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-gold/10">
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-brand-ivory/20 transition-colors">
                    {/* Invoice Number */}
                    <td className="py-3 px-4">
                      <Link
                        href={`/admin/invoices/${inv.id}`}
                        className="font-bold text-brand-espresso text-sm hover:text-brand-gold-dark hover:underline font-mono"
                      >
                        {inv.invoiceNumber}
                      </Link>
                      <span className="text-[10px] text-brand-charcoal/60 block mt-0.5">
                        GSTIN: {inv.businessDetails?.gstin || '27AABCU9603R1ZM'}
                      </span>
                    </td>

                    {/* Client */}
                    <td className="py-3 px-4">
                      <span className="font-bold text-brand-espresso block">
                        {inv.clientDetails.name}
                      </span>
                      <span className="text-[11px] text-brand-charcoal/70 flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3 text-brand-gold" />
                        +91 {inv.clientDetails.phone}
                      </span>
                    </td>

                    {/* Order Reference */}
                    <td className="py-3 px-4 font-mono text-brand-charcoal/80">
                      <Link
                        href={`/admin/orders/${inv.orderId}`}
                        className="hover:text-brand-gold-dark hover:underline"
                      >
                        {inv.orderNumber}
                      </Link>
                    </td>

                    {/* Issue / Due Date */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1 text-brand-espresso font-medium">
                        <Calendar className="w-3 h-3 text-brand-gold" />
                        <span>{formatDate(inv.issueDate)}</span>
                      </div>
                      <span className="text-[10px] text-brand-charcoal/60 block mt-0.5">
                        Due: {formatDate(inv.dueDate)}
                      </span>
                    </td>

                    {/* Grand Total */}
                    <td className="py-3 px-4 text-right font-bold text-brand-gold-dark text-sm">
                      {formatINR(inv.grandTotalPaise, true)}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4 text-center">
                      {getStatusBadge(inv.status)}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownloadPDF(inv)}
                          disabled={downloadingId === inv.id}
                          className="h-8 text-xs border-brand-gold/40 text-brand-gold-dark hover:bg-brand-gold hover:text-white px-2.5 gap-1"
                          title="Download Official Tax Invoice PDF"
                        >
                          <Download className="w-3 h-3" />
                          <span className="hidden sm:inline">
                            {downloadingId === inv.id ? 'PDF...' : 'PDF'}
                          </span>
                        </Button>

                        <Link href={`/admin/invoices/${inv.id}`}>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 text-xs text-brand-espresso hover:bg-brand-ivory px-2"
                            title="View Invoice Detail"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

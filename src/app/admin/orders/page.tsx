'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  ClipboardList,
  PlusCircle,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  Clock,
  Scissors,
  Truck,
  IndianRupee,
  ShoppingBag,
  AlertCircle,
  Phone,
  Calendar,
  CreditCard,
} from 'lucide-react';
import { fetchOrders } from '@/lib/firebase/firestore';
import { Order, OrderStatus, PaymentStatus } from '@/types/order';
import { formatINR, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const STATUS_FILTERS: Array<{ id: string; label: string }> = [
  { id: 'all', label: 'All Statuses' },
  { id: 'draft', label: 'Draft' },
  { id: 'confirmed', label: 'Confirmed' },
  { id: 'in_production', label: 'In Production' },
  { id: 'ready', label: 'Ready' },
  { id: 'delivered', label: 'Delivered' },
  { id: 'cancelled', label: 'Cancelled' },
];

const PAYMENT_FILTERS: Array<{ id: string; label: string }> = [
  { id: 'all', label: 'All Payments' },
  { id: 'pending', label: 'Pending (₹0)' },
  { id: 'partial', label: 'Partial Advance' },
  { id: 'paid', label: 'Fully Paid' },
];

export default function AdminOrdersPage() {
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedStatus, setSelectedStatus] = React.useState('all');
  const [selectedPaymentStatus, setSelectedPaymentStatus] = React.useState('all');

  const loadOrders = React.useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchOrders();
      setOrders(data);
    } catch (err) {
      console.error('Failed to load admin orders:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // Filtered orders
  const filteredOrders = React.useMemo(() => {
    return orders.filter((order) => {
      // Status filter
      if (selectedStatus !== 'all' && order.status !== selectedStatus) {
        return false;
      }

      // Payment status filter
      if (selectedPaymentStatus !== 'all' && order.paymentStatus !== selectedPaymentStatus) {
        return false;
      }

      // Search keyword
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesOrderNo = order.orderNumber.toLowerCase().includes(q);
        const matchesClient = order.clientName.toLowerCase().includes(q);
        const matchesPhone = order.clientPhone.includes(q);
        const matchesInvoice = order.invoiceNumber?.toLowerCase().includes(q);
        const matchesItem = order.items.some((item) =>
          item.productName.toLowerCase().includes(q)
        );
        if (!matchesOrderNo && !matchesClient && !matchesPhone && !matchesInvoice && !matchesItem) {
          return false;
        }
      }

      return true;
    });
  }, [orders, selectedStatus, selectedPaymentStatus, searchQuery]);

  // Derived KPI calculations
  const totalOrdersCount = orders.length;
  const inProductionCount = orders.filter((o) => o.status === 'in_production').length;
  const readyCount = orders.filter((o) => o.status === 'ready').length;
  const deliveredCount = orders.filter((o) => o.status === 'delivered').length;
  const totalRevenuePaise = orders.reduce((sum, o) => sum + (o.grandTotalPaise || 0), 0);
  const outstandingPaise = orders.reduce((sum, o) => sum + (o.balanceAmountPaise || 0), 0);

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'draft':
        return <Badge variant="outline" className="text-gray-700 border-gray-300">Draft</Badge>;
      case 'confirmed':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Confirmed</Badge>;
      case 'in_production':
        return <Badge className="bg-amber-100 text-amber-900 border-amber-300">In Production</Badge>;
      case 'ready':
        return <Badge className="bg-purple-100 text-purple-900 border-purple-200">Ready</Badge>;
      case 'delivered':
        return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300">Delivered</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPaymentBadge = (paymentStatus: PaymentStatus) => {
    switch (paymentStatus) {
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-pill border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            Paid
          </span>
        );
      case 'partial':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-pill border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
            Partial Advance
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-pill border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
            Payment Pending
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-display text-brand-espresso">
            Orders Lifecycle & Tailoring Queue
          </h2>
          <p className="text-xs text-brand-charcoal/70">
            Track orders from quote confirmation through workshop cutting, custom stitching, and on-site delivery.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/admin/orders/new">
            <Button className="bg-brand-gold hover:bg-brand-gold-dark text-brand-espresso font-semibold gap-1.5 shadow-sm text-xs sm:text-sm">
              <PlusCircle className="w-4 h-4" />
              <span>+ Create Manual Order</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="bg-white border-brand-gold/20 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase text-brand-charcoal/70">Total Orders</p>
              <h3 className="text-xl sm:text-2xl font-bold font-display text-brand-espresso mt-0.5">
                {totalOrdersCount}
              </h3>
              <p className="text-[11px] text-brand-charcoal/60 mt-0.5">
                Valued at {formatINR(totalRevenuePaise, true)}
              </p>
            </div>
            <div className="w-9 h-9 rounded-card bg-brand-gold/15 flex items-center justify-center text-brand-gold-dark">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-brand-gold/20 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase text-brand-charcoal/70">In Workshop / Cutting</p>
              <h3 className="text-xl sm:text-2xl font-bold font-display text-amber-600 mt-0.5">
                {inProductionCount}
              </h3>
              <p className="text-[11px] text-amber-700/80 mt-0.5">Under artisan stitching</p>
            </div>
            <div className="w-9 h-9 rounded-card bg-amber-50 flex items-center justify-center text-amber-700">
              <Scissors className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-brand-gold/20 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase text-brand-charcoal/70">Ready for Fitting</p>
              <h3 className="text-xl sm:text-2xl font-bold font-display text-purple-700 mt-0.5">
                {readyCount}
              </h3>
              <p className="text-[11px] text-purple-800/80 mt-0.5">Passed QC inspection</p>
            </div>
            <div className="w-9 h-9 rounded-card bg-purple-50 flex items-center justify-center text-purple-700">
              <Truck className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-brand-gold/20 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase text-brand-charcoal/70">Outstanding Balance</p>
              <h3 className="text-xl sm:text-2xl font-bold font-display text-brand-burgundy mt-0.5">
                {formatINR(outstandingPaise, true)}
              </h3>
              <p className="text-[11px] text-brand-charcoal/60 mt-0.5">To collect on delivery</p>
            </div>
            <div className="w-9 h-9 rounded-card bg-rose-50 flex items-center justify-center text-rose-700">
              <CreditCard className="w-4 h-4" />
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

        {/* Search & Payment Dropdown */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1 border-t border-brand-gold/15">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-brand-charcoal/40 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              type="text"
              placeholder="Search by order #, client, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-xs h-9 bg-brand-pearl/50 border-brand-gold/30 focus:border-brand-gold"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <select
              aria-label="Filter by Payment Status"
              value={selectedPaymentStatus}
              onChange={(e) => setSelectedPaymentStatus(e.target.value)}
              className="text-xs h-9 px-3 rounded-card border border-brand-gold/30 bg-white text-brand-espresso focus:outline-none focus:border-brand-gold"
            >
              {PAYMENT_FILTERS.map((pf) => (
                <option key={pf.id} value={pf.id}>
                  {pf.label}
                </option>
              ))}
            </select>

            <span className="text-xs text-brand-charcoal/60">
              Showing <strong>{filteredOrders.length}</strong> of {totalOrdersCount}
            </span>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-card border border-brand-gold/20 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-sm text-brand-charcoal/60">
            <ClipboardList className="w-8 h-8 text-brand-gold/40 animate-bounce mx-auto mb-2" />
            Loading orders from workshop database...
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-12 text-center">
            <ClipboardList className="w-10 h-10 text-brand-gold/40 mx-auto mb-2" />
            <p className="text-sm font-semibold text-brand-espresso">No matching orders found</p>
            <p className="text-xs text-brand-charcoal/60 mt-1">
              {searchQuery
                ? `No orders matching "${searchQuery}"`
                : 'No orders recorded in this status tier yet.'}
            </p>
            <div className="mt-4 flex justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedStatus('all');
                  setSelectedPaymentStatus('all');
                }}
                className="text-xs border-brand-gold/40 text-brand-gold-dark"
              >
                Reset Filters
              </Button>
              <Link href="/admin/orders/new">
                <Button size="sm" className="bg-brand-gold text-brand-espresso text-xs font-semibold">
                  + Create Order
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-brand-pearl/70 border-b border-brand-gold/15 text-brand-espresso font-semibold">
                <tr>
                  <th className="py-3 px-4">Order # & Date</th>
                  <th className="py-3 px-4">Client & Contact</th>
                  <th className="py-3 px-4">Items / Category</th>
                  <th className="py-3 px-4 text-right">Grand Total (₹)</th>
                  <th className="py-3 px-4 text-center">Payment Status</th>
                  <th className="py-3 px-4 text-center">Workshop Stage</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-gold/10">
                {filteredOrders.map((order) => {
                  const itemsCount = order.items.reduce((sum, item) => sum + item.quantity, 0);

                  return (
                    <tr key={order.id} className="hover:bg-brand-ivory/20 transition-colors">
                      {/* Order Number & Date */}
                      <td className="py-3 px-4">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="font-bold text-brand-espresso text-sm hover:text-brand-gold-dark hover:underline block"
                        >
                          {order.orderNumber}
                        </Link>
                        <span className="text-[11px] text-brand-charcoal/60 flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3 text-brand-gold" />
                          {formatDate(order.createdAt)}
                        </span>
                        {order.invoiceNumber && (
                          <span className="text-[10px] font-mono text-brand-gold-dark bg-brand-ivory px-1.5 py-0.2 rounded border border-brand-gold/20 inline-block mt-1">
                            Inv: {order.invoiceNumber}
                          </span>
                        )}
                      </td>

                      {/* Client */}
                      <td className="py-3 px-4">
                        <Link
                          href={`/admin/clients/${order.clientId}`}
                          className="font-bold text-brand-espresso hover:underline block"
                        >
                          {order.clientName}
                        </Link>
                        <span className="text-[11px] text-brand-charcoal/70 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-brand-gold" />
                          +91 {order.clientPhone}
                        </span>
                      </td>

                      {/* Items */}
                      <td className="py-3 px-4">
                        <span className="font-semibold text-brand-espresso block">
                          {order.items.length} item{order.items.length === 1 ? '' : 's'} ({itemsCount} units)
                        </span>
                        <span className="text-[11px] text-brand-charcoal/60 truncate max-w-[200px] block">
                          {order.items.map((i) => i.productName).join(', ')}
                        </span>
                      </td>

                      {/* Grand Total */}
                      <td className="py-3 px-4 text-right">
                        <div className="font-bold text-brand-gold-dark text-sm">
                          {formatINR(order.grandTotalPaise, true)}
                        </div>
                        {order.balanceAmountPaise > 0 ? (
                          <span className="text-[11px] text-brand-burgundy font-medium block">
                            Bal: {formatINR(order.balanceAmountPaise, true)}
                          </span>
                        ) : (
                          <span className="text-[11px] text-emerald-700 font-medium block">
                            Fully Settled
                          </span>
                        )}
                      </td>

                      {/* Payment Status */}
                      <td className="py-3 px-4 text-center">
                        {getPaymentBadge(order.paymentStatus)}
                      </td>

                      {/* Production Status */}
                      <td className="py-3 px-4 text-center">
                        {getStatusBadge(order.status)}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <Link href={`/admin/orders/${order.id}`}>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs border-brand-gold/40 text-brand-espresso hover:bg-brand-gold hover:text-brand-espresso px-2.5 gap-1.5"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View Details</span>
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

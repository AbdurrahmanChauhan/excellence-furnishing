'use client';

import * as React from 'react';
import Link from 'next/link';
import { ShoppingBag, ArrowRight, Package, Clock, Eye, Download, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { fetchOrders } from '@/lib/firebase/firestore';
import { Order, OrderStatus } from '@/types/order';
import { formatINR, formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function CustomerOrdersPage() {
  const { user, profile } = useAuthStore();
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filterTab, setFilterTab] = React.useState<'all' | 'in_production' | 'delivered'>('all');

  const customerUid = user?.uid;
  const customerEmail = profile?.email || user?.email;

  React.useEffect(() => {
    async function loadOrders() {
      setLoading(true);
      try {
        const fetched = await fetchOrders({
          userId: customerUid || customerEmail || 'customer-priya',
        });
        setOrders(fetched);
      } catch (err) {
        console.warn('Failed to fetch orders:', err);
      } finally {
        setLoading(false);
      }
    }

    loadOrders();
  }, [customerUid, customerEmail]);

  const filteredOrders = orders.filter((order) => {
    if (filterTab === 'in_production') {
      return (
        order.status === 'confirmed' ||
        order.status === 'in_production' ||
        order.status === 'ready'
      );
    }
    if (filterTab === 'delivered') {
      return order.status === 'delivered';
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-brand-espresso">
            My Furnishing Orders
          </h1>
          <p className="text-xs sm:text-sm text-brand-charcoal/70 mt-1">
            Track bespoke workshop tailoring, installation dates, and payment balances
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-card bg-brand-ivory border border-brand-gold/20 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setFilterTab('all')}
            className={`px-3 py-1.5 rounded-soft text-xs font-semibold transition-all ${
              filterTab === 'all'
                ? 'bg-brand-gold text-white shadow-xs'
                : 'text-brand-espresso hover:bg-white/60'
            }`}
          >
            All Orders ({orders.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('in_production')}
            className={`px-3 py-1.5 rounded-soft text-xs font-semibold transition-all ${
              filterTab === 'in_production'
                ? 'bg-brand-gold text-white shadow-xs'
                : 'text-brand-espresso hover:bg-white/60'
            }`}
          >
            In Tailoring ({orders.filter((o) => o.status !== 'delivered' && o.status !== 'cancelled').length})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('delivered')}
            className={`px-3 py-1.5 rounded-soft text-xs font-semibold transition-all ${
              filterTab === 'delivered'
                ? 'bg-brand-gold text-white shadow-xs'
                : 'text-brand-espresso hover:bg-white/60'
            }`}
          >
            Delivered ({orders.filter((o) => o.status === 'delivered').length})
          </button>
        </div>
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <Card key={i} className="animate-pulse p-6 bg-white border-brand-gold/20">
              <div className="h-6 w-1/3 bg-gray-200 rounded mb-4" />
              <div className="h-4 w-1/2 bg-gray-100 rounded mb-2" />
              <div className="h-10 w-full bg-gray-50 rounded mt-4" />
            </Card>
          ))}
        </div>
      ) : filteredOrders.length === 0 ? (
        <Card className="border-dashed border-brand-gold/30 bg-white/60 py-12 text-center">
          <CardContent className="space-y-3">
            <div className="w-12 h-12 rounded-full bg-brand-ivory text-brand-gold mx-auto flex items-center justify-center">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <h3 className="font-display text-lg font-bold text-brand-espresso">
              No orders found
            </h3>
            <p className="text-xs text-brand-charcoal/70 max-w-sm mx-auto">
              {filterTab === 'in_production'
                ? 'You do not have any orders actively in production at this time.'
                : 'Browse our catalog to commission bespoke curtains or sofa fabrics.'}
            </p>
            <Link href="/products" className="inline-block mt-2">
              <Button size="sm" variant="gold">
                Browse Collections
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const isDelivered = order.status === 'delivered';
            return (
              <Card
                key={order.id}
                className="border-brand-gold/20 hover:border-brand-gold/60 transition-all bg-white shadow-card hover:shadow-card-hover overflow-hidden"
              >
                <div className="p-5 sm:p-6 space-y-4">
                  {/* Top Bar: Order ID, Date, Status */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-4 border-b border-brand-gold/15">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-display text-lg font-bold text-brand-espresso">
                          {order.orderNumber}
                        </span>
                        <Badge variant={order.status as any}>
                          {order.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-xs text-brand-charcoal/60 mt-0.5">
                        Placed on {formatDate(order.createdAt)} · Client: {order.clientName}
                      </p>
                    </div>

                    <div className="text-left sm:text-right">
                      <p className="text-xs text-brand-charcoal/60 uppercase tracking-wider font-semibold">
                        Grand Total
                      </p>
                      <p className="font-display text-xl font-bold text-brand-gold-dark">
                        {formatINR(order.grandTotalPaise, true)}
                      </p>
                      <p className="text-[11px] text-brand-charcoal/60">
                        {order.paymentStatus === 'paid' ? (
                          <span className="text-emerald-700 font-medium">✓ Fully Paid</span>
                        ) : (
                          <span className="text-amber-800 font-medium">
                            Balance: {formatINR(order.balanceAmountPaise, true)}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Items Summary Table/Grid */}
                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-brand-espresso uppercase tracking-wider block">
                      Custom Soft Furnishings
                    </span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {order.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-3 p-3 rounded-card bg-brand-pearl/40 border border-brand-gold/15"
                        >
                          {item.swatchImageUrl && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={item.swatchImageUrl}
                              alt={item.productName}
                              className="w-12 h-12 rounded-soft object-cover border border-brand-gold/30 shrink-0"
                            />
                          )}
                          <div className="overflow-hidden flex-1">
                            <p className="text-sm font-semibold text-brand-espresso truncate">
                              {item.productName}
                            </p>
                            <p className="text-xs text-brand-charcoal/70">
                              {item.quantity} {item.unit} · {formatINR(item.lineTotalPaise, true)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Delivery Location & Actions */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-brand-gold/15 text-xs text-brand-charcoal/80">
                    <div>
                      <span className="font-semibold text-brand-espresso">Site: </span>
                      {order.deliveryAddress.street}, {order.deliveryAddress.city} {order.deliveryAddress.pincode}
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <Link href={`/dashboard/orders/${order.id}`}>
                        <Button size="sm" variant="gold" className="gap-1.5 text-xs">
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Details & Milestone</span>
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

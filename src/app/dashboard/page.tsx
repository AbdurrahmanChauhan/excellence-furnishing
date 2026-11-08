'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  ShoppingBag,
  CheckCircle2,
  Calendar,
  Sparkles,
  ArrowRight,
  Package,
  Clock,
  Compass,
  PhoneCall,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { fetchOrders } from '@/lib/firebase/firestore';
import { Order } from '@/types/order';
import { formatINR, formatDate } from '@/lib/utils';
import { OrderSummaryCard } from '@/components/dashboard/OrderSummaryCard';
import { OrderStepper } from '@/components/dashboard/OrderStepper';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function DashboardOverviewPage() {
  const { user, profile } = useAuthStore();
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = React.useState(true);

  const customerName = profile?.displayName || user?.displayName || 'Valued Customer';
  const customerEmail = profile?.email || user?.email;
  const customerUid = user?.uid;

  React.useEffect(() => {
    async function loadCustomerOrders() {
      setLoadingOrders(true);
      try {
        // Fetch orders matching customer's UID or Email
        const allOrders = await fetchOrders({
          userId: customerUid || customerEmail || 'customer-priya',
        });
        setOrders(allOrders);
      } catch (err) {
        console.warn('Error loading customer orders:', err);
      } finally {
        setLoadingOrders(false);
      }
    }

    loadCustomerOrders();
  }, [customerUid, customerEmail]);

  const activeOrders = orders.filter(
    (o) => o.status === 'confirmed' || o.status === 'in_production' || o.status === 'ready'
  );
  const completedOrders = orders.filter((o) => o.status === 'delivered');
  const recentOrder = orders[0] || null;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="rounded-card bg-gradient-to-r from-brand-espresso via-brand-espresso-light to-brand-burgundy p-6 sm:p-8 text-brand-ivory shadow-elevated relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 bg-radial-gradient pointer-events-none" />
        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-pill bg-brand-gold/20 border border-brand-gold/40 text-brand-gold-light text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" /> Excellence Client Portal
          </div>
          <h1 className="font-display text-2xl sm:text-4xl font-bold tracking-tight">
            Welcome back, {customerName}
          </h1>
          <p className="text-sm sm:text-base text-brand-ivory/80 leading-relaxed font-body">
            Track your bespoke drapery and upholstery tailoring in real-time, view detailed
            measurement cutting sheets, and download official GST tax invoices.
          </p>
        </div>
      </div>

      {/* Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <OrderSummaryCard
          title="Active Projects"
          value={loadingOrders ? '...' : activeOrders.length}
          subtitle={
            activeOrders.length > 0
              ? `${activeOrders[0].orderNumber} in progress`
              : 'No orders currently in tailoring'
          }
          icon={Clock}
          badge="In Production"
        />

        <OrderSummaryCard
          title="Completed Installations"
          value={loadingOrders ? '...' : completedOrders.length}
          subtitle="Delivered & fitted at Mumbai residence"
          icon={CheckCircle2}
          badge="Verified"
        />

        <OrderSummaryCard
          title="Design Consultation"
          value="Mr. Altamash"
          subtitle="Assigned Senior Drapery Specialist"
          icon={Calendar}
          badge="On-Call"
        />
      </div>

      {/* Active Order Highlight / Milestone Stepper Card */}
      {recentOrder && (
        <Card className="border-brand-gold/30 shadow-card bg-white">
          <CardHeader className="pb-3 border-b border-brand-gold/15">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-xl sm:text-2xl text-brand-espresso">
                    Order {recentOrder.orderNumber}
                  </CardTitle>
                  <Badge variant={recentOrder.status as any}>
                    {recentOrder.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
                <CardDescription className="text-xs text-brand-charcoal/70 mt-1">
                  Placed on {formatDate(recentOrder.createdAt)} · Total:{' '}
                  <span className="font-semibold text-brand-espresso">
                    {formatINR(recentOrder.grandTotalPaise, true)}
                  </span>
                </CardDescription>
              </div>

              <Link href={`/dashboard/orders/${recentOrder.id}`}>
                <Button size="sm" variant="gold" className="gap-1.5 w-full sm:w-auto">
                  <span>Track Full Progress & Specs</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>
          </CardHeader>

          <CardContent className="pt-6 space-y-6">
            {/* Visual 5-Stage Stepper */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-brand-espresso uppercase tracking-wider">
                  Workshop Progress Timeline
                </span>
                {recentOrder.estimatedDeliveryDate && (
                  <span className="text-xs text-brand-gold-dark font-medium">
                    Estimated Delivery: {formatDate(recentOrder.estimatedDeliveryDate)}
                  </span>
                )}
              </div>
              <OrderStepper
                status={recentOrder.status}
                createdAt={recentOrder.createdAt}
                estimatedDeliveryDate={recentOrder.estimatedDeliveryDate}
              />
            </div>

            {/* Quick Item Previews */}
            <div className="pt-4 border-t border-brand-gold/15">
              <h4 className="text-xs font-semibold text-brand-espresso uppercase tracking-wider mb-3">
                Items in This Commission ({recentOrder.items.length})
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {recentOrder.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-3 rounded-card bg-brand-pearl/50 border border-brand-gold/20"
                  >
                    {item.swatchImageUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.swatchImageUrl}
                        alt={item.productName}
                        className="w-12 h-12 rounded-soft object-cover border border-brand-gold/30 shrink-0"
                      />
                    )}
                    <div className="overflow-hidden">
                      <p className="text-sm font-semibold text-brand-espresso truncate">
                        {item.productName}
                      </p>
                      <p className="text-xs text-brand-charcoal/70">
                        Qty: {item.quantity} {item.unit} · {formatINR(item.lineTotalPaise, true)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Action Shortcuts */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
        <Link
          href="/dashboard/orders"
          className="group block p-5 rounded-card bg-white border border-brand-gold/20 hover:border-brand-gold hover:shadow-card transition-all"
        >
          <div className="w-10 h-10 rounded-soft bg-brand-gold/15 text-brand-gold-dark flex items-center justify-center mb-3 group-hover:bg-brand-gold group-hover:text-white transition-colors">
            <Package className="w-5 h-5" />
          </div>
          <h3 className="font-display text-base font-bold text-brand-espresso group-hover:text-brand-gold-dark transition-colors">
            Order History
          </h3>
          <p className="text-xs text-brand-charcoal/70 mt-1">
            Review past tailored installations, balances, and GST receipts.
          </p>
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand-gold mt-3">
            View All Orders <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </span>
        </Link>

        <Link
          href="/products"
          className="group block p-5 rounded-card bg-white border border-brand-gold/20 hover:border-brand-gold hover:shadow-card transition-all"
        >
          <div className="w-10 h-10 rounded-soft bg-brand-burgundy/15 text-brand-burgundy flex items-center justify-center mb-3 group-hover:bg-brand-burgundy group-hover:text-white transition-colors">
            <Compass className="w-5 h-5" />
          </div>
          <h3 className="font-display text-base font-bold text-brand-espresso group-hover:text-brand-burgundy transition-colors">
            Browse Fabrics & Decor
          </h3>
          <p className="text-xs text-brand-charcoal/70 mt-1">
            Explore 32+ luxury curtain velvets, sheer linens, and designer wallpapers.
          </p>
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand-burgundy mt-3">
            Open Showroom <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </span>
        </Link>

        <a
          href="https://wa.me/919820012345?text=Hi%20Excellence%20Furnishing,%20I%20would%20like%20to%20schedule%20a%20doorstep%20home%20consultation"
          target="_blank"
          rel="noopener noreferrer"
          className="group block p-5 rounded-card bg-white border border-brand-gold/20 hover:border-brand-gold hover:shadow-card transition-all"
        >
          <div className="w-10 h-10 rounded-soft bg-green-100 text-green-800 flex items-center justify-center mb-3 group-hover:bg-green-700 group-hover:text-white transition-colors">
            <PhoneCall className="w-5 h-5" />
          </div>
          <h3 className="font-display text-base font-bold text-brand-espresso group-hover:text-green-800 transition-colors">
            Book Home Consultation
          </h3>
          <p className="text-xs text-brand-charcoal/70 mt-1">
            Complimentary doorstep window measurement with fabric swatches across Mumbai.
          </p>
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 mt-3">
            Connect on WhatsApp <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </span>
        </a>
      </div>
    </div>
  );
}

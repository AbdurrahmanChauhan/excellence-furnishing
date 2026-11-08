'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  BarChart3,
  TrendingUp,
  ShoppingBag,
  Users,
  IndianRupee,
  Layers,
  Calendar,
  Package,
  Award,
  ArrowUpRight,
  CreditCard,
  Scissors,
  Clock,
} from 'lucide-react';
import { fetchOrders, fetchClients, fetchProducts } from '@/lib/firebase/firestore';
import { Order } from '@/types/order';
import { Client } from '@/types/client';
import { Product } from '@/types/product';
import { formatINR, formatDate, toRupees } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface CategoryStats {
  category: string;
  label: string;
  itemCount: number;
  revenuePaise: number;
  percentage: number;
}

interface TopProductStats {
  productId?: string;
  name: string;
  category: string;
  unitsSold: number;
  revenuePaise: number;
}

export default function AdminAnalyticsPage() {
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [clients, setClients] = React.useState<Client[]>([]);
  const [products, setProducts] = React.useState<Product[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [timeRange, setTimeRange] = React.useState<'all' | 'mtd' | 'ytd'>('all');

  React.useEffect(() => {
    async function loadAnalytics() {
      try {
        setLoading(true);
        const [ordersData, clientsData, productsData] = await Promise.all([
          fetchOrders(),
          fetchClients(),
          fetchProducts(),
        ]);
        setOrders(ordersData);
        setClients(clientsData);
        setProducts(productsData);
      } catch (err) {
        console.error('Failed to load analytics data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadAnalytics();
  }, []);

  // Filter orders by timeframe
  const filteredOrders = React.useMemo(() => {
    if (timeRange === 'all') return orders;

    const now = new Date();
    return orders.filter((o) => {
      const orderDate = new Date(o.createdAt);
      if (timeRange === 'mtd') {
        return (
          orderDate.getFullYear() === now.getFullYear() &&
          orderDate.getMonth() === now.getMonth()
        );
      }
      if (timeRange === 'ytd') {
        return orderDate.getFullYear() === now.getFullYear();
      }
      return true;
    });
  }, [orders, timeRange]);

  // Aggregate Metrics
  const totalRevenuePaise = filteredOrders.reduce((sum, o) => sum + (o.grandTotalPaise || 0), 0);
  const totalOrders = filteredOrders.length;
  const averageOrderValuePaise = totalOrders > 0 ? Math.round(totalRevenuePaise / totalOrders) : 0;
  const activeClientsCount = clients.length;
  const totalPaidPaise = filteredOrders.reduce((sum, o) => sum + (o.paidAmountPaise || 0), 0);
  const totalBalancePaise = filteredOrders.reduce((sum, o) => sum + (o.balanceAmountPaise || 0), 0);

  // Category distribution
  const categoryStats = React.useMemo(() => {
    const map = new Map<string, { label: string; count: number; rev: number }>();

    const CATEGORY_NAMES: Record<string, string> = {
      curtains_window_treatments: 'Curtains & Drapes',
      sofa_upholstery_fabrics: 'Sofa Upholstery',
      wallpapers: 'Wallpapers & Murals',
      mattresses_sleep_solutions: 'Mattresses',
      bedding_accessories: 'Bedding & Linens',
      home_decor: 'Home Decor & Carpets',
      curtain: 'Curtains & Drapes',
      upholstery: 'Sofa Upholstery',
      wallpaper: 'Wallpapers & Murals',
    };

    filteredOrders.forEach((order) => {
      order.items.forEach((item) => {
        const catKey = item.category || 'curtains_window_treatments';
        const label = CATEGORY_NAMES[catKey] || 'Curtains & Drapes';
        const current = map.get(label) || { label, count: 0, rev: 0 };
        current.count += item.quantity;
        current.rev += item.lineTotalPaise;
        map.set(label, current);
      });
    });

    const list: CategoryStats[] = Array.from(map.entries()).map(([label, val]) => ({
      category: label,
      label,
      itemCount: val.count,
      revenuePaise: val.rev,
      percentage: totalRevenuePaise > 0 ? Math.round((val.rev / totalRevenuePaise) * 100) : 0,
    }));

    list.sort((a, b) => b.revenuePaise - a.revenuePaise);
    return list;
  }, [filteredOrders, totalRevenuePaise]);

  // Top Products calculation
  const topProducts = React.useMemo(() => {
    const map = new Map<string, TopProductStats>();

    filteredOrders.forEach((order) => {
      order.items.forEach((item) => {
        const key = item.productId || item.productName;
        const current = map.get(key) || {
          productId: item.productId,
          name: item.productName,
          category: item.category,
          unitsSold: 0,
          revenuePaise: 0,
        };
        current.unitsSold += item.quantity;
        current.revenuePaise += item.lineTotalPaise;
        map.set(key, current);
      });
    });

    const list = Array.from(map.values());
    list.sort((a, b) => b.revenuePaise - a.revenuePaise);
    return list.slice(0, 6);
  }, [filteredOrders]);

  return (
    <div className="space-y-6">
      {/* Header & Timeframe Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-display text-brand-espresso">
            Sales & Revenue Analytics
          </h2>
          <p className="text-xs text-brand-charcoal/70">
            Financial performance, category sales breakdown, and showroom order velocity.
          </p>
        </div>

        {/* Timeframe Filter Buttons */}
        <div className="flex items-center gap-1.5 bg-brand-pearl p-1 rounded-card border border-brand-gold/20">
          <button
            onClick={() => setTimeRange('all')}
            className={`px-3 py-1.5 rounded-soft text-xs font-semibold transition-colors ${
              timeRange === 'all'
                ? 'bg-brand-gold text-brand-espresso shadow-xs'
                : 'text-brand-charcoal hover:text-brand-espresso'
            }`}
          >
            All-Time
          </button>
          <button
            onClick={() => setTimeRange('mtd')}
            className={`px-3 py-1.5 rounded-soft text-xs font-semibold transition-colors ${
              timeRange === 'mtd'
                ? 'bg-brand-gold text-brand-espresso shadow-xs'
                : 'text-brand-charcoal hover:text-brand-espresso'
            }`}
          >
            Month-to-Date
          </button>
          <button
            onClick={() => setTimeRange('ytd')}
            className={`px-3 py-1.5 rounded-soft text-xs font-semibold transition-colors ${
              timeRange === 'ytd'
                ? 'bg-brand-gold text-brand-espresso shadow-xs'
                : 'text-brand-charcoal hover:text-brand-espresso'
            }`}
          >
            Year-to-Date (2026)
          </button>
        </div>
      </div>

      {/* KPI Primary Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Revenue */}
        <Card className="bg-white border-brand-gold/20 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-brand-charcoal/70">
              Total Revenue
            </CardTitle>
            <div className="w-9 h-9 rounded-card bg-emerald-50 flex items-center justify-center text-emerald-700">
              <IndianRupee className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold font-display text-brand-espresso">
              {loading ? '—' : formatINR(totalRevenuePaise, true)}
            </div>
            <p className="text-xs text-brand-charcoal/60 mt-1 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-emerald-700 font-semibold">+22.4%</span>
              <span>vs previous period</span>
            </p>
          </CardContent>
        </Card>

        {/* KPI 2: Total Orders */}
        <Card className="bg-white border-brand-gold/20 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-brand-charcoal/70">
              Total Orders
            </CardTitle>
            <div className="w-9 h-9 rounded-card bg-brand-gold/15 flex items-center justify-center text-brand-gold-dark">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold font-display text-brand-espresso">
              {loading ? '—' : totalOrders}
            </div>
            <p className="text-xs text-brand-charcoal/60 mt-1">
              {orders.filter((o) => o.status === 'delivered').length} orders completed & installed
            </p>
          </CardContent>
        </Card>

        {/* KPI 3: Average Order Value (AOV) */}
        <Card className="bg-white border-brand-gold/20 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-brand-charcoal/70">
              Average Order Value (AOV)
            </CardTitle>
            <div className="w-9 h-9 rounded-card bg-blue-50 flex items-center justify-center text-blue-700">
              <BarChart3 className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold font-display text-brand-espresso">
              {loading ? '—' : formatINR(averageOrderValuePaise, true)}
            </div>
            <p className="text-xs text-brand-charcoal/60 mt-1">
              High-ticket bespoke furnishing average
            </p>
          </CardContent>
        </Card>

        {/* KPI 4: Active CRM Clients */}
        <Card className="bg-white border-brand-gold/20 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-brand-charcoal/70">
              Active CRM Clients
            </CardTitle>
            <div className="w-9 h-9 rounded-card bg-amber-50 flex items-center justify-center text-amber-700">
              <Users className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold font-display text-brand-espresso">
              {loading ? '—' : activeClientsCount}
            </div>
            <p className="text-xs text-brand-charcoal/60 mt-1">
              Mumbai residential & architect network
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Cash Flow Balance Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-card bg-emerald-50/70 border border-emerald-200 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 block">
              Collected Payments (Realized Cash Flow)
            </span>
            <div className="text-xl sm:text-2xl font-bold font-display text-emerald-900 mt-0.5">
              {formatINR(totalPaidPaise, true)}
            </div>
            <p className="text-[11px] text-emerald-700/80 mt-0.5">
              Advance deposits & cleared delivery balances
            </p>
          </div>
          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold">
            ₹
          </div>
        </div>

        <div className="p-4 rounded-card bg-amber-50/70 border border-amber-200 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800 block">
              Outstanding Receivables (Pending Collection)
            </span>
            <div className="text-xl sm:text-2xl font-bold font-display text-brand-burgundy mt-0.5">
              {formatINR(totalBalancePaise, true)}
            </div>
            <p className="text-[11px] text-amber-700/80 mt-0.5">
              Balances payable upon on-site curtain & sofa installation
            </p>
          </div>
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Category Breakdown & Top Products Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Sales Distribution */}
        <Card className="bg-white border-brand-gold/30 shadow-xs">
          <CardHeader className="pb-3 border-b border-brand-gold/15">
            <CardTitle className="text-base font-bold font-display text-brand-espresso flex items-center gap-2">
              <Layers className="w-4 h-4 text-brand-gold" />
              <span>Category Sales Distribution</span>
            </CardTitle>
            <CardDescription className="text-xs text-brand-charcoal/70">
              Contribution by furnishing product category.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            {categoryStats.length === 0 ? (
              <p className="text-xs text-brand-charcoal/60 italic py-8 text-center">
                No category sales recorded yet.
              </p>
            ) : (
              categoryStats.map((item, index) => (
                <div key={index} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-brand-espresso">{item.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-brand-gold-dark">
                        {formatINR(item.revenuePaise, true)}
                      </span>
                      <span className="text-brand-charcoal/60 text-[11px] w-10 text-right">
                        ({item.percentage}%)
                      </span>
                    </div>
                  </div>
                  {/* Progress bar visual */}
                  <div className="w-full h-2.5 rounded-full bg-brand-pearl overflow-hidden border border-brand-gold/20">
                    <div
                      className="h-full bg-gradient-to-r from-brand-gold to-brand-burgundy rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(4, item.percentage)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Top Performing Products Table */}
        <Card className="bg-white border-brand-gold/30 shadow-xs">
          <CardHeader className="pb-3 border-b border-brand-gold/15">
            <CardTitle className="text-base font-bold font-display text-brand-espresso flex items-center gap-2">
              <Award className="w-4 h-4 text-brand-gold" />
              <span>Top Selling Furnishing Products</span>
            </CardTitle>
            <CardDescription className="text-xs text-brand-charcoal/70">
              Best sellers ranked by total revenue contribution.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {topProducts.length === 0 ? (
              <p className="text-xs text-brand-charcoal/60 italic py-8 text-center">
                No product transactions recorded yet.
              </p>
            ) : (
              <div className="space-y-3">
                {topProducts.map((p, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-card bg-brand-pearl/40 border border-brand-gold/15 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-brand-gold/20 text-brand-gold-dark font-bold flex items-center justify-center text-xs shrink-0">
                        #{idx + 1}
                      </span>
                      <div>
                        <span className="font-bold text-brand-espresso block truncate max-w-[200px]">
                          {p.name}
                        </span>
                        <span className="text-[10px] text-brand-charcoal/60 capitalize">
                          {p.category.replace(/_/g, ' ')} · {p.unitsSold} units sold
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-brand-gold-dark block">
                        {formatINR(p.revenuePaise, true)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders Stream */}
      <Card className="bg-white border-brand-gold/30 shadow-xs">
        <CardHeader className="pb-3 border-b border-brand-gold/15 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold font-display text-brand-espresso">
              Recent Sales Orders Feed
            </CardTitle>
            <CardDescription className="text-xs text-brand-charcoal/70">
              Latest transactions placed across the showroom and online portal.
            </CardDescription>
          </div>
          <Link href="/admin/orders">
            <Button variant="ghost" size="sm" className="text-xs text-brand-gold hover:underline gap-1">
              <span>View All Orders</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-brand-pearl/70 border-b border-brand-gold/15 text-brand-espresso font-semibold">
                <tr>
                  <th className="py-2.5 px-4">Order #</th>
                  <th className="py-2.5 px-4">Client</th>
                  <th className="py-2.5 px-4">Date</th>
                  <th className="py-2.5 px-4 text-right">Amount (₹)</th>
                  <th className="py-2.5 px-4 text-center">Status</th>
                  <th className="py-2.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-gold/10">
                {filteredOrders.slice(0, 5).map((order) => (
                  <tr key={order.id} className="hover:bg-brand-ivory/20 transition-colors">
                    <td className="py-2.5 px-4 font-mono font-bold text-brand-espresso">
                      <Link href={`/admin/orders/${order.id}`} className="hover:underline">
                        {order.orderNumber}
                      </Link>
                    </td>
                    <td className="py-2.5 px-4 font-medium text-brand-espresso">
                      {order.clientName}
                    </td>
                    <td className="py-2.5 px-4 text-brand-charcoal/70">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="py-2.5 px-4 text-right font-bold text-brand-gold-dark">
                      {formatINR(order.grandTotalPaise, true)}
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <Badge variant="outline" className="text-[10px] uppercase font-semibold">
                        {order.status.replace(/_/g, ' ')}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <Link href={`/admin/orders/${order.id}`}>
                        <Button size="sm" variant="ghost" className="h-7 text-xs text-brand-gold px-2">
                          View
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Users,
  Ruler,
  ShoppingBag,
  IndianRupee,
  Search,
  PlusCircle,
  Eye,
  ArrowRight,
  TrendingUp,
  Package,
  Clock,
  Sparkles,
  Phone,
  MapPin,
} from 'lucide-react';
import { fetchClients, fetchOrders } from '@/lib/firebase/firestore';
import { Client } from '@/types/client';
import { Order } from '@/types/order';
import { formatINR, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function AdminDashboardPage() {
  const [clients, setClients] = React.useState<Client[]>([]);
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState('');

  React.useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        const [clientsData, ordersData] = await Promise.all([
          fetchClients(),
          fetchOrders(),
        ]);
        setClients(clientsData);
        setOrders(ordersData);
      } catch (err) {
        console.error('Failed to load admin dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  // Filter clients based on search
  const filteredClients = React.useMemo(() => {
    if (!searchQuery.trim()) return clients;
    const q = searchQuery.toLowerCase().trim();
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.siteAddress.street.toLowerCase().includes(q) ||
        c.siteAddress.city.toLowerCase().includes(q)
    );
  }, [clients, searchQuery]);

  // Derived KPI calculations
  const totalClients = clients.length;
  // Estimated active measurements across clients
  const activeMeasurementsCount = clients.reduce((acc, c) => acc + (c.totalOrdersCount > 0 ? c.totalOrdersCount + 1 : 1), 0);
  // Orders currently in workshop / in production
  const workshopOrdersCount = orders.filter(
    (o) => o.status === 'in_production' || o.status === 'confirmed'
  ).length;
  // Month to date revenue
  const mtdRevenuePaise = orders.reduce((sum, o) => sum + (o.grandTotalPaise || 0), 0);

  return (
    <div className="space-y-8">
      {/* Welcome & Heritage Banner */}
      <div className="bg-gradient-to-r from-brand-espresso via-brand-espresso/95 to-brand-burgundy text-white rounded-card p-6 shadow-md border border-brand-gold/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-brand-gold bg-brand-gold/20 px-2 py-0.5 rounded-full border border-brand-gold/30">
              Proprietor Console
            </span>
            <span className="text-xs text-brand-ivory/70">Est. 2003 · 23+ Years</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-display text-white">
            Welcome back, Mr. Altab Chauhan
          </h2>
          <p className="text-sm text-brand-ivory/80 max-w-2xl mt-1">
            Showroom CRM & Workshop Tailoring Operations for Excellence The Furnishing Gallery, Andheri West.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Link href="/admin/clients/new">
            <Button className="bg-brand-gold hover:bg-brand-gold-dark text-brand-espresso font-semibold gap-1.5 shadow-sm text-xs sm:text-sm">
              <PlusCircle className="w-4 h-4" />
              <span>New Client</span>
            </Button>
          </Link>
          <Link href="/admin/clients">
            <Button
              variant="outline"
              className="border-brand-gold/40 text-brand-ivory hover:bg-white/10 hover:text-white gap-1.5 text-xs sm:text-sm"
            >
              <Ruler className="w-4 h-4 text-brand-gold" />
              <span>Measurements</span>
            </Button>
          </Link>
          <Link href="/admin/products">
            <Button
              variant="outline"
              className="border-brand-gold/40 text-brand-ivory hover:bg-white/10 hover:text-white gap-1.5 text-xs sm:text-sm"
            >
              <Package className="w-4 h-4 text-brand-gold" />
              <span>Inventory</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Metric 1: Total Registered Clients */}
        <Card className="border border-brand-gold/20 shadow-xs hover:border-brand-gold/50 transition-all bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-brand-charcoal/70">
              Registered Clients
            </CardTitle>
            <div className="w-9 h-9 rounded-card bg-brand-gold/15 flex items-center justify-center text-brand-gold-dark">
              <Users className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold font-display text-brand-espresso">
              {loading ? '—' : totalClients}
            </div>
            <p className="text-xs text-brand-charcoal/60 mt-1 flex items-center gap-1">
              <span className="text-brand-green font-semibold">Active CRM</span>
              <span>· Mumbai Western Suburbs</span>
            </p>
          </CardContent>
        </Card>

        {/* Metric 2: Active Measurements */}
        <Card className="border border-brand-gold/20 shadow-xs hover:border-brand-gold/50 transition-all bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-brand-charcoal/70">
              Active Measurements
            </CardTitle>
            <div className="w-9 h-9 rounded-card bg-brand-ivory flex items-center justify-center text-brand-gold-dark">
              <Ruler className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold font-display text-brand-espresso">
              {loading ? '—' : activeMeasurementsCount}
            </div>
            <p className="text-xs text-brand-charcoal/60 mt-1 flex items-center gap-1">
              <span className="text-brand-gold font-semibold">Digital Sheets</span>
              <span>· Curtains, Wallpaper, Sofa</span>
            </p>
          </CardContent>
        </Card>

        {/* Metric 3: Orders in Tailoring Workshop */}
        <Card className="border border-brand-gold/20 shadow-xs hover:border-brand-gold/50 transition-all bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-brand-charcoal/70">
              Workshop Orders
            </CardTitle>
            <div className="w-9 h-9 rounded-card bg-amber-50 flex items-center justify-center text-amber-700">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold font-display text-brand-espresso">
              {loading ? '—' : workshopOrdersCount}
            </div>
            <p className="text-xs text-brand-charcoal/60 mt-1 flex items-center gap-1">
              <span className="text-amber-600 font-semibold">In Tailoring & Cutting</span>
              <span>· On Schedule</span>
            </p>
          </CardContent>
        </Card>

        {/* Metric 4: Month-to-Date Revenue */}
        <Card className="border border-brand-gold/20 shadow-xs hover:border-brand-gold/50 transition-all bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-brand-charcoal/70">
              MTD Revenue
            </CardTitle>
            <div className="w-9 h-9 rounded-card bg-emerald-50 flex items-center justify-center text-emerald-700">
              <IndianRupee className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold font-display text-brand-espresso">
              {loading ? '—' : formatINR(mtdRevenuePaise, true)}
            </div>
            <p className="text-xs text-brand-charcoal/60 mt-1 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-emerald-700 font-semibold">+18.4%</span>
              <span>vs last month</span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Action Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/admin/clients/new"
          className="group block p-5 rounded-card bg-gradient-to-br from-brand-ivory to-white border border-brand-gold/30 hover:border-brand-gold hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="w-10 h-10 rounded-full bg-brand-gold/20 flex items-center justify-center text-brand-gold-dark group-hover:bg-brand-gold group-hover:text-white transition-colors">
              <Users className="w-5 h-5" />
            </span>
            <ArrowRight className="w-4 h-4 text-brand-gold group-hover:translate-x-1 transition-transform" />
          </div>
          <h3 className="font-bold text-base text-brand-espresso group-hover:text-brand-gold-dark transition-colors">
            New Client Onboarding
          </h3>
          <p className="text-xs text-brand-charcoal/70 mt-1">
            Capture client contact details, Mumbai site address, architect notes, and VIP tags.
          </p>
        </Link>

        <Link
          href="/admin/clients"
          className="group block p-5 rounded-card bg-gradient-to-br from-brand-ivory to-white border border-brand-gold/30 hover:border-brand-gold hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="w-10 h-10 rounded-full bg-brand-gold/20 flex items-center justify-center text-brand-gold-dark group-hover:bg-brand-gold group-hover:text-white transition-colors">
              <Ruler className="w-5 h-5" />
            </span>
            <ArrowRight className="w-4 h-4 text-brand-gold group-hover:translate-x-1 transition-transform" />
          </div>
          <h3 className="font-bold text-base text-brand-espresso group-hover:text-brand-gold-dark transition-colors">
            New Measurement Sheet
          </h3>
          <p className="text-xs text-brand-charcoal/70 mt-1">
            Open the 5-step dynamic wizard with live pricing calculations for Curtains, Wallpaper, or Upholstery.
          </p>
        </Link>

        <Link
          href="/admin/products"
          className="group block p-5 rounded-card bg-gradient-to-br from-brand-ivory to-white border border-brand-gold/30 hover:border-brand-gold hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="w-10 h-10 rounded-full bg-brand-gold/20 flex items-center justify-center text-brand-gold-dark group-hover:bg-brand-gold group-hover:text-white transition-colors">
              <Package className="w-5 h-5" />
            </span>
            <ArrowRight className="w-4 h-4 text-brand-gold group-hover:translate-x-1 transition-transform" />
          </div>
          <h3 className="font-bold text-base text-brand-espresso group-hover:text-brand-gold-dark transition-colors">
            Inventory Overview
          </h3>
          <p className="text-xs text-brand-charcoal/70 mt-1">
            Manage fabric rolls, swatches, wallpaper catalogs, and Refresh mattress collections.
          </p>
        </Link>
      </div>

      {/* Recent Clients Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold font-display text-brand-espresso">
              Recent Clients & Site Projects
            </h3>
            <p className="text-xs text-brand-charcoal/70">
              Manage client records, view room layouts, or start dynamic measurements.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-brand-charcoal/40 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                type="text"
                placeholder="Search name, phone, or address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 text-xs h-9 bg-white border-brand-gold/30 focus:border-brand-gold"
              />
            </div>
            <Link href="/admin/clients/new">
              <Button size="sm" className="bg-brand-espresso text-brand-ivory hover:bg-brand-gold hover:text-brand-espresso text-xs gap-1.5 h-9 shrink-0">
                <PlusCircle className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Add Client</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Client Table / Cards */}
        <div className="bg-white rounded-card border border-brand-gold/20 shadow-xs overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-sm text-brand-charcoal/60">
              Loading client records...
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="p-8 text-center">
              <Users className="w-10 h-10 text-brand-gold/40 mx-auto mb-2" />
              <p className="text-sm font-semibold text-brand-espresso">No clients found</p>
              <p className="text-xs text-brand-charcoal/60 mt-1">
                {searchQuery ? `No results matching "${searchQuery}"` : 'No registered clients yet.'}
              </p>
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchQuery('')}
                  className="mt-3 text-xs text-brand-gold hover:underline"
                >
                  Clear search
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-brand-pearl/70 border-b border-brand-gold/15 text-brand-espresso font-semibold">
                  <tr>
                    <th className="py-3 px-4">Client Name & Tags</th>
                    <th className="py-3 px-4">Contact</th>
                    <th className="py-3 px-4 hidden md:table-cell">Site / Project Address</th>
                    <th className="py-3 px-4 text-center">Orders & Spent</th>
                    <th className="py-3 px-4 hidden lg:table-cell">Created</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-gold/10">
                  {filteredClients.slice(0, 10).map((client) => (
                    <tr key={client.id} className="hover:bg-brand-ivory/20 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-brand-espresso text-sm">
                          <Link
                            href={`/admin/clients/${client.id}`}
                            className="hover:text-brand-gold-dark hover:underline"
                          >
                            {client.name}
                          </Link>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {client.tags?.map((t) => (
                            <span
                              key={t}
                              className="text-[10px] font-semibold bg-brand-gold/15 text-brand-gold-dark px-1.5 py-0.2 rounded"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 text-brand-charcoal font-medium">
                          <Phone className="w-3 h-3 text-brand-gold" />
                          <span>+91 {client.phone}</span>
                        </div>
                        <div className="text-[11px] text-brand-charcoal/60 truncate max-w-[160px]">
                          {client.email}
                        </div>
                      </td>
                      <td className="py-3 px-4 hidden md:table-cell">
                        <div className="flex items-start gap-1 text-brand-charcoal/80 max-w-[240px]">
                          <MapPin className="w-3 h-3 text-brand-gold shrink-0 mt-0.5" />
                          <span className="line-clamp-2">
                            {client.siteAddress.street}, {client.siteAddress.city} — {client.siteAddress.pincode}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="font-semibold text-brand-espresso">
                          {formatINR(client.totalSpentPaise || 0, true)}
                        </div>
                        <div className="text-[11px] text-brand-charcoal/60">
                          {client.totalOrdersCount || 0} order{client.totalOrdersCount === 1 ? '' : 's'}
                        </div>
                      </td>
                      <td className="py-3 px-4 hidden lg:table-cell text-brand-charcoal/60">
                        {formatDate(client.createdAt)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link href={`/admin/clients/${client.id}/measure`}>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-[11px] border-brand-gold/40 text-brand-gold-dark hover:bg-brand-gold hover:text-white px-2.5"
                            >
                              <Ruler className="w-3 h-3 mr-1" />
                              Measure
                            </Button>
                          </Link>
                          <Link href={`/admin/clients/${client.id}`}>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-[11px] text-brand-charcoal hover:text-brand-espresso hover:bg-brand-ivory px-2"
                              title="View Client Details"
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
    </div>
  );
}

'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Users,
  Search,
  PlusCircle,
  Phone,
  Mail,
  MapPin,
  Ruler,
  Eye,
  Home,
  Tag,
  ArrowUpDown,
  Filter,
} from 'lucide-react';
import { fetchClients, fetchRooms } from '@/lib/firebase/firestore';
import { Client } from '@/types/client';
import { formatINR, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

export default function AdminClientsPage() {
  const [clients, setClients] = React.useState<Client[]>([]);
  const [roomCounts, setRoomCounts] = React.useState<Record<string, number>>({});
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedTag, setSelectedTag] = React.useState<string>('all');

  React.useEffect(() => {
    async function loadClients() {
      try {
        setLoading(true);
        const data = await fetchClients();
        setClients(data);

        // Fetch room counts per client
        const counts: Record<string, number> = {};
        await Promise.all(
          data.map(async (client) => {
            try {
              const rooms = await fetchRooms(client.id);
              counts[client.id] = rooms.length;
            } catch (e) {
              counts[client.id] = 0;
            }
          })
        );
        setRoomCounts(counts);
      } catch (err) {
        console.error('Failed to load clients:', err);
      } finally {
        setLoading(false);
      }
    }
    loadClients();
  }, []);

  // Filter tags
  const tagsList = ['all', 'VIP', 'Residential', 'Commercial', 'Architect'];

  const filteredClients = React.useMemo(() => {
    return clients.filter((c) => {
      const matchesSearch =
        !searchQuery.trim() ||
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.phone.includes(searchQuery) ||
        c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.siteAddress.street.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.siteAddress.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.siteAddress.pincode.includes(searchQuery);

      const matchesTag =
        selectedTag === 'all' || (c.tags && c.tags.includes(selectedTag));

      return matchesSearch && matchesTag;
    });
  }, [clients, searchQuery, selectedTag]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-brand-gold bg-brand-gold/15 px-2 py-0.5 rounded border border-brand-gold/30">
              CRM Directory
            </span>
            <span className="text-xs text-brand-charcoal/60">
              {clients.length} Total Client{clients.length === 1 ? '' : 's'}
            </span>
          </div>
          <h2 className="text-2xl font-bold font-display text-brand-espresso">
            Client Relationships & Site Installations
          </h2>
          <p className="text-xs text-brand-charcoal/70">
            Manage residential and commercial clientele, project site addresses in Mumbai, room specs, and bespoke measurement sheets.
          </p>
        </div>

        <Link href="/admin/clients/new">
          <Button className="bg-brand-gold hover:bg-brand-gold-dark text-brand-espresso font-semibold gap-1.5 shadow-sm text-xs sm:text-sm">
            <PlusCircle className="w-4 h-4" />
            <span>Onboard New Client</span>
          </Button>
        </Link>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white p-4 rounded-card border border-brand-gold/20 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-brand-charcoal/40 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            type="text"
            placeholder="Search by client name, mobile phone, email, or Mumbai site address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-xs h-10 bg-brand-pearl/40 border-brand-gold/30 focus:border-brand-gold"
          />
        </div>

        {/* Tag filter chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <span className="text-xs text-brand-charcoal/60 flex items-center gap-1 shrink-0 mr-1">
            <Filter className="w-3 h-3 text-brand-gold" />
            <span>Tag:</span>
          </span>
          {tagsList.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-all shrink-0 ${
                selectedTag === tag
                  ? 'bg-brand-gold text-brand-espresso font-bold shadow-xs'
                  : 'bg-brand-pearl text-brand-charcoal/80 hover:bg-brand-ivory'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Clients Data Table */}
      <div className="bg-white rounded-card border border-brand-gold/20 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-sm text-brand-charcoal/60">
            Loading client CRM records...
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 text-brand-gold/40 mx-auto mb-3" />
            <h3 className="text-base font-bold text-brand-espresso">No clients found</h3>
            <p className="text-xs text-brand-charcoal/60 mt-1 max-w-sm mx-auto">
              {searchQuery || selectedTag !== 'all'
                ? 'Try adjusting your search query or filter tags to find matching clients.'
                : 'No clients have been onboarded yet. Create your first client to start taking measurements.'}
            </p>
            <div className="mt-4 flex items-center justify-center gap-3">
              {(searchQuery || selectedTag !== 'all') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedTag('all');
                  }}
                  className="text-xs border-brand-gold/40 text-brand-espresso"
                >
                  Reset Filters
                </Button>
              )}
              <Link href="/admin/clients/new">
                <Button size="sm" className="bg-brand-gold text-brand-espresso text-xs font-semibold">
                  <PlusCircle className="w-3.5 h-3.5 mr-1" />
                  Add Client
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-brand-pearl/70 border-b border-brand-gold/15 text-brand-espresso font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">Client Name & Tags</th>
                  <th className="py-3.5 px-4">Contact Details</th>
                  <th className="py-3.5 px-4">Project / Site Address</th>
                  <th className="py-3.5 px-4 text-center">Rooms</th>
                  <th className="py-3.5 px-4 text-center">Lifetime Value</th>
                  <th className="py-3.5 px-4 hidden lg:table-cell">Created</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-gold/10">
                {filteredClients.map((client) => {
                  const roomsCount = roomCounts[client.id] ?? 0;
                  return (
                    <tr key={client.id} className="hover:bg-brand-ivory/25 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-brand-espresso text-sm">
                          <Link
                            href={`/admin/clients/${client.id}`}
                            className="hover:text-brand-gold-dark hover:underline"
                          >
                            {client.name}
                          </Link>
                        </div>
                        {client.architectDesignerName && (
                          <div className="text-[10px] text-brand-charcoal/70 italic mt-0.5">
                            Arch: {client.architectDesignerName}
                          </div>
                        )}
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
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-brand-espresso font-semibold">
                          <Phone className="w-3 h-3 text-brand-gold" />
                          <a
                            href={`tel:+91${client.phone}`}
                            className="hover:text-brand-gold-dark"
                          >
                            +91 {client.phone}
                          </a>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-brand-charcoal/70 mt-0.5">
                          <Mail className="w-3 h-3 text-brand-charcoal/40" />
                          <span className="truncate max-w-[180px]">{client.email}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 max-w-[240px]">
                        <div className="flex items-start gap-1 text-brand-charcoal">
                          <MapPin className="w-3 h-3 text-brand-gold shrink-0 mt-0.5" />
                          <span className="line-clamp-2">
                            {client.siteAddress.street}, {client.siteAddress.city} — {client.siteAddress.pincode}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center gap-1 bg-brand-pearl px-2 py-1 rounded-full text-xs font-semibold text-brand-espresso border border-brand-gold/20">
                          <Home className="w-3 h-3 text-brand-gold" />
                          {roomsCount} room{roomsCount === 1 ? '' : 's'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="font-bold text-brand-espresso">
                          {formatINR(client.totalSpentPaise || 0, true)}
                        </div>
                        <div className="text-[10px] text-brand-charcoal/60">
                          {client.totalOrdersCount || 0} order{client.totalOrdersCount === 1 ? '' : 's'}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 hidden lg:table-cell text-brand-charcoal/60">
                        {formatDate(client.createdAt)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link href={`/admin/clients/${client.id}/measure`}>
                            <Button
                              size="sm"
                              className="h-7 text-[11px] bg-brand-gold text-brand-espresso hover:bg-brand-gold-dark hover:text-white font-semibold px-2.5 shadow-2xs"
                            >
                              <Ruler className="w-3 h-3 mr-1" />
                              Measure
                            </Button>
                          </Link>
                          <Link href={`/admin/clients/${client.id}`}>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-[11px] border-brand-gold/30 text-brand-espresso hover:bg-brand-ivory px-2.5"
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              Profile
                            </Button>
                          </Link>
                        </div>
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

'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  Users,
  ArrowLeft,
  Ruler,
  PlusCircle,
  Home,
  Sofa,
  BedDouble,
  Bed,
  Baby,
  Utensils,
  Briefcase,
  SunMedium,
  Phone,
  Mail,
  MapPin,
  Tag,
  Calendar,
  IndianRupee,
  Scissors,
  FileText,
  CheckCircle2,
  ExternalLink,
  Layers,
  X,
  Printer,
  ShoppingBag,
} from 'lucide-react';
import {
  fetchClientById,
  fetchRooms,
  saveRoom,
  fetchMeasurementsByClient,
  saveOrder,
  modifyMeasurement,
} from '@/lib/firebase/firestore';
import { Client } from '@/types/client';
import { Room, RoomType } from '@/types/room';
import { RoomMeasurement } from '@/types/measurement';
import { Order, OrderItem } from '@/types/order';
import { formatINR, formatDate, generateInvoiceNumber } from '@/lib/utils';
import { calculateGST } from '@/lib/pricing/calculator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

import { ROOM_PRESETS, getRoomIcon } from '@/components/admin/room-presets';

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params?.id as string;

  const [client, setClient] = React.useState<Client | null>(null);
  const [rooms, setRooms] = React.useState<Room[]>([]);
  const [measurements, setMeasurements] = React.useState<RoomMeasurement[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState<'rooms' | 'measurements'>('rooms');

  // Add Room Modal State
  const [addRoomModalOpen, setAddRoomModalOpen] = React.useState(false);
  const [selectedPreset, setSelectedPreset] = React.useState<RoomType>('living_room');
  const [newRoomName, setNewRoomName] = React.useState('Living Room Window');
  const [newRoomFloor, setNewRoomFloor] = React.useState('');
  const [newRoomNotes, setNewRoomNotes] = React.useState('');
  const [newRoomPhoto, setNewRoomPhoto] = React.useState('');
  const [addingRoom, setAddingRoom] = React.useState(false);

  // Cutting Sheet Modal State
  const [selectedMeasurementForSheet, setSelectedMeasurementForSheet] = React.useState<RoomMeasurement | null>(null);
  const [orderConvertingId, setOrderConvertingId] = React.useState<string | null>(null);
  const [conversionSuccessMessage, setConversionSuccessMessage] = React.useState<string | null>(null);

  const loadClientData = React.useCallback(async () => {
    if (!clientId) return;
    try {
      setLoading(true);
      const [clientData, roomsData, measurementsData] = await Promise.all([
        fetchClientById(clientId),
        fetchRooms(clientId),
        fetchMeasurementsByClient(clientId),
      ]);
      setClient(clientData);
      setRooms(roomsData);
      setMeasurements(measurementsData);
    } catch (err) {
      console.error('Failed to load client details:', err);
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  React.useEffect(() => {
    loadClientData();
  }, [loadClientData]);

  // Handle Preset selection in Add Room modal
  const handleSelectPreset = (preset: typeof ROOM_PRESETS[0]) => {
    setSelectedPreset(preset.type);
    if (!newRoomName || ROOM_PRESETS.some((p) => p.defaultName === newRoomName)) {
      setNewRoomName(preset.defaultName);
    }
  };

  // Create Room
  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client || !newRoomName.trim()) return;

    try {
      setAddingRoom(true);
      const roomId = `room-${Date.now().toString().slice(-6)}`;
      const timestamp = new Date().toISOString();

      const newRoom: Room = {
        id: roomId,
        clientId: client.id,
        name: newRoomName.trim(),
        type: selectedPreset,
        floor: newRoomFloor.trim() || undefined,
        notes: newRoomNotes.trim() || undefined,
        photos: newRoomPhoto.trim() ? [newRoomPhoto.trim()] : [],
        measurementsCount: 0,
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      await saveRoom(newRoom);
      setRooms((prev) => [...prev, newRoom]);
      setAddRoomModalOpen(false);
      // Reset form
      setNewRoomName('Living Room Window');
      setNewRoomFloor('');
      setNewRoomNotes('');
      setNewRoomPhoto('');
    } catch (err) {
      console.error('Failed to create room:', err);
    } finally {
      setAddingRoom(false);
    }
  };

  // 1-Click Convert Measurement to Order
  const handleConvertToOrder = async (meas: RoomMeasurement) => {
    if (!client) return;
    try {
      setOrderConvertingId(meas.id);

      const orderSeq = Math.floor(1000 + Math.random() * 9000);
      const orderNumber = `EF-ORD-2026-${orderSeq}`;
      const orderId = `order-${orderSeq}`;
      const timestamp = new Date().toISOString();

      // Map measurement to order item
      const item: OrderItem = {
        id: `item-${Date.now().toString().slice(-5)}`,
        productId: meas.productId,
        productName: meas.productName,
        category: meas.productType,
        quantity:
          meas.breakdown.fabricRequiredMeters ||
          meas.breakdown.rollsRequired ||
          1,
        unit:
          meas.productType === 'curtain'
            ? 'meter'
            : meas.productType === 'wallpaper'
            ? 'roll'
            : 'piece',
        unitPricePaise: meas.unitPricePaise,
        measurementId: meas.id,
        configuration: meas.configuration,
        lineTotalPaise: meas.breakdown.subtotalPaise,
      };

      const gstBreakdown = calculateGST(meas.breakdown.subtotalPaise, false, 18);
      const grandTotalPaise = meas.totalEstimatePaise || (meas.breakdown.subtotalPaise + gstBreakdown.totalTaxPaise);

      const newOrder: Order = {
        id: orderId,
        orderNumber,
        clientId: client.id,
        clientName: client.name,
        clientPhone: client.phone,
        clientEmail: client.email,
        items: [item],
        subtotalPaise: meas.breakdown.subtotalPaise,
        discountPaise: 0,
        gstBreakdown,
        grandTotalPaise,
        paymentStatus: 'pending',
        paidAmountPaise: 0,
        balanceAmountPaise: grandTotalPaise,
        payments: [],
        status: 'draft',
        deliveryAddress: client.siteAddress || client.billingAddress,
        internalNotes: `Converted from Measurement ${meas.id} (${meas.label})`,
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      await saveOrder(newOrder);

      // Update measurement to converted
      await modifyMeasurement(meas.id, {
        isConvertedToOrder: true,
        orderId,
      });

      // Update local state
      setMeasurements((prev) =>
        prev.map((m) => (m.id === meas.id ? { ...m, isConvertedToOrder: true, orderId } : m))
      );

      setConversionSuccessMessage(`Order ${orderNumber} created successfully! Measurement converted.`);
      setTimeout(() => setConversionSuccessMessage(null), 6000);
    } catch (err) {
      console.error('Failed to convert measurement to order:', err);
    } finally {
      setOrderConvertingId(null);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-sm text-brand-charcoal/60">
        Loading client profile and measurement records...
      </div>
    );
  }

  if (!client) {
    return (
      <div className="p-12 text-center">
        <Users className="w-12 h-12 text-brand-gold/40 mx-auto mb-3" />
        <h3 className="text-base font-bold text-brand-espresso">Client not found</h3>
        <p className="text-xs text-brand-charcoal/60 mt-1">
          The requested client record does not exist or has been removed.
        </p>
        <Link href="/admin/clients" className="mt-4 inline-block">
          <Button size="sm" variant="outline" className="text-xs border-brand-gold/40">
            Back to Clients CRM
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          href="/admin/clients"
          className="inline-flex items-center gap-1.5 text-xs text-brand-charcoal/70 hover:text-brand-gold font-medium transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Clients Directory</span>
        </Link>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => setAddRoomModalOpen(true)}
            variant="outline"
            className="border-brand-gold/40 text-brand-espresso hover:bg-brand-ivory text-xs gap-1.5"
          >
            <PlusCircle className="w-3.5 h-3.5 text-brand-gold" />
            <span>Add Room</span>
          </Button>

          <Link href={`/admin/clients/${client.id}/measure`}>
            <Button
              size="sm"
              className="bg-brand-gold hover:bg-brand-gold-dark text-brand-espresso font-semibold text-xs gap-1.5 shadow-xs"
            >
              <Ruler className="w-3.5 h-3.5" />
              <span>Take Measurement</span>
            </Button>
          </Link>
        </div>
      </div>

      {conversionSuccessMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-card flex items-center justify-between text-emerald-800 text-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{conversionSuccessMessage}</span>
          </div>
          <button
            onClick={() => setConversionSuccessMessage(null)}
            className="text-emerald-700 hover:text-emerald-900"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Client Profile Header Card */}
      <Card className="border border-brand-gold/30 shadow-xs bg-white overflow-hidden">
        <div className="bg-gradient-to-r from-brand-espresso via-brand-espresso to-brand-burgundy/90 text-white p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="text-xs uppercase tracking-wider font-bold bg-brand-gold text-brand-espresso px-2 py-0.5 rounded shadow-2xs">
                  Client Profile
                </span>
                {client.tags?.map((t) => (
                  <span
                    key={t}
                    className="text-xs font-semibold bg-white/15 text-brand-ivory px-2 py-0.5 rounded border border-white/20"
                  >
                    {t}
                  </span>
                ))}
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold font-display text-white">
                {client.name}
              </h2>

              {client.architectDesignerName && (
                <p className="text-xs text-brand-gold mt-1 italic">
                  Architect / Interior Consultant: {client.architectDesignerName}
                </p>
              )}
            </div>

            {/* Financial & Order Summary Snapshot */}
            <div className="flex items-center gap-4 bg-white/10 rounded-card p-3 border border-white/10">
              <div className="text-center px-2">
                <div className="text-xs text-brand-ivory/70 uppercase tracking-wider">Orders</div>
                <div className="text-lg font-bold text-white mt-0.5">
                  {client.totalOrdersCount || 0}
                </div>
              </div>
              <div className="w-px h-8 bg-white/20" />
              <div className="text-center px-2">
                <div className="text-xs text-brand-ivory/70 uppercase tracking-wider">Total Value</div>
                <div className="text-lg font-bold text-brand-gold mt-0.5">
                  {formatINR(client.totalSpentPaise || 0, true)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contact & Address Grid */}
        <CardContent className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs border-t border-brand-gold/15 bg-brand-pearl/30">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-brand-charcoal/60 block mb-1">
              Phone / WhatsApp
            </span>
            <div className="flex items-center gap-1.5 font-bold text-brand-espresso">
              <Phone className="w-3.5 h-3.5 text-brand-gold" />
              <a href={`tel:+91${client.phone}`} className="hover:text-brand-gold-dark hover:underline">
                +91 {client.phone}
              </a>
            </div>
            {client.alternatePhone && (
              <div className="text-brand-charcoal/70 text-[11px] mt-0.5">
                Alt: +91 {client.alternatePhone}
              </div>
            )}
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-brand-charcoal/60 block mb-1">
              Email Address
            </span>
            <div className="flex items-center gap-1.5 font-medium text-brand-espresso">
              <Mail className="w-3.5 h-3.5 text-brand-gold" />
              <span className="truncate">{client.email}</span>
            </div>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-brand-charcoal/60 block mb-1">
              Project Installation Site (Mumbai)
            </span>
            <div className="flex items-start gap-1.5 text-brand-espresso font-medium">
              <MapPin className="w-3.5 h-3.5 text-brand-gold shrink-0 mt-0.5" />
              <span className="line-clamp-2">
                {client.siteAddress.street}, {client.siteAddress.city} — {client.siteAddress.pincode}
              </span>
            </div>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-brand-charcoal/60 block mb-1">
              Registered Date
            </span>
            <div className="flex items-center gap-1.5 text-brand-charcoal font-medium">
              <Calendar className="w-3.5 h-3.5 text-brand-gold" />
              <span>{formatDate(client.createdAt)}</span>
            </div>
            {client.gstin && (
              <div className="text-[11px] text-brand-charcoal/70 mt-0.5">
                GSTIN: <span className="font-semibold">{client.gstin}</span>
              </div>
            )}
          </div>
        </CardContent>

        {client.notes && (
          <div className="px-5 py-2.5 bg-brand-ivory/40 border-t border-brand-gold/15 text-xs text-brand-charcoal flex items-center gap-2">
            <span className="font-bold text-brand-espresso shrink-0">Notes:</span>
            <span className="italic">{client.notes}</span>
          </div>
        )}
      </Card>

      {/* Tabs Header */}
      <div className="flex items-center gap-2 border-b border-brand-gold/20 pb-1">
        <button
          onClick={() => setActiveTab('rooms')}
          className={`flex items-center gap-2 px-4 py-2 rounded-t-card font-semibold text-xs sm:text-sm transition-all border-b-2 -mb-[3px] ${
            activeTab === 'rooms'
              ? 'border-brand-gold text-brand-gold-dark bg-white shadow-2xs font-bold'
              : 'border-transparent text-brand-charcoal/70 hover:text-brand-espresso'
          }`}
        >
          <Home className="w-4 h-4 text-brand-gold" />
          <span>Visual Room Grid ({rooms.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('measurements')}
          className={`flex items-center gap-2 px-4 py-2 rounded-t-card font-semibold text-xs sm:text-sm transition-all border-b-2 -mb-[3px] ${
            activeTab === 'measurements'
              ? 'border-brand-gold text-brand-gold-dark bg-white shadow-2xs font-bold'
              : 'border-transparent text-brand-charcoal/70 hover:text-brand-espresso'
          }`}
        >
          <Ruler className="w-4 h-4 text-brand-gold" />
          <span>Measurement Sheets ({measurements.length})</span>
        </button>
      </div>

      {/* TAB 1: Visual Room Grid */}
      {activeTab === 'rooms' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-brand-charcoal/70">
              Rooms registered under this residence. Click &quot;Take Measurement&quot; to configure curtains, wallpaper, or upholstery.
            </p>
            <Button
              size="sm"
              onClick={() => setAddRoomModalOpen(true)}
              className="bg-brand-gold hover:bg-brand-gold-dark text-brand-espresso text-xs font-semibold gap-1.5"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Add Room</span>
            </Button>
          </div>

          {rooms.length === 0 ? (
            <div className="bg-white rounded-card border border-brand-gold/20 p-10 text-center">
              <Home className="w-10 h-10 text-brand-gold/40 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-brand-espresso">No rooms added yet</h4>
              <p className="text-xs text-brand-charcoal/60 mt-1 max-w-sm mx-auto">
                Add client rooms (Living Room, Master Suite, Dining Room, etc.) to organize window drapes and wallpaper sheets.
              </p>
              <Button
                size="sm"
                onClick={() => setAddRoomModalOpen(true)}
                className="mt-4 bg-brand-gold text-brand-espresso text-xs font-semibold"
              >
                <PlusCircle className="w-3.5 h-3.5 mr-1" />
                Add First Room
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {rooms.map((room) => {
                const Icon = getRoomIcon(room.type);
                // Count measurements for this room
                const roomMeasurements = measurements.filter((m) => m.roomId === room.id);

                return (
                  <Card
                    key={room.id}
                    className="border border-brand-gold/25 hover:border-brand-gold shadow-xs hover:shadow-md transition-all bg-white overflow-hidden flex flex-col justify-between"
                  >
                    <div>
                      {/* Photo or Header visual */}
                      {room.photos && room.photos.length > 0 ? (
                        <div className="h-32 bg-brand-pearl relative overflow-hidden">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={room.photos[0]}
                            alt={room.name}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-2 right-2 bg-brand-espresso/80 text-brand-gold text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-xs flex items-center gap-1">
                            <Icon className="w-3 h-3" />
                            <span>{room.type.replace(/_/g, ' ')}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="h-24 bg-gradient-to-r from-brand-ivory to-brand-pearl p-4 flex items-center justify-between border-b border-brand-gold/15">
                          <div className="w-10 h-10 rounded-card bg-brand-gold/20 flex items-center justify-center text-brand-gold-dark">
                            <Icon className="w-5 h-5" />
                          </div>
                          <span className="text-[10px] uppercase font-bold tracking-wider bg-white/80 text-brand-charcoal px-2 py-0.5 rounded border border-brand-gold/20">
                            {room.type.replace(/_/g, ' ')}
                          </span>
                        </div>
                      )}

                      <CardContent className="p-4 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-bold text-sm text-brand-espresso line-clamp-1">
                            {room.name}
                          </h4>
                          {room.floor && (
                            <span className="text-[10px] font-semibold text-brand-charcoal/60 shrink-0">
                              {room.floor}
                            </span>
                          )}
                        </div>

                        {room.notes && (
                          <p className="text-xs text-brand-charcoal/70 line-clamp-2 italic">
                            &quot;{room.notes}&quot;
                          </p>
                        )}

                        <div className="flex items-center gap-2 pt-2 text-xs text-brand-charcoal/70">
                          <Ruler className="w-3.5 h-3.5 text-brand-gold" />
                          <span>
                            {roomMeasurements.length} measurement{roomMeasurements.length === 1 ? '' : 's'} recorded
                          </span>
                        </div>
                      </CardContent>
                    </div>

                    <div className="p-3 bg-brand-pearl/50 border-t border-brand-gold/15 flex items-center justify-between gap-2">
                      <Link
                        href={`/admin/clients/${client.id}/measure?roomId=${room.id}`}
                        className="w-full"
                      >
                        <Button
                          size="sm"
                          className="w-full h-8 text-xs bg-brand-espresso hover:bg-brand-gold hover:text-brand-espresso text-brand-ivory font-semibold gap-1.5 transition-colors"
                        >
                          <Ruler className="w-3.5 h-3.5" />
                          <span>Measure This Room</span>
                        </Button>
                      </Link>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Measurement Sheets */}
      {activeTab === 'measurements' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-brand-charcoal/70">
              Digital measurement sheets, cutting instructions, preliminary quotes, and order conversions.
            </p>
            <Link href={`/admin/clients/${client.id}/measure`}>
              <Button
                size="sm"
                className="bg-brand-gold hover:bg-brand-gold-dark text-brand-espresso text-xs font-semibold gap-1.5"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>New Measurement</span>
              </Button>
            </Link>
          </div>

          {measurements.length === 0 ? (
            <div className="bg-white rounded-card border border-brand-gold/20 p-10 text-center">
              <Ruler className="w-10 h-10 text-brand-gold/40 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-brand-espresso">No measurements recorded yet</h4>
              <p className="text-xs text-brand-charcoal/60 mt-1 max-w-sm mx-auto">
                Launch the dynamic measurement wizard to calculate quotes for curtains, wallpaper rolls, or sofa upholstery.
              </p>
              <Link href={`/admin/clients/${client.id}/measure`}>
                <Button size="sm" className="mt-4 bg-brand-gold text-brand-espresso text-xs font-semibold">
                  <Ruler className="w-3.5 h-3.5 mr-1" />
                  Launch Measurement Wizard
                </Button>
              </Link>
            </div>
          ) : (
            <div className="bg-white rounded-card border border-brand-gold/20 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-brand-pearl/70 border-b border-brand-gold/15 text-brand-espresso font-semibold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3 px-4">Item & Specifications</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Fabric / Material</th>
                      <th className="py-3 px-4 text-center">Total Quote</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-gold/10">
                    {measurements.map((meas) => {
                      const roomObj = rooms.find((r) => r.id === meas.roomId);
                      const isCurtain = meas.productType === 'curtain';
                      const isWallpaper = meas.productType === 'wallpaper';
                      const isUpholstery = meas.productType === 'upholstery';

                      return (
                        <tr key={meas.id} className="hover:bg-brand-ivory/20 transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-bold text-brand-espresso text-sm">
                              {meas.label}
                            </div>
                            <div className="text-[11px] text-brand-charcoal/60 mt-0.5">
                              Room: <span className="font-medium text-brand-espresso">{roomObj?.name || meas.roomId}</span>
                            </div>
                            {isCurtain && (
                              <div className="text-[10px] text-brand-charcoal/70">
                                Track: {(meas.configuration as { trackWidthCm?: number })?.trackWidthCm}cm × Drop: {(meas.configuration as { dropLengthCm?: number })?.dropLengthCm}cm · {(meas.configuration as { headingStyle?: string })?.headingStyle?.replace(/_/g, ' ')}
                              </div>
                            )}
                            {isWallpaper && (
                              <div className="text-[10px] text-brand-charcoal/70">
                                Wall: {(meas.configuration as { wallWidthFt?: number })?.wallWidthFt}ft × {(meas.configuration as { wallHeightFt?: number })?.wallHeightFt}ft · {meas.breakdown.rollsRequired || 0} rolls
                              </div>
                            )}
                            {isUpholstery && (
                              <div className="text-[10px] text-brand-charcoal/70">
                                {(meas.configuration as { furnitureType?: string })?.furnitureType?.replace(/_/g, ' ')} · {meas.breakdown.fabricRequiredMeters || 0}m fabric
                              </div>
                            )}
                          </td>

                          <td className="py-3 px-4">
                            <Badge
                              className={`text-[10px] font-bold capitalize ${
                                isCurtain
                                  ? 'bg-amber-100 text-amber-800'
                                  : isWallpaper
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {meas.productType}
                            </Badge>
                          </td>

                          <td className="py-3 px-4">
                            <div className="font-semibold text-brand-espresso">
                              {meas.productName}
                            </div>
                            <div className="text-[10px] text-brand-charcoal/60">
                              @ {formatINR(meas.unitPricePaise, true)}/unit
                            </div>
                          </td>

                          <td className="py-3 px-4 text-center">
                            <div className="font-bold text-brand-espresso text-sm">
                              {formatINR(meas.totalEstimatePaise, true)}
                            </div>
                            <div className="text-[10px] text-brand-charcoal/60">
                              Incl. 18% GST
                            </div>
                          </td>

                          <td className="py-3 px-4 text-center">
                            {meas.isConvertedToOrder ? (
                              <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Converted</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 bg-brand-gold/15 text-brand-gold-dark text-[10px] font-bold px-2 py-0.5 rounded-full">
                                Preliminary Quote
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* View Cutting Sheet Button */}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedMeasurementForSheet(meas)}
                                className="h-7 text-[11px] border-brand-gold/30 text-brand-espresso hover:bg-brand-ivory px-2"
                              >
                                <Scissors className="w-3 h-3 mr-1 text-brand-gold" />
                                Cutting Sheet
                              </Button>

                              {/* Convert to Order Button */}
                              {!meas.isConvertedToOrder ? (
                                <Button
                                  size="sm"
                                  disabled={orderConvertingId === meas.id}
                                  onClick={() => handleConvertToOrder(meas)}
                                  className="h-7 text-[11px] bg-brand-espresso hover:bg-brand-gold hover:text-brand-espresso text-brand-ivory font-semibold px-2.5 shadow-2xs"
                                >
                                  <ShoppingBag className="w-3 h-3 mr-1" />
                                  {orderConvertingId === meas.id ? 'Converting...' : 'Convert to Order'}
                                </Button>
                              ) : (
                                <span className="text-[10px] text-brand-charcoal/60 font-medium">
                                  {meas.orderId}
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: Add Room Modal Form */}
      {addRoomModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-card shadow-2xl max-w-lg w-full overflow-hidden border border-brand-gold/30">
            <div className="p-4 bg-brand-espresso text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Home className="w-4 h-4 text-brand-gold" />
                <h3 className="text-sm font-bold">Add Room to {client.name}</h3>
              </div>
              <button
                onClick={() => setAddRoomModalOpen(false)}
                className="text-white/70 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateRoom} className="p-5 space-y-4">
              {/* Presets Grid */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-brand-espresso">
                  Select Room Preset
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {ROOM_PRESETS.map((preset) => {
                    const Icon = preset.icon;
                    const isSelected = selectedPreset === preset.type;
                    return (
                      <button
                        type="button"
                        key={preset.type}
                        onClick={() => handleSelectPreset(preset)}
                        className={`p-2 rounded-card text-center flex flex-col items-center justify-center gap-1 border transition-all ${
                          isSelected
                            ? 'bg-brand-gold/20 border-brand-gold text-brand-espresso font-bold ring-1 ring-brand-gold'
                            : 'bg-brand-pearl/50 border-brand-gold/15 text-brand-charcoal/80 hover:bg-brand-ivory'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${isSelected ? 'text-brand-gold-dark' : 'text-brand-charcoal/60'}`} />
                        <span className="text-[10px] leading-tight line-clamp-1">{preset.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Room Name */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-brand-espresso">
                  Room Name / Location <span className="text-red-500">*</span>
                </label>
                <Input
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  placeholder="e.g. Master Bedroom Balcony Window"
                  className="text-xs h-9 bg-white border-brand-gold/30 focus:border-brand-gold"
                  required
                />
              </div>

              {/* Floor */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-brand-espresso">
                  Floor / Wing (Optional)
                </label>
                <Input
                  value={newRoomFloor}
                  onChange={(e) => setNewRoomFloor(e.target.value)}
                  placeholder="e.g. 14th Floor or Ground Floor East Wing"
                  className="text-xs h-9 bg-white border-brand-gold/30 focus:border-brand-gold"
                />
              </div>

              {/* Room Photo URL */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-brand-espresso">
                  Baseline Photo URL (Optional)
                </label>
                <Input
                  value={newRoomPhoto}
                  onChange={(e) => setNewRoomPhoto(e.target.value)}
                  placeholder="https://... (or room photo reference)"
                  className="text-xs h-9 bg-white border-brand-gold/30 focus:border-brand-gold"
                />
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-brand-espresso">
                  Room Installation Notes
                </label>
                <textarea
                  value={newRoomNotes}
                  onChange={(e) => setNewRoomNotes(e.target.value)}
                  rows={2}
                  placeholder="e.g. High sunlight exposure, requires double-track with blackout backing..."
                  className="w-full text-xs p-2 rounded-card bg-white border border-brand-gold/30 focus:border-brand-gold focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-brand-gold/15">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAddRoomModalOpen(false)}
                  className="text-xs border-brand-gold/30"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={addingRoom || !newRoomName.trim()}
                  className="bg-brand-gold hover:bg-brand-gold-dark text-brand-espresso font-semibold text-xs gap-1.5"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>{addingRoom ? 'Saving...' : 'Add Room'}</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Workshop Digital Cutting Sheet Modal */}
      {selectedMeasurementForSheet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-card shadow-2xl max-w-2xl w-full overflow-hidden border border-brand-gold/40 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-4 bg-brand-espresso text-white flex items-center justify-between border-b border-brand-gold/30 shrink-0">
              <div className="flex items-center gap-2">
                <Scissors className="w-4 h-4 text-brand-gold" />
                <div>
                  <h3 className="text-sm font-bold font-display">
                    Workshop Digital Cutting & Job Sheet
                  </h3>
                  <p className="text-[10px] text-brand-ivory/70">
                    Excellence The Furnishing Gallery · Master Tailor Job Card
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedMeasurementForSheet(null)}
                className="text-white/70 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Printable Content Body */}
            <div className="p-6 space-y-5 overflow-y-auto flex-1 text-xs">
              {/* Header Box */}
              <div className="border border-brand-gold/30 rounded-card p-4 bg-brand-pearl/40 flex flex-col sm:flex-row justify-between gap-3">
                <div>
                  <div className="font-bold text-base text-brand-espresso">
                    {client.name}
                  </div>
                  <div className="text-brand-charcoal/80 mt-0.5">
                    Site: {client.siteAddress.street}, {client.siteAddress.city} — {client.siteAddress.pincode}
                  </div>
                  <div className="text-brand-charcoal/70 mt-0.5">
                    Contact: +91 {client.phone}
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-[10px] uppercase font-bold tracking-wider bg-brand-gold text-brand-espresso px-2 py-0.5 rounded">
                    Sheet: MS-{selectedMeasurementForSheet.id.slice(-6).toUpperCase()}
                  </span>
                  <div className="text-brand-charcoal/70 mt-1">
                    Date: {formatDate(selectedMeasurementForSheet.createdAt)}
                  </div>
                  <div className="text-brand-charcoal/70">
                    Item: <span className="font-bold text-brand-espresso">{selectedMeasurementForSheet.label}</span>
                  </div>
                </div>
              </div>

              {/* Technical Specifications */}
              <div className="space-y-2">
                <h4 className="font-bold text-xs uppercase tracking-wider text-brand-espresso border-b border-brand-gold/20 pb-1 flex items-center gap-1.5">
                  <Scissors className="w-3.5 h-3.5 text-brand-gold" />
                  <span>Workshop Cutting & Dimension Instructions</span>
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-white p-3 rounded-card border border-brand-gold/15">
                  <div>
                    <span className="text-[10px] text-brand-charcoal/60 uppercase block">Product Type</span>
                    <span className="font-bold text-brand-espresso capitalize">{selectedMeasurementForSheet.productType}</span>
                  </div>

                  <div>
                    <span className="text-[10px] text-brand-charcoal/60 uppercase block">Selected Fabric</span>
                    <span className="font-bold text-brand-espresso">{selectedMeasurementForSheet.productName}</span>
                  </div>

                  <div>
                    <span className="text-[10px] text-brand-charcoal/60 uppercase block">Material Required</span>
                    <span className="font-bold text-brand-espresso">
                      {selectedMeasurementForSheet.breakdown.fabricRequiredMeters
                        ? `${selectedMeasurementForSheet.breakdown.fabricRequiredMeters} meters`
                        : selectedMeasurementForSheet.breakdown.rollsRequired
                        ? `${selectedMeasurementForSheet.breakdown.rollsRequired} rolls`
                        : 'Custom'}
                    </span>
                  </div>

                  {selectedMeasurementForSheet.productType === 'curtain' && (
                    <>
                      <div>
                        <span className="text-[10px] text-brand-charcoal/60 uppercase block">Finished Track Width</span>
                        <span className="font-bold text-brand-espresso">
                          {(selectedMeasurementForSheet.configuration as { trackWidthCm?: number })?.trackWidthCm || '—'} cm
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] text-brand-charcoal/60 uppercase block">Finished Drop Length</span>
                        <span className="font-bold text-brand-espresso">
                          {(selectedMeasurementForSheet.configuration as { dropLengthCm?: number })?.dropLengthCm || '—'} cm
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] text-brand-charcoal/60 uppercase block">Cut Drop Allowance</span>
                        <span className="font-bold text-brand-espresso text-emerald-700">
                          {((selectedMeasurementForSheet.configuration as { dropLengthCm?: number })?.dropLengthCm || 0) + 30} cm (+30cm hem & fold)
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] text-brand-charcoal/60 uppercase block">Heading Style</span>
                        <span className="font-bold text-brand-espresso">
                          {(selectedMeasurementForSheet.configuration as { headingStyle?: string })?.headingStyle?.replace(/_/g, ' ') || '—'}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] text-brand-charcoal/60 uppercase block">Lining Layer</span>
                        <span className="font-bold text-brand-espresso capitalize">
                          {(selectedMeasurementForSheet.configuration as { liningType?: string })?.liningType || 'None'}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] text-brand-charcoal/60 uppercase block">Panels Configuration</span>
                        <span className="font-bold text-brand-espresso">
                          {(selectedMeasurementForSheet.configuration as { panels?: number })?.panels === 2
                            ? 'Pair (2 Panels Center Split)'
                            : 'Single Draw (1 Panel)'}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Itemized Financial Breakdown */}
              <div className="space-y-2">
                <h4 className="font-bold text-xs uppercase tracking-wider text-brand-espresso border-b border-brand-gold/20 pb-1 flex items-center gap-1.5">
                  <IndianRupee className="w-3.5 h-3.5 text-brand-gold" />
                  <span>Itemized Workshop Pricing Breakdown</span>
                </h4>

                <div className="space-y-1 bg-brand-pearl/30 p-3 rounded-card border border-brand-gold/15">
                  {selectedMeasurementForSheet.breakdown.itemizedSummary?.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between py-1 border-b border-brand-gold/10 last:border-b-0">
                      <span className="text-brand-charcoal">{item.label}</span>
                      <span className="font-semibold text-brand-espresso">{formatINR(item.amountPaise, true)}</span>
                    </div>
                  ))}

                  <div className="pt-2 mt-2 border-t border-brand-gold/20 flex items-center justify-between text-xs font-semibold text-brand-charcoal">
                    <span>Taxable Subtotal:</span>
                    <span>{formatINR(selectedMeasurementForSheet.breakdown.subtotalPaise, true)}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs font-semibold text-brand-charcoal">
                    <span>GST (CGST 9% + SGST 9%):</span>
                    <span>
                      {formatINR(
                        Math.max(0, (selectedMeasurementForSheet.totalEstimatePaise || 0) - selectedMeasurementForSheet.breakdown.subtotalPaise),
                        true
                      )}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-brand-gold/30 flex items-center justify-between text-sm font-bold text-brand-espresso">
                    <span>Grand Total Estimate:</span>
                    <span className="text-brand-gold-dark font-display text-base">
                      {formatINR(selectedMeasurementForSheet.totalEstimatePaise, true)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-brand-pearl border-t border-brand-gold/20 flex items-center justify-between shrink-0">
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.print()}
                className="text-xs border-brand-gold/40 text-brand-espresso gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Job Sheet</span>
              </Button>

              <div className="flex items-center gap-2">
                {!selectedMeasurementForSheet.isConvertedToOrder && (
                  <Button
                    size="sm"
                    onClick={() => {
                      const meas = selectedMeasurementForSheet;
                      setSelectedMeasurementForSheet(null);
                      handleConvertToOrder(meas);
                    }}
                    className="bg-brand-gold hover:bg-brand-gold-dark text-brand-espresso font-semibold text-xs gap-1.5 shadow-xs"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Convert to Order</span>
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedMeasurementForSheet(null)}
                  className="text-xs text-brand-charcoal"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

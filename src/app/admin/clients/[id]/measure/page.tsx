'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
  Ruler,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Users,
  Home,
  Layers,
  Sparkles,
  Scissors,
  Save,
  ShoppingBag,
  IndianRupee,
  PlusCircle,
  FileText,
  Printer,
  Info,
  ChevronRight,
  Sofa,
  BedDouble,
  Baby,
  Bed,
  Utensils,
  Briefcase,
  SunMedium,
  AlertCircle,
} from 'lucide-react';
import {
  fetchClientById,
  fetchRooms,
  fetchProducts,
  saveMeasurement,
  saveOrder,
  saveRoom,
} from '@/lib/firebase/firestore';
import { Client } from '@/types/client';
import { Room, RoomType } from '@/types/room';
import { Product } from '@/types/product';
import {
  ProductMeasurementType,
  HeadingStyle,
  LiningType,
  MotorizationType,
  MotorBrand,
  CurtainConfig,
  WallpaperConfig,
  UpholsteryConfig,
  FurnitureType,
  FoamGrade,
  WallpaperPatternRepeat,
  RoomMeasurement,
} from '@/types/measurement';
import { Order, OrderItem } from '@/types/order';
import {
  calculateCurtainQuote,
  calculateWallpaperQuote,
  calculateUpholsteryQuote,
  calculateGST,
  CurtainQuoteResult,
  WallpaperQuoteResult,
  UpholsteryQuoteResult,
} from '@/lib/pricing/calculator';
import { formatINR, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ROOM_PRESETS, getRoomIcon } from '@/components/admin/room-presets';

const STEPS = [
  { id: 1, title: 'Verify Client' },
  { id: 2, title: 'Select Room' },
  { id: 3, title: 'Product Type' },
  { id: 4, title: 'Specifications' },
  { id: 5, title: 'Quote & Workshop Sheet' },
];

export default function MeasurementWizardPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const clientId = params?.id as string;
  const initialRoomId = searchParams?.get('roomId') || '';

  // Core Data State
  const [client, setClient] = React.useState<Client | null>(null);
  const [rooms, setRooms] = React.useState<Room[]>([]);
  const [products, setProducts] = React.useState<Product[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Stepper State
  const [currentStep, setCurrentStep] = React.useState(1);

  // Wizard Selections
  const [selectedRoomId, setSelectedRoomId] = React.useState<string>(initialRoomId);
  const [selectedProductType, setSelectedProductType] = React.useState<ProductMeasurementType>('curtain');
  const [measurementLabel, setMeasurementLabel] = React.useState('Main Window Drapes');

  // Inline Add Room State
  const [showAddRoomInline, setShowAddRoomInline] = React.useState(false);
  const [newRoomName, setNewRoomName] = React.useState('');
  const [newRoomType, setNewRoomType] = React.useState<RoomType>('living_room');

  // --- Step 4 Configuration States ---

  // Curtains Configuration
  const [curtainTrackWidthCm, setCurtainTrackWidthCm] = React.useState(280);
  const [curtainDropLengthCm, setCurtainDropLengthCm] = React.useState(260);
  const [curtainFullness, setCurtainFullness] = React.useState(2.0);
  const [curtainHeadingStyle, setCurtainHeadingStyle] = React.useState<HeadingStyle>('wave_s_fold');
  const [curtainLiningType, setCurtainLiningType] = React.useState<LiningType>('blackout');
  const [curtainMotorized, setCurtainMotorized] = React.useState(false);
  const [curtainMotorBrand, setCurtainMotorBrand] = React.useState<MotorBrand>('somfy');
  const [curtainPanels, setCurtainPanels] = React.useState<1 | 2>(2);
  const [selectedCurtainFabricId, setSelectedCurtainFabricId] = React.useState('');
  const [customCurtainFabricPrice, setCustomCurtainFabricPrice] = React.useState(2200);

  // Wallpaper Configuration
  const [wallpaperWidthFt, setWallpaperWidthFt] = React.useState(14.5);
  const [wallpaperHeightFt, setWallpaperHeightFt] = React.useState(9.5);
  const [wallpaperPatternRepeat, setWallpaperPatternRepeat] = React.useState<WallpaperPatternRepeat>('straight_match');
  const [wallpaperUsableCoverage, setWallpaperUsableCoverage] = React.useState(45);
  const [wallpaperIncludeInstall, setWallpaperIncludeInstall] = React.useState(true);
  const [selectedWallpaperId, setSelectedWallpaperId] = React.useState('');
  const [customWallpaperRollPrice, setCustomWallpaperRollPrice] = React.useState(3800);

  // Upholstery Configuration
  const [upholsteryFurnitureType, setUpholsteryFurnitureType] = React.useState<FurnitureType>('sofa_3_seater');
  const [upholsterySeatCount, setUpholsterySeatCount] = React.useState(3);
  const [upholsteryIncludeFoam, setUpholsteryIncludeFoam] = React.useState(true);
  const [upholsteryFoamGrade, setUpholsteryFoamGrade] = React.useState<FoamGrade>('hd_40_density');
  const [upholsteryCustomMeters, setUpholsteryCustomMeters] = React.useState<number | undefined>(undefined);
  const [selectedUpholsteryFabricId, setSelectedUpholsteryFabricId] = React.useState('');
  const [customUpholsteryFabricPrice, setCustomUpholsteryFabricPrice] = React.useState(1750);

  // Final actions state
  const [savingMeasurement, setSavingMeasurement] = React.useState(false);
  const [convertingOrder, setConvertingOrder] = React.useState(false);
  const [savedMeasurementId, setSavedMeasurementId] = React.useState<string | null>(null);
  const [successBanner, setSuccessBanner] = React.useState<string | null>(null);

  // Load initial data
  React.useEffect(() => {
    async function loadData() {
      if (!clientId) return;
      try {
        setLoading(true);
        const [clientData, roomsData, productsData] = await Promise.all([
          fetchClientById(clientId),
          fetchRooms(clientId),
          fetchProducts(),
        ]);
        setClient(clientData);
        setRooms(roomsData);
        setProducts(productsData);

        if (initialRoomId) {
          setSelectedRoomId(initialRoomId);
        } else if (roomsData.length > 0) {
          setSelectedRoomId(roomsData[0].id);
        }
      } catch (err) {
        console.error('Failed to load measurement wizard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [clientId, initialRoomId]);

  // Catalog filtered products
  const curtainFabrics = React.useMemo(() => {
    return products.filter((p) => p.category === 'curtains_window_treatments');
  }, [products]);

  const wallpapers = React.useMemo(() => {
    return products.filter((p) => p.category === 'wallpapers');
  }, [products]);

  const upholsteryFabrics = React.useMemo(() => {
    return products.filter((p) => p.category === 'sofa_upholstery_fabrics');
  }, [products]);

  // Set default fabric selection on first load
  React.useEffect(() => {
    if (!selectedCurtainFabricId && curtainFabrics.length > 0) {
      setSelectedCurtainFabricId(curtainFabrics[0].id);
      setCustomCurtainFabricPrice(curtainFabrics[0].pricePerUnitPaise / 100);
    }
  }, [curtainFabrics, selectedCurtainFabricId]);

  React.useEffect(() => {
    if (!selectedWallpaperId && wallpapers.length > 0) {
      setSelectedWallpaperId(wallpapers[0].id);
      setCustomWallpaperRollPrice(wallpapers[0].pricePerUnitPaise / 100);
    }
  }, [wallpapers, selectedWallpaperId]);

  React.useEffect(() => {
    if (!selectedUpholsteryFabricId && upholsteryFabrics.length > 0) {
      setSelectedUpholsteryFabricId(upholsteryFabrics[0].id);
      setCustomUpholsteryFabricPrice(upholsteryFabrics[0].pricePerUnitPaise / 100);
    }
  }, [upholsteryFabrics, selectedUpholsteryFabricId]);

  // Dynamic Live Quote Calculation
  const liveQuote = React.useMemo(() => {
    if (selectedProductType === 'curtain') {
      const config: CurtainConfig = {
        type: 'curtain',
        trackWidthCm: curtainTrackWidthCm,
        dropLengthCm: curtainDropLengthCm,
        fullnessRatio: curtainFullness,
        headingStyle: curtainHeadingStyle,
        liningType: curtainLiningType,
        motorized: curtainMotorized,
        motorBrand: curtainMotorBrand,
        panels: curtainPanels,
      };
      const result = calculateCurtainQuote(config, customCurtainFabricPrice);
      const gst = calculateGST(result.subtotalPaise, false, 18);
      return {
        ...result,
        gst,
        grandTotalPaise: result.subtotalPaise + gst.totalTaxPaise,
      };
    }

    if (selectedProductType === 'wallpaper') {
      const config: WallpaperConfig = {
        type: 'wallpaper',
        wallWidthFt: wallpaperWidthFt,
        wallHeightFt: wallpaperHeightFt,
        patternRepeatType: wallpaperPatternRepeat,
        usableCoverageSqFtPerRoll: wallpaperUsableCoverage,
        includeInstallation: wallpaperIncludeInstall,
      };
      const result = calculateWallpaperQuote(config, customWallpaperRollPrice);
      const gst = calculateGST(result.subtotalPaise, false, 18);
      return {
        ...result,
        gst,
        grandTotalPaise: result.subtotalPaise + gst.totalTaxPaise,
      };
    }

    // Upholstery
    const config: UpholsteryConfig = {
      type: 'upholstery',
      furnitureType: upholsteryFurnitureType,
      seatCount: upholsterySeatCount,
      includeFoamReplacement: upholsteryIncludeFoam,
      foamGrade: upholsteryFoamGrade,
      customFabricMeters: upholsteryCustomMeters,
    };
    const result = calculateUpholsteryQuote(config, customUpholsteryFabricPrice);
    const gst = calculateGST(result.subtotalPaise, false, 18);
    return {
      ...result,
      gst,
      grandTotalPaise: result.subtotalPaise + gst.totalTaxPaise,
    };
  }, [
    selectedProductType,
    curtainTrackWidthCm,
    curtainDropLengthCm,
    curtainFullness,
    curtainHeadingStyle,
    curtainLiningType,
    curtainMotorized,
    curtainMotorBrand,
    curtainPanels,
    customCurtainFabricPrice,
    wallpaperWidthFt,
    wallpaperHeightFt,
    wallpaperPatternRepeat,
    wallpaperUsableCoverage,
    wallpaperIncludeInstall,
    customWallpaperRollPrice,
    upholsteryFurnitureType,
    upholsterySeatCount,
    upholsteryIncludeFoam,
    upholsteryFoamGrade,
    upholsteryCustomMeters,
    customUpholsteryFabricPrice,
  ]);

  // Selected Room Object
  const currentRoom = React.useMemo(() => {
    return rooms.find((r) => r.id === selectedRoomId) || rooms[0] || null;
  }, [rooms, selectedRoomId]);

  // Handle Inline Room Addition
  const handleAddRoomInline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client || !newRoomName.trim()) return;

    try {
      const roomId = `room-${Date.now().toString().slice(-6)}`;
      const timestamp = new Date().toISOString();
      const newRoom: Room = {
        id: roomId,
        clientId: client.id,
        name: newRoomName.trim(),
        type: newRoomType,
        photos: [],
        measurementsCount: 0,
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      await saveRoom(newRoom);
      setRooms((prev) => [...prev, newRoom]);
      setSelectedRoomId(roomId);
      setShowAddRoomInline(false);
      setNewRoomName('');
    } catch (err) {
      console.error('Failed to create room inline:', err);
    }
  };

  // Construct standard Measurement Record
  const buildMeasurementRecord = (): RoomMeasurement => {
    if (!client || !currentRoom) {
      throw new Error('Client or Room missing');
    }

    const measurementId = `meas-${Date.now().toString().slice(-6)}`;
    const timestamp = new Date().toISOString();

    let chosenProduct: Product | undefined;
    let unitPricePaise = 0;
    let configData: any;

    if (selectedProductType === 'curtain') {
      chosenProduct = curtainFabrics.find((p) => p.id === selectedCurtainFabricId);
      unitPricePaise = Math.round(customCurtainFabricPrice * 100);
      configData = {
        type: 'curtain',
        trackWidthCm: curtainTrackWidthCm,
        dropLengthCm: curtainDropLengthCm,
        fullnessRatio: curtainFullness,
        headingStyle: curtainHeadingStyle,
        liningType: curtainLiningType,
        motorized: curtainMotorized,
        motorBrand: curtainMotorBrand,
        panels: curtainPanels,
        fabricWidthCm: 140,
        fabricId: chosenProduct?.id,
        fabricName: chosenProduct?.name || 'Custom Curtain Fabric',
      };
    } else if (selectedProductType === 'wallpaper') {
      chosenProduct = wallpapers.find((p) => p.id === selectedWallpaperId);
      unitPricePaise = Math.round(customWallpaperRollPrice * 100);
      configData = {
        type: 'wallpaper',
        wallWidthFt: wallpaperWidthFt,
        wallHeightFt: wallpaperHeightFt,
        patternRepeatType: wallpaperPatternRepeat,
        usableCoverageSqFtPerRoll: wallpaperUsableCoverage,
        includeInstallation: wallpaperIncludeInstall,
        wallpaperId: chosenProduct?.id,
        wallpaperName: chosenProduct?.name || 'Custom Designer Wallpaper',
      };
    } else {
      chosenProduct = upholsteryFabrics.find((p) => p.id === selectedUpholsteryFabricId);
      unitPricePaise = Math.round(customUpholsteryFabricPrice * 100);
      configData = {
        type: 'upholstery',
        furnitureType: upholsteryFurnitureType,
        seatCount: upholsterySeatCount,
        includeFoamReplacement: upholsteryIncludeFoam,
        foamGrade: upholsteryFoamGrade,
        customFabricMeters: upholsteryCustomMeters,
        fabricId: chosenProduct?.id,
        fabricName: chosenProduct?.name || 'Custom Upholstery Fabric',
      };
    }

    return {
      id: savedMeasurementId || measurementId,
      clientId: client.id,
      roomId: currentRoom.id,
      label: measurementLabel.trim() || `${selectedProductType.toUpperCase()} - ${currentRoom.name}`,
      productType: selectedProductType,
      configuration: configData,
      productId: chosenProduct?.id || `custom-${selectedProductType}`,
      productName: chosenProduct?.name || `Custom ${selectedProductType.replace(/_/g, ' ')}`,
      unitPricePaise,
      breakdown: liveQuote.breakdown,
      totalEstimatePaise: liveQuote.grandTotalPaise,
      isConvertedToOrder: false,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
  };

  // Save Measurement Action
  const handleSaveMeasurement = async () => {
    try {
      setSavingMeasurement(true);
      const record = buildMeasurementRecord();
      await saveMeasurement(record);
      setSavedMeasurementId(record.id);
      setSuccessBanner(`Measurement ${record.id} saved successfully!`);
    } catch (err: unknown) {
      console.error('Failed to save measurement:', err);
    } finally {
      setSavingMeasurement(false);
    }
  };

  // Convert to Order Action
  const handleConvertToOrder = async () => {
    if (!client || !currentRoom) return;
    try {
      setConvertingOrder(true);
      const measRecord = buildMeasurementRecord();

      // Ensure measurement is saved first
      await saveMeasurement(measRecord);

      const orderSeq = Math.floor(1000 + Math.random() * 9000);
      const orderNumber = `EF-ORD-2026-${orderSeq}`;
      const orderId = `order-${orderSeq}`;
      const timestamp = new Date().toISOString();

      const item: OrderItem = {
        id: `item-${Date.now().toString().slice(-5)}`,
        productId: measRecord.productId,
        productName: measRecord.productName,
        category: measRecord.productType,
        quantity:
          measRecord.breakdown.fabricRequiredMeters ||
          measRecord.breakdown.rollsRequired ||
          1,
        unit:
          measRecord.productType === 'curtain'
            ? 'meter'
            : measRecord.productType === 'wallpaper'
            ? 'roll'
            : 'piece',
        unitPricePaise: measRecord.unitPricePaise,
        measurementId: measRecord.id,
        configuration: measRecord.configuration,
        lineTotalPaise: measRecord.breakdown.subtotalPaise,
      };

      const newOrder: Order = {
        id: orderId,
        orderNumber,
        clientId: client.id,
        clientName: client.name,
        clientPhone: client.phone,
        clientEmail: client.email,
        items: [item],
        subtotalPaise: measRecord.breakdown.subtotalPaise,
        discountPaise: 0,
        gstBreakdown: liveQuote.gst,
        grandTotalPaise: liveQuote.grandTotalPaise,
        paymentStatus: 'pending',
        paidAmountPaise: 0,
        balanceAmountPaise: liveQuote.grandTotalPaise,
        payments: [],
        status: 'draft',
        deliveryAddress: client.siteAddress || client.billingAddress,
        internalNotes: `Converted from Measurement ${measRecord.id} (${measRecord.label})`,
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      await saveOrder(newOrder);

      // Redirect directly to client hub with success
      router.push(`/admin/clients/${client.id}?converted=true`);
    } catch (err) {
      console.error('Failed to convert measurement to order:', err);
    } finally {
      setConvertingOrder(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-sm text-brand-charcoal/60">
        Loading measurement configuration engine...
      </div>
    );
  }

  if (!client) {
    return (
      <div className="p-12 text-center">
        <Users className="w-12 h-12 text-brand-gold/40 mx-auto mb-3" />
        <h3 className="text-base font-bold text-brand-espresso">Client not found</h3>
        <Link href="/admin/clients" className="mt-4 inline-block">
          <Button size="sm" variant="outline" className="text-xs border-brand-gold/40">
            Back to Clients CRM
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href={`/admin/clients/${client.id}`}
          className="inline-flex items-center gap-1.5 text-xs text-brand-charcoal/70 hover:text-brand-gold font-medium transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to {client.name}</span>
        </Link>
        <span className="text-xs font-semibold text-brand-gold bg-brand-gold/15 px-2.5 py-0.5 rounded-full border border-brand-gold/30">
          Digital Workshop Wizard
        </span>
      </div>

      {/* Stepper Progress Bar */}
      <div className="bg-white rounded-card border border-brand-gold/20 p-4 shadow-xs">
        <div className="flex items-center justify-between">
          {STEPS.map((step, idx) => {
            const isCompleted = currentStep > step.id;
            const isCurrent = currentStep === step.id;

            return (
              <React.Fragment key={step.id}>
                <div
                  onClick={() => {
                    if (isCompleted || isCurrent) setCurrentStep(step.id);
                  }}
                  className={`flex items-center gap-2 cursor-pointer ${
                    isCurrent
                      ? 'text-brand-gold-dark font-bold'
                      : isCompleted
                      ? 'text-emerald-700 font-semibold'
                      : 'text-brand-charcoal/40'
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      isCurrent
                        ? 'bg-brand-gold text-brand-espresso ring-2 ring-brand-gold/40 shadow-xs'
                        : isCompleted
                        ? 'bg-emerald-600 text-white'
                        : 'bg-brand-pearl text-brand-charcoal/60 border border-brand-gold/20'
                    }`}
                  >
                    {isCompleted ? <Check className="w-3.5 h-3.5" /> : step.id}
                  </div>
                  <span className="text-xs hidden sm:inline">{step.title}</span>
                </div>

                {idx < STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-2 ${
                      currentStep > step.id ? 'bg-emerald-500' : 'bg-brand-gold/20'
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {successBanner && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-card flex items-center justify-between text-emerald-800 text-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{successBanner}</span>
          </div>
          <button onClick={() => setSuccessBanner(null)} className="text-emerald-700">
            <Check className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* STEP 1: VERIFY CLIENT */}
      {currentStep === 1 && (
        <Card className="border border-brand-gold/25 shadow-xs bg-white">
          <CardHeader className="border-b border-brand-gold/15 pb-4">
            <CardTitle className="text-base font-bold text-brand-espresso flex items-center gap-2">
              <Users className="w-4 h-4 text-brand-gold" />
              <span>Step 1: Confirm Client & Site Installation Details</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Verify client contact numbers and Mumbai project site address before taking measurements.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-brand-pearl/40 p-4 rounded-card border border-brand-gold/15 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-brand-charcoal/60 block">Client Name</span>
                <span className="font-bold text-brand-espresso text-sm">{client.name}</span>
                {client.tags && client.tags.length > 0 && (
                  <div className="flex gap-1 mt-1">
                    {client.tags.map((t) => (
                      <span key={t} className="text-[10px] bg-brand-gold/20 text-brand-gold-dark px-1.5 py-0.2 rounded font-semibold">
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-brand-charcoal/60 block">Mobile Number</span>
                <span className="font-bold text-brand-espresso text-sm">+91 {client.phone}</span>
                <span className="block text-brand-charcoal/60 text-[11px]">{client.email}</span>
              </div>

              <div className="sm:col-span-2 pt-2 border-t border-brand-gold/15">
                <span className="text-[10px] uppercase font-bold text-brand-charcoal/60 block">
                  Installation / Project Site Address (Mumbai)
                </span>
                <span className="font-semibold text-brand-espresso">
                  {client.siteAddress.street}, {client.siteAddress.city} — {client.siteAddress.pincode}
                </span>
                {client.siteAddress.landmark && (
                  <span className="block text-brand-charcoal/70 text-[11px]">
                    Landmark: {client.siteAddress.landmark}
                  </span>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                onClick={() => setCurrentStep(2)}
                className="bg-brand-gold hover:bg-brand-gold-dark text-brand-espresso font-semibold text-xs gap-1.5 px-6 shadow-xs"
              >
                <span>Confirm & Select Room</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 2: SELECT / ADD ROOM */}
      {currentStep === 2 && (
        <Card className="border border-brand-gold/25 shadow-xs bg-white">
          <CardHeader className="border-b border-brand-gold/15 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-brand-espresso flex items-center gap-2">
                  <Home className="w-4 h-4 text-brand-gold" />
                  <span>Step 2: Select Room for Measurement</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Choose which room in {client.name}&apos;s residence these dimensions belong to.
                </CardDescription>
              </div>

              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowAddRoomInline(!showAddRoomInline)}
                className="border-brand-gold/40 text-brand-espresso text-xs gap-1"
              >
                <PlusCircle className="w-3.5 h-3.5 text-brand-gold" />
                <span>{showAddRoomInline ? 'Cancel' : 'New Room'}</span>
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-5">
            {/* Inline Add Room Box */}
            {showAddRoomInline && (
              <form
                onSubmit={handleAddRoomInline}
                className="bg-brand-pearl p-4 rounded-card border border-brand-gold/30 space-y-3 animate-in fade-in"
              >
                <h4 className="text-xs font-bold text-brand-espresso uppercase tracking-wider">
                  Quick Add Room
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-brand-espresso">Room Name</label>
                    <Input
                      value={newRoomName}
                      onChange={(e) => setNewRoomName(e.target.value)}
                      placeholder="e.g. Master Bedroom 2nd Balcony"
                      className="text-xs h-8 bg-white border-brand-gold/30"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-brand-espresso">Preset Type</label>
                    <select
                      value={newRoomType}
                      onChange={(e) => setNewRoomType(e.target.value as RoomType)}
                      className="w-full text-xs h-8 px-2 rounded-card bg-white border border-brand-gold/30"
                    >
                      {ROOM_PRESETS.map((p) => (
                        <option key={p.type} value={p.type}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <Button
                    type="submit"
                    size="sm"
                    className="bg-brand-gold text-brand-espresso font-semibold text-xs h-8"
                  >
                    Save & Select
                  </Button>
                </div>
              </form>
            )}

            {/* Visual Rooms Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {rooms.map((room) => {
                const Icon = getRoomIcon(room.type);
                const isSelected = selectedRoomId === room.id;

                return (
                  <div
                    key={room.id}
                    onClick={() => setSelectedRoomId(room.id)}
                    className={`p-4 rounded-card border-2 cursor-pointer transition-all flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'border-brand-gold bg-brand-gold/10 ring-1 ring-brand-gold shadow-xs'
                        : 'border-brand-gold/20 bg-white hover:bg-brand-ivory/30'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-card flex items-center justify-center ${
                          isSelected ? 'bg-brand-gold text-brand-espresso' : 'bg-brand-pearl text-brand-gold-dark'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-brand-espresso line-clamp-1">{room.name}</h4>
                        <p className="text-[10px] text-brand-charcoal/60 capitalize">
                          {room.type.replace(/_/g, ' ')}
                        </p>
                      </div>
                    </div>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-brand-gold-dark shrink-0" />}
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-brand-gold/15">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentStep(1)}
                className="text-xs border-brand-gold/30"
              >
                <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                <span>Back</span>
              </Button>
              <Button
                disabled={!selectedRoomId}
                onClick={() => setCurrentStep(3)}
                className="bg-brand-gold hover:bg-brand-gold-dark text-brand-espresso font-semibold text-xs gap-1.5 px-6 shadow-xs"
              >
                <span>Proceed to Product Type</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 3: SELECT PRODUCT TYPE */}
      {currentStep === 3 && (
        <Card className="border border-brand-gold/25 shadow-xs bg-white">
          <CardHeader className="border-b border-brand-gold/15 pb-4">
            <CardTitle className="text-base font-bold text-brand-espresso flex items-center gap-2">
              <Layers className="w-4 h-4 text-brand-gold" />
              <span>Step 3: Select Bespoke Product Category</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Choose the furnishing category to configure for {currentRoom?.name}.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Product 1: Curtains */}
              <div
                onClick={() => setSelectedProductType('curtain')}
                className={`p-5 rounded-card border-2 cursor-pointer transition-all flex flex-col justify-between ${
                  selectedProductType === 'curtain'
                    ? 'border-brand-gold bg-brand-gold/10 ring-1 ring-brand-gold shadow-md'
                    : 'border-brand-gold/20 bg-white hover:bg-brand-ivory/30'
                }`}
              >
                <div>
                  <div className="w-12 h-12 rounded-card bg-amber-100 text-amber-800 flex items-center justify-center mb-3">
                    <Scissors className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-sm text-brand-espresso">
                    Curtains & Window Treatments
                  </h3>
                  <p className="text-xs text-brand-charcoal/70 mt-1">
                    Sheer voiles, heavy velvet drapes, blackout linings, wave folds, and Somfy motorization.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-brand-gold/15 flex items-center justify-between text-xs font-semibold text-brand-gold-dark">
                  <span>Track & Drop Formula</span>
                  {selectedProductType === 'curtain' && <CheckCircle2 className="w-4 h-4" />}
                </div>
              </div>

              {/* Product 2: Wallpapers */}
              <div
                onClick={() => setSelectedProductType('wallpaper')}
                className={`p-5 rounded-card border-2 cursor-pointer transition-all flex flex-col justify-between ${
                  selectedProductType === 'wallpaper'
                    ? 'border-brand-gold bg-brand-gold/10 ring-1 ring-brand-gold shadow-md'
                    : 'border-brand-gold/20 bg-white hover:bg-brand-ivory/30'
                }`}
              >
                <div>
                  <div className="w-12 h-12 rounded-card bg-blue-100 text-blue-800 flex items-center justify-center mb-3">
                    <Layers className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-sm text-brand-espresso">
                    Wallpapers & Wall Murals
                  </h3>
                  <p className="text-xs text-brand-charcoal/70 mt-1">
                    European non-woven rolls, Nilaya textures, pattern drop matches, and pasting labor.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-brand-gold/15 flex items-center justify-between text-xs font-semibold text-brand-gold-dark">
                  <span>Wall Area & Roll Math</span>
                  {selectedProductType === 'wallpaper' && <CheckCircle2 className="w-4 h-4" />}
                </div>
              </div>

              {/* Product 3: Upholstery */}
              <div
                onClick={() => setSelectedProductType('upholstery')}
                className={`p-5 rounded-card border-2 cursor-pointer transition-all flex flex-col justify-between ${
                  selectedProductType === 'upholstery'
                    ? 'border-brand-gold bg-brand-gold/10 ring-1 ring-brand-gold shadow-md'
                    : 'border-brand-gold/20 bg-white hover:bg-brand-ivory/30'
                }`}
              >
                <div>
                  <div className="w-12 h-12 rounded-card bg-emerald-100 text-emerald-800 flex items-center justify-center mb-3">
                    <Sofa className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-sm text-brand-espresso">
                    Sofa & Furniture Upholstery
                  </h3>
                  <p className="text-xs text-brand-charcoal/70 mt-1">
                    Rexine, jacquard, crushed velvet, craftsman reupholstery labor, and 40D foam renewal.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-brand-gold/15 flex items-center justify-between text-xs font-semibold text-brand-gold-dark">
                  <span>Seat Count & Foam Tiers</span>
                  {selectedProductType === 'upholstery' && <CheckCircle2 className="w-4 h-4" />}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-brand-gold/15">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentStep(2)}
                className="text-xs border-brand-gold/30"
              >
                <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                <span>Back</span>
              </Button>
              <Button
                onClick={() => setCurrentStep(4)}
                className="bg-brand-gold hover:bg-brand-gold-dark text-brand-espresso font-semibold text-xs gap-1.5 px-6 shadow-xs"
              >
                <span>Configure Dimensions</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 4: DYNAMIC CONFIGURATION & LIVE QUOTE */}
      {currentStep === 4 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form Left Side (2 cols) */}
          <div className="lg:col-span-2 space-y-5">
            <Card className="border border-brand-gold/25 shadow-xs bg-white">
              <CardHeader className="border-b border-brand-gold/15 pb-4">
                <CardTitle className="text-base font-bold text-brand-espresso flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Ruler className="w-4 h-4 text-brand-gold" />
                    <span>
                      Step 4: {selectedProductType === 'curtain' ? 'Curtain Dimensions & Tailoring' : selectedProductType === 'wallpaper' ? 'Wallpaper Dimensions & Roll Math' : 'Upholstery Seating & Foam'}
                    </span>
                  </div>
                  <span className="text-xs font-semibold uppercase bg-brand-gold/15 text-brand-gold-dark px-2 py-0.5 rounded">
                    Room: {currentRoom?.name}
                  </span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Enter measurements taken on site. Changes update the preliminary quote live.
                </CardDescription>
              </CardHeader>

              <CardContent className="p-6 space-y-4">
                {/* Window / Item Reference Label */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-brand-espresso">
                    Measurement Label / Window Identifier
                  </label>
                  <Input
                    value={measurementLabel}
                    onChange={(e) => setMeasurementLabel(e.target.value)}
                    placeholder="e.g. Master Bedroom East French Window"
                    className="text-xs h-9 bg-white border-brand-gold/30 focus:border-brand-gold"
                  />
                </div>

                {/* --- A. CURTAIN DYNAMIC FORM --- */}
                {selectedProductType === 'curtain' && (
                  <div className="space-y-4 pt-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-brand-espresso">
                          Track Width (cm)
                        </label>
                        <Input
                          type="number"
                          value={curtainTrackWidthCm}
                          onChange={(e) => setCurtainTrackWidthCm(Math.max(1, Number(e.target.value)))}
                          min={50}
                          max={1200}
                          className="text-xs h-9 bg-white border-brand-gold/30"
                        />
                        <span className="text-[10px] text-brand-charcoal/60">Width of rod or track</span>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-brand-espresso">
                          Finished Drop Length (cm)
                        </label>
                        <Input
                          type="number"
                          value={curtainDropLengthCm}
                          onChange={(e) => setCurtainDropLengthCm(Math.max(1, Number(e.target.value)))}
                          min={50}
                          max={450}
                          className="text-xs h-9 bg-white border-brand-gold/30"
                        />
                        <span className="text-[10px] text-brand-charcoal/60">Track to floor distance</span>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-brand-espresso">
                          Fullness Ratio
                        </label>
                        <select
                          value={curtainFullness}
                          onChange={(e) => setCurtainFullness(Number(e.target.value))}
                          className="w-full text-xs h-9 px-3 rounded-card bg-white border border-brand-gold/30"
                        >
                          <option value={1.5}>1.5x (Tailored / Minimal Gather)</option>
                          <option value={2.0}>2.0x (Standard / Recommended Wave)</option>
                          <option value={2.5}>2.5x (Luxury Deep Pleats)</option>
                          <option value={3.0}>3.0x (Ultra Rich Triple Gather)</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-brand-espresso">
                          Heading Style
                        </label>
                        <select
                          value={curtainHeadingStyle}
                          onChange={(e) => setCurtainHeadingStyle(e.target.value as HeadingStyle)}
                          className="w-full text-xs h-9 px-3 rounded-card bg-white border border-brand-gold/30"
                        >
                          <option value="wave_s_fold">Wave / S-Fold (₹280/m)</option>
                          <option value="eyelet">Eyelet / Grommet (₹150/m)</option>
                          <option value="pinch_pleat_double">Double Pinch Pleat (₹240/m)</option>
                          <option value="pinch_pleat_triple">Triple Pinch Pleat (₹280/m)</option>
                          <option value="pinch_pleat_single">Single Pinch Pleat (₹200/m)</option>
                          <option value="box_pleat">Box Pleat (₹300/m)</option>
                          <option value="rod_pocket">Rod Pocket (₹150/m)</option>
                          <option value="goblet_pleat">Goblet Pleat (₹320/m)</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-brand-espresso">
                          Lining Type
                        </label>
                        <select
                          value={curtainLiningType}
                          onChange={(e) => setCurtainLiningType(e.target.value as LiningType)}
                          className="w-full text-xs h-9 px-3 rounded-card bg-white border border-brand-gold/30"
                        >
                          <option value="unlined">Unlined (No Lining)</option>
                          <option value="cotton">Cotton Lining (+₹180/m + 40% fee)</option>
                          <option value="blackout">100% Blackout Coated (+₹350/m + 40% fee)</option>
                          <option value="thermal">Thermal Insulated (+₹420/m + 40% fee)</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-brand-espresso">
                          Panels Split
                        </label>
                        <select
                          value={curtainPanels}
                          onChange={(e) => setCurtainPanels(Number(e.target.value) as 1 | 2)}
                          className="w-full text-xs h-9 px-3 rounded-card bg-white border border-brand-gold/30"
                        >
                          <option value={2}>Pair (2 Panels - Center Split)</option>
                          <option value={1}>Single Draw (1 Panel - One Way)</option>
                        </select>
                      </div>
                    </div>

                    {/* Motorization */}
                    <div className="pt-2 border-t border-brand-gold/15">
                      <label className="inline-flex items-center gap-2 text-xs font-semibold text-brand-espresso cursor-pointer">
                        <input
                          type="checkbox"
                          checked={curtainMotorized}
                          onChange={(e) => setCurtainMotorized(e.target.checked)}
                          className="rounded border-brand-gold/40 text-brand-gold focus:ring-brand-gold w-4 h-4"
                        />
                        <span>Motorized Track Automation</span>
                      </label>

                      {curtainMotorized && (
                        <div className="mt-2 pl-6">
                          <label className="text-[11px] font-semibold text-brand-espresso block mb-1">
                            Motor Brand
                          </label>
                          <select
                            value={curtainMotorBrand}
                            onChange={(e) => setCurtainMotorBrand(e.target.value as MotorBrand)}
                            className="text-xs h-8 px-2 rounded-card bg-white border border-brand-gold/30"
                          >
                            <option value="somfy">Somfy Motorized Track (₹12,500 - ₹16,500)</option>
                            <option value="generic">Standard Generic Motor (₹7,500 - ₹10,500)</option>
                          </select>
                        </div>
                      )}
                    </div>

                    {/* Fabric Picker */}
                    <div className="pt-2 border-t border-brand-gold/15 space-y-2">
                      <label className="text-xs font-semibold text-brand-espresso">
                        Select Curtain Fabric (or Enter Custom Rate)
                      </label>
                      <select
                        value={selectedCurtainFabricId}
                        onChange={(e) => {
                          setSelectedCurtainFabricId(e.target.value);
                          const p = curtainFabrics.find((f) => f.id === e.target.value);
                          if (p) setCustomCurtainFabricPrice(p.pricePerUnitPaise / 100);
                        }}
                        className="w-full text-xs h-9 px-3 rounded-card bg-white border border-brand-gold/30"
                      >
                        {curtainFabrics.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.name} — ₹{f.pricePerUnitPaise / 100}/m
                          </option>
                        ))}
                      </select>

                      <div className="flex items-center gap-2 pt-1">
                        <span className="text-[11px] text-brand-charcoal/70">Rate per meter (₹):</span>
                        <Input
                          type="number"
                          value={customCurtainFabricPrice}
                          onChange={(e) => setCustomCurtainFabricPrice(Math.max(1, Number(e.target.value)))}
                          className="w-32 text-xs h-8 bg-white border-brand-gold/30"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* --- B. WALLPAPER DYNAMIC FORM --- */}
                {selectedProductType === 'wallpaper' && (
                  <div className="space-y-4 pt-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-brand-espresso">
                          Wall Width (ft)
                        </label>
                        <Input
                          type="number"
                          step="0.1"
                          value={wallpaperWidthFt}
                          onChange={(e) => setWallpaperWidthFt(Math.max(0.1, Number(e.target.value)))}
                          className="text-xs h-9 bg-white border-brand-gold/30"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-brand-espresso">
                          Wall Height (ft)
                        </label>
                        <Input
                          type="number"
                          step="0.1"
                          value={wallpaperHeightFt}
                          onChange={(e) => setWallpaperHeightFt(Math.max(0.1, Number(e.target.value)))}
                          className="text-xs h-9 bg-white border-brand-gold/30"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-brand-espresso">
                          Pattern Repeat
                        </label>
                        <select
                          value={wallpaperPatternRepeat}
                          onChange={(e) => setWallpaperPatternRepeat(e.target.value as WallpaperPatternRepeat)}
                          className="w-full text-xs h-9 px-3 rounded-card bg-white border border-brand-gold/30"
                        >
                          <option value="none_free_match">None / Free Match (50 sq.ft coverage)</option>
                          <option value="straight_match">Straight Match (47 sq.ft coverage)</option>
                          <option value="drop_match">Drop Match (45 sq.ft coverage standard)</option>
                          <option value="random_match">Large Abstract (40 sq.ft coverage)</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-brand-espresso">
                          Coverage Per Roll (sq.ft)
                        </label>
                        <Input
                          type="number"
                          value={wallpaperUsableCoverage}
                          onChange={(e) => setWallpaperUsableCoverage(Math.max(1, Number(e.target.value)))}
                          className="text-xs h-9 bg-white border-brand-gold/30"
                        />
                      </div>
                    </div>

                    <div className="pt-2 border-t border-brand-gold/15">
                      <label className="inline-flex items-center gap-2 text-xs font-semibold text-brand-espresso cursor-pointer">
                        <input
                          type="checkbox"
                          checked={wallpaperIncludeInstall}
                          onChange={(e) => setWallpaperIncludeInstall(e.target.checked)}
                          className="rounded border-brand-gold/40 text-brand-gold focus:ring-brand-gold w-4 h-4"
                        />
                        <span>Include Professional Installation & Pasting (₹20/sq.ft)</span>
                      </label>
                    </div>

                    {/* Wallpaper Picker */}
                    <div className="pt-2 border-t border-brand-gold/15 space-y-2">
                      <label className="text-xs font-semibold text-brand-espresso">
                        Select Wallpaper Roll (or Enter Custom Rate)
                      </label>
                      <select
                        value={selectedWallpaperId}
                        onChange={(e) => {
                          setSelectedWallpaperId(e.target.value);
                          const p = wallpapers.find((f) => f.id === e.target.value);
                          if (p) setCustomWallpaperRollPrice(p.pricePerUnitPaise / 100);
                        }}
                        className="w-full text-xs h-9 px-3 rounded-card bg-white border border-brand-gold/30"
                      >
                        {wallpapers.map((w) => (
                          <option key={w.id} value={w.id}>
                            {w.name} — ₹{w.pricePerUnitPaise / 100}/roll
                          </option>
                        ))}
                      </select>

                      <div className="flex items-center gap-2 pt-1">
                        <span className="text-[11px] text-brand-charcoal/70">Rate per roll (₹):</span>
                        <Input
                          type="number"
                          value={customWallpaperRollPrice}
                          onChange={(e) => setCustomWallpaperRollPrice(Math.max(1, Number(e.target.value)))}
                          className="w-32 text-xs h-8 bg-white border-brand-gold/30"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* --- C. UPHOLSTERY DYNAMIC FORM --- */}
                {selectedProductType === 'upholstery' && (
                  <div className="space-y-4 pt-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-brand-espresso">
                          Furniture Type
                        </label>
                        <select
                          value={upholsteryFurnitureType}
                          onChange={(e) => {
                            const val = e.target.value as FurnitureType;
                            setUpholsteryFurnitureType(val);
                            if (val === 'armchair_1_seater') setUpholsterySeatCount(1);
                            if (val === 'loveseat_2_seater') setUpholsterySeatCount(2);
                            if (val === 'sofa_3_seater') setUpholsterySeatCount(3);
                            if (val === 'sectional_5_seater') setUpholsterySeatCount(5);
                          }}
                          className="w-full text-xs h-9 px-3 rounded-card bg-white border border-brand-gold/30"
                        >
                          <option value="sofa_3_seater">3-Seater Sofa (12m fabric, ₹3,800 labor)</option>
                          <option value="loveseat_2_seater">2-Seater Loveseat (8.5m fabric, ₹2,800 labor)</option>
                          <option value="armchair_1_seater">1-Seater Armchair (4.5m fabric, ₹1,500 labor)</option>
                          <option value="sectional_5_seater">L-Shape Sectional (20m fabric, ₹6,500 labor)</option>
                          <option value="dining_chair_full">Dining Chair (Full) (1.5m fabric, ₹850 labor)</option>
                          <option value="dining_chair_seat_only">Dining Chair (Seat Only) (0.8m, ₹450 labor)</option>
                          <option value="bed_headboard">Bed Headboard (4.5m fabric, ₹2,800 labor)</option>
                          <option value="ottoman_footstool">Ottoman Footstool (2m fabric, ₹1,000 labor)</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-brand-espresso">
                          Seat Count Multiplier
                        </label>
                        <Input
                          type="number"
                          value={upholsterySeatCount}
                          onChange={(e) => setUpholsterySeatCount(Math.max(1, Number(e.target.value)))}
                          min={1}
                          className="text-xs h-9 bg-white border-brand-gold/30"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-brand-espresso">
                          Custom Fabric Override (m)
                        </label>
                        <Input
                          type="number"
                          step="0.5"
                          value={upholsteryCustomMeters || ''}
                          onChange={(e) =>
                            setUpholsteryCustomMeters(
                              e.target.value ? Math.max(0, Number(e.target.value)) : undefined
                            )
                          }
                          placeholder="Auto calculated if empty"
                          className="text-xs h-9 bg-white border-brand-gold/30"
                        />
                      </div>
                    </div>

                    {/* Foam Replacement */}
                    <div className="pt-2 border-t border-brand-gold/15 space-y-2">
                      <label className="inline-flex items-center gap-2 text-xs font-semibold text-brand-espresso cursor-pointer">
                        <input
                          type="checkbox"
                          checked={upholsteryIncludeFoam}
                          onChange={(e) => setUpholsteryIncludeFoam(e.target.checked)}
                          className="rounded border-brand-gold/40 text-brand-gold focus:ring-brand-gold w-4 h-4"
                        />
                        <span>Include High Density Foam Revamp</span>
                      </label>

                      {upholsteryIncludeFoam && (
                        <div className="pl-6">
                          <label className="text-[11px] font-semibold text-brand-espresso block mb-1">
                            Foam Replacement Grade
                          </label>
                          <select
                            value={upholsteryFoamGrade}
                            onChange={(e) => setUpholsteryFoamGrade(e.target.value as FoamGrade)}
                            className="text-xs h-8 px-2 rounded-card bg-white border border-brand-gold/30"
                          >
                            <option value="hd_40_density">40D Super HD Foam (₹2,500/seat)</option>
                            <option value="standard_32_density">32D Standard HD Foam (₹1,500/seat)</option>
                            <option value="latex_orthopedic_layer">Latex Orthopedic Layer (₹3,800/seat)</option>
                          </select>
                        </div>
                      )}
                    </div>

                    {/* Upholstery Fabric Picker */}
                    <div className="pt-2 border-t border-brand-gold/15 space-y-2">
                      <label className="text-xs font-semibold text-brand-espresso">
                        Select Upholstery Fabric (or Enter Custom Rate)
                      </label>
                      <select
                        value={selectedUpholsteryFabricId}
                        onChange={(e) => {
                          setSelectedUpholsteryFabricId(e.target.value);
                          const p = upholsteryFabrics.find((f) => f.id === e.target.value);
                          if (p) setCustomUpholsteryFabricPrice(p.pricePerUnitPaise / 100);
                        }}
                        className="w-full text-xs h-9 px-3 rounded-card bg-white border border-brand-gold/30"
                      >
                        {upholsteryFabrics.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name} — ₹{u.pricePerUnitPaise / 100}/m
                          </option>
                        ))}
                      </select>

                      <div className="flex items-center gap-2 pt-1">
                        <span className="text-[11px] text-brand-charcoal/70">Rate per meter (₹):</span>
                        <Input
                          type="number"
                          value={customUpholsteryFabricPrice}
                          onChange={(e) => setCustomUpholsteryFabricPrice(Math.max(1, Number(e.target.value)))}
                          className="w-32 text-xs h-8 bg-white border-brand-gold/30"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentStep(3)}
                className="text-xs border-brand-gold/30"
              >
                <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                <span>Back</span>
              </Button>
              <Button
                onClick={() => setCurrentStep(5)}
                className="bg-brand-gold hover:bg-brand-gold-dark text-brand-espresso font-semibold text-xs gap-1.5 px-6 shadow-xs"
              >
                <span>View Digital Cutting Sheet & Quote</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          {/* Live Reactive Quote Card (1 col) */}
          <div className="space-y-4">
            <Card className="border-2 border-brand-gold/40 shadow-md bg-white sticky top-20">
              <CardHeader className="bg-brand-espresso text-white p-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-brand-gold tracking-wider">
                    Live Preliminary Quote
                  </span>
                  <Badge className="bg-brand-gold text-brand-espresso text-[10px] font-bold">
                    Pure Engine
                  </Badge>
                </div>
                <CardTitle className="text-lg font-bold font-display text-white mt-1">
                  {formatINR(liveQuote.grandTotalPaise, true)}
                </CardTitle>
                <CardDescription className="text-brand-ivory/70 text-[11px]">
                  Includes 18% GST (CGST 9% + SGST 9%)
                </CardDescription>
              </CardHeader>

              <CardContent className="p-4 space-y-3 text-xs">
                {/* Requirements Callout */}
                <div className="bg-brand-pearl p-2.5 rounded-card border border-brand-gold/20 text-brand-charcoal">
                  {selectedProductType === 'curtain' && (
                    <div>
                      <div className="font-bold text-brand-espresso">
                        Fabric: {(liveQuote as CurtainQuoteResult).fabricRequiredMeters} meters
                      </div>
                      <div className="text-[11px] text-brand-charcoal/70">
                        Cuts: {(liveQuote as CurtainQuoteResult).cutsNeeded} widths · Cut Drop: {((liveQuote as CurtainQuoteResult).cutDropLengthMeters * 100).toFixed(0)}cm
                      </div>
                    </div>
                  )}

                  {selectedProductType === 'wallpaper' && (
                    <div>
                      <div className="font-bold text-brand-espresso">
                        Rolls: {(liveQuote as WallpaperQuoteResult).rollsNeeded} rolls
                      </div>
                      <div className="text-[11px] text-brand-charcoal/70">
                        Area: {(liveQuote as WallpaperQuoteResult).wallAreaSqFt} sq.ft
                      </div>
                    </div>
                  )}

                  {selectedProductType === 'upholstery' && (
                    <div>
                      <div className="font-bold text-brand-espresso">
                        Fabric: {(liveQuote as UpholsteryQuoteResult).totalFabricMeters} meters
                      </div>
                      <div className="text-[11px] text-brand-charcoal/70">
                        Seats: {upholsterySeatCount} unit{upholsterySeatCount === 1 ? '' : 's'}
                      </div>
                    </div>
                  )}
                </div>

                {/* Itemized Line Costs */}
                <div className="space-y-1.5 pt-1">
                  {liveQuote.breakdown.itemizedSummary?.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-brand-charcoal">
                      <span className="line-clamp-1 text-[11px]">{item.label}</span>
                      <span className="font-semibold text-brand-espresso shrink-0">
                        {formatINR(item.amountPaise, true)}
                      </span>
                    </div>
                  ))}

                  <div className="pt-2 border-t border-brand-gold/15 flex items-center justify-between font-semibold text-brand-charcoal">
                    <span>Subtotal:</span>
                    <span>{formatINR(liveQuote.breakdown.subtotalPaise, true)}</span>
                  </div>

                  <div className="flex items-center justify-between text-brand-charcoal/80 text-[11px]">
                    <span>CGST (9%):</span>
                    <span>{formatINR(liveQuote.gst.cgstPaise, true)}</span>
                  </div>

                  <div className="flex items-center justify-between text-brand-charcoal/80 text-[11px]">
                    <span>SGST (9%):</span>
                    <span>{formatINR(liveQuote.gst.sgstPaise, true)}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-brand-gold/30">
                  <Button
                    onClick={() => setCurrentStep(5)}
                    className="w-full bg-brand-gold hover:bg-brand-gold-dark text-brand-espresso font-semibold text-xs h-9 shadow-xs"
                  >
                    <span>Proceed to Digital Sheet</span>
                    <ChevronRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* STEP 5: DIGITAL CUTTING SHEET & ORDER CONVERSION */}
      {currentStep === 5 && (
        <div className="space-y-6">
          <Card className="border border-brand-gold/30 shadow-md bg-white overflow-hidden">
            {/* Sheet Banner */}
            <div className="bg-brand-espresso text-white p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-brand-gold/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-card bg-brand-gold/20 flex items-center justify-center text-brand-gold">
                  <Scissors className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base sm:text-lg">
                    Workshop Digital Cutting Sheet
                  </h3>
                  <p className="text-xs text-brand-ivory/70">
                    Master Tailoring Instructions · Excellence The Furnishing Gallery
                  </p>
                </div>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-xs font-bold uppercase tracking-wider bg-brand-gold text-brand-espresso px-2.5 py-1 rounded">
                  Status: Ready for Tailoring
                </span>
              </div>
            </div>

            <CardContent className="p-6 space-y-6 text-xs">
              {/* Client & Room Details Box */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-card bg-brand-pearl/50 border border-brand-gold/20">
                <div>
                  <span className="text-[10px] uppercase font-bold text-brand-charcoal/60 block">Client</span>
                  <span className="font-bold text-brand-espresso text-sm">{client.name}</span>
                  <span className="text-[11px] text-brand-charcoal/70 block">+91 {client.phone}</span>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-brand-charcoal/60 block">Installation Room</span>
                  <span className="font-bold text-brand-espresso text-sm">{currentRoom?.name}</span>
                  <span className="text-[11px] text-brand-charcoal/70 block capitalize">
                    {currentRoom?.type.replace(/_/g, ' ')}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-brand-charcoal/60 block">Site Address</span>
                  <span className="font-medium text-brand-espresso line-clamp-2">
                    {client.siteAddress.street}, {client.siteAddress.city} — {client.siteAddress.pincode}
                  </span>
                </div>
              </div>

              {/* Technical Workshop Cutting Specifications */}
              <div className="space-y-3">
                <h4 className="font-bold text-xs uppercase tracking-wider text-brand-espresso border-b border-brand-gold/20 pb-1.5 flex items-center gap-2">
                  <Scissors className="w-4 h-4 text-brand-gold" />
                  <span>Workshop Cutting Measurements & Technical Specs</span>
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-4 rounded-card border border-brand-gold/15">
                  {selectedProductType === 'curtain' && (
                    <>
                      <div>
                        <span className="text-[10px] text-brand-charcoal/60 uppercase block">Finished Track Width</span>
                        <span className="font-bold text-brand-espresso text-sm">{curtainTrackWidthCm} cm</span>
                      </div>

                      <div>
                        <span className="text-[10px] text-brand-charcoal/60 uppercase block">Finished Drop Length</span>
                        <span className="font-bold text-brand-espresso text-sm">{curtainDropLengthCm} cm</span>
                      </div>

                      <div>
                        <span className="text-[10px] text-brand-charcoal/60 uppercase block">Cut Drop Allowance</span>
                        <span className="font-bold text-emerald-700 text-sm">{curtainDropLengthCm + 30} cm</span>
                        <span className="text-[10px] text-brand-charcoal/60 block">(+30cm double bottom hem & fold)</span>
                      </div>

                      <div>
                        <span className="text-[10px] text-brand-charcoal/60 uppercase block">Widths / Cuts Needed</span>
                        <span className="font-bold text-brand-espresso text-sm">
                          {(liveQuote as CurtainQuoteResult).cutsNeeded} Vertical Widths
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] text-brand-charcoal/60 uppercase block">Heading Pleat</span>
                        <span className="font-bold text-brand-espresso capitalize">{curtainHeadingStyle.replace(/_/g, ' ')}</span>
                      </div>

                      <div>
                        <span className="text-[10px] text-brand-charcoal/60 uppercase block">Lining Layer</span>
                        <span className="font-bold text-brand-espresso capitalize">{curtainLiningType}</span>
                      </div>

                      <div>
                        <span className="text-[10px] text-brand-charcoal/60 uppercase block">Panel Arrangement</span>
                        <span className="font-bold text-brand-espresso">
                          {curtainPanels === 2 ? 'Pair (2 Panels Split)' : 'Single Draw (1 Panel)'}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] text-brand-charcoal/60 uppercase block">Fabric Required</span>
                        <span className="font-bold text-brand-gold-dark text-sm">
                          {(liveQuote as CurtainQuoteResult).fabricRequiredMeters} Meters
                        </span>
                      </div>
                    </>
                  )}

                  {selectedProductType === 'wallpaper' && (
                    <>
                      <div>
                        <span className="text-[10px] text-brand-charcoal/60 uppercase block">Wall Dimensions</span>
                        <span className="font-bold text-brand-espresso text-sm">{wallpaperWidthFt}ft × {wallpaperHeightFt}ft</span>
                      </div>

                      <div>
                        <span className="text-[10px] text-brand-charcoal/60 uppercase block">Total Wall Area</span>
                        <span className="font-bold text-brand-espresso text-sm">{(liveQuote as WallpaperQuoteResult).wallAreaSqFt} sq.ft</span>
                      </div>

                      <div>
                        <span className="text-[10px] text-brand-charcoal/60 uppercase block">Pattern Repeat Match</span>
                        <span className="font-bold text-brand-espresso capitalize">{wallpaperPatternRepeat.replace(/_/g, ' ')}</span>
                      </div>

                      <div>
                        <span className="text-[10px] text-brand-charcoal/60 uppercase block">Rolls Required</span>
                        <span className="font-bold text-brand-gold-dark text-sm">{(liveQuote as WallpaperQuoteResult).rollsNeeded} Rolls</span>
                      </div>
                    </>
                  )}

                  {selectedProductType === 'upholstery' && (
                    <>
                      <div>
                        <span className="text-[10px] text-brand-charcoal/60 uppercase block">Furniture Model</span>
                        <span className="font-bold text-brand-espresso text-sm capitalize">{upholsteryFurnitureType.replace(/_/g, ' ')}</span>
                      </div>

                      <div>
                        <span className="text-[10px] text-brand-charcoal/60 uppercase block">Seat Count</span>
                        <span className="font-bold text-brand-espresso text-sm">{upholsterySeatCount} Seats</span>
                      </div>

                      <div>
                        <span className="text-[10px] text-brand-charcoal/60 uppercase block">Foam Replacement</span>
                        <span className="font-bold text-brand-espresso capitalize">
                          {upholsteryIncludeFoam ? upholsteryFoamGrade.replace(/_/g, ' ') : 'None'}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] text-brand-charcoal/60 uppercase block">Fabric Required</span>
                        <span className="font-bold text-brand-gold-dark text-sm">{(liveQuote as UpholsteryQuoteResult).totalFabricMeters} Meters</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Itemized Cost Breakdown */}
              <div className="space-y-3">
                <h4 className="font-bold text-xs uppercase tracking-wider text-brand-espresso border-b border-brand-gold/20 pb-1.5 flex items-center gap-2">
                  <IndianRupee className="w-4 h-4 text-brand-gold" />
                  <span>Itemized Financial Quote & GST Breakdown</span>
                </h4>

                <div className="bg-brand-pearl/40 p-4 rounded-card border border-brand-gold/20 space-y-2">
                  {liveQuote.breakdown.itemizedSummary?.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between py-1 border-b border-brand-gold/10 last:border-b-0">
                      <span className="text-brand-charcoal">{item.label}</span>
                      <span className="font-semibold text-brand-espresso">{formatINR(item.amountPaise, true)}</span>
                    </div>
                  ))}

                  <div className="pt-2 mt-2 border-t border-brand-gold/20 flex items-center justify-between font-semibold text-brand-charcoal">
                    <span>Taxable Value (Subtotal):</span>
                    <span>{formatINR(liveQuote.breakdown.subtotalPaise, true)}</span>
                  </div>

                  <div className="flex items-center justify-between text-brand-charcoal/80 text-[11px]">
                    <span>Central GST (CGST 9%):</span>
                    <span>{formatINR(liveQuote.gst.cgstPaise, true)}</span>
                  </div>

                  <div className="flex items-center justify-between text-brand-charcoal/80 text-[11px]">
                    <span>State GST (SGST 9%):</span>
                    <span>{formatINR(liveQuote.gst.sgstPaise, true)}</span>
                  </div>

                  <div className="pt-3 border-t border-brand-gold/30 flex items-center justify-between text-base font-bold text-brand-espresso">
                    <span>Grand Total (All Inclusive):</span>
                    <span className="font-display text-lg text-brand-gold-dark">
                      {formatINR(liveQuote.grandTotalPaise, true)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>

            {/* Bottom Actions Bar */}
            <div className="p-5 bg-brand-pearl border-t border-brand-gold/20 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentStep(4)}
                  className="text-xs border-brand-gold/40 text-brand-espresso"
                >
                  <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                  <span>Adjust Specs</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.print()}
                  className="text-xs border-brand-gold/40 text-brand-espresso gap-1"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Sheet</span>
                </Button>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  onClick={handleSaveMeasurement}
                  disabled={savingMeasurement}
                  variant="outline"
                  className="border-brand-gold text-brand-gold-dark hover:bg-brand-gold hover:text-white font-semibold text-xs gap-1.5 h-10 px-4"
                >
                  <Save className="w-4 h-4" />
                  <span>{savingMeasurement ? 'Saving...' : 'Save Measurement'}</span>
                </Button>

                <Button
                  onClick={handleConvertToOrder}
                  disabled={convertingOrder}
                  className="bg-brand-espresso hover:bg-brand-gold hover:text-brand-espresso text-brand-ivory font-semibold text-xs gap-1.5 h-10 px-5 shadow-sm"
                >
                  <ShoppingBag className="w-4 h-4 text-brand-gold" />
                  <span>{convertingOrder ? 'Creating Order...' : 'Convert to Order (1-Click)'}</span>
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

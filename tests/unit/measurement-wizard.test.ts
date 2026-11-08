import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculateCurtainQuote,
  calculateWallpaperQuote,
  calculateUpholsteryQuote,
  calculateGST,
} from '@/lib/pricing/calculator';
import {
  CurtainConfig,
  WallpaperConfig,
  UpholsteryConfig,
  RoomMeasurement,
} from '@/types/measurement';
import { Order, OrderItem } from '@/types/order';
import {
  saveMeasurement,
  fetchMeasurementById,
  saveOrder,
  fetchOrderById,
  modifyMeasurement,
} from '@/lib/firebase/firestore';
import { mockDb } from '@/lib/firebase/mock-db';
import { formatINR, toPaise, toRupees } from '@/lib/utils';
import { DEFAULT_RATE_CARD } from '@/config/rate-cards';

describe('Dynamic Measurement Wizard & Pricing Engine (tests/unit/measurement-wizard.test.ts)', () => {
  beforeEach(() => {
    mockDb.reset();
  });

  describe('Curtain Dynamic Calculation & Cutting Sheet Generation', () => {
    it('accurately computes fabric meters, cuts needed, hem allowance, and lining surcharge', () => {
      const config: CurtainConfig = {
        type: 'curtain',
        trackWidthCm: 280,
        dropLengthCm: 260,
        fullnessRatio: 2.0,
        headingStyle: 'wave_s_fold',
        liningType: 'blackout',
        motorized: true,
        motorBrand: 'somfy',
        panels: 2,
        fabricWidthCm: 140,
      };

      const fabricPricePerMeter = 2200; // ₹2,200/m
      const quote = calculateCurtainQuote(config, fabricPricePerMeter);

      // Invariants:
      // Gathered width = 280 * 2.0 = 560cm
      // Cuts needed = ceil(560 / 140) = 4 widths
      expect(quote.cutsNeeded).toBe(4);

      // Cut drop length with 25cm hem allowance = (260 + 25) / 100 = 2.85m
      expect(quote.cutDropLengthMeters).toBe(2.85);

      // Raw meters = 4 * 2.85 = 11.4m -> rounded to nearest 0.25m = 11.5m
      expect(quote.fabricRequiredMeters).toBe(11.5);

      // Fabric cost = 11.5 * 2200 = ₹25,300 (2,530,000 paise)
      expect(quote.fabricCostPaise).toBe(2530000);

      // Stitching cost for Wave/S-Fold = 11.5 * 280 = ₹3,220 (322,000 paise)
      expect(quote.stitchingCostPaise).toBe(322000);

      // Blackout lining = 11.5 * 350 = ₹4,025 (402,500 paise)
      expect(quote.liningCostPaise).toBe(402500);

      // Dual-layer stitching surcharge (40% of stitching cost) = 322,000 * 0.40 = 128,800 paise (₹1,288)
      expect(quote.liningSurchargePaise).toBe(128800);

      // Somfy motorization for track <= 300cm = ₹12,500 (1,250,000 paise)
      expect(quote.motorCostPaise).toBe(1250000);

      // Subtotal = 25,300 + 3,220 + 4,025 + 1,288 + 12,500 = ₹46,333 (4,633,300 paise)
      expect(quote.subtotalPaise).toBe(4633300);

      // GST at 18% (CGST 9% + SGST 9%)
      const gst = calculateGST(quote.subtotalPaise, false, 18);
      expect(gst.isInterState).toBe(false);
      expect(gst.totalTaxPaise).toBe(Math.round(4633300 * 0.18)); // 833,994 paise = ₹8,339.94
      expect(gst.cgstPaise + gst.sgstPaise).toBe(gst.totalTaxPaise);

      // Grand Total = 46,333 + 8,339.94 = ₹54,672.94
      const grandTotalPaise = quote.subtotalPaise + gst.totalTaxPaise;
      expect(grandTotalPaise).toBe(5467294);
    });

    it('handles unlined and manual tracks without surcharges or motor fees', () => {
      const config: CurtainConfig = {
        type: 'curtain',
        trackWidthCm: 150,
        dropLengthCm: 210,
        fullnessRatio: 1.5,
        headingStyle: 'eyelet',
        liningType: 'unlined',
        motorized: false,
        panels: 1,
      };

      const quote = calculateCurtainQuote(config, 850);
      expect(quote.liningCostPaise).toBe(0);
      expect(quote.liningSurchargePaise).toBe(0);
      expect(quote.motorCostPaise).toBe(0);
      expect(quote.subtotalPaise).toBe(quote.fabricCostPaise + quote.stitchingCostPaise);
    });
  });

  describe('Wallpaper Dynamic Calculation & Roll Estimation', () => {
    it('calculates wall area, roll requirements with ceiling rounding, and installation charges', () => {
      const config: WallpaperConfig = {
        type: 'wallpaper',
        wallWidthFt: 14.5,
        wallHeightFt: 9.5,
        patternRepeatType: 'straight_match', // 47 sq.ft coverage per roll
        includeInstallation: true,
      };

      const rollPrice = 3600; // ₹3,600 / roll
      const quote = calculateWallpaperQuote(config, rollPrice);

      // Wall area = 14.5 * 9.5 = 137.75 sq.ft
      expect(quote.wallAreaSqFt).toBe(137.75);

      // Rolls needed = ceil(137.75 / 47) = 3 rolls (47*3 = 141 sq.ft)
      expect(quote.rollsNeeded).toBe(3);

      // Material cost = 3 * 3600 = ₹10,800 (1,080,000 paise)
      expect(quote.materialCostPaise).toBe(1080000);

      // Installation cost = 137.75 * 20 = ₹2,755 (275,500 paise)
      expect(quote.installationCostPaise).toBe(275500);

      // Subtotal = 10,800 + 2,755 = ₹13,555 (1,355,500 paise)
      expect(quote.subtotalPaise).toBe(1355500);

      // GST = 18% of 13,555 = ₹2,439.90 (243,990 paise)
      const gst = calculateGST(quote.subtotalPaise, false, 18);
      expect(gst.totalTaxPaise).toBe(243990);
    });

    it('respects installation toggle checkbox (₹0 when excluded)', () => {
      const config: WallpaperConfig = {
        type: 'wallpaper',
        wallWidthFt: 10,
        wallHeightFt: 10,
        patternRepeatType: 'none_free_match',
        includeInstallation: false,
      };

      const quote = calculateWallpaperQuote(config, 2500);
      expect(quote.installationCostPaise).toBe(0);
      expect(quote.subtotalPaise).toBe(quote.materialCostPaise);
    });
  });

  describe('Sofa Upholstery Dynamic Calculation & Foam Tiers', () => {
    it('calculates 3-seater sofa upholstery with 40D Super HD foam replacement', () => {
      const config: UpholsteryConfig = {
        type: 'upholstery',
        furnitureType: 'sofa_3_seater',
        seatCount: 3,
        includeFoamReplacement: true,
        foamGrade: 'hd_40_density',
      };

      const fabricPricePerMeter = 1750; // ₹1,750/m
      const quote = calculateUpholsteryQuote(config, fabricPricePerMeter);

      // Invariants:
      // Standard 3-seater fabric meters = 12.0m
      expect(quote.totalFabricMeters).toBe(12.0);

      // Material cost = 12.0 * 1750 = ₹21,000 (2,100,000 paise)
      expect(quote.materialCostPaise).toBe(2100000);

      // Base labor charge for 3-seater sofa = ₹3,800 (380,000 paise)
      expect(quote.laborCostPaise).toBe(380000);

      // Foam cost = 3 seats * ₹2,500 = ₹7,500 (750,000 paise)
      expect(quote.foamCostPaise).toBe(750000);

      // Subtotal = 21,000 + 3,800 + 7,500 = ₹32,300 (3,230,000 paise)
      expect(quote.subtotalPaise).toBe(3230000);
    });

    it('supports custom fabric yardage override when client fabric requirements differ', () => {
      const config: UpholsteryConfig = {
        type: 'upholstery',
        furnitureType: 'armchair_1_seater',
        seatCount: 1,
        customFabricMeters: 6.5, // override from default 4.5m
        includeFoamReplacement: false,
      };

      const quote = calculateUpholsteryQuote(config, 1200);
      expect(quote.totalFabricMeters).toBe(6.5);
      expect(quote.materialCostPaise).toBe(Math.round(6.5 * 1200 * 100)); // 780,000 paise
      expect(quote.foamCostPaise).toBe(0);
    });
  });

  describe('1-Click Measurement-to-Order Conversion Pipeline', () => {
    it('saves a digital measurement and converts it into a valid sales order with linked items', async () => {
      // 1. Create and save a new measurement sheet
      const config: CurtainConfig = {
        type: 'curtain',
        trackWidthCm: 250,
        dropLengthCm: 240,
        fullnessRatio: 2.0,
        headingStyle: 'pinch_pleat_double',
        liningType: 'cotton',
        motorized: false,
        panels: 2,
      };

      const quote = calculateCurtainQuote(config, 1500);
      const gst = calculateGST(quote.subtotalPaise, false, 18);
      const grandTotalPaise = quote.subtotalPaise + gst.totalTaxPaise;

      const measurement: RoomMeasurement = {
        id: 'meas-test-bedroom-001',
        clientId: 'client-rajesh-sharma',
        roomId: 'room-rajesh-living',
        label: 'Master Bedroom Double Pinch Drapes',
        productType: 'curtain',
        configuration: config,
        productId: 'curt-velvet-royal-gold',
        productName: 'Royal Gold Heritage Velvet Drapery',
        unitPricePaise: 150000,
        breakdown: quote.breakdown,
        totalEstimatePaise: grandTotalPaise,
        isConvertedToOrder: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const savedMeas = await saveMeasurement(measurement);
      expect(savedMeas.id).toBe('meas-test-bedroom-001');

      // 2. Perform 1-Click Conversion to Order
      const orderId = 'order-test-2026-999';
      const orderNumber = 'EF-ORD-2026-9999';

      const orderItem: OrderItem = {
        id: 'item-meas-001',
        productId: savedMeas.productId,
        productName: savedMeas.productName,
        category: savedMeas.productType,
        quantity: savedMeas.breakdown.fabricRequiredMeters || 1,
        unit: 'meter',
        unitPricePaise: savedMeas.unitPricePaise,
        measurementId: savedMeas.id,
        configuration: savedMeas.configuration,
        lineTotalPaise: savedMeas.breakdown.subtotalPaise,
      };

      const newOrder: Order = {
        id: orderId,
        orderNumber,
        clientId: savedMeas.clientId,
        clientName: 'Mr. Rajesh Sharma',
        clientPhone: '9820112345',
        clientEmail: 'rajesh.sharma@example.com',
        items: [orderItem],
        subtotalPaise: savedMeas.breakdown.subtotalPaise,
        discountPaise: 0,
        gstBreakdown: gst,
        grandTotalPaise,
        paymentStatus: 'pending',
        paidAmountPaise: 0,
        balanceAmountPaise: grandTotalPaise,
        payments: [],
        status: 'draft',
        deliveryAddress: {
          street: 'Flat 1402, Oberoi Sky Heights',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400053',
          country: 'India',
        },
        internalNotes: `Auto-converted from measurement ${savedMeas.id}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const savedOrder = await saveOrder(newOrder);
      expect(savedOrder.id).toBe(orderId);
      expect(savedOrder.status).toBe('draft');
      expect(savedOrder.grandTotalPaise).toBe(grandTotalPaise);
      expect(savedOrder.items[0].measurementId).toBe('meas-test-bedroom-001');

      // 3. Mark measurement as converted
      await modifyMeasurement(savedMeas.id, {
        isConvertedToOrder: true,
        orderId,
      });

      const updatedMeas = await fetchMeasurementById(savedMeas.id);
      expect(updatedMeas?.isConvertedToOrder).toBe(true);
      expect(updatedMeas?.orderId).toBe(orderId);

      // 4. Verify order retrieval
      const fetchedOrder = await fetchOrderById(orderId);
      expect(fetchedOrder).not.toBeNull();
      expect(fetchedOrder?.items.length).toBe(1);
      expect(fetchedOrder?.items[0].lineTotalPaise).toBe(savedMeas.breakdown.subtotalPaise);
    });
  });
});

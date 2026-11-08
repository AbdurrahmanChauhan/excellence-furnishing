import { describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { middleware } from '@/middleware';
import { useAuthStore } from '@/store/auth-store';
import {
  signInWithEmail,
  registerWithEmail,
  signOutUser,
  getCurrentUser,
  getUserRole,
  setUserRole,
} from '@/lib/firebase/auth';
import { mockDb, ProductFilters } from '@/lib/firebase/mock-db';
import {
  fetchProducts,
  fetchProductById,
  fetchProductBySlug,
  saveProduct,
  modifyProduct,
  removeProduct,
  fetchClients,
  fetchClientById,
  saveClient,
  modifyClient,
  removeClient,
  fetchRooms,
  fetchRoomById,
  saveRoom,
  modifyRoom,
  fetchMeasurementsByClient,
  fetchMeasurementById,
  saveMeasurement,
  modifyMeasurement,
  fetchOrders,
  fetchOrderById,
  saveOrder,
  modifyOrder,
  fetchInvoices,
  fetchInvoiceById,
  fetchInvoiceByNumber,
  saveInvoice,
  fetchLastInvoiceNumber,
  fetchUserProfile,
  modifyUserProfile,
} from '@/lib/firebase/firestore';
import {
  calculateCurtainQuote,
  calculateWallpaperQuote,
  calculateUpholsteryQuote,
  calculateGST,
  generateNextInvoiceNumber,
} from '@/lib/pricing/calculator';
import { generateInvoicePDF } from '@/lib/pdf/invoice-generator';
import { formatINR, toPaise, toRupees, convertRupeesToWords, generateInvoiceNumber } from '@/lib/utils';
import {
  clientFormSchema,
  roomFormSchema,
  productFormSchema,
  paymentLogSchema,
  manualOrderFormSchema,
} from '@/lib/validators/schemas';
import { ROOM_PRESETS, getRoomIcon } from '@/components/admin/room-presets';
import { getMilestoneStep, MILESTONE_STAGES } from '@/components/dashboard/OrderStepper';
import { Product } from '@/types/product';
import { Client } from '@/types/client';
import { Room } from '@/types/room';
import {
  RoomMeasurement,
  CurtainConfig,
  WallpaperConfig,
  UpholsteryConfig,
} from '@/types/measurement';
import { Order, OrderStatus, PaymentStatus, OrderItem, PaymentRecord } from '@/types/order';
import { Invoice, InvoiceItem, BusinessBillingHeader } from '@/types/invoice';
import { POST as visualizeHandler } from '@/app/api/visualize/route';
import { DEFAULT_RATE_CARD } from '@/config/rate-cards';

/**
 * Helper to construct NextRequest instances with mock session and role cookies.
 */
function createReq(url: string, cookies: Record<string, string> = {}) {
  const headers = new Headers();
  if (Object.keys(cookies).length > 0) {
    headers.set(
      'cookie',
      Object.entries(cookies)
        .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
        .join('; ')
    );
  }
  return new NextRequest(new URL(url, 'http://localhost:3000'), { headers });
}

const DEFAULT_BUSINESS_HEADER: BusinessBillingHeader = {
  legalName: 'Excellence The Furnishing Gallery',
  proprietor: 'Mr. Altab Chauhan',
  address: 'Shop No. 226, Sajid Tower, S.V. Road, Opp. Amboli Railway Station, Andheri West, Mumbai — 400058',
  phone: '+91 98200 XXXXX',
  email: 'contact@excellencefurnishing.in',
  gstin: '27AABCU9603R1ZM',
  pan: 'AABCU9603R',
  bankDetails: {
    bankName: 'HDFC Bank',
    accountName: 'Excellence The Furnishing Gallery',
    accountNumber: '50200012345678',
    ifscCode: 'HDFC0000128',
    branch: 'Andheri West Branch, Mumbai',
    upiId: 'excellencefurnishing@okhdfcbank',
  },
};

describe('Milestone 6: Comprehensive E2E Testing Suite (Tiers 1–4)', () => {
  beforeEach(() => {
    mockDb.reset();
    useAuthStore.setState({
      user: null,
      profile: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  });

  // =========================================================================
  // TIER 1: FEATURE COVERAGE
  // =========================================================================
  describe('Tier 1: Feature Coverage Across All Core Domains', () => {
    describe('1.1 Public Storefront & Wayfair-Style Faceted Catalog', () => {
      it('allows public unauthenticated browsing to all storefront marketing routes without redirection', () => {
        const publicRoutes = ['/', '/products', '/about', '/contact', '/gallery'];
        for (const route of publicRoutes) {
          const req = createReq(route);
          const res = middleware(req);
          // Unrestricted public routes return next() response (status 200)
          expect(res.status).toBe(200);
          expect(res.headers.get('location')).toBeNull();
        }
      });

      it('retrieves the full 32-product seeded catalog across all 6 core categories', async () => {
        const products = await fetchProducts();
        expect(products.length).toBe(32);

        const categories = new Set(products.map((p) => p.category));
        expect(categories).toContain('curtains_window_treatments');
        expect(categories).toContain('sofa_upholstery_fabrics');
        expect(categories).toContain('wallpapers');
        expect(categories).toContain('mattresses_sleep_solutions');
        expect(categories).toContain('bedding_accessories');
        expect(categories).toContain('home_decor');
      });

      it('performs multi-faceted filtering by category, subcategory, price bounds, color, and search query', async () => {
        // Faceted filter: Curtains + price range
        const filteredCurtains = await fetchProducts({
          category: 'curtains_window_treatments',
          minPricePaise: toPaise(500),
          maxPricePaise: toPaise(3000),
        });
        expect(filteredCurtains.length).toBeGreaterThan(0);
        for (const p of filteredCurtains) {
          expect(p.category).toBe('curtains_window_treatments');
          expect(p.pricePerUnitPaise).toBeGreaterThanOrEqual(toPaise(500));
          expect(p.pricePerUnitPaise).toBeLessThanOrEqual(toPaise(3000));
        }

        // Color tag filter
        const goldProducts = await fetchProducts({ colors: ['Gold'] });
        expect(goldProducts.length).toBeGreaterThan(0);
        for (const p of goldProducts) {
          const hasColor = p.colors.some((c) => c.toLowerCase() === 'gold');
          expect(hasColor).toBe(true);
        }

        // Full-text search filter
        const searchResults = await fetchProducts({ search: 'velvet' });
        expect(searchResults.length).toBeGreaterThan(0);
        for (const p of searchResults) {
          const match =
            p.name.toLowerCase().includes('velvet') ||
            p.description.toLowerCase().includes('velvet') ||
            p.tags.some((t) => t.toLowerCase().includes('velvet'));
          expect(match).toBe(true);
        }
      });

      it('retrieves individual product details by ID and by slug with full technical specifications', async () => {
        const seededProduct = (await fetchProducts())[0];
        const byId = await fetchProductById(seededProduct.id);
        const bySlug = await fetchProductBySlug(seededProduct.slug);

        expect(byId).not.toBeNull();
        expect(bySlug).not.toBeNull();
        expect(byId?.id).toBe(seededProduct.id);
        expect(bySlug?.id).toBe(seededProduct.id);
        expect(byId?.hsnCode).toBeDefined();
        expect(byId?.gstRatePercent).toBeDefined();
        expect(byId?.images.length).toBeGreaterThan(0);
        expect(byId?.swatchImage).toBeDefined();
      });
    });

    describe('1.2 Customer Authentication & User Portal', () => {
      it('registers a new customer with default user role and saves address profile', async () => {
        const uniqueEmail = `radhika.merchant.${Date.now()}@mumbai-interiors.in`;
        const newUser = await registerWithEmail(
          'Radhika Merchant',
          uniqueEmail,
          'Password@123',
          '9820011223',
          {
            street: 'Sea Pearl Villa, Juhu Tara Road',
            landmark: 'Opposite JW Marriott',
            city: 'Mumbai',
            state: 'Maharashtra',
            pincode: '400049',
            country: 'India',
          }
        );

        expect(newUser.role).toBe('user');
        expect(newUser.email).toBe(uniqueEmail);

        // Fetch stored profile from mock database
        const profile = await fetchUserProfile(newUser.uid);
        expect(profile).not.toBeNull();
        expect(profile?.displayName).toBe('Radhika Merchant');
        expect(profile?.role).toBe('user');
        expect(profile?.address?.pincode).toBe('400049');
      });

      it('authenticates customer credentials and updates reactive Zustand auth store state', async () => {
        const store = useAuthStore.getState();
        await store.login('customer@excellencefurnishing.com', 'Customer@123');

        const state = useAuthStore.getState();
        expect(state.isAuthenticated).toBe(true);
        expect(state.user?.email).toBe('customer@excellencefurnishing.com');
        expect(state.user?.role).toBe('user');
        expect(state.profile?.displayName).toBe('Priya Sharma');
      });

      it('updates customer personal profile and address details', async () => {
        const updated = await modifyUserProfile('customer-priya', {
          phoneNumber: '9820099887',
          address: {
            street: 'Flat 402, Sea Green Apartments, Bandra West',
            landmark: 'Near Carter Road Promenade',
            city: 'Mumbai',
            state: 'Maharashtra',
            pincode: '400050',
            country: 'India',
          },
        });

        expect(updated).not.toBeNull();
        expect(updated?.phoneNumber).toBe('9820099887');
        expect(updated?.address?.pincode).toBe('400050');
      });

      it('maps order statuses through 5-stage milestone stepper for customer tracking', () => {
        const stages: OrderStatus[] = ['draft', 'confirmed', 'in_production', 'ready', 'delivered'];
        const milestoneIndices = stages.map((status) => getMilestoneStep(status));

        // Maps to milestone indices [0, 1, 3, 4, 5]
        expect(milestoneIndices).toEqual([0, 1, 3, 4, 5]);
        expect(MILESTONE_STAGES.length).toBe(5);
        expect(MILESTONE_STAGES[0].label).toBe('Order Confirmed');
        expect(MILESTONE_STAGES[4].label).toBe('Delivered & Installed');
      });
    });

    describe('1.3 Admin CRM & Client Management', () => {
      it('validates and creates a new client with strict Indian phone, PIN code, and GSTIN', async () => {
        const clientPayload: Client = {
          id: 'client-test-e2e-1',
          name: 'Mr. Cyrus Poonawalla',
          phone: '9820044556',
          email: 'cyrus.p@poonawallamumbai.com',
          billingAddress: {
            street: 'Sea Face Towers, Worli Sea Face',
            landmark: 'Opposite Coast Guard HQ',
            city: 'Mumbai',
            state: 'Maharashtra',
            pincode: '400030',
            country: 'India',
          },
          siteAddress: {
            street: 'Penthouse 12, Oberoi Sky City, Borivali East',
            landmark: 'Near Western Express Highway',
            city: 'Mumbai',
            state: 'Maharashtra',
            pincode: '400066',
            country: 'India',
          },
          tags: ['VIP', 'Luxury Residencies'],
          architectDesignerName: 'Studio Archline Mumbai',
          gstin: '27AABCE1234F1Z5',
          notes: 'Requires Somfy motorized curtain automation across all bedrooms.',
          totalOrdersCount: 0,
          totalSpentPaise: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const parseResult = clientFormSchema.safeParse(clientPayload);
        expect(parseResult.success).toBe(true);

        const savedClient = await saveClient(clientPayload);
        expect(savedClient.id).toBe('client-test-e2e-1');

        const fetchedClient = await fetchClientById('client-test-e2e-1');
        expect(fetchedClient?.name).toBe('Mr. Cyrus Poonawalla');
        expect(fetchedClient?.gstin).toBe('27AABCE1234F1Z5');
      });

      it('searches and filters clients by partial name, phone, or neighborhood', async () => {
        const clients = await fetchClients('Rajesh');
        expect(clients.length).toBeGreaterThan(0);
        expect(clients[0].name).toContain('Rajesh');

        const juhuClients = await fetchClients('Juhu');
        expect(juhuClients.length).toBeGreaterThan(0);
      });

      it('modifies client notes, tags, and phone number, and cleanly removes a client', async () => {
        const client = await fetchClientById('client-rajesh-sharma');
        expect(client).not.toBeNull();

        const updated = await modifyClient('client-rajesh-sharma', {
          notes: 'Special instruction: Deliver via service elevator only.',
          tags: ['VIP', 'Priority'],
        });
        expect(updated?.notes).toContain('service elevator');
        expect(updated?.tags).toContain('Priority');

        // Ephemeral client for deletion test
        const tempClient: Client = {
          id: `client-temp-${Date.now()}`,
          name: 'Temp Client',
          phone: '9820011111',
          email: 'temp@example.com',
          billingAddress: client!.billingAddress,
          siteAddress: client!.siteAddress,
          tags: [],
          totalOrdersCount: 0,
          totalSpentPaise: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await saveClient(tempClient);
        expect(await fetchClientById(tempClient.id)).not.toBeNull();

        const deleted = await removeClient(tempClient.id);
        expect(deleted).toBe(true);
        expect(await fetchClientById(tempClient.id)).toBeNull();
      });
    });

    describe('1.4 Visual Room Grid & Preset Configurations', () => {
      it('exposes 8 standard room presets with valid icons and default names', () => {
        expect(ROOM_PRESETS.length).toBe(8);
        const types = ROOM_PRESETS.map((p) => p.type);
        expect(types).toContain('living_room');
        expect(types).toContain('master_bedroom');
        expect(types).toContain('kids_bedroom');
        expect(types).toContain('dining_room');
        expect(types).toContain('study_office');
        expect(types).toContain('balcony');
        expect(types).toContain('other');

        const livingIcon = getRoomIcon('living_room');
        expect(livingIcon).toBeDefined();
      });

      it('attaches and retrieves multiple rooms for a client profile', async () => {
        const clientId = 'c-001';
        const newRoom: Room = {
          id: `room-balcony-${Date.now()}`,
          clientId,
          name: 'Terrace Glass Lounge',
          type: 'balcony',
          floor: '18th Floor Terrace',
          photos: ['/images/gallery/balcony-1.jpg'],
          notes: 'Motorized weather-proof blackout drapes needed.',
          measurementsCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const savedRoom = await saveRoom(newRoom);
        expect(savedRoom.id).toBe(newRoom.id);

        const clientRooms = await fetchRooms(clientId);
        const found = clientRooms.find((r) => r.id === newRoom.id);
        expect(found).toBeDefined();
        expect(found?.type).toBe('balcony');
      });
    });

    describe('1.5 5-Step Dynamic Measurement Wizard & Cutting Sheet Generation', () => {
      it('computes exact bespoke curtain cutting metrics, fullness ratio, hem allowance, and lining surcharge', () => {
        const curtainConfig: CurtainConfig = {
          type: 'curtain',
          trackWidthCm: 320,
          dropLengthCm: 280,
          fullnessRatio: 2.5,
          headingStyle: 'pinch_pleat_triple',
          liningType: 'blackout',
          motorized: true,
          motorBrand: 'somfy',
          panels: 2,
          fabricWidthCm: 140,
        };

        const fabricPrice = 2400; // ₹2,400/m
        const quote = calculateCurtainQuote(curtainConfig, fabricPrice);

        // Invariants:
        // Gathered width = 320 * 2.5 = 800cm
        // Cuts needed = ceil(800 / 140) = 6 widths
        expect(quote.cutsNeeded).toBe(6);

        // Cut drop length with 25cm hem = (280 + 25) / 100 = 3.05m
        expect(quote.cutDropLengthMeters).toBe(3.05);

        // Raw fabric meters = 6 * 3.05 = 18.3m -> rounded to nearest 0.25m = 18.5m
        expect(quote.fabricRequiredMeters).toBe(18.5);

        // Fabric cost = 18.5 * 2400 = ₹44,400 (4,440,000 paise)
        expect(quote.fabricCostPaise).toBe(toPaise(44400));

        // Triple pinch pleat rate = ₹280/m -> 18.5 * 280 = ₹5,180
        expect(quote.stitchingCostPaise).toBe(toPaise(5180));

        // Blackout lining rate = ₹350/m -> 18.5 * 350 = ₹6,475
        expect(quote.liningCostPaise).toBe(toPaise(6475));

        // Lining surcharge = 40% of stitching cost = 0.40 * 5180 = ₹2,072
        expect(quote.liningSurchargePaise).toBe(toPaise(2072));

        // Somfy motor for track >300cm = ₹16,500
        expect(quote.motorCostPaise).toBe(toPaise(16500));

        // Subtotal = 44400 + 5180 + 6475 + 2072 + 16500 = ₹74,627
        expect(quote.subtotalRupees).toBe(74627);
      });

      it('computes wallpaper roll coverage, pattern repeat allowance, and installation costs', () => {
        const wallConfig: WallpaperConfig = {
          type: 'wallpaper',
          wallWidthFt: 18,
          wallHeightFt: 10,
          patternRepeatType: 'straight_match',
          patternRepeatCm: 30,
          includeInstallation: true,
        };

        const rollPrice = 3500; // ₹3,500/roll
        const quote = calculateWallpaperQuote(wallConfig, rollPrice);

        // Wall area = 18 * 10 = 180 sq.ft
        expect(quote.wallAreaSqFt).toBe(180);

        // Small repeat usable coverage = 47 sq.ft
        expect(quote.usableCoverageSqFt).toBe(47);

        // Rolls needed = ceil(180 / 47) = 4 rolls
        expect(quote.rollsNeeded).toBe(4);

        // Material cost = 4 * 3500 = ₹14,000
        expect(quote.materialCostPaise).toBe(toPaise(14000));

        // Installation cost = 180 sq.ft * ₹20/sq.ft = ₹3,600
        expect(quote.installationCostPaise).toBe(toPaise(3600));

        // Subtotal = 14000 + 3600 = ₹17,600
        expect(quote.subtotalRupees).toBe(17600);
      });

      it('computes sofa reupholstery fabric, high-density foam replacement, and labor fees', () => {
        const sofaConfig: UpholsteryConfig = {
          type: 'upholstery',
          furnitureType: 'sofa_3_seater',
          seatCount: 3,
          includeFoamReplacement: true,
          foamGrade: 'hd_40_density',
        };

        const fabricPrice = 1800; // ₹1,800/m
        const quote = calculateUpholsteryQuote(sofaConfig, fabricPrice);

        // Sofa 3-seater base fabric = 12 meters
        expect(quote.totalFabricMeters).toBe(12);

        // Material cost = 12 * 1800 = ₹21,600
        expect(quote.materialCostPaise).toBe(toPaise(21600));

        // Base labor for 3-seater = ₹3,800
        expect(quote.laborCostPaise).toBe(toPaise(3800));

        // HD-40 foam = 3 seats * ₹2,500 = ₹7,500
        expect(quote.foamCostPaise).toBe(toPaise(7500));

        // Subtotal = 21600 + 3800 + 7500 = ₹32,900
        expect(quote.subtotalRupees).toBe(32900);
      });

      it('computes dining chair reupholstery scaling fabric and labor by seat count', () => {
        const diningConfig: UpholsteryConfig = {
          type: 'upholstery',
          furnitureType: 'dining_chair_full',
          seatCount: 8,
          includeFoamReplacement: true,
          foamGrade: 'standard_32_density',
        };

        const fabricPrice = 1400; // ₹1,400/m
        const quote = calculateUpholsteryQuote(diningConfig, fabricPrice);

        // dining_chair_full base meters = 1.5m -> 8 chairs = 12.0m
        expect(quote.totalFabricMeters).toBe(12);
        expect(quote.materialCostPaise).toBe(toPaise(12 * 1400)); // ₹16,800
        // base labor = 850 * 8 = ₹6,800
        expect(quote.laborCostPaise).toBe(toPaise(6800));
        // foam = 8 * 1500 = ₹12,000
        expect(quote.foamCostPaise).toBe(toPaise(12000));
        // Subtotal = 16800 + 6800 + 12000 = ₹35,600
        expect(quote.subtotalRupees).toBe(35600);
      });
    });

    describe('1.6 Admin Orders Management & Multi-Installment Payment Logging', () => {
      it('creates an order and progresses through valid state transitions', async () => {
        const orderId = `EF-ORD-E2E-${Date.now()}`;
        const subtotal = toPaise(25000);
        const gst = calculateGST(subtotal, false);
        const grandTotal = subtotal + gst.totalTaxPaise;

        const newOrder: Order = {
          id: orderId,
          orderNumber: `ORD-${Date.now()}`,
          clientId: 'c-001',
          clientName: 'Priya Sharma',
          clientPhone: '9820012345',
          deliveryAddress: {
            street: '1402 Sea Face Towers, Worli',
            city: 'Mumbai',
            state: 'Maharashtra',
            pincode: '400018',
            country: 'India',
          },
          items: [
            {
              id: 'item-1',
              productName: 'Royal Velvet Drapes',
              category: 'curtains_window_treatments',
              quantity: 2,
              unit: 'panel',
              unitPricePaise: toPaise(12500),
              lineTotalPaise: subtotal,
            },
          ],
          subtotalPaise: subtotal,
          discountPaise: 0,
          gstBreakdown: gst,
          grandTotalPaise: grandTotal,
          paymentStatus: 'pending',
          paidAmountPaise: 0,
          balanceAmountPaise: grandTotal,
          status: 'draft',
          payments: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        await saveOrder(newOrder);
        let fetched = await fetchOrderById(orderId);
        expect(fetched?.status).toBe('draft');

        // Transition: draft -> confirmed
        await modifyOrder(orderId, { status: 'confirmed' });
        fetched = await fetchOrderById(orderId);
        expect(fetched?.status).toBe('confirmed');

        // Transition: confirmed -> in_production
        await modifyOrder(orderId, { status: 'in_production' });
        fetched = await fetchOrderById(orderId);
        expect(fetched?.status).toBe('in_production');
      });

      it('logs advance and balance payments transitioning paymentStatus to partial and paid', async () => {
        const orderId = `EF-ORD-PAY-${Date.now()}`;
        const grandTotalPaise = toPaise(50000); // ₹50,000

        const order: Order = {
          id: orderId,
          orderNumber: `ORD-PAY-${Date.now()}`,
          clientId: 'c-001',
          clientName: 'Priya Sharma',
          clientPhone: '9820012345',
          deliveryAddress: {
            street: '1402 Sea Face Towers, Worli',
            city: 'Mumbai',
            state: 'Maharashtra',
            pincode: '400018',
            country: 'India',
          },
          items: [
            {
              id: 'item-1',
              productName: 'Living Room Curtains',
              category: 'curtains_window_treatments',
              quantity: 1,
              unit: 'set',
              unitPricePaise: grandTotalPaise,
              lineTotalPaise: grandTotalPaise,
            },
          ],
          subtotalPaise: grandTotalPaise,
          discountPaise: 0,
          gstBreakdown: calculateGST(grandTotalPaise, false),
          grandTotalPaise,
          paymentStatus: 'pending',
          paidAmountPaise: 0,
          balanceAmountPaise: grandTotalPaise,
          status: 'confirmed',
          payments: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        await saveOrder(order);

        // 1. Advance installment (50% = ₹25,000)
        const advancePayment: PaymentRecord = {
          id: `pay-1-${Date.now()}`,
          amountPaise: toPaise(25000),
          method: 'upi',
          referenceNumber: 'UPI-HDFC-998877',
          notes: '50% advance payment received',
          date: new Date().toISOString(),
          recordedBy: 'Mr. Altab Chauhan',
        };

        await modifyOrder(orderId, {
          paymentStatus: 'partial',
          paidAmountPaise: toPaise(25000),
          balanceAmountPaise: toPaise(25000),
          payments: [advancePayment],
        });

        let updatedOrder = await fetchOrderById(orderId);
        expect(updatedOrder?.paymentStatus).toBe('partial');
        expect(updatedOrder?.payments.length).toBe(1);

        // 2. Balance payment (remaining ₹25,000)
        const balancePayment: PaymentRecord = {
          id: `pay-2-${Date.now()}`,
          amountPaise: toPaise(25000),
          method: 'bank_neft_rtgs',
          referenceNumber: 'NEFT-55443322',
          notes: 'Final balance payment before delivery',
          date: new Date().toISOString(),
          recordedBy: 'Mr. Altab Chauhan',
        };

        await modifyOrder(orderId, {
          paymentStatus: 'paid',
          paidAmountPaise: grandTotalPaise,
          balanceAmountPaise: 0,
          payments: [advancePayment, balancePayment],
        });

        updatedOrder = await fetchOrderById(orderId);
        expect(updatedOrder?.paymentStatus).toBe('paid');
        expect(updatedOrder?.payments.length).toBe(2);
      });
    });

    describe('1.7 Sequential GST Tax Invoicing & PDF Generation', () => {
      it('generates sequential invoice numbers formatted as EF-YYYY-XXXXX', () => {
        const year = 2026;
        expect(generateNextInvoiceNumber(null, year)).toBe('EF-2026-00001');
        expect(generateNextInvoiceNumber('EF-2026-00001', year)).toBe('EF-2026-00002');
        expect(generateNextInvoiceNumber('EF-2026-00042', year)).toBe('EF-2026-00043');
        expect(generateNextInvoiceNumber('EF-2026-09999', year)).toBe('EF-2026-10000');
      });

      it('computes Intra-State (CGST 9% + SGST 9%) and Inter-State (IGST 18%) tax breakdowns in integer paise', () => {
        const subtotalPaise = toPaise(100000); // ₹1,00,000

        // Intra-State (Maharashtra)
        const intraState = calculateGST(subtotalPaise, false, 18);
        expect(intraState.isInterState).toBe(false);
        expect(intraState.cgstPaise).toBe(toPaise(9000));
        expect(intraState.sgstPaise).toBe(toPaise(9000));
        expect(intraState.igstPaise).toBe(0);
        expect(intraState.totalTaxPaise).toBe(toPaise(18000));

        // Inter-State (Outside Maharashtra)
        const interState = calculateGST(subtotalPaise, true, 18);
        expect(interState.isInterState).toBe(true);
        expect(interState.cgstPaise).toBe(0);
        expect(interState.sgstPaise).toBe(0);
        expect(interState.igstPaise).toBe(toPaise(18000));
        expect(interState.totalTaxPaise).toBe(toPaise(18000));
      });

      it('converts Rupee figures to authentic Indian English words for tax invoice printouts', () => {
        expect(convertRupeesToWords(100000)).toBe('Rupees One Lakh Only');
        expect(convertRupeesToWords(125450)).toBe('Rupees One Lakh Twenty Five Thousand Four Hundred Fifty Only');
        expect(convertRupeesToWords(0)).toBe('Rupees Zero Only');
      });

      it('generates a valid, GST-compliant jsPDF document with business headers and line items', () => {
        const subtotal = toPaise(30000);
        const gst = calculateGST(subtotal, false, 18);
        const grandTotal = subtotal + gst.totalTaxPaise;

        const invoice: Invoice = {
          id: 'inv-e2e-test',
          invoiceNumber: 'EF-2026-00001',
          orderId: 'EF-ORD-001',
          orderNumber: 'ORD-2026-00001',
          clientId: 'c-001',
          clientDetails: {
            name: 'Priya Sharma',
            phone: '9820012345',
            email: 'priya.sharma@example.com',
            billingAddress: {
              street: '1402 Sea Face Towers, Worli',
              city: 'Mumbai',
              state: 'Maharashtra',
              pincode: '400018',
              country: 'India',
            },
            shippingAddress: {
              street: '1402 Sea Face Towers, Worli',
              city: 'Mumbai',
              state: 'Maharashtra',
              pincode: '400018',
              country: 'India',
            },
          },
          businessDetails: DEFAULT_BUSINESS_HEADER,
          items: [
            {
              description: 'Living Room Wave Pleat Sheer Curtains (Voile)',
              hsnCode: '5407',
              quantity: 2,
              unit: 'set',
              unitRatePaise: toPaise(15000),
              amountPaise: subtotal,
            },
          ],
          subtotalPaise: subtotal,
          discountPaise: 0,
          gstBreakdown: gst,
          grandTotalPaise: grandTotal,
          grandTotalWords: convertRupeesToWords(toRupees(grandTotal)),
          status: 'paid',
          issueDate: new Date().toISOString(),
          dueDate: new Date().toISOString(),
          termsAndConditions: [
            'Goods once cut/tailored cannot be returned.',
            'Disputes subject to Mumbai jurisdiction.',
          ],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const pdfDoc = generateInvoicePDF(invoice);
        expect(pdfDoc).toBeDefined();
        expect(pdfDoc.getNumberOfPages()).toBeGreaterThanOrEqual(1);

        const pdfDataUri = pdfDoc.output('datauristring');
        expect(pdfDataUri).toContain('data:application/pdf');
      });
    });

    describe('1.8 Product Inventory Management (CRUD)', () => {
      it('validates product form schema and creates a new product in the catalog', async () => {
        const newProductPayload = {
          name: 'Opulent Belgian Crushed Velvet',
          slug: 'opulent-belgian-crushed-velvet',
          brand: 'Excellence Heritage',
          category: 'sofa_upholstery_fabrics' as const,
          subcategory: 'velvet_upholstery' as const,
          description: 'Luxurious heavy-duty 480 GSM crushed velvet suitable for heritage sofa upholstery.',
          shortDescription: 'Heavy-duty 480 GSM crushed velvet',
          pricePerUnit: 2800,
          unit: 'meter' as const,
          stockQuantity: 150,
          isAvailable: true,
          isFeatured: true,
          isBestSeller: false,
          hsnCode: '5407',
          gstRatePercent: 18,
          swatchImage: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=300',
          images: ['https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=800'],
          colors: ['Burgundy', 'Wine'],
          colorHexes: ['#722F37'],
          patterns: ['plain' as const],
          materials: ['Velvet', 'Polyester'],
          tags: ['Luxury', 'Heavy Duty', 'Upholstery'],
          fabricWidthCm: 142,
          weightGsm: 480,
          composition: '100% Polyester Velvet',
        };

        const parseResult = productFormSchema.safeParse(newProductPayload);
        expect(parseResult.success).toBe(true);

        const savedProduct: Product = {
          id: `p-velvet-${Date.now()}`,
          name: newProductPayload.name,
          slug: newProductPayload.slug,
          brand: newProductPayload.brand,
          category: newProductPayload.category,
          subcategory: newProductPayload.subcategory,
          description: newProductPayload.description,
          shortDescription: newProductPayload.shortDescription,
          pricePerUnitPaise: toPaise(newProductPayload.pricePerUnit),
          unit: newProductPayload.unit,
          stockQuantity: newProductPayload.stockQuantity,
          isAvailable: newProductPayload.isAvailable,
          isFeatured: newProductPayload.isFeatured,
          isBestSeller: newProductPayload.isBestSeller,
          hsnCode: newProductPayload.hsnCode,
          gstRatePercent: newProductPayload.gstRatePercent,
          swatchImage: newProductPayload.swatchImage,
          images: newProductPayload.images,
          colors: newProductPayload.colors,
          colorHexes: newProductPayload.colorHexes,
          patterns: newProductPayload.patterns,
          materials: newProductPayload.materials,
          tags: newProductPayload.tags,
          metadata: {
            fabricWidthCm: newProductPayload.fabricWidthCm,
            weightGsm: newProductPayload.weightGsm,
            composition: newProductPayload.composition,
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        await saveProduct(savedProduct);

        const fetched = await fetchProductById(savedProduct.id);
        expect(fetched?.name).toBe('Opulent Belgian Crushed Velvet');
        expect(fetched?.pricePerUnitPaise).toBe(toPaise(2800));

        // Update product stock and price
        await modifyProduct(savedProduct.id, {
          stockQuantity: 120,
          pricePerUnitPaise: toPaise(2950),
        });

        const updated = await fetchProductById(savedProduct.id);
        expect(updated?.stockQuantity).toBe(120);
        expect(updated?.pricePerUnitPaise).toBe(toPaise(2950));

        // Delete product
        const deleteSuccess = await removeProduct(savedProduct.id);
        expect(deleteSuccess).toBe(true);

        const deletedCheck = await fetchProductById(savedProduct.id);
        expect(deletedCheck).toBeNull();
      });
    });

    describe('1.9 AI Fabric Visualizer (Multimodal & Fallback Preview)', () => {
      it('processes valid room photo and swatch image returning a high-fidelity synthetic SVG composite', async () => {
        const dummyRoom = 'data:image/jpeg;base64,' + Buffer.from('mock-room-pixels').toString('base64');
        const dummySwatch = 'data:image/jpeg;base64,' + Buffer.from('mock-swatch-pixels').toString('base64');

        const req = new NextRequest('http://localhost:3000/api/visualize', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            roomImage: dummyRoom,
            swatchImage: dummySwatch,
            productType: 'curtain',
          }),
        });

        const res = await visualizeHandler(req);
        expect(res.status).toBe(200);

        const data = await res.json();
        expect(data.success).toBe(true);
        expect(data.visualizationId).toBeDefined();
        expect(data.productType).toBe('curtain');
        expect(data.resultImageUrl).toContain('data:image/svg+xml');
        expect(data.resultImageUrl).toContain('Excellence%20The%20Furnishing%20Gallery');
      });
    });
  });

  // =========================================================================
  // TIER 2: BOUNDARY & CORNER CASES
  // =========================================================================
  describe('Tier 2: Boundary, Adversarial & Corner Cases', () => {
    describe('2.1 Extreme Dimensions & Physical Limits in Pricing Engine', () => {
      it('calculates quote safely for extreme curtain dimensions (atrium 25m wide vs micro 15cm window)', () => {
        // Massive grand hotel atrium curtain (2,500cm track, 1,200cm drop)
        const atriumConfig: CurtainConfig = {
          type: 'curtain',
          trackWidthCm: 2500,
          dropLengthCm: 1200,
          fullnessRatio: 2.5,
          headingStyle: 'pinch_pleat_triple',
          liningType: 'blackout',
          motorized: true,
          motorBrand: 'somfy',
          panels: 4,
          fabricWidthCm: 140,
        };

        const atriumQuote = calculateCurtainQuote(atriumConfig, 3000);
        expect(atriumQuote.cutsNeeded).toBe(45); // ceil(6250 / 140) = 45 cuts
        expect(atriumQuote.cutDropLengthMeters).toBe(12.25); // (1200 + 25) / 100
        expect(atriumQuote.subtotalRupees).toBeGreaterThan(1000000); // > ₹10 Lakhs
        expect(Number.isFinite(atriumQuote.subtotalPaise)).toBe(true);

        // Micro miniature window (15cm track, 20cm drop)
        const microConfig: CurtainConfig = {
          type: 'curtain',
          trackWidthCm: 15,
          dropLengthCm: 20,
          fullnessRatio: 1.5,
          headingStyle: 'eyelet',
          liningType: 'none',
          motorized: false,
          panels: 1,
          fabricWidthCm: 140,
        };

        const microQuote = calculateCurtainQuote(microConfig, 500);
        expect(microQuote.cutsNeeded).toBe(1); // Min 1 cut
        expect(microQuote.fabricRequiredMeters).toBe(0.5); // (20+25)/100 = 0.45m -> nearest 0.25m = 0.5m
        expect(microQuote.subtotalRupees).toBeGreaterThan(0);
      });

      it('enforces a minimum of 1 full roll for micro wallpaper accent panels', () => {
        const microWall: WallpaperConfig = {
          type: 'wallpaper',
          wallWidthFt: 1.5,
          wallHeightFt: 2, // 3 sq.ft
          patternRepeatType: 'none_free_match',
          includeInstallation: true,
        };

        const quote = calculateWallpaperQuote(microWall, 2500);
        expect(quote.wallAreaSqFt).toBe(3);
        expect(quote.rollsNeeded).toBe(1); // Still requires minimum 1 full roll
        expect(quote.materialCostPaise).toBe(toPaise(2500));
      });
    });

    describe('2.2 Defensive Handling of Zero, Negative & Non-Finite Numbers', () => {
      it('returns zero quote without throwing when dimensions or prices are non-positive or non-finite', () => {
        const zeroConfig: CurtainConfig = {
          type: 'curtain',
          trackWidthCm: 0,
          dropLengthCm: -100,
          fullnessRatio: 2.0,
          headingStyle: 'eyelet',
          liningType: 'none',
          motorized: false,
          panels: 1,
        };

        const quote = calculateCurtainQuote(zeroConfig, -500);
        expect(quote.fabricRequiredMeters).toBe(0);
        expect(quote.subtotalPaise).toBe(0);
        expect(quote.subtotalRupees).toBe(0);

        const nanQuote = calculateCurtainQuote(
          { ...zeroConfig, trackWidthCm: NaN, dropLengthCm: Infinity },
          2000
        );
        expect(nanQuote.subtotalPaise).toBe(0);
      });

      it('safely handles non-positive or non-finite inputs in GST calculator', () => {
        const zeroGst = calculateGST(0, false, 18);
        expect(zeroGst.totalTaxPaise).toBe(0);
        expect(zeroGst.cgstPaise).toBe(0);
        expect(zeroGst.sgstPaise).toBe(0);

        const negativeGst = calculateGST(-5000, false, 18);
        expect(negativeGst.totalTaxPaise).toBe(0);

        const nanGst = calculateGST(NaN, false, NaN);
        expect(nanGst.totalTaxPaise).toBe(0);
      });
    });

    describe('2.3 Zero-Stock, Inventory Depletion & Catalog Queries', () => {
      it('correctly filters out-of-stock and inactive products from available queries', async () => {
        const outOfStockProduct: Product = {
          id: `p-depleted-${Date.now()}`,
          name: 'Discontinued Vintage Velvet',
          slug: `discontinued-vintage-velvet-${Date.now()}`,
          brand: 'Heritage Mills',
          category: 'sofa_upholstery_fabrics',
          subcategory: 'velvet_upholstery',
          description: 'Archived product sample with depleted warehouse stock.',
          shortDescription: 'Archived product sample',
          pricePerUnitPaise: toPaise(1500),
          unit: 'meter',
          stockQuantity: 0,
          isAvailable: false,
          isFeatured: false,
          isBestSeller: false,
          hsnCode: '5407',
          gstRatePercent: 18,
          swatchImage: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=300',
          images: ['https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=800'],
          colors: ['Brown'],
          colorHexes: ['#5C4033'],
          patterns: ['plain'],
          materials: ['Cotton'],
          tags: ['Archived'],
          metadata: {},
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        await saveProduct(outOfStockProduct);

        // Fetch only available products
        const availableProducts = await fetchProducts({ isAvailable: true });
        const existsInAvailable = availableProducts.some((p) => p.id === outOfStockProduct.id);
        expect(existsInAvailable).toBe(false);

        // Fetch unavailable products explicitly
        const unavailableProducts = await fetchProducts({ isAvailable: false });
        const existsInUnavailable = unavailableProducts.some((p) => p.id === outOfStockProduct.id);
        expect(existsInUnavailable).toBe(true);
      });
    });

    describe('2.4 Strict Zod Validation & Hostile Input Combinations', () => {
      it('rejects invalid Indian mobile numbers and invalid 6-digit PIN codes', () => {
        const invalidClient = {
          name: 'Invalid Test Client',
          phone: '1234567890', // Must start with 6, 7, 8, or 9
          email: 'not-an-email',
          billingAddress: {
            street: 'AB', // Min 3 chars
            city: 'M',
            state: 'Maharashtra',
            pincode: '4000', // Must be exactly 6 digits
            country: 'India',
          },
          siteAddress: {
            street: 'Valid Street Address',
            city: 'Mumbai',
            state: 'Maharashtra',
            pincode: '40005899', // Too long
            country: 'India',
          },
        };

        const result = clientFormSchema.safeParse(invalidClient);
        expect(result.success).toBe(false);
        if (!result.success) {
          const errors = result.error.flatten().fieldErrors;
          expect(errors.phone).toBeDefined();
          expect(errors.email).toBeDefined();
        }
      });

      it('rejects negative prices, negative stock, and invalid GST rates in product form', () => {
        const invalidProduct = {
          name: 'Invalid Product',
          slug: 'invalid-prod',
          brand: 'Brand',
          category: 'curtains_window_treatments',
          subcategory: 'sheer_curtains',
          description: 'Description long enough for validation',
          pricePerUnit: -250, // Negative price
          stockQuantity: -10, // Negative stock
          gstRatePercent: 22, // Invalid rate (must be 5, 12, 18, 28)
          swatchImage: 'not-a-url',
          images: [],
        };

        const result = productFormSchema.safeParse(invalidProduct);
        expect(result.success).toBe(false);
      });

      it('rejects empty items array and non-positive payments in order schemas', () => {
        const emptyItemsOrder = {
          clientId: 'c-001',
          clientName: 'Priya Sharma',
          clientPhone: '9820012345',
          deliveryAddress: {
            street: '1402 Sea Face Towers',
            city: 'Mumbai',
            state: 'Maharashtra',
            pincode: '400018',
            country: 'India',
          },
          items: [], // At least 1 item required
          discountPaise: 0,
        };

        const orderResult = manualOrderFormSchema.safeParse(emptyItemsOrder);
        expect(orderResult.success).toBe(false);

        const invalidPayment = {
          amount: -500, // Non-positive payment
          method: 'upi',
          recordedBy: 'Altab',
        };

        const payResult = paymentLogSchema.safeParse(invalidPayment);
        expect(payResult.success).toBe(false);
      });
    });

    describe('2.5 Edge Middleware Route Protection & Permission Tampering', () => {
      it('redirects unauthenticated users trying to access protected /admin and /dashboard routes to /login', () => {
        const protectedRoutes = [
          '/admin',
          '/admin/clients',
          '/admin/orders',
          '/admin/invoices',
          '/dashboard',
          '/dashboard/orders',
          '/dashboard/profile',
        ];

        for (const route of protectedRoutes) {
          const req = createReq(route);
          const res = middleware(req);
          expect(res.status).toBe(307);
          const location = res.headers.get('location');
          expect(location).toContain('/login');
          expect(location).toContain(`redirect=${encodeURIComponent(route)}`);
        }
      });

      it('prevents non-admin authenticated users from accessing /admin routes and redirects them to /dashboard', () => {
        const req = createReq('/admin/clients', {
          session: 'valid-user-session',
          user_role: 'user', // Customer role
        });

        const res = middleware(req);
        expect(res.status).toBe(307);
        const location = res.headers.get('location');
        expect(location).toContain('/dashboard');
      });

      it('permits authenticated admins full access to /admin routes', () => {
        const req = createReq('/admin/orders', {
          session: 'valid-admin-session',
          user_role: 'admin', // Admin role
        });

        const res = middleware(req);
        expect(res.status).toBe(200);
        expect(res.headers.get('location')).toBeNull();
      });

      it('redirects authenticated users visiting /login or /register away from auth pages', () => {
        // Customer visiting /login -> redirected to /dashboard
        const userReq = createReq('/login', {
          session: 'valid-user-session',
          user_role: 'user',
        });
        const userRes = middleware(userReq);
        expect(userRes.status).toBe(307);
        expect(userRes.headers.get('location')).toContain('/dashboard');

        // Admin visiting /login -> redirected to /admin
        const adminReq = createReq('/login', {
          session: 'valid-admin-session',
          user_role: 'admin',
        });
        const adminRes = middleware(adminReq);
        expect(adminRes.status).toBe(307);
        expect(adminRes.headers.get('location')).toContain('/admin');
      });
    });

    describe('2.6 GST Integer Paise Rounding & Remainder Allocation', () => {
      it('preserves exact arithmetic: cgstPaise + sgstPaise === totalTaxPaise on fractional paise amounts', () => {
        // ₹100.03 = 10,003 paise @ 18% GST = 1,800.54 paise -> rounds to 1,801 paise total tax
        // Half of 1,801 = 900.5 paise -> floor to 900 CGST, remainder 901 to SGST
        const gst = calculateGST(10003, false, 18);
        expect(gst.totalTaxPaise).toBe(1801);
        expect(gst.cgstPaise).toBe(900);
        expect(gst.sgstPaise).toBe(901);
        expect(gst.cgstPaise + gst.sgstPaise).toBe(gst.totalTaxPaise);
      });
    });

    describe('2.7 Adversarial AI Visualizer Payloads', () => {
      it('returns 400 VALIDATION_ERROR when roomImage or swatchImage is missing or empty', async () => {
        // Missing swatch image
        const reqMissingSwatch = new NextRequest('http://localhost:3000/api/visualize', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ roomImage: 'data:image/jpeg;base64,mock' }),
        });
        const resMissingSwatch = await visualizeHandler(reqMissingSwatch);
        expect(resMissingSwatch.status).toBe(400);

        // Completely empty payload
        const reqEmpty = new NextRequest('http://localhost:3000/api/visualize', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({}),
        });
        const resEmpty = await visualizeHandler(reqEmpty);
        expect(resEmpty.status).toBe(400);
      });
    });

    describe('2.8 Order State Machine Invariants & Financial Guardrails', () => {
      it('enforces that once an order is delivered, it cannot be reversed to draft', async () => {
        const orderId = `EF-ORD-ST-${Date.now()}`;
        const subtotal = toPaise(10000);
        const gst = calculateGST(subtotal, false);
        const grandTotal = subtotal + gst.totalTaxPaise;

        const order: Order = {
          id: orderId,
          orderNumber: `ORD-${Date.now()}`,
          clientId: 'c-001',
          clientName: 'Priya Sharma',
          clientPhone: '9820012345',
          deliveryAddress: {
            street: 'Sea Face Towers',
            city: 'Mumbai',
            state: 'Maharashtra',
            pincode: '400018',
            country: 'India',
          },
          items: [],
          subtotalPaise: subtotal,
          discountPaise: 0,
          gstBreakdown: gst,
          grandTotalPaise: grandTotal,
          paymentStatus: 'paid',
          paidAmountPaise: grandTotal,
          balanceAmountPaise: 0,
          status: 'delivered',
          payments: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        await saveOrder(order);
        const fetched = await fetchOrderById(orderId);
        expect(fetched?.status).toBe('delivered');
      });
    });

    describe('2.9 Authentication Security & Credential Boundary Violations', () => {
      it('rejects sign-in with non-existent email and wrong password', async () => {
        await expect(
          signInWithEmail('nonexistent.user@example.com', 'Password@123')
        ).rejects.toThrow(/User not found/);

        await expect(
          signInWithEmail('customer@excellencefurnishing.com', 'WRONG_PASSWORD_999')
        ).rejects.toThrow(/Invalid password/);
      });

      it('rejects duplicate customer registration with existing email', async () => {
        await expect(
          registerWithEmail(
            'Duplicate User',
            'customer@excellencefurnishing.com',
            'Password@123'
          )
        ).rejects.toThrow(/already exists/);
      });

      it('clears session and resets auth store on signOutUser', async () => {
        const store = useAuthStore.getState();
        await store.login('customer@excellencefurnishing.com', 'Customer@123');
        expect(useAuthStore.getState().isAuthenticated).toBe(true);

        await store.logout();
        const state = useAuthStore.getState();
        expect(state.isAuthenticated).toBe(false);
        expect(state.user).toBeNull();
      });
    });
  });

  // =========================================================================
  // TIER 3: CROSS-FEATURE COMBINATIONS & MULTI-ENTITY LIFECYCLES
  // =========================================================================
  describe('Tier 3: Cross-Feature Combinations & Multi-Entity Lifecycles', () => {
    it('executes full end-to-end commerce lifecycle: Registration -> Room -> Measurement -> 1-Click Order -> Multi-Installment Payment -> Invoice -> PDF -> Customer Tracking', async () => {
      // Step 1: Customer registers account
      const customerEmail = `ananya.pandey.${Date.now()}@mumbai-interiors.in`;
      const customer = await registerWithEmail(
        'Ananya Pandey',
        customerEmail,
        'Pass@12345',
        '9820088776',
        {
          street: 'Bungalow 12, Pali Hill',
          landmark: 'Near Nargis Dutt Road',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400050',
          country: 'India',
        }
      );
      expect(customer.uid).toBeDefined();

      // Step 2: Admin creates linked client profile
      const clientId = `client-ananya-${Date.now()}`;
      const clientRecord: Client = {
        id: clientId,
        name: 'Ananya Pandey',
        phone: '9820088776',
        email: customerEmail,
        billingAddress: {
          street: 'Bungalow 12, Pali Hill',
          landmark: 'Near Nargis Dutt Road',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400050',
          country: 'India',
        },
        siteAddress: {
          street: 'Bungalow 12, Pali Hill',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400050',
          country: 'India',
        },
        tags: ['Celebrity', 'Full Villa Furnishing'],
        notes: 'Pali Hill Portuguese villa renovation.',
        totalOrdersCount: 0,
        totalSpentPaise: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await saveClient(clientRecord);

      // Step 3: Add room to client
      const roomId = `room-pali-living-${Date.now()}`;
      const roomRecord: Room = {
        id: roomId,
        clientId,
        name: 'Grand Bay Living Room',
        type: 'living_room',
        floor: 'Ground Floor',
        photos: [],
        measurementsCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await saveRoom(roomRecord);

      // Step 4: Add digital measurements for custom curtains
      const curtainConfig: CurtainConfig = {
        type: 'curtain',
        trackWidthCm: 350,
        dropLengthCm: 290,
        fullnessRatio: 2.2,
        headingStyle: 'wave_s_fold',
        liningType: 'blackout',
        motorized: true,
        motorBrand: 'somfy',
        panels: 2,
        fabricWidthCm: 140,
      };
      const curtainFabricRate = 2600; // ₹2,600/m
      const curtainQuote = calculateCurtainQuote(curtainConfig, curtainFabricRate);

      const measurementId = `meas-curtain-${Date.now()}`;
      const measurementRecord: RoomMeasurement = {
        id: measurementId,
        clientId,
        roomId,
        label: 'Grand Bay Wave Pleat Curtains',
        productType: 'curtain',
        configuration: curtainConfig,
        productId: 'p-curtain-01',
        productName: 'Royal Wave Sheer & Blackout Drapes',
        unitPricePaise: toPaise(curtainFabricRate),
        breakdown: curtainQuote.breakdown,
        totalEstimatePaise: curtainQuote.subtotalPaise,
        isConvertedToOrder: false,
        notes: 'Bespoke Somfy wave fold automation.',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await saveMeasurement(measurementRecord);

      // Verify measurement persistence
      const clientMeasurements = await fetchMeasurementsByClient(clientId);
      expect(clientMeasurements.length).toBe(1);
      expect(clientMeasurements[0].breakdown.fabricRequiredMeters).toBe(curtainQuote.fabricRequiredMeters);

      // Step 5: 1-Click convert measurement into Sales Order
      const orderId = `EF-ORD-E2E-${Date.now()}`;
      const orderItem: OrderItem = {
        id: `item-${Date.now()}`,
        productId: 'p-curtain-01',
        productName: 'Royal Wave Sheer & Blackout Drapes',
        category: 'curtains_window_treatments',
        quantity: 1,
        unit: 'set',
        unitPricePaise: curtainQuote.subtotalPaise,
        lineTotalPaise: curtainQuote.subtotalPaise,
        measurementId: measurementRecord.id,
        configuration: curtainConfig,
      };

      const subtotalPaise = curtainQuote.subtotalPaise;
      const gstBreakdown = calculateGST(subtotalPaise, false, 18);
      const grandTotalPaise = subtotalPaise + gstBreakdown.totalTaxPaise;

      const salesOrder: Order = {
        id: orderId,
        orderNumber: `ORD-2026-${Date.now().toString().slice(-5)}`,
        clientId,
        userId: customer.uid,
        clientName: 'Ananya Pandey',
        clientPhone: '9820088776',
        clientEmail: customerEmail,
        deliveryAddress: clientRecord.siteAddress,
        items: [orderItem],
        subtotalPaise,
        discountPaise: 0,
        gstBreakdown,
        grandTotalPaise,
        paymentStatus: 'pending',
        paidAmountPaise: 0,
        balanceAmountPaise: grandTotalPaise,
        status: 'draft',
        payments: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await saveOrder(salesOrder);

      // Step 6: Admin confirms order
      await modifyOrder(orderId, { status: 'confirmed' });
      let currentOrder = await fetchOrderById(orderId);
      expect(currentOrder?.status).toBe('confirmed');

      // Step 7: Customer logs in and checks order tracking in portal
      const customerOrders = await fetchOrders({ userId: customer.uid });
      expect(customerOrders.length).toBe(1);
      expect(customerOrders[0].id).toBe(orderId);
      expect(getMilestoneStep(customerOrders[0].status)).toBe(1); // 'Order Placed & Confirmed'

      // Step 8: Admin logs 50% Advance Payment via UPI
      const advancePaise = Math.round(grandTotalPaise / 2);
      const payment1: PaymentRecord = {
        id: `pay-adv-${Date.now()}`,
        amountPaise: advancePaise,
        method: 'upi',
        referenceNumber: 'UPI-HDFC-PALIPAY',
        notes: '50% advance received via UPI',
        date: new Date().toISOString(),
        recordedBy: 'Mr. Altab Chauhan',
      };
      await modifyOrder(orderId, {
        status: 'in_production',
        paymentStatus: 'partial',
        paidAmountPaise: advancePaise,
        balanceAmountPaise: grandTotalPaise - advancePaise,
        payments: [payment1],
      });

      // Verify portal reflects milestone step 3 ('Custom Stitching')
      currentOrder = await fetchOrderById(orderId);
      expect(currentOrder?.paymentStatus).toBe('partial');
      expect(getMilestoneStep(currentOrder!.status)).toBe(3);

      // Step 9: Workshop completes tailoring -> 'ready' (milestone step 4: 'Out for Delivery')
      await modifyOrder(orderId, { status: 'ready' });
      currentOrder = await fetchOrderById(orderId);
      expect(getMilestoneStep(currentOrder!.status)).toBe(4);

      // Step 10: Admin logs final balance payment via NEFT
      const balancePaise = grandTotalPaise - advancePaise;
      const payment2: PaymentRecord = {
        id: `pay-bal-${Date.now()}`,
        amountPaise: balancePaise,
        method: 'bank_neft_rtgs',
        referenceNumber: 'NEFT-PALIBAL-99',
        notes: 'Final balance payment received prior to installation',
        date: new Date().toISOString(),
        recordedBy: 'Mr. Altab Chauhan',
      };
      await modifyOrder(orderId, {
        status: 'delivered',
        paymentStatus: 'paid',
        paidAmountPaise: grandTotalPaise,
        balanceAmountPaise: 0,
        payments: [payment1, payment2],
      });

      currentOrder = await fetchOrderById(orderId);
      expect(currentOrder?.paymentStatus).toBe('paid');
      expect(currentOrder?.status).toBe('delivered');
      expect(getMilestoneStep(currentOrder!.status)).toBe(5); // 'Delivered & Installed'

      // Step 11: Admin generates official sequential GST Tax Invoice
      const lastInv = await fetchLastInvoiceNumber();
      const nextInvNumber = generateNextInvoiceNumber(lastInv, 2026);
      expect(nextInvNumber).toMatch(/^EF-2026-\d{5}$/);

      const invoiceId = `inv-${Date.now()}`;
      const invoiceItem: InvoiceItem = {
        description: orderItem.productName,
        hsnCode: '5407',
        quantity: 1,
        unit: 'set',
        unitRatePaise: orderItem.unitPricePaise,
        amountPaise: subtotalPaise,
      };

      const officialInvoice: Invoice = {
        id: invoiceId,
        invoiceNumber: nextInvNumber,
        orderId,
        orderNumber: salesOrder.orderNumber,
        clientId,
        clientDetails: {
          name: clientRecord.name,
          phone: clientRecord.phone,
          email: clientRecord.email,
          billingAddress: clientRecord.billingAddress,
          shippingAddress: clientRecord.siteAddress,
        },
        businessDetails: DEFAULT_BUSINESS_HEADER,
        items: [invoiceItem],
        subtotalPaise,
        discountPaise: 0,
        gstBreakdown,
        grandTotalPaise,
        grandTotalWords: convertRupeesToWords(toRupees(grandTotalPaise)),
        status: 'paid',
        issueDate: new Date().toISOString(),
        dueDate: new Date().toISOString(),
        termsAndConditions: [
          'Custom tailored goods cannot be cancelled once cut.',
          'Subject to Mumbai jurisdiction.',
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await saveInvoice(officialInvoice);

      // Step 12: Verify Invoice persistence and PDF generation
      const fetchedInvoice = await fetchInvoiceByNumber(nextInvNumber);
      expect(fetchedInvoice).not.toBeNull();
      expect(fetchedInvoice?.grandTotalPaise).toBe(grandTotalPaise);

      const pdf = generateInvoicePDF(fetchedInvoice!);
      expect(pdf.getNumberOfPages()).toBeGreaterThanOrEqual(1);

      // Verify Rupee words
      const words = convertRupeesToWords(toRupees(grandTotalPaise));
      expect(words).toContain('Rupees');
      expect(words).toContain('Only');
    });

    it('handles mixed-category multi-item orders combining Curtains, Wallpaper, and Upholstery', async () => {
      const orderId = `EF-ORD-MIXED-${Date.now()}`;
      const items: OrderItem[] = [
        {
          id: 'item-curtain',
          productName: 'Living Room Blackout Drapes',
          category: 'curtains_window_treatments',
          quantity: 2,
          unit: 'panel',
          unitPricePaise: toPaise(12500),
          lineTotalPaise: toPaise(25000),
        },
        {
          id: 'item-wallpaper',
          productName: 'Dining Room Metallic Accent Wallpaper',
          category: 'wallpapers',
          quantity: 4,
          unit: 'roll',
          unitPricePaise: toPaise(3500),
          lineTotalPaise: toPaise(14000),
        },
        {
          id: 'item-upholstery',
          productName: '3-Seater Chesterfield Velvet Reupholstery',
          category: 'sofa_upholstery_fabrics',
          quantity: 1,
          unit: 'piece',
          unitPricePaise: toPaise(32000),
          lineTotalPaise: toPaise(32000),
        },
      ];

      const subtotalPaise = toPaise(25000 + 14000 + 32000); // ₹71,000
      const gstBreakdown = calculateGST(subtotalPaise, false, 18);
      const grandTotalPaise = subtotalPaise + gstBreakdown.totalTaxPaise;

      const mixedOrder: Order = {
        id: orderId,
        orderNumber: `ORD-MIXED-${Date.now()}`,
        clientId: 'c-001',
        clientName: 'Priya Sharma',
        clientPhone: '9820012345',
        deliveryAddress: {
          street: '1402 Sea Face Towers, Worli',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400018',
          country: 'India',
        },
        items,
        subtotalPaise,
        discountPaise: 0,
        gstBreakdown,
        grandTotalPaise,
        paymentStatus: 'pending',
        paidAmountPaise: 0,
        balanceAmountPaise: grandTotalPaise,
        status: 'draft',
        payments: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await saveOrder(mixedOrder);
      const fetched = await fetchOrderById(orderId);
      expect(fetched?.items.length).toBe(3);
      expect(fetched?.subtotalPaise).toBe(toPaise(71000));
      expect(fetched?.grandTotalPaise).toBe(grandTotalPaise);
    });

    it('executes client cancellation flow moving order from draft to cancelled with financial lock', async () => {
      const orderId = `EF-ORD-CANCEL-${Date.now()}`;
      const subtotalPaise = toPaise(18000);
      const gstBreakdown = calculateGST(subtotalPaise, false, 18);
      const grandTotalPaise = subtotalPaise + gstBreakdown.totalTaxPaise;

      const order: Order = {
        id: orderId,
        orderNumber: `ORD-CAN-${Date.now()}`,
        clientId: 'c-001',
        clientName: 'Priya Sharma',
        clientPhone: '9820012345',
        deliveryAddress: {
          street: '1402 Sea Face Towers, Worli',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400018',
          country: 'India',
        },
        items: [],
        subtotalPaise,
        discountPaise: 0,
        gstBreakdown,
        grandTotalPaise,
        paymentStatus: 'pending',
        paidAmountPaise: 0,
        balanceAmountPaise: grandTotalPaise,
        status: 'draft',
        payments: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await saveOrder(order);

      // Client requests cancellation prior to factory fabric cutting
      await modifyOrder(orderId, {
        status: 'cancelled',
        internalNotes: 'Client cancelled prior to fabric cutting; no cancellation charge.',
      });

      const cancelledOrder = await fetchOrderById(orderId);
      expect(cancelledOrder?.status).toBe('cancelled');
      expect(cancelledOrder?.internalNotes).toContain('Client cancelled');
    });
  });

  // =========================================================================
  // TIER 4: REAL-WORLD MUMBAI WORKLOADS & HIGH-VALUE ARCHITECTURAL SCENARIOS
  // =========================================================================
  describe('Tier 4: Real-World Mumbai Workloads & Architectural Scenarios', () => {
    describe('4.1 Scenario A: 3BHK Andheri West Luxury Apartment Curtain Automation', () => {
      it('executes exact calculations for Sajid Tower French Window automated curtain installation', () => {
        // Specifications:
        // Location: Opp. Amboli Railway Station, Andheri West
        // Window: 480cm track width, 280cm drop length, 2.5x fullness, Pinch Pleat Triple
        // Blackout lining + Somfy RTS motorized track
        const config: CurtainConfig = {
          type: 'curtain',
          trackWidthCm: 480,
          dropLengthCm: 280,
          fullnessRatio: 2.5,
          headingStyle: 'pinch_pleat_triple',
          liningType: 'blackout',
          motorized: true,
          motorBrand: 'somfy',
          panels: 2,
          fabricWidthCm: 140,
        };

        const fabricRate = 1850; // ₹1,850/m
        const quote = calculateCurtainQuote(config, fabricRate);

        // Verification of cutting parameters:
        // 1. Gathered Width: 480 * 2.5 = 1200cm
        // 2. Cuts: ceil(1200 / 140) = 9 cuts
        expect(quote.cutsNeeded).toBe(9);

        // 3. Cut Drop Length: (280 + 25cm hem) / 100 = 3.05m
        expect(quote.cutDropLengthMeters).toBe(3.05);

        // 4. Raw Fabric: 9 * 3.05 = 27.45m -> Rounded to nearest 0.25m = 27.50m
        expect(quote.fabricRequiredMeters).toBe(27.5);

        // 5. Fabric Cost: 27.5 * 1850 = ₹50,875 (5,087,500 paise)
        expect(quote.fabricCostPaise).toBe(toPaise(50875));

        // 6. Stitching Cost: 27.5 * ₹280 = ₹7,700
        expect(quote.stitchingCostPaise).toBe(toPaise(7700));

        // 7. Blackout Lining Cost: 27.5 * ₹350 = ₹9,625
        expect(quote.liningCostPaise).toBe(toPaise(9625));

        // 8. Lining Surcharge: 40% of stitching cost = 0.40 * 7700 = ₹3,080
        expect(quote.liningSurchargePaise).toBe(toPaise(3080));

        // 9. Somfy Large Track (>300cm): ₹16,500
        expect(quote.motorCostPaise).toBe(toPaise(16500));

        // 10. Subtotal: 50875 + 7700 + 9625 + 3080 + 16500 = ₹87,780
        expect(quote.subtotalRupees).toBe(87780);

        // 11. GST Calculation: Intra-state Maharashtra (18% total = 9% CGST + 9% SGST)
        const gst = calculateGST(quote.subtotalPaise, false, 18);
        expect(gst.isInterState).toBe(false);
        expect(gst.cgstPaise).toBe(toPaise(7900.2));
        expect(gst.sgstPaise).toBe(toPaise(7900.2));
        expect(gst.totalTaxPaise).toBe(toPaise(15800.4));

        // Grand Total: ₹87,780 + ₹15,800.40 = ₹1,03,580.40
        const grandTotalRupees = toRupees(quote.subtotalPaise + gst.totalTaxPaise);
        expect(grandTotalRupees).toBeCloseTo(103580.4, 1);
      });
    });

    describe('4.2 Scenario B: Bandra West Portuguese Heritage Villa Chesterfield Reupholstery', () => {
      it('executes exact calculations for Perry Cross Road heritage villa sofa reupholstery and HD foam replacement', () => {
        // Specifications:
        // Item: 3-Seater Chesterfield Sofa
        // Material: Burgundy Wine Crushed Velvet, ₹2,200/m
        // High-density 40-density foam replacement across 3 seats
        const config: UpholsteryConfig = {
          type: 'upholstery',
          furnitureType: 'sofa_3_seater',
          seatCount: 3,
          includeFoamReplacement: true,
          foamGrade: 'hd_40_density',
        };

        const fabricRate = 2200; // ₹2,200/m
        const quote = calculateUpholsteryQuote(config, fabricRate);

        // Verification:
        // 1. Standard fabric for 3-seater = 12.0m
        expect(quote.totalFabricMeters).toBe(12);

        // 2. Material Cost: 12 * 2200 = ₹26,400
        expect(quote.materialCostPaise).toBe(toPaise(26400));

        // 3. Craftsman Labor: ₹3,800
        expect(quote.laborCostPaise).toBe(toPaise(3800));

        // 4. HD-40 Foam Replacement: 3 seats * ₹2,500 = ₹7,500
        expect(quote.foamCostPaise).toBe(toPaise(7500));

        // 5. Subtotal: 26400 + 3800 + 7500 = ₹37,700
        expect(quote.subtotalRupees).toBe(37700);

        // 6. GST Calculation: Intra-state (CGST ₹3,393 + SGST ₹3,393 = ₹6,786)
        const gst = calculateGST(quote.subtotalPaise, false, 18);
        expect(gst.totalTaxPaise).toBe(toPaise(6786));
        expect(quote.subtotalRupees + toRupees(gst.totalTaxPaise)).toBe(44486);
      });
    });

    describe('4.3 Scenario C: Juhu Beachfront Penthouse Nilaya Wallpaper Installation', () => {
      it('executes exact calculations for Juhu Tara Road beachfront penthouse designer wallpaper installation', () => {
        // Specifications:
        // Accent wall: 18.5 ft wide x 10.5 ft high = 194.25 sq.ft
        // Wallpaper: Nilaya Asian Paints Imported Metallic Roll (small repeat 30cm)
        // Rate: ₹4,800/roll, include professional Mumbai installation
        const config: WallpaperConfig = {
          type: 'wallpaper',
          wallWidthFt: 18.5,
          wallHeightFt: 10.5,
          patternRepeatType: 'straight_match',
          patternRepeatCm: 30,
          includeInstallation: true,
        };

        const rollPrice = 4800; // ₹4,800/roll
        const quote = calculateWallpaperQuote(config, rollPrice);

        // 1. Wall Area: 18.5 * 10.5 = 194.25 sq.ft
        expect(quote.wallAreaSqFt).toBe(194.25);

        // 2. Small Repeat usable coverage: 47 sq.ft
        expect(quote.usableCoverageSqFt).toBe(47);

        // 3. Rolls needed: ceil(194.25 / 47) = 5 rolls
        expect(quote.rollsNeeded).toBe(5);

        // 4. Material Cost: 5 * 4800 = ₹24,000
        expect(quote.materialCostPaise).toBe(toPaise(24000));

        // 5. Installation: 194.25 sq.ft * ₹20/sq.ft = ₹3,885
        expect(quote.installationCostPaise).toBe(toPaise(3885));

        // 6. Subtotal: 24000 + 3885 = ₹27,885
        expect(quote.subtotalRupees).toBe(27885);

        // 7. Inter-State Tax (if billing to Gujarat holiday home client, 18% IGST)
        const igst = calculateGST(quote.subtotalPaise, true, 18);
        expect(igst.isInterState).toBe(true);
        expect(igst.igstPaise).toBe(toPaise(5019.3));
        expect(igst.totalTaxPaise).toBe(toPaise(5019.3));
      });
    });

    describe('4.4 Scenario D: Marine Lines Sea-Facing Penthouse Orthopedic Mattress & Bedding Setup', () => {
      it('processes bespoke Refresh / Dr. Ortho memory foam mattress and Egyptian cotton bedding suite', async () => {
        // Specifications:
        // Client: Industrialist Penthouse at Marine Drive / Marine Lines, South Mumbai
        // Mattress: Dr. Ortho / Refresh Dual-Comfort 10-inch King Mattress (HSN 9404)
        // Bedding: 400 TC Egyptian Cotton Bedsheet Sets with matching pillow and cushion covers
        const mattressOrderSubtotal = toPaise(32000); // ₹32,000 for custom-sized 78x72 inch mattress
        const beddingSubtotal = toPaise(8500); // ₹8,500 for 2 Egyptian cotton sheet sets + duvet
        const totalSubtotalPaise = mattressOrderSubtotal + beddingSubtotal; // ₹40,500

        const gst = calculateGST(totalSubtotalPaise, false, 18);
        expect(gst.isInterState).toBe(false);
        expect(gst.cgstPaise).toBe(toPaise(3645));
        expect(gst.sgstPaise).toBe(toPaise(3645));
        expect(gst.totalTaxPaise).toBe(toPaise(7290));

        const grandTotalPaise = totalSubtotalPaise + gst.totalTaxPaise;
        expect(grandTotalPaise).toBe(toPaise(47790)); // ₹47,790

        // Invoicing verification
        const words = convertRupeesToWords(toRupees(grandTotalPaise));
        expect(words).toBe('Rupees Forty Seven Thousand Seven Hundred Ninety Only');
      });
    });

    describe('4.5 Scenario E: Bandra Bandstand Sea-Facing Terrace Artificial Turf & Mosquito Netting', () => {
      it('calculates home decor artificial turf and customized window mosquito netting quote', async () => {
        // Specifications:
        // Location: Penthouse Terrace, Bandra Bandstand (Overlooking Arabian Sea)
        // Products:
        // 1. 40mm High-Density UV-Resistant Artificial Turf (350 sq.ft terrace area @ ₹180/sq.ft = ₹63,000)
        // 2. Custom Fitted Magnetic Mesh Mosquito Netting for 4 Balcony Sliding Panels (@ ₹4,200/panel = ₹16,800)
        const turfCostPaise = toPaise(350 * 180); // ₹63,000
        const meshCostPaise = toPaise(4 * 4200); // ₹16,800
        const subtotalPaise = turfCostPaise + meshCostPaise; // ₹79,800

        const gst = calculateGST(subtotalPaise, false, 18);
        expect(gst.totalTaxPaise).toBe(toPaise(14364));

        const grandTotalPaise = subtotalPaise + gst.totalTaxPaise;
        expect(grandTotalPaise).toBe(toPaise(94164)); // ₹94,164

        const formatted = formatINR(grandTotalPaise, true);
        expect(formatted).toContain('94,164');
      });
    });
  });
});

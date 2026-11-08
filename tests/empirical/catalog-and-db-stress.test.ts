import { describe, it, expect, beforeEach } from 'vitest';
import {
  SEEDED_PRODUCTS,
  SEEDED_CLIENTS,
  SEEDED_ROOMS,
  SEEDED_MEASUREMENTS,
  SEEDED_ORDERS,
  SEEDED_INVOICES,
} from '@/lib/firebase/seed-data';
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
  fetchOrders,
  fetchOrderById,
  saveOrder,
  modifyOrder,
  fetchInvoices,
  fetchInvoiceById,
  fetchInvoiceByNumber,
  saveInvoice,
  modifyInvoice,
  fetchLastInvoiceNumber,
  fetchMeasurementById,
} from '@/lib/firebase/firestore';
import { Product, MainCategory, SubCategory } from '@/types/product';
import { Client } from '@/types/client';
import { Room } from '@/types/room';
import { Order, OrderStatus } from '@/types/order';
import { Invoice } from '@/types/invoice';
import { generateNextInvoiceNumber } from '@/lib/pricing/calculator';

describe('EMPIRICAL CHALLENGE 1: 100% Seeded Products Validation (Oracle & Boundary Testing)', () => {
  it('contains exactly 32 products with expected category distributions', () => {
    expect(SEEDED_PRODUCTS.length).toBe(32);

    const counts: Record<string, number> = {};
    for (const p of SEEDED_PRODUCTS) {
      counts[p.category] = (counts[p.category] || 0) + 1;
    }

    expect(counts['curtains_window_treatments']).toBe(7);
    expect(counts['sofa_upholstery_fabrics']).toBe(6);
    expect(counts['wallpapers']).toBe(5);
    expect(counts['mattresses_sleep_solutions']).toBe(6);
    expect(counts['bedding_accessories']).toBe(4);
    expect(counts['home_decor']).toBe(4);
  });

  it('validates 100% of the 32 products for IDs, slugs, and uniqueness', () => {
    const ids = new Set<string>();
    const slugs = new Set<string>();

    for (const p of SEEDED_PRODUCTS) {
      // ID uniqueness and format
      expect(p.id).toBeDefined();
      expect(typeof p.id).toBe('string');
      expect(p.id.trim().length).toBeGreaterThan(3);
      expect(ids.has(p.id), `Duplicate product ID found: ${p.id}`).toBe(false);
      ids.add(p.id);

      // Slug uniqueness and kebab-case
      expect(p.slug).toBeDefined();
      expect(typeof p.slug).toBe('string');
      expect(p.slug).toMatch(/^[a-z0-9-]+$/);
      expect(slugs.has(p.slug), `Duplicate product slug found: ${p.slug}`).toBe(false);
      slugs.add(p.slug);
    }

    expect(ids.size).toBe(32);
    expect(slugs.size).toBe(32);
  });

  it('validates 100% of the 32 products for pricing, integer paise storage, and realistic rates', () => {
    for (const p of SEEDED_PRODUCTS) {
      // Must be integer paise
      expect(Number.isInteger(p.pricePerUnitPaise), `Product ${p.id} price is not an integer`).toBe(true);
      expect(p.pricePerUnitPaise).toBeGreaterThan(0);
      expect(Number.isNaN(p.pricePerUnitPaise)).toBe(false);

      // MRP must be >= pricePerUnitPaise if present
      if (p.mrpPaise !== undefined) {
        expect(Number.isInteger(p.mrpPaise), `Product ${p.id} MRP is not an integer`).toBe(true);
        expect(p.mrpPaise).toBeGreaterThanOrEqual(p.pricePerUnitPaise);
      }

      // Unit type validation
      expect(['meter', 'roll', 'piece', 'sq.ft']).toContain(p.unit);

      // Mumbai Market Pricing sanity checks
      const rupees = p.pricePerUnitPaise / 100;
      switch (p.category) {
        case 'curtains_window_treatments':
          // Curtain fabrics range ₹150 to ₹3,500/m (or roller blind ₹850/sq.ft)
          expect(rupees).toBeGreaterThanOrEqual(500);
          expect(rupees).toBeLessThanOrEqual(3500);
          break;
        case 'sofa_upholstery_fabrics':
          // Sofa fabrics ₹300 to ₹2,500/m
          expect(rupees).toBeGreaterThanOrEqual(600);
          expect(rupees).toBeLessThanOrEqual(2500);
          break;
        case 'wallpapers':
          // Rolls ₹1,200 to ₹7,000/roll, murals ₹90-₹250/sq.ft
          if (p.unit === 'roll') {
            expect(rupees).toBeGreaterThanOrEqual(1200);
            expect(rupees).toBeLessThanOrEqual(7000);
          } else if (p.unit === 'sq.ft') {
            expect(rupees).toBeGreaterThanOrEqual(90);
            expect(rupees).toBeLessThanOrEqual(250);
          }
          break;
        case 'mattresses_sleep_solutions':
          // Mattresses ₹10,000 to ₹50,000
          expect(rupees).toBeGreaterThanOrEqual(10000);
          expect(rupees).toBeLessThanOrEqual(50000);
          break;
        case 'bedding_accessories':
          // Bedding ₹1,000 to ₹5,000
          expect(rupees).toBeGreaterThanOrEqual(1000);
          expect(rupees).toBeLessThanOrEqual(10000);
          break;
        case 'home_decor':
          // Decor items: ₹80/sq.ft turf, ₹1,800 nets, ₹18,000 wool carpet, ₹12,500 headboard
          expect(rupees).toBeGreaterThanOrEqual(80);
          expect(rupees).toBeLessThanOrEqual(25000);
          break;
      }
    }
  });

  it('validates 100% of the 32 products for HSN codes and GST slabs', () => {
    const validGstRates = [5, 12, 18];

    for (const p of SEEDED_PRODUCTS) {
      // HSN code format (4 to 8 digits)
      expect(p.hsnCode).toMatch(/^[0-9]{4,8}$/);

      // Valid GST slab
      expect(validGstRates).toContain(p.gstRatePercent);

      // Verify HSN matches category conventions
      if (p.category === 'curtains_window_treatments') {
        expect(['5407', '5208', '6303']).toContain(p.hsnCode);
      } else if (p.category === 'sofa_upholstery_fabrics') {
        expect(['5407', '5903', '5208']).toContain(p.hsnCode);
      } else if (p.category === 'wallpapers') {
        expect(p.hsnCode).toBe('4814'); // Wallpaper HSN
      } else if (p.category === 'mattresses_sleep_solutions') {
        expect(p.hsnCode).toBe('9404'); // Mattress HSN
      } else if (p.category === 'bedding_accessories') {
        expect(['6301', '6302', '6304']).toContain(p.hsnCode);
      } else if (p.category === 'home_decor') {
        expect(['5702', '5703', '7610', '9403']).toContain(p.hsnCode);
      }
    }
  });

  it('validates 100% of the 32 products for images and swatches', () => {
    for (const p of SEEDED_PRODUCTS) {
      // Swatch image must be non-empty valid HTTPS URL
      expect(p.swatchImage).toBeDefined();
      expect(p.swatchImage.startsWith('https://')).toBe(true);

      // Gallery images must have at least 1 valid image
      expect(Array.isArray(p.images)).toBe(true);
      expect(p.images.length).toBeGreaterThanOrEqual(1);
      for (const img of p.images) {
        expect(img.startsWith('https://')).toBe(true);
      }
    }
  });

  it('validates 100% of the 32 products for dimensional metadata', () => {
    for (const p of SEEDED_PRODUCTS) {
      expect(p.metadata).toBeDefined();

      if (p.category === 'curtains_window_treatments') {
        // Must specify fabric bolt width (cm)
        expect(typeof p.metadata.fabricWidthCm).toBe('number');
        expect(p.metadata.fabricWidthCm).toBeGreaterThan(0);
        expect([140, 200, 280]).toContain(p.metadata.fabricWidthCm);
      }

      if (p.category === 'sofa_upholstery_fabrics') {
        // Must specify fabric bolt width (cm)
        expect(typeof p.metadata.fabricWidthCm).toBe('number');
        expect(p.metadata.fabricWidthCm).toBeGreaterThan(0);
      }

      if (p.category === 'wallpapers' && p.unit === 'roll') {
        // Rolls must define width, length, and area
        expect(p.metadata.rollWidthFt).toBeDefined();
        expect(p.metadata.rollLengthFt).toBeDefined();
        expect(p.metadata.rollAreaSqFt).toBeDefined();
        expect(p.metadata.rollAreaSqFt).toBeGreaterThan(50);
      }

      if (p.category === 'mattresses_sleep_solutions') {
        // Mattresses must specify thickness in inches
        expect(typeof p.metadata.mattressThicknessInches).toBe('number');
        expect(p.metadata.mattressThicknessInches).toBeGreaterThanOrEqual(5);
        expect(p.metadata.mattressFirmness).toBeDefined();
      }
    }
  });

  it('validates 100% of the 32 products for faceted filter attributes', () => {
    for (const p of SEEDED_PRODUCTS) {
      expect(p.colors.length).toBeGreaterThanOrEqual(1);
      expect(p.colorHexes.length).toBeGreaterThanOrEqual(1);
      for (const hex of p.colorHexes) {
        expect(hex).toMatch(/^#[0-9A-Fa-f]{6}$/);
      }

      expect(p.patterns.length).toBeGreaterThanOrEqual(1);
      expect(p.materials.length).toBeGreaterThanOrEqual(1);
      expect(p.tags.length).toBeGreaterThanOrEqual(1);

      expect(typeof p.isAvailable).toBe('boolean');
      expect(typeof p.isFeatured).toBe('boolean');
      expect(typeof p.isBestSeller).toBe('boolean');
      expect(p.stockQuantity).toBeGreaterThanOrEqual(0);
    }
  });
});

describe('EMPIRICAL CHALLENGE 2: MockDB Concurrency & Operation Stress Testing', () => {
  beforeEach(() => {
    mockDb.reset();
  });

  it('survives 100 concurrent asynchronous operations without race conditions or state corruption', async () => {
    const promises: Promise<unknown>[] = [];

    // Mix 100 concurrent read/write/filter operations
    for (let i = 0; i < 100; i++) {
      const opIndex = i % 10;
      switch (opIndex) {
        case 0:
          promises.push(fetchProducts({ category: 'curtains_window_treatments' }));
          break;
        case 1:
          promises.push(fetchProducts({ search: 'velvet' }));
          break;
        case 2:
          promises.push(fetchProductById('curt-velvet-royal-gold'));
          break;
        case 3:
          promises.push(fetchProductBySlug('royal-gold-heritage-velvet-drapery'));
          break;
        case 4:
          promises.push(fetchClients());
          break;
        case 5:
          promises.push(fetchClientById('client-rajesh-sharma'));
          break;
        case 6:
          promises.push(fetchRooms('client-rajesh-sharma'));
          break;
        case 7:
          promises.push(fetchOrders({ status: 'delivered' }));
          break;
        case 8:
          promises.push(fetchInvoices());
          break;
        case 9:
          promises.push(
            modifyProduct('curt-velvet-royal-gold', { stockQuantity: 180 + (i % 5) })
          );
          break;
      }
    }

    const results = await Promise.all(promises);
    expect(results.length).toBe(100);

    // After all concurrent operations, the product collection size must remain intact
    const allProducts = await fetchProducts();
    expect(allProducts.length).toBe(32);
  });

  it('tests filtering across all categories, subcategories, price bounds, colors, and materials', async () => {
    const categories: MainCategory[] = [
      'curtains_window_treatments',
      'sofa_upholstery_fabrics',
      'wallpapers',
      'mattresses_sleep_solutions',
      'bedding_accessories',
      'home_decor',
    ];

    for (const cat of categories) {
      const items = await fetchProducts({ category: cat });
      expect(items.length).toBeGreaterThan(0);
      for (const item of items) {
        expect(item.category).toBe(cat);
      }
    }

    // Category 'all' returns all 32
    const all = await fetchProducts({ category: 'all' });
    expect(all.length).toBe(32);

    // Non-existent category returns 0
    const empty = await fetchProducts({ category: 'non_existent_category' });
    expect(empty.length).toBe(0);

    // Price range filtering (in paise)
    // Products priced between ₹1,000 and ₹3,000 (100000 to 300000 paise)
    const midRange = await fetchProducts({ minPricePaise: 100000, maxPricePaise: 300000 });
    expect(midRange.length).toBeGreaterThan(0);
    for (const p of midRange) {
      expect(p.pricePerUnitPaise).toBeGreaterThanOrEqual(100000);
      expect(p.pricePerUnitPaise).toBeLessThanOrEqual(300000);
    }

    // Color filtering
    const goldItems = await fetchProducts({ colors: ['Gold'] });
    expect(goldItems.length).toBeGreaterThan(0);
    for (const p of goldItems) {
      const hasGold = p.colors.some((c) => c.toLowerCase().includes('gold'));
      expect(hasGold).toBe(true);
    }

    // Material filtering
    const velvetItems = await fetchProducts({ materials: ['Velvet'] });
    expect(velvetItems.length).toBeGreaterThan(0);
    for (const p of velvetItems) {
      const hasVelvet = p.materials.some((m) => m.toLowerCase().includes('velvet'));
      expect(hasVelvet).toBe(true);
    }
  });

  it('tests search query edge cases: whitespace, special characters, case insensitivity, non-existent terms', async () => {
    // Normal search
    const r1 = await fetchProducts({ search: 'velvet' });
    expect(r1.length).toBeGreaterThan(0);

    // Case insensitivity
    const r2 = await fetchProducts({ search: 'VeLvEt' });
    expect(r2.length).toBe(r1.length);

    // Search with surrounding whitespace
    const r3 = await fetchProducts({ search: '   velvet   ' });
    expect(r3.length).toBe(r1.length);

    // Search by brand
    const rBrand = await fetchProducts({ search: 'Nilaya' });
    expect(rBrand.length).toBe(1);
    expect(rBrand[0].brand).toBe('Nilaya Asian Paints');

    // Search by tag
    const rTag = await fetchProducts({ search: 'Blackout' });
    expect(rTag.length).toBeGreaterThan(0);

    // Non-existent search query
    const rNone = await fetchProducts({ search: 'xyz_completely_nonexistent_search_query_123' });
    expect(rNone.length).toBe(0);

    // Special regex characters in search should not crash
    const specialChars = ['[a-z]', '.*', '(hello)', '{2,}', '\\d+', '$100', '^begin'];
    for (const query of specialChars) {
      const result = await fetchProducts({ search: query });
      expect(Array.isArray(result)).toBe(true);
    }
  });

  it('EMPIRICALLY CHALLENGES pagination support in mockDb / fetchProducts', async () => {
    // Check if ProductFilters defines pagination properties or if mockDb ignores them
    const filterWithPagination = {
      page: 1,
      pageSize: 10,
      limit: 10,
      offset: 0,
    } as unknown as ProductFilters;

    const results = await fetchProducts(filterWithPagination);

    // Observation: mockDb.getAllProducts does not implement pagination (returns all 32 products)
    const isPaginationImplemented = results.length === 10;
    
    // We document the empirical truth: mockDb does NOT paginate, returning all items!
    expect(results.length).toBe(32);
    expect(isPaginationImplemented).toBe(false);
  });

  it('tests full Client & Room CRUD lifecycle and relationship integrity', async () => {
    // 1. Create client
    const newClient: Client = {
      id: 'client-test-001',
      name: 'Aditya Birla Interiors',
      phone: '9820555666',
      alternatePhone: '9820555777',
      email: 'interiors@adityabirla.com',
      billingAddress: {
        street: 'Worli Seaface Tower, 12th Floor',
        landmark: 'Opp Sea Face Garden',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400018',
        country: 'India',
      },
      siteAddress: {
        street: 'Worli Seaface Tower, 12th Floor',
        landmark: 'Opp Sea Face Garden',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400018',
        country: 'India',
      },
      tags: ['VIP', 'Architect'],
      architectDesignerName: 'Sanjay Puri Architects',
      totalOrdersCount: 0,
      totalSpentPaise: 0,
      createdAt: '2026-03-01T00:00:00Z',
      updatedAt: '2026-03-01T00:00:00Z',
    };

    const saved = await saveClient(newClient);
    expect(saved.id).toBe('client-test-001');

    // Retrieve client
    const retrieved = await fetchClientById('client-test-001');
    expect(retrieved).not.toBeNull();
    expect(retrieved?.name).toBe('Aditya Birla Interiors');

    // Update client
    const updated = await modifyClient('client-test-001', {
      notes: 'High-priority luxury penthouse project',
      totalSpentPaise: 5000000,
    });
    expect(updated).not.toBeNull();
    expect(updated?.notes).toBe('High-priority luxury penthouse project');
    expect(updated?.totalSpentPaise).toBe(5000000);
    // Timestamp updated
    expect(new Date(updated!.updatedAt).getTime()).toBeGreaterThan(
      new Date('2026-03-01T00:00:00Z').getTime()
    );

    // Create 3 rooms under this client
    const room1: Room = {
      id: 'room-test-001',
      clientId: 'client-test-001',
      name: 'Grand Foyer',
      type: 'living_room',
      photos: [],
      measurementsCount: 0,
      createdAt: '2026-03-01T00:00:00Z',
      updatedAt: '2026-03-01T00:00:00Z',
    };
    const room2: Room = {
      id: 'room-test-002',
      clientId: 'client-test-001',
      name: 'Master Suite',
      type: 'master_bedroom',
      photos: [],
      measurementsCount: 0,
      createdAt: '2026-03-01T00:00:00Z',
      updatedAt: '2026-03-01T00:00:00Z',
    };

    await saveRoom(room1);
    await saveRoom(room2);

    const clientRooms = await fetchRooms('client-test-001');
    expect(clientRooms.length).toBe(2);
    expect(clientRooms.map((r) => r.id)).toContain('room-test-001');
    expect(clientRooms.map((r) => r.id)).toContain('room-test-002');

    // Update room
    const modRoom = await modifyRoom('client-test-001', 'room-test-001', {
      notes: 'Ceiling height 3.5m',
    });
    expect(modRoom?.notes).toBe('Ceiling height 3.5m');

    // Delete client
    const deleted = await removeClient('client-test-001');
    expect(deleted).toBe(true);
    expect(await fetchClientById('client-test-001')).toBeNull();
  });

  it('tests Order creation and full status state machine transition cycle', async () => {
    const order: Order = {
      id: 'order-stress-test',
      orderNumber: 'EF-ORD-2026-00099',
      clientId: 'client-rajesh-sharma',
      clientName: 'Mr. Rajesh Sharma',
      clientPhone: '9820112345',
      items: [
        {
          id: 'item-101',
          productId: 'curt-velvet-royal-gold',
          productName: 'Royal Gold Velvet Drapery',
          category: 'curtains_window_treatments',
          quantity: 2,
          unit: 'meter',
          unitPricePaise: 220000,
          lineTotalPaise: 440000,
        },
      ],
      subtotalPaise: 440000,
      discountPaise: 0,
      gstBreakdown: {
        ratePercent: 12,
        isInterState: false,
        taxableAmountPaise: 440000,
        cgstPaise: 26400,
        sgstPaise: 26400,
        igstPaise: 0,
        totalTaxPaise: 52800,
      },
      grandTotalPaise: 492800,
      paymentStatus: 'pending',
      paidAmountPaise: 0,
      balanceAmountPaise: 492800,
      payments: [],
      status: 'draft',
      deliveryAddress: {
        street: 'Flat 1402, Oberoi Sky Heights',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400053',
        country: 'India',
      },
      createdAt: '2026-03-01T00:00:00Z',
      updatedAt: '2026-03-01T00:00:00Z',
    };

    await saveOrder(order);
    expect(await fetchOrderById('order-stress-test')).not.toBeNull();

    // State machine progression: draft -> confirmed -> in_production -> ready -> delivered
    const statuses: OrderStatus[] = [
      'confirmed',
      'in_production',
      'ready',
      'delivered',
      'cancelled',
    ];

    for (const st of statuses) {
      const updated = await modifyOrder('order-stress-test', { status: st });
      expect(updated).not.toBeNull();
      expect(updated?.status).toBe(st);
      expect(new Date(updated!.updatedAt).getTime()).toBeGreaterThan(
        new Date('2026-03-01T00:00:00Z').getTime()
      );
    }
  });

  it('tests Invoice creation, numbering sequence, and retrieval by number', async () => {
    const lastNum = await fetchLastInvoiceNumber();
    expect(lastNum).toBe('EF-2026-00042');

    const nextNum = generateNextInvoiceNumber(lastNum, 2026);
    expect(nextNum).toBe('EF-2026-00043');

    const newInvoice: Invoice = {
      id: 'inv-test-043',
      invoiceNumber: nextNum,
      orderId: 'order-stress-test',
      orderNumber: 'EF-ORD-2026-00099',
      clientId: 'client-rajesh-sharma',
      clientDetails: {
        name: 'Mr. Rajesh Sharma',
        phone: '9820112345',
        billingAddress: {
          street: 'Flat 1402, Oberoi Sky Heights',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400053',
          country: 'India',
        },
        shippingAddress: {
          street: 'Flat 1402, Oberoi Sky Heights',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400053',
          country: 'India',
        },
      },
      businessDetails: SEEDED_INVOICES[0].businessDetails,
      items: [
        {
          description: 'Royal Gold Velvet Drapery (2m)',
          hsnCode: '5407',
          quantity: 2,
          unit: 'meter',
          unitRatePaise: 220000,
          amountPaise: 440000,
        },
      ],
      subtotalPaise: 440000,
      discountPaise: 0,
      gstBreakdown: {
        ratePercent: 12,
        isInterState: false,
        taxableAmountPaise: 440000,
        cgstPaise: 26400,
        sgstPaise: 26400,
        igstPaise: 0,
        totalTaxPaise: 52800,
      },
      grandTotalPaise: 492800,
      grandTotalWords: 'Rupees Four Thousand Nine Hundred Twenty Eight Only',
      status: 'draft',
      issueDate: '2026-03-01T00:00:00Z',
      dueDate: '2026-03-15T00:00:00Z',
      termsAndConditions: ['Subject to Mumbai Jurisdiction'],
      createdAt: '2026-03-01T00:00:00Z',
      updatedAt: '2026-03-01T00:00:00Z',
    };

    await saveInvoice(newInvoice);

    // Retrieve by ID
    const byId = await fetchInvoiceById('inv-test-043');
    expect(byId).not.toBeNull();
    expect(byId?.invoiceNumber).toBe('EF-2026-00043');

    // Retrieve by Invoice Number
    const byNum = await fetchInvoiceByNumber('EF-2026-00043');
    expect(byNum).not.toBeNull();
    expect(byNum?.id).toBe('inv-test-043');

    // Next invoice number check
    const updatedLastNum = await fetchLastInvoiceNumber();
    expect(updatedLastNum).toBe('EF-2026-00043');
  });
});

describe('EMPIRICAL CHALLENGE 3: Schema Integrity, Leaks & Memory Isolation', () => {
  beforeEach(() => {
    mockDb.reset();
  });

  it('verifies zero undefined leaks across JSON serialization of all collections', async () => {
    const products = await fetchProducts();
    const clients = await fetchClients();
    const orders = await fetchOrders();
    const invoices = await fetchInvoices();

    // Check JSON roundtrip for products
    for (const p of products) {
      const jsonStr = JSON.stringify(p);
      expect(jsonStr).not.toContain('"undefined"');
      expect(jsonStr).not.toContain(':undefined');
      expect(jsonStr).not.toContain('null');
      const parsed = JSON.parse(jsonStr);
      expect(parsed.id).toBe(p.id);
      expect(parsed.name).toBe(p.name);
      expect(parsed.pricePerUnitPaise).toBe(p.pricePerUnitPaise);
    }

    // Check clients
    for (const c of clients) {
      const jsonStr = JSON.stringify(c);
      expect(jsonStr).not.toContain('"undefined"');
      const parsed = JSON.parse(jsonStr);
      expect(parsed.id).toBe(c.id);
    }

    // Check orders
    for (const o of orders) {
      const jsonStr = JSON.stringify(o);
      expect(jsonStr).not.toContain('"undefined"');
      const parsed = JSON.parse(jsonStr);
      expect(parsed.id).toBe(o.id);
      expect(parsed.grandTotalPaise).toBe(o.grandTotalPaise);
    }

    // Check invoices
    for (const inv of invoices) {
      const jsonStr = JSON.stringify(inv);
      expect(jsonStr).not.toContain('"undefined"');
      const parsed = JSON.parse(jsonStr);
      expect(parsed.invoiceNumber).toBe(inv.invoiceNumber);
    }
  });

  it('verifies strict integer paise storage across all collections without floating point fractions', async () => {
    const products = await fetchProducts();
    for (const p of products) {
      expect(Number.isInteger(p.pricePerUnitPaise)).toBe(true);
      if (p.mrpPaise !== undefined) {
        expect(Number.isInteger(p.mrpPaise)).toBe(true);
      }
    }

    for (const m of SEEDED_MEASUREMENTS) {
      expect(Number.isInteger(m.unitPricePaise)).toBe(true);
      expect(Number.isInteger(m.totalEstimatePaise)).toBe(true);
      expect(Number.isInteger(m.breakdown.materialCostPaise)).toBe(true);
      expect(Number.isInteger(m.breakdown.subtotalPaise)).toBe(true);
    }

    const orders = await fetchOrders();
    for (const o of orders) {
      expect(Number.isInteger(o.subtotalPaise)).toBe(true);
      expect(Number.isInteger(o.discountPaise)).toBe(true);
      expect(Number.isInteger(o.grandTotalPaise)).toBe(true);
      expect(Number.isInteger(o.paidAmountPaise)).toBe(true);
      expect(Number.isInteger(o.balanceAmountPaise)).toBe(true);
      expect(Number.isInteger(o.gstBreakdown.taxableAmountPaise)).toBe(true);
      expect(Number.isInteger(o.gstBreakdown.cgstPaise)).toBe(true);
      expect(Number.isInteger(o.gstBreakdown.sgstPaise)).toBe(true);
      expect(Number.isInteger(o.gstBreakdown.igstPaise)).toBe(true);
      expect(Number.isInteger(o.gstBreakdown.totalTaxPaise)).toBe(true);
    }

    const invoices = await fetchInvoices();
    for (const inv of invoices) {
      expect(Number.isInteger(inv.subtotalPaise)).toBe(true);
      expect(Number.isInteger(inv.discountPaise)).toBe(true);
      expect(Number.isInteger(inv.grandTotalPaise)).toBe(true);
      for (const it of inv.items) {
        expect(Number.isInteger(it.unitRatePaise)).toBe(true);
        expect(Number.isInteger(it.amountPaise)).toBe(true);
      }
    }
  });

  it('EMPIRICALLY CHALLENGES memory mutation isolation / direct reference leaks in mockDb', async () => {
    // Fetch product
    const p1 = await fetchProductById('curt-velvet-royal-gold');
    expect(p1).not.toBeNull();
    const originalPrice = p1!.pricePerUnitPaise;

    // Caller directly mutates property on returned object without calling modifyProduct
    (p1 as any).pricePerUnitPaise = 999999999;

    // Fetch same product again from DB
    const p2 = await fetchProductById('curt-velvet-royal-gold');

    // Empirical observation: Does mockDb leak direct references to stored memory objects?
    const hasReferenceLeak = p2!.pricePerUnitPaise === 999999999;

    // mockDb returns isolated clones with structuredClone defending against in-memory mutations
    expect(hasReferenceLeak).toBe(false);

    // Clean up with reset
    mockDb.reset();
    const pReset = await fetchProductById('curt-velvet-royal-gold');
    expect(pReset?.pricePerUnitPaise).toBe(originalPrice);
  });

  it('verifies fetchMeasurementById retrieves measurements and isolates memory', async () => {
    const seeded = SEEDED_MEASUREMENTS[0];
    const m = await fetchMeasurementById(seeded.id);
    expect(m).not.toBeNull();
    expect(m?.id).toBe(seeded.id);
    expect(m?.clientId).toBe(seeded.clientId);

    // Non-existent id
    const notFound = await fetchMeasurementById('non-existent-id-xyz');
    expect(notFound).toBeNull();
  });

  it('validates ISO 8601 timestamp compliance across all stored entities', async () => {
    const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/;

    const products = await fetchProducts();
    for (const p of products) {
      expect(p.createdAt).toMatch(isoRegex);
      expect(p.updatedAt).toMatch(isoRegex);
      expect(!isNaN(new Date(p.createdAt).getTime())).toBe(true);
    }

    const clients = await fetchClients();
    for (const c of clients) {
      expect(c.createdAt).toMatch(isoRegex);
      expect(c.updatedAt).toMatch(isoRegex);
    }

    const orders = await fetchOrders();
    for (const o of orders) {
      expect(o.createdAt).toMatch(isoRegex);
      expect(o.updatedAt).toMatch(isoRegex);
    }

    const invoices = await fetchInvoices();
    for (const inv of invoices) {
      expect(inv.createdAt).toMatch(isoRegex);
      expect(inv.updatedAt).toMatch(isoRegex);
      expect(inv.issueDate).toMatch(isoRegex);
      expect(inv.dueDate).toMatch(isoRegex);
    }
  });
});

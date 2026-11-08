import { describe, it, expect } from 'vitest';
import { SEEDED_PRODUCTS, SEEDED_CLIENTS, SEEDED_ORDERS, SEEDED_INVOICES } from '@/lib/firebase/seed-data';
import { mockDb } from '@/lib/firebase/mock-db';
import {
  fetchProducts,
  fetchProductById,
  fetchProductBySlug,
  fetchClients,
  fetchOrders,
  fetchInvoices,
} from '@/lib/firebase/firestore';

describe('Seed Data & Catalog Integrity', () => {
  it('contains at least 32 products across all 6 core categories', () => {
    expect(SEEDED_PRODUCTS.length).toBeGreaterThanOrEqual(32);

    const categories = new Set(SEEDED_PRODUCTS.map((p) => p.category));
    expect(categories.has('curtains_window_treatments')).toBe(true);
    expect(categories.has('sofa_upholstery_fabrics')).toBe(true);
    expect(categories.has('wallpapers')).toBe(true);
    expect(categories.has('mattresses_sleep_solutions')).toBe(true);
    expect(categories.has('bedding_accessories')).toBe(true);
    expect(categories.has('home_decor')).toBe(true);
  });

  it('verifies all products have genuine prices, positive stock, HSN codes, and swatches', () => {
    for (const p of SEEDED_PRODUCTS) {
      expect(p.id).toBeDefined();
      expect(p.name.length).toBeGreaterThan(2);
      expect(p.pricePerUnitPaise).toBeGreaterThan(0);
      expect(p.stockQuantity).toBeGreaterThanOrEqual(0);
      expect(p.hsnCode).toMatch(/^[0-9]{4}$/);
      expect([5, 12, 18]).toContain(p.gstRatePercent);
      expect(p.swatchImage.length).toBeGreaterThan(5);
      expect(p.images.length).toBeGreaterThan(0);
      expect(p.colors.length).toBeGreaterThan(0);
      expect(p.materials.length).toBeGreaterThan(0);
      expect(p.patterns.length).toBeGreaterThan(0);
    }
  });

  it('verifies sample clients, orders, and invoices exist and are valid', () => {
    expect(SEEDED_CLIENTS.length).toBeGreaterThanOrEqual(2);
    expect(SEEDED_ORDERS.length).toBeGreaterThanOrEqual(1);
    expect(SEEDED_INVOICES.length).toBeGreaterThanOrEqual(1);

    const client = SEEDED_CLIENTS[0];
    expect(client.phone).toMatch(/^[6-9]\d{9}$/);
    expect(client.billingAddress.city).toBe('Mumbai');

    const order = SEEDED_ORDERS[0];
    expect(order.orderNumber).toMatch(/^EF-ORD-/);
    expect(order.grandTotalPaise).toBeGreaterThan(0);

    const invoice = SEEDED_INVOICES[0];
    expect(invoice.invoiceNumber).toMatch(/^EF-2026-/);
    expect(invoice.businessDetails.gstin).toBe('27AABCE1234F1Z5');
  });
});

describe('Data Layer & Mock Database Operations', () => {
  it('retrieves products by category filter', async () => {
    const drapes = await fetchProducts({ category: 'curtains_window_treatments' });
    expect(drapes.length).toBeGreaterThan(0);
    for (const d of drapes) {
      expect(d.category).toBe('curtains_window_treatments');
    }
  });

  it('retrieves products by faceted search term', async () => {
    const results = await fetchProducts({ search: 'velvet' });
    expect(results.length).toBeGreaterThan(0);
    for (const r of results) {
      const match =
        r.name.toLowerCase().includes('velvet') ||
        r.description.toLowerCase().includes('velvet') ||
        r.materials.some((m) => m.toLowerCase().includes('velvet'));
      expect(match).toBe(true);
    }
  });

  it('retrieves product by id and slug', async () => {
    const product = await fetchProductById('curt-velvet-royal-gold');
    expect(product).not.toBeNull();
    expect(product?.name).toBe('Royal Gold Heritage Velvet Drapery');

    const bySlug = await fetchProductBySlug('royal-gold-heritage-velvet-drapery');
    expect(bySlug).not.toBeNull();
    expect(bySlug?.id).toBe('curt-velvet-royal-gold');
  });

  it('fetches clients, orders, and invoices via unified data layer', async () => {
    const clients = await fetchClients();
    expect(clients.length).toBeGreaterThanOrEqual(2);

    const orders = await fetchOrders();
    expect(orders.length).toBeGreaterThanOrEqual(1);

    const invoices = await fetchInvoices();
    expect(invoices.length).toBeGreaterThanOrEqual(1);
  });
});

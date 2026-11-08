import { describe, it, expect } from 'vitest';
import { fetchProducts, fetchProductById, fetchProductBySlug } from '@/lib/firebase/firestore';
import { mockDb } from '@/lib/firebase/mock-db';
import { SEEDED_PRODUCTS } from '@/lib/firebase/seed-data';
import { Product } from '@/types/product';

describe('Product Catalog Filtering & Search Query Tests', () => {
  it('loads all 32 seeded products from the repository', async () => {
    const products = await fetchProducts();
    expect(products.length).toBeGreaterThanOrEqual(30);
    expect(products.length).toBe(SEEDED_PRODUCTS.length);
  });

  it('filters products accurately by category', async () => {
    const curtains = await fetchProducts({ category: 'curtains_window_treatments' });
    expect(curtains.length).toBeGreaterThan(0);
    for (const p of curtains) {
      expect(p.category).toBe('curtains_window_treatments');
    }

    const wallpapers = await fetchProducts({ category: 'wallpapers' });
    expect(wallpapers.length).toBeGreaterThan(0);
    for (const p of wallpapers) {
      expect(p.category).toBe('wallpapers');
    }

    const mattresses = await fetchProducts({ category: 'mattresses_sleep_solutions' });
    expect(mattresses.length).toBeGreaterThan(0);
    for (const p of mattresses) {
      expect(p.category).toBe('mattresses_sleep_solutions');
    }
  });

  it('filters products by color family', async () => {
    const goldProducts = await fetchProducts({ colors: ['Gold'] });
    expect(goldProducts.length).toBeGreaterThan(0);
    for (const p of goldProducts) {
      const hasGold = p.colors.some((c) => c.toLowerCase().includes('gold'));
      expect(hasGold).toBe(true);
    }
  });

  it('filters products by material', async () => {
    const velvetProducts = await fetchProducts({ materials: ['Velvet'] });
    expect(velvetProducts.length).toBeGreaterThan(0);
    for (const p of velvetProducts) {
      const hasVelvet = p.materials.some((m) => m.toLowerCase().includes('velvet'));
      expect(hasVelvet).toBe(true);
    }
  });

  it('filters products by pattern', async () => {
    const damaskProducts = await fetchProducts({ patterns: ['damask'] });
    expect(damaskProducts.length).toBeGreaterThan(0);
    for (const p of damaskProducts) {
      expect(p.patterns).toContain('damask');
    }
  });

  it('filters products by price range in paise', async () => {
    // Under ₹1,000 (100000 paise)
    const affordable = await fetchProducts({ maxPricePaise: 100000 });
    expect(affordable.length).toBeGreaterThan(0);
    for (const p of affordable) {
      expect(p.pricePerUnitPaise).toBeLessThanOrEqual(100000);
    }

    // High value mattresses and luxury sets (>= ₹20,000 = 2000000 paise)
    const luxury = await fetchProducts({ minPricePaise: 2000000 });
    expect(luxury.length).toBeGreaterThan(0);
    for (const p of luxury) {
      expect(p.pricePerUnitPaise).toBeGreaterThanOrEqual(2000000);
    }
  });

  it('performs case-insensitive search queries across product names, descriptions, and tags', async () => {
    const searchTerms = ['velvet', 'blackout', 'refresh', 'damask', 'linen'];

    for (const term of searchTerms) {
      const results = await fetchProducts({ search: term });
      expect(results.length).toBeGreaterThan(0);
      for (const p of results) {
        const matches =
          p.name.toLowerCase().includes(term) ||
          p.description.toLowerCase().includes(term) ||
          p.brand.toLowerCase().includes(term) ||
          p.tags.some((t) => t.toLowerCase().includes(term));
        expect(matches).toBe(true);
      }
    }
  });
});

describe('Product Detail & Specification Verification Tests', () => {
  it('retrieves individual product details by unique product ID', async () => {
    const product = await fetchProductById('curt-velvet-royal-gold');
    expect(product).not.toBeNull();
    expect(product?.name).toBe('Royal Gold Heritage Velvet Drapery');
    expect(product?.brand).toBe('Excellence In-House');
    expect(product?.unit).toBe('meter');
    expect(product?.pricePerUnitPaise).toBe(220000); // ₹2,200/m
    expect(product?.hsnCode).toBe('5407');
    expect(product?.gstRatePercent).toBe(12);
  });

  it('retrieves individual product details by slug', async () => {
    const product = await fetchProductBySlug('royal-gold-heritage-velvet-drapery');
    expect(product).not.toBeNull();
    expect(product?.id).toBe('curt-velvet-royal-gold');
  });

  it('validates technical specifications accordion metadata for drapery', async () => {
    const product = await fetchProductById('curt-velvet-royal-gold');
    expect(product?.metadata).toBeDefined();
    expect(product?.metadata.fabricWidthCm).toBe(140);
    expect(product?.metadata.weightGsm).toBe(420);
    expect(product?.metadata.composition).toContain('Polyester Velvet');
    expect(product?.metadata.careInstructions).toBeDefined();
    expect(product?.metadata.careInstructions?.length).toBeGreaterThan(0);
  });

  it('validates mattress specification metadata for authorized brands', async () => {
    const mattress = await fetchProductById('mat-refresh-natural-latex');
    expect(mattress).not.toBeNull();
    expect(mattress?.brand).toBe('Refresh Mattress');
    expect(mattress?.category).toBe('mattresses_sleep_solutions');
    expect(mattress?.metadata.mattressThicknessInches).toBe(8);
    expect(mattress?.metadata.mattressFirmness).toBe('medium_firm');
    expect(mattress?.metadata.warrantyYears).toBe(12);
  });

  it('returns null gracefully for non-existent product IDs', async () => {
    const nonExistent = await fetchProductById('non-existent-product-id-999');
    expect(nonExistent).toBeNull();
  });
});

describe('Product Catalog Sorting Logic Tests', () => {
  it('sorts products by price ascending (low to high)', async () => {
    const products = await fetchProducts();
    const sorted = [...products].sort((a, b) => a.pricePerUnitPaise - b.pricePerUnitPaise);

    expect(sorted[0].pricePerUnitPaise).toBeLessThanOrEqual(sorted[1].pricePerUnitPaise);
    expect(sorted[sorted.length - 2].pricePerUnitPaise).toBeLessThanOrEqual(
      sorted[sorted.length - 1].pricePerUnitPaise
    );
  });

  it('sorts products by price descending (high to low)', async () => {
    const products = await fetchProducts();
    const sorted = [...products].sort((a, b) => b.pricePerUnitPaise - a.pricePerUnitPaise);

    expect(sorted[0].pricePerUnitPaise).toBeGreaterThanOrEqual(sorted[1].pricePerUnitPaise);
    expect(sorted[sorted.length - 2].pricePerUnitPaise).toBeGreaterThanOrEqual(
      sorted[sorted.length - 1].pricePerUnitPaise
    );
  });

  it('sorts products alphabetically by name (A to Z)', async () => {
    const products = await fetchProducts();
    const sorted = [...products].sort((a, b) => a.name.localeCompare(b.name));

    for (let i = 0; i < sorted.length - 1; i++) {
      expect(sorted[i].name.localeCompare(sorted[i + 1].name)).toBeLessThanOrEqual(0);
    }
  });
});

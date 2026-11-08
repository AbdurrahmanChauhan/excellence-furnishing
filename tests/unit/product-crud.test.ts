import { describe, it, expect, beforeEach } from 'vitest';
import { productFormSchema } from '@/lib/validators/schemas';
import { fetchProducts, fetchProductById, saveProduct, modifyProduct, removeProduct } from '@/lib/firebase/firestore';
import { mockDb } from '@/lib/firebase/mock-db';
import { Product } from '@/types/product';
import { toPaise, toRupees } from '@/lib/utils';

describe('Admin Product Management (CRUD) Tests', () => {
  beforeEach(() => {
    mockDb.reset();
  });

  it('validates a valid product form submission using Zod productFormSchema', () => {
    const validData = {
      name: 'Bespoke Organza Sheer Curtains',
      slug: 'bespoke-organza-sheer-curtains',
      brand: 'In-House Excellence',
      category: 'curtains_window_treatments',
      subcategory: 'sheer_curtains',
      description: 'Airy, translucent organza sheer fabric with gentle light diffusion for Mumbai living rooms.',
      shortDescription: 'Translucent sheer drapes.',
      pricePerUnit: 650,
      unit: 'meter',
      mrp: 850,
      stockQuantity: 45,
      isAvailable: true,
      isFeatured: true,
      isBestSeller: false,
      hsnCode: '5407',
      gstRatePercent: 18,
      swatchImage: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=400&q=80',
      images: ['https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80'],
      colors: ['Ivory', 'White'],
      colorHexes: ['#FAF3E0', '#FFFFFF'],
      patterns: ['plain'],
      materials: ['Organza', 'Polyester'],
      tags: ['Sheer', 'Living Room'],
      fabricWidthCm: 140,
      weightGsm: 120,
    };

    const parsed = productFormSchema.safeParse(validData);
    expect(parsed.success).toBe(true);
  });

  it('rejects invalid product form submission with descriptive errors', () => {
    const invalidData = {
      name: 'No', // Too short (min 3)
      slug: 'n',
      brand: '',
      category: 'invalid_category', // invalid enum
      subcategory: '',
      description: 'short', // Too short (min 10)
      pricePerUnit: -500, // Negative price
      unit: 'invalid_unit',
      stockQuantity: -10, // Negative stock
      swatchImage: 'not-a-url', // Invalid URL
      images: [], // Missing images
    };

    const parsed = productFormSchema.safeParse(invalidData);
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      expect(fieldErrors.name).toBeDefined();
      expect(fieldErrors.pricePerUnit).toBeDefined();
      expect(fieldErrors.stockQuantity).toBeDefined();
      expect(fieldErrors.swatchImage).toBeDefined();
      expect(fieldErrors.images).toBeDefined();
    }
  });

  it('creates, retrieves, and persists a new product', async () => {
    const timestamp = new Date().toISOString();
    const newProduct: Product = {
      id: 'prod-new-test-001',
      slug: 'nilaya-damask-metallic-wallpaper',
      name: 'Nilaya Damask Metallic Wallpaper',
      brand: 'Nilaya (Asian Paints)',
      category: 'wallpapers',
      subcategory: 'textured_metallic',
      description: 'Luxury metallic embossed wallpaper roll imported for high-end master bedrooms.',
      shortDescription: 'Metallic embossed wallpaper.',
      pricePerUnitPaise: toPaise(4500),
      unit: 'roll',
      mrpPaise: toPaise(6000),
      images: ['https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1000&q=80'],
      swatchImage: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=400&q=80',
      hsnCode: '4814',
      gstRatePercent: 18,
      colors: ['Gold', 'Bronze'],
      colorHexes: ['#B8860B', '#CD7F32'],
      patterns: ['damask', 'textured'],
      materials: ['Vinyl Coated', 'Non-Woven'],
      tags: ['Luxury', 'Metallic'],
      stockQuantity: 25,
      isAvailable: true,
      isFeatured: true,
      isBestSeller: false,
      metadata: {
        rollWidthFt: 1.75,
        rollLengthFt: 33,
        rollAreaSqFt: 57,
      },
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    await saveProduct(newProduct);

    const fetched = await fetchProductById('prod-new-test-001');
    expect(fetched).not.toBeNull();
    expect(fetched?.name).toBe('Nilaya Damask Metallic Wallpaper');
    expect(fetched?.pricePerUnitPaise).toBe(toPaise(4500));
    expect(fetched?.stockQuantity).toBe(25);
  });

  it('updates product fields and modifies stock availability', async () => {
    const products = await fetchProducts();
    const productToUpdate = products[0];

    const updated = await modifyProduct(productToUpdate.id, {
      pricePerUnitPaise: toPaise(1800),
      stockQuantity: 5, // Low stock
      description: 'Updated description for luxury drapes.',
    });

    expect(updated?.pricePerUnitPaise).toBe(toPaise(1800));
    expect(updated?.stockQuantity).toBe(5);

    const reFetched = await fetchProductById(productToUpdate.id);
    expect(reFetched?.pricePerUnitPaise).toBe(toPaise(1800));
    expect(reFetched?.stockQuantity).toBe(5);
  });

  it('accurately toggles product storefront active visibility (isAvailable)', async () => {
    const products = await fetchProducts();
    const product = products[0];
    const initialAvailability = product.isAvailable;

    // Toggle off
    await modifyProduct(product.id, { isAvailable: !initialAvailability });
    let fetched = await fetchProductById(product.id);
    expect(fetched?.isAvailable).toBe(!initialAvailability);

    // Toggle back on
    await modifyProduct(product.id, { isAvailable: initialAvailability });
    fetched = await fetchProductById(product.id);
    expect(fetched?.isAvailable).toBe(initialAvailability);
  });

  it('distinguishes stock status categories: in stock, low stock (<=10), and out of stock (0)', () => {
    const classifyStock = (qty: number) => {
      if (qty === 0) return 'out_of_stock';
      if (qty <= 10) return 'low_stock';
      return 'in_stock';
    };

    expect(classifyStock(50)).toBe('in_stock');
    expect(classifyStock(11)).toBe('in_stock');
    expect(classifyStock(10)).toBe('low_stock');
    expect(classifyStock(1)).toBe('low_stock');
    expect(classifyStock(0)).toBe('out_of_stock');
  });

  it('removes or soft deletes a product when requested', async () => {
    const products = await fetchProducts();
    const productToDelete = products[products.length - 1];

    const deleted = await removeProduct(productToDelete.id);
    expect(deleted).toBe(true);

    const check = await fetchProductById(productToDelete.id);
    expect(check).toBeNull();
  });
});

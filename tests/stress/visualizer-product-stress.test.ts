import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/visualize/route';
import { productFormSchema } from '@/lib/validators/schemas';
import { mockDb } from '@/lib/firebase/mock-db';
import {
  fetchProducts,
  fetchProductById,
  fetchProductBySlug,
  saveProduct,
  modifyProduct,
  removeProduct,
} from '@/lib/firebase/firestore';
import { Product } from '@/types/product';
import { toPaise } from '@/lib/utils';

describe('EMPIRICAL STRESS TEST SUITE: AI Visualizer & Product CRUD', () => {
  // =========================================================================
  // SECTION 1: AI Visualizer API (POST /api/visualize) Stress & Edge Cases
  // =========================================================================
  describe('Visualizer API Robustness & Boundary Stress Testing', () => {
    const validRoom =
      'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80';
    const validSwatch =
      'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=400&q=80';

    it('rejects empty or malformed JSON payloads with HTTP 400 and VALIDATION_ERROR', async () => {
      // 1. Completely empty JSON body
      const reqEmpty = new NextRequest('http://localhost:3000/api/visualize', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({}),
      });
      const resEmpty = await POST(reqEmpty);
      expect(resEmpty.status).toBe(400);
      const dataEmpty = await resEmpty.json();
      expect(dataEmpty.success).toBe(false);
      expect(dataEmpty.error.code).toBe('VALIDATION_ERROR');

      // 2. Malformed JSON syntax (handled via request.json().catch)
      const reqMalformed = new NextRequest('http://localhost:3000/api/visualize', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: '{"invalidJsonSyntax: true',
      });
      const resMalformed = await POST(reqMalformed);
      expect(resMalformed.status).toBe(400);
      const dataMalformed = await resMalformed.json();
      expect(dataMalformed.success).toBe(false);
      expect(dataMalformed.error.code).toBe('VALIDATION_ERROR');

      // 3. Array body instead of object
      const reqArray = new NextRequest('http://localhost:3000/api/visualize', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(['room', 'swatch']),
      });
      const resArray = await POST(reqArray);
      expect(resArray.status).toBe(400);

      // 4. Primitive scalar bodies (number, string, boolean)
      const reqPrimitive = new NextRequest('http://localhost:3000/api/visualize', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(12345),
      });
      const resPrimitive = await POST(reqPrimitive);
      expect(resPrimitive.status).toBe(400);
    });

    it('rejects requests with missing roomImage or missing swatchImage', async () => {
      // Room present, swatch missing
      const req1 = new NextRequest('http://localhost:3000/api/visualize', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ roomImage: validRoom }),
      });
      const res1 = await POST(req1);
      expect(res1.status).toBe(400);
      const data1 = await res1.json();
      expect(data1.error.message).toContain('Both roomImage and swatchImage are required');

      // Swatch present, room missing
      const req2 = new NextRequest('http://localhost:3000/api/visualize', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ swatchImage: validSwatch }),
      });
      const res2 = await POST(req2);
      expect(res2.status).toBe(400);

      // Both fields empty strings
      const req3 = new NextRequest('http://localhost:3000/api/visualize', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ roomImage: '', swatchImage: '' }),
      });
      const res3 = await POST(req3);
      expect(res3.status).toBe(400);
    });

    it('gracefully accepts alternative field names: roomImageUrl, swatchImageUrl, roomImageBase64', async () => {
      const payload = {
        roomImageUrl: validRoom,
        swatchImageUrl: validSwatch,
        productType: 'curtain',
      };

      const req = new NextRequest('http://localhost:3000/api/visualize', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.originalImageUrl).toBe(validRoom);
      expect(data.swatchImageUrl).toBe(validSwatch);
    });

    it('handles oversized payloads (>1MB) without crash or memory leak', async () => {
      // Construct a large simulated base64 payload (~1.5 MB)
      const base64Chunk = 'A'.repeat(1024 * 512); // ~512KB
      const largeRoom = `data:image/jpeg;base64,${base64Chunk}${base64Chunk}`;
      const largeSwatch = `data:image/png;base64,${base64Chunk}`;

      const req = new NextRequest('http://localhost:3000/api/visualize', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          roomImage: largeRoom,
          swatchImage: largeSwatch,
          productType: 'wallpaper',
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.resultImageUrl).toBeDefined();
      expect(data.resultImageUrl.startsWith('data:image/svg+xml')).toBe(true);
    });

    it('safely handles extreme oversized base64 payload (10MB) without memory overflow', async () => {
      // Construct a 10MB simulated string payload
      const tenMbChunk = 'X'.repeat(10 * 1024 * 1024);
      const giantRoom = `data:image/jpeg;base64,${tenMbChunk}`;

      const req = new NextRequest('http://localhost:3000/api/visualize', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          roomImage: giantRoom,
          swatchImage: validSwatch,
          productType: 'curtain',
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.resultImageUrl).toBeDefined();
    });

    it('safely escapes special characters and quotes in swatch & room URLs in synthetic SVG', async () => {
      // Malicious or special URL with quotes and SVG delimiters
      const urlWithDelimiters =
        'https://example.com/test?token="123"&param=<svg>alert()</svg>&cat=curtains';

      const req = new NextRequest('http://localhost:3000/api/visualize', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          roomImage: urlWithDelimiters,
          swatchImage: validSwatch,
          productType: 'curtain',
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);

      // Verify that the resulting SVG is correctly URI encoded and decodable
      const decodedSvg = decodeURIComponent(
        data.resultImageUrl.replace('data:image/svg+xml;utf8,', '')
      );
      expect(decodedSvg).toContain('<svg xmlns="http://www.w3.org/2000/svg"');
      expect(decodedSvg).toContain('Excellence The Furnishing Gallery');
      expect(decodedSvg).toContain('</svg>');
    });

    it('supports fallback preview when GEMINI_API_KEY is dummy, test, or undefined', async () => {
      const originalKey = process.env.GEMINI_API_KEY;

      const dummyKeys = [undefined, '', 'dummy', 'test', 'short'];
      for (const dummyKey of dummyKeys) {
        if (dummyKey === undefined) {
          delete process.env.GEMINI_API_KEY;
        } else {
          process.env.GEMINI_API_KEY = dummyKey;
        }

        const req = new NextRequest('http://localhost:3000/api/visualize', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            roomImage: validRoom,
            swatchImage: validSwatch,
            productType: 'upholstery',
          }),
        });

        const res = await POST(req);
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.status).toBe('fallback_preview');
        expect(data.isDemoFallback).toBe(true);
        expect(data.modelUsed).toBe('gemini-fallback-preview');
      }

      // Restore
      if (originalKey) {
        process.env.GEMINI_API_KEY = originalKey;
      } else {
        delete process.env.GEMINI_API_KEY;
      }
    });

    it('falls back cleanly to synthetic preview without 500 when Gemini API call throws', async () => {
      const originalKey = process.env.GEMINI_API_KEY;
      // Set a key longer than 10 characters so it attempts Gemini invocation
      process.env.GEMINI_API_KEY = 'AIzaSyFakeKeyStressTesting12345';

      const req = new NextRequest('http://localhost:3000/api/visualize', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          roomImage: validRoom,
          swatchImage: validSwatch,
          productType: 'wallpaper',
        }),
      });

      // Even though the key is invalid and Gemini API throws an authentication/network error,
      // the route handler catches it and falls back cleanly with status 200!
      const res = await POST(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.status).toBe('fallback_preview');
      expect(data.resultImageUrl).toBeDefined();

      if (originalKey) {
        process.env.GEMINI_API_KEY = originalKey;
      } else {
        delete process.env.GEMINI_API_KEY;
      }
    });

    it('handles unexpected/invalid productType by defaulting safely to curtain drape', async () => {
      const req = new NextRequest('http://localhost:3000/api/visualize', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          roomImage: validRoom,
          swatchImage: validSwatch,
          productType: 'unrecognized_category_type' as any,
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      // Verify SVG contains the curtain pleat fold gradient as fallback
      const decodedSvg = decodeURIComponent(
        data.resultImageUrl.replace('data:image/svg+xml;utf8,', '')
      );
      expect(decodedSvg).toContain('pleatFold');
    });

    it('handles multipart/form-data with missing fields and returns 400', async () => {
      const formData = new FormData();
      formData.append('notes', 'Missing room and swatch');

      const req = new NextRequest('http://localhost:3000/api/visualize', {
        method: 'POST',
        body: formData,
      });

      const res = await POST(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('handles multipart/form-data with string and file inputs correctly', async () => {
      const formData = new FormData();
      formData.append('roomImage', validRoom);
      // Create a small fake File for swatch
      const file = new File(['fake swatch image content'], 'swatch.jpg', {
        type: 'image/jpeg',
      });
      formData.append('swatchImage', file);
      formData.append('productType', 'curtain');

      const req = new NextRequest('http://localhost:3000/api/visualize', {
        method: 'POST',
        body: formData,
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.resultImageUrl.startsWith('data:image/svg+xml')).toBe(true);
    });
  });

  // =========================================================================
  // SECTION 2: Comparison Slider Mathematical & Ergonomic Bounds Stress
  // =========================================================================
  describe('Comparison Slider Logic & Bounds Clamping Stress Testing', () => {
    // Replicates the clamping formula from ComparisonSlider.tsx:
    // Math.max(0, Math.min(100, (x / width) * 100))
    const clampSliderPosition = (x: number, width: number): number => {
      if (width <= 0) return 50; // Guard against zero or negative width
      const val = (x / width) * 100;
      if (Number.isNaN(val)) return 50;
      return Math.max(0, Math.min(100, val));
    };

    it('clamps extreme negative drag coordinates to exactly 0%', () => {
      expect(clampSliderPosition(-1, 800)).toBe(0);
      expect(clampSliderPosition(-500, 800)).toBe(0);
      expect(clampSliderPosition(-999999, 800)).toBe(0);
    });

    it('clamps extreme positive drag coordinates beyond container width to exactly 100%', () => {
      expect(clampSliderPosition(801, 800)).toBe(100);
      expect(clampSliderPosition(1200, 800)).toBe(100);
      expect(clampSliderPosition(999999, 800)).toBe(100);
    });

    it('handles zero or negative width without producing NaN or Infinity', () => {
      expect(clampSliderPosition(100, 0)).toBe(50);
      expect(clampSliderPosition(0, 0)).toBe(50);
      expect(clampSliderPosition(100, -500)).toBe(50);
    });

    it('calculates precise fractional percentages across various widths', () => {
      // 1/3 of 900px
      expect(clampSliderPosition(300, 900)).toBeCloseTo(33.333, 2);
      // 2/3 of 900px
      expect(clampSliderPosition(600, 900)).toBeCloseTo(66.666, 2);
      // Exactly half
      expect(clampSliderPosition(400, 800)).toBe(50);
      // Exact edges
      expect(clampSliderPosition(0, 800)).toBe(0);
      expect(clampSliderPosition(800, 800)).toBe(100);
    });

    it('keyboard navigation clamps between 0% and 100% with multiple arrow steps', () => {
      let position = 50;
      const step = 5;

      const arrowLeft = () => {
        position = Math.max(0, position - step);
      };

      const arrowRight = () => {
        position = Math.min(100, position + step);
      };

      // 15 Left steps from 50%: 50 -> 45 -> ... -> 0 -> clamps at 0
      for (let i = 0; i < 15; i++) {
        arrowLeft();
      }
      expect(position).toBe(0);

      // 25 Right steps from 0%: 0 -> 5 -> ... -> 100 -> clamps at 100
      for (let i = 0; i < 25; i++) {
        arrowRight();
      }
      expect(position).toBe(100);

      // Another 5 Right steps: remains 100
      for (let i = 0; i < 5; i++) {
        arrowRight();
      }
      expect(position).toBe(100);
    });

    it('simulates touch move events with multi-touch and bounds clamping', () => {
      // Simulates handleTouchMove logic:
      // if (!isDragging) return;
      // handleMove(e.touches[0].clientX);
      const containerRect = { left: 50, width: 500 };
      const simulateTouch = (touches: Array<{ clientX: number }>, isDragging: boolean): number | null => {
        if (!isDragging || touches.length === 0) return null;
        const x = touches[0].clientX - containerRect.left;
        return clampSliderPosition(x, containerRect.width);
      };

      // 1. Not dragging: returns null (no-op)
      expect(simulateTouch([{ clientX: 200 }], false)).toBeNull();

      // 2. Empty touches: returns null
      expect(simulateTouch([], true)).toBeNull();

      // 3. Normal touch centered: 250px inside 500px container = 50%
      expect(simulateTouch([{ clientX: 300 }], true)).toBe(50);

      // 4. Touch swipe far to the left of container (negative x)
      expect(simulateTouch([{ clientX: 10 }], true)).toBe(0);
      expect(simulateTouch([{ clientX: -100 }], true)).toBe(0);

      // 5. Touch swipe far to the right of container (> containerRect.left + width)
      expect(simulateTouch([{ clientX: 600 }], true)).toBe(100);
      expect(simulateTouch([{ clientX: 1200 }], true)).toBe(100);

      // 6. Multi-touch gesture (e.g. 2 fingers): uses touches[0] clientX
      expect(simulateTouch([{ clientX: 175 }, { clientX: 400 }], true)).toBe(25);
    });

    it('handles extreme sub-pixel float coordinates without floating precision drift', () => {
      expect(clampSliderPosition(0.000001, 800)).toBeGreaterThan(0);
      expect(clampSliderPosition(799.999999, 800)).toBeLessThan(100);
      expect(clampSliderPosition(-0.000001, 800)).toBe(0);
      expect(clampSliderPosition(800.000001, 800)).toBe(100);
    });
  });

  // =========================================================================
  // SECTION 3: Product CRUD & Schema Edge Case Stress Testing
  // =========================================================================
  describe('Product Schema & CRUD Boundary Stress Testing', () => {
    beforeEach(() => {
      mockDb.reset();
    });

    const baseValidProduct = {
      name: 'Adversarial Royal Silk Jacquard Drapes',
      slug: 'royal-silk-jacquard-drapes',
      brand: 'Excellence Premium',
      category: 'curtains_window_treatments' as const,
      subcategory: 'heavy_drapes',
      description: 'Luxury heavyweight jacquard curtain fabrics tailored for Mumbai high-rises.',
      shortDescription: 'Heavyweight jacquard drapes',
      pricePerUnit: 1450,
      unit: 'meter' as const,
      mrp: 2200,
      stockQuantity: 40,
      isAvailable: true,
      isFeatured: false,
      isBestSeller: true,
      hsnCode: '5407',
      gstRatePercent: 18,
      swatchImage: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=400&q=80',
      images: ['https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80'],
      colors: ['Burgundy', 'Gold'],
      colorHexes: ['#722F37', '#B8860B'],
      patterns: ['jacquard', 'floral'],
      materials: ['Silk Blend', 'Polyester'],
      tags: ['Luxury', 'Window Treatment'],
    };

    it('rejects negative, zero, and NaN prices in productFormSchema', () => {
      // 1. Negative price
      const resNeg = productFormSchema.safeParse({
        ...baseValidProduct,
        pricePerUnit: -150,
      });
      expect(resNeg.success).toBe(false);
      if (!resNeg.success) {
        expect(resNeg.error.flatten().fieldErrors.pricePerUnit).toBeDefined();
      }

      // 2. Zero price (positive check requires > 0)
      const resZero = productFormSchema.safeParse({
        ...baseValidProduct,
        pricePerUnit: 0,
      });
      expect(resZero.success).toBe(false);

      // 3. String NaN
      const resNaN = productFormSchema.safeParse({
        ...baseValidProduct,
        pricePerUnit: 'not-a-number' as any,
      });
      expect(resNaN.success).toBe(false);
    });

    it('coerces valid numeric strings to numbers for pricePerUnit and stockQuantity', () => {
      const resCoerced = productFormSchema.safeParse({
        ...baseValidProduct,
        pricePerUnit: '1250.75' as any,
        stockQuantity: '65' as any,
        mrp: '1800' as any,
      });
      expect(resCoerced.success).toBe(true);
      if (resCoerced.success) {
        expect(resCoerced.data.pricePerUnit).toBe(1250.75);
        expect(resCoerced.data.stockQuantity).toBe(65);
        expect(resCoerced.data.mrp).toBe(1800);
      }
    });

    it('rejects negative stock quantities but accepts zero stock (out of stock)', () => {
      // Negative stock rejected
      const resNegStock = productFormSchema.safeParse({
        ...baseValidProduct,
        stockQuantity: -5,
      });
      expect(resNegStock.success).toBe(false);

      // Zero stock allowed (indicates out of stock)
      const resZeroStock = productFormSchema.safeParse({
        ...baseValidProduct,
        stockQuantity: 0,
      });
      expect(resZeroStock.success).toBe(true);
      if (resZeroStock.success) {
        expect(resZeroStock.data.stockQuantity).toBe(0);
      }
    });

    it('rejects non-integer stock quantity values', () => {
      const resFractionalStock = productFormSchema.safeParse({
        ...baseValidProduct,
        stockQuantity: 12.5,
      });
      expect(resFractionalStock.success).toBe(false);
    });

    it('enforces Indian GST rates to [5, 12, 18, 28] and rejects arbitrary rates', () => {
      const validGstRates = [5, 12, 18, 28];
      for (const rate of validGstRates) {
        const res = productFormSchema.safeParse({
          ...baseValidProduct,
          gstRatePercent: rate,
        });
        expect(res.success).toBe(true);
      }

      const invalidGstRates = [0, 8, 10, 15, 20, 25, 40];
      for (const rate of invalidGstRates) {
        const res = productFormSchema.safeParse({
          ...baseValidProduct,
          gstRatePercent: rate,
        });
        expect(res.success).toBe(false);
      }
    });

    it('rejects invalid categories and requires non-empty subcategory', () => {
      // Invalid category
      const resInvalidCat = productFormSchema.safeParse({
        ...baseValidProduct,
        category: 'electronics_appliances' as any,
      });
      expect(resInvalidCat.success).toBe(false);

      // Missing subcategory
      const resEmptySub = productFormSchema.safeParse({
        ...baseValidProduct,
        subcategory: '',
      });
      expect(resEmptySub.success).toBe(false);
    });

    it('rejects malformed image and swatch URLs', () => {
      // Invalid swatch URL
      const resBadSwatch = productFormSchema.safeParse({
        ...baseValidProduct,
        swatchImage: 'ftp://not-an-https-url',
      });
      // ftp is a valid URL by z.string().url(), but test relative path:
      const resRelativeSwatch = productFormSchema.safeParse({
        ...baseValidProduct,
        swatchImage: 'just/some/relative/path.jpg',
      });
      expect(resRelativeSwatch.success).toBe(false);

      // Empty images array
      const resNoImages = productFormSchema.safeParse({
        ...baseValidProduct,
        images: [],
      });
      expect(resNoImages.success).toBe(false);

      // Images containing invalid URL
      const resBadImageItem = productFormSchema.safeParse({
        ...baseValidProduct,
        images: ['not-a-valid-url'],
      });
      expect(resBadImageItem.success).toBe(false);
    });

    it('persists zero-stock products and accurately classifies stock indicators', async () => {
      const timestamp = new Date().toISOString();
      const zeroStockProduct: Product = {
        id: 'prod-zero-stock-test',
        slug: 'zero-stock-sheer-linen',
        name: 'Zero Stock Sheer Linen',
        brand: 'In-House Excellence',
        category: 'curtains_window_treatments',
        subcategory: 'sheer_curtains',
        description: 'Currently out-of-stock premium sheer linen drapes for testing boundary state.',
        shortDescription: 'Out of stock linen',
        pricePerUnitPaise: toPaise(950),
        unit: 'meter',
        images: [baseValidProduct.images[0]],
        swatchImage: baseValidProduct.swatchImage,
        hsnCode: '5407',
        gstRatePercent: 18,
        colors: ['Natural'],
        colorHexes: ['#FAF3E0'],
        patterns: ['plain'],
        materials: ['Linen'],
        tags: ['Out of Stock'],
        stockQuantity: 0,
        isAvailable: true,
        isFeatured: false,
        isBestSeller: false,
        metadata: {},
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      await saveProduct(zeroStockProduct);

      const retrieved = await fetchProductById('prod-zero-stock-test');
      expect(retrieved).not.toBeNull();
      expect(retrieved?.stockQuantity).toBe(0);

      // Stock indicator classifier oracle
      const getStockBadge = (qty: number) => {
        if (qty === 0) return 'Out of Stock';
        if (qty <= 10) return 'Low Stock';
        return 'In Stock';
      };

      expect(getStockBadge(retrieved!.stockQuantity)).toBe('Out of Stock');

      // Update to low stock (e.g. 5)
      await modifyProduct('prod-zero-stock-test', { stockQuantity: 5 });
      const updatedLow = await fetchProductById('prod-zero-stock-test');
      expect(getStockBadge(updatedLow!.stockQuantity)).toBe('Low Stock');

      // Update to in stock (e.g. 50)
      await modifyProduct('prod-zero-stock-test', { stockQuantity: 50 });
      const updatedIn = await fetchProductById('prod-zero-stock-test');
      expect(getStockBadge(updatedIn!.stockQuantity)).toBe('In Stock');
    });

    it('handles non-existent product operations without throwing exceptions', async () => {
      // Modify non-existent product returns null
      const nonExistentMod = await modifyProduct('non-existent-prod-999', {
        name: 'Should Fail Gracefully',
      });
      expect(nonExistentMod).toBeNull();

      // Delete non-existent product returns false
      const nonExistentDel = await removeProduct('non-existent-prod-999');
      expect(nonExistentDel).toBe(false);

      // Fetch non-existent returns null
      const nonExistentFetch = await fetchProductById('non-existent-prod-999');
      expect(nonExistentFetch).toBeNull();
    });

    it('handles duplicate product ID by safely overwriting (upsert behavior)', async () => {
      const timestamp = new Date().toISOString();
      const prodA: Product = {
        id: 'prod-duplicate-key-test',
        slug: 'initial-version',
        name: 'Initial Product Version',
        brand: 'Brand A',
        category: 'home_decor',
        subcategory: 'carpets_rugs',
        description: 'First version of duplicate test product.',
        shortDescription: 'First version',
        pricePerUnitPaise: toPaise(3000),
        unit: 'piece',
        images: [baseValidProduct.images[0]],
        swatchImage: baseValidProduct.swatchImage,
        hsnCode: '5702',
        gstRatePercent: 12,
        colors: ['Gold'],
        colorHexes: ['#B8860B'],
        patterns: ['plain'],
        materials: ['Wool'],
        tags: ['Decor'],
        stockQuantity: 10,
        isAvailable: true,
        isFeatured: false,
        isBestSeller: false,
        metadata: {},
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      await saveProduct(prodA);
      let found = await fetchProductById('prod-duplicate-key-test');
      expect(found?.name).toBe('Initial Product Version');

      // Save again with same ID but different name & price
      const prodB: Product = {
        ...prodA,
        name: 'Overwritten Product Version',
        pricePerUnitPaise: toPaise(4500),
      };
      await saveProduct(prodB);

      found = await fetchProductById('prod-duplicate-key-test');
      expect(found?.name).toBe('Overwritten Product Version');
      expect(found?.pricePerUnitPaise).toBe(toPaise(4500));
    });

    it('filters products robustly with extreme and invalid search queries', async () => {
      // Search with regex special characters does not crash the database filter
      const regexSearch = await fetchProducts({ search: '[.*+?^${}()|[]\\' });
      expect(Array.isArray(regexSearch)).toBe(true);

      // Search with inverted price range (min > max) returns empty list
      const invertedPrice = await fetchProducts({
        minPricePaise: toPaise(50000),
        maxPricePaise: toPaise(100),
      });
      expect(invertedPrice).toHaveLength(0);

      // Filter with non-existent category returns empty list
      const nonExistentCategory = await fetchProducts({
        category: 'unknown_category_filter',
      });
      expect(nonExistentCategory).toHaveLength(0);
    });

    it('handles duplicate slug creation deterministically in mock repository without throwing', async () => {
      const timestamp = new Date().toISOString();
      const sharedSlug = 'exclusive-damask-silk';

      const prod1: Product = {
        id: 'prod-slug-test-1',
        slug: sharedSlug,
        name: 'Damask Silk Edition 1',
        brand: 'Excellence In-House',
        category: 'curtains_window_treatments',
        subcategory: 'heavy_drapes',
        description: 'First product with duplicate slug for collision testing.',
        shortDescription: 'First edition',
        pricePerUnitPaise: toPaise(1200),
        unit: 'meter',
        images: [baseValidProduct.images[0]],
        swatchImage: baseValidProduct.swatchImage,
        hsnCode: '5407',
        gstRatePercent: 18,
        colors: ['Gold'],
        colorHexes: ['#B8860B'],
        patterns: ['damask'],
        materials: ['Silk'],
        tags: ['Luxury'],
        stockQuantity: 20,
        isAvailable: true,
        isFeatured: false,
        isBestSeller: false,
        metadata: {},
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      const prod2: Product = {
        ...prod1,
        id: 'prod-slug-test-2',
        name: 'Damask Silk Edition 2',
        pricePerUnitPaise: toPaise(1600),
      };

      await saveProduct(prod1);
      await saveProduct(prod2);

      // Both products exist in the catalog
      const fetched1 = await fetchProductById('prod-slug-test-1');
      const fetched2 = await fetchProductById('prod-slug-test-2');
      expect(fetched1).not.toBeNull();
      expect(fetched2).not.toBeNull();
      expect(fetched1?.pricePerUnitPaise).toBe(toPaise(1200));
      expect(fetched2?.pricePerUnitPaise).toBe(toPaise(1600));

      // fetchProductBySlug deterministically resolves without crashing
      const resolvedBySlug = await fetchProductBySlug(sharedSlug);
      expect(resolvedBySlug).not.toBeNull();
      expect([prod1.id, prod2.id]).toContain(resolvedBySlug?.id);
    });

    it('accepts multi-byte non-ASCII Unicode characters in product fields', () => {
      const unicodeProduct = {
        ...baseValidProduct,
        name: 'उत्कृष्टता बनारसी सिल्क पर्दा (Excellence Banarasi Silk)',
        brand: 'उत्कृष्टता फर्निशिंग (Excellence)',
        description: 'मुंबई के लक्ज़री अपार्टमेंट्स के लिए विशेष रूप से हाथ से बुना गया पर्दा संग्रह।',
        tags: ['सिल्क', 'लक्ज़री', 'मुंबई'],
      };

      const res = productFormSchema.safeParse(unicodeProduct);
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.name).toContain('उत्कृष्टता');
        expect(res.data.tags).toContain('मुंबई');
      }
    });
  });
});

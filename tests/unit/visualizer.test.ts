import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/visualize/route';

describe('AI Fabric Visualizer API & Component Logic Tests', () => {
  it('rejects POST /api/visualize when required roomImage or swatchImage are missing with HTTP 400', async () => {
    // Missing both
    const req1 = new NextRequest('http://localhost:3000/api/visualize', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({}),
    });
    const res1 = await POST(req1);
    expect(res1.status).toBe(400);
    const body1 = await res1.json();
    expect(body1.success).toBe(false);
    expect(body1.error.code).toBe('VALIDATION_ERROR');

    // Missing swatch
    const req2 = new NextRequest('http://localhost:3000/api/visualize', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ roomImage: 'data:image/jpeg;base64,sample' }),
    });
    const res2 = await POST(req2);
    expect(res2.status).toBe(400);
  });

  it('returns a resilient fallback response (status 200, isDemoFallback: true) when Gemini API key is absent/offline', async () => {
    // Save current key if any
    const originalKey = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;

    const payload = {
      roomImage: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80',
      swatchImage: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=400&q=80',
      productType: 'curtain',
      productId: 'prod-001',
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
    expect(data.visualizationId).toBeDefined();
    expect(data.status).toBe('fallback_preview');
    expect(data.isDemoFallback).toBe(true);
    expect(data.resultImageUrl).toBeDefined();
    expect(data.resultImageUrl.startsWith('data:image/svg+xml')).toBe(true);
    expect(data.productType).toBe('curtain');
    expect(data.message).toContain('simulated drape generated');

    // Restore key
    if (originalKey) {
      process.env.GEMINI_API_KEY = originalKey;
    }
  });

  it('generates customized overlays for different product types: curtain, wallpaper, upholstery', async () => {
    for (const type of ['curtain', 'wallpaper', 'upholstery'] as const) {
      const payload = {
        roomImage: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80',
        swatchImage: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=400&q=80',
        productType: type,
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
      expect(data.productType).toBe(type);
      expect(data.resultImageUrl).toBeDefined();
    }
  });

  it('clamps comparison slider position accurately between 0% and 100%', () => {
    const clampSliderPosition = (x: number, width: number) => {
      return Math.max(0, Math.min(100, (x / width) * 100));
    };

    expect(clampSliderPosition(500, 1000)).toBe(50);
    expect(clampSliderPosition(0, 1000)).toBe(0);
    expect(clampSliderPosition(-50, 1000)).toBe(0);
    expect(clampSliderPosition(1000, 1000)).toBe(100);
    expect(clampSliderPosition(1200, 1000)).toBe(100);
    expect(clampSliderPosition(250, 1000)).toBe(25);
    expect(clampSliderPosition(750, 1000)).toBe(75);
  });
});

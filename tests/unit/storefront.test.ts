import { describe, it, expect, beforeEach } from 'vitest';
import { SITE_CONFIG, PRODUCT_CATEGORIES } from '@/config/site';
import { MAIN_NAV_ITEMS, CATEGORY_NAV_ITEMS } from '@/config/navigation';
import { useCartStore } from '@/store/cart-store';
import { formatINR, toPaise, toRupees } from '@/lib/utils';

describe('Storefront Configuration & Brand Identity Tests', () => {
  it('correctly declares business legacy and founding metadata from GEMINI.md', () => {
    expect(SITE_CONFIG.name).toBe('Excellence The Furnishing Gallery');
    expect(SITE_CONFIG.establishedYear).toBe(2003);
    expect(SITE_CONFIG.yearsOfLegacy).toBeGreaterThanOrEqual(23);
    expect(SITE_CONFIG.proprietor).toBe('Mr. Altaf Chauhan');
    expect(SITE_CONFIG.keyStaff).toContain('Mr. Altamash Chauhan');
    expect(SITE_CONFIG.keyStaff).toContain('Mr. Ahmed Chauhan');
    expect(SITE_CONFIG.keyStaff).toContain('Mr. Mohammed Chauhan');
  });

  it('declares the 4 active family contact mobile numbers', () => {
    const rawNumbers = SITE_CONFIG.contactNumbers.map((c) => c.raw);
    expect(rawNumbers).toContain('8097586466'); // Altamash
    expect(rawNumbers).toContain('8108423957'); // Ahmed
    expect(rawNumbers).toContain('8469649364'); // Mohammed
    expect(rawNumbers).toContain('9146655990'); // Altaf
  });

  it('contains the verified physical showroom address and landmark in Andheri West', () => {
    expect(SITE_CONFIG.address.shop).toContain('Shop No. 226, Sajid Tower');
    expect(SITE_CONFIG.address.street).toContain('S.V. Road');
    expect(SITE_CONFIG.address.area).toBe('Andheri West');
    expect(SITE_CONFIG.address.city).toBe('Mumbai');
    expect(SITE_CONFIG.address.pincode).toBe('400058');
    expect(SITE_CONFIG.address.landmark).toContain('Next to Cafe Arfa');
  });

  it('declares verified operating hours and Google rating', () => {
    expect(SITE_CONFIG.hours).toBe('Mon–Sun, 10:00 AM – 9:30 PM');
    expect(SITE_CONFIG.rating).toBe(4.3);
    expect(SITE_CONFIG.reviewsCount).toBe('113+');
    expect(SITE_CONFIG.social.instagram).toBe('@excellence_furnishinggallery');
  });

  it('contains all 6 required luxury soft furnishing categories', () => {
    const categoryIds = PRODUCT_CATEGORIES.map((c) => c.id);
    expect(categoryIds).toContain('curtains_window_treatments');
    expect(categoryIds).toContain('sofa_upholstery_fabrics');
    expect(categoryIds).toContain('wallpapers');
    expect(categoryIds).toContain('mattresses_sleep_solutions');
    expect(categoryIds).toContain('bedding_accessories');
    expect(categoryIds).toContain('home_decor');
    expect(PRODUCT_CATEGORIES.length).toBe(6);
  });

  it('provides valid navigation links for public storefront pages', () => {
    const navHrefs = MAIN_NAV_ITEMS.map((n) => n.href);
    expect(navHrefs).toContain('/');
    expect(navHrefs).toContain('/products');
    expect(navHrefs).toContain('/gallery');
    expect(navHrefs).toContain('/about');
    expect(navHrefs).toContain('/contact');
  });

  it('verifies category navigation items target valid catalog query parameters', () => {
    for (const item of CATEGORY_NAV_ITEMS) {
      expect(item.href).toMatch(/^\/products\?category=[a-z_]+$/);
    }
  });
});

describe('Storefront Cart & Inquiry State Management', () => {
  beforeEach(() => {
    useCartStore.getState().clearCart();
  });

  it('starts with an empty cart', () => {
    expect(useCartStore.getState().items).toEqual([]);
    expect(useCartStore.getState().getItemCount()).toBe(0);
  });

  it('adds an item to inquiry cart and updates total count', () => {
    useCartStore.getState().addItem({
      productId: 'curt-velvet-royal-gold',
      name: 'Royal Gold Heritage Velvet Drapery',
      pricePerUnitPaise: 220000,
      unit: 'meter',
      image: 'https://example.com/velvet.jpg',
      selectedColor: 'Gold',
      quantity: 2,
    });

    const items = useCartStore.getState().items;
    expect(items.length).toBe(1);
    expect(items[0].productId).toBe('curt-velvet-royal-gold');
    expect(items[0].quantity).toBe(2);
    expect(useCartStore.getState().getItemCount()).toBe(2);
  });

  it('increments quantity when adding the same item repeatedly', () => {
    const itemData = {
      productId: 'wall-nilaya-imperial-damask',
      name: 'Nilaya Imperial Damask Wallpaper',
      pricePerUnitPaise: 480000,
      unit: 'roll',
      image: 'https://example.com/wallpaper.jpg',
    };

    useCartStore.getState().addItem(itemData);
    useCartStore.getState().addItem(itemData);

    const items = useCartStore.getState().items;
    expect(items.length).toBe(1);
    expect(items[0].quantity).toBe(2);
    expect(useCartStore.getState().getItemCount()).toBe(2);
  });

  it('updates quantity and removes item when quantity reaches zero', () => {
    useCartStore.getState().addItem({
      productId: 'mat-refresh-latex-ortho',
      name: 'Refresh Orthopedic Mattress',
      pricePerUnitPaise: 2850000,
      unit: 'piece',
      image: 'https://example.com/mattress.jpg',
      quantity: 3,
    });

    useCartStore.getState().updateQuantity('mat-refresh-latex-ortho', 5);
    expect(useCartStore.getState().getItemCount()).toBe(5);

    useCartStore.getState().updateQuantity('mat-refresh-latex-ortho', 0);
    expect(useCartStore.getState().items.length).toBe(0);
    expect(useCartStore.getState().getItemCount()).toBe(0);
  });

  it('removes item directly via removeItem action', () => {
    useCartStore.getState().addItem({
      productId: 'item-1',
      name: 'Item 1',
      pricePerUnitPaise: 10000,
      unit: 'meter',
      image: 'https://example.com/1.jpg',
    });
    useCartStore.getState().addItem({
      productId: 'item-2',
      name: 'Item 2',
      pricePerUnitPaise: 20000,
      unit: 'roll',
      image: 'https://example.com/2.jpg',
    });

    expect(useCartStore.getState().items.length).toBe(2);
    useCartStore.getState().removeItem('item-1');
    expect(useCartStore.getState().items.length).toBe(1);
    expect(useCartStore.getState().items[0].productId).toBe('item-2');
  });
});

describe('Storefront Indian Currency Formatting', () => {
  it('formats Rupee values with Indian numbering system and ₹ symbol', () => {
    // 2,200 rupees = 220000 paise
    const formatted = formatINR(220000, true);
    expect(formatted).toContain('₹');
    expect(formatted).toMatch(/₹\s?2,200/);
  });

  it('formats large amounts in Lakhs properly', () => {
    // ₹1,25,000 = 12500000 paise
    const formatted = formatINR(12500000, true);
    expect(formatted).toContain('₹');
    expect(formatted).toMatch(/1,25,000/);
  });

  it('converts between rupees and paise deterministically', () => {
    expect(toPaise(2200)).toBe(220000);
    expect(toRupees(220000)).toBe(2200);
  });
});

import { describe, it, expect, beforeEach } from 'vitest';
import { fetchOrders, fetchOrderById, fetchUserProfile, modifyUserProfile } from '@/lib/firebase/firestore';
import { mockDb } from '@/lib/firebase/mock-db';
import { getMilestoneStep, MILESTONE_STAGES } from '@/components/dashboard/OrderStepper';
import { OrderStatus } from '@/types/order';
import { toRupees, formatINR } from '@/lib/utils';
import { useAuthStore } from '@/store/auth-store';

describe('Customer User Portal (R5) Unit Tests', () => {
  beforeEach(() => {
    mockDb.reset();
  });

  describe('Order Milestone Progression Stepper Logic', () => {
    it('defines exactly 5 progressive bespoke tailoring milestone stages', () => {
      expect(MILESTONE_STAGES.length).toBe(5);
      expect(MILESTONE_STAGES[0].label).toBe('Order Confirmed');
      expect(MILESTONE_STAGES[1].label).toBe('Fabric Procured');
      expect(MILESTONE_STAGES[2].label).toBe('Custom Stitching');
      expect(MILESTONE_STAGES[3].label).toBe('Out for Delivery');
      expect(MILESTONE_STAGES[4].label).toBe('Delivered & Installed');
    });

    it('maps order statuses to appropriate milestone progression steps', () => {
      expect(getMilestoneStep('confirmed')).toBe(1);
      expect(getMilestoneStep('in_production')).toBe(3); // Active custom tailoring & pleating
      expect(getMilestoneStep('ready')).toBe(4); // Dispatched / Out for delivery
      expect(getMilestoneStep('delivered')).toBe(5); // Installation finished
      expect(getMilestoneStep('draft')).toBe(0);
      expect(getMilestoneStep('cancelled')).toBe(0);
    });
  });

  describe('Customer Order Inquiries & Calculations', () => {
    it('retrieves seeded orders for customer-priya', async () => {
      const orders = await fetchOrders({ userId: 'customer-priya' });
      expect(orders.length).toBeGreaterThanOrEqual(1);

      for (const order of orders) {
        expect(order.userId).toBe('customer-priya');
        expect(order.orderNumber).toMatch(/^EF-ORD-/);
      }
    });

    it('validates financial consistency for seeded orders (Subtotal + GST = Grand Total)', async () => {
      const orders = await fetchOrders({ userId: 'customer-priya' });

      for (const order of orders) {
        // Line total summation
        const calculatedSubtotal = order.items.reduce(
          (sum, item) => sum + item.lineTotalPaise,
          0
        );
        expect(order.subtotalPaise).toBe(calculatedSubtotal);

        // GST calculation consistency
        const expectedTax =
          order.gstBreakdown.cgstPaise +
          order.gstBreakdown.sgstPaise +
          order.gstBreakdown.igstPaise;
        expect(order.gstBreakdown.totalTaxPaise).toBe(expectedTax);

        // Grand total consistency
        const expectedGrandTotal =
          order.subtotalPaise - order.discountPaise + order.gstBreakdown.totalTaxPaise;
        expect(order.grandTotalPaise).toBe(expectedGrandTotal);

        // Payment balance consistency
        expect(order.grandTotalPaise - order.paidAmountPaise).toBe(order.balanceAmountPaise);
      }
    });

    it('fetches single order by ID with itemized specs', async () => {
      const order = await fetchOrderById('order-priya-001');
      expect(order).not.toBeNull();
      expect(order?.clientName).toBe('Priya Sharma');
      expect(order?.status).toBe('in_production');
      expect(order?.items.length).toBe(2);

      const velvetItem = order?.items.find((i) => i.productId === 'curt-velvet-royal-gold');
      expect(velvetItem).toBeDefined();
      expect(velvetItem?.quantity).toBe(14);
      expect(velvetItem?.unitPricePaise).toBe(220000); // ₹2,200/meter
      expect(velvetItem?.lineTotalPaise).toBe(3080000); // 14 * ₹2,200 = ₹30,800
    });

    it('formats Indian Rupee display properly for order items and totals', async () => {
      const order = await fetchOrderById('order-priya-001');
      expect(order).not.toBeNull();

      const formattedTotal = formatINR(order!.grandTotalPaise, true);
      // Expect ₹ currency symbol and correct value representation
      expect(formattedTotal).toContain('47,082');
    });
  });

  describe('Customer Profile Updates', () => {
    it('retrieves seeded profile for customer-priya', async () => {
      const profile = await fetchUserProfile('customer-priya');
      expect(profile).not.toBeNull();
      expect(profile?.displayName).toBe('Priya Sharma');
      expect(profile?.role).toBe('user');
      expect(profile?.address?.city).toBe('Mumbai');
    });

    it('persists modifications to customer name, phone, and delivery address', async () => {
      const updated = await modifyUserProfile('customer-priya', {
        displayName: 'Priya Sharma-Mehta',
        phoneNumber: '+91 98201 99999',
        address: {
          street: 'Penthouse 2201, Imperial Heights, Lokhandwala',
          landmark: 'Opposite Celebration Club',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400053',
          country: 'India',
        },
      });

      expect(updated).not.toBeNull();
      expect(updated?.displayName).toBe('Priya Sharma-Mehta');
      expect(updated?.phoneNumber).toBe('+91 98201 99999');
      expect(updated?.address?.street).toBe('Penthouse 2201, Imperial Heights, Lokhandwala');
      expect(updated?.address?.landmark).toBe('Opposite Celebration Club');

      // Re-fetch to ensure genuine persistence in mock store
      const reFetched = await fetchUserProfile('customer-priya');
      expect(reFetched?.displayName).toBe('Priya Sharma-Mehta');
      expect(reFetched?.phoneNumber).toBe('+91 98201 99999');
    });

    it('updates auth store profile state via updateProfileData', async () => {
      const store = useAuthStore.getState();
      await store.login('customer@excellencefurnishing.com', 'Customer@123');

      expect(useAuthStore.getState().user?.displayName).toBe('Priya Sharma');

      await store.updateProfileData({
        displayName: 'Dr. Priya Sharma',
      });

      expect(useAuthStore.getState().user?.displayName).toBe('Dr. Priya Sharma');
      expect(useAuthStore.getState().profile?.displayName).toBe('Dr. Priya Sharma');
    });
  });
});

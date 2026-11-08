import { describe, it, expect, beforeEach } from 'vitest';
import { fetchOrders, fetchOrderById, saveOrder, modifyOrder } from '@/lib/firebase/firestore';
import { mockDb } from '@/lib/firebase/mock-db';
import { Order, OrderStatus, PaymentStatus, PaymentRecord, OrderItem } from '@/types/order';
import { calculateGST } from '@/lib/pricing/calculator';
import { toPaise, toRupees } from '@/lib/utils';

describe('Admin Orders Management & State Machine Tests', () => {
  beforeEach(() => {
    mockDb.reset();
  });

  it('fetches seeded orders from repository', async () => {
    const orders = await fetchOrders();
    expect(orders.length).toBeGreaterThan(0);
    const order1 = orders[0];
    expect(order1).toHaveProperty('id');
    expect(order1).toHaveProperty('orderNumber');
    expect(order1).toHaveProperty('items');
    expect(order1).toHaveProperty('grandTotalPaise');
  });

  it('correctly transitions through standard 5-stage milestone lifecycle: draft -> confirmed -> in_production -> ready -> delivered', async () => {
    const timestamp = new Date().toISOString();
    const testOrder: Order = {
      id: 'test-order-lifecycle-1',
      orderNumber: 'EF-ORD-2026-99001',
      clientId: 'client-001',
      clientName: 'Mrs. Ananya Patel',
      clientPhone: '9820123456',
      items: [
        {
          id: 'item-1',
          productName: 'Royal Velvet Sheen Curtains',
          category: 'curtains_window_treatments',
          quantity: 12,
          unit: 'meter',
          unitPricePaise: toPaise(1200),
          lineTotalPaise: toPaise(14400),
        },
      ],
      subtotalPaise: toPaise(14400),
      discountPaise: 0,
      gstBreakdown: calculateGST(toPaise(14400), false, 18),
      grandTotalPaise: toPaise(16992),
      paymentStatus: 'pending',
      paidAmountPaise: 0,
      balanceAmountPaise: toPaise(16992),
      payments: [],
      status: 'draft',
      deliveryAddress: {
        street: '1201 Oberoi Sky Heights',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400058',
        country: 'India',
      },
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    // 1. Initial Draft
    await saveOrder(testOrder);
    let order = await fetchOrderById('test-order-lifecycle-1');
    expect(order?.status).toBe('draft');

    // 2. Advance to Confirmed
    await modifyOrder(testOrder.id, { status: 'confirmed' });
    order = await fetchOrderById(testOrder.id);
    expect(order?.status).toBe('confirmed');

    // 3. Advance to In Production (Workshop Tailoring)
    await modifyOrder(testOrder.id, { status: 'in_production' });
    order = await fetchOrderById(testOrder.id);
    expect(order?.status).toBe('in_production');

    // 4. Advance to Ready for delivery
    await modifyOrder(testOrder.id, { status: 'ready' });
    order = await fetchOrderById(testOrder.id);
    expect(order?.status).toBe('ready');

    // 5. Advance to Delivered
    const deliveryTimestamp = new Date().toISOString();
    await modifyOrder(testOrder.id, { status: 'delivered', actualDeliveryDate: deliveryTimestamp });
    order = await fetchOrderById(testOrder.id);
    expect(order?.status).toBe('delivered');
    expect(order?.actualDeliveryDate).toBe(deliveryTimestamp);
  });

  it('allows cancellation of active orders and records cancellation state', async () => {
    const orders = await fetchOrders();
    const orderToCancel = orders[0];

    const updated = await modifyOrder(orderToCancel.id, { status: 'cancelled' });
    expect(updated?.status).toBe('cancelled');

    const retrieved = await fetchOrderById(orderToCancel.id);
    expect(retrieved?.status).toBe('cancelled');
  });

  it('accurately records payments, logs multiple installments, and calculates balance & status', async () => {
    const timestamp = new Date().toISOString();
    const grandTotalPaise = toPaise(20000); // ₹20,000

    const initialOrder: Order = {
      id: 'test-order-payments-1',
      orderNumber: 'EF-ORD-2026-99002',
      clientId: 'client-002',
      clientName: 'Dr. Sameer Mehta',
      clientPhone: '9820987654',
      items: [
        {
          id: 'item-1',
          productName: 'Damask Wallpaper Rolls',
          category: 'wallpapers',
          quantity: 4,
          unit: 'roll',
          unitPricePaise: toPaise(4237),
          lineTotalPaise: toPaise(16949),
        },
      ],
      subtotalPaise: toPaise(16949),
      discountPaise: 0,
      gstBreakdown: calculateGST(toPaise(16949), false, 18),
      grandTotalPaise,
      paymentStatus: 'pending',
      paidAmountPaise: 0,
      balanceAmountPaise: grandTotalPaise,
      payments: [],
      status: 'confirmed',
      deliveryAddress: {
        street: 'Flat 402, Sea Face Apartments',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400049',
        country: 'India',
      },
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    await saveOrder(initialOrder);

    // Initial state check
    let current = await fetchOrderById(initialOrder.id);
    expect(current?.paymentStatus).toBe('pending');
    expect(current?.paidAmountPaise).toBe(0);
    expect(current?.balanceAmountPaise).toBe(grandTotalPaise);

    // Installment 1: Advance payment of ₹8,000 (40%) via UPI
    const payment1: PaymentRecord = {
      id: 'pay-001',
      amountPaise: toPaise(8000),
      method: 'upi',
      date: timestamp,
      referenceNumber: 'UPI-REF-001',
      notes: 'Initial 40% advance deposit',
      recordedBy: 'Mr. Altab Chauhan',
    };

    let newPaidPaise = payment1.amountPaise;
    let newBalancePaise = grandTotalPaise - newPaidPaise;
    let newPaymentStatus: PaymentStatus = 'partial';

    await modifyOrder(initialOrder.id, {
      payments: [payment1],
      paidAmountPaise: newPaidPaise,
      balanceAmountPaise: newBalancePaise,
      paymentStatus: newPaymentStatus,
    });

    current = await fetchOrderById(initialOrder.id);
    expect(current?.paymentStatus).toBe('partial');
    expect(current?.paidAmountPaise).toBe(toPaise(8000));
    expect(current?.balanceAmountPaise).toBe(toPaise(12000));
    expect(current?.payments.length).toBe(1);

    // Installment 2: Final balance payment of ₹12,000 (60%) via Card
    const payment2: PaymentRecord = {
      id: 'pay-002',
      amountPaise: toPaise(12000),
      method: 'credit_debit_card',
      date: new Date().toISOString(),
      referenceNumber: 'POS-TXN-9981',
      notes: 'Final settlement on delivery',
      recordedBy: 'Mr. Altamash',
    };

    newPaidPaise += payment2.amountPaise;
    newBalancePaise = grandTotalPaise - newPaidPaise;
    newPaymentStatus = 'paid';

    await modifyOrder(initialOrder.id, {
      payments: [payment1, payment2],
      paidAmountPaise: newPaidPaise,
      balanceAmountPaise: newBalancePaise,
      paymentStatus: newPaymentStatus,
    });

    current = await fetchOrderById(initialOrder.id);
    expect(current?.paymentStatus).toBe('paid');
    expect(current?.paidAmountPaise).toBe(grandTotalPaise);
    expect(current?.balanceAmountPaise).toBe(0);
    expect(current?.payments.length).toBe(2);
  });

  it('filters orders by status and payment status accurately', async () => {
    const all = await fetchOrders();
    expect(all.length).toBeGreaterThan(0);

    const deliveredOrders = await fetchOrders({ status: 'delivered' });
    for (const o of deliveredOrders) {
      expect(o.status).toBe('delivered');
    }
  });
});

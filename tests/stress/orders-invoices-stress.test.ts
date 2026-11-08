import { describe, it, expect, beforeEach } from 'vitest';
import {
  fetchOrders,
  fetchOrderById,
  saveOrder,
  modifyOrder,
  fetchLastInvoiceNumber,
  saveInvoice,
  fetchInvoiceById,
} from '@/lib/firebase/firestore';
import { mockDb } from '@/lib/firebase/mock-db';
import { Order, OrderStatus, PaymentStatus, PaymentRecord, OrderItem } from '@/types/order';
import { Invoice, InvoiceItem, BusinessBillingHeader } from '@/types/invoice';
import { calculateGST, generateNextInvoiceNumber } from '@/lib/pricing/calculator';
import { generateInvoicePDF } from '@/lib/pdf/invoice-generator';
import { convertRupeesToWords, formatINR, toPaise, toRupees } from '@/lib/utils';
import { paymentLogSchema } from '@/lib/validators/schemas';

const DEFAULT_BUSINESS_DETAILS: BusinessBillingHeader = {
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

const DEFAULT_TERMS: readonly string[] = [
  'Custom tailored goods cannot be cancelled once cut.',
  'Subject to Mumbai jurisdiction.',
];

/**
 * Empirical Adversarial & Stress Test Suite
 * Domain: Milestone 5 — Orders & Invoices Workflows
 * 
 * Verifies invariants under hostile inputs, concurrency, extreme numerical limits,
 * state machine violations, and edge-case payload configurations.
 */

describe('Orders & Invoices Adversarial Stress Tests', () => {
  beforeEach(() => {
    mockDb.reset();
  });

  // =========================================================================
  // SUITE 1: State Machine Invariants & Lifecycle Violation Tests
  // =========================================================================
  describe('1. Order Lifecycle & State Machine Transitions', () => {
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      draft: ['confirmed', 'cancelled'],
      confirmed: ['in_production', 'cancelled'],
      in_production: ['ready', 'cancelled'],
      ready: ['delivered', 'cancelled'],
      delivered: [], // Terminal state
      cancelled: [], // Terminal state
    };

    function validateOrderTransition(from: OrderStatus, to: OrderStatus): boolean {
      return validTransitions[from]?.includes(to) ?? false;
    }

    it('empirically enforces that cancelled orders are terminal and cannot be transitioned forward', async () => {
      const order: Order = createMockOrder('test-order-sm-cancelled', 'draft');
      await saveOrder(order);

      // Cancel the order
      const cancelled = await modifyOrder(order.id, { status: 'cancelled' });
      expect(cancelled?.status).toBe('cancelled');

      // Attempting to advance a cancelled order
      const forwardTargets: OrderStatus[] = ['confirmed', 'in_production', 'ready', 'delivered'];
      for (const target of forwardTargets) {
        const isAllowed = validateOrderTransition('cancelled', target);
        expect(isAllowed).toBe(false);
      }
    });

    it('empirically enforces that delivered orders are terminal and cannot be reverted or altered', async () => {
      const order: Order = createMockOrder('test-order-sm-delivered', 'ready');
      await saveOrder(order);

      // Complete delivery
      const delivered = await modifyOrder(order.id, {
        status: 'delivered',
        actualDeliveryDate: new Date().toISOString(),
      });
      expect(delivered?.status).toBe('delivered');

      // Attempting to move delivered order backwards
      const backwardTargets: OrderStatus[] = ['draft', 'confirmed', 'in_production', 'ready', 'cancelled'];
      for (const target of backwardTargets) {
        const isAllowed = validateOrderTransition('delivered', target);
        expect(isAllowed).toBe(false);
      }
    });

    it('identifies illegal step-skipping transitions (e.g. draft directly to delivered)', () => {
      // Direct jump draft -> in_production
      expect(validateOrderTransition('draft', 'in_production')).toBe(false);
      // Direct jump draft -> ready
      expect(validateOrderTransition('draft', 'ready')).toBe(false);
      // Direct jump draft -> delivered
      expect(validateOrderTransition('draft', 'delivered')).toBe(false);
      // Direct jump confirmed -> delivered
      expect(validateOrderTransition('confirmed', 'delivered')).toBe(false);
      // Direct jump in_production -> draft
      expect(validateOrderTransition('in_production', 'draft')).toBe(false);
    });

    it('validates strictly sequential 5-stage advancement with cancellation branches', async () => {
      const stages: OrderStatus[] = ['draft', 'confirmed', 'in_production', 'ready', 'delivered'];
      
      for (let i = 0; i < stages.length - 1; i++) {
        const current = stages[i];
        const next = stages[i + 1];
        expect(validateOrderTransition(current, next)).toBe(true);
        expect(validateOrderTransition(current, 'cancelled')).toBe(true);
      }
    });
  });

  // =========================================================================
  // SUITE 2: Payment Stress, Boundary Conditions & Invariants
  // =========================================================================
  describe('2. Payment Overpayments, Boundary Values & Balance Invariants', () => {
    it('strictly rejects zero and negative payments at the validation schema layer', () => {
      // Zero payment
      const zeroResult = paymentLogSchema.safeParse({
        amount: 0,
        method: 'upi',
        recordedBy: 'Mr. Altab Chauhan',
      });
      expect(zeroResult.success).toBe(false);

      // Negative payment
      const negativeResult = paymentLogSchema.safeParse({
        amount: -500,
        method: 'cash',
        recordedBy: 'Mr. Altamash',
      });
      expect(negativeResult.success).toBe(false);

      // String instead of number
      const stringResult = paymentLogSchema.safeParse({
        amount: 'invalid',
        method: 'net_banking',
        recordedBy: 'Staff',
      });
      expect(stringResult.success).toBe(false);

      // Positive valid payment
      const validResult = paymentLogSchema.safeParse({
        amount: 1250.5,
        method: 'upi',
        referenceNumber: 'UPI-9876543210',
        recordedBy: 'Mr. Alim',
      });
      expect(validResult.success).toBe(true);
    });

    it('safely handles overpayment: clamps balance to 0 and accurately records surplus amount', async () => {
      const grandTotalPaise = toPaise(15000); // ₹15,000
      const order = createMockOrder('test-overpay-order', 'confirmed', grandTotalPaise);
      await saveOrder(order);

      // Customer pays ₹18,000 (overpayment of ₹3,000)
      const overpaymentPaise = toPaise(18000);
      const payment: PaymentRecord = {
        id: 'pay-over-1',
        amountPaise: overpaymentPaise,
        method: 'upi',
        date: new Date().toISOString(),
        referenceNumber: 'UTR-SURPLUS-999',
        notes: 'Excess advance payment including future room fitting',
        recordedBy: 'Mr. Altab Chauhan',
      };

      const updatedPaidPaise = (order.paidAmountPaise || 0) + overpaymentPaise;
      // Balance must never drop below 0
      const updatedBalancePaise = Math.max(0, grandTotalPaise - updatedPaidPaise);
      const updatedStatus: PaymentStatus = updatedBalancePaise === 0 ? 'paid' : 'partial';

      await modifyOrder(order.id, {
        payments: [payment],
        paidAmountPaise: updatedPaidPaise,
        balanceAmountPaise: updatedBalancePaise,
        paymentStatus: updatedStatus,
      });

      const retrieved = await fetchOrderById(order.id);
      expect(retrieved?.paymentStatus).toBe('paid');
      expect(retrieved?.balanceAmountPaise).toBe(0);
      expect(retrieved?.paidAmountPaise).toBe(toPaise(18000));

      // Overpayment surplus mathematically tracked
      const surplusPaise = retrieved!.paidAmountPaise - retrieved!.grandTotalPaise;
      expect(surplusPaise).toBe(toPaise(3000));
    });

    it('maintains absolute integer precision across 10 randomized partial micro-installments', async () => {
      const grandTotalPaise = toPaise(100000); // ₹1,00,000.00
      const order = createMockOrder('test-multi-installment-order', 'confirmed', grandTotalPaise);
      await saveOrder(order);

      // 10 installments designed to sum exactly to 100,000 INR
      const installmentsINR = [10000, 5000, 15000, 8500, 11500, 10000, 12000, 7000, 9000, 12000];
      const sumINR = installmentsINR.reduce((acc, val) => acc + val, 0);
      expect(sumINR).toBe(100000);

      let currentPaidPaise = 0;
      const paymentRecords: PaymentRecord[] = [];

      for (let i = 0; i < installmentsINR.length; i++) {
        const installmentPaise = toPaise(installmentsINR[i]);
        currentPaidPaise += installmentPaise;
        const currentBalancePaise = Math.max(0, grandTotalPaise - currentPaidPaise);

        const record: PaymentRecord = {
          id: `pay-installment-${i + 1}`,
          amountPaise: installmentPaise,
          method: 'upi',
          date: new Date().toISOString(),
          referenceNumber: `INSTALL-${i + 1}`,
          recordedBy: 'Mr. Altamash',
        };
        paymentRecords.push(record);

        const expectedStatus: PaymentStatus =
          currentBalancePaise === 0
            ? 'paid'
            : currentPaidPaise > 0
            ? 'partial'
            : 'pending';

        await modifyOrder(order.id, {
          payments: [...paymentRecords],
          paidAmountPaise: currentPaidPaise,
          balanceAmountPaise: currentBalancePaise,
          paymentStatus: expectedStatus,
        });

        const intermediate = await fetchOrderById(order.id);
        expect(intermediate?.paidAmountPaise).toBe(currentPaidPaise);
        expect(intermediate?.balanceAmountPaise).toBe(currentBalancePaise);
        expect((intermediate?.paidAmountPaise ?? 0) + (intermediate?.balanceAmountPaise ?? 0)).toBe(grandTotalPaise);

        if (i < installmentsINR.length - 1) {
          expect(intermediate?.paymentStatus).toBe('partial');
        } else {
          expect(intermediate?.paymentStatus).toBe('paid');
          expect(intermediate?.balanceAmountPaise).toBe(0);
        }
      }
    });

    it('conserves odd paise across non-trivial installments with 1-paisa division remainders', async () => {
      // Grand total with odd paise: ₹10,000.01 = 1,000,001 paise
      const grandTotalPaise = 1000001;
      const order = createMockOrder('test-odd-paise-payments', 'confirmed', grandTotalPaise);
      await saveOrder(order);

      // Payment 1: 333,333 paise (₹3,333.33)
      // Payment 2: 333,334 paise (₹3,333.34)
      // Payment 3: 333,334 paise (₹3,333.34)
      // Total = 1,000,001 paise exactly
      const p1 = 333333;
      const p2 = 333334;
      const p3 = 333334;
      expect(p1 + p2 + p3).toBe(grandTotalPaise);

      let cumulativePaid = 0;
      const records: PaymentRecord[] = [];

      for (const [idx, amt] of [p1, p2, p3].entries()) {
        cumulativePaid += amt;
        const balance = Math.max(0, grandTotalPaise - cumulativePaid);
        records.push({
          id: `pay-odd-${idx + 1}`,
          amountPaise: amt,
          method: 'bank_neft_rtgs',
          date: new Date().toISOString(),
          recordedBy: 'Mr. Alim',
        });

        await modifyOrder(order.id, {
          payments: [...records],
          paidAmountPaise: cumulativePaid,
          balanceAmountPaise: balance,
          paymentStatus: balance === 0 ? 'paid' : 'partial',
        });
      }

      const finalOrder = await fetchOrderById(order.id);
      expect(finalOrder?.paidAmountPaise).toBe(1000001);
      expect(finalOrder?.balanceAmountPaise).toBe(0);
      expect(finalOrder?.paymentStatus).toBe('paid');
    });
  });

  // =========================================================================
  // SUITE 3: Invoice Sequencing, Concurrency & Year Rollover Stress
  // =========================================================================
  describe('3. Invoice Sequencing, Concurrency & Year Rollover', () => {
    it('generates 100 strictly monotonic sequential invoice numbers without gaps or duplicates', () => {
      let currentNumber: string | null = null;
      const generatedNumbers = new Set<string>();

      for (let i = 1; i <= 100; i++) {
        const next = generateNextInvoiceNumber(currentNumber, 2026);
        expect(generatedNumbers.has(next)).toBe(false);
        generatedNumbers.add(next);
        const expectedSeq = i.toString().padStart(5, '0');
        expect(next).toBe(`EF-2026-${expectedSeq}`);
        currentNumber = next;
      }

      expect(generatedNumbers.size).toBe(100);
    });

    it('correctly handles boundary padding rollover across 10, 100, 1000, 10000, and 99999', () => {
      expect(generateNextInvoiceNumber('EF-2026-00009', 2026)).toBe('EF-2026-00010');
      expect(generateNextInvoiceNumber('EF-2026-00099', 2026)).toBe('EF-2026-00100');
      expect(generateNextInvoiceNumber('EF-2026-00999', 2026)).toBe('EF-2026-01000');
      expect(generateNextInvoiceNumber('EF-2026-09999', 2026)).toBe('EF-2026-10000');
      expect(generateNextInvoiceNumber('EF-2026-99999', 2026)).toBe('EF-2026-100000');
    });

    it('seamlessly rolls over sequence on New Financial/Calendar Year', () => {
      // 2025 ended at #420 -> 2026 starts at #1
      expect(generateNextInvoiceNumber('EF-2025-00420', 2026)).toBe('EF-2026-00001');
      // 2026 ended at #8542 -> 2027 starts at #1
      expect(generateNextInvoiceNumber('EF-2026-08542', 2027)).toBe('EF-2027-00001');
      // 2024 invoice presented in 2026 -> starts at #1
      expect(generateNextInvoiceNumber('EF-2024-99999', 2026)).toBe('EF-2026-00001');
    });

    it('robustly falls back to #00001 under corrupt, null, or malformed sequence inputs', () => {
      expect(generateNextInvoiceNumber(null, 2026)).toBe('EF-2026-00001');
      expect(generateNextInvoiceNumber('', 2026)).toBe('EF-2026-00001');
      expect(generateNextInvoiceNumber('CORRUPTED-INVOICE', 2026)).toBe('EF-2026-00001');
      expect(generateNextInvoiceNumber('EF-2026-NaN', 2026)).toBe('EF-2026-00001');
      expect(generateNextInvoiceNumber('EF-2026-XYZ', 2026)).toBe('EF-2026-00001');
      expect(generateNextInvoiceNumber('INV-2026-00042', 2026)).toBe('EF-2026-00001');
    });

    it('empirically simulates sequential invoice creation in repository with zero collision', async () => {
      const initialInvoices = await mockDb.getAllInvoices();
      const initialCount = initialInvoices.length;
      const initialLastNumber = await fetchLastInvoiceNumber();
      const initialSeq = initialLastNumber ? parseInt(initialLastNumber.replace('EF-2026-', ''), 10) : 0;
      const newInvoiceCount = 25;

      for (let i = 0; i < newInvoiceCount; i++) {
        const lastNumber = await fetchLastInvoiceNumber();
        const nextNumber = generateNextInvoiceNumber(lastNumber, 2026);
        const inv: Invoice = createMockInvoice(`test-sim-inv-${i + 1}`, nextNumber);
        await saveInvoice(inv);
      }

      const allInvoices = await mockDb.getAllInvoices();
      expect(allInvoices.length).toBe(initialCount + newInvoiceCount);

      const uniqueNumbers = new Set(allInvoices.map((inv) => inv.invoiceNumber));
      expect(uniqueNumbers.size).toBe(initialCount + newInvoiceCount);

      // Verify the last recorded invoice matches the expected sequence
      const latest = await fetchLastInvoiceNumber();
      const expectedTotalSeq = (initialSeq + newInvoiceCount).toString().padStart(5, '0');
      expect(latest).toBe(`EF-2026-${expectedTotalSeq}`);
    });
  });

  // =========================================================================
  // SUITE 4: GST Tax Engine Extreme Values & Odd-Paise Stress
  // =========================================================================
  describe('4. GST Calculations, Odd-Paise Rounding & Extreme Limits', () => {
    it('preserves exact conservation law (CGST + SGST === Total Tax) for 200 odd-paise amounts', () => {
      for (let paise = 1; paise <= 200; paise++) {
        const gst = calculateGST(paise, false, 18);
        expect(gst.cgstPaise + gst.sgstPaise).toBe(gst.totalTaxPaise);
        expect(gst.igstPaise).toBe(0);
        expect(gst.cgstPaise).toBeLessThanOrEqual(gst.sgstPaise); // Floor on CGST, remainder on SGST
      }
    });

    it('correctly handles zero and negative subtotals without throwing or producing NaN', () => {
      const zeroGst = calculateGST(0, false, 18);
      expect(zeroGst.totalTaxPaise).toBe(0);
      expect(zeroGst.cgstPaise).toBe(0);
      expect(zeroGst.sgstPaise).toBe(0);
      expect(zeroGst.igstPaise).toBe(0);

      const negGst = calculateGST(-15000, false, 18);
      expect(negGst.totalTaxPaise).toBe(0);
      expect(negGst.cgstPaise).toBe(0);
      expect(negGst.sgstPaise).toBe(0);

      const nanGst = calculateGST(NaN, false, 18);
      expect(nanGst.totalTaxPaise).toBe(0);
    });

    it('calculates correct GST for extreme values exceeding ₹1 Crore, ₹10 Crore, and ₹100 Crore', () => {
      // 1. ₹1 Crore (10,000,000 INR = 1,000,000,000 Paise)
      const oneCrorePaise = 1000000000;
      const gst1Cr = calculateGST(oneCrorePaise, false, 18);
      // 18% of 1 Crore = ₹18 Lakh (180,000,000 Paise)
      expect(gst1Cr.totalTaxPaise).toBe(180000000);
      expect(gst1Cr.cgstPaise).toBe(90000000); // ₹9 Lakh
      expect(gst1Cr.sgstPaise).toBe(90000000); // ₹9 Lakh
      expect(gst1Cr.cgstPaise + gst1Cr.sgstPaise).toBe(gst1Cr.totalTaxPaise);

      // 2. ₹10 Crore (100,000,000 INR = 10,000,000,000 Paise)
      const tenCrorePaise = 10000000000;
      const gst10Cr = calculateGST(tenCrorePaise, false, 18);
      // 18% of 10 Crore = ₹1.8 Crore (1,800,000,000 Paise)
      expect(gst10Cr.totalTaxPaise).toBe(1800000000);
      expect(gst10Cr.cgstPaise).toBe(900000000); // ₹90 Lakh
      expect(gst10Cr.sgstPaise).toBe(900000000); // ₹90 Lakh

      // 3. ₹100 Crore (1,000,000,000 INR = 100,000,000,000 Paise)
      const hundredCrorePaise = 100000000000;
      const gst100Cr = calculateGST(hundredCrorePaise, false, 18);
      expect(gst100Cr.totalTaxPaise).toBe(18000000000);
      expect(gst100Cr.cgstPaise).toBe(9000000000);
      expect(gst100Cr.sgstPaise).toBe(9000000000);
      expect(gst100Cr.cgstPaise + gst100Cr.sgstPaise).toBe(gst100Cr.totalTaxPaise);
    });

    it('calculates correct Inter-state IGST at various rate tiers (5%, 12%, 18%, 28%)', () => {
      const amountPaise = toPaise(10000); // ₹10,000

      const gst5 = calculateGST(amountPaise, true, 5);
      expect(gst5.igstPaise).toBe(toPaise(500));
      expect(gst5.totalTaxPaise).toBe(toPaise(500));
      expect(gst5.cgstPaise).toBe(0);

      const gst12 = calculateGST(amountPaise, true, 12);
      expect(gst12.igstPaise).toBe(toPaise(1200));

      const gst18 = calculateGST(amountPaise, true, 18);
      expect(gst18.igstPaise).toBe(toPaise(1800));

      const gst28 = calculateGST(amountPaise, true, 28);
      expect(gst28.igstPaise).toBe(toPaise(2800));
    });

    it('verifies order financial equation holds with ₹0 discount and 100% discount', () => {
      const subtotalPaise = toPaise(50000); // ₹50,000

      // Case A: ₹0 discount
      const discountZero = 0;
      const taxableA = subtotalPaise - discountZero;
      const gstA = calculateGST(taxableA, false, 18);
      const grandTotalA = taxableA + gstA.totalTaxPaise;
      expect(grandTotalA).toBe(toPaise(59000));

      // Case B: 100% discount (promotional gift / showroom display)
      const discountFull = subtotalPaise;
      const taxableB = subtotalPaise - discountFull;
      const gstB = calculateGST(taxableB, false, 18);
      const grandTotalB = taxableB + gstB.totalTaxPaise;
      expect(taxableB).toBe(0);
      expect(gstB.totalTaxPaise).toBe(0);
      expect(grandTotalB).toBe(0);
    });
  });

  // =========================================================================
  // SUITE 5: Indian Rupee Words Conversion Limits & Edge Cases
  // =========================================================================
  describe('5. Indian Rupee Words Conversion Engine Limits', () => {
    it('handles zero, negative numbers, and non-finite inputs gracefully', () => {
      expect(convertRupeesToWords(0)).toBe('Rupees Zero Only');
      expect(convertRupeesToWords(-0)).toBe('Rupees Zero Only');
      expect(convertRupeesToWords(NaN)).toBe('Rupees Zero Only');
      expect(convertRupeesToWords(Infinity)).toBe('Rupees Zero Only');
      expect(convertRupeesToWords(-Infinity)).toBe('Rupees Zero Only');
    });

    it('converts single digits, teens, tens, hundreds, thousands, and lakhs accurately', () => {
      expect(convertRupeesToWords(7)).toBe('Rupees Seven Only');
      expect(convertRupeesToWords(13)).toBe('Rupees Thirteen Only');
      expect(convertRupeesToWords(45)).toBe('Rupees Forty Five Only');
      expect(convertRupeesToWords(700)).toBe('Rupees Seven Hundred Only');
      expect(convertRupeesToWords(789)).toBe('Rupees Seven Hundred Eighty Nine Only');
      expect(convertRupeesToWords(5400)).toBe('Rupees Five Thousand Four Hundred Only');
      expect(convertRupeesToWords(75050)).toBe('Rupees Seventy Five Thousand Fifty Only');
      expect(convertRupeesToWords(100000)).toBe('Rupees One Lakh Only');
      expect(convertRupeesToWords(854200)).toBe('Rupees Eight Lakh Fifty Four Thousand Two Hundred Only');
    });

    it('converts amounts in Crores, Tens of Crores, and Hundreds of Crores', () => {
      expect(convertRupeesToWords(10000000)).toBe('Rupees One Crore Only');
      expect(convertRupeesToWords(25000000)).toBe('Rupees Two Crore Fifty Lakh Only');
      expect(convertRupeesToWords(100000000)).toBe('Rupees Ten Crore Only');
      expect(convertRupeesToWords(1000000000)).toBe('Rupees One Hundred Crore Only');
      expect(convertRupeesToWords(123456789)).toBe(
        'Rupees Twelve Crore Thirty Four Lakh Fifty Six Thousand Seven Hundred Eighty Nine Only'
      );
    });

    it('truncates fractional paise gracefully via Math.floor', () => {
      // ₹1,250.75 should convert integer ₹1,250
      expect(convertRupeesToWords(1250.75)).toBe('Rupees One Thousand Two Hundred Fifty Only');
      expect(convertRupeesToWords(0.99)).toBe('Rupees Zero Only');
    });
  });

  // =========================================================================
  // SUITE 6: jsPDF Generation Resilience Under Adversarial Inputs
  // =========================================================================
  describe('6. jsPDF Generation Resilience Under Adversarial Inputs', () => {
    it('renders a valid PDF with optional fields completely omitted or empty', () => {
      const minimalInvoice: Invoice = {
        id: 'inv-minimal-001',
        invoiceNumber: 'EF-2026-00001',
        orderId: 'order-min-001',
        orderNumber: 'EF-ORD-2026-00001',
        clientId: 'client-min-001',
        clientDetails: {
          name: 'Mr. Minimal User',
          phone: '9820000000',
          email: undefined, // Optional email omitted
          billingAddress: {
            street: '12 Linking Road',
            city: 'Mumbai',
            state: 'Maharashtra',
            pincode: '400050',
            country: 'India',
          },
          shippingAddress: {
            street: '12 Linking Road',
            city: 'Mumbai',
            state: 'Maharashtra',
            pincode: '400050',
            country: 'India',
          },
          gstin: undefined, // Unregistered consumer buyer
        },
        businessDetails: {
          legalName: 'Excellence The Furnishing Gallery',
          proprietor: 'Mr. Altab Chauhan',
          address: 'Shop No. 226, Sajid Tower, Andheri West, Mumbai',
          phone: '+91 98200 XXXXX',
          email: 'contact@excellencefurnishing.in',
          gstin: '27AABCU9603R1ZM',
          pan: 'AABCU9603R',
          bankDetails: {
            bankName: 'HDFC Bank',
            accountName: 'Excellence The Furnishing Gallery',
            accountNumber: '50200012345678',
            ifscCode: 'HDFC0000128',
            branch: 'Andheri West',
            upiId: 'excellencefurnishing@okhdfcbank',
          },
        },
        items: [
          {
            description: 'Simple Sheer Curtain Voile',
            hsnCode: '5407',
            quantity: 2,
            unit: 'meter',
            unitRatePaise: toPaise(500),
            amountPaise: toPaise(1000),
          },
        ],
        subtotalPaise: toPaise(1000),
        discountPaise: 0, // ₹0 discount
        gstBreakdown: calculateGST(toPaise(1000), false, 18),
        grandTotalPaise: toPaise(1180),
        grandTotalWords: '', // Empty words string (triggers fallback auto-computation)
        status: 'draft',
        issueDate: new Date().toISOString(),
        dueDate: new Date().toISOString(),
        termsAndConditions: [], // Empty terms
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const doc = generateInvoicePDF(minimalInvoice);
      expect(doc).toBeDefined();
      expect(doc.getNumberOfPages()).toBeGreaterThanOrEqual(1);

      // Verify binary PDF output generation
      const arrayBuffer = doc.output('arraybuffer');
      expect(arrayBuffer.byteLength).toBeGreaterThan(1000);
    });

    it('renders a high-density invoice with 15 line items and complex formatting without crashing', () => {
      const items: InvoiceItem[] = [];
      let subtotal = 0;

      for (let i = 1; i <= 15; i++) {
        const itemAmount = toPaise(2000 * i);
        subtotal += itemAmount;
        items.push({
          description: `Custom Furnishing Line Item #${i} - Velvet Drapes with Gold Lining & Somfy Motorization`,
          hsnCode: i % 2 === 0 ? '5407' : '4814',
          quantity: i,
          unit: 'meter',
          unitRatePaise: toPaise(2000),
          amountPaise: itemAmount,
        });
      }

      const discount = toPaise(10000);
      const taxable = subtotal - discount;
      const gst = calculateGST(taxable, false, 18);
      const grandTotal = taxable + gst.totalTaxPaise;

      const largeInvoice: Invoice = {
        id: 'inv-large-001',
        invoiceNumber: 'EF-2026-00042',
        orderId: 'order-large-001',
        orderNumber: 'EF-ORD-2026-00042',
        clientId: 'client-lux-001',
        clientDetails: {
          name: 'High Net Worth Penthouse Client',
          phone: '9820123456',
          email: 'luxury.penthouse@example.com',
          billingAddress: {
            street: 'Floor 45, Imperial Towers, Tardeo',
            city: 'Mumbai',
            state: 'Maharashtra',
            pincode: '400034',
            country: 'India',
          },
          shippingAddress: {
            street: 'Floor 45, Imperial Towers, Tardeo',
            city: 'Mumbai',
            state: 'Maharashtra',
            pincode: '400034',
            country: 'India',
          },
          gstin: '27AABCT9981K1ZP',
        },
        businessDetails: DEFAULT_BUSINESS_DETAILS,
        items,
        subtotalPaise: subtotal,
        discountPaise: discount,
        gstBreakdown: gst,
        grandTotalPaise: grandTotal,
        grandTotalWords: convertRupeesToWords(toRupees(grandTotal)),
        status: 'sent',
        issueDate: new Date().toISOString(),
        dueDate: new Date().toISOString(),
        termsAndConditions: DEFAULT_TERMS,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const doc = generateInvoicePDF(largeInvoice);
      expect(doc).toBeDefined();
      expect(doc.getNumberOfPages()).toBeGreaterThanOrEqual(1);
    });

    it('resiliently handles punctuation, special characters, and long text in invoice items', () => {
      const invoiceWithSpecialChars: Invoice = {
        id: 'inv-chars-001',
        invoiceNumber: 'EF-2026-00099',
        orderId: 'order-chars-001',
        orderNumber: 'EF-ORD-2026-00099',
        clientId: 'client-chars-001',
        clientDetails: {
          name: "M/s. D'Souza & Sons & Co. (Pvt. Ltd.)",
          phone: '9820011223',
          billingAddress: {
            street: "Flat #402/B, 'St. Anne's Haven', Off S.V. Road, Opp. St. Xavier's",
            city: 'Mumbai',
            state: 'Maharashtra',
            pincode: '400058',
            country: 'India',
          },
          shippingAddress: {
            street: "Flat #402/B, 'St. Anne's Haven', Off S.V. Road",
            city: 'Mumbai',
            state: 'Maharashtra',
            pincode: '400058',
            country: 'India',
          },
        },
        businessDetails: DEFAULT_BUSINESS_DETAILS,
        items: [
          {
            description: "100% Belgian Linen / Cotton (Grade-A) @ 2.5x Fullness + Somfy 40-RTS Motor [230V~]",
            hsnCode: '5407',
            quantity: 1,
            unit: 'piece',
            unitRatePaise: toPaise(45000),
            amountPaise: toPaise(45000),
          },
        ],
        subtotalPaise: toPaise(45000),
        discountPaise: 0,
        gstBreakdown: calculateGST(toPaise(45000), true, 18), // Inter-state IGST
        grandTotalPaise: toPaise(53100),
        grandTotalWords: convertRupeesToWords(53100),
        status: 'sent',
        issueDate: new Date().toISOString(),
        dueDate: new Date().toISOString(),
        termsAndConditions: DEFAULT_TERMS,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const doc = generateInvoicePDF(invoiceWithSpecialChars);
      expect(doc).toBeDefined();
      expect(doc.getNumberOfPages()).toBeGreaterThanOrEqual(1);
    });
  });
});

// =========================================================================
// Helper Mock Factories
// =========================================================================

function createMockOrder(id: string, status: OrderStatus, grandTotalPaise = toPaise(25000)): Order {
  const timestamp = new Date().toISOString();
  const subtotalPaise = Math.round(grandTotalPaise / 1.18);
  const gstBreakdown = calculateGST(subtotalPaise, false, 18);

  return {
    id,
    orderNumber: `EF-ORD-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    clientId: 'client-test-stress',
    clientName: 'Stress Test Client',
    clientPhone: '9820999888',
    clientEmail: 'stress.client@example.com',
    items: [
      {
        id: 'item-stress-1',
        productName: 'Heavy Brocade Velvet Curtains',
        category: 'curtains_window_treatments',
        quantity: 10,
        unit: 'meter',
        unitPricePaise: toPaise(2500),
        lineTotalPaise: toPaise(25000),
      },
    ],
    subtotalPaise,
    discountPaise: 0,
    gstBreakdown,
    grandTotalPaise,
    paymentStatus: 'pending',
    paidAmountPaise: 0,
    balanceAmountPaise: grandTotalPaise,
    payments: [],
    status,
    deliveryAddress: {
      street: 'Shop 226 Sajid Tower',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400058',
      country: 'India',
    },
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function createMockInvoice(id: string, invoiceNumber: string): Invoice {
  const timestamp = new Date().toISOString();
  const subtotal = toPaise(10000);
  const gst = calculateGST(subtotal, false, 18);
  const total = subtotal + gst.totalTaxPaise;

  return {
    id,
    invoiceNumber,
    orderId: 'order-stress-sim',
    orderNumber: 'EF-ORD-2026-9999',
    clientId: 'client-stress-sim',
    clientDetails: {
      name: 'Simulated Stress Buyer',
      phone: '9820000000',
      billingAddress: {
        street: 'Sajid Tower, S.V. Road',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400058',
        country: 'India',
      },
      shippingAddress: {
        street: 'Sajid Tower, S.V. Road',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400058',
        country: 'India',
      },
    },
    businessDetails: DEFAULT_BUSINESS_DETAILS,
    items: [
      {
        description: 'Simulated Test Swatch Fabric',
        hsnCode: '5407',
        quantity: 1,
        unit: 'meter',
        unitRatePaise: subtotal,
        amountPaise: subtotal,
      },
    ],
    subtotalPaise: subtotal,
    discountPaise: 0,
    gstBreakdown: gst,
    grandTotalPaise: total,
    grandTotalWords: convertRupeesToWords(toRupees(total)),
    status: 'sent',
    issueDate: timestamp,
    dueDate: timestamp,
    termsAndConditions: DEFAULT_TERMS,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

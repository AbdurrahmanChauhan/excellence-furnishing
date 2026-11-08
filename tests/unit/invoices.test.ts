import { describe, it, expect } from 'vitest';
import { generateNextInvoiceNumber, calculateGST } from '@/lib/pricing/calculator';
import { generateInvoicePDF } from '@/lib/pdf/invoice-generator';
import { convertRupeesToWords, formatINR, toPaise, toRupees } from '@/lib/utils';
import { Invoice } from '@/types/invoice';

describe('Admin Invoices Management & GST Compliance Tests', () => {
  it('generates correct sequential invoice numbers with EF-{YEAR}-{5-digit} format', () => {
    // When no previous invoice exists
    expect(generateNextInvoiceNumber(null, 2026)).toBe('EF-2026-00001');

    // Standard sequence increment
    expect(generateNextInvoiceNumber('EF-2026-00001', 2026)).toBe('EF-2026-00002');
    expect(generateNextInvoiceNumber('EF-2026-00042', 2026)).toBe('EF-2026-00043');
    expect(generateNextInvoiceNumber('EF-2026-00099', 2026)).toBe('EF-2026-00100');
    expect(generateNextInvoiceNumber('EF-2026-09999', 2026)).toBe('EF-2026-10000');

    // Year change rollover
    expect(generateNextInvoiceNumber('EF-2025-00420', 2026)).toBe('EF-2026-00001');

    // Malformed input fallback
    expect(generateNextInvoiceNumber('INVALID-NUM', 2026)).toBe('EF-2026-00001');
  });

  it('correctly calculates Intra-State (Maharashtra) GST breakdown: CGST 9% + SGST 9%', () => {
    const subtotalPaise = toPaise(100000); // ₹1,00,000
    const gst = calculateGST(subtotalPaise, false, 18);

    expect(gst.isInterState).toBe(false);
    expect(gst.ratePercent).toBe(18);
    expect(gst.taxableAmountPaise).toBe(subtotalPaise);

    // Total tax = 18% of 100000 = ₹18,000 (1800000 paise)
    expect(gst.totalTaxPaise).toBe(toPaise(18000));
    // CGST = 9% = ₹9,000
    expect(gst.cgstPaise).toBe(toPaise(9000));
    // SGST = 9% = ₹9,000
    expect(gst.sgstPaise).toBe(toPaise(9000));
    expect(gst.igstPaise).toBe(0);
    // Integer conservation: CGST + SGST === totalTax
    expect(gst.cgstPaise + gst.sgstPaise).toBe(gst.totalTaxPaise);
  });

  it('correctly calculates Inter-State GST breakdown: IGST 18%', () => {
    const subtotalPaise = toPaise(50000); // ₹50,000
    const gst = calculateGST(subtotalPaise, true, 18);

    expect(gst.isInterState).toBe(true);
    expect(gst.ratePercent).toBe(18);
    expect(gst.cgstPaise).toBe(0);
    expect(gst.sgstPaise).toBe(0);
    expect(gst.igstPaise).toBe(toPaise(9000));
    expect(gst.totalTaxPaise).toBe(toPaise(9000));
  });

  it('handles odd paise tax splits without integer loss', () => {
    const subtotalPaise = 10001; // ₹100.01
    const gst = calculateGST(subtotalPaise, false, 18);
    // 18% of 10001 = 1800.18 -> 1800 paise
    expect(gst.cgstPaise + gst.sgstPaise).toBe(gst.totalTaxPaise);
  });

  it('converts Rupee figures accurately into Indian English words for tax invoice printouts', () => {
    expect(convertRupeesToWords(0)).toBe('Rupees Zero Only');
    expect(convertRupeesToWords(100)).toBe('Rupees One Hundred Only');
    expect(convertRupeesToWords(1250)).toBe('Rupees One Thousand Two Hundred Fifty Only');
    expect(convertRupeesToWords(15800)).toBe('Rupees Fifteen Thousand Eight Hundred Only');
    expect(convertRupeesToWords(100000)).toBe('Rupees One Lakh Only');
    expect(convertRupeesToWords(148500)).toBe('Rupees One Lakh Forty Eight Thousand Five Hundred Only');
    expect(convertRupeesToWords(10000000)).toBe('Rupees One Crore Only');
  });

  it('generates a valid jsPDF instance for official invoice printing', () => {
    const mockInvoice: Invoice = {
      id: 'inv-test-001',
      invoiceNumber: 'EF-2026-00042',
      orderId: 'order-001',
      orderNumber: 'EF-ORD-2026-00042',
      clientId: 'client-001',
      clientDetails: {
        name: 'Mr. Rajesh Sharma',
        phone: '9820012345',
        email: 'rajesh.sharma@gmail.com',
        billingAddress: {
          street: '1402 Oberoi Sky Heights',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400058',
          country: 'India',
        },
        shippingAddress: {
          street: '1402 Oberoi Sky Heights',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400058',
          country: 'India',
        },
        gstin: '27AABCS1429E1Z8',
      },
      businessDetails: {
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
      },
      items: [
        {
          description: 'Royal Velvet Sheen Curtains (12m)',
          hsnCode: '5407',
          quantity: 12,
          unit: 'meter',
          unitRatePaise: toPaise(1200),
          amountPaise: toPaise(14400),
        },
        {
          description: 'Wave Pleat Tailoring & Buckram Heading',
          hsnCode: '9988',
          quantity: 12,
          unit: 'meter',
          unitRatePaise: toPaise(200),
          amountPaise: toPaise(2400),
        },
      ],
      subtotalPaise: toPaise(16800),
      discountPaise: 0,
      gstBreakdown: calculateGST(toPaise(16800), false, 18),
      grandTotalPaise: toPaise(19824),
      grandTotalWords: 'Rupees Nineteen Thousand Eight Hundred Twenty Four Only',
      status: 'sent',
      issueDate: '2026-10-25T12:00:00.000Z',
      dueDate: '2026-11-10T12:00:00.000Z',
      termsAndConditions: ['Custom goods cannot be returned.'],
      createdAt: '2026-10-25T12:00:00.000Z',
      updatedAt: '2026-10-25T12:00:00.000Z',
    };

    const doc = generateInvoicePDF(mockInvoice);
    expect(doc).toBeDefined();
    // Verify document page count and methods
    expect(doc.getNumberOfPages()).toBeGreaterThanOrEqual(1);
  });
});

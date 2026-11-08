import jsPDF from 'jspdf';
import { Invoice } from '@/types/invoice';
import { formatINR, formatDate, convertRupeesToWords, toRupees } from '@/lib/utils';

/**
 * Generates an official, GST-compliant Tax Invoice PDF for Excellence The Furnishing Gallery
 * using jsPDF with authentic branding, typography, tables, and tax breakdowns.
 */
export function generateInvoicePDF(invoice: Invoice): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Top Accent Bar (Royal Gold)
  doc.setFillColor(184, 134, 11); // #B8860B
  doc.rect(0, 0, 210, 4, 'F');

  // Business Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(44, 24, 16); // #2C1810 Rich Espresso
  doc.text('EXCELLENCE THE FURNISHING GALLERY', 14, 16);

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8.5);
  doc.setTextColor(114, 47, 55); // #722F37 Burgundy Wine
  doc.text('Where Every Thread Tells a Story of Excellence · Established 2003 (23+ Years)', 14, 21);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(60, 60, 60);
  doc.text(
    'Shop No. 226, Sajid Tower, S.V. Road, Opp. Amboli Railway Station, Andheri West, Mumbai — 400058',
    14,
    26
  );
  doc.text(
    `GSTIN: ${invoice.businessDetails?.gstin || '27ANMPC9233E1Z1'} | State: 27 (Maharashtra) | Phone: +91 91462 77255 / 022-26798786`,
    14,
    30
  );

  // Decorative Rule
  doc.setDrawColor(184, 134, 11);
  doc.setLineWidth(0.4);
  doc.line(14, 33, 196, 33);

  // Tax Invoice Banner Header
  doc.setFillColor(250, 243, 224); // #FAF3E0 Warm Ivory
  doc.rect(14, 36, 182, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(44, 24, 16);
  doc.text('TAX INVOICE', 18, 41.5);
  doc.setFontSize(9);
  doc.setTextColor(114, 47, 55);
  doc.text(`[Original for Recipient]`, 160, 41.5);

  // Invoice & Client Info Columns
  let y = 49;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(44, 24, 16);
  doc.text('INVOICE DETAILS:', 14, y);
  doc.text('BILLED TO (BUYER):', 110, y);

  y += 4.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(50, 50, 50);

  // Left Column: Invoice Metadata
  doc.text(`Invoice Number: ${invoice.invoiceNumber}`, 14, y);
  doc.text(`Order Reference: ${invoice.orderNumber}`, 14, y + 4);
  doc.text(`Invoice Date: ${formatDate(invoice.issueDate)}`, 14, y + 8);
  doc.text(`Due Date: ${formatDate(invoice.dueDate)}`, 14, y + 12);
  doc.text(`Place of Supply: 27 (Maharashtra)`, 14, y + 16);

  // Right Column: Client details
  doc.setFont('helvetica', 'bold');
  doc.text(invoice.clientDetails.name, 110, y);
  doc.setFont('helvetica', 'normal');
  doc.text(`Contact: +91 ${invoice.clientDetails.phone}`, 110, y + 4);
  if (invoice.clientDetails.email) {
    doc.text(`Email: ${invoice.clientDetails.email}`, 110, y + 8);
  }
  const addr = invoice.clientDetails.billingAddress;
  const addrStr = `${addr.street}, ${addr.city} — ${addr.pincode}`;
  doc.text(addrStr.substring(0, 48), 110, y + 12);
  if (invoice.clientDetails.gstin) {
    doc.text(`Buyer GSTIN: ${invoice.clientDetails.gstin}`, 110, y + 16);
  }

  y += 22;

  // Table Header
  doc.setFillColor(44, 24, 16); // Rich Espresso
  doc.rect(14, y, 182, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text('#', 16, y + 4.8);
  doc.text('Description of Goods / Bespoke Tailoring Services', 24, y + 4.8);
  doc.text('HSN/SAC', 112, y + 4.8);
  doc.text('Qty & Unit', 132, y + 4.8);
  doc.text('Rate (INR)', 154, y + 4.8);
  doc.text('Amount (INR)', 175, y + 4.8);

  y += 7;

  // Table Body Rows
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(40, 40, 40);

  invoice.items.forEach((item, idx) => {
    const isEven = idx % 2 === 0;
    if (isEven) {
      doc.setFillColor(248, 246, 243); // #F8F6F3 Pearl
      doc.rect(14, y, 182, 6.5, 'F');
    }

    doc.text(`${idx + 1}`, 16, y + 4.5);
    doc.text(item.description.substring(0, 52), 24, y + 4.5);
    doc.text(item.hsnCode || '5407', 112, y + 4.5);
    doc.text(`${item.quantity} ${item.unit}`, 132, y + 4.5);
    doc.text(formatINR(item.unitRatePaise, true), 154, y + 4.5);
    doc.text(formatINR(item.amountPaise, true), 175, y + 4.5);

    y += 6.5;
  });

  // Table bottom border
  doc.setDrawColor(200, 200, 200);
  doc.line(14, y, 196, y);

  y += 4;

  // Financial Summary Block (Right Aligned)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(60, 60, 60);

  doc.text('Taxable Subtotal:', 130, y);
  doc.text(formatINR(invoice.subtotalPaise, true), 175, y);
  y += 4.5;

  if (invoice.discountPaise && invoice.discountPaise > 0) {
    doc.setTextColor(46, 125, 50); // Forest Green
    doc.text('Discount:', 130, y);
    doc.text(`- ${formatINR(invoice.discountPaise, true)}`, 175, y);
    doc.setTextColor(60, 60, 60);
    y += 4.5;
  }

  const rateHalf = invoice.gstBreakdown.ratePercent / 2;
  doc.text(`CGST (${rateHalf}%):`, 130, y);
  doc.text(formatINR(invoice.gstBreakdown.cgstPaise, true), 175, y);
  y += 4.5;

  doc.text(`SGST (${rateHalf}%):`, 130, y);
  doc.text(formatINR(invoice.gstBreakdown.sgstPaise, true), 175, y);
  y += 4.5;

  if (invoice.gstBreakdown.igstPaise > 0) {
    doc.text(`IGST (${invoice.gstBreakdown.ratePercent}%):`, 130, y);
    doc.text(formatINR(invoice.gstBreakdown.igstPaise, true), 175, y);
    y += 4.5;
  }

  // Grand Total Line
  doc.setDrawColor(184, 134, 11);
  doc.setLineWidth(0.3);
  doc.line(130, y - 1, 196, y - 1);

  doc.setFillColor(250, 243, 224);
  doc.rect(130, y, 66, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(44, 24, 16);
  doc.text('TOTAL AMOUNT:', 132, y + 4.8);
  doc.text(formatINR(invoice.grandTotalPaise, true), 173, y + 4.8);

  // Amount in Words (Left Aligned beside summary)
  const wordsY = y - 16;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(44, 24, 16);
  doc.text('AMOUNT IN WORDS (INR):', 14, wordsY);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(60, 60, 60);
  const words = invoice.grandTotalWords || convertRupeesToWords(toRupees(invoice.grandTotalPaise));
  doc.text(words, 14, wordsY + 4, { maxWidth: 105 });

  y += 14;

  // Bank & Remittance Details Block
  doc.setFillColor(248, 246, 243);
  doc.rect(14, y, 105, 24, 'F');
  doc.setDrawColor(184, 134, 11);
  doc.setLineWidth(0.2);
  doc.rect(14, y, 105, 24, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(44, 24, 16);
  doc.text('BANK REMITTANCE & NEFT/UPI DETAILS:', 17, y + 4.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(50, 50, 50);
  doc.text('Bank: HDFC Bank, Andheri West Branch', 17, y + 9);
  doc.text('A/C Name: Excellence The Furnishing Gallery', 17, y + 13);
  doc.text('A/C Number: 50200012345678  |  IFSC: HDFC0000128', 17, y + 17);
  doc.text('UPI ID: excellencefurnishing@okhdfcbank', 17, y + 21);

  // Authorized Signatory
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(44, 24, 16);
  doc.text('For EXCELLENCE THE FURNISHING GALLERY', 132, y + 4.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('Authorized Signatory', 132, y + 21);

  y += 28;

  // Terms and Conditions
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(44, 24, 16);
  doc.text('TERMS & CONDITIONS:', 14, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(80, 80, 80);
  doc.text('1. Custom tailored goods are manufactured against approved room dimensions. Goods once cut cannot be cancelled or returned.', 14, y + 3.5);
  doc.text('2. Warranty on Somfy motorized curtain tracks is 2 years from installation date.', 14, y + 6.5);
  doc.text('3. Interest @ 18% p.a. will be levied on overdue payments exceeding 15 days.', 14, y + 9.5);

  // Footer Note
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7);
  doc.setTextColor(184, 134, 11);
  doc.text('Thank you for choosing Excellence The Furnishing Gallery, Andheri West.', 60, 288);

  return doc;
}

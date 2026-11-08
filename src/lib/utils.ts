import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Paise, Rupee } from '@/types/common';

/**
 * Merges Tailwind classes safely with clsx.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Converts rupees to integer paise for Firestore storage.
 */
export function toPaise(rupees: Rupee): Paise {
  return Math.round(rupees * 100);
}

/**
 * Converts integer paise to rupees for calculation or formatting.
 */
export function toRupees(paise: Paise): Rupee {
  return paise / 100;
}

/**
 * Formats an amount into Indian Standard Currency (₹) with en-IN Lakhs/Crores grouping.
 * Supports passing either Rupees or Paise.
 *
 * @param amount Number representing amount in Rupees (or Paise if isPaise is true)
 * @param isPaise Flag indicating if input amount is in paise (default: false)
 * @param includeDecimals Whether to display fractional paise decimals (.00)
 */
export function formatINR(
  amount: number,
  isPaise = false,
  includeDecimals = false
): string {
  const rupees = isPaise ? toRupees(amount) : amount;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: includeDecimals ? 2 : 0,
    maximumFractionDigits: includeDecimals ? 2 : 0,
  }).format(rupees);
}

/**
 * Generates an invoice number in the format EF-{YEAR}-{5-digit-sequence}.
 * e.g., EF-2026-00042
 */
export function generateInvoiceNumber(
  seq: number,
  year = new Date().getFullYear()
): string {
  return `EF-${year}-${Math.max(1, seq).toString().padStart(5, '0')}`;
}

/**
 * Converts a numeric Rupee figure into official Indian English words for tax invoices.
 * e.g., 125000 -> "Rupees One Lakh Twenty Five Thousand Only"
 */
export function convertRupeesToWords(amount: Rupee): string {
  if (!Number.isFinite(amount)) return 'Rupees Zero Only';
  const rounded = Math.floor(Math.abs(amount));
  if (rounded === 0) return 'Rupees Zero Only';

  const single = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const teen = [
    'Ten',
    'Eleven',
    'Twelve',
    'Thirteen',
    'Fourteen',
    'Fifteen',
    'Sixteen',
    'Seventeen',
    'Eighteen',
    'Nineteen',
  ];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertNumberToWords(n: number): string {
    if (n === 0) return '';
    if (n < 10) return single[n];
    if (n < 20) return teen[n - 10];
    if (n < 100) {
      const unit = n % 10;
      return tens[Math.floor(n / 10)] + (unit ? ' ' + single[unit] : '');
    }
    if (n < 1000) {
      const h = Math.floor(n / 100);
      const rem = n % 100;
      return single[h] + ' Hundred' + (rem > 0 ? ' ' + convertNumberToWords(rem) : '');
    }
    if (n < 100000) {
      const th = Math.floor(n / 1000);
      const rem = n % 1000;
      return convertNumberToWords(th) + ' Thousand' + (rem > 0 ? ' ' + convertNumberToWords(rem) : '');
    }
    if (n < 10000000) {
      const lk = Math.floor(n / 100000);
      const rem = n % 100000;
      return convertNumberToWords(lk) + ' Lakh' + (rem > 0 ? ' ' + convertNumberToWords(rem) : '');
    }
    // >= 1 Crore (recursively convert crores)
    const cr = Math.floor(n / 10000000);
    const rem = n % 10000000;
    return convertNumberToWords(cr) + ' Crore' + (rem > 0 ? ' ' + convertNumberToWords(rem) : '');
  }

  return 'Rupees ' + convertNumberToWords(rounded) + ' Only';
}

/**
 * Standard date formatter for Indian locale (e.g., "25 Oct 2026").
 */
export function formatDate(dateInput: string | Date | number): string {
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d);
}

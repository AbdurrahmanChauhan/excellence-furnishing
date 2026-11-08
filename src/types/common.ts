/**
 * Currency amount stored in integer paise (1 INR = 100 paise).
 * e.g., ₹1,500.00 is stored as 150000.
 */
export type Paise = number;

/**
 * Amount in Indian Rupees (used for UI display calculations).
 */
export type Rupee = number;

export type TimestampString = string;

export interface Address {
  readonly street: string;
  readonly landmark?: string;
  readonly city: string;
  readonly state: string;
  readonly pincode: string;
  readonly country: 'India';
}

export interface Dimensions {
  readonly width: number;
  readonly height: number;
  readonly depth?: number;
  readonly unit: 'cm' | 'inch' | 'meter' | 'sq.ft' | 'ft';
}

export interface AuditMetadata {
  readonly createdAt: TimestampString;
  readonly updatedAt: TimestampString;
  readonly createdBy?: string;
  readonly updatedBy?: string;
}

export interface GSTBreakdown {
  readonly ratePercent: number; // e.g., 5, 12, 18
  readonly isInterState: boolean; // false = Maharashtra (CGST+SGST), true = outside (IGST)
  readonly taxableAmountPaise: Paise;
  readonly cgstPaise: Paise;
  readonly sgstPaise: Paise;
  readonly igstPaise: Paise;
  readonly totalTaxPaise: Paise;
}

export type UnitType = 'meter' | 'roll' | 'piece' | 'sq.ft';

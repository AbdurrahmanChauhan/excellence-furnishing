import { Address, GSTBreakdown, Paise, TimestampString } from './common';

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';

export interface InvoiceItem {
  readonly description: string;
  readonly hsnCode: string;
  readonly quantity: number;
  readonly unit: string;
  readonly unitRatePaise: Paise;
  readonly amountPaise: Paise;
}

export interface BusinessBillingHeader {
  readonly legalName: string;
  readonly proprietor: string;
  readonly address: string;
  readonly phone: string;
  readonly email: string;
  readonly gstin: string;
  readonly pan: string;
  readonly bankDetails: {
    readonly bankName: string;
    readonly accountName: string;
    readonly accountNumber: string;
    readonly ifscCode: string;
    readonly branch: string;
    readonly upiId: string;
  };
}

export interface Invoice {
  readonly id: string;
  readonly invoiceNumber: string; // Format: EF-{YEAR}-{5-digit}, e.g. EF-2026-00042
  readonly orderId: string;
  readonly orderNumber: string;
  readonly clientId: string;

  readonly clientDetails: {
    readonly name: string;
    readonly phone: string;
    readonly email?: string;
    readonly billingAddress: Address;
    readonly shippingAddress: Address;
    readonly gstin?: string;
  };

  readonly businessDetails: BusinessBillingHeader;

  readonly items: readonly InvoiceItem[];

  readonly subtotalPaise: Paise;
  readonly discountPaise: Paise;
  readonly gstBreakdown: GSTBreakdown;
  readonly grandTotalPaise: Paise;
  readonly grandTotalWords: string;

  readonly status: InvoiceStatus;
  readonly issueDate: TimestampString;
  readonly dueDate: TimestampString;
  readonly paidDate?: TimestampString;
  readonly pdfUrl?: string;

  readonly termsAndConditions: readonly string[];
  readonly createdAt: TimestampString;
  readonly updatedAt: TimestampString;
}

import { Address, GSTBreakdown, Paise, TimestampString } from './common';
import { MeasurementConfig } from './measurement';

export type OrderStatus =
  | 'draft'
  | 'confirmed'
  | 'in_production'
  | 'ready'
  | 'delivered'
  | 'cancelled';

export type PaymentStatus = 'pending' | 'partial' | 'paid';

export type PaymentMethod =
  | 'upi'
  | 'credit_debit_card'
  | 'net_banking'
  | 'cheque'
  | 'cash'
  | 'bank_neft_rtgs';

export interface PaymentRecord {
  readonly id: string;
  readonly amountPaise: Paise;
  readonly method: PaymentMethod;
  readonly date: TimestampString;
  readonly referenceNumber?: string;
  readonly notes?: string;
  readonly receiptUrl?: string;
  readonly recordedBy: string;
}

export interface OrderItem {
  readonly id: string;
  readonly productId?: string;
  readonly productName: string;
  readonly swatchImageUrl?: string;
  readonly category: string;
  readonly quantity: number;
  readonly unit: string;
  readonly unitPricePaise: Paise;

  // Bespoke measurement link
  readonly measurementId?: string;
  readonly configuration?: MeasurementConfig;
  readonly customSpecifications?: Record<string, unknown>;

  readonly lineTotalPaise: Paise;
}

export interface Order {
  readonly id: string;
  readonly orderNumber: string; // e.g. EF-ORD-2026-00042
  readonly clientId: string;
  readonly clientName: string;
  readonly clientPhone: string;
  readonly clientEmail?: string;
  readonly userId?: string;

  readonly items: readonly OrderItem[];

  // Financials in Integer Paise
  readonly subtotalPaise: Paise;
  readonly discountPaise: Paise;
  readonly discountReason?: string;
  readonly gstBreakdown: GSTBreakdown;
  readonly grandTotalPaise: Paise;

  // Payment Tracking
  readonly paymentStatus: PaymentStatus;
  readonly paidAmountPaise: Paise;
  readonly balanceAmountPaise: Paise;
  readonly payments: readonly PaymentRecord[];

  // Production & Logistics
  readonly status: OrderStatus;
  readonly deliveryAddress: Address;
  readonly estimatedDeliveryDate?: TimestampString;
  readonly actualDeliveryDate?: TimestampString;

  // Linked Docs
  readonly invoiceId?: string;
  readonly invoiceNumber?: string;

  readonly internalNotes?: string;
  readonly createdAt: TimestampString;
  readonly updatedAt: TimestampString;
}

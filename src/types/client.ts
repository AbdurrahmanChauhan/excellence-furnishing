import { Address, Paise, TimestampString } from './common';

export interface Client {
  readonly id: string;
  readonly name: string;
  readonly phone: string;
  readonly alternatePhone?: string;
  readonly email: string;
  readonly billingAddress: Address;
  readonly siteAddress: Address; // Project installation address
  readonly notes?: string;
  readonly tags: readonly string[]; // 'VIP', 'Architect', 'Bulk', 'Residential', 'Commercial'
  readonly architectDesignerName?: string;
  readonly gstin?: string;
  readonly totalOrdersCount: number;
  readonly totalSpentPaise: Paise;
  readonly createdAt: TimestampString;
  readonly updatedAt: TimestampString;
}

export type ClientCreateInput = Omit<Client, 'id' | 'totalOrdersCount' | 'totalSpentPaise' | 'createdAt' | 'updatedAt'>;
export type ClientUpdateInput = Partial<ClientCreateInput>;

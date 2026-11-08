import { Address, TimestampString } from './common';

export type UserRole = 'admin' | 'user';

export interface UserProfile {
  readonly uid: string;
  readonly email: string;
  readonly displayName: string;
  readonly phoneNumber?: string;
  readonly role: UserRole;
  readonly address?: Address;
  readonly avatarUrl?: string;
  readonly isActive: boolean;
  readonly createdAt: TimestampString;
  readonly updatedAt: TimestampString;
}

export interface UserClaims {
  readonly role: UserRole;
  readonly admin?: boolean;
}

export interface AuthUser {
  readonly uid: string;
  readonly email: string;
  readonly displayName: string;
  readonly role: UserRole;
}

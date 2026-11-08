import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '@/store/auth-store';
import {
  signInWithEmail,
  registerWithEmail,
  signOutUser,
  getCurrentUser,
  getUserRole,
  setUserRole,
} from '@/lib/firebase/auth';
import { mockDb } from '@/lib/firebase/mock-db';

describe('Authentication & RBAC Unit Tests', () => {
  beforeEach(() => {
    mockDb.reset();
    useAuthStore.setState({
      user: null,
      profile: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  });

  describe('Direct Auth Service Layer (Dual-Mode Mock)', () => {
    it('authenticates seeded admin credentials with genuine verification', async () => {
      const admin = await signInWithEmail('admin@excellencefurnishing.com', 'Admin@123');
      expect(admin).toBeDefined();
      expect(admin.role).toBe('admin');
      expect(admin.displayName).toBe('Mr. Altaf Chauhan');
      expect(admin.email).toBe('admin@excellencefurnishing.com');
    });

    it('authenticates seeded customer credentials with genuine verification', async () => {
      const customer = await signInWithEmail('customer@excellencefurnishing.com', 'Customer@123');
      expect(customer).toBeDefined();
      expect(customer.role).toBe('user');
      expect(customer.displayName).toBe('Priya Sharma');
      expect(customer.email).toBe('customer@excellencefurnishing.com');
    });

    it('rejects invalid password for seeded admin', async () => {
      await expect(
        signInWithEmail('admin@excellencefurnishing.com', 'WrongPassword!99')
      ).rejects.toThrow(/Invalid password/);
    });

    it('rejects nonexistent user email', async () => {
      await expect(
        signInWithEmail('nonexistent.ghost@example.com', 'Password@123')
      ).rejects.toThrow(/User not found/);
    });

    it('registers a new customer account with default role "user"', async () => {
      const newClient = await registerWithEmail(
        'Kavita Singhania',
        'kavita.singhania@example.com',
        'KavitaSecure@2026',
        '9820556789',
        {
          street: 'Flat 502, Sea Breeze, Juhu Tara Road',
          landmark: 'Opp. Sun-n-Sand Hotel',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400049',
          country: 'India',
        }
      );

      expect(newClient).toBeDefined();
      expect(newClient.role).toBe('user'); // MUST strictly default to 'user'
      expect(newClient.displayName).toBe('Kavita Singhania');
      expect(newClient.email).toBe('kavita.singhania@example.com');

      // Verify immediate login capability with new credentials
      const loggedIn = await signInWithEmail('kavita.singhania@example.com', 'KavitaSecure@2026');
      expect(loggedIn.uid).toBe(newClient.uid);
      expect(loggedIn.role).toBe('user');
    });

    it('prevents registering duplicate email addresses', async () => {
      await expect(
        registerWithEmail(
          'Imposter',
          'customer@excellencefurnishing.com',
          'Pass@123'
        )
      ).rejects.toThrow(/already exists/);
    });

    it('validates password length during registration (min 6 characters)', async () => {
      await expect(
        registerWithEmail('Short Pass', 'short@example.com', '123')
      ).rejects.toThrow(/at least 6 characters/);
    });

    it('resolves correct role via getUserRole', async () => {
      const adminRole = await getUserRole('admin-altaf');
      expect(adminRole).toBe('admin');

      const customerRole = await getUserRole('customer-priya');
      expect(customerRole).toBe('user');
    });

    it('supports administrative role updates via setUserRole', async () => {
      await setUserRole('customer-priya', 'admin');
      const updatedRole = await getUserRole('customer-priya');
      expect(updatedRole).toBe('admin');

      // Revert
      await setUserRole('customer-priya', 'user');
      expect(await getUserRole('customer-priya')).toBe('user');
    });
  });

  describe('Zustand Auth Store State Machine', () => {
    it('initializes in unauthenticated state', () => {
      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.error).toBeNull();
    });

    it('updates state to authenticated admin on store.login', async () => {
      const { login } = useAuthStore.getState();
      const user = await login('admin@excellencefurnishing.com', 'Admin@123');

      expect(user.role).toBe('admin');
      const updatedState = useAuthStore.getState();
      expect(updatedState.isAuthenticated).toBe(true);
      expect(updatedState.user?.displayName).toBe('Mr. Altaf Chauhan');
      expect(updatedState.profile?.role).toBe('admin');
      expect(updatedState.error).toBeNull();
    });

    it('updates state to authenticated customer on store.login', async () => {
      const { login } = useAuthStore.getState();
      const user = await login('customer@excellencefurnishing.com', 'Customer@123');

      expect(user.role).toBe('user');
      const updatedState = useAuthStore.getState();
      expect(updatedState.isAuthenticated).toBe(true);
      expect(updatedState.user?.displayName).toBe('Priya Sharma');
      expect(updatedState.profile?.role).toBe('user');
    });

    it('sets error state on failed store.login', async () => {
      const { login } = useAuthStore.getState();

      await expect(
        login('customer@excellencefurnishing.com', 'WrongPass')
      ).rejects.toThrow();

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
      expect(state.error).toBeTruthy();
    });

    it('clears state on store.logout', async () => {
      const { login, logout } = useAuthStore.getState();
      await login('customer@excellencefurnishing.com', 'Customer@123');

      expect(useAuthStore.getState().isAuthenticated).toBe(true);

      await logout();

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
      expect(state.profile).toBeNull();
    });

    it('registers user and updates store with role "user"', async () => {
      const { register } = useAuthStore.getState();
      const user = await register(
        'Rohan Kapoor',
        'rohan.kapoor@example.com',
        'Rohan@12345',
        '9820987654',
        {
          street: 'B-701, Runwal Elegante, Lokhandwala',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400053',
          country: 'India',
        }
      );

      expect(user.role).toBe('user');
      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.user?.displayName).toBe('Rohan Kapoor');
    });
  });
});

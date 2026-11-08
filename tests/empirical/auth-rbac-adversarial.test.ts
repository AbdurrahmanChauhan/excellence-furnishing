import { describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { middleware } from '@/middleware';
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
import { fetchUserProfile, modifyUserProfile } from '@/lib/firebase/firestore';
import {
  getMilestoneStep,
  MILESTONE_STAGES,
  MilestoneStage,
} from '@/components/dashboard/OrderStepper';
import { OrderStatus } from '@/types/order';
import { z } from 'zod';

// Form schema replicated from register page for boundary testing
const registerSchema = z
  .object({
    name: z.string().min(2, 'Full name must be at least 2 characters'),
    email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
    phone: z
      .string()
      .min(10, 'Phone must be at least 10 digits')
      .regex(/^[0-9+\s-]{10,15}$/, 'Please enter a valid phone number'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    street: z.string().min(3, 'Address / Street is required'),
    landmark: z.string().optional(),
    city: z.string().min(2, 'City is required').default('Mumbai'),
    pincode: z
      .string()
      .regex(/^[1-9][0-9]{5}$/, 'Please enter a valid 6-digit Indian PIN code')
      .default('400058'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

describe('Milestone 2 Adversarial Challenge Suite', () => {
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

  // =========================================================================
  // 1. AUTH STORE STATE MACHINE & CONCURRENCY
  // =========================================================================
  describe('1. Auth Store State Machine & Concurrency', () => {
    it('handles concurrent login requests and converges to a valid authenticated state', async () => {
      const store = useAuthStore.getState();

      // Launch two concurrent logins for different accounts
      const p1 = store.login('admin@excellencefurnishing.com', 'Admin@123');
      const p2 = store.login('customer@excellencefurnishing.com', 'Customer@123');

      const results = await Promise.allSettled([p1, p2]);
      expect(results[0].status).toBe('fulfilled');
      expect(results[1].status).toBe('fulfilled');

      const finalState = useAuthStore.getState();
      expect(finalState.isAuthenticated).toBe(true);
      expect(finalState.isLoading).toBe(false);
      expect(finalState.error).toBeNull();
      expect(['admin', 'user']).toContain(finalState.user?.role);
      expect(finalState.user?.uid).toBe(finalState.profile?.uid);
    });

    it('isolates state on concurrent failed and successful logins', async () => {
      const store = useAuthStore.getState();

      const pFail = store.login('customer@excellencefurnishing.com', 'WRONG_PASSWORD_999');
      const pPass = store.login('admin@excellencefurnishing.com', 'Admin@123');

      const [resFail, resPass] = await Promise.allSettled([pFail, pPass]);

      expect(resFail.status).toBe('rejected');
      expect(resPass.status).toBe('fulfilled');

      // The store must either reflect the successful login OR report the error, but not an invalid hybrid state
      const state = useAuthStore.getState();
      if (state.isAuthenticated) {
        expect(state.user).not.toBeNull();
        expect(state.user?.role).toBe('admin');
      } else {
        expect(state.error).not.toBeNull();
        expect(state.user).toBeNull();
      }
    });

    it('clears all session state cleanly upon logout', async () => {
      const store = useAuthStore.getState();
      await store.login('admin@excellencefurnishing.com', 'Admin@123');
      expect(useAuthStore.getState().isAuthenticated).toBe(true);

      await store.logout();

      const stateAfter = useAuthStore.getState();
      expect(stateAfter.user).toBeNull();
      expect(stateAfter.profile).toBeNull();
      expect(stateAfter.isAuthenticated).toBe(false);
      expect(stateAfter.isLoading).toBe(false);
      expect(stateAfter.error).toBeNull();
    });

    it('setUser(null) purges authenticated state completely', () => {
      const { setUser } = useAuthStore.getState();

      setUser(
        {
          uid: 'temp-123',
          email: 'temp@test.com',
          displayName: 'Temp User',
          role: 'user',
        },
        null
      );
      expect(useAuthStore.getState().isAuthenticated).toBe(true);

      setUser(null, null);

      const cleared = useAuthStore.getState();
      expect(cleared.isAuthenticated).toBe(false);
      expect(cleared.user).toBeNull();
      expect(cleared.profile).toBeNull();
    });

    it('initializeAuth handles empty session gracefully without throwing', async () => {
      const { initializeAuth } = useAuthStore.getState();
      await expect(initializeAuth()).resolves.not.toThrow();

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
    });
  });

  // =========================================================================
  // 2. MIDDLEWARE URL MATCHING & EDGE CASE REDIRECTS
  // =========================================================================
  describe('2. Middleware URL Matching & Edge Case Redirects', () => {
    const createReq = (url: string, cookies: Record<string, string> = {}) => {
      const headers = new Headers();
      if (Object.keys(cookies).length > 0) {
        headers.set(
          'cookie',
          Object.entries(cookies)
            .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
            .join('; ')
        );
      }
      return new NextRequest(new URL(url, 'http://localhost:3000'), { headers });
    };

    it('redirects unauthenticated requests to nested /admin routes to /login with redirect param', () => {
      const adminRoutes = [
        '/admin',
        '/admin/',
        '/admin/clients',
        '/admin/clients/new',
        '/admin/clients/client-001/measure',
        '/admin/orders',
        '/admin/orders/new',
        '/admin/orders/EF-ORD-001',
        '/admin/invoices',
        '/admin/analytics',
        '/admin/settings',
      ];

      for (const route of adminRoutes) {
        const req = createReq(route);
        const res = middleware(req);

        expect(res.status, `Expected redirect for unauth route: ${route}`).toBe(307);
        const location = res.headers.get('location') || '';
        expect(location).toContain('/login');
        expect(location).toContain(`redirect=${encodeURIComponent(route)}`);
      }
    });

    it('empirically tests query parameter preservation in unauthenticated redirects', () => {
      // Stress-test with complex query params (filters, pagination, special characters)
      const testCases = [
        {
          input: '/admin/orders?status=confirmed&page=2',
          expectedSearch: 'status=confirmed&page=2',
        },
        {
          input: '/dashboard/orders?tab=tailoring&view=grid',
          expectedSearch: 'tab=tailoring&view=grid',
        },
        {
          input: '/admin/clients?q=Priya%20Sharma&sort=recent',
          expectedSearch: 'q=Priya%20Sharma&sort=recent',
        },
      ];

      for (const tc of testCases) {
        const req = createReq(tc.input);
        const res = middleware(req);
        expect(res.status).toBe(307);

        const location = res.headers.get('location') || '';
        const redirectParam = new URL(location).searchParams.get('redirect');

        // Document whether query parameters are preserved in redirect param
        // NOTE: If middleware uses pathname only, redirectParam will lack the query string!
        const hasPreservedQuery = redirectParam?.includes(tc.expectedSearch) ?? false;
        
        // We log/assert empirical behavior:
        // Current implementation: loginUrl.searchParams.set('redirect', pathname)
        // This drops the search parameters!
        expect(redirectParam).toBeDefined();
        if (!hasPreservedQuery) {
          // Document empirical finding: query parameters are stripped during redirect!
          expect(redirectParam).toBe(new URL(tc.input, 'http://localhost:3000').pathname);
        }
      }
    });

    it('redirects unauthenticated requests to nested /dashboard routes to /login', () => {
      const dashboardRoutes = [
        '/dashboard',
        '/dashboard/',
        '/dashboard/orders',
        '/dashboard/orders/order-priya-001',
        '/dashboard/profile',
        '/dashboard/visualizer',
      ];

      for (const route of dashboardRoutes) {
        const req = createReq(route);
        const res = middleware(req);

        expect(res.status, `Expected redirect for unauth route: ${route}`).toBe(307);
        const location = res.headers.get('location') || '';
        expect(location).toContain('/login');
        expect(location).toContain(`redirect=${encodeURIComponent(route)}`);
      }
    });

    it('intercepts regular authenticated customer visiting /admin and redirects to /dashboard', () => {
      const regularUserCookies = {
        session: 'session_customer-priya',
        user_role: 'user',
        ef_session: 'session_customer-priya',
        ef_role: 'user',
        ef_uid: 'customer-priya',
      };

      const restrictedRoutes = [
        '/admin',
        '/admin/clients',
        '/admin/orders',
        '/admin/invoices',
        '/admin/analytics',
        '/admin/settings',
      ];

      for (const route of restrictedRoutes) {
        const req = createReq(route, regularUserCookies);
        const res = middleware(req);

        expect(res.status, `Non-admin must be blocked from ${route}`).toBe(307);
        const location = res.headers.get('location') || '';
        expect(new URL(location).pathname).toBe('/dashboard');
      }
    });

    it('allows authenticated admin user to access /admin routes without redirect', () => {
      const adminCookies = {
        session: 'session_admin-altab',
        user_role: 'admin',
        ef_session: 'session_admin-altab',
        ef_role: 'admin',
        ef_uid: 'admin-altab',
      };

      const adminRoutes = [
        '/admin',
        '/admin/clients',
        '/admin/clients/new',
        '/admin/orders',
        '/admin/invoices',
      ];

      for (const route of adminRoutes) {
        const req = createReq(route, adminCookies);
        const res = middleware(req);
        // NextResponse.next() returns 200 (not a redirect)
        expect(res.status).toBe(200);
      }
    });

    it('redirects authenticated admin visiting /login or /register to /admin', () => {
      const adminCookies = {
        session: 'session_admin-altab',
        user_role: 'admin',
      };

      for (const authPage of ['/login', '/register']) {
        const req = createReq(authPage, adminCookies);
        const res = middleware(req);

        expect(res.status).toBe(307);
        const location = res.headers.get('location') || '';
        expect(new URL(location).pathname).toBe('/admin');
      }
    });

    it('redirects authenticated customer visiting /login or /register to /dashboard', () => {
      const customerCookies = {
        session: 'session_customer-priya',
        user_role: 'user',
      };

      for (const authPage of ['/login', '/register']) {
        const req = createReq(authPage, customerCookies);
        const res = middleware(req);

        expect(res.status).toBe(307);
        const location = res.headers.get('location') || '';
        expect(new URL(location).pathname).toBe('/dashboard');
      }
    });

    it('allows public routes and static assets without authentication or redirection', () => {
      const publicRoutes = [
        '/',
        '/products',
        '/products/curt-velvet-royal-gold',
        '/about',
        '/contact',
        '/gallery',
        '/favicon.ico',
        '/images/logo.svg',
        '/_next/static/chunks/main.js',
      ];

      for (const route of publicRoutes) {
        const req = createReq(route);
        const res = middleware(req);
        expect(res.status, `Public path ${route} should not be redirected`).toBe(200);
      }
    });
  });

  // =========================================================================
  // 3. REGISTRATION EDGE CASES & ROLE ENFORCEMENT
  // =========================================================================
  describe('3. Registration Edge Cases & Role Enforcement', () => {
    it('rejects duplicate email registrations case-insensitively', async () => {
      const variations = [
        'customer@excellencefurnishing.com',
        'CUSTOMER@EXCELLENCEFURNISHING.COM',
        'Customer@ExcellenceFurnishing.Com',
        '  customer@excellencefurnishing.com  ',
      ];

      for (const email of variations) {
        await expect(
          registerWithEmail('Attempt Duplicate', email, 'Password@123')
        ).rejects.toThrow(/already exists/i);
      }
    });

    it('strictly enforces default role "user" during registration', async () => {
      const newUser = await registerWithEmail(
        'Ananya Birla',
        'ananya.birla@example.com',
        'BespokePass@123',
        '+91 98200 44444'
      );

      expect(newUser.role).toBe('user');

      // Verify in data layer profile
      const profile = await fetchUserProfile(newUser.uid);
      expect(profile).not.toBeNull();
      expect(profile?.role).toBe('user');
    });

    it('rejects short passwords (< 6 characters) at service layer', async () => {
      const shortPasswords = ['', '1', '12', '123', '1234', '12345'];
      for (const pass of shortPasswords) {
        await expect(
          registerWithEmail('Valid Name', 'unique.user@example.com', pass)
        ).rejects.toThrow(/at least 6 characters/i);
      }
    });

    it('rejects invalid names (< 2 characters or blank) at service layer', async () => {
      const invalidNames = ['', ' ', '   ', 'A'];
      for (const name of invalidNames) {
        await expect(
          registerWithEmail(name, 'unique.user@example.com', 'ValidPass@123')
        ).rejects.toThrow(/at least 2 characters/i);
      }
    });

    it('rejects basic invalid emails missing "@" at service layer', async () => {
      const invalidEmails = ['', 'no-at-sign', 'plainaddress', '   '];
      for (const email of invalidEmails) {
        await expect(
          registerWithEmail('Valid Name', email, 'ValidPass@123')
        ).rejects.toThrow(/valid email/i);
      }
    });

    it('documents service layer gap: emails with "@" but missing domain or user bypass basic check', async () => {
      // In src/lib/firebase/auth.ts:
      // if (!normalizedEmail || !normalizedEmail.includes('@'))
      // This allows 'user@' or '@domain.com' at service level, whereas registerSchema correctly blocks them
      const weakEmail = 'user-incomplete@';
      const user = await registerWithEmail('Service User', weakEmail, 'ValidPass@123');
      expect(user).toBeDefined();
      expect(user.email).toBe(weakEmail);

      // Verify that the UI schema (registerSchema) catches these:
      const schemaCheck = registerSchema.safeParse({
        name: 'Service User',
        email: weakEmail,
        phone: '9820012345',
        password: 'ValidPass@123',
        confirmPassword: 'ValidPass@123',
        street: '123 Street',
        city: 'Mumbai',
        pincode: '400058',
      });
      expect(schemaCheck.success).toBe(false);
    });

    it('validates phone numbers strictly against registration Zod schema', () => {
      const invalidPhones = [
        '123', // too short (< 10)
        'abcdefghij', // alphabetic
        '98200abcde', // mixed
        '12345678901234567', // too long (> 15)
        '', // empty
      ];

      for (const phone of invalidPhones) {
        const result = registerSchema.safeParse({
          name: 'Sunita Mehta',
          email: 'sunita@example.com',
          phone,
          password: 'Password@123',
          confirmPassword: 'Password@123',
          street: '123 Marine Drive',
          city: 'Mumbai',
          pincode: '400020',
        });

        expect(result.success, `Phone "${phone}" should fail validation`).toBe(false);
      }

      const validPhones = [
        '9820012345',
        '+91 98200 12345',
        '+91-9820012345',
        '022 2620 1234',
      ];

      for (const phone of validPhones) {
        const result = registerSchema.safeParse({
          name: 'Sunita Mehta',
          email: 'sunita@example.com',
          phone,
          password: 'Password@123',
          confirmPassword: 'Password@123',
          street: '123 Marine Drive',
          city: 'Mumbai',
          pincode: '400020',
        });

        expect(result.success, `Phone "${phone}" should pass validation`).toBe(true);
      }
    });

    it('validates 6-digit Indian PIN codes strictly in registration schema', () => {
      const invalidPincodes = ['012345', '40005', '4000589', '40005a', 'Mumbai'];
      for (const pincode of invalidPincodes) {
        const result = registerSchema.safeParse({
          name: 'Sunita Mehta',
          email: 'sunita@example.com',
          phone: '9820012345',
          password: 'Password@123',
          confirmPassword: 'Password@123',
          street: '123 Marine Drive',
          city: 'Mumbai',
          pincode,
        });

        expect(result.success, `PIN "${pincode}" should fail validation`).toBe(false);
      }

      const validPincode = '400058';
      const result = registerSchema.safeParse({
        name: 'Sunita Mehta',
        email: 'sunita@example.com',
        phone: '9820012345',
        password: 'Password@123',
        confirmPassword: 'Password@123',
        street: '123 Marine Drive',
        city: 'Mumbai',
        pincode: validPincode,
      });
      expect(result.success).toBe(true);
    });
  });

  // =========================================================================
  // 4. PORTAL MILESTONE STEPPER & STATUS MAPPING
  // =========================================================================
  describe('4. Portal Milestone Stepper & Status Mapping', () => {
    it('verifies all 5 status stages in MILESTONE_STAGES', () => {
      expect(MILESTONE_STAGES).toHaveLength(5);
      const stageLabels = MILESTONE_STAGES.map((s) => s.label);
      expect(stageLabels).toEqual([
        'Order Confirmed',
        'Fabric Procured',
        'Custom Stitching',
        'Out for Delivery',
        'Delivered & Installed',
      ]);
    });

    it('verifies status mapping across all defined OrderStatus values', () => {
      expect(getMilestoneStep('draft')).toBe(0);
      expect(getMilestoneStep('confirmed')).toBe(1);
      expect(getMilestoneStep('in_production')).toBe(3);
      expect(getMilestoneStep('ready')).toBe(4);
      expect(getMilestoneStep('delivered')).toBe(5);
      expect(getMilestoneStep('cancelled')).toBe(0);
    });

    it('documents gap: step 2 (Fabric Procured) has no direct OrderStatus mapping', () => {
      // OrderStatus union in types/order.ts:
      // 'draft' | 'confirmed' | 'in_production' | 'ready' | 'delivered' | 'cancelled'
      // Notice: 'fabric_procured' is NOT part of OrderStatus union!
      // When getMilestoneStep receives any non-matching string, it defaults to 1:
      const fabricProcuredStep = getMilestoneStep('fabric_procured' as OrderStatus);
      expect(fabricProcuredStep).toBe(1); // falls through to default: 1

      // This confirms empirically that step 2 is an intermediate visual step that becomes
      // marked as "completed" when the order transitions to 'in_production' (step 3),
      // but never serves as an active step state via getMilestoneStep.
    });

    it('computes correct step state flags (completed, current, pending) for each step index', () => {
      const getStepStates = (currentStep: number) => {
        return MILESTONE_STAGES.map((stage) => ({
          id: stage.id,
          label: stage.label,
          isCompleted: stage.id < currentStep || (stage.id === 5 && currentStep === 5),
          isCurrent: stage.id === currentStep && currentStep < 5,
          isPending: stage.id > currentStep,
        }));
      };

      // 1. Confirmed (step 1): step 1 current, 2..5 pending
      const confirmed = getStepStates(1);
      expect(confirmed[0].isCurrent).toBe(true);
      expect(confirmed[0].isCompleted).toBe(false);
      expect(confirmed[1].isPending).toBe(true);
      expect(confirmed[4].isPending).toBe(true);

      // 2. In Production (step 3): steps 1 & 2 completed, step 3 current, 4 & 5 pending
      const inProd = getStepStates(3);
      expect(inProd[0].isCompleted).toBe(true);
      expect(inProd[1].isCompleted).toBe(true); // Fabric Procured marked completed!
      expect(inProd[2].isCurrent).toBe(true);
      expect(inProd[3].isPending).toBe(true);
      expect(inProd[4].isPending).toBe(true);

      // 3. Ready / Out for Delivery (step 4): steps 1..3 completed, step 4 current, 5 pending
      const ready = getStepStates(4);
      expect(ready[0].isCompleted).toBe(true);
      expect(ready[1].isCompleted).toBe(true);
      expect(ready[2].isCompleted).toBe(true);
      expect(ready[3].isCurrent).toBe(true);
      expect(ready[4].isPending).toBe(true);

      // 4. Delivered (step 5): all 5 steps completed, none pending, none current (< 5)
      const delivered = getStepStates(5);
      for (let i = 0; i < 5; i++) {
        expect(delivered[i].isCompleted).toBe(true);
        expect(delivered[i].isPending).toBe(false);
        expect(delivered[i].isCurrent).toBe(false);
      }

      // 5. Draft / Cancelled (step 0): none completed, none current, all 5 pending
      const draft = getStepStates(0);
      for (let i = 0; i < 5; i++) {
        expect(draft[i].isCompleted).toBe(false);
        expect(draft[i].isCurrent).toBe(false);
        expect(draft[i].isPending).toBe(true);
      }
    });

    it('handles unexpected or malicious status values safely', () => {
      const malicious = ['<script>', 'admin', 'DROP TABLE', '', 'null', 'undefined'];
      for (const val of malicious) {
        const step = getMilestoneStep(val as OrderStatus);
        expect(step).toBe(1); // Safely defaults to step 1 without throwing or returning NaN
      }
    });
  });

  // =========================================================================
  // 5. PROFILE UPDATE MUTATIONS & DATA LAYER INTEGRITY
  // =========================================================================
  describe('5. Profile Update Mutations & Data Layer Integrity', () => {
    it('reflects profile modifications simultaneously in data layer and auth store', async () => {
      await useAuthStore.getState().login('customer@excellencefurnishing.com', 'Customer@123');

      const initialProfile = useAuthStore.getState().profile;
      expect(initialProfile?.displayName).toBe('Priya Sharma');

      const updated = await useAuthStore.getState().updateProfileData({
        displayName: 'Priya Alok Sharma',
        phoneNumber: '+91 98201 11222',
      });

      expect(updated?.displayName).toBe('Priya Alok Sharma');
      expect(updated?.phoneNumber).toBe('+91 98201 11222');

      // Verify Auth Store has latest values
      const currentStore = useAuthStore.getState();
      expect(currentStore.user?.displayName).toBe('Priya Alok Sharma');
      expect(currentStore.profile?.displayName).toBe('Priya Alok Sharma');
      expect(currentStore.profile?.phoneNumber).toBe('+91 98201 11222');

      // Verify Data Layer persistence
      const persisted = await fetchUserProfile('customer-priya');
      expect(persisted?.displayName).toBe('Priya Alok Sharma');
      expect(persisted?.phoneNumber).toBe('+91 98201 11222');
    });

    it('prevents privilege escalation: updates to role via updateProfileData do not elevate AuthUser.role', async () => {
      const store = useAuthStore.getState();
      await store.login('customer@excellencefurnishing.com', 'Customer@123');
      expect(useAuthStore.getState().user?.role).toBe('user');

      // Attempt privilege escalation by injecting role: 'admin' into profile updates
      await store.updateProfileData({
        role: 'admin' as any,
      });

      // Verify AuthUser in store did NOT get elevated to 'admin'
      const storeState = useAuthStore.getState();
      expect(storeState.user?.role).toBe('user');
    });

    it('tests behavior when updating profile with undefined fields', async () => {
      const store = useAuthStore.getState();
      await store.login('customer@excellencefurnishing.com', 'Customer@123');

      // Perform an update that includes an explicit undefined property
      const updated = await modifyUserProfile('customer-priya', {
        displayName: 'Priya Sharma Tested',
        // @ts-expect-error Testing undefined field behavior
        nonExistentField: undefined,
      });

      expect(updated).not.toBeNull();
      expect(updated?.displayName).toBe('Priya Sharma Tested');
      // In JS object spreading, nonExistentField: undefined might be present as a key with value undefined
      // Check whether data layer functions properly
      const reFetched = await fetchUserProfile('customer-priya');
      expect(reFetched?.displayName).toBe('Priya Sharma Tested');
    });

    it('preserves address details across multiple profile mutations', async () => {
      await useAuthStore.getState().login('customer@excellencefurnishing.com', 'Customer@123');

      const originalAddress = useAuthStore.getState().profile?.address;
      expect(originalAddress).toBeDefined();

      // Update only displayName, do not pass address
      await useAuthStore.getState().updateProfileData({
        displayName: 'Priya S.',
      });

      const profileAfter = (await fetchUserProfile('customer-priya'))!;
      expect(profileAfter.displayName).toBe('Priya S.');
      expect(profileAfter.address).toEqual(originalAddress);

      // Now update only street
      await useAuthStore.getState().updateProfileData({
        address: {
          ...profileAfter.address!,
          street: 'New Luxury Tower 101, Juhu',
        },
      });

      const profileAfterStreet = (await fetchUserProfile('customer-priya'))!;
      expect(profileAfterStreet.address?.street).toBe('New Luxury Tower 101, Juhu');
      expect(profileAfterStreet.address?.city).toBe('Mumbai');
      expect(profileAfterStreet.address?.pincode).toBe(originalAddress?.pincode);
    });

    it('throws when updateProfileData is called while unauthenticated', async () => {
      const store = useAuthStore.getState();
      expect(store.user).toBeNull();

      await expect(
        store.updateProfileData({ displayName: 'Ghost User' })
      ).rejects.toThrow(/No authenticated user/i);
    });
  });
});

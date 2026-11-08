import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  User as FirebaseUser,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth, hasClientCredentials } from './config';
import { adminAuth, hasAdminCredentials } from './admin';
import { fetchUserProfile, fetchUserProfileByEmail, saveUserProfile, modifyUserProfile } from './firestore';
import { AuthUser, UserProfile, UserRole } from '@/types/user';
import { Address } from '@/types/common';

/**
 * In-memory credential registry for mock authentication fallback.
 * Maps lowercase email -> { password, uid }
 */
const mockCredentials = new Map<string, { password: string; uid: string }>([
  ['admin@excellencefurnishing.com', { password: 'Admin@123', uid: 'admin-altab' }],
  ['customer@excellencefurnishing.com', { password: 'Customer@123', uid: 'customer-priya' }],
]);

// Current in-memory session for mock mode
let currentMockUser: AuthUser | null = null;

/**
 * Maps a UserProfile to an AuthUser.
 */
export function profileToAuthUser(profile: UserProfile): AuthUser {
  return {
    uid: profile.uid,
    email: profile.email,
    displayName: profile.displayName,
    role: profile.role,
  };
}

/**
 * Sign in using email and password.
 * Dual-mode: Authenticates against live Firebase Auth if configured,
 * or against seeded/registered mock credentials with genuine validation.
 */
export async function signInWithEmail(email: string, password: string): Promise<AuthUser> {
  const normalizedEmail = email.toLowerCase().trim();

  // 1. Live Firebase Auth path
  if (hasClientCredentials && auth) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, normalizedEmail, password);
      const tokenResult = await userCredential.user.getIdTokenResult();
      const roleFromClaim = (tokenResult.claims.role as UserRole) || 'user';

      const existingProfile = await fetchUserProfile(userCredential.user.uid);
      const authUser: AuthUser = {
        uid: userCredential.user.uid,
        email: userCredential.user.email || normalizedEmail,
        displayName: userCredential.user.displayName || existingProfile?.displayName || normalizedEmail.split('@')[0],
        role: existingProfile?.role || roleFromClaim,
      };
      currentMockUser = authUser;
      return authUser;
    } catch (err: unknown) {
      const firebaseError = err as { code?: string; message?: string };
      // If error is genuine auth error (wrong password, user not found), rethrow
      if (firebaseError.code && firebaseError.code !== 'auth/network-request-failed') {
        throw new Error(firebaseError.message || 'Authentication failed');
      }
      console.warn('Firebase signIn fallback to mock authentication:', err);
    }
  }

  // 2. Mock Auth Fallback Path
  const creds = mockCredentials.get(normalizedEmail);
  if (!creds) {
    throw new Error('User not found. Please check your email or register for a new account.');
  }

  if (creds.password !== password) {
    throw new Error('Invalid password. Please check your credentials.');
  }

  const profile = await fetchUserProfile(creds.uid);
  if (!profile) {
    throw new Error('User profile record not found.');
  }

  const authUser = profileToAuthUser(profile);
  currentMockUser = authUser;
  return authUser;
}

/**
 * Register a new user with email and password.
 * Default role is strictly 'user'.
 */
export async function registerWithEmail(
  name: string,
  email: string,
  password: string,
  phone?: string,
  address?: Address
): Promise<AuthUser> {
  const normalizedEmail = email.toLowerCase().trim();
  const trimmedName = name.trim();

  if (!trimmedName || trimmedName.length < 2) {
    throw new Error('Full name must be at least 2 characters.');
  }

  if (!normalizedEmail || !normalizedEmail.includes('@')) {
    throw new Error('Please provide a valid email address.');
  }

  if (!password || password.length < 6) {
    throw new Error('Password must be at least 6 characters.');
  }

  // 1. Live Firebase Auth path
  if (hasClientCredentials && auth) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
      await updateProfile(userCredential.user, { displayName: trimmedName });

      const newProfile: UserProfile = {
        uid: userCredential.user.uid,
        email: normalizedEmail,
        displayName: trimmedName,
        phoneNumber: phone,
        role: 'user', // strictly default to 'user'
        address,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await saveUserProfile(newProfile);

      const authUser: AuthUser = {
        uid: newProfile.uid,
        email: newProfile.email,
        displayName: newProfile.displayName,
        role: 'user',
      };
      currentMockUser = authUser;
      return authUser;
    } catch (err: unknown) {
      const firebaseError = err as { code?: string; message?: string };
      if (firebaseError.code && firebaseError.code !== 'auth/network-request-failed') {
        throw new Error(firebaseError.message || 'Registration failed');
      }
      console.warn('Firebase registration fallback to mock:', err);
    }
  }

  // 2. Mock Auth Fallback Path
  if (mockCredentials.has(normalizedEmail)) {
    throw new Error('An account with this email already exists. Please sign in instead.');
  }

  const newUid = `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  const newProfile: UserProfile = {
    uid: newUid,
    email: normalizedEmail,
    displayName: trimmedName,
    phoneNumber: phone,
    role: 'user', // Default role
    address: address || {
      street: '',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400058',
      country: 'India',
    },
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await saveUserProfile(newProfile);
  mockCredentials.set(normalizedEmail, { password, uid: newUid });

  const authUser = profileToAuthUser(newProfile);
  currentMockUser = authUser;
  return authUser;
}

/**
 * Sign out the currently authenticated user.
 */
export async function signOutUser(): Promise<void> {
  if (hasClientCredentials && auth) {
    try {
      await signOut(auth);
    } catch (err) {
      console.warn('Firebase signOut fallback:', err);
    }
  }
  currentMockUser = null;
}

/**
 * Retrieve the current authenticated user.
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  if (hasClientCredentials && auth && auth.currentUser) {
    const fbUser = auth.currentUser;
    const tokenResult = await fbUser.getIdTokenResult();
    const roleFromClaim = (tokenResult.claims.role as UserRole) || 'user';
    const profile = await fetchUserProfile(fbUser.uid);
    return {
      uid: fbUser.uid,
      email: fbUser.email || '',
      displayName: fbUser.displayName || profile?.displayName || '',
      role: profile?.role || roleFromClaim,
    };
  }
  return currentMockUser;
}

/**
 * Get user role by UID.
 */
export async function getUserRole(uid: string): Promise<UserRole> {
  if (hasAdminCredentials && adminAuth) {
    try {
      const user = await adminAuth.getUser(uid);
      if (user.customClaims?.role) {
        return user.customClaims.role as UserRole;
      }
    } catch (err) {
      console.warn('AdminAuth getUserRole fallback to firestore profile:', err);
    }
  }
  const profile = await fetchUserProfile(uid);
  return profile?.role || 'user';
}

/**
 * Set user role (Admin action).
 */
export async function setUserRole(uid: string, role: UserRole): Promise<void> {
  if (hasAdminCredentials && adminAuth) {
    try {
      await adminAuth.setCustomUserClaims(uid, { role, admin: role === 'admin' });
    } catch (err) {
      console.warn('AdminAuth setCustomUserClaims fallback to firestore profile:', err);
    }
  }
  await modifyUserProfile(uid, { role });
  if (currentMockUser && currentMockUser.uid === uid) {
    currentMockUser = { ...currentMockUser, role };
  }
}

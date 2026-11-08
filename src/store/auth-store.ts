import { create } from 'zustand';
import { AuthUser, UserProfile, UserRole } from '@/types/user';
import { Address } from '@/types/common';
import {
  signInWithEmail,
  registerWithEmail,
  signOutUser,
  getCurrentUser,
} from '@/lib/firebase/auth';
import { fetchUserProfile, modifyUserProfile } from '@/lib/firebase/firestore';

export interface AuthState {
  user: AuthUser | null;
  profile: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (
    name: string,
    email: string,
    password: string,
    phone?: string,
    address?: Address
  ) => Promise<AuthUser>;
  logout: () => Promise<void>;
  initializeAuth: () => Promise<void>;
  updateProfileData: (updates: Partial<UserProfile>) => Promise<UserProfile | null>;
  clearError: () => void;
  setUser: (user: AuthUser | null, profile?: UserProfile | null) => void;
}

/**
 * Cookie management helpers for Next.js Edge Middleware synchronization.
 * Sets both standard and project-specific cookies for maximum compatibility.
 */
function setAuthCookies(user: AuthUser): void {
  if (typeof document === 'undefined') return;

  const maxAge = 7 * 24 * 60 * 60; // 7 days in seconds
  const sessionVal = encodeURIComponent(`session_${user.uid}`);
  const roleVal = encodeURIComponent(user.role);

  // Set standard session cookies
  document.cookie = `session=${sessionVal}; path=/; max-age=${maxAge}; SameSite=Lax`;
  document.cookie = `user_role=${roleVal}; path=/; max-age=${maxAge}; SameSite=Lax`;

  // Set ef_ prefixed cookies
  document.cookie = `ef_session=${sessionVal}; path=/; max-age=${maxAge}; SameSite=Lax`;
  document.cookie = `ef_role=${roleVal}; path=/; max-age=${maxAge}; SameSite=Lax`;
  document.cookie = `ef_uid=${encodeURIComponent(user.uid)}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

function clearAuthCookies(): void {
  if (typeof document === 'undefined') return;

  const expired = 'path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
  document.cookie = `session=; ${expired}`;
  document.cookie = `user_role=; ${expired}`;
  document.cookie = `ef_session=; ${expired}`;
  document.cookie = `ef_role=; ${expired}`;
  document.cookie = `ef_uid=; ${expired}`;
}

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
  return match ? decodeURIComponent(match[3]) : null;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  setUser: (user, profile = null) => {
    set({
      user,
      profile: profile || (user ? get().profile : null),
      isAuthenticated: Boolean(user),
      isLoading: false,
      error: null,
    });
    if (user) {
      setAuthCookies(user);
    } else {
      clearAuthCookies();
    }
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const authUser = await signInWithEmail(email, password);
      const profile = await fetchUserProfile(authUser.uid);

      setAuthCookies(authUser);

      set({
        user: authUser,
        profile: profile || null,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      return authUser;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed. Please try again.';
      set({ error: message, isLoading: false, isAuthenticated: false });
      throw err;
    }
  },

  register: async (name, email, password, phone, address) => {
    set({ isLoading: true, error: null });
    try {
      const authUser = await registerWithEmail(name, email, password, phone, address);
      const profile = await fetchUserProfile(authUser.uid);

      setAuthCookies(authUser);

      set({
        user: authUser,
        profile: profile || null,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      return authUser;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration failed. Please try again.';
      set({ error: message, isLoading: false, isAuthenticated: false });
      throw err;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await signOutUser();
    } catch (err) {
      console.warn('Sign out warning:', err);
    } finally {
      clearAuthCookies();
      set({
        user: null,
        profile: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  },

  initializeAuth: async () => {
    set({ isLoading: true, error: null });
    try {
      // 1. Try Firebase / Mock currentUser
      const currentUser = await getCurrentUser();
      if (currentUser) {
        const profile = await fetchUserProfile(currentUser.uid);
        setAuthCookies(currentUser);
        set({
          user: currentUser,
          profile: profile || null,
          isAuthenticated: true,
          isLoading: false,
        });
        return;
      }

      // 2. Try cookie hydration in browser
      const cookieUid = getCookie('ef_uid');
      const cookieRole = (getCookie('user_role') || getCookie('ef_role')) as UserRole | null;

      if (cookieUid && cookieRole) {
        const profile = await fetchUserProfile(cookieUid);
        if (profile) {
          const authUser: AuthUser = {
            uid: profile.uid,
            email: profile.email,
            displayName: profile.displayName,
            role: profile.role,
          };
          setAuthCookies(authUser);
          set({
            user: authUser,
            profile,
            isAuthenticated: true,
            isLoading: false,
          });
          return;
        }
      }

      // No session
      set({
        user: null,
        profile: null,
        isAuthenticated: false,
        isLoading: false,
      });
    } catch (err) {
      console.warn('initializeAuth error:', err);
      set({
        user: null,
        profile: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  updateProfileData: async (updates: Partial<UserProfile>) => {
    const currentUser = get().user;
    if (!currentUser) {
      throw new Error('No authenticated user to update.');
    }

    const updatedProfile = await modifyUserProfile(currentUser.uid, updates);
    if (updatedProfile) {
      const updatedUser: AuthUser = {
        ...currentUser,
        displayName: updatedProfile.displayName || currentUser.displayName,
      };
      set({
        profile: updatedProfile,
        user: updatedUser,
      });
    }
    return updatedProfile;
  },

  clearError: () => set({ error: null }),
}));

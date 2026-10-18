import { create } from 'zustand';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { UserProfile } from '../types/user';
import { authService, LoginCredentials, RegisterData } from '../services/auth';
import { api } from '../services/api';

const TOKEN_KEY = 'cardioguard_auth_token';
const USER_KEY = 'cardioguard_user_profile';
const REFRESH_TOKEN_KEY = 'cardioguard_refresh_token';

// Platform safe storage helper
const storage = {
  async getItem(key: string): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.localStorage) {
          return window.localStorage.getItem(key);
        }
        return null;
      }
      return await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(key, value);
        }
        return;
      }
      await SecureStore.setItemAsync(key, value);
    } catch (err) {
      console.warn('SecureStore setItem failed:', err);
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.removeItem(key);
        }
        return;
      }
      await SecureStore.deleteItemAsync(key);
    } catch (err) {
      console.warn('SecureStore deleteItem failed:', err);
    }
  },
};

interface AuthState {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  initialize: () => Promise<void>;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (profile: Partial<UserProfile>) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  initialize: async () => {
    try {
      set({ isLoading: true });
      const savedToken = await storage.getItem(TOKEN_KEY);
      const savedUserStr = await storage.getItem(USER_KEY);
      const savedRefreshToken = await storage.getItem(REFRESH_TOKEN_KEY);

      if (savedToken) {
        api.setToken(savedToken);
        const user = await authService.getProfile();
        set({
          token: savedToken,
          user,
          isAuthenticated: true,
          isLoading: false,
        });
        if (savedRefreshToken) await storage.setItem(REFRESH_TOKEN_KEY, savedRefreshToken);
      } else {
        set({
          token: null,
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    } catch {
      set({
        token: null,
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  login: async (credentials: LoginCredentials) => {
    try {
      set({ isLoading: true, error: null });
      const { user, tokens } = await authService.login(credentials);
      await storage.setItem(TOKEN_KEY, tokens.accessToken);
      if (tokens.refreshToken) await storage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
      await storage.setItem(USER_KEY, JSON.stringify(user));

      set({
        user,
        token: tokens.accessToken,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed';
      set({ error: msg, isLoading: false });
      throw err;
    }
  },

  register: async (data: RegisterData) => {
    try {
      set({ isLoading: true, error: null });
      const { user, tokens } = await authService.register(data);
      await storage.setItem(TOKEN_KEY, tokens.accessToken);
      if (tokens.refreshToken) await storage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
      await storage.setItem(USER_KEY, JSON.stringify(user));

      set({
        user,
        token: tokens.accessToken,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed';
      set({ error: msg, isLoading: false });
      throw err;
    }
  },

  logout: async () => {
    try {
      set({ isLoading: true });
      await authService.logout(await storage.getItem(REFRESH_TOKEN_KEY) || undefined);
    } catch {
      // Continue cleanup
    } finally {
      await storage.removeItem(TOKEN_KEY);
      await storage.removeItem(USER_KEY);
      await storage.removeItem(REFRESH_TOKEN_KEY);
      api.setToken(null);
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  },

  updateUser: (updatedFields: Partial<UserProfile>) => {
    const currentUser = get().user;
    if (currentUser) {
      const updatedUser = { ...currentUser, ...updatedFields };
      set({ user: updatedUser });
      storage.setItem(USER_KEY, JSON.stringify(updatedUser)).catch(console.warn);
    }
  },

  clearError: () => set({ error: null }),
}));

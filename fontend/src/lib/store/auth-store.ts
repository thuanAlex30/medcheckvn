import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi, ApiError } from '@/lib/api-client';
import type { User } from '@medcheck/shared-types';

interface AuthState {
  accessToken: string | null;
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  setToken: (token: string, user: User) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      user: null,
      isLoading: false,
      error: null,

      setToken: (accessToken, user) => set({ accessToken, user, error: null }),

      clearError: () => set({ error: null }),

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const res = await authApi.login({ email, password });
          set({ accessToken: res.accessToken, user: res.user, isLoading: false });
        } catch (err) {
          const msg = err instanceof ApiError ? err.message : 'Đăng nhập thất bại';
          set({ error: msg, isLoading: false });
          throw err;
        }
      },

      register: async (email, password, name) => {
        set({ isLoading: true, error: null });
        try {
          const res = await authApi.register({ email, password, name });
          set({ accessToken: res.accessToken, user: res.user, isLoading: false });
        } catch (err) {
          const msg = err instanceof ApiError ? err.message : 'Đăng ký thất bại';
          set({ error: msg, isLoading: false });
          throw err;
        }
      },

      logout: async () => {
        try {
          await authApi.logout();
        } catch {
          // ignore logout errors
        } finally {
          set({ accessToken: null, user: null, error: null });
        }
      },

      refresh: async () => {
        // Cho phép bootstrap session khi user mở lại tab: cookie refreshToken tự gửi,
        // không cần accessToken hiện tại.
        try {
          const res = await authApi.refresh();
          set({ accessToken: res.accessToken });
        } catch {
          set({ accessToken: null, user: null });
        }
      },
    }),
    {
      name: 'medcheck-auth',
      partialize: (state) => ({ accessToken: state.accessToken, user: state.user }),
    },
  ),
);

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../services/api';
import { STORAGE_KEYS } from '../utils/constants';

// ──────────────────────────────────────────────
// Auth Store (Zustand + persist to AsyncStorage)
// ──────────────────────────────────────────────
const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isLoading: false,
      error: null,

      // ── Actions ──

      register: async (name, phone, password, email = null) => {
        set({ isLoading: true, error: null });
        try {
          const { data } = await authAPI.register({ name, phone, password, email });
          await _saveTokens(data.accessToken, data.refreshToken);
          set({ user: data.user, accessToken: data.accessToken, refreshToken: data.refreshToken, isLoading: false });
        } catch (err) {
          set({ error: err.response?.data?.message || 'Registration failed', isLoading: false });
          throw err;
        }
      },

      login: async (phone, password) => {
        set({ isLoading: true, error: null });
        try {
          const { data } = await authAPI.login({ phone, password });
          await _saveTokens(data.accessToken, data.refreshToken);
          set({ user: data.user, accessToken: data.accessToken, refreshToken: data.refreshToken, isLoading: false });
        } catch (err) {
          set({ error: err.response?.data?.message || 'Login failed', isLoading: false });
          throw err;
        }
      },

      logout: async () => {
        await AsyncStorage.multiRemove([
          STORAGE_KEYS.ACCESS_TOKEN,
          STORAGE_KEYS.REFRESH_TOKEN,
          STORAGE_KEYS.USER,
        ]);
        set({ user: null, accessToken: null, refreshToken: null });
      },

      clearError: () => set({ error: null }),

      isLoggedIn: () => !!get().accessToken && !!get().user,
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
    }
  )
);

// Helper: save tokens to AsyncStorage (for the interceptor)
const _saveTokens = async (accessToken, refreshToken) => {
  await AsyncStorage.multiSet([
    [STORAGE_KEYS.ACCESS_TOKEN, accessToken],
    [STORAGE_KEYS.REFRESH_TOKEN, refreshToken],
  ]);
};

export default useAuthStore;

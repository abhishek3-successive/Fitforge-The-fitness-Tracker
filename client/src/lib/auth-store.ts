import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, AuthTokens } from './types';

interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  setUser: (user: User) => void;
  setTokens: (tokens: AuthTokens) => void;
  login: (user: User, tokens: AuthTokens) => void;
  logout: () => void;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string) => void;
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      tokens: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Actions
      setUser: (user: User) => {
        set({ user, isAuthenticated: true });
      },

      setTokens: (tokens: AuthTokens) => {
        set({ tokens });
        // Store tokens in localStorage for axios interceptor
        if (typeof window !== 'undefined') {
          localStorage.setItem('accessToken', tokens.accessToken);
          localStorage.setItem('refreshToken', tokens.refreshToken);
        }
      },

      login: (user: User, tokens: AuthTokens) => {
        set({ 
          user, 
          tokens, 
          isAuthenticated: true, 
          error: null,
          isLoading: false 
        });
        
        // Store tokens in localStorage for axios interceptor
        if (typeof window !== 'undefined') {
          localStorage.setItem('accessToken', tokens.accessToken);
          localStorage.setItem('refreshToken', tokens.refreshToken);
        }
      },

      logout: () => {
        set({ 
          user: null, 
          tokens: null, 
          isAuthenticated: false, 
          error: null,
          isLoading: false 
        });
        
        // Clear tokens from localStorage
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        }
      },

      clearError: () => {
        set({ error: null });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      setError: (error: string) => {
        set({ error, isLoading: false });
      },
    }),
    {
      name: 'fitforge-auth',
      partialize: (state) => ({
        user: state.user,
        tokens: state.tokens,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

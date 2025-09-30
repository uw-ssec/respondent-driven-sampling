import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type AuthState = {
  token: string | null;
};

type AuthActions = {
  setToken: (token: string | null) => void;
  clearSession: () => void;
};

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set) => ({
      token: null,
      setToken: (token : string | null) => set({ token }),
      clearSession: () => {
        set({ token: null }); 
        useAuthStore.persist.clearStorage()
    }
    }),
    { name: 'auth-storage' }
  )
);
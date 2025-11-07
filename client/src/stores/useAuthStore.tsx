import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type AuthStore = {
	token: string;
	setToken: (token: string) => void;
	clearToken: () => void;
};

export const useAuthStore = create<AuthStore>()(
	persist(
		(set) => ({
			token: '',
			setToken: (token: string) => set({ token }),
			clearToken: () => set({ token: '' })
		}),
		{ name: 'auth-storage' }
	)
);

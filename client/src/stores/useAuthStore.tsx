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
		{
			name: 'auth-storage',
			storage: {
				getItem: (name) => {
					const value = sessionStorage.getItem(name);
					return value ? JSON.parse(value) : null;
				},
				setItem: (name, value) => {
					sessionStorage.setItem(name, JSON.stringify(value));
				},
				removeItem: (name) => {
					sessionStorage.removeItem(name);
				}
			}
		}
	)
);

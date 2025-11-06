import { Action, Condition, Subject } from '@/permissions/constants';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type AuthState = {
	token: string;
	firstName: string;
	userObjectId: string;
	userRole: string;
	lastestLocationObjectId: string;
	permissions: {
		action: Action;
		subject: Subject;
		conditions: Condition[];
	}[];
};

type AuthActions = {
	setToken: (token: string) => void;
	setUserObjectId: (userObjectId: string) => void;
	setFirstName: (firstName: string) => void;
	setUserRole: (userRole: string) => void;
	setLastestLocationObjectId: (lastestLocationObjectId: string) => void;
	setPermissions: (
		permissions: {
			action: Action;
			subject: Subject;
			conditions: Condition[];
		}[]
	) => void;
	clearSession: () => void;
};

export const useAuthStore = create<AuthState & AuthActions>()(
	persist(
		set => ({
			token: '',
			userObjectId: '',
			userRole: '',
			lastestLocationObjectId: '',
			permissions: [],
			firstName: '',
			setToken: (token: string) => set({ token }),
			setUserObjectId: (userObjectId: string) => set({ userObjectId }),
			setUserRole: (userRole: string) => set({ userRole }),
			setFirstName: (firstName: string) => set({ firstName }),
			setLastestLocationObjectId: (lastestLocationObjectId: string) =>
				set({ lastestLocationObjectId }),
			setPermissions: (
				permissions: {
					action: Action;
					subject: Subject;
					conditions: Condition[];
				}[]
			) => set({ permissions }),
			clearSession: () => {
				set({ token: '' });
				useAuthStore.persist.clearStorage();
			}
		}),
		{ name: 'auth-storage' }
	)
);

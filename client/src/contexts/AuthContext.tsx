import {
	createContext,
	ReactNode,
	useContext,
	useEffect,
	useState
} from 'react';

import { Action, Condition, Subject } from '@/permissions/constants';
import { useAuthStore } from '@/stores';
import {
	getAuthToken,
	getObjectId,
	hasAuthToken
} from '@/utils/authTokenHandler';

interface AuthState {
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
	isLoggedIn: boolean;
	isLoading: boolean;
}

interface AuthContextValue extends AuthState {
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
	fetchUserContext: (userObjectId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
	// Initialize from Zustand store (which is persisted to localStorage)
	const authStore = useAuthStore();

	const [state, setState] = useState<AuthState>({
		token: authStore.token,
		firstName: authStore.firstName,
		userObjectId: authStore.userObjectId,
		userRole: authStore.userRole,
		lastestLocationObjectId: authStore.lastestLocationObjectId,
		permissions: authStore.permissions,
		isLoggedIn: !!authStore.token,
		isLoading: true
	});

	// on mount, check if token exists and fetch user data
	useEffect(() => {
		const initAuth = async () => {
			if (hasAuthToken()) {
				const userObjectId = getObjectId();
				const token = getAuthToken();

				if (userObjectId && token) {
					setState(prev => ({
						...prev,
						token,
						userObjectId,
						isLoading: true,
						isLoggedIn: true
					}));
					await fetchUserContext(userObjectId);
				} else {
					setState(prev => ({ ...prev, isLoading: false }));
				}
			} else {
				setState(prev => ({ ...prev, isLoading: false }));
			}
		};

		initAuth();
	}, []);

	const fetchUserContext = async (userObjectId: string) => {
		try {
			const token = getAuthToken();

			// fetch user
			const userResponse = await fetch(`/api/v2/users/${userObjectId}`, {
				headers: {
					Authorization: `Bearer ${token}`
				}
			});
			const user = await userResponse.json();

			// fetch user's surveys to get latest location
			const surveysResponse = await fetch(
				`/api/v2/surveys?createdByUserObjectId=${userObjectId}`,
				{
					headers: {
						Authorization: `Bearer ${token}`
					}
				}
			);
			const surveys = await surveysResponse.json();
			const latestLocationObjectId =
				surveys.data[0]?.locationObjectId ?? user.data.locationObjectId;

			setState(prev => ({
				...prev,
				userObjectId: user.data._id,
				firstName: user.data.firstName,
				userRole: user.data.role,
				lastestLocationObjectId: latestLocationObjectId,
				permissions: user.data.permissions,
				isLoggedIn: true,
				isLoading: false
			}));
		} catch (error) {
			console.error('Error fetching user context:', error);
			setState(prev => ({ ...prev, isLoading: false }));
		}
	};

	const setToken = (token: string) => {
		useAuthStore.getState().setToken(token);
		setState(prev => ({ ...prev, token, isLoggedIn: !!token }));
	};

	const setUserObjectId = (userObjectId: string) => {
		useAuthStore.getState().setUserObjectId(userObjectId);
		setState(prev => ({ ...prev, userObjectId }));
	};

	const setFirstName = (firstName: string) => {
		useAuthStore.getState().setFirstName(firstName);
		setState(prev => ({ ...prev, firstName }));
	};

	const setUserRole = (userRole: string) => {
		useAuthStore.getState().setUserRole(userRole);
		setState(prev => ({ ...prev, userRole }));
	};

	const setLastestLocationObjectId = (lastestLocationObjectId: string) => {
		useAuthStore
			.getState()
			.setLastestLocationObjectId(lastestLocationObjectId);
		setState(prev => ({ ...prev, lastestLocationObjectId }));
	};

	const setPermissions = (permissions: AuthState['permissions']) => {
		useAuthStore.getState().setPermissions(permissions);
		setState(prev => ({ ...prev, permissions }));
	};

	const clearSession = () => {
		useAuthStore.getState().clearSession();
		setState({
			token: '',
			firstName: '',
			userObjectId: '',
			userRole: '',
			lastestLocationObjectId: '',
			permissions: [],
			isLoggedIn: false,
			isLoading: false
		});
	};

	const value: AuthContextValue = {
		...state,
		setToken,
		setUserObjectId,
		setFirstName,
		setUserRole,
		setLastestLocationObjectId,
		setPermissions,
		clearSession,
		fetchUserContext
	};

	return (
		<AuthContext.Provider value={value}>{children}</AuthContext.Provider>
	);
};

export const useAuthContext = () => {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error('useAuthContext must be used within AuthProvider');
	}
	return context;
};

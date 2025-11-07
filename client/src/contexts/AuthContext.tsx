import {
	createContext,
	ReactNode,
	useContext,
	useEffect,
	useState
} from 'react';

import { Action, Condition, Subject } from '@/permissions/constants';
import {
	getAuthToken,
	getDecodedAuthToken,
	deleteAuthToken
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

function getDefaultAuthState(): AuthState {
	return {
		token: '',
		firstName: '',
		userObjectId: '',
		userRole: '',
		lastestLocationObjectId: '',
		permissions: [],
		isLoggedIn: false,
		isLoading: false
	};
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
	const [state, setState] = useState<AuthState>(() => {
		const token = getAuthToken();  // Reads from Zustand
		if (!token) return getDefaultAuthState();

		const decoded = getDecodedAuthToken();
		if (!decoded) return getDefaultAuthState();

		return {
			token,
			firstName: decoded.firstName,
			userRole: decoded.role,
			userObjectId: decoded.userObjectId,
			permissions: [],
			lastestLocationObjectId: '',
			isLoggedIn: true,
			isLoading: true
		};
	});

	// Fetch additional data on mount
	useEffect(() => {
		if (state.token && state.userObjectId) {
			fetchUserContext(state.userObjectId);
		} else {
			setState(prev => ({ ...prev, isLoading: false }));
		}
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
		setState(prev => ({ ...prev, token, isLoggedIn: !!token }));
	};

	const setUserObjectId = (userObjectId: string) => {
		setState(prev => ({ ...prev, userObjectId }));
	};

	const setFirstName = (firstName: string) => {
		setState(prev => ({ ...prev, firstName }));
	};

	const setUserRole = (userRole: string) => {
		setState(prev => ({ ...prev, userRole }));
	};

	const setLastestLocationObjectId = (lastestLocationObjectId: string) => {
		setState(prev => ({ ...prev, lastestLocationObjectId }));
	};

	const setPermissions = (permissions: AuthState['permissions']) => {
		setState(prev => ({ ...prev, permissions }));
	};

	const clearSession = () => {
		deleteAuthToken();  // Clears from Zustand
		setState(getDefaultAuthState());
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

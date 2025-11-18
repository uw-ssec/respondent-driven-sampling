import {
	createContext,
	ReactNode,
	useContext,
	useEffect,
	useState
} from 'react';

import { Action, Condition, Subject } from '@/permissions/constants';
import {
	deleteAuthToken,
	getAuthToken,
	getDecodedAuthToken
} from '@/utils/authTokenHandler';

interface AuthState {
	token: string;
	firstName: string;
	lastName: string;
	userObjectId: string;
	userRole: string;
	email: string;
	phone: string;
	locationObjectId: string;
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
	setLastName: (lastName: string) => void;
	setUserRole: (userRole: string) => void;
	setEmail: (email: string) => void;
	setPhone: (phone: string) => void;
	setLocationObjectId: (locationObjectId: string) => void;
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
		lastName: '',
		userObjectId: '',
		userRole: '',
		email: '',
		phone: '',
		locationObjectId: '',
		lastestLocationObjectId: '',
		permissions: [],
		isLoggedIn: false,
		isLoading: false
	};
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
	const [state, setState] = useState<AuthState>(() => {
		const token = getAuthToken(); // Reads from Zustand
		if (!token) return getDefaultAuthState();

		const decoded = getDecodedAuthToken();
		if (!decoded) return getDefaultAuthState();

		return {
			token,
			firstName: '',
			lastName: '',
			email: '',
			phone: '',
			userRole: '',
			userObjectId: decoded.userObjectId,
			permissions: [],
			locationObjectId: '',
			lastestLocationObjectId: '',
			isLoggedIn: true,
			isLoading: true
		};
	});

	/*
	The `useEffect` hook runs once when the component mounts (indicated by the empty dependency array `[]`). This is the authentication context initialization logic that determines whether to load user data or immediately mark the auth state as ready.

	**The conditional logic branch works as follows**: If both `state.token` and `state.userObjectId` exist (meaning the user has a valid JWT token and MongoDB user ID stored in localStorage via Zustand), the effect calls `fetchUserContext()` to retrieve the full user profile from the backend. This happens when a user refreshes the page or returns to the app with an existing session. The function will make an API call to `/api/users/:id`, validate the token via the auth middleware, and populate the context with user details like name, role, and permissions.

	**If either value is missing**, the effect takes a different path: it immediately sets `isLoading: false` without making any API calls. This signals to the rest of the application that there's no active session to restore, allowing login/registration screens to render immediately instead of showing a loading spinner while waiting for a user fetch that would fail anyway.

	**A critical gotcha here**: The empty dependency array means this only runs on mount, so if `state.token` or `state.userObjectId` change later (e.g., after login), this effect won't re-run. The app must handle user data fetching separately in the login flow—typically in the login success handler that sets these values and then manually calls `fetchUserContext()` or triggers a re-render that causes the context to update through other means.

	This pattern is common in auth contexts because you want to check for existing sessions exactly once at startup, not repeatedly as state changes during normal app usage. The actual authentication state updates happen through explicit actions (login, logout) rather than reactive effects.
	*/
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
			const userResponse = await fetch(`/api/users/${userObjectId}`, {
				headers: {
					Authorization: `Bearer ${token}`
				}
			});
			const user = await userResponse.json();

			// fetch user's surveys to get latest location
			const surveysResponse = await fetch(
				`/api/surveys?createdByUserObjectId=${userObjectId}`,
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
				lastName: user.data.lastName,
				userRole: user.data.role,
				email: user.data.email,
				phone: user.data.phone,
				locationObjectId: user.data.locationObjectId,
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

	const setLastName = (lastName: string) => {
		setState(prev => ({ ...prev, lastName }));
	};

	const setUserRole = (userRole: string) => {
		setState(prev => ({ ...prev, userRole }));
	};

	const setEmail = (email: string) => {
		setState(prev => ({ ...prev, email }));
	};

	const setPhone = (phone: string) => {
		setState(prev => ({ ...prev, phone }));
	};

	const setLocationObjectId = (locationObjectId: string) => {
		setState(prev => ({ ...prev, locationObjectId }));
	};

	const setLastestLocationObjectId = (lastestLocationObjectId: string) => {
		setState(prev => ({ ...prev, lastestLocationObjectId }));
	};

	const setPermissions = (permissions: AuthState['permissions']) => {
		setState(prev => ({ ...prev, permissions }));
	};

	const clearSession = () => {
		deleteAuthToken(); // Clears from Zustand
		setState(getDefaultAuthState());
	};

	// The value that you want to pass to all the components reading this context inside this provider.
	const value: AuthContextValue = {
		...state,
		setToken,
		setUserObjectId,
		setFirstName,
		setLastName,
		setUserRole,
		setEmail,
		setPhone,
		setLocationObjectId,
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

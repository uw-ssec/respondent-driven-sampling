// client/src/hooks/useAuth.tsx
import { useAuthContext } from '@/contexts';
import { useSurveyStore } from '@/stores/useSurveyStore';
import {
	deleteAuthToken,
	getDecodedAuthToken,
	saveAuthToken
} from '@/utils/authTokenHandler';

export const useAuth = () => {
	const {
		isLoggedIn,
		isLoading,
		clearSession: clearAuthSession,
		fetchUserContext
	} = useAuthContext();
	const { clearSession: clearSurveySession } = useSurveyStore();

	const handleLogin = async (token: string) => {
		saveAuthToken(token);
		const userObjectId = getDecodedAuthToken()?.userObjectId;
		if (userObjectId) {
			await fetchUserContext(userObjectId);
		}
	};

	const handleLogout = () => {
		deleteAuthToken();
		clearAuthSession();
		clearSurveySession();
	};

	return { isLoggedIn, isLoading, handleLogin, handleLogout };
};

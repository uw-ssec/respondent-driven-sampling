import { useState } from 'react';

import { useAuthStore, useSurveyStore } from '@/stores';
import {
	getAuthToken,
	getObjectId,
	hasAuthToken,
	saveAuthToken
} from '@/utils/authTokenHandler';

export const useAuth = () => {
	const [isLoggedIn, setIsLoggedIn] = useState<boolean>(hasAuthToken());
	const {
		setUserObjectId,
		setUserRole,
		setFirstName,
		setLastestLocationObjectId,
		setPermissions
	} = useAuthStore();

	const fetchUserContext = async (userObjectId: string) => {
		try {
			const token = getAuthToken();

			// Fetch user
			const userResponse = await fetch(`/api/v2/users/${userObjectId}`, {
				headers: {
					Authorization: `Bearer ${token}`
				}
			});
			const user = await userResponse.json();

			// Fetch surveys to get latest location
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

			console.log('user', user);
			console.log('surveys', surveys);
			console.log('latestLocationObjectId', latestLocationObjectId);

			setUserObjectId(user.data._id);
			setFirstName(user.data.firstName);
			setUserRole(user.data.role);
			setLastestLocationObjectId(latestLocationObjectId);
			setPermissions(user.data.permissions);
		} catch (error) {
			console.error('Error fetching user context:', error);
		}
	};

	const handleLogin = async (token: string) => {
		saveAuthToken(token);
		const userObjectId = getObjectId();
		await fetchUserContext(userObjectId);
		setIsLoggedIn(true);
	};

	const handleLogout = () => {
		setIsLoggedIn(false);
		useAuthStore.getState().clearSession();
		useSurveyStore.getState().clearSession();
	};

	return { isLoggedIn, handleLogin, handleLogout };
};

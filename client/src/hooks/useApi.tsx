import { useCallback } from 'react';

import { useAuthContext } from '@/contexts';
import { getAuthToken } from '@/utils/authTokenHandler';
import { useNavigate } from 'react-router-dom';

export const useAuthErrorHandler = (onLogout: () => void) => {
	const navigate = useNavigate();

	return useCallback(
		(response: Response) => {
			if (response.status === 401) {
				onLogout();
				navigate('/login');
				return true;
			}
			if (response.status === 403) {
				alert("You don't have permission to perform this action.");
				return true;
			}
			//   else {
			//     alert("An error occurred. Please try again later.");
			//     return true;
			//   }
		},
		[onLogout, navigate]
	);
};

export const useApi = () => {
	const { onLogout } = useAuthContext();
	const handleAuthError = useAuthErrorHandler(onLogout);

	const fetchWithAuth = async (url: string, options?: RequestInit) => {
		try {
			const token = getAuthToken();
			const response = await fetch(url, {
				...options,
				headers: {
					...options?.headers,
					Authorization: `Bearer ${token}`
				}
			});

			if (handleAuthError(response)) return null;
			return response;
		} catch (error) {
			console.error('API request failed:', error);
			throw error;
		}
	};

	const fetchUser = async (userObjectId: string) => {
		const response = await fetchWithAuth(`api/v2/users/${userObjectId}`);
		return response?.json();
	};

	const fetchUsers = async () => {
		const response = await fetchWithAuth(`api/v2/users`);
		return response?.json();
	};

	const fetchLatestLocationObjectId = async (userObjectId: string) => {
		const surveys =
			await surveyService.fetchSurveysByCreatedByUserObjectId(
				userObjectId
			);
		return surveys.data[0]?.locationObjectId ?? null;
	};

	const approveUser = async (
		userObjectId: string,
		approvalStatus: string
	) => {
		const response = await fetchWithAuth(`api/v2/users/${userObjectId}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ approvalStatus })
		});
		return response?.json();
	};

	const userService = {
		fetchUser,
		fetchUsers,
		fetchLatestLocationObjectId,
		approveUser
	};

	const fetchSurveys = async () => {
		const response = await fetchWithAuth(`api/v2/surveys`);
		return response?.json();
	};

	const fetchSurveysByCreatedByUserObjectId = async (
		userObjectId: string
	) => {
		const response = await fetchWithAuth(
			`api/v2/surveys?createdByUserObjectId=${userObjectId}`
		);
		return response?.json();
	};

	const fetchSurveyByReferralCode = async (referralCode: string) => {
		const response = await fetchWithAuth(
			`api/v2/surveys?surveyCode=${referralCode}`
		);
		return response?.json();
	};

	const createSurvey = async (surveyData: object) => {
		const response = await fetchWithAuth(`api/v2/surveys`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(surveyData)
		});
		return response?.json();
	};

	const updateSurvey = async (surveyObjectId: string, surveyData: object) => {
		const response = await fetchWithAuth(
			`api/v2/surveys/${surveyObjectId}`,
			{
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(surveyData)
			}
		);
		return response?.json();
	};

	const fetchParentOfSurveyCode = async (surveyCode: string) => {
		const parentSurvey = await fetchWithAuth(
			`api/v2/surveys?childSurveyCodes=${surveyCode}`
		);
		return parentSurvey?.json();
	};

	const surveyService = {
		fetchSurveys,
		fetchSurveysByCreatedByUserObjectId,
		fetchSurveyByReferralCode,
		createSurvey,
		updateSurvey,
		fetchParentOfSurveyCode
	};

	const fetchLocations = async () => {
		const response = await fetchWithAuth(`api/v2/locations`);
		return response?.json();
	};

	const locationService = { fetchLocations };

	return {
		fetchWithAuth,
		userService,
		surveyService,
		locationService,
	};
};

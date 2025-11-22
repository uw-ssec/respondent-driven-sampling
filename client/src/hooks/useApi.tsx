import { useCallback } from 'react';

import { getAuthToken } from '@/utils/authTokenHandler';
import { useNavigate } from 'react-router-dom';
import useSWR, { mutate } from 'swr';

import { LocationDocument } from '@/types/Locations';
import { SurveyDocument } from '@/types/Survey';
import { UserDocument } from '@/types/User';

import { useAuth } from './useAuth';

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
		},
		[onLogout, navigate]
	);
};

export const useApi = () => {
	const { handleLogout } = useAuth();
	const handleAuthError = useAuthErrorHandler(handleLogout);

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

	const useUser = (userObjectId: string | undefined) => {
		if (!userObjectId) return null;
		return useSWR(userObjectId ? `/api/users/${userObjectId}` : null, () =>
			fetchUser(userObjectId)
		);
	};

	const useUsers = () => {
		return useSWR(`/api/users`, () => fetchUsers());
	};

	const fetchUser = async (userObjectId: string) => {
		const response = await fetchWithAuth(`/api/users/${userObjectId}`);
		return (await response?.json())?.data ?? null;
	};

	const fetchUsers = async () => {
		const response = await fetchWithAuth(`/api/users`);
		return (await response?.json())?.data ?? [];
	};

	const approveUser = async (
		userObjectId: string,
		approvalStatus: string,
		approvedByUserObjectId: string
	) => {
		const response = await fetchWithAuth(`/api/users/${userObjectId}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ approvalStatus, approvedByUserObjectId })
		});
		return response?.json();
	};

	const updateUser = async (userObjectId: string, userData: object) => {
		const response = await fetchWithAuth(`/api/users/${userObjectId}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(userData)
		});
		return response?.json();
	};

	const createUser = async (userData: object) => {
		const response = await fetchWithAuth(`/api/users`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(userData)
		});
		return response?.json();
	};

	const userService = {
		useUser,
		useUsers,
		updateUser,
		approveUser,
		createUser
	};

	const useSurveys = () => {
		return useSWR(`/api/surveys`, () => fetchSurveys());
	};

	const fetchSurvey = async (surveyObjectId: string) => {
		const response = await fetchWithAuth(`/api/surveys/${surveyObjectId}`);
		return (await response?.json())?.data ?? null;
	};

	const fetchSurveys = async () => {
		const response = await fetchWithAuth(`/api/surveys`);
		return (await response?.json())?.data ?? [];
	};

	const fetchSurveyBySurveyCode = async (surveyCode: string) => {
		const response = await fetchWithAuth(
			`/api/surveys?surveyCode=${surveyCode}`
		);
		return (await response?.json())?.data[0] ?? null;
	};

	const createSurvey = async (surveyData: object) => {
		const response = await fetchWithAuth(`/api/surveys`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(surveyData)
		});
		const result = await response?.json();

		// Invalidate surveys list cache
		mutate(`/api/surveys`);
		// Also invalidate the survey-by-code cache if this survey has a code
		if (result?.data?.surveyCode) {
			mutate(`/api/surveys?surveyCode=${result.data.surveyCode}`);
		}

		return result;
	};

	const updateSurvey = async (surveyObjectId: string, surveyData: object) => {
		const response = await fetchWithAuth(`/api/surveys/${surveyObjectId}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(surveyData)
		});
		const result = await response?.json();

		// Invalidate related caches to ensure fresh data on next fetch
		mutate(`/api/surveys/${surveyObjectId}`);
		// Also invalidate the survey-by-code cache if this survey has a code
		if (result?.data?.surveyCode) {
			mutate(`/api/surveys?surveyCode=${result.data.surveyCode}`);
		}

		return result;
	};

	const fetchParentOfSurveyCode = async (surveyCode: string) => {
		const parentSurvey = await fetchWithAuth(
			`/api/surveys?childSurveyCodes=${surveyCode}`
		);
		return (await parentSurvey?.json())?.data[0] ?? null;
	};

	const useSurvey = (surveyObjectId: string) => {
		return useSWR(
			surveyObjectId ? `/api/surveys/${surveyObjectId}` : null,
			() => fetchSurvey(surveyObjectId)
		);
	};

	const useSurveysWithUsersAndLocations = () => {
		const {
			data: surveys,
			isLoading: surveysLoading,
			mutate: mutateSurveys
		} = useSurveys() ?? {};
		const { data: users, isLoading: usersLoading } = useUsers() ?? {};
		const { data: locations, isLoading: locationsLoading } =
			useLocations() ?? {};

		// Create user lookup map
		const userMap: Map<string, UserDocument> = new Map(
			users?.map((user: UserDocument) => [user._id, user]) ?? []
		);

		// Create location lookup map
		const locationMap: Map<string, LocationDocument> = new Map(
			locations?.map((location: LocationDocument) => [
				location._id,
				location.hubName
			]) ?? []
		);

		// Enrich surveys with user data
		const enrichedSurveys =
			surveys?.map((survey: SurveyDocument) => {
				const user = userMap.get(
					survey.createdByUserObjectId as string
				);
				return {
					...survey,
					employeeName: user
						? `${user.firstName ?? ''} ${user.lastName ?? ''}`
						: 'Unknown',
					employeeId: survey.createdByUserObjectId,
					locationName:
						locationMap.get(survey.locationObjectId as string) ??
						'Unknown'
				};
			}) ?? [];

		return {
			data: enrichedSurveys,
			isLoading: surveysLoading || usersLoading || locationsLoading,
			mutate: mutateSurveys
		};
	};

	const useSurveyWithUser = (surveyObjectId: string) => {
		return useSWR(
			surveyObjectId ? `/api/surveys/${surveyObjectId}` : null,
			() => fetchSurveyWithUser(surveyObjectId)
		);
	};

	const fetchSurveyWithUser = async (surveyObjectId: string) => {
		const surveyResponse = await fetchWithAuth(
			`/api/surveys/${surveyObjectId}`
		);
		if (surveyResponse?.ok) {
			const surveyJson = await surveyResponse.json();
			const survey = surveyJson?.data ?? null;
			const userResponse = await fetchWithAuth(
				`/api/users/${survey.createdByUserObjectId}`
			);
			if (userResponse?.ok) {
				const userJson = await userResponse.json();
				const user = userJson?.data ?? null;
				return {
					...survey,
					employeeName: user.firstName + ' ' + user.lastName,
					employeeId: user._id
				};
			}
			return {
				...survey,
				employeeName: 'Unknown',
				employeeId: 'Unknown'
			};
		}
		return null;
	};

	const useSurveyBySurveyCode = (surveyCode: string | null) => {
		return useSWR(
			surveyCode ? `/api/surveys?surveyCode=${surveyCode}` : null,
			() => fetchSurveyBySurveyCode(surveyCode!),
			{
				revalidateOnMount: true, // Always fetch fresh data on mount
				revalidateOnFocus: true, // Revalidate when window regains focus
				dedupingInterval: 2000 // Prevent duplicate requests within 2 seconds
			}
		);
	};

	const useParentOfSurveyCode = (surveyCode: string | null) => {
		return useSWR(
			surveyCode ? `/api/surveys?childSurveyCodes=${surveyCode}` : null,
			() => fetchParentOfSurveyCode(surveyCode!)
		);
	};

	// No useSWR wrapper here since it lives in our ApplyReferral handlers (better to fetch directly)
	const fetchReferralCodeValidation = async (code: string) => {
		const response = await fetchWithAuth(
			`/api/validate-referral-code/${code}`
		);
		return (await response?.json()) ?? null;
	};

	const surveyService = {
		fetchSurveys,
		createSurvey,
		updateSurvey,
		fetchReferralCodeValidation,
		useSurveys,
		useSurvey,
		useSurveysWithUsersAndLocations,
		useSurveyWithUser,
		useParentOfSurveyCode,
		useSurveyBySurveyCode
	};

	const useLocations = () => {
		return useSWR(`/api/locations`, () => fetchLocations());
	};

	const fetchLocations = async () => {
		const response = await fetchWithAuth(`/api/locations`);
		return (await response?.json())?.data ?? null;
	};

	const locationService = { fetchLocations, useLocations };

	const useSeedBySurveyCode = (surveyCode: string | null) => {
		return useSWR(
			surveyCode ? `/api/seeds?surveyCode=${surveyCode}` : null,
			() => fetchSeedBySurveyCode(surveyCode!)
		);
	};

	const fetchSeedBySurveyCode = async (surveyCode: string) => {
		const response = await fetchWithAuth(
			`/api/seeds?surveyCode=${surveyCode}`
		);
		return (await response?.json())?.data[0] ?? null;
	};

	const createSeed = async (seedData: object) => {
		const response = await fetchWithAuth(`/api/seeds`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(seedData)
		});
		return response?.json();
	};

	const seedService = { createSeed, useSeedBySurveyCode };

	return {
		fetchWithAuth,
		userService,
		surveyService,
		locationService,
		seedService
	};
};

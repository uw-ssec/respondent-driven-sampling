import { useCallback } from 'react';

import { getAuthToken } from '@/utils/authTokenHandler';
import { useNavigate } from 'react-router-dom';
import useSWR, { mutate } from 'swr';

import { LocationDocument } from '@/types/Locations';
import { SurveyDocument } from '@/types/Survey';
import { UserDocument } from '@/types/User';
import { SeedDocument } from '@/types/Seed';
import { useAuth } from '@/hooks/useAuth';

import { parseAndNormalizeResponse } from './utils';

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

	// Helper that combines fetchWithAuth and parseAndNormalizeResponse
	function fetchAndNormalize<T extends Record<string, any>>(
		url: string,
		options: RequestInit & { isArray: true }
	): Promise<T[]>;
	function fetchAndNormalize<T extends Record<string, any>>(
		url: string,
		options?: RequestInit & { isArray?: false }
	): Promise<T | null>;
	async function fetchAndNormalize<T extends Record<string, any>>(
		url: string,
		options?: RequestInit & { isArray?: boolean }
	) {
		const { isArray, ...fetchOptions } = options ?? {};
		const response = await fetchWithAuth(url, fetchOptions);
		if (!response) return null;

		return parseAndNormalizeResponse<T>(response, { isArray }) as any;
	}

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
		return fetchAndNormalize<UserDocument>(`/api/users/${userObjectId}`);
	};

	const fetchUsers = async () => {
		return fetchAndNormalize<UserDocument>(`/api/users`, { isArray: true });
	};

	const approveUser = async (
		userObjectId: string,
		approvalStatus: string,
		approvedByUserObjectId: string
	) => {
		return fetchAndNormalize(`/api/users/${userObjectId}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ approvalStatus, approvedByUserObjectId })
		});
	};

	const updateUser = async (userObjectId: string, userData: object) => {
		return fetchAndNormalize(`/api/users/${userObjectId}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(userData)
		});
	};

	const createUser = async (userData: object) => {
		return fetchAndNormalize(`/api/users`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(userData)
		});
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

	const fetchSurvey = async (
		surveyObjectId: string
	): Promise<SurveyDocument | null> => {
		return fetchAndNormalize<SurveyDocument>(`/api/surveys/${surveyObjectId}`);
	};

	const fetchSurveys = async (): Promise<SurveyDocument[]> => {
		return fetchAndNormalize<SurveyDocument>(`/api/surveys`, {
			isArray: true
		});
	};

	const fetchSurveyBySurveyCode = async (surveyCode: string) => {
		const result = await fetchAndNormalize<SurveyDocument>(
			`/api/surveys?surveyCode=${surveyCode}`,
			{ isArray: true }
		);
		return result?.[0] ?? null;
	};

	const createSurvey = async (surveyData: object) => {
		const result = (await fetchAndNormalize(`/api/surveys`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(surveyData)
		})) as any;

		// Invalidate surveys list cache
		mutate(`/api/surveys`);
		// Also invalidate the survey-by-code cache if this survey has a code
		if (result?.surveyCode) {
			mutate(`/api/surveys?surveyCode=${result.surveyCode}`);
		}

		return result;
	};

	const updateSurvey = async (surveyObjectId: string, surveyData: object) => {
		const result = await fetchAndNormalize(
			`/api/surveys/${surveyObjectId}`,
			{
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(surveyData)
			}
		);

		// Invalidate related caches to ensure fresh data on next fetch
		mutate(`/api/surveys/${surveyObjectId}`);
		// Also invalidate the survey-by-code cache if this survey has a code
		if (result && 'surveyCode' in result) {
			mutate(`/api/surveys?surveyCode=${result.surveyCode}`);
		}

		return result;
	};

	const fetchParentOfSurveyCode = async (surveyCode: string) => {
		const result = await fetchAndNormalize<SurveyDocument>(
			`/api/surveys?childSurveyCodes=${surveyCode}`,
			{ isArray: true }
		);
		return result?.[0] ?? null;
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
		const locationMap: Map<string, string> = new Map(
			locations?.map((location: LocationDocument) => [
				location._id,
				location.hubName
			]) ?? []
		);

		// Enrich surveys with user data
		const enrichedSurveys: SurveyDocument[] =
			surveys?.map((survey: SurveyDocument) => {
				const user = userMap.get(
					survey.createdByUserObjectId as string
				);
				return {
					...survey,
					employeeName: user
						? `${user.firstName ?? ''} ${user.lastName ?? ''}`
						: 'Unknown',
					employeeId: String(survey.createdByUserObjectId ?? ''),
					locationName: (locationMap.get(
						survey.locationObjectId as string
					) ?? 'Unknown') as string
				} as SurveyDocument;
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
		// This function needs to check response.ok, so we use fetchWithAuth directly
		const surveyResponse = await fetchWithAuth(
			`/api/surveys/${surveyObjectId}`
		);
		if (!surveyResponse) {
			throw new Error('Failed to fetch survey: Authentication error');
		}
		if (!surveyResponse?.ok) {
			throw new Error(
				'Survey not found or you do not have permission to view it'
			);
		}
		const survey = (await parseAndNormalizeResponse<SurveyDocument>(
			surveyResponse
		)) as SurveyDocument | null;
		if (!survey) {
			throw new Error(
				'Survey not found or you do not have permission to view it'
			);
		}
		const user = (await fetchAndNormalize<UserDocument>(
			`/api/users/${survey.createdByUserObjectId}`
		)) as UserDocument | null;
		if (user) {
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
		return fetchAndNormalize<{
			isValid: boolean;
			message: string;
		}>(`/api/validate-referral-code/${code}`);
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
		return fetchAndNormalize<LocationDocument>(`/api/locations`, {
			isArray: true
		});
	};

	const locationService = { fetchLocations, useLocations };

	const useSeedBySurveyCode = (surveyCode: string | null) => {
		return useSWR(
			surveyCode ? `/api/seeds?surveyCode=${surveyCode}` : null,
			() => fetchSeedBySurveyCode(surveyCode!)
		);
	};

	const fetchSeedBySurveyCode = async (surveyCode: string) => {
		const result = await fetchAndNormalize(
			`/api/seeds?surveyCode=${surveyCode}`,
			{ isArray: true }
		);
		return result?.[0] ?? null;
	};

	const createSeed = async (seedData: object) => {
		const result = await fetchAndNormalize<SeedDocument>(`/api/seeds`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(seedData)
		});
		return result as SeedDocument | null;
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

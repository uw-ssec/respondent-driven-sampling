import { useCallback } from 'react';

import { getAuthToken } from '@/utils/authTokenHandler';
import { useNavigate } from 'react-router-dom';
import useSWR, { mutate, SWRResponse } from 'swr';

import { LocationDocument } from '@/types/Locations';
import { SeedDocument } from '@/types/Seed';
import { SurveyDocument } from '@/types/Survey';
import { UserDocument } from '@/types/User';
import { useAuth } from '@/hooks/useAuth';

const useAuthErrorHandler = (
	onLogout: () => void
): ((response: Response) => boolean | undefined) => {
	const navigate = useNavigate();

	return useCallback(
		(response: Response): boolean | undefined => {
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

const parseAndDeserializeResponse = async <
	T extends Record<string, any> | Record<string, any>[]
>(
	response: Response | null
): Promise<T | null> => {
	if (!response) return null;

	const json = await response.json();
	const data = json?.data ?? json;

	// Wrap deserialization in loop for arrays
	if (Array.isArray(data)) {
		return deserializeDatesArray(data) as T;
	}

	return deserializeDates(data) as T;
};

// Deserialize date fields in API responses to ensure they are Date objects
// This ensures consistent UTC date comparisons for permission checks
const deserializeDates = <T extends Record<string, any>>(
	obj: T | null | undefined
): T | null => {
	if (!obj) return null;

	const deserialized = { ...obj } as any;

	// Deserialize createdAt if present
	if ('createdAt' in deserialized && deserialized.createdAt !== undefined) {
		deserialized.createdAt =
			deserialized.createdAt instanceof Date
				? deserialized.createdAt
				: new Date(deserialized.createdAt);
	}

	// Deserialize updatedAt if present
	if ('updatedAt' in deserialized && deserialized.updatedAt !== undefined) {
		deserialized.updatedAt =
			deserialized.updatedAt instanceof Date
				? deserialized.updatedAt
				: new Date(deserialized.updatedAt);
	}

	// Deserialize deletedAt if present
	if ('deletedAt' in deserialized && deserialized.deletedAt !== undefined) {
		deserialized.deletedAt =
			deserialized.deletedAt instanceof Date
				? deserialized.deletedAt
				: new Date(deserialized.deletedAt);
	}

	return deserialized as T;
};

// Array version for our batch fetching functions
const deserializeDatesArray = <T extends Record<string, any>>(
	arr: T[] | null | undefined
): T[] => {
	if (!arr) return [];
	return arr
		.map(item => deserializeDates(item))
		.filter((item): item is T => item !== null);
};

export const useApi = () => {
	const { handleLogout } = useAuth();
	const handleAuthError = useAuthErrorHandler(handleLogout);

	const fetchWithAuth = async (
		url: string,
		options?: RequestInit
	): Promise<Response | null> => {
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

	// Need to deserialize date objects to ensure correct date comparisons for permission checks
	async function fetchAndDeserialize<
		T extends Record<string, any> | Record<string, any>[]
	>(url: string, options?: RequestInit): Promise<T | null> {
		const response = await fetchWithAuth(url, options);

		// Return null if response is null or not ok
		if (!response || !response.ok) {
			return null;
		}

		return await parseAndDeserializeResponse<T>(response);
	}

	const useUser = (
		userObjectId: string | undefined
	): SWRResponse<UserDocument | null> | null => {
		if (!userObjectId) return null;
		return useSWR(`/api/users/${userObjectId}`, () =>
			fetchUser(userObjectId)
		);
	};

	const useUsers = (): SWRResponse<UserDocument[] | null, Error> => {
		return useSWR(`/api/users`, () => fetchUsers());
	};

	const fetchUser = async (
		userObjectId: string
	): Promise<UserDocument | null> => {
		return await fetchAndDeserialize<UserDocument>(
			`/api/users/${userObjectId}`
		);
	};

	const fetchUsers = async (): Promise<UserDocument[] | null> => {
		return await fetchAndDeserialize<UserDocument[]>(`/api/users`);
	};

	const approveUser = async (
		userObjectId: string,
		approvalStatus: string,
		approvedByUserObjectId: string
	): Promise<UserDocument | null> => {
		const result = await fetchAndDeserialize<UserDocument>(
			`/api/users/${userObjectId}`,
			{
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ approvalStatus, approvedByUserObjectId })
			}
		);
		return result ?? null;
	};

	const updateUser = async (
		userObjectId: string,
		userData: object
	): Promise<UserDocument | null> => {
		return await fetchAndDeserialize<UserDocument>(
			`/api/users/${userObjectId}`,
			{
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(userData)
			}
		);
	};

	const createUser = async (
		userData: object
	): Promise<UserDocument | null> => {
		return await fetchAndDeserialize<UserDocument>(`/api/users`, {
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

	const useSurveys = (): SWRResponse<SurveyDocument[] | null> => {
		return useSWR(`/api/surveys`, () => fetchSurveys());
	};

	const fetchSurvey = async (
		surveyObjectId: string
	): Promise<SurveyDocument | null> => {
		return await fetchAndDeserialize<SurveyDocument>(
			`/api/surveys/${surveyObjectId}`
		);
	};

	const fetchSurveys = async (): Promise<SurveyDocument[] | null> => {
		return await fetchAndDeserialize<SurveyDocument[]>(`/api/surveys`);
	};

	const fetchSurveyBySurveyCode = async (
		surveyCode: string
	): Promise<SurveyDocument | null> => {
		const result = await fetchAndDeserialize<SurveyDocument[]>(
			`/api/surveys?surveyCode=${surveyCode}`
		);
		return result?.[0] ?? null;
	};

	const createSurvey = async (
		surveyData: object
	): Promise<SurveyDocument | null> => {
		const result = await fetchAndDeserialize<SurveyDocument>(
			`/api/surveys`,
			{
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(surveyData)
			}
		);

		// Invalidate surveys list cache
		mutate(`/api/surveys`);
		// Also invalidate the survey-by-code cache if this survey has a code
		if (result?.surveyCode) {
			mutate(`/api/surveys?surveyCode=${result.surveyCode}`);
		}

		return result;
	};

	const updateSurvey = async (
		surveyObjectId: string,
		surveyData: object
	): Promise<SurveyDocument | null> => {
		const result = await fetchAndDeserialize<SurveyDocument>(
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

	const fetchParentOfSurveyCode = async (
		surveyCode: string
	): Promise<SurveyDocument | null> => {
		const result = await fetchAndDeserialize<SurveyDocument[]>(
			`/api/surveys?childSurveyCodes=${surveyCode}`
		);
		return result?.[0] ?? null;
	};

	const useSurvey = (
		surveyObjectId: string
	): SWRResponse<SurveyDocument | null> => {
		return useSWR(
			surveyObjectId ? `/api/surveys/${surveyObjectId}` : null,
			() => fetchSurvey(surveyObjectId)
		);
	};

	const useSurveysWithUsersAndLocations = (): {
		data: SurveyDocument[];
		isLoading: boolean;
		mutate: (() => void) | undefined;
	} => {
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

	type SurveyWithUser = SurveyDocument & {
		employeeName: string;
		employeeId: string;
		locationName: string;
	};

	const useSurveyWithUser = (
		surveyObjectId: string | undefined
	): SWRResponse<SurveyWithUser | null> => {
		return useSWR(
			surveyObjectId ? `/api/surveys/${surveyObjectId}` : null,
			() => fetchSurveyWithUser(surveyObjectId!)
		);
	};

	const fetchSurveyWithUser = async (
		surveyObjectId: string
	): Promise<SurveyWithUser | null> => {
		const survey = await fetchAndDeserialize<SurveyDocument>(
			`/api/surveys/${surveyObjectId}`
		);
		if (!survey) {
			return null;
		}

		// Fetch user and location in parallel for efficiency
		const [user, location] = await Promise.all([
			fetchAndDeserialize<UserDocument>(
				`/api/users/${survey.createdByUserObjectId}`
			),
			survey.locationObjectId
				? fetchAndDeserialize<LocationDocument>(
						`/api/locations/${survey.locationObjectId}`
				  )
				: Promise.resolve(null)
		]);

		return {
			...survey,
			employeeName: user
				? `${user.firstName} ${user.lastName}`
				: 'Unknown',
			employeeId: user?._id ?? 'Unknown',
			locationName: location?.hubName ?? 'Unknown'
		};
	};

	const useSurveyBySurveyCode = (
		surveyCode: string | null
	): SWRResponse<SurveyDocument | null> => {
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

	const useParentOfSurveyCode = (
		surveyCode: string | null
	): SWRResponse<SurveyDocument | null> => {
		return useSWR(
			surveyCode ? `/api/surveys?childSurveyCodes=${surveyCode}` : null,
			() => fetchParentOfSurveyCode(surveyCode!)
		);
	};

	// No useSWR wrapper here since it lives in our ApplyReferral handlers (better to fetch directly)
	type ReferralCodeValidation = { isValid: boolean; message: string };

	const fetchReferralCodeValidation = async (
		code: string
	): Promise<ReferralCodeValidation | null> => {
		return await fetchAndDeserialize<ReferralCodeValidation>(
			`/api/validate-referral-code/${code}`
		);
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

	const useLocations = (): SWRResponse<LocationDocument[] | null> => {
		return useSWR(`/api/locations`, () => fetchLocations());
	};

	const fetchLocations = async (): Promise<LocationDocument[] | null> => {
		return await fetchAndDeserialize<LocationDocument[]>(`/api/locations`);
	};

	const locationService = { fetchLocations, useLocations };

	const useSeedBySurveyCode = (
		surveyCode: string | null
	): SWRResponse<SeedDocument | null> => {
		return useSWR(
			surveyCode ? `/api/seeds?surveyCode=${surveyCode}` : null,
			() => fetchSeedBySurveyCode(surveyCode!)
		);
	};

	const fetchSeedBySurveyCode = async (
		surveyCode: string
	): Promise<SeedDocument | null> => {
		const result = await fetchAndDeserialize<SeedDocument[]>(
			`/api/seeds?surveyCode=${surveyCode}`
		);
		return result?.[0] ?? null;
	};

	const createSeed = async (
		seedData: object
	): Promise<SeedDocument | null> => {
		return await fetchAndDeserialize<SeedDocument>(`/api/seeds`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(seedData)
		});
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

// Helper to parse JSON response and normalize dates automatically
type NormalizeOptions<A extends boolean | undefined = boolean | undefined> = {
	isArray?: A;
};

// Discriminated return type ensures callers get T[] when isArray is true
export const parseAndNormalizeResponse = async <
	T extends Record<string, any>,
	A extends boolean | undefined = boolean | undefined
>(
	response: Response | null,
	options?: NormalizeOptions<A>
): Promise<A extends true ? T[] : T | null> => {
	if (!response) return null as any;

	const json = await response.json();
	const data = json?.data ?? json;

	if (options?.isArray || Array.isArray(data)) {
		return normalizeDatesArray(data as T[]) as any;
	}

	return normalizeDates(data as T) as any;
};

// Normalize date fields in API responses to ensure they are Date objects
// This ensures consistent UTC date comparisons for permission checks
const normalizeDates = <T extends Record<string, any>>(
	obj: T | null | undefined
): T | null => {
	if (!obj) return null;

	const normalized = { ...obj } as any;

	// Normalize createdAt if present
	if ('createdAt' in normalized && normalized.createdAt !== undefined) {
		normalized.createdAt =
			normalized.createdAt instanceof Date
				? normalized.createdAt
				: new Date(normalized.createdAt);
	}

	// Normalize updatedAt if present
	if ('updatedAt' in normalized && normalized.updatedAt !== undefined) {
		normalized.updatedAt =
			normalized.updatedAt instanceof Date
				? normalized.updatedAt
				: new Date(normalized.updatedAt);
	}

	// Normalize deletedAt if present
	if ('deletedAt' in normalized && normalized.deletedAt !== undefined) {
		normalized.deletedAt =
			normalized.deletedAt instanceof Date
				? normalized.deletedAt
				: new Date(normalized.deletedAt);
	}

	return normalized as T;
};

// Array version for our batch fetching functions
const normalizeDatesArray = <T extends Record<string, any>>(
	arr: T[] | null | undefined
): T[] => {
	if (!arr) return [];
	return arr
		.map(item => normalizeDates(item))
		.filter((item): item is T => item !== null);
};

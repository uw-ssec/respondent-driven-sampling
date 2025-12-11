export const parseAndDeserializeResponse = async <
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

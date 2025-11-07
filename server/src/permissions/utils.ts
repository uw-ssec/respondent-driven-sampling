// Returns a Mongo query filter that checks if the value of the given field is today
// Made fieldName variable in case we want to have different checks for `updatedAt`/`createdAt`/`deletedAt`/etc.
export function isToday(fieldName: string, timezone: string = 'UTC') {
	const now = new Date();
	
	if (timezone !== 'UTC') {
		throw new Error('Only UTC timezone is currently supported');
	}
	
	// Create start and end of day in UTC as Date objects
	// This works on BOTH MongoDB AND CASL client-side
	const startOfDay = new Date(Date.UTC(
		now.getUTCFullYear(),
		now.getUTCMonth(),
		now.getUTCDate(),
		0, 0, 0, 0
	));
	
	const endOfDay = new Date(Date.UTC(
		now.getUTCFullYear(),
		now.getUTCMonth(),
		now.getUTCDate(),
		23, 59, 59, 999
	));
	
	return {
		[fieldName]: {
			$gte: startOfDay,
			$lte: endOfDay
		}
	};
}

export function hasSameLocation(locationObjectId: string): { locationObjectId: string } {
	return {
		locationObjectId
	};
}

export function isSelf(userObjectId: string): { _id: string } {
	return {
		_id: userObjectId
	};
}

export function isCreatedBySelf(userObjectId: string): { createdByUserObjectId: string } {
	return {
		createdByUserObjectId: userObjectId
	};
}

export function hasRole(roles: string[]): { role: { $in: string[] } } {
	return {
		role: { $in: roles }
	};
}

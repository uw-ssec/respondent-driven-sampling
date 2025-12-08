// Returns a Mongo query filter that checks if the value of the given field is today
// Made fieldName variable in case we want to have different checks for `updatedAt`/`createdAt`/`deletedAt`/etc.
// Defaults to Pacific timezone for usage in Seattle
export function isToday(
	fieldName: string,
	timezone: string = 'America/Los_Angeles'
) {
	const now = new Date();

	let startOfDay: Date;
	let endOfDay: Date;

	// Get date components in the target timezone
	const formatter = new Intl.DateTimeFormat('en-CA', {
		timeZone: timezone,
		year: 'numeric',
		month: '2-digit',
		day: '2-digit'
	});

	const parts = formatter.formatToParts(now);
	const tzYear = parseInt(parts.find(p => p.type === 'year')?.value || '0');
	const tzMonth =
		parseInt(parts.find(p => p.type === 'month')?.value || '0') - 1; // Month is 0-indexed
	const tzDay = parseInt(parts.find(p => p.type === 'day')?.value || '0');

	if (timezone === 'UTC') {
		// UTC timezone - use date components directly
		startOfDay = new Date(Date.UTC(tzYear, tzMonth, tzDay, 0, 0, 0, 0));
		endOfDay = new Date(Date.UTC(tzYear, tzMonth, tzDay, 23, 59, 59, 999));
	} else {
		// For other timezones, calculate UTC time for midnight in that timezone
		// Use noon UTC to avoid DST edge cases, then calculate offset
		const noonUtc = new Date(Date.UTC(tzYear, tzMonth, tzDay, 12, 0, 0, 0));
		const tzHourAtNoon = parseInt(
			noonUtc
				.toLocaleString('en-US', {
					timeZone: timezone,
					hour12: false,
					hour: '2-digit'
				})
				.split(':')[0]
		);

		// Calculate offset: if noon UTC is 4 AM in TZ, TZ is 8 hours behind UTC
		const offsetHours = tzHourAtNoon - 12;
		const midnightUtc = new Date(
			Date.UTC(tzYear, tzMonth, tzDay, 0, 0, 0, 0)
		);
		startOfDay = new Date(
			midnightUtc.getTime() - offsetHours * 60 * 60 * 1000
		);
		endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000 - 1);
	}

	return {
		[fieldName]: {
			$gte: startOfDay,
			$lte: endOfDay
		}
	};
}

export function hasSameLocation(locationObjectId: string): {
	locationObjectId: string;
} {
	return {
		locationObjectId
	};
}

export function isSelf(userObjectId: string): { _id: string } {
	return {
		_id: userObjectId
	};
}

export function isCreatedBySelf(userObjectId: string): {
	createdByUserObjectId: string;
} {
	return {
		createdByUserObjectId: userObjectId
	};
}

export function hasRole(roles: string[]): { role: { $in: string[] } } {
	return {
		role: { $in: roles }
	};
}

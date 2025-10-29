// Returns a Mongo query filter that checks if the value of the given field is today
// Made fieldName variable in case we want to have different checks for `updatedAt`/`createdAt`/`deletedAt`/etc.
export function isToday(fieldName: string, timezone: string = 'UTC') {
	const today = new Date();
	return {
		$expr: { // Allows use of aggregation operators in queries
			$eq: [ // Checks equality between two values
				// Value 1: The field from the document
				{
					$dateToString: { format: '%Y-%m-%d', date: `$${fieldName}`, timezone }
				},
				// Value 2: Today's date
				{ $dateToString: { format: '%Y-%m-%d', date: today, timezone } }
			]
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

// Returns a Mongo query filter that checks if the value of the given field is today
// Made fieldName variable in case we want to have different checks for `updatedAt`/`createdAt`/`deletedAt`/etc.
export function isToday(fieldName: string) {
	const today = new Date();
	return {
		$expr: {
			$eq: [
				{
					$dateToString: { format: '%Y-%m-%d', date: `$${fieldName}` }
				},
				{ $dateToString: { format: '%Y-%m-%d', date: today } }
			]
		}
	};
}

export function hasSameLocation(locationObjectId: string) {
	return {
		locationObjectId: locationObjectId
	};
}

export function isSelf(userObjectId: string) {
	return {
		_id: userObjectId
	};
}

export function isCreatedBySelf(userObjectId: string) {
	return {
		createdByUserObjectId: userObjectId
	};
}

export function hasRole(roles: string[]) {
	return {
		role: { $in: roles }
	};
}

import { useMemo } from 'react';

import { useAuthContext } from '@/contexts';
import defineAbilitiesForUser from '@/permissions/abilityBuilder';

export const useAbility = () => {
	const {
		userRole,
		userObjectId,
		lastestLocationObjectId,
		permissions,
		serverTimezone
	} = useAuthContext();

	// updates whenever our auth store updates
	return useMemo(
		() =>
			defineAbilitiesForUser(
				userRole ?? '',
				userObjectId ?? '',
				lastestLocationObjectId ?? '',
				permissions,
				serverTimezone ?? 'America/Los_Angeles'
			),
		[
			userRole,
			userObjectId,
			lastestLocationObjectId,
			permissions,
			serverTimezone
		]
	);
};

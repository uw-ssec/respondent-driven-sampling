import { useMemo } from 'react';

import { useAuthContext } from '@/contexts';
import defineAbilitiesForUser from '@/permissions/abilityBuilder';

export const useAbility = () => {
	const { userRole, userObjectId, lastestLocationObjectId, permissions } =
		useAuthContext();

	// updates whenever our auth store updates
	return useMemo(
		() =>
			defineAbilitiesForUser(
				userRole ?? '',
				userObjectId ?? '',
				lastestLocationObjectId ?? '',
				permissions
			),
		[userRole, userObjectId, lastestLocationObjectId, permissions]
	);
};

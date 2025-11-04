import { useMemo } from 'react';

import defineAbilitiesForUser from '@/permissions/abilityBuilder';
import { useAuthStore } from '@/stores';

export const useAbility = () => {
	const { userRole, userObjectId, lastestLocationObjectId, permissions } =
		useAuthStore();

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

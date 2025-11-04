import { createContext } from 'react';

import defineAbilitiesForUser from '@/permissions/abilityBuilder';
import { Ability } from '@/permissions/constants';
import { createContextualCan } from '@casl/react';

// Default ability will be nonexistent user (i.e. no permissions)
export const AbilityContext = createContext<Ability>(
	defineAbilitiesForUser('', '', '', [])
);
export const Can = createContextualCan<Ability>(AbilityContext.Consumer);

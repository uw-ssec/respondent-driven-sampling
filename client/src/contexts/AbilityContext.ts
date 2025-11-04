import { createContext } from 'react';
import { createContextualCan } from '@casl/react';
import { Ability } from '@/permissions/constants';
import defineAbilitiesForUser from '@/permissions/abilityBuilder';

// Default ability will be nonexistent user (i.e. no permissions)
export const AbilityContext = createContext<Ability>(defineAbilitiesForUser('', '', '', []));
export const Can = createContextualCan<Ability>(AbilityContext.Consumer);
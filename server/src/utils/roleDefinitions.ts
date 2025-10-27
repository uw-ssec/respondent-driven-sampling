// See CASL documentation: https://casl.js.org/v6/en/guide/intro

import { ForcedSubject, MongoAbility, MongoQuery } from "@casl/ability";

// Native CASL actions -- CRUD + master action "manage"
export const ACTIONS = {
	// Native actions can be used as Mongo query filters with `accessibleBy` function
	// Note: 'manage' includes ALL actions (native or custom)
	CASL: {
		CREATE: 'create',
		READ: 'read',
		UPDATE: 'update',
		DELETE: 'delete',
		MANAGE: 'manage'
	},
	// Custom actions can be used to describe more granular actions instead of just CRUD
	// These will also fall under the 'manage' action
	CUSTOM: { APPROVE: 'approve', PREAPPROVE: 'preapprove' }
};

// Allowed resources
export const SUBJECTS = {
	USER: 'User',
	SURVEY: 'Survey'
};

// Conditions for the actions
export const CONDITIONS = {
    SCOPES: {
        ALL: 'SCOPE_ALL',
        SELF: 'SCOPE_SELF'
    }
}

// Types
export type Context = { userObjectId: string };
export type Action = (typeof ACTION_ENUM)[number];
export type Subject = (typeof SUBJECT_ENUM)[number];
export type Condition = (typeof CONDITION_ENUM)[number];

// The mongo queries associated with each condition
// These can optionally take in the context of the user
export const CONDITION_QUERIES: Record<Condition, (ctx: Context) => MongoQuery> = {
    [CONDITIONS.SCOPES.ALL]: (_: Context) => ({}),
    [CONDITIONS.SCOPES.SELF]: (ctx: Context) => ({ userObjectId: ctx.userObjectId })
};

export type Query = ReturnType<typeof CONDITION_QUERIES[Condition]> | {} // @typescript-eslint/no-empty-object-type
// here, ForcedSubject is a type used when checking auth in our routes (i.e. building a dummy subject intead of just passing in a string)
export type Ability = MongoAbility<[Action, Subject | ForcedSubject<Subject>], Query>;

// Enums for the actions, subjects, and scopes, etc
// Used in User model schema declaration
export const ACTION_ENUM = [
	...Object.values(ACTIONS.CASL),
	...Object.values(ACTIONS.CUSTOM)
];
export const SUBJECT_ENUM = Object.values(SUBJECTS);
export const CONDITION_ENUM = [
    ...Object.values(CONDITIONS.SCOPES)
];
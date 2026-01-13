// See CASL documentation: https://casl.js.org/v6/en/guide/intro

import { ForcedSubject, MongoAbility, MongoQuery } from '@casl/ability';

import {
	hasRole,
	hasSameLocation,
	isCreatedBySelf,
	isSelf,
	isToday
} from '@/permissions/utils';

export const ROLES = {
	VOLUNTEER: 'VOLUNTEER',
	MANAGER: 'MANAGER',
	ADMIN: 'ADMIN',
	SUPER_ADMIN: 'SUPER_ADMIN'
};

// Native CASL actions -- CRUD + master action "manage"
// Note that these are lowercase/camelCase because CASL expects its native actions to be lowercase
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
	// Reserve custom actions for actions that cannot be captured
	// through Mongo query filters
	CUSTOM: {
		APPROVE: 'approve', // TODO: remove once v1 fully deprecated
		PREAPPROVE: 'preapprove', // TODO: remove once v1 fully deprecated
		CREATE_WITHOUT_REFERRAL: 'createWithoutReferral'
	}
};

// Allowed resources
export const SUBJECTS = {
	USER: 'User',
	SURVEY: 'Survey',
	SEED: 'Seed',
	LOCATION: 'Location',
	ALL: 'all' // special CASL keyword for all resources/subjects (analogous to 'manage' action)
};

export const FIELDS = {
	USER: {
		PROFILE: ['firstName', 'lastName', 'email', 'phone'],
		ROLE: ['role'],
		APPROVAL: ['approvalStatus', 'approvedByUserObjectId'],
		LOCATION: ['locationObjectId']
	}
};

// Conditions for the actions
export const CONDITIONS = {
	IS_SELF: 'IS_SELF',
	IS_CREATED_BY_SELF: 'IS_CREATED_BY_SELF',
	HAS_SAME_LOCATION: 'HAS_SAME_LOCATION',
	HAS_VOLUNTEER_ROLE: 'HAS_VOLUNTEER_ROLE',
	HAS_MANAGER_ROLE: 'HAS_MANAGER_ROLE',
	HAS_ADMIN_ROLE: 'HAS_ADMIN_ROLE',
	WAS_CREATED_TODAY: 'WAS_CREATED_TODAY'
};

// The mongo queries associated with each condition above
export const CONDITION_QUERIES: Record<
	Condition,
	(ctx: Context) => MongoQuery
> = {
	[CONDITIONS.IS_SELF]: (ctx: Context) => ({
		...isSelf(ctx.userObjectId)
	}),
	[CONDITIONS.IS_CREATED_BY_SELF]: (ctx: Context) => ({
		...isCreatedBySelf(ctx.userObjectId)
	}),
	[CONDITIONS.HAS_SAME_LOCATION]: (ctx: Context) => ({
		...hasSameLocation(ctx.latestLocationObjectId)
	}),
	[CONDITIONS.HAS_VOLUNTEER_ROLE]: (_ctx: Context) => ({
		...hasRole(['VOLUNTEER'])
	}),
	[CONDITIONS.HAS_MANAGER_ROLE]: (_ctx: Context) => ({
		...hasRole(['MANAGER'])
	}),
	[CONDITIONS.HAS_ADMIN_ROLE]: (_ctx: Context) => ({
		...hasRole(['ADMIN'])
	}),
	[CONDITIONS.WAS_CREATED_TODAY]: (ctx: Context) => ({
		...isToday('createdAt', ctx.timezone)
	})
};

// Enums for the actions, subjects, and scopes, etc
// Used in User model schema declaration
export const ROLE_ENUM = Object.values(ROLES);
export const ACTION_ENUM = [
	...Object.values(ACTIONS.CASL),
	...Object.values(ACTIONS.CUSTOM)
];
export const SUBJECT_ENUM = Object.values(SUBJECTS);
export const CONDITION_ENUM = Object.values(CONDITIONS);

// Types
export type Role = (typeof ROLE_ENUM)[number];
export type Context = {
	userObjectId: string;
	latestLocationObjectId: string;
	timezone: string;
};
export type Action = (typeof ACTION_ENUM)[number];
export type Subject = (typeof SUBJECT_ENUM)[number];
export type Condition = (typeof CONDITION_ENUM)[number];

// REVIEW: Not being used right now, but this is a type for when we want to check permissions on a subject that doesn't exist in the database (i.e. not a Mongoose model)
export type Query = ReturnType<(typeof CONDITION_QUERIES)[Condition]> | object;
// here, ForcedSubject is a type used when checking auth in our routes (i.e. building a dummy subject intead of just passing in a string)
export type Ability = MongoAbility<
	[Action, Subject | ForcedSubject<Subject>],
	Query
>;

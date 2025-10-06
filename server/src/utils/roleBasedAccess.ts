import {
	AbilityBuilder,
	createMongoAbility,
	MongoAbility
} from '@casl/ability';

import { AuthenticatedRequest } from '@/types/auth';
import { IPermission } from '@/types/models';

// See CASL documentation: https://casl.js.org/v6/en/guide/intro

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
	CUSTOM: { APPROVE: 'approve', PREAPPROVE: 'preapprove' }
};

// Allowed resources
// REVIEW: Make names consistent with casl? User action, subject, field, conditions.
export const RESOURCES = {
	USER: 'User',
	SURVEY: 'Survey'
};

// Allowed scopes
// REVIEW: Because SCOPES is being used to manage "conditions", maybe we can rename it to CONDITIONS and call it a day. I would also uppercase the values to ALL and SELF.
export const SCOPES = {
	ALL: 'all',
	SELF: 'self'
};

export const ACTION_ENUM = [
	...Object.values(ACTIONS.CASL),
	...Object.values(ACTIONS.CUSTOM)
];
export const RESOURCE_ENUM = Object.values(RESOURCES);
export const SCOPE_ENUM = Object.values(SCOPES);

// Assigns authorization by role and action
// REVIEW: Thoughts on renaming this to defineAbilitiesForUser or similar?
export default function authorizeUser(
	req: AuthenticatedRequest,
	userId: string,
	permissions: IPermission[] = []
): MongoAbility<any> {
	const { can, cannot, build } = new AbilityBuilder(createMongoAbility);
	// REVIEW: Thoughts on changing userId to userObjectId everywhere for clarity?
	const ctx = { id: userId ?? '', employeeId: req.user?.employeeId ?? '' }; // pass in id and employeeId for context

	// Assign default rules by role
	switch (req.user?.role) {
		case 'Admin':
			adminRules(can);
			break;
		case 'Manager':
			managerRules(can, ctx);
			break;
		case 'Volunteer':
			volunteerRules(can, ctx);
			break;
	}

	// Universal rules that can be overridden by custom rules should go here

	// Assign custom rules by user-specific permissions
	customRules(can, ctx, permissions);

	// Universal rules (cannot be overridden by custom rules)
	cannot(ACTIONS.CUSTOM.APPROVE, RESOURCES.USER, { _id: ctx.id });

	return build();
}

function adminRules(can: any) {
	// No restrictions
	can(ACTIONS.CASL.MANAGE, RESOURCES.USER);
	can(ACTIONS.CASL.MANAGE, RESOURCES.SURVEY);
}

function managerRules(can: any, ctx: { id: string; employeeId: string }) {
	// User actions
	can(ACTIONS.CASL.READ, RESOURCES.USER);
	can(ACTIONS.CASL.MANAGE, RESOURCES.USER, { employeeId: ctx.employeeId });
	can(ACTIONS.CASL.MANAGE, RESOURCES.USER, { _id: ctx.id });
	can(ACTIONS.CUSTOM.APPROVE, RESOURCES.USER);
	can(ACTIONS.CUSTOM.PREAPPROVE, RESOURCES.USER);

	// Survey actions
	can(ACTIONS.CASL.READ, RESOURCES.SURVEY);
	can(ACTIONS.CASL.CREATE, RESOURCES.SURVEY);
	can(ACTIONS.CASL.DELETE, RESOURCES.SURVEY, { employeeId: ctx.employeeId });
}

function volunteerRules(can: any, ctx: { id: string; employeeId: string }) {
	// User actions
	can(ACTIONS.CASL.READ, RESOURCES.USER, { _id: ctx.id });
	can(ACTIONS.CASL.READ, RESOURCES.USER, { employeeId: ctx.employeeId });
	can(ACTIONS.CASL.UPDATE, RESOURCES.USER, { employeeId: ctx.employeeId });
	can(ACTIONS.CASL.UPDATE, RESOURCES.USER, { _id: ctx.id });

	// Survey actions
	can(ACTIONS.CASL.MANAGE, RESOURCES.SURVEY, { employeeId: ctx.employeeId });
}

// REVIEW: Thoughts on renaming this to applyCustomPermissions or similar?
function customRules(
	can: any,
	ctx: { id: string; employeeId: string },
	permissions: IPermission[]
) {
	permissions.forEach(permission => {
		if (permission.scope === SCOPES.SELF) {
			can(permission.action, permission.resource, { _id: ctx.id });
			can(permission.action, permission.resource, {
				employeeId: ctx.employeeId
			});
		} else {
			can(permission.action, permission.resource);
		}
	});
}

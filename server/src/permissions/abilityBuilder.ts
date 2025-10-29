import { AbilityBuilder, createMongoAbility, Subject } from '@casl/ability';

import {
	Ability,
	Action,
	ACTIONS,
	Condition,
	CONDITION_QUERIES,
	Context,
	FIELDS,
	ROLES,
	SUBJECTS
} from '@/permissions/constants';
import { AuthenticatedRequest } from '@/types/auth';

import {
	hasRole,
	hasSameLocation,
	isCreatedBySelf,
	isSelf,
	isToday
} from './utils';

// Assigns authorization by role and action
export default function defineAbilitiesForUser(
	req: AuthenticatedRequest,
	userObjectId: string,
	latestLocationObjectId: string,
	permissions: { action: Action; subject: Subject; conditions: Condition[] }[]
): Ability {
	const builder = new AbilityBuilder<Ability>(createMongoAbility);
	const ctx: Context = { userObjectId, latestLocationObjectId }; // pass in userObjectId for context

	// Assign default rules by role
	switch (req.user?.role) {
		// TODO: super user
		case ROLES.ADMIN:
			applyAdminPermissions(builder, ctx);
			break;
		case ROLES.MANAGER:
			applyManagerPermissions(builder, ctx);
			break;
		case ROLES.VOLUNTEER:
			applyVolunteerPermissions(builder, ctx);
			break;
	}

	// Apply custom permissions
	applyCustomPermissions(builder, ctx, permissions);

	// Universal rules for all roles that will override any custom rules go here
	builder.cannot(ACTIONS.CUSTOM.APPROVE, SUBJECTS.USER, {
		_id: ctx.userObjectId
	});

	return builder.build();
}

// TODO: applySuperUserPermissions

function applyAdminPermissions(builder: AbilityBuilder<Ability>, ctx: Context) {
	// admins can approve anyone but superadmins
	builder.can(ACTIONS.CASL.UPDATE, SUBJECTS.USER, FIELDS.USER.APPROVAL, {
		...hasRole(['VOLUNTEER', 'MANAGER', 'ADMIN'])
	});
	// admins can update location and role of volunteers and managers
	builder.can(
		ACTIONS.CASL.UPDATE,
		SUBJECTS.USER,
		[...FIELDS.USER.LOCATION, ...FIELDS.USER.ROLE],
		{
			...hasRole(['VOLUNTEER', 'MANAGER'])
		}
	);
	// admins can update own profile AND own location
	builder.can(
		ACTIONS.CASL.UPDATE,
		SUBJECTS.USER,
		[...FIELDS.USER.PROFILE, ...FIELDS.USER.LOCATION],
		isSelf(ctx.userObjectId)
	);
	// admins can read all users
	builder.can(ACTIONS.CASL.READ, SUBJECTS.USER);
	builder.cannot(ACTIONS.CASL.DELETE, SUBJECTS.USER);

	builder.can(ACTIONS.CASL.CREATE, SUBJECTS.SURVEY);
	builder.can(ACTIONS.CUSTOM.CREATE_WITHOUT_REFERRAL, SUBJECTS.SURVEY);
	builder.can(ACTIONS.CASL.READ, SUBJECTS.SURVEY);
	builder.can(ACTIONS.CASL.UPDATE, SUBJECTS.SURVEY, {
		...isToday('createdAt')
	});
	builder.cannot(ACTIONS.CASL.DELETE, SUBJECTS.SURVEY);
}

function applyManagerPermissions(
	builder: AbilityBuilder<Ability>,
	ctx: Context
) {
	// User actions
	builder.can(ACTIONS.CASL.READ, SUBJECTS.USER);
	// can only approve volunteers at their current location today
	builder.can(ACTIONS.CASL.UPDATE, SUBJECTS.USER, FIELDS.USER.APPROVAL, {
		...hasRole(['VOLUNTEER']),
		...hasSameLocation(ctx.latestLocationObjectId),
		...isToday('createdAt')
	});
	// can only edit own profile
	builder.can(
		ACTIONS.CASL.UPDATE,
		SUBJECTS.USER,
		FIELDS.USER.PROFILE,
		isSelf(ctx.userObjectId)
	);
	builder.cannot(ACTIONS.CASL.DELETE, SUBJECTS.USER);

	// Survey actions
	builder.can(ACTIONS.CASL.CREATE, SUBJECTS.SURVEY);
	builder.can(ACTIONS.CUSTOM.CREATE_WITHOUT_REFERRAL, SUBJECTS.SURVEY);
	// can only read/update surveys created by themselves at their own location today
	builder.can([ACTIONS.CASL.READ, ACTIONS.CASL.UPDATE], SUBJECTS.SURVEY, {
		...isCreatedBySelf(ctx.userObjectId),
		...hasSameLocation(ctx.latestLocationObjectId),
		...isToday('createdAt')
	});
	builder.cannot(ACTIONS.CASL.DELETE, SUBJECTS.SURVEY);
}

function applyVolunteerPermissions(
	builder: AbilityBuilder<Ability>,
	ctx: Context
) {
	// User actions
	// can only read own profile
	builder.can(ACTIONS.CASL.READ, SUBJECTS.USER, isSelf(ctx.userObjectId));
	// can only update own profile
	builder.can(
		ACTIONS.CASL.UPDATE,
		SUBJECTS.USER,
		FIELDS.USER.PROFILE,
		isSelf(ctx.userObjectId)
	);
	builder.cannot(ACTIONS.CASL.DELETE, SUBJECTS.USER);

	// Survey actions
	builder.can(ACTIONS.CASL.CREATE, SUBJECTS.SURVEY);
	builder.can(ACTIONS.CUSTOM.CREATE_WITHOUT_REFERRAL, SUBJECTS.SURVEY);
	// can only read & update surveys created by themselves at their own location today
	builder.can([ACTIONS.CASL.READ, ACTIONS.CASL.UPDATE], SUBJECTS.SURVEY, {
		...isCreatedBySelf(ctx.userObjectId),
		...hasSameLocation(ctx.latestLocationObjectId),
		...isToday('createdAt')
	});
	builder.cannot(ACTIONS.CASL.DELETE, SUBJECTS.SURVEY);
}

function applyCustomPermissions(
	builder: AbilityBuilder<Ability>,
	ctx: Context,
	permissions: { action: Action; subject: Subject; conditions: Condition[] }[]
) {
	permissions.forEach(permission => {
		// if no conditions, apply default permission
		if (!permission.conditions.length) {
			builder.can(permission.action, permission.subject);
		}
		// if conditions, apply all conditions in array (sequential)
		else {
			permission.conditions.forEach(condition => {
				// this should never happen because we should be validating ENUMs
				if (!(condition in CONDITION_QUERIES)) {
					throw new Error(`Unknown condition: ${condition}`);
				}
				// apply query for condition
				const conditionQuery = CONDITION_QUERIES[condition](ctx);
				builder.can(
					permission.action,
					permission.subject,
					conditionQuery
				);
			});
		}
	});
}

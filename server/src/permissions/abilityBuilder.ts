import {
	AbilityBuilder,
	createMongoAbility,
	MongoQuery,
	Subject
} from '@casl/ability';

import {
	Ability,
	Action,
	ACTIONS,
	Condition,
	CONDITION_QUERIES,
	Context,
	FIELDS,
	Role,
	ROLES,
	SUBJECTS
} from '@/permissions/constants';
import {
	hasRole,
	hasSameLocation,
	isCreatedBySelf,
	isSelf,
	isToday
} from '@/permissions/utils';

// Assigns authorization by role and action
export default function defineAbilitiesForUser(
	userRole: Role,
	userObjectId: string,
	latestLocationObjectId: string,
	permissions: { action: Action; subject: Subject; conditions: Condition[] }[],
	timezone: string
): Ability {
	const builder = new AbilityBuilder<Ability>(createMongoAbility);
	const ctx: Context = { userObjectId, latestLocationObjectId, timezone };

	// Assign default rules by role
	switch (userRole) {
		case ROLES.SUPER_ADMIN:
			applySuperAdminPermissions(builder, ctx);
			break;
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

	return builder.build();
}

function applySuperAdminPermissions(
	builder: AbilityBuilder<Ability>,
	_ctx: Context
) {
	// No restrictions
	builder.can(ACTIONS.CASL.MANAGE, SUBJECTS.ALL);
}

function applyAdminPermissions(builder: AbilityBuilder<Ability>, ctx: Context) {
	// admins can approve anyone but superadmins
	builder.can(
		[ACTIONS.CASL.UPDATE],
		SUBJECTS.USER,
		FIELDS.USER.APPROVAL,
		hasRole(['VOLUNTEER', 'MANAGER', 'ADMIN'])
	);
	// admins can pre-approve/create anyone but superadmins
	builder.can(
		ACTIONS.CASL.CREATE,
		SUBJECTS.USER,
		hasRole(['VOLUNTEER', 'MANAGER', 'ADMIN'])
	);
	// admins can update location and role of volunteers and managers only (no admins)
	builder.can(
		ACTIONS.CASL.UPDATE,
		SUBJECTS.USER,
		[...FIELDS.USER.LOCATION, ...FIELDS.USER.ROLE],
		hasRole(['VOLUNTEER', 'MANAGER'])
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
	// can read all surveys (all locations/times)
	builder.can(ACTIONS.CASL.READ, SUBJECTS.SURVEY);
	// can update any surveys created today
	builder.can(ACTIONS.CASL.UPDATE, SUBJECTS.SURVEY, {
		...isToday('createdAt', ctx.timezone)
	});
	builder.cannot(ACTIONS.CASL.DELETE, SUBJECTS.SURVEY);

	// admins can read all seeds
	builder.can(ACTIONS.CASL.CREATE, SUBJECTS.SEED);
	builder.can(ACTIONS.CASL.READ, SUBJECTS.SEED);
}

function applyManagerPermissions(
	builder: AbilityBuilder<Ability>,
	ctx: Context
) {
	// User actions
	builder.can(ACTIONS.CASL.READ, SUBJECTS.USER);
	// can only approve volunteers created today at their latest location
	builder.can(ACTIONS.CASL.UPDATE, SUBJECTS.USER, FIELDS.USER.APPROVAL, {
		...hasRole(['VOLUNTEER']),
		...hasSameLocation(ctx.latestLocationObjectId),
		...isToday('createdAt', ctx.timezone)
	});
	// managers can pre-approve/create volunteers at their location
	builder.can(ACTIONS.CASL.CREATE, SUBJECTS.USER, {
		...hasRole(['VOLUNTEER']),
		...hasSameLocation(ctx.latestLocationObjectId)
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
	// can only read/update surveys created at their own location today
	builder.can([ACTIONS.CASL.UPDATE, ACTIONS.CASL.READ], SUBJECTS.SURVEY, {
		...hasSameLocation(ctx.latestLocationObjectId),
		...isToday('createdAt', ctx.timezone)
	});
	builder.cannot(ACTIONS.CASL.DELETE, SUBJECTS.SURVEY);

	// managers can read all seeds
	builder.can(ACTIONS.CASL.CREATE, SUBJECTS.SEED);
	builder.can(ACTIONS.CASL.READ, SUBJECTS.SEED);
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
		...isToday('createdAt', ctx.timezone)
	});
	builder.cannot(ACTIONS.CASL.DELETE, SUBJECTS.SURVEY);

	// admins can read all seeds
	builder.can(ACTIONS.CASL.CREATE, SUBJECTS.SEED);
	builder.can(ACTIONS.CASL.READ, SUBJECTS.SEED);
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
		// if conditions, combine all conditions into a single query
		else {
			const combinedQuery = permission.conditions.reduce(
				(acc, condition) => {
					// this should never happen because we should be validating ENUMs
					if (!(condition in CONDITION_QUERIES)) {
						throw new Error(
							`Corrupted permissions: unknown condition: ${condition}`
						);
					}
					// merge the condition query into our accumulator
					const conditionQuery = CONDITION_QUERIES[condition](ctx);
					return { ...acc, ...conditionQuery };
				},
				{} as MongoQuery
			);

			// apply the permission once with all conditions combined
			builder.can(permission.action, permission.subject, combinedQuery);
		}
	});
}

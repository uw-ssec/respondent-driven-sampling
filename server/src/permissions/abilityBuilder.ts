import { AbilityBuilder, createMongoAbility } from '@casl/ability';

import {
	Ability,
	ACTIONS,
	Context,
	FIELDS,
	SUBJECTS
} from '@/permissions/constants';
import { AuthenticatedRequest } from '@/types/auth';
import { IPermission } from '@/types/models';

import { isToday } from './utils';

// Assigns authorization by role and action
export default function defineAbilitiesForUser(
	req: AuthenticatedRequest,
	userObjectId: string,
	latestLocationObjectId: string,
	permissions: IPermission[] = []
): Ability {
	const builder = new AbilityBuilder<Ability>(createMongoAbility);
	const ctx: Context = { userObjectId, latestLocationObjectId }; // pass in userObjectId for context

	// Assign default rules by role
	switch (req.user?.role) {
		// TODO: super user
		case 'ADMIN':
			applyAdminPermissions(builder, ctx);
			break;
		case 'MANAGER':
			applyManagerPermissions(builder, ctx);
			break;
		case 'VOLUNTEER':
			applyVolunteerPermissions(builder, ctx);
			break;
	}

	// Universal rules for all roles that will NOT override custom rules go here

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
		role: { $in: ['VOLUNTEER', 'MANAGER', 'ADMIN'] }
	});
	// admins can update location and role of volunteers and managers
	builder.can(
		ACTIONS.CASL.UPDATE,
		SUBJECTS.USER,
		[...FIELDS.USER.LOCATION, ...FIELDS.USER.ROLE],
		{
			role: { $in: ['VOLUNTEER', 'MANAGER'] }
		}
	);
	// admins can update own profile
	builder.can(ACTIONS.CASL.UPDATE, SUBJECTS.USER, FIELDS.USER.PROFILE, {
		_id: ctx.userObjectId
	});
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
		role: 'VOLUNTEER',
		locationObjectId: ctx.latestLocationObjectId,
		...isToday('createdAt')
	});
	// can only edit location of volunteers
	builder.can(ACTIONS.CASL.UPDATE, SUBJECTS.USER, FIELDS.USER.LOCATION, {
		role: 'VOLUNTEER'
	});
	// can only edit own profile
	builder.can(ACTIONS.CASL.UPDATE, SUBJECTS.USER, FIELDS.USER.PROFILE, {
		_id: ctx.userObjectId
	});
	builder.cannot(ACTIONS.CASL.DELETE, SUBJECTS.USER);

	// Survey actions
	builder.can(ACTIONS.CASL.CREATE, SUBJECTS.SURVEY);
	builder.can(ACTIONS.CUSTOM.CREATE_WITHOUT_REFERRAL, SUBJECTS.SURVEY);
	// can only read surveys created by themselves at their own location today
	builder.can(ACTIONS.CASL.READ, SUBJECTS.SURVEY, {
		createdByUserObjectId: ctx.userObjectId,
		locationObjectId: ctx.latestLocationObjectId,
		...isToday('createdAt')
	});
	// can only update surveys created by themselves at their own location today
	builder.can(ACTIONS.CASL.UPDATE, SUBJECTS.SURVEY, {
		createdByUserObjectId: ctx.userObjectId,
		locationObjectId: ctx.latestLocationObjectId,
		...isToday('createdAt')
	});
	builder.cannot(ACTIONS.CASL.DELETE, SUBJECTS.SURVEY);
}

function applyVolunteerPermissions(
	builder: AbilityBuilder<Ability>,
	ctx: Context
) {
	// User actions
	builder.can(ACTIONS.CASL.READ, SUBJECTS.USER, { _id: ctx.userObjectId });
	// can only update own profile
	builder.can(ACTIONS.CASL.UPDATE, SUBJECTS.USER, FIELDS.USER.PROFILE, {
		_id: ctx.userObjectId
	});
	builder.cannot(ACTIONS.CASL.DELETE, SUBJECTS.USER);

	// Survey actions
	builder.can(ACTIONS.CASL.CREATE, SUBJECTS.SURVEY);
	builder.can(ACTIONS.CUSTOM.CREATE_WITHOUT_REFERRAL, SUBJECTS.SURVEY);
	// can only read surveys created by themselves at their own location today
	builder.can(ACTIONS.CASL.READ, SUBJECTS.SURVEY, {
		createdByUserObjectId: ctx.userObjectId,
		locationObjectId: ctx.latestLocationObjectId,
		...isToday('createdAt')
	});
	// can only update surveys created by themselves at their own location today
	builder.can(ACTIONS.CASL.UPDATE, SUBJECTS.SURVEY, {
		createdByUserObjectId: ctx.userObjectId,
		locationObjectId: ctx.latestLocationObjectId,
		...isToday('createdAt')
	});
	builder.cannot(ACTIONS.CASL.DELETE, SUBJECTS.SURVEY);
}

function applyCustomPermissions(
	builder: AbilityBuilder<Ability>,
	ctx: Context,
	permissions: IPermission[]
) {
	permissions.forEach(permission => {
		if (!permission.condition) {
			builder.can(permission.action, permission.subject);
		} else if (permission.condition === 'SCOPE_SELF') {
			// For SELF condition, create rules for both _id and createdByUserObjectId
			builder.can(permission.action, permission.subject, {
				_id: ctx.userObjectId
			});
			builder.can(permission.action, permission.subject, {
				createdByUserObjectId: ctx.userObjectId
			});
		} else {
			// For other conditions, use the condition directly
			builder.can(permission.action, permission.subject);
		}
	});
}

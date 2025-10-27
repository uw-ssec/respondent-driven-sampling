import {
	AbilityBuilder,
	createMongoAbility,
} from '@casl/ability';

import { AuthenticatedRequest } from '@/types/auth';
import { IPermission } from '@/types/models';
import { 
    ACTIONS, 
    SUBJECTS, 
    Ability,
    Context,
} from '@/utils/roleDefinitions';

// Assigns authorization by role and action
export default function defineAbilitiesForUser(
	req: AuthenticatedRequest,
	userObjectId: string,
	permissions: IPermission[] = []
): Ability {
    const builder = new AbilityBuilder<Ability>(createMongoAbility);
	const ctx: Context = { userObjectId }; // pass in userObjectId for context

	// Assign default rules by role
	switch (req.user?.role) {
		case 'Admin':
			applyAdminPermissions(builder);
			break;
		case 'Manager':
			applyManagerPermissions(builder, ctx);
			break;
		case 'Volunteer':
			applyVolunteerPermissions(builder, ctx);
			break;
	}

    // Universal rules for all roles that will NOT override custom rules go here

    // Apply custom permissions
    applyCustomPermissions(builder, ctx, permissions);

    // Universal rules for all roles that will override any custom rules go here
    builder.cannot(ACTIONS.CUSTOM.APPROVE, SUBJECTS.USER, { _id: ctx.userObjectId });

    return builder.build();
}

function applyAdminPermissions(builder: AbilityBuilder<Ability>) {
	// No restrictions
	builder.can(ACTIONS.CASL.MANAGE, SUBJECTS.USER);
	builder.can(ACTIONS.CASL.MANAGE, SUBJECTS.SURVEY);
}

function applyManagerPermissions(builder: AbilityBuilder<Ability>, ctx: Context) {
	// User actions
	builder.can(ACTIONS.CASL.READ, SUBJECTS.USER);
	builder.can(ACTIONS.CASL.MANAGE, SUBJECTS.USER, { _id: ctx.userObjectId });
	builder.can(ACTIONS.CUSTOM.APPROVE, SUBJECTS.USER);
	builder.can(ACTIONS.CUSTOM.PREAPPROVE, SUBJECTS.USER);

	// Survey actions
	builder.can(ACTIONS.CASL.READ, SUBJECTS.SURVEY);
	builder.can(ACTIONS.CASL.CREATE, SUBJECTS.SURVEY);
	builder.can(ACTIONS.CASL.DELETE, SUBJECTS.SURVEY, { createdByUserObjectId: ctx.userObjectId });
}

function applyVolunteerPermissions(builder: AbilityBuilder<Ability>, ctx: Context) {
	// User actions
	builder.can(ACTIONS.CASL.READ, SUBJECTS.USER, { _id: ctx.userObjectId });
	builder.can(ACTIONS.CASL.UPDATE, SUBJECTS.USER, { _id: ctx.userObjectId });

	// Survey actions
	builder.can(ACTIONS.CASL.MANAGE, SUBJECTS.SURVEY, { createdByUserObjectId: ctx.userObjectId });
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
            builder.can(permission.action, permission.subject, { _id: ctx.userObjectId });
			builder.can(permission.action, permission.subject, { createdByUserObjectId: ctx.userObjectId });
        } else {
            // For other conditions, use the condition directly
            builder.can(permission.action, permission.subject);
        }
	});
}

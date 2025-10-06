import { AbilityBuilder, createMongoAbility, MongoAbility } from '@casl/ability'
import { AuthenticatedRequest } from '@/types/auth';

// See CASL documentation: https://casl.js.org/v6/en/guide/intro

// Native CASL actions -- CRUD + master action "manage"
const ACTIONS = { 
    // Native actions can be used as Mongo query filters with `accessibleBy` function
    // Note: 'manage' includes ALL actions (native or custom)
    CASL: { CREATE: 'create', READ: 'read', UPDATE: 'update', DELETE: 'delete', MANAGE: 'manage' },
    // Custom actions can be used to describe more granular actions instead of just CRUD
    CUSTOM: { APPROVE: 'approve' }
}

// Other constants
const UPDATEABLE_USER_FIELDS = ['firstName', 'lastName', 'email', 'phone'];

// Assigns authorization by role and action
export default function authorizeUser(req: AuthenticatedRequest): MongoAbility<any> {
	const { can, cannot, build } = new AbilityBuilder(createMongoAbility);
	const ctx = { id: req.user?.id || '', employeeId: req.user?.employeeId || '' }; // pass in id and employeeId for context

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

    // Universal rules
	cannot(ACTIONS.CUSTOM.APPROVE, 'User', { _id: ctx.id });

	return build();
}

function adminRules(can: any) {
    // No restrictions
    can(ACTIONS.CASL.MANAGE, 'User');
    can(ACTIONS.CASL.MANAGE, 'Survey');
}

function managerRules(can: any, ctx: { id: string; employeeId: string }) {
    // User actions
    can(ACTIONS.CASL.READ, 'User');
    can(ACTIONS.CASL.MANAGE, 'User', UPDATEABLE_USER_FIELDS, { employeeId: ctx.employeeId });
    can(ACTIONS.CASL.MANAGE, 'User', UPDATEABLE_USER_FIELDS, { _id: ctx.id });
    can(ACTIONS.CUSTOM.APPROVE, 'User');
    
    // Survey actions
    can(ACTIONS.CASL.READ, 'Survey');
    can(ACTIONS.CASL.CREATE, 'Survey');
    can(ACTIONS.CASL.DELETE, 'Survey', { employeeId: ctx.employeeId });
}

function volunteerRules(can: any, ctx: { id: string; employeeId: string }) {
    // User actions
    can(ACTIONS.CASL.MANAGE, 'User', UPDATEABLE_USER_FIELDS, { employeeId: ctx.employeeId });
    can(ACTIONS.CASL.MANAGE, 'User', UPDATEABLE_USER_FIELDS, { _id: ctx.id });

    // Survey actions
    can(ACTIONS.CASL.MANAGE, 'Survey', { employeeId: ctx.employeeId });
}
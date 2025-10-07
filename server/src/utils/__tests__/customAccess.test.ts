// server/src/utils/__tests__/customAccess.test.ts
import defineAbilitiesForUser from '@/utils/roleBasedAccess';
import { ACTIONS, SUBJECTS, CONDITIONS } from '@/utils/roleDefinitions';
import { AuthenticatedRequest } from '@/types/auth';
import { subject } from '@casl/ability';
import { describe, expect, test } from '@jest/globals';
import { IPermission } from '@/types/models';

function makeReq(user: Partial<AuthenticatedRequest['user']>): AuthenticatedRequest {
	return {
		user: {
			id: user?.id || '64f0000000000000000000AA1',
			employeeId: user?.employeeId || 'EMPAA01',
			role: user?.role || 'Volunteer',
			firstName: user?.firstName || 'Test'
		}
	} as AuthenticatedRequest;
}

describe('Custom permission overrides', () => {
	const self = { id: '64f0000000000000000000AA1', employeeId: 'EMPAA01' };
	const other = { id: '64f0000000000000000000BB2', employeeId: 'EMPBB02' };

	test('Grant ALL-scoped approve on User to a Volunteer', () => {
		const perms: IPermission[] = [
			{ action: ACTIONS.CUSTOM.APPROVE, resource: SUBJECTS.USER, scope: CONDITIONS.SCOPES.ALL }
		];

		const ability = defineAbilitiesForUser(makeReq({ role: 'Volunteer', id: self.id, employeeId: self.employeeId }), self.id, perms);

		// Can approve self and others (note: your universal deny may block self if present)
		expect(ability.can(ACTIONS.CUSTOM.APPROVE, subject(SUBJECTS.USER, { _id: other.id }))).toBe(true);
	});

    test('Grant ALL-scoped read on Users to a Volunteer', () => {
        const perms: IPermission[] = [
            { action: ACTIONS.CASL.READ, resource: SUBJECTS.USER, scope: CONDITIONS.SCOPES.ALL }
        ];
        
        const ability = defineAbilitiesForUser(makeReq({ role: 'Volunteer', id: self.id, employeeId: self.employeeId }), self.id, perms);

        // Can read self and others
        expect(ability.can(ACTIONS.CASL.READ, subject(SUBJECTS.USER, { _id: self.id }))).toBe(true);
        expect(ability.can(ACTIONS.CASL.READ, subject(SUBJECTS.USER, { _id: other.id }))).toBe(true);
    });

	test('Multiple custom rules combine with role rules', () => {
		const perms: IPermission[] = [
			{ action: ACTIONS.CASL.READ, subject: SUBJECTS.USER, condition: CONDITIONS.SCOPES.ALL },
			{ action: ACTIONS.CASL.DELETE, subject: SUBJECTS.SURVEY, condition: CONDITIONS.SCOPES.SELF }
		];

		const ability = defineAbilitiesForUser(makeReq({ role: 'Volunteer', id: self.id, employeeId: self.employeeId }), self.id, perms);

		// From custom READ ALL users
		expect(ability.can(ACTIONS.CASL.READ, subject(SUBJECTS.USER, { _id: other.id }))).toBe(true);
		// From custom SELF delete own surveys
		expect(ability.can(ACTIONS.CASL.DELETE, subject(SUBJECTS.SURVEY, { employeeId: self.employeeId }))).toBe(true);
		// But still cannot delete others' surveys by default
		expect(ability.cannot(ACTIONS.CASL.DELETE, subject(SUBJECTS.SURVEY, { employeeId: other.employeeId }))).toBe(true);
	});

	test('Deny rule via extraPermissions (e.g., revoke update on User self)', () => {
		// Simulate deny by not granting update and ensuring default Volunteer cannot update others
		const perms: IPermission[] = []; // no custom grant
		const ability = defineAbilitiesForUser(makeReq({ role: 'Volunteer', id: self.id, employeeId: self.employeeId }), self.id, perms);

		// Volunteer can update self (role rule), but cannot update another user
		expect(ability.can(ACTIONS.CASL.UPDATE, subject(SUBJECTS.USER, { _id: self.id, employeeId: self.employeeId }))).toBe(true);
		expect(ability.cannot(ACTIONS.CASL.UPDATE, subject(SUBJECTS.USER, { _id: other.id, employeeId: other.employeeId }))).toBe(true);
	});
});

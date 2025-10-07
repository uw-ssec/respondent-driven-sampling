// server/src/utils/__tests__/roleBasedAccess.test.ts
import defineAbilitiesForUser from '@/utils/roleBasedAccess';
import { AuthenticatedRequest } from '@/types/auth';
import { subject } from '@casl/ability';
import { describe, expect, test } from '@jest/globals';

function makeReq(user: Partial<AuthenticatedRequest['user']>): AuthenticatedRequest {
	return {
		user: {
			id: user?.id || '64f000000000000000000001',
			employeeId: user?.employeeId || 'EMP0001',
			role: user?.role || 'Volunteer',
			firstName: user?.firstName || 'Test'
		}
	} as AuthenticatedRequest;
}

const otherUser = {
	id: '64f000000000000000000002',
	employeeId: 'EMP0002'
};

const self = {
	id: '64f000000000000000000001',
	employeeId: 'EMP0001'
};

describe('CASL authorization', () => {
	describe('Admin', () => {
		test('Admin can approve other users', () => {
			const ability = defineAbilitiesForUser(
				makeReq({ role: 'Admin', id: self.id, employeeId: self.employeeId }),
				self.id,
				[]
			);
			expect(ability.can('approve', subject('User', { _id: otherUser.id }))).toBe(true);
		});

		test('Admin cannot approve self', () => {
			const ability = defineAbilitiesForUser(
				makeReq({ role: 'Admin', id: self.id, employeeId: self.employeeId }),
				self.id,
				[]
			);
			expect(ability.cannot('approve', subject('User', { _id: self.id }))).toBe(true);
		});

		test('Admin can read any user', () => {
			const ability = defineAbilitiesForUser(
				makeReq({ role: 'Admin', id: self.id, employeeId: self.employeeId }),
				self.id,
				[]
			);
			expect(ability.can('read', subject('User', { _id: otherUser.id }))).toBe(true);
		});

		test('Admin can update any user', () => {
			const ability = defineAbilitiesForUser(
				makeReq({ role: 'Admin', id: self.id, employeeId: self.employeeId }),
				self.id,
				[]
			);
			expect(ability.can('update', subject('User', { _id: otherUser.id }))).toBe(true);
		});

		test('Admin can create any user', () => {
			const ability = defineAbilitiesForUser(
				makeReq({ role: 'Admin', id: self.id, employeeId: self.employeeId }),
				self.id,
				[]
			);
			expect(ability.can('create', subject('User', { _id: otherUser.id }))).toBe(true);
		});

		test('Admin can delete any user', () => {
			const ability = defineAbilitiesForUser(
				makeReq({ role: 'Admin', id: self.id, employeeId: self.employeeId }),
				self.id,
				[]
			);
			expect(ability.can('delete', subject('User', { _id: otherUser.id }))).toBe(true);
		});

		test('Admin can manage any survey', () => {
			const ability = defineAbilitiesForUser(
				makeReq({ role: 'Admin', id: self.id, employeeId: self.employeeId }),
				self.id,
				[]
			);
			expect(ability.can('manage', subject('Survey', { employeeId: otherUser.employeeId }))).toBe(true);
		});

		test('Admin can delete any survey', () => {
			const ability = defineAbilitiesForUser(
				makeReq({ role: 'Admin', id: self.id, employeeId: self.employeeId }),
				self.id,
				[]
			);
			expect(ability.can('delete', subject('Survey', { employeeId: otherUser.employeeId }))).toBe(true);
		});
	});

	describe('Manager', () => {
		test('Manager can approve other users', () => {
			const ability = defineAbilitiesForUser(
				makeReq({ role: 'Manager', id: self.id, employeeId: self.employeeId }),
				self.id,
				[]
			);
			expect(ability.can('approve', subject('User', { _id: otherUser.id }))).toBe(true);
		});

		test('Manager cannot approve self', () => {
			const ability = defineAbilitiesForUser(
				makeReq({ role: 'Manager', id: self.id, employeeId: self.employeeId }),
				self.id,
				[]
			);
			expect(ability.cannot('approve', subject('User', { _id: self.id }))).toBe(true);
		});

		test('Manager can read any user', () => {
			const ability = defineAbilitiesForUser(
				makeReq({ role: 'Manager', id: self.id, employeeId: self.employeeId }),
				self.id,
				[]
			);
			expect(ability.can('read', 'User')).toBe(true);
		});

		test('Manager can update own profile allowed fields', () => {
			const ability = defineAbilitiesForUser(
				makeReq({ role: 'Manager', id: self.id, employeeId: self.employeeId }),
				self.id,
				[]
			);
			const selfUser = subject('User', { _id: self.id, employeeId: self.employeeId });

			expect(ability.can('update', selfUser, 'firstName')).toBe(true);
			expect(ability.can('update', selfUser, 'lastName')).toBe(true);
			expect(ability.can('update', selfUser, 'email')).toBe(true);
			expect(ability.can('update', selfUser, 'phone')).toBe(true);

			// Not allowed fields
			expect(ability.cannot('approve', selfUser)).toBe(true);
		});

		test('Manager can view any survey but only delete their own survey', () => {
			const ability = defineAbilitiesForUser(
				makeReq({ role: 'Manager', id: self.id, employeeId: self.employeeId }),
				self.id,
				[]
			);
			expect(ability.can('read', subject('Survey', { employeeId: otherUser.employeeId }))).toBe(true);
			expect(ability.can('read', subject('Survey', { employeeId: self.employeeId }))).toBe(true);
			expect(ability.can('delete', subject('Survey', { employeeId: self.employeeId }))).toBe(true);
			expect(ability.cannot('delete', subject('Survey', { employeeId: otherUser.employeeId }))).toBe(true);
		});
	});

	describe('Volunteer', () => {
		test('Volunteer can manage only own User limited fields', () => {
			const ability = defineAbilitiesForUser(
				makeReq({ role: 'Volunteer', id: self.id, employeeId: self.employeeId }),
				self.id,
				[]
			);
			const selfUser = subject('User', { _id: self.id, employeeId: self.employeeId });

			expect(ability.can('update', selfUser, 'firstName')).toBe(true);
			expect(ability.can('update', selfUser, 'lastName')).toBe(true);
			expect(ability.can('update', selfUser, 'email')).toBe(true);
			expect(ability.can('update', selfUser, 'phone')).toBe(true);

			// Disallowed fields
			expect(ability.cannot('approve', selfUser)).toBe(true);
		});

		test('Volunteer cannot approve anyone', () => {
			const ability = defineAbilitiesForUser(
				makeReq({ role: 'Volunteer' }),
				self.id,
				[]
			);
			expect(ability.cannot('approve', subject('User', { _id: otherUser.id }))).toBe(true);
		});
	});
});
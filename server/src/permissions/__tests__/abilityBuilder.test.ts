// TODO: Update tests to match changes in abilityBuilder.ts
import { subject } from '@casl/ability';
import { describe, expect, jest, test } from '@jest/globals';

import { AuthenticatedRequest } from '../../types/auth';
import defineAbilitiesForUser from '../abilityBuilder';
import { ACTIONS, ROLES, SUBJECTS } from '../constants';

// Mock the isToday function to return a valid MongoDB expression for today's date
// Current implementation cannot compile correctly under test conditions
jest.mock('../utils', () => {
	const actual = jest.requireActual('../utils');
	return {
		...(actual as Record<string, any>),
		isToday: (fieldName: string, _timezone: string) => {
			const startOfDay = new Date();
			startOfDay.setHours(0, 0, 0, 0);

			const endOfDay = new Date();
			endOfDay.setHours(23, 59, 59, 999);

			return {
				[fieldName]: {
					$gte: startOfDay,
					$lte: endOfDay
				}
			};
		}
	};
});

// Default timezone for tests
const TEST_TIMEZONE = 'America/Los_Angeles';

const self = {
	userObjectId: '6901027707fdae19aae38d4c'
};

const otherUser = {
	userObjectId: '6901027707fdae19aae38d4d'
};

const location1 = '6901027707fdae19aae38d4e';
const location2 = '6901027707fdae19aae38d4f';

// Helper to create a date object for today
const today = new Date();
const yesterday = new Date(today);
yesterday.setDate(yesterday.getDate() - 1);

describe('CASL abilityBuilder', () => {
	describe('Admin permissions', () => {
		describe('User permissions', () => {
			test('Admin can approve volunteers', () => {
				const ability = defineAbilitiesForUser(
					ROLES.ADMIN,
					self.userObjectId,
					location1,
					[],
					TEST_TIMEZONE
				);

				const volunteerAtSameLocation = subject('User', {
					_id: otherUser.userObjectId,
					role: ROLES.VOLUNTEER,
					locationObjectId: location1,
					createdAt: today
				});

				expect(
					ability.can(
						ACTIONS.CASL.UPDATE,
						volunteerAtSameLocation,
						'approvalStatus'
					)
				).toBe(true);
			});

			test('Admin can approve managers at their location created today', () => {
				const ability = defineAbilitiesForUser(
					ROLES.ADMIN,
					self.userObjectId,
					location1,
					[],
					TEST_TIMEZONE
				);

				const managerAtSameLocation = subject('User', {
					_id: otherUser.userObjectId,
					role: ROLES.MANAGER,
					locationObjectId: location1,
					createdAt: today
				});

				expect(
					ability.can(
						ACTIONS.CASL.UPDATE,
						managerAtSameLocation,
						'approvalStatus'
					)
				).toBe(true);
			});

			test('Admin can approve other admins at their location created today', () => {
				const ability = defineAbilitiesForUser(
					ROLES.ADMIN,
					self.userObjectId,
					location1,
					[],
					TEST_TIMEZONE
				);

				const adminAtSameLocation = subject('User', {
					_id: otherUser.userObjectId,
					role: ROLES.ADMIN,
					locationObjectId: location1,
					createdAt: today
				});

				expect(
					ability.can(
						ACTIONS.CASL.UPDATE,
						adminAtSameLocation,
						'approvalStatus'
					)
				).toBe(true);
			});

			test('Admin can update location and role of volunteers', () => {
				const ability = defineAbilitiesForUser(
					ROLES.ADMIN,
					self.userObjectId,
					location1,
					[],
					TEST_TIMEZONE
				);

				const volunteer = subject('User', {
					_id: otherUser.userObjectId,
					role: ROLES.VOLUNTEER
				});

				expect(
					ability.can(
						ACTIONS.CASL.UPDATE,
						volunteer,
						'locationObjectId'
					)
				).toBe(true);
				expect(
					ability.can(ACTIONS.CASL.UPDATE, volunteer, 'role')
				).toBe(true);
			});

			test('Admin can update location and role of managers', () => {
				const ability = defineAbilitiesForUser(
					ROLES.ADMIN,
					self.userObjectId,
					location1,
					[],
					TEST_TIMEZONE
				);

				const manager = subject('User', {
					_id: otherUser.userObjectId,
					role: ROLES.MANAGER
				});

				expect(
					ability.can(
						ACTIONS.CASL.UPDATE,
						manager,
						'locationObjectId'
					)
				).toBe(true);
				expect(ability.can(ACTIONS.CASL.UPDATE, manager, 'role')).toBe(
					true
				);
			});

			test('Admin cannot update location and role of other admins', () => {
				const ability = defineAbilitiesForUser(
					// makeReq({
					// 	role: ROLES.ADMIN,
					// 	userObjectId: self.userObjectId
					// }),
					ROLES.ADMIN,
					self.userObjectId,
					location1,
					[],
					TEST_TIMEZONE
				);

				const otherAdmin = subject('User', {
					_id: otherUser.userObjectId,
					role: ROLES.ADMIN
				});

				expect(
					ability.cannot(
						ACTIONS.CASL.UPDATE,
						otherAdmin,
						'locationObjectId'
					)
				).toBe(true);
				expect(
					ability.cannot(ACTIONS.CASL.UPDATE, otherAdmin, 'role')
				).toBe(true);
			});

			test('Admin can update own profile fields', () => {
				const ability = defineAbilitiesForUser(
					// makeReq({
					// 	role: ROLES.ADMIN,
					// 	userObjectId: self.userObjectId
					// }),
					ROLES.ADMIN,
					self.userObjectId,
					location1,
					[],
					TEST_TIMEZONE
				);

				const selfUser = subject('User', { _id: self.userObjectId });

				expect(
					ability.can(ACTIONS.CASL.UPDATE, selfUser, 'firstName')
				).toBe(true);
				expect(
					ability.can(ACTIONS.CASL.UPDATE, selfUser, 'lastName')
				).toBe(true);
				expect(
					ability.can(ACTIONS.CASL.UPDATE, selfUser, 'email')
				).toBe(true);
				expect(
					ability.can(ACTIONS.CASL.UPDATE, selfUser, 'phone')
				).toBe(true);
			});

			test('Admin can read all users', () => {
				const ability = defineAbilitiesForUser(
					// makeReq({
					// 	role: ROLES.ADMIN,
					// 	userObjectId: self.userObjectId
					// }),
					ROLES.ADMIN,
					self.userObjectId,
					location1,
					[],
					TEST_TIMEZONE
				);

				expect(ability.can(ACTIONS.CASL.READ, SUBJECTS.USER)).toBe(
					true
				);
			});

			test('Admin cannot delete users', () => {
				const ability = defineAbilitiesForUser(
					// makeReq({
					// 	role: ROLES.ADMIN,
					// 	userObjectId: self.userObjectId
					// }),
					ROLES.ADMIN,
					self.userObjectId,
					location1,
					[],
					TEST_TIMEZONE
				);

				expect(ability.cannot(ACTIONS.CASL.DELETE, SUBJECTS.USER)).toBe(
					true
				);
			});
		});

		describe('Survey permissions', () => {
			test('Admin can create surveys', () => {
				const ability = defineAbilitiesForUser(
					// makeReq({
					// 	role: ROLES.ADMIN,
					// 	userObjectId: self.userObjectId
					// }),
					ROLES.ADMIN,
					self.userObjectId,
					location1,
					[],
					TEST_TIMEZONE
				);

				expect(ability.can(ACTIONS.CASL.CREATE, SUBJECTS.SURVEY)).toBe(
					true
				);
			});

			test('Admin can create surveys without referral', () => {
				const ability = defineAbilitiesForUser(
					// makeReq({
					// 	role: ROLES.ADMIN,
					// 	userObjectId: self.userObjectId
					// }),
					ROLES.ADMIN,
					self.userObjectId,
					location1,
					[],
					TEST_TIMEZONE
				);

				expect(
					ability.can(
						ACTIONS.CUSTOM.CREATE_WITHOUT_REFERRAL,
						SUBJECTS.SURVEY
					)
				).toBe(true);
			});

			test('Admin can read all surveys', () => {
				const ability = defineAbilitiesForUser(
					// makeReq({
					// 	role: ROLES.ADMIN,
					// 	userObjectId: self.userObjectId
					// }),
					ROLES.ADMIN,
					self.userObjectId,
					location1,
					[],
					TEST_TIMEZONE
				);

				expect(ability.can(ACTIONS.CASL.READ, SUBJECTS.SURVEY)).toBe(
					true
				);
			});

			test('Admin can update surveys created today', () => {
				const ability = defineAbilitiesForUser(
					// makeReq({
					// 	role: ROLES.ADMIN,
					// 	userObjectId: self.userObjectId
					// }),
					ROLES.ADMIN,
					self.userObjectId,
					location1,
					[],
					TEST_TIMEZONE
				);

				const surveyCreatedToday = subject('Survey', {
					createdAt: today
				});

				expect(
					ability.can(ACTIONS.CASL.UPDATE, surveyCreatedToday)
				).toBe(true);
			});

			test('Admin cannot delete surveys', () => {
				const ability = defineAbilitiesForUser(
					// makeReq({
					// 	role: ROLES.ADMIN,
					// 	userObjectId: self.userObjectId
					// }),
					ROLES.ADMIN,
					self.userObjectId,
					location1,
					[],
					TEST_TIMEZONE
				);

				expect(
					ability.cannot(ACTIONS.CASL.DELETE, SUBJECTS.SURVEY)
				).toBe(true);
			});
		});
	});

	describe('Manager permissions', () => {
		describe('User permissions', () => {
			test('Manager can read all users', () => {
				const ability = defineAbilitiesForUser(
					// makeReq({
					// 	role: ROLES.MANAGER,
					// 	userObjectId: self.userObjectId
					// }),
					ROLES.MANAGER,
					self.userObjectId,
					location1,
					[],
					TEST_TIMEZONE
				);

				expect(ability.can(ACTIONS.CASL.READ, SUBJECTS.USER)).toBe(
					true
				);
			});

			test('Manager can approve volunteers at their location created today', () => {
				const ability = defineAbilitiesForUser(
					// makeReq({
					// 	role: ROLES.MANAGER,
					// 	userObjectId: self.userObjectId
					// }),
					ROLES.MANAGER,
					self.userObjectId,
					location1,
					[],
					TEST_TIMEZONE
				);

				const volunteerAtSameLocation = subject('User', {
					_id: otherUser.userObjectId,
					role: ROLES.VOLUNTEER,
					locationObjectId: location1,
					createdAt: today
				});

				expect(
					ability.can(
						ACTIONS.CASL.UPDATE,
						volunteerAtSameLocation,
						'approvalStatus'
					)
				).toBe(true);
			});

			test('Manager cannot approve managers', () => {
				const ability = defineAbilitiesForUser(
					// makeReq({
					// 	role: ROLES.MANAGER,
					// 	userObjectId: self.userObjectId
					// }),
					ROLES.MANAGER,
					self.userObjectId,
					location1,
					[],
					TEST_TIMEZONE
				);

				const managerUser = subject('User', {
					_id: otherUser.userObjectId,
					role: ROLES.MANAGER,
					locationObjectId: location1,
					createdAt: today
				});

				expect(
					ability.cannot(
						ACTIONS.CASL.UPDATE,
						managerUser,
						'approvalStatus'
					)
				).toBe(true);
			});

			test('Manager cannot approve volunteers at different location', () => {
				const ability = defineAbilitiesForUser(
					// makeReq({
					// 	role: ROLES.MANAGER,
					// 	userObjectId: self.userObjectId
					// }),
					ROLES.MANAGER,
					self.userObjectId,
					location1,
					[],
					TEST_TIMEZONE
				);

				const volunteerAtDifferentLocation = subject('User', {
					_id: otherUser.userObjectId,
					role: ROLES.VOLUNTEER,
					locationObjectId: location2,
					createdAt: today
				});

				expect(
					ability.cannot(
						ACTIONS.CASL.UPDATE,
						volunteerAtDifferentLocation,
						'approvalStatus'
					)
				).toBe(true);
			});

			test('Manager cannot approve self (universal rule)', () => {
				const ability = defineAbilitiesForUser(
					// makeReq({
					// 	role: ROLES.MANAGER,
					// 	userObjectId: self.userObjectId
					// }),
					ROLES.MANAGER,
					self.userObjectId,
					location1,
					[],
					TEST_TIMEZONE
				);

				const selfUser = subject('User', {
					_id: self.userObjectId,
					role: ROLES.MANAGER,
					locationObjectId: location1,
					createdAt: today
				});

				expect(ability.cannot(ACTIONS.CUSTOM.APPROVE, selfUser)).toBe(
					true
				);
			});

			test('Manager cannot update location of other managers', () => {
				const ability = defineAbilitiesForUser(
					// makeReq({
					// 	role: ROLES.MANAGER,
					// 	userObjectId: self.userObjectId
					// }),
					ROLES.MANAGER,
					self.userObjectId,
					location1,
					[],
					TEST_TIMEZONE
				);

				const manager = subject('User', {
					_id: otherUser.userObjectId,
					role: ROLES.MANAGER
				});

				expect(
					ability.cannot(
						ACTIONS.CASL.UPDATE,
						manager,
						'locationObjectId'
					)
				).toBe(true);
			});

			test('Manager can update own profile fields', () => {
				const ability = defineAbilitiesForUser(
					// makeReq({
					// 	role: ROLES.MANAGER,
					// 	userObjectId: self.userObjectId
					// }),
					ROLES.MANAGER,
					self.userObjectId,
					location1,
					[],
					TEST_TIMEZONE
				);

				const selfUser = subject('User', { _id: self.userObjectId });

				expect(
					ability.can(ACTIONS.CASL.UPDATE, selfUser, 'firstName')
				).toBe(true);
				expect(
					ability.can(ACTIONS.CASL.UPDATE, selfUser, 'lastName')
				).toBe(true);
				expect(
					ability.can(ACTIONS.CASL.UPDATE, selfUser, 'email')
				).toBe(true);
				expect(
					ability.can(ACTIONS.CASL.UPDATE, selfUser, 'phone')
				).toBe(true);
			});

			test('Manager cannot delete users', () => {
				const ability = defineAbilitiesForUser(
					// makeReq({
					// 	role: ROLES.MANAGER,
					// 	userObjectId: self.userObjectId
					// }),
					ROLES.MANAGER,
					self.userObjectId,
					location1,
					[],
					TEST_TIMEZONE
				);

				expect(ability.cannot(ACTIONS.CASL.DELETE, SUBJECTS.USER)).toBe(
					true
				);
			});
		});

		describe('Survey permissions', () => {
			test('Manager can create surveys', () => {
				const ability = defineAbilitiesForUser(
					// makeReq({
					// 	role: ROLES.MANAGER,
					// 	userObjectId: self.userObjectId
					// }),
					ROLES.MANAGER,
					self.userObjectId,
					location1,
					[],
					TEST_TIMEZONE
				);

				expect(ability.can(ACTIONS.CASL.CREATE, SUBJECTS.SURVEY)).toBe(
					true
				);
			});

			test('Manager can create surveys without referral', () => {
				const ability = defineAbilitiesForUser(
					// makeReq({
					// 	role: ROLES.MANAGER,
					// 	userObjectId: self.userObjectId
					// }),
					ROLES.MANAGER,
					self.userObjectId,
					location1,
					[],
					TEST_TIMEZONE
				);

				expect(
					ability.can(
						ACTIONS.CUSTOM.CREATE_WITHOUT_REFERRAL,
						SUBJECTS.SURVEY
					)
				).toBe(true);
			});

			test('Manager can read only own surveys at own location created today', () => {
				const ability = defineAbilitiesForUser(
					// makeReq({
					// 	role: ROLES.MANAGER,
					// 	userObjectId: self.userObjectId
					// }),
					ROLES.MANAGER,
					self.userObjectId,
					location1,
					[],
					TEST_TIMEZONE
				);

				const ownSurveyAtOwnLocation = subject('Survey', {
					createdByUserObjectId: self.userObjectId,
					locationObjectId: location1,
					createdAt: today
				});

				expect(
					ability.can(ACTIONS.CASL.READ, ownSurveyAtOwnLocation)
				).toBe(true);
			});

			test('Manager cannot read surveys from other users', () => {
				const ability = defineAbilitiesForUser(
					// makeReq({
					// 	role: ROLES.MANAGER,
					// 	userObjectId: self.userObjectId
					// }),
					ROLES.MANAGER,
					self.userObjectId,
					location1,
					[],
					TEST_TIMEZONE
				);

				const otherUserSurvey = subject('Survey', {
					createdByUserObjectId: otherUser.userObjectId,
					locationObjectId: location1,
					createdAt: today
				});

				expect(ability.cannot(ACTIONS.CASL.READ, otherUserSurvey)).toBe(
					true
				);
			});

			test('Manager cannot read surveys from different location', () => {
				const ability = defineAbilitiesForUser(
					// makeReq({
					// 	role: ROLES.MANAGER,
					// 	userObjectId: self.userObjectId
					// }),
					ROLES.MANAGER,
					self.userObjectId,
					location1,
					[],
					TEST_TIMEZONE
				);

				const surveyAtDifferentLocation = subject('Survey', {
					createdByUserObjectId: self.userObjectId,
					locationObjectId: location2,
					createdAt: today
				});

				expect(
					ability.cannot(ACTIONS.CASL.READ, surveyAtDifferentLocation)
				).toBe(true);
			});

			test('Manager can update only own surveys at own location created today', () => {
				const ability = defineAbilitiesForUser(
					// makeReq({
					// 	role: ROLES.MANAGER,
					// 	userObjectId: self.userObjectId
					// }),
					ROLES.MANAGER,
					self.userObjectId,
					location1,
					[],
					TEST_TIMEZONE
				);

				const ownSurveyAtOwnLocation = subject('Survey', {
					createdByUserObjectId: self.userObjectId,
					locationObjectId: location1,
					createdAt: today
				});

				expect(
					ability.can(ACTIONS.CASL.UPDATE, ownSurveyAtOwnLocation)
				).toBe(true);
			});

			test('Manager cannot update surveys from other users', () => {
				const ability = defineAbilitiesForUser(
					// makeReq({
					// 	role: ROLES.MANAGER,
					// 	userObjectId: self.userObjectId
					// }),
					ROLES.MANAGER,
					self.userObjectId,
					location1,
					[],
					TEST_TIMEZONE
				);

				const otherUserSurvey = subject('Survey', {
					createdByUserObjectId: otherUser.userObjectId,
					locationObjectId: location1,
					createdAt: today
				});

				expect(
					ability.cannot(ACTIONS.CASL.UPDATE, otherUserSurvey)
				).toBe(true);
			});

			test('Manager cannot delete surveys', () => {
				const ability = defineAbilitiesForUser(
					// makeReq({
					// 	role: ROLES.MANAGER,
					// 	userObjectId: self.userObjectId
					// }),
					ROLES.MANAGER,
					self.userObjectId,
					location1,
					[],
					TEST_TIMEZONE
				);

				expect(
					ability.cannot(ACTIONS.CASL.DELETE, SUBJECTS.SURVEY)
				).toBe(true);
			});
		});
	});

	describe('Volunteer permissions', () => {
		describe('User permissions', () => {
			test('Volunteer can read only self', () => {
				const ability = defineAbilitiesForUser(
					// makeReq({
					// 	role: ROLES.VOLUNTEER,
					// 	userObjectId: self.userObjectId
					// }),
					ROLES.VOLUNTEER,
					self.userObjectId,
					location1,
					[],
					TEST_TIMEZONE
				);

				const selfUser = subject('User', { _id: self.userObjectId });
				const otherUserObj = subject('User', {
					_id: otherUser.userObjectId
				});

				expect(ability.can(ACTIONS.CASL.READ, selfUser)).toBe(true);
				expect(ability.cannot(ACTIONS.CASL.READ, otherUserObj)).toBe(
					true
				);
			});

			test('Volunteer can update own profile fields', () => {
				const ability = defineAbilitiesForUser(
					// makeReq({
					// 	role: ROLES.VOLUNTEER,
					// 	userObjectId: self.userObjectId
					// }),
					ROLES.VOLUNTEER,
					self.userObjectId,
					location1,
					[],
					TEST_TIMEZONE
				);

				const selfUser = subject('User', { _id: self.userObjectId });

				expect(
					ability.can(ACTIONS.CASL.UPDATE, selfUser, 'firstName')
				).toBe(true);
				expect(
					ability.can(ACTIONS.CASL.UPDATE, selfUser, 'lastName')
				).toBe(true);
				expect(
					ability.can(ACTIONS.CASL.UPDATE, selfUser, 'email')
				).toBe(true);
				expect(
					ability.can(ACTIONS.CASL.UPDATE, selfUser, 'phone')
				).toBe(true);
			});

			test('Volunteer cannot update other users', () => {
				const ability = defineAbilitiesForUser(
					// makeReq({
					// 	role: ROLES.VOLUNTEER,
					// 	userObjectId: self.userObjectId
					// }),
					ROLES.VOLUNTEER,
					self.userObjectId,
					location1,
					[],
					TEST_TIMEZONE
				);

				const otherUserObj = subject('User', {
					_id: otherUser.userObjectId
				});

				expect(
					ability.cannot(
						ACTIONS.CASL.UPDATE,
						otherUserObj,
						'firstName'
					)
				).toBe(true);
			});

			test('Volunteer cannot approve anyone', () => {
				const ability = defineAbilitiesForUser(
					// makeReq({
					// 	role: ROLES.VOLUNTEER,
					// 	userObjectId: self.userObjectId
					// }),
					ROLES.VOLUNTEER,
					self.userObjectId,
					location1,
					[],
					TEST_TIMEZONE
				);

				const otherUserObj = subject('User', {
					_id: otherUser.userObjectId
				});

				expect(
					ability.cannot(ACTIONS.CUSTOM.APPROVE, otherUserObj)
				).toBe(true);
			});

			test('Volunteer cannot delete users', () => {
				const ability = defineAbilitiesForUser(
					// makeReq({
					// 	role: ROLES.VOLUNTEER,
					// 	userObjectId: self.userObjectId
					// }),
					ROLES.VOLUNTEER,
					self.userObjectId,
					location1,
					[],
					TEST_TIMEZONE
				);

				expect(ability.cannot(ACTIONS.CASL.DELETE, SUBJECTS.USER)).toBe(
					true
				);
			});
		});

		describe('Survey permissions', () => {
			test('Volunteer can create surveys', () => {
				const ability = defineAbilitiesForUser(
					// makeReq({
					// 	role: ROLES.VOLUNTEER,
					// 	userObjectId: self.userObjectId
					// }),
					ROLES.VOLUNTEER,
					self.userObjectId,
					location1,
					[],
					TEST_TIMEZONE
				);

				expect(ability.can(ACTIONS.CASL.CREATE, SUBJECTS.SURVEY)).toBe(
					true
				);
			});

			test('Volunteer can create surveys without referral', () => {
				const ability = defineAbilitiesForUser(
					// makeReq({
					// 	role: ROLES.VOLUNTEER,
					// 	userObjectId: self.userObjectId
					// }),
					ROLES.VOLUNTEER,
					self.userObjectId,
					location1,
					[],
					TEST_TIMEZONE
				);

				expect(
					ability.can(
						ACTIONS.CUSTOM.CREATE_WITHOUT_REFERRAL,
						SUBJECTS.SURVEY
					)
				).toBe(true);
			});

			test('Volunteer can read only own surveys at own location created today', () => {
				const ability = defineAbilitiesForUser(
					// makeReq({
					// 	role: ROLES.VOLUNTEER,
					// 	userObjectId: self.userObjectId,
					// 	locationObjectId: location1
					// }),
					ROLES.VOLUNTEER,
					self.userObjectId,
					location1,
					[],
					TEST_TIMEZONE
				);

				const ownSurveyAtOwnLocation = subject('Survey', {
					createdByUserObjectId: self.userObjectId,
					locationObjectId: location1,
					createdAt: today
				});

				expect(
					ability.can(ACTIONS.CASL.READ, ownSurveyAtOwnLocation)
				).toBe(true);
			});

			test('Volunteer cannot read surveys from other users', () => {
				const ability = defineAbilitiesForUser(
					// makeReq({
					// 	role: ROLES.VOLUNTEER,
					// 	userObjectId: self.userObjectId
					// }),
					ROLES.VOLUNTEER,
					self.userObjectId,
					location1,
					[],
					TEST_TIMEZONE
				);

				const otherUserSurvey = subject('Survey', {
					createdByUserObjectId: otherUser.userObjectId,
					locationObjectId: location1,
					createdAt: today
				});

				expect(ability.cannot(ACTIONS.CASL.READ, otherUserSurvey)).toBe(
					true
				);
			});

			test('Volunteer can update only own surveys at own location created today', () => {
				const ability = defineAbilitiesForUser(
					// makeReq({
					// 	role: ROLES.VOLUNTEER,
					// 	userObjectId: self.userObjectId,
					// 	locationObjectId: location1
					// }),
					ROLES.VOLUNTEER,
					self.userObjectId,
					location1,
					[],
					TEST_TIMEZONE
				);

				const ownSurveyAtOwnLocation = subject('Survey', {
					createdByUserObjectId: self.userObjectId,
					locationObjectId: location1,
					createdAt: today
				});

				const otherUserSurveyAtSameLocation = subject('Survey', {
					createdByUserObjectId: otherUser.userObjectId,
					locationObjectId: location1, // same location
					createdAt: today // same day
				});

				const ownSurveyAtDifferentLocation = subject('Survey', {
					createdByUserObjectId: self.userObjectId,
					locationObjectId: location2,
					createdAt: today
				});

				const ownSurveyAtSameLocationDifferentDay = subject('Survey', {
					createdByUserObjectId: self.userObjectId,
					locationObjectId: location1,
					createdAt: yesterday
				});

				expect(
					ability.can(ACTIONS.CASL.UPDATE, ownSurveyAtOwnLocation)
				).toBe(true);
				expect(
					ability.cannot(
						ACTIONS.CASL.UPDATE,
						otherUserSurveyAtSameLocation
					)
				).toBe(true);
				expect(
					ability.cannot(
						ACTIONS.CASL.UPDATE,
						ownSurveyAtDifferentLocation
					)
				).toBe(true);
				expect(
					ability.cannot(
						ACTIONS.CASL.UPDATE,
						ownSurveyAtSameLocationDifferentDay
					)
				).toBe(true);
			});

			test('Volunteer cannot update surveys from other users', () => {
			const ability = defineAbilitiesForUser(
				ROLES.VOLUNTEER,
				self.userObjectId,
				location1,
				[],
				TEST_TIMEZONE
			);

				const otherUserSurvey = subject('Survey', {
					createdByUserObjectId: otherUser.userObjectId,
					locationObjectId: location1,
					createdAt: today
				});

				expect(
					ability.cannot(ACTIONS.CASL.UPDATE, otherUserSurvey)
				).toBe(true);
			});

			test('Volunteer cannot delete surveys', () => {
			const ability = defineAbilitiesForUser(
				ROLES.VOLUNTEER,
				self.userObjectId,
				location1,
				[],
				TEST_TIMEZONE
			);

				expect(
					ability.cannot(ACTIONS.CASL.DELETE, SUBJECTS.SURVEY)
				).toBe(true);
			});
		});
	});
});

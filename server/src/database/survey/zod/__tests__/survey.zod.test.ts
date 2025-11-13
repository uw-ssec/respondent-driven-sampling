import { describe, expect, test } from '@jest/globals';
import { Types } from 'mongoose';

import { SYSTEM_SURVEY_CODE } from '../../../utils/constants';
import {
	createSurveySchema,
	readSurveySchema,
	updateSurveySchema
} from '../survey.validator';
import Seed from '../../../seed/mongoose/seed.model';

const validObjectId = new Types.ObjectId().toString();
const validLocationObjectId = new Types.ObjectId().toString();

const validCreateData = {
	surveyCode: '12345678',
	createdByUserObjectId: validObjectId,
	responses: { question1: 'answer1', question2: 'answer2' },
	isCompleted: false,
	coordinates: {
		latitude: 40.7128,
		longitude: -74.006
	},
	locationObjectId: validLocationObjectId
};

describe('Survey Type Validation Schemas', () => {
	describe('createSurveySchema', () => {
		test('should validate valid create survey data', () => {
			const result = createSurveySchema.safeParse(validCreateData);
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data).toEqual(validCreateData);
			}
		});

		test('should reject unexpected fields', () => {
			const invalidData = {
				surveyCode: '123456',
				createdByUserObjectId: validObjectId,
				locationObjectId: validLocationObjectId,
				responses: {
					question1: 'answer1'
				},
				parentSurveyCode: SYSTEM_SURVEY_CODE,
				isCompleted: false,
				childSurveyCodes: ['111111', '222222', '333333']
			};

			const result = createSurveySchema.safeParse(invalidData);
			expect(result.success).toBe(false);
		});

		test('should reject invalid survey code length', () => {
			const invalidData = {
				...validCreateData,
				surveyCode: '12345' // Too short
			};

			const result = createSurveySchema.safeParse(invalidData);
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0].message).toContain(
					'exactly 8 characters'
				);
			}
		});

		test('should reject invalid coordinates', () => {
			const invalidData = {
				...validCreateData,
				coordinates: {
					latitude: 91, // Invalid latitude
					longitude: -74.006
				}
			};

			const result = createSurveySchema.safeParse(invalidData);
			expect(result.success).toBe(false);
		});

		test('should reject invalid location objectId', () => {
			const invalidData = {
				...validCreateData,
				locationObjectId: 'invalid-object-id'
			};

			const result = createSurveySchema.safeParse(invalidData);
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0].message).toContain(
					'Invalid location objectId'
				);
			}
		});

	test('should accept minimal required fields', () => {
		const minimalData = {
			surveyCode: '12345678',
			createdByUserObjectId: validObjectId,
			locationObjectId: validLocationObjectId,
			responses: { question1: 'answer1', question2: 'answer2' }
		};

		const result = createSurveySchema.safeParse(minimalData);
		expect(result.success).toBe(true);
	});

	test('should accept parentSurveyCode when it is SYSTEM_SURVEY_CODE', () => {
		const seedSurveyData = {
			...validCreateData,
			parentSurveyCode: SYSTEM_SURVEY_CODE
		};

		const result = createSurveySchema.safeParse(seedSurveyData);
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.parentSurveyCode).toBe(SYSTEM_SURVEY_CODE);
		}
	});

	test('should reject parentSurveyCode when it is not SYSTEM_SURVEY_CODE', () => {
		const nonSeedSurveyData = {
			...validCreateData,
			parentSurveyCode: 'ABCD1234' // Regular survey code
		};

		const result = createSurveySchema.safeParse(nonSeedSurveyData);
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues[0].message).toContain(
				'Cannot create a survey with a pre-defined parentSurveyCode'
			);
			expect(result.error.issues[0].path).toEqual(['parentSurveyCode']);
		}
	});
});

	describe('updateSurveySchema', () => {
		const validUpdateData = {
			responses: {
				question1: 'updated answer',
				question2: 'another answer'
			},
			isCompleted: true
		};

		test('should validate valid update data', () => {
			const result = updateSurveySchema.safeParse(validUpdateData);
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data).toEqual(validUpdateData);
			}
		});

		test('should validate with only responses', () => {
			const responsesOnly = {
				responses: { question1: 'answer' }
			};

			const result = updateSurveySchema.safeParse(responsesOnly);
			expect(result.success).toBe(true);
		});

		test('should reject empty responses object', () => {
			const invalidData = {
				responses: {}
			};

			const result = updateSurveySchema.safeParse(invalidData);
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0].message).toContain(
					'at least one response'
				);
			}
		});

		test('should reject invalid isCompleted type', () => {
			const invalidData = {
				responses: { question1: 'answer' },
				isCompleted: 'true' // Should be boolean
			};

			const result = updateSurveySchema.safeParse(invalidData);
			expect(result.success).toBe(false);
		});

		test('should reject invalid responses type', () => {
			const invalidData = {
				responses: 'not an object',
				isCompleted: true
			};

			const result = updateSurveySchema.safeParse(invalidData);
			expect(result.success).toBe(false);
		});
	});

	describe('readSurveySchema', () => {
		test('should validate with all optional filters', () => {
			const validData = {
				createdByUserObjectId: validObjectId,
				locationObjectId: validLocationObjectId,
				isCompleted: true,
				parentSurveyCode: '12345678',
				createdAt: new Date('2023-01-01'),
				updatedAt: new Date('2023-01-02')
			};

			const result = readSurveySchema.safeParse(validData);
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data).toEqual(validData);
			}
		});

		test('should validate with no filters (empty object)', () => {
			const emptyData = {};

			const result = readSurveySchema.safeParse(emptyData);
			expect(result.success).toBe(true);
		});

		test('should validate with partial filters', () => {
			const partialData = {
				isCompleted: false,
				locationObjectId: validLocationObjectId
			};

			const result = readSurveySchema.safeParse(partialData);
			expect(result.success).toBe(true);
		});

		test('should reject invalid user objectId', () => {
			const invalidData = {
				createdByUserObjectId: 'invalid-id'
			};

			const result = readSurveySchema.safeParse(invalidData);
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0].message).toContain(
					'Invalid user objectId'
				);
			}
		});

		test('should reject invalid location objectId', () => {
			const invalidData = {
				locationObjectId: 'invalid-id'
			};

			const result = readSurveySchema.safeParse(invalidData);
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0].message).toContain(
					'Invalid location objectId'
				);
			}
		});

		test('should reject invalid isCompleted type', () => {
			const invalidData = {
				isCompleted: 'true' // Should be boolean
			};

			const result = readSurveySchema.safeParse(invalidData);
			expect(result.success).toBe(false);
		});

		test('should reject invalid date format', () => {
			const invalidData = {
				createdAt: 'not-a-date'
			};

			const result = readSurveySchema.safeParse(invalidData);
			expect(result.success).toBe(false);
		});

		test('should accept valid date strings', () => {
			const validData = {
				createdAt: '2023-01-01T00:00:00.000Z',
				updatedAt: '2023-01-02T00:00:00.000Z'
			};

			const result = readSurveySchema.safeParse(validData);
			expect(result.success).toBe(true);
		});

		test('should accept Date objects', () => {
			const validData = {
				createdAt: new Date('2023-01-01'),
				updatedAt: new Date('2023-01-02')
			};

			const result = readSurveySchema.safeParse(validData);
			expect(result.success).toBe(true);
		});
	});
});

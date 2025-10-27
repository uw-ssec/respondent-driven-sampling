import { describe, expect, test } from '@jest/globals';
import { Types } from 'mongoose';

import { createSeedSchema } from '../seed.validator';

const validObjectId = new Types.ObjectId().toString();

const validCreateData = {
	locationObjectId: validObjectId,
	isFallback: false
};

describe('Seed Type Validation Schemas', () => {
	describe('createSeedSchema', () => {
		test('should validate valid create seed data', () => {
			const result = createSeedSchema.safeParse(validCreateData);
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data).toEqual(validCreateData);
			}
		});

		test('should validate with minimal required fields (only locationObjectId)', () => {
			const minimalData = {
				locationObjectId: validObjectId
			};

			const result = createSeedSchema.safeParse(minimalData);
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.locationObjectId).toBe(validObjectId);
				expect(result.data.isFallback).toBe(false); // Should default to false
			}
		});

		test('should validate with isFallback true', () => {
			const dataWithFallback = {
				locationObjectId: validObjectId,
				isFallback: true
			};

			const result = createSeedSchema.safeParse(dataWithFallback);
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data).toEqual(dataWithFallback);
			}
		});

		test('should reject missing required locationObjectId', () => {
			const invalidData = {
				isFallback: true
			};

			const result = createSeedSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0].message).toContain(
					'Invalid input'
				);
			}
		});

		test('should reject invalid locationObjectId format', () => {
			const invalidData = {
				locationObjectId: 'invalid-object-id',
				isFallback: false
			};

			const result = createSeedSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0].message).toContain(
					'Invalid location objectId'
				);
			}
		});

		test('should reject empty locationObjectId', () => {
			const invalidData = {
				locationObjectId: '',
				isFallback: false
			};

			const result = createSeedSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
		});

		test('should reject invalid isFallback type', () => {
			const invalidData = {
				locationObjectId: validObjectId,
				isFallback: 'true' // Should be boolean
			};

			const result = createSeedSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
		});

		test('should reject invalid isFallback type (number)', () => {
			const invalidData = {
				locationObjectId: validObjectId,
				isFallback: 1 // Should be boolean
			};

			const result = createSeedSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
		});

		test('should reject unexpected fields', () => {
			const invalidData = {
				locationObjectId: validObjectId,
				isFallback: false,
				surveyCode: '123456', // Not allowed in create schema
				extraField: 'not allowed'
			};

			const result = createSeedSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
		});

		test('should handle valid ObjectId with different formats', () => {
			const validObjectId2 = new Types.ObjectId().toString();
			const data = {
				locationObjectId: validObjectId2,
				isFallback: true
			};

			const result = createSeedSchema.safeParse(data);
			expect(result.success).toBe(true);
		});
	});
});

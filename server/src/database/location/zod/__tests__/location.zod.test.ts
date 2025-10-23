import { describe, expect, test } from '@jest/globals';

import { HubType, LocationType } from '../../../utils/constants';
import {
	createLocationSchema,
	updateLocationSchema
} from '../location.validator';

const validCreateData = {
	hubName: 'Test Hub',
	hubType: HubType.ESTABLISHMENT,
	locationType: LocationType.ROOFTOP,
	address: '123 Main St, City, State 12345'
};

describe('Location Type Validation Schemas', () => {
	describe('createLocationSchema', () => {
		test('should validate valid create location data', () => {
			const result = createLocationSchema.safeParse(validCreateData);
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data).toEqual(validCreateData);
			}
		});

		test('should reject unexpected fields', () => {
			const invalidData = {
				...validCreateData,
				extraField: 'not allowed',
				anotherField: 123
			};

			const result = createLocationSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
		});

		test('should reject missing required fields', () => {
			const invalidData = {
				hubName: 'Test Hub',
				hubType: HubType.ESTABLISHMENT
				// Missing locationType and address
			};

			const result = createLocationSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
		});

		test('should reject empty hubName', () => {
			const invalidData = {
				...validCreateData,
				hubName: ''
			};

			const result = createLocationSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0].message).toContain(
					'Hub name cannot be empty'
				);
			}
		});

		test('should reject whitespace-only hubName', () => {
			const invalidData = {
				...validCreateData,
				hubName: '   '
			};

			const result = createLocationSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
		});

		test('should reject empty address', () => {
			const invalidData = {
				...validCreateData,
				address: ''
			};

			const result = createLocationSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0].message).toContain(
					'Address cannot be empty'
				);
			}
		});

		test('should reject whitespace-only address', () => {
			const invalidData = {
				...validCreateData,
				address: '   '
			};

			const result = createLocationSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
		});

		test('should reject invalid hubType', () => {
			const invalidData = {
				...validCreateData,
				hubType: 'INVALID_HUB_TYPE'
			};

			const result = createLocationSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
		});

		test('should reject invalid locationType', () => {
			const invalidData = {
				...validCreateData,
				locationType: 'INVALID_LOCATION_TYPE'
			};

			const result = createLocationSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
		});

		test('should reject non-string hubName', () => {
			const invalidData = {
				...validCreateData,
				hubName: 123
			};

			const result = createLocationSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
		});

		test('should reject non-string address', () => {
			const invalidData = {
				...validCreateData,
				address: 123
			};

			const result = createLocationSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
		});
	});

	describe('updateLocationSchema', () => {
		test('should validate valid update data with all fields', () => {
			const validUpdateData = {
				hubName: 'Updated Hub',
				hubType: HubType.CHURCH,
				locationType: LocationType.APPROXIMATE,
				address: '456 Updated St'
			};

			const result = updateLocationSchema.safeParse(validUpdateData);
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data).toEqual(validUpdateData);
			}
		});

		test('should validate with only hubName', () => {
			const hubNameOnly = {
				hubName: 'New Hub Name'
			};

			const result = updateLocationSchema.safeParse(hubNameOnly);
			expect(result.success).toBe(true);
		});

		test('should validate with only hubType', () => {
			const hubTypeOnly = {
				hubType: HubType.PREMISE
			};

			const result = updateLocationSchema.safeParse(hubTypeOnly);
			expect(result.success).toBe(true);
		});

		test('should validate with only locationType', () => {
			const locationTypeOnly = {
				locationType: LocationType.APPROXIMATE
			};

			const result = updateLocationSchema.safeParse(locationTypeOnly);
			expect(result.success).toBe(true);
		});

		test('should validate with only address', () => {
			const addressOnly = {
				address: 'New Address'
			};

			const result = updateLocationSchema.safeParse(addressOnly);
			expect(result.success).toBe(true);
		});

		test('should validate with partial fields', () => {
			const partialData = {
				hubName: 'Updated Hub',
				address: 'New Address'
			};

			const result = updateLocationSchema.safeParse(partialData);
			expect(result.success).toBe(true);
		});

		test('should validate empty object', () => {
			const emptyData = {};

			const result = updateLocationSchema.safeParse(emptyData);
			expect(result.success).toBe(true);
		});

		test('should reject unexpected fields', () => {
			const invalidData = {
				hubName: 'Updated Hub',
				extraField: 'not allowed'
			};

			const result = updateLocationSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
		});

		test('should reject empty hubName', () => {
			const invalidData = {
				hubName: ''
			};

			const result = updateLocationSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
		});

		test('should reject empty address', () => {
			const invalidData = {
				address: ''
			};

			const result = updateLocationSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
		});

		test('should reject invalid hubType', () => {
			const invalidData = {
				hubType: 'INVALID_HUB_TYPE'
			};

			const result = updateLocationSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
		});

		test('should reject invalid locationType', () => {
			const invalidData = {
				locationType: 'INVALID_LOCATION_TYPE'
			};

			const result = updateLocationSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
		});

		test('should reject non-string hubName', () => {
			const invalidData = {
				hubName: 123
			};

			const result = updateLocationSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
		});

		test('should reject non-string address', () => {
			const invalidData = {
				address: 123
			};

			const result = updateLocationSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
		});
	});
});

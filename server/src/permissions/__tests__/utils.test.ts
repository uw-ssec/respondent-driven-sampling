import { describe, expect, test, jest, beforeEach, afterEach } from '@jest/globals';

import { isToday } from '../utils';

describe('isToday', () => {
	describe('UTC timezone', () => {
		test('returns correct date range for UTC timezone', () => {
			const result = isToday('createdAt', 'UTC');

			const startOfDay = result.createdAt.$gte;
			const endOfDay = result.createdAt.$lte;

			// Start of day should be at midnight UTC (00:00:00.000)
			expect(startOfDay.getUTCHours()).toBe(0);
			expect(startOfDay.getUTCMinutes()).toBe(0);
			expect(startOfDay.getUTCSeconds()).toBe(0);
			expect(startOfDay.getUTCMilliseconds()).toBe(0);

			// End of day should be at 23:59:59.999 UTC
			expect(endOfDay.getUTCHours()).toBe(23);
			expect(endOfDay.getUTCMinutes()).toBe(59);
			expect(endOfDay.getUTCSeconds()).toBe(59);
			expect(endOfDay.getUTCMilliseconds()).toBe(999);
		});

		test('start and end are on the same UTC day', () => {
			const result = isToday('createdAt', 'UTC');

			const startOfDay = result.createdAt.$gte;
			const endOfDay = result.createdAt.$lte;

			expect(startOfDay.getUTCFullYear()).toBe(endOfDay.getUTCFullYear());
			expect(startOfDay.getUTCMonth()).toBe(endOfDay.getUTCMonth());
			expect(startOfDay.getUTCDate()).toBe(endOfDay.getUTCDate());
		});
	});

	describe('date matching behavior', () => {
		test('current time falls within the range', () => {
			const result = isToday('createdAt', 'UTC');
			const now = new Date();

			// Create a UTC date for "now" at midnight
			const todayUtcMidnight = new Date(
				Date.UTC(
					now.getUTCFullYear(),
					now.getUTCMonth(),
					now.getUTCDate(),
					0,
					0,
					0,
					0
				)
			);

			// The start of day should match today's midnight in UTC
			expect(result.createdAt.$gte.getTime()).toBe(
				todayUtcMidnight.getTime()
			);
		});
	});

	describe('DST transitions', () => {
		beforeEach(() => {
			jest.useFakeTimers();
		});

		afterEach(() => {
			jest.useRealTimers();
		});

		describe('spring forward (March 10, 2024 - clocks skip 2 AM to 3 AM)', () => {
			test('handles day of spring forward in Pacific timezone', () => {
				// March 10, 2024 at 12:00 PM UTC (4 AM PDT after spring forward)
				jest.setSystemTime(new Date('2024-03-10T12:00:00Z'));

				const result = isToday('createdAt', 'America/Los_Angeles');

				const startOfDay = result.createdAt.$gte;
				const endOfDay = result.createdAt.$lte;

				// Day should still span ~24 hours even with DST transition
				const diffMs = endOfDay.getTime() - startOfDay.getTime();
				const diffHours = diffMs / (1000 * 60 * 60);
				expect(diffHours).toBeCloseTo(24, 0);

				// Function uses noon's offset (PDT, UTC-7) for the whole day
				// So midnight March 10 = 7 AM UTC (not 8 AM as it would be in PST)
				expect(startOfDay.toISOString()).toBe('2024-03-10T07:00:00.000Z');
			});

			test('handles day before spring forward', () => {
				// March 9, 2024 at 12:00 PM UTC
				jest.setSystemTime(new Date('2024-03-09T12:00:00Z'));

				const result = isToday('createdAt', 'America/Los_Angeles');

				// Start should be March 9 midnight Pacific (8 AM UTC, PST is UTC-8)
				expect(result.createdAt.$gte.toISOString()).toBe(
					'2024-03-09T08:00:00.000Z'
				);
			});

			test('handles day after spring forward', () => {
				// March 11, 2024 at 12:00 PM UTC
				jest.setSystemTime(new Date('2024-03-11T12:00:00Z'));

				const result = isToday('createdAt', 'America/Los_Angeles');

				// Start should be March 11 midnight Pacific (7 AM UTC, PDT is UTC-7)
				expect(result.createdAt.$gte.toISOString()).toBe(
					'2024-03-11T07:00:00.000Z'
				);
			});
		});

		describe('fall back (November 3, 2024 - clocks repeat 1 AM to 2 AM)', () => {
			test('handles day of fall back in Pacific timezone', () => {
				// November 3, 2024 at 12:00 PM UTC (4 AM PST after fall back)
				jest.setSystemTime(new Date('2024-11-03T12:00:00Z'));

				const result = isToday('createdAt', 'America/Los_Angeles');

				const startOfDay = result.createdAt.$gte;
				const endOfDay = result.createdAt.$lte;

				// Day should still span ~24 hours even with DST transition
				const diffMs = endOfDay.getTime() - startOfDay.getTime();
				const diffHours = diffMs / (1000 * 60 * 60);
				expect(diffHours).toBeCloseTo(24, 0);

				// Function uses noon's offset (PST, UTC-8) for the whole day
				// So midnight November 3 = 8 AM UTC (not 7 AM as it would be in PDT)
				expect(startOfDay.toISOString()).toBe('2024-11-03T08:00:00.000Z');
			});

			test('handles day before fall back', () => {
				// November 2, 2024 at 12:00 PM UTC
				jest.setSystemTime(new Date('2024-11-02T12:00:00Z'));

				const result = isToday('createdAt', 'America/Los_Angeles');

				// Start should be November 2 midnight Pacific (7 AM UTC, PDT is UTC-7)
				expect(result.createdAt.$gte.toISOString()).toBe(
					'2024-11-02T07:00:00.000Z'
				);
			});

			test('handles day after fall back', () => {
				// November 4, 2024 at 12:00 PM UTC
				jest.setSystemTime(new Date('2024-11-04T12:00:00Z'));

				const result = isToday('createdAt', 'America/Los_Angeles');

				// Start should be November 4 midnight Pacific (8 AM UTC, PST is UTC-8)
				expect(result.createdAt.$gte.toISOString()).toBe(
					'2024-11-04T08:00:00.000Z'
				);
			});
		});

		describe('edge cases near midnight during DST', () => {
			test('handles time just before midnight on spring forward day', () => {
				// March 10, 2024 at 7:59 AM UTC (11:59 PM PST on March 9)
				jest.setSystemTime(new Date('2024-03-10T07:59:00Z'));

				const result = isToday('createdAt', 'America/Los_Angeles');

				// Should be March 9 in Pacific time
				expect(result.createdAt.$gte.toISOString()).toBe(
					'2024-03-09T08:00:00.000Z'
				);
			});

			test('handles time just after midnight on spring forward day', () => {
				// March 10, 2024 at 8:01 AM UTC (1:01 AM PDT on March 10, after spring forward)
				jest.setSystemTime(new Date('2024-03-10T08:01:00Z'));

				const result = isToday('createdAt', 'America/Los_Angeles');

				// Function uses noon's offset (PDT, UTC-7), so midnight = 7 AM UTC
				expect(result.createdAt.$gte.toISOString()).toBe(
				'2024-03-10T07:00:00.000Z'
				);
			});
		});
	});
});

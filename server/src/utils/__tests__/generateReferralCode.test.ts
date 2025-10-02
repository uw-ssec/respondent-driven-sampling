import { describe, expect, it } from '@jest/globals';
import generateReferralCode from '../generateReferralCode';

describe('generateReferralCode', () => {
	it('should generate a referral code', () => {
		const code = generateReferralCode();
		expect(code).toBeDefined();
		expect(typeof code).toBe('string');
	});

	it('should generate an 8-character code', () => {
		const code = generateReferralCode();
		expect(code).toHaveLength(8);
	});

	it('should generate uppercase alphanumeric characters only', () => {
		const code = generateReferralCode();
		expect(code).toMatch(/^[A-Z0-9]{8}$/);
	});

	it('should generate unique codes', () => {
		const code1 = generateReferralCode();
		const code2 = generateReferralCode();
		expect(code1).not.toBe(code2);
	});

	it('should generate multiple unique codes', () => {
		const codes = Array.from({ length: 100 }, () => generateReferralCode());
		const uniqueCodes = new Set(codes);
		expect(uniqueCodes.size).toBe(codes.length);
	});
});

import { describe, expect, it, beforeAll, afterAll, jest } from '@jest/globals';
import jwt from 'jsonwebtoken';

// Mock environment variable for testing
const TEST_SECRET = 'test-secret-key';
const originalEnv = process.env.AUTH_SECRET;

// Set environment variable before import
process.env.AUTH_SECRET = TEST_SECRET;

import { generateAuthToken, verifyAuthToken } from '../authTokenHandler';

describe('authTokenHandler', () => {
	beforeAll(() => {
		process.env.AUTH_SECRET = TEST_SECRET;
	});

	afterAll(() => {
		process.env.AUTH_SECRET = originalEnv;
	});

	describe('generateAuthToken', () => {
		it('should generate a valid JWT token', () => {
			const token = generateAuthToken('John', 'Admin', 'EMP1234');
			expect(token).toBeDefined();
			expect(typeof token).toBe('string');
			expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
		});

		it('should include user data in the token payload', () => {
			const firstName = 'John';
			const role = 'Admin';
			const employeeId = 'EMP1234';
			
			const token = generateAuthToken(firstName, role, employeeId);
			const decoded = jwt.verify(token, TEST_SECRET) as any;
			
			expect(decoded.firstName).toBe(firstName);
			expect(decoded.role).toBe(role);
			expect(decoded.employeeId).toBe(employeeId);
		});

		it('should set token expiration to 12 hours', () => {
			const token = generateAuthToken('John', 'Admin', 'EMP1234');
			const decoded = jwt.verify(token, TEST_SECRET) as any;
			
			expect(decoded.exp).toBeDefined();
			expect(decoded.iat).toBeDefined();
			
			// Check that expiration is approximately 12 hours from issue time
			const expirationTime = decoded.exp - decoded.iat;
			expect(expirationTime).toBe(12 * 60 * 60); // 12 hours in seconds
		});
	});

	describe('verifyAuthToken', () => {
		it('should verify a valid token', () => {
			const token = generateAuthToken('John', 'Admin', 'EMP1234');
			const decoded = verifyAuthToken(token);
			
			expect(decoded).toBeDefined();
			expect(decoded.firstName).toBe('John');
			expect(decoded.role).toBe('Admin');
			expect(decoded.employeeId).toBe('EMP1234');
		});

		it('should throw error for invalid token', () => {
			const invalidToken = 'invalid.token.here';
			
			expect(() => {
				verifyAuthToken(invalidToken);
			}).toThrow();
		});

		it('should throw error for token with wrong secret', () => {
			const token = jwt.sign(
				{ firstName: 'John', role: 'Admin', employeeId: 'EMP1234' },
				'wrong-secret',
				{ expiresIn: '12h' }
			);
			
			expect(() => {
				verifyAuthToken(token);
			}).toThrow();
		});

		it('should throw error for expired token', () => {
			const expiredToken = jwt.sign(
				{ firstName: 'John', role: 'Admin', employeeId: 'EMP1234' },
				TEST_SECRET,
				{ expiresIn: '-1s' } // Already expired
			);
			
			expect(() => {
				verifyAuthToken(expiredToken);
			}).toThrow();
		});
	});
});
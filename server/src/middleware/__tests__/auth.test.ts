import {
	afterAll,
	beforeAll,
	beforeEach,
	describe,
	expect,
	it,
	jest
} from '@jest/globals';
import { NextFunction, Request, Response } from 'express';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

import User from '../../models/users';
import { AuthenticatedRequest } from '../../types/auth';
import { generateAuthToken } from '../../utils/authTokenHandler';
import { auth } from '../auth';

// Mock environment variable for testing
const TEST_SECRET = 'test-secret-key';
const originalEnv = process.env.AUTH_SECRET;

describe('Auth Middleware', () => {
	let mongoServer: MongoMemoryServer;
	let mockReq: Partial<AuthenticatedRequest>;
	let mockRes: Partial<Response>;
	let mockNext: jest.MockedFunction<NextFunction>;

	beforeAll(async () => {
		process.env.AUTH_SECRET = TEST_SECRET;
		mongoServer = await MongoMemoryServer.create();
		const mongoUri = mongoServer.getUri();
		await mongoose.connect(mongoUri);
	});

	afterAll(async () => {
		process.env.AUTH_SECRET = originalEnv;
		await mongoose.disconnect();
		await mongoServer.stop();
	});

	beforeEach(async () => {
		await User.deleteMany({});

		mockReq = {
			headers: {}
		};
		mockRes = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn().mockReturnThis()
		};
		mockNext = jest.fn() as jest.MockedFunction<NextFunction>;

		// Mock console.log to prevent test output noise
		jest.spyOn(console, 'log').mockImplementation(() => {});
	});

	it('should pass authentication for valid token and approved user', async () => {
		// Create an approved user
		const user = new User({
			firstName: 'John',
			lastName: 'Doe',
			email: 'john@example.com',
			phone: '+1234567890',
			role: 'Volunteer',
			approvalStatus: 'Approved'
		});
		await user.save();

		// Generate valid token
		const token = generateAuthToken(
			user.firstName,
			user.role,
			user.employeeId
		);
		mockReq.headers = {
			authorization: `Bearer ${token}`
		};

		await auth(
			mockReq as AuthenticatedRequest,
			mockRes as Response,
			mockNext
		);

		expect(mockNext).toHaveBeenCalled();
		expect(mockReq.user).toBeDefined();
		expect(mockReq.user?.employeeId).toBe(user.employeeId);
		expect(mockReq.user?.role).toBe(user.role);
	});

	it('should reject request when no token provided', async () => {
		mockReq.headers = {};

		await auth(
			mockReq as AuthenticatedRequest,
			mockRes as Response,
			mockNext
		);

		expect(mockRes.status).toHaveBeenCalledWith(401);
		expect(mockRes.json).toHaveBeenCalledWith({
			message: 'Access denied. No token provided'
		});
		expect(mockNext).not.toHaveBeenCalled();
	});

	it('should reject request when authorization header is malformed', async () => {
		mockReq.headers = {
			authorization: 'InvalidFormat'
		};

		await auth(
			mockReq as AuthenticatedRequest,
			mockRes as Response,
			mockNext
		);

		expect(mockRes.status).toHaveBeenCalledWith(401);
		expect(mockRes.json).toHaveBeenCalledWith({
			message: expect.stringContaining('Invalid Token')
		});
		expect(mockNext).not.toHaveBeenCalled();
	});

	it('should reject request with invalid token', async () => {
		mockReq.headers = {
			authorization: 'Bearer invalid.token.here'
		};

		await auth(
			mockReq as AuthenticatedRequest,
			mockRes as Response,
			mockNext
		);

		expect(mockRes.status).toHaveBeenCalledWith(401);
		expect(mockRes.json).toHaveBeenCalledWith({
			message: expect.stringContaining('Invalid Token')
		});
		expect(mockNext).not.toHaveBeenCalled();
	});

	it('should reject request when user does not exist in database', async () => {
		// Generate token for non-existent user
		const token = generateAuthToken('John', 'Volunteer', 'EMP9999');
		mockReq.headers = {
			authorization: `Bearer ${token}`
		};

		await auth(
			mockReq as AuthenticatedRequest,
			mockRes as Response,
			mockNext
		);

		expect(mockRes.status).toHaveBeenCalledWith(400);
		expect(mockRes.json).toHaveBeenCalledWith({
			message: 'User account not found. Please contact your admin.'
		});
		expect(mockNext).not.toHaveBeenCalled();
	});

	it('should reject request when user is not approved', async () => {
		// Create a pending user
		const user = new User({
			firstName: 'John',
			lastName: 'Doe',
			email: 'john@example.com',
			phone: '+1234567890',
			role: 'Volunteer',
			approvalStatus: 'Pending'
		});
		await user.save();

		const token = generateAuthToken(
			user.firstName,
			user.role,
			user.employeeId
		);
		mockReq.headers = {
			authorization: `Bearer ${token}`
		};

		await auth(
			mockReq as AuthenticatedRequest,
			mockRes as Response,
			mockNext
		);

		expect(mockRes.status).toHaveBeenCalledWith(403);
		expect(mockRes.json).toHaveBeenCalledWith({
			message: 'User account not approved yet. Please contact your admin.'
		});
		expect(mockNext).not.toHaveBeenCalled();
	});

	it('should reject request when user is rejected', async () => {
		// Create a rejected user
		const user = new User({
			firstName: 'John',
			lastName: 'Doe',
			email: 'john@example.com',
			phone: '+1234567890',
			role: 'Volunteer',
			approvalStatus: 'Rejected'
		});
		await user.save();

		const token = generateAuthToken(
			user.firstName,
			user.role,
			user.employeeId
		);
		mockReq.headers = {
			authorization: `Bearer ${token}`
		};

		await auth(
			mockReq as AuthenticatedRequest,
			mockRes as Response,
			mockNext
		);

		expect(mockRes.status).toHaveBeenCalledWith(403);
		expect(mockRes.json).toHaveBeenCalledWith({
			message: 'User account not approved yet. Please contact your admin.'
		});
		expect(mockNext).not.toHaveBeenCalled();
	});

	it('should handle bearer token with correct format', async () => {
		// Create an approved user
		const user = new User({
			firstName: 'John',
			lastName: 'Doe',
			email: 'john@example.com',
			phone: '+1234567890',
			role: 'Admin',
			approvalStatus: 'Approved'
		});
		await user.save();

		const token = generateAuthToken(
			user.firstName,
			user.role,
			user.employeeId
		);
		mockReq.headers = {
			authorization: `Bearer ${token}`
		};

		await auth(
			mockReq as AuthenticatedRequest,
			mockRes as Response,
			mockNext
		);

		expect(mockNext).toHaveBeenCalled();
		expect(mockReq.user?.role).toBe('Admin');
	});
});

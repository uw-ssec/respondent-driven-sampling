import {
	afterAll,
	beforeAll,
	beforeEach,
	describe,
	expect,
	test
} from '@jest/globals';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

import {
	ACTIONS,
	CONDITIONS,
	SUBJECTS
} from '../../../../permissions/constants';
import Location from '../../../location/mongoose/location.model';
import {
	ApprovalStatus,
	HubType,
	LocationType,
	Role
} from '../../../utils/constants';
import User from '../user.model';

describe('User Model', () => {
	let mongoServer: MongoMemoryServer;
	let testLocation: any;
	let adminUser: any;

	beforeAll(async () => {
		// Connect once at the start
		mongoServer = await MongoMemoryServer.create();
		await mongoose.connect(mongoServer.getUri());
	});

	afterAll(async () => {
		// Disconnect once at the end
		await mongoose.connection.close();
		await mongoServer.stop();
	});

	beforeEach(async () => {
		// Clear the database before each test
		await User.deleteMany({});
		await Location.deleteMany({});

		// Create a test location for each test
		const location = new Location({
			hubName: 'Test Hub',
			hubType: HubType.ESTABLISHMENT,
			locationType: LocationType.ROOFTOP,
			address: '123 Test St'
		});
		testLocation = await location.save();

		// Create an admin user for approval references
		const adminData = {
			firstName: 'Admin',
			lastName: 'User',
			email: 'admin@test.com',
			phone: '1234567890',
			role: Role.ADMIN,
			approvalStatus: ApprovalStatus.APPROVED,
			approvedByUserObjectId: new mongoose.Types.ObjectId(),
			locationObjectId: testLocation._id,
			permissions: []
		};

		adminUser = await User.insertMany([adminData]);
		adminUser = adminUser[0];
	});

	// Test schema validation
	test('valid user creation (basic)', async () => {
		const validUser = {
			firstName: 'John',
			lastName: 'Doe',
			email: 'john@example.com',
			phone: '0000000000',
			role: Role.VOLUNTEER,
			approvalStatus: ApprovalStatus.PENDING,
			approvedByUserObjectId: adminUser._id,
			locationObjectId: testLocation._id,
			permissions: []
		};

		const user = new User(validUser);
		const savedUser = await user.save();

		expect(savedUser._id).toBeDefined();
		expect(savedUser.firstName).toBe('John');
		expect(savedUser.lastName).toBe('Doe');
		expect(savedUser.email).toBe('john@example.com');
		expect(savedUser.phone).toBe('0000000000');
		expect(savedUser.role).toBe(Role.VOLUNTEER);
		expect(savedUser.approvalStatus).toBe(ApprovalStatus.PENDING);
		expect(savedUser.approvedByUserObjectId).toEqual(adminUser._id);
		expect(savedUser.locationObjectId).toEqual(testLocation._id);
		expect(savedUser.permissions).toEqual([]);
		expect(savedUser.createdAt).toBeDefined();
		expect(savedUser.updatedAt).toBeDefined();
	});

	test('invalid user - missing required fields', async () => {
		const invalidUser = {
			firstName: 'John'
			// Missing lastName, email, phone, role, approval, locationObjectId
		};

		const user = new User(invalidUser);
		await expect(user.save()).rejects.toThrow();
	});

	test('invalid user - invalid role', async () => {
		const invalidUser = {
			firstName: 'John',
			lastName: 'Doe',
			email: 'john@example.com',
			phone: '0000000000',
			role: 'INVALID_ROLE',
			approvalStatus: ApprovalStatus.PENDING,
			approvedByUserObjectId: adminUser._id,
			locationObjectId: testLocation._id
		};

		const user = new User(invalidUser);
		await expect(user.save()).rejects.toThrow();
	});

	test('invalid user - invalid approval status', async () => {
		const invalidUser = {
			firstName: 'John',
			lastName: 'Doe',
			email: 'john@example.com',
			phone: '0000000000',
			role: Role.VOLUNTEER,
			approvalStatus: 'INVALID_STATUS',
			approvedByUserObjectId: adminUser._id,
			locationObjectId: testLocation._id
		};

		const user = new User(invalidUser);
		await expect(user.save()).rejects.toThrow();
	});

	// Test uniqueness constraints
	test('duplicate email should fail', async () => {
		const userData = {
			firstName: 'John',
			lastName: 'Doe',
			email: 'john@example.com',
			phone: '0000000000',
			role: Role.VOLUNTEER,
			approvalStatus: ApprovalStatus.PENDING,
			approvedByUserObjectId: adminUser._id,
			locationObjectId: testLocation._id
		};

		// Create first user
		const user1 = new User(userData);
		await user1.save();

		// Try to create second user with same email
		const user2 = new User({
			...userData,
			phone: '0987654321' // Different phone
		});

		await expect(user2.save()).rejects.toThrow();
	});

	// Test uniqueness constraints
	test('duplicate phone should fail', async () => {
		const userData = {
			firstName: 'John',
			lastName: 'Doe',
			email: 'john@example.com',
			phone: '0000000000',
			role: Role.VOLUNTEER,
			approvalStatus: ApprovalStatus.PENDING,
			approvedByUserObjectId: adminUser._id,
			locationObjectId: testLocation._id
		};

		// Create first user
		const user1 = new User(userData);
		await user1.save();

		// Try to create second user with same phone
		const user2 = new User({
			...userData,
			email: 'jane@example.com' // Different email
		});

		await expect(user2.save()).rejects.toThrow();
	});

	// Test default values
	test('default values are set correctly', async () => {
		const userData = {
			firstName: 'John',
			lastName: 'Doe',
			email: 'john@example.com',
			phone: '0000000000',
			role: Role.VOLUNTEER,
			// Not providing approvalStatus - should default to PENDING
			// Not providing approvedByUserObjectId - should default to null
			locationObjectId: testLocation._id
			// Not providing permissions - should default to []
		};

		const user = new User(userData);
		const savedUser = await user.save();

		expect(savedUser.approvalStatus).toBe(ApprovalStatus.PENDING);
		expect(savedUser.permissions).toEqual([]);
		expect(savedUser.approvedByUserObjectId).toBeNull();
		expect(savedUser.deletedAt).toBeNull();
	});

	// Test timestamps
	test('automatic timestamps', async () => {
		const userData = {
			firstName: 'John',
			lastName: 'Doe',
			email: 'john@example.com',
			phone: '0000000000',
			role: Role.VOLUNTEER,
			approvalStatus: ApprovalStatus.PENDING,
			approvedByUserObjectId: adminUser._id,
			locationObjectId: testLocation._id
		};

		const user = new User(userData);
		const savedUser = await user.save();

		expect(savedUser.createdAt).toBeDefined();
		expect(savedUser.updatedAt).toBeDefined();
		expect(savedUser.createdAt).toEqual(savedUser.updatedAt);

		// Update the user and check that updatedAt changes
		const originalUpdatedAt = savedUser.updatedAt;
		await new Promise(resolve => setTimeout(resolve, 10)); // Small delay

		savedUser.firstName = 'Jane';
		const updatedUser = await savedUser.save();

		expect(updatedUser.updatedAt.getTime()).toBeGreaterThan(
			originalUpdatedAt.getTime()
		);
		expect(updatedUser.createdAt).toEqual(savedUser.createdAt);
	});

	// Test permissions array
	test('valid permissions array', async () => {
		const userData = {
			firstName: 'John',
			lastName: 'Doe',
			email: 'john@example.com',
			phone: '0000000000',
			role: Role.MANAGER,
			approvalStatus: ApprovalStatus.APPROVED,
			approvedByUserObjectId: adminUser._id,
			locationObjectId: testLocation._id,
			permissions: [
				{
					action: ACTIONS.CASL.CREATE,
					subject: SUBJECTS.SURVEY,
					condition: CONDITIONS.SCOPES.SELF
				},
				{
					action: ACTIONS.CASL.READ,
					subject: SUBJECTS.USER,
					condition: CONDITIONS.SCOPES.ALL
				}
			]
		};

		const user = new User(userData);
		const savedUser = await user.save();

		expect(savedUser.permissions).toHaveLength(2);
		expect(savedUser.permissions[0].action).toBe(ACTIONS.CASL.CREATE);
		expect(savedUser.permissions[0].subject).toBe(SUBJECTS.SURVEY);
		expect(savedUser.permissions[0].condition).toBe(CONDITIONS.SCOPES.SELF);
	});

	test('invalid permissions - invalid action', async () => {
		const userData = {
			firstName: 'John',
			lastName: 'Doe',
			email: 'john@example.com',
			phone: '0000000000',
			role: Role.VOLUNTEER,
			approvalStatus: ApprovalStatus.PENDING,
			approvedByUserObjectId: adminUser._id,
			locationObjectId: testLocation._id,
			permissions: [
				{
					action: 'INVALID_ACTION',
					subject: SUBJECTS.SURVEY
				}
			]
		};

		const user = new User(userData);
		await expect(user.save()).rejects.toThrow();
	});

	test('invalid permissions - invalid subject', async () => {
		const userData = {
			firstName: 'John',
			lastName: 'Doe',
			email: 'john@example.com',
			phone: '0000000000',
			role: Role.VOLUNTEER,
			approvalStatus: ApprovalStatus.PENDING,
			approvedByUserObjectId: adminUser._id,
			locationObjectId: testLocation._id,
			permissions: [
				{
					action: ACTIONS.CASL.CREATE,
					subject: 'INVALID_SUBJECT'
				}
			]
		};

		const user = new User(userData);
		await expect(user.save()).rejects.toThrow();
	});

	test('invalid permissions - missing action', async () => {
		const userData = {
			firstName: 'John',
			lastName: 'Doe',
			email: 'john@example.com',
			phone: '0000000000',
			role: Role.VOLUNTEER,
			approvalStatus: ApprovalStatus.PENDING,
			approvedByUserObjectId: adminUser._id,
			locationObjectId: testLocation._id,
			permissions: [
				{
					subject: SUBJECTS.SURVEY,
					condition: CONDITIONS.SCOPES.SELF
				}
			]
		};

		const user = new User(userData);
		await expect(user.save()).rejects.toThrow();
	});

	// Test mutable fields
	test('mutable: can update user profile fields', async () => {
		const user = new User({
			firstName: 'John',
			lastName: 'Doe',
			email: 'john@example.com',
			phone: '0000000000',
			role: Role.VOLUNTEER,
			approvalStatus: ApprovalStatus.PENDING,
			approvedByUserObjectId: adminUser._id,
			locationObjectId: testLocation._id
		});
		const savedUser = await user.save();

		// Update mutable fields
		savedUser.firstName = 'Jane';
		savedUser.lastName = 'Smith';
		savedUser.email = 'jane@example.com';
		savedUser.phone = '0987654321';
		savedUser.role = Role.MANAGER;
		savedUser.approvalStatus = ApprovalStatus.APPROVED;

		const updatedUser = await savedUser.save();

		expect(updatedUser.firstName).toBe('Jane');
		expect(updatedUser.lastName).toBe('Smith');
		expect(updatedUser.email).toBe('jane@example.com');
		expect(updatedUser.phone).toBe('0987654321');
		expect(updatedUser.role).toBe(Role.MANAGER);
		expect(updatedUser.approvalStatus).toBe(ApprovalStatus.APPROVED);
	});

	test('mutable: can update permissions array', async () => {
		const user = new User({
			firstName: 'John',
			lastName: 'Doe',
			email: 'john@example.com',
			phone: '0000000000',
			role: Role.VOLUNTEER,
			approvalStatus: ApprovalStatus.PENDING,
			approvedByUserObjectId: adminUser._id,
			locationObjectId: testLocation._id,
			permissions: []
		});
		const savedUser = await user.save();

		// Update permissions
		savedUser.set('permissions', [
			{
				action: ACTIONS.CASL.CREATE,
				subject: SUBJECTS.SURVEY,
				condition: CONDITIONS.SCOPES.SELF
			}
		]);

		const updatedUser = await savedUser.save();

		expect(updatedUser.permissions).toHaveLength(1);
		expect(updatedUser.permissions[0].action).toBe(ACTIONS.CASL.CREATE);
	});

	// Test soft delete functionality
	test('soft delete: deletedAt field is hidden by default', async () => {
		const user = new User({
			firstName: 'John',
			lastName: 'Doe',
			email: 'john@example.com',
			phone: '0000000000',
			role: Role.VOLUNTEER,
			approvalStatus: ApprovalStatus.PENDING,
			approvedByUserObjectId: adminUser._id,
			locationObjectId: testLocation._id
		});
		const savedUser = await user.save();

		// deletedAt should not be in the returned document by default
		expect(savedUser.deletedAt).toBeNull();
	});

	test('soft delete: can set deletedAt field', async () => {
		const user = new User({
			firstName: 'John',
			lastName: 'Doe',
			email: 'john@example.com',
			phone: '1234567891',
			role: Role.VOLUNTEER,
			approvalStatus: ApprovalStatus.PENDING,
			approvedByUserObjectId: adminUser._id,
			locationObjectId: testLocation._id
		});
		const savedUser = await user.save();

		// Set deletedAt
		savedUser.deletedAt = new Date();
		const updatedUser = await savedUser.save();

		// Should be able to set deletedAt
		expect(updatedUser.deletedAt).toBeDefined();
	});

	// Test different roles
	test('can create users with different roles', async () => {
		const volunteer = new User({
			firstName: 'Volunteer',
			lastName: 'User',
			email: 'volunteer@example.com',
			phone: '1111111111',
			role: Role.VOLUNTEER,
			approvalStatus: ApprovalStatus.APPROVED,
			approvedByUserObjectId: adminUser._id,
			locationObjectId: testLocation._id
		});

		const manager = new User({
			firstName: 'Manager',
			lastName: 'User',
			email: 'manager@example.com',
			phone: '2222222222',
			role: Role.MANAGER,
			approvalStatus: ApprovalStatus.APPROVED,
			approvedByUserObjectId: adminUser._id,
			locationObjectId: testLocation._id
		});

		const admin = new User({
			firstName: 'Admin',
			lastName: 'User',
			email: 'admin2@example.com',
			phone: '3333333333',
			role: Role.ADMIN,
			approvalStatus: ApprovalStatus.APPROVED,
			approvedByUserObjectId: adminUser._id,
			locationObjectId: testLocation._id
		});

		const savedVolunteer = await volunteer.save();
		const savedManager = await manager.save();
		const savedAdmin = await admin.save();

		expect(savedVolunteer.role).toBe(Role.VOLUNTEER);
		expect(savedManager.role).toBe(Role.MANAGER);
		expect(savedAdmin.role).toBe(Role.ADMIN);
	});

	// Test approval workflow
	test('approval workflow: pending to approved', async () => {
		const user = new User({
			firstName: 'John',
			lastName: 'Doe',
			email: 'john@example.com',
			phone: '0000000000',
			role: Role.VOLUNTEER,
			approvalStatus: ApprovalStatus.PENDING,
			locationObjectId: testLocation._id
		});
		const savedUser = await user.save();

		expect(savedUser.approvalStatus).toBe(ApprovalStatus.PENDING);

		// Approve the user
		savedUser.approvalStatus = ApprovalStatus.APPROVED;
		savedUser.approvedByUserObjectId = adminUser._id;
		const approvedUser = await savedUser.save();

		expect(approvedUser.approvalStatus).toBe(ApprovalStatus.APPROVED);
	});

	test('approval workflow: pending to rejected', async () => {
		const user = new User({
			firstName: 'John',
			lastName: 'Doe',
			email: 'john@example.com',
			phone: '0000000000',
			role: Role.VOLUNTEER,
			approvalStatus: ApprovalStatus.PENDING,
			locationObjectId: testLocation._id
		});
		const savedUser = await user.save();

		// Reject the user
		savedUser.approvalStatus = ApprovalStatus.REJECTED;
		savedUser.approvedByUserObjectId = adminUser._id;
		const rejectedUser = await savedUser.save();

		expect(rejectedUser.approvalStatus).toBe(ApprovalStatus.REJECTED);
	});
});

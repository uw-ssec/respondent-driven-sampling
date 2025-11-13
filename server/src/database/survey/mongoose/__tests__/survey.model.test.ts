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

import { ROLES } from '../../../../permissions/constants';
import Location from '../../../location/mongoose/location.model';
import User from '../../../user/mongoose/user.model';
import Seed from '../../../seed/mongoose/seed.model';
import {
	HubType,
	LocationType,
	SYSTEM_SURVEY_CODE
} from '../../../utils/constants';
import { errors } from '../../../utils/errors';
import Survey from '../survey.model';

describe('Survey Model', () => {
	let mongoServer: MongoMemoryServer;
	let testLocation: any;
	let testUser: any;

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
		await Survey.deleteMany({});
		await Location.deleteMany({});
		await User.deleteMany({});
		await Seed.deleteMany({});

		// Create a test location for each test
		const location = new Location({
			hubName: 'Test Hub',
			hubType: HubType.ESTABLISHMENT,
			locationType: LocationType.ROOFTOP,
			address: '123 Test St'
		});
		testLocation = await location.save();

		// Create a test user for each test
		const userData = {
			firstName: 'Test',
			lastName: 'User',
			email: 'test@example.com',
			phone: '1234567890',
			role: ROLES.VOLUNTEER,
			approvalStatus: 'APPROVED',
			approvedByUserObjectId: new mongoose.Types.ObjectId(),
			locationObjectId: testLocation._id,
			permissions: []
		};

		testUser = await User.insertMany([userData]);
		testUser = testUser[0]; // insertMany returns an array
	});

	// Test schema validation (using system survey code as parent to avoid parent checks)
	test('valid survey creation (basic)', async () => {
		// Create seed first
		const seed = new Seed({
			surveyCode: '12345678',
			locationObjectId: testLocation._id
		});
		await seed.save();

		const validSurvey = {
			surveyCode: '12345678',
			parentSurveyCode: SYSTEM_SURVEY_CODE,
			childSurveyCodes: ['11111111', '22222222', '33333333'],
			responses: { question1: 'answer1', question2: 'answer2' },
			createdByUserObjectId: testUser._id,
			locationObjectId: testLocation._id,
			coordinates: {
				latitude: 40.7128,
				longitude: -74.006
			},
			isCompleted: false
		};

		const survey = new Survey(validSurvey);
		const savedSurvey = await survey.save();

		expect(savedSurvey._id).toBeDefined();
		expect(savedSurvey.surveyCode).toBe('12345678');
		expect(savedSurvey.parentSurveyCode).toBe(SYSTEM_SURVEY_CODE);
		expect(savedSurvey.childSurveyCodes).toHaveLength(3);
		expect(savedSurvey.responses).toEqual(validSurvey.responses);
		expect(savedSurvey.isCompleted).toBe(false);
		expect(savedSurvey.createdAt).toBeDefined();
		expect(savedSurvey.updatedAt).toBeDefined();
	});

	test('invalid survey - missing required fields', async () => {
		const invalidSurvey = {
			// Missing surveyCode, parentSurveyCode, createdByUserObjectId, locationObjectId
			responses: { question1: 'answer1' }
		};

		const survey = new Survey(invalidSurvey);

		await expect(survey.save()).rejects.toThrow();
	});

	test('invalid survey - non-existent locationObjectId', async () => {
		// Create seed first
		const seed = new Seed({
			surveyCode: '12345678',
			locationObjectId: testLocation._id
		});
		await seed.save();

		const invalidSurvey = {
			surveyCode: '12345678',
			parentSurveyCode: SYSTEM_SURVEY_CODE,
			createdByUserObjectId: testUser._id,
			locationObjectId: new mongoose.Types.ObjectId() // Non-existent location
		};

		const survey = new Survey(invalidSurvey);

		await expect(survey.save()).rejects.toThrow(
			errors.OBJECT_ID_NOT_FOUND.message
		);
	});

	test('invalid survey - non-existent createdByUserObjectId', async () => {
		// Create seed first
		const seed = new Seed({
			surveyCode: '12345678',
			locationObjectId: testLocation._id
		});
		await seed.save();

		const invalidSurvey = {
			surveyCode: '12345678',
			parentSurveyCode: SYSTEM_SURVEY_CODE,
			createdByUserObjectId: new mongoose.Types.ObjectId(), // Non-existent user
			locationObjectId: testLocation._id
		};

		const survey = new Survey(invalidSurvey);

		await expect(survey.save()).rejects.toThrow(
			errors.OBJECT_ID_NOT_FOUND.message
		);
	});

	// Test uniqueness constraints
	test('duplicate surveyCode should fail', async () => {
		// Create seed first
		const seed = new Seed({
			surveyCode: '12345678',
			locationObjectId: testLocation._id
		});
		await seed.save();

		const surveyData = {
			surveyCode: '12345678',
			parentSurveyCode: SYSTEM_SURVEY_CODE,
			createdByUserObjectId: testUser._id,
			locationObjectId: testLocation._id
		};

		// Create first survey
		const survey1 = new Survey(surveyData);
		await survey1.save();

		// Try to create second survey with same surveyCode
		const survey2 = new Survey(surveyData);

		await expect(survey2.save()).rejects.toThrow();
	});

	test('childSurveyCodes interdocument uniqueness', async () => {
		// Create seeds first
		const seed1 = new Seed({
			surveyCode: '12345678',
			locationObjectId: testLocation._id
		});
		await seed1.save();

		const seed2 = new Seed({
			surveyCode: '78901234',
			locationObjectId: testLocation._id
		});
		await seed2.save();

		const surveyData1 = {
			surveyCode: '12345678',
			parentSurveyCode: SYSTEM_SURVEY_CODE,
			createdByUserObjectId: testUser._id,
			locationObjectId: testLocation._id,
			childSurveyCodes: ['11111111', '22222222', '33333333']
		};

		const surveyData2 = {
			surveyCode: '78901234',
			parentSurveyCode: SYSTEM_SURVEY_CODE,
			createdByUserObjectId: testUser._id,
			locationObjectId: testLocation._id,
			childSurveyCodes: ['11111111', '44444444', '55555555']
		};

		// Create first survey
		const survey1 = new Survey(surveyData1);
		await survey1.save();

		// Try to create second survey with same generated code
		const survey2 = new Survey(surveyData2);

		await expect(survey2.save()).rejects.toThrow();
	});

	// Test timestamps
	test('automatic timestamps', async () => {
		// Create seed first
		const seed = new Seed({
			surveyCode: '12345678',
			locationObjectId: testLocation._id
		});
		await seed.save();

		const surveyData = {
			surveyCode: '12345678',
			parentSurveyCode: SYSTEM_SURVEY_CODE,
			createdByUserObjectId: testUser._id,
			locationObjectId: testLocation._id
		};

		const survey = new Survey(surveyData);
		const savedSurvey = await survey.save();

		expect(savedSurvey.createdAt).toBeDefined();
		expect(savedSurvey.updatedAt).toBeDefined();
		expect(savedSurvey.createdAt).toEqual(savedSurvey.updatedAt);

		// Update the survey and check that updatedAt changes
		const originalUpdatedAt = savedSurvey.updatedAt;
		await new Promise(resolve => setTimeout(resolve, 10)); // Small delay

		savedSurvey.isCompleted = true;
		const updatedSurvey = await savedSurvey.save();

		expect(updatedSurvey.updatedAt.getTime()).toBeGreaterThan(
			originalUpdatedAt.getTime()
		);
		expect(updatedSurvey.createdAt).toEqual(savedSurvey.createdAt);
	});

	// Test default values
	test('default values are set correctly', async () => {
		// Create seed first
		const seed = new Seed({
			surveyCode: '12345678',
			locationObjectId: testLocation._id
		});
		await seed.save();

		const surveyData = {
			surveyCode: '12345678',
			parentSurveyCode: SYSTEM_SURVEY_CODE,
			createdByUserObjectId: testUser._id,
			locationObjectId: testLocation._id
			// Not providing responses, isCompleted, generatedSurveyCodes
		};

		const survey = new Survey(surveyData);
		const savedSurvey = await survey.save();

		expect(savedSurvey.responses).toEqual({});
		expect(savedSurvey.isCompleted).toBe(false);
		expect(savedSurvey.childSurveyCodes).toEqual([]);
	});

	// Chronological ordering hook tests
	test('chronology: child created after parent passes', async () => {
		// Create seed for parent
		const seedParent = new Seed({
			surveyCode: 'PARENT1',
			locationObjectId: testLocation._id
		});
		await seedParent.save();

		const parent = new Survey({
			surveyCode: 'PARENT1',
			parentSurveyCode: SYSTEM_SURVEY_CODE,
			createdByUserObjectId: testUser._id,
			locationObjectId: testLocation._id,
			childSurveyCodes: ['CHILD1A', 'CHILD1B', 'CHILD1C']
		});
		const savedParent = await parent.save();

		const child = new Survey({
			surveyCode: 'CHILD1A',
			parentSurveyCode: savedParent.surveyCode,
			createdByUserObjectId: testUser._id,
			locationObjectId: testLocation._id,
			childSurveyCodes: ['CHILD1D', 'CHILD1E', 'CHILD1F']
		});

		const savedChild = await child.save();
		expect(savedChild._id).toBeDefined();
		expect(savedChild.parentSurveyCode).toBe(savedParent.surveyCode);
	});

	test('chronology: rejects when parent createdAt is in the future', async () => {
		// Create seed for parent
		const seedParent = new Seed({
			surveyCode: 'PARENT2',
			locationObjectId: testLocation._id
		});
		await seedParent.save();

		const parent = new Survey({
			surveyCode: 'PARENT2',
			parentSurveyCode: SYSTEM_SURVEY_CODE,
			createdByUserObjectId: testUser._id,
			locationObjectId: testLocation._id
		});
		const savedParent = await parent.save();

		const future = new Date(Date.now() + 60_000);
		// Hacky way to get around createdAt immutability
		await mongoose.connection.db
			?.collection(Survey.collection.name)
			.updateOne(
				{ _id: savedParent._id },
				{ $set: { createdAt: future } }
			);

		const child = new Survey({
			surveyCode: 'CHILD2A',
			parentSurveyCode: savedParent.surveyCode,
			createdByUserObjectId: testUser._id,
			locationObjectId: testLocation._id
		});

		await expect(child.save()).rejects.toThrow(
			errors.REFERRAL_CHRONOLOGY_VIOLATION.message
		);
	});

	test('chronology: rejects when parent not found', async () => {
		const child = new Survey({
			surveyCode: 'CHILD3A',
			parentSurveyCode: '99999999',
			createdByUserObjectId: testUser._id,
			locationObjectId: testLocation._id
		});

		await expect(child.save()).rejects.toThrow(
			errors.PARENT_SURVEY_NOT_FOUND.message
		);
	});

	// Immutable field tests
	test('immutable: cannot update surveyCode after creation', async () => {
		// Create seed first
		const seed = new Seed({
			surveyCode: 'ORIGINAL',
			locationObjectId: testLocation._id
		});
		await seed.save();

		const survey = new Survey({
			surveyCode: 'ORIGINAL',
			parentSurveyCode: SYSTEM_SURVEY_CODE,
			createdByUserObjectId: testUser._id,
			locationObjectId: testLocation._id,
			responses: { question1: 'answer1' },
			childSurveyCodes: ['11111111', '22222222', '33333333']
		});
		const savedSurvey = await survey.save();

		// Try to update immutable field
		savedSurvey.surveyCode = 'NEWCODE';
		await expect(savedSurvey.save()).rejects.toThrow(
			'Path `surveyCode` is immutable'
		);
	});

	test('immutable: cannot update parentSurveyCode after creation', async () => {
		// Create seed first
		const seed = new Seed({
			surveyCode: 'ORIGINAL2',
			locationObjectId: testLocation._id
		});
		await seed.save();

		const survey = new Survey({
			surveyCode: 'ORIGINAL2',
			parentSurveyCode: SYSTEM_SURVEY_CODE,
			createdByUserObjectId: testUser._id,
			locationObjectId: testLocation._id,
			responses: { question1: 'answer1' },
			childSurveyCodes: ['44444444', '55555555', '66666666']
		});
		const savedSurvey = await survey.save();

		// Try to update immutable field
		savedSurvey.parentSurveyCode = 'NEWPARENT';
		await expect(savedSurvey.save()).rejects.toThrow(
			'Path `parentSurveyCode` is immutable'
		);
	});

	test('immutable: cannot update childSurveyCodes after creation', async () => {
		// Create seed first
		const seed = new Seed({
			surveyCode: 'ORIGINAL3',
			locationObjectId: testLocation._id
		});
		await seed.save();

		const survey = new Survey({
			surveyCode: 'ORIGINAL3',
			parentSurveyCode: SYSTEM_SURVEY_CODE,
			createdByUserObjectId: testUser._id,
			locationObjectId: testLocation._id,
			responses: { question1: 'answer1' },
			childSurveyCodes: ['77777777', '88888888', '99999999']
		});
		const savedSurvey = await survey.save();

		// Try to update immutable field
		savedSurvey.childSurveyCodes = ['NEW11111', 'NEW22222', 'NEW33333'];
		await expect(savedSurvey.save()).rejects.toThrow(
			errors.IMMUTABLE_FIELD_VIOLATION.message
		);
	});

	test('immutable: cannot update createdByUserObjectId after creation', async () => {
		// Create seed first
		const seed = new Seed({
			surveyCode: 'ORIGINAL4',
			locationObjectId: testLocation._id
		});
		await seed.save();

		const survey = new Survey({
			surveyCode: 'ORIGINAL4',
			parentSurveyCode: SYSTEM_SURVEY_CODE,
			createdByUserObjectId: testUser._id,
			locationObjectId: testLocation._id,
			responses: { question1: 'answer1' },
			childSurveyCodes: ['AAA11111', 'BBB22222', 'CCC33333']
		});
		const savedSurvey = await survey.save();

		// Try to update immutable field
		savedSurvey.createdByUserObjectId =
			new mongoose.Types.ObjectId() as any;
		await expect(savedSurvey.save()).rejects.toThrow(
			'Path `createdByUserObjectId` is immutable'
		);
	});

	test('immutable: cannot update locationObjectId after creation', async () => {
		// Create seed first
		const seed = new Seed({
			surveyCode: 'ORIGINAL5',
			locationObjectId: testLocation._id
		});
		await seed.save();

		const survey = new Survey({
			surveyCode: 'ORIGINAL5',
			parentSurveyCode: SYSTEM_SURVEY_CODE,
			createdByUserObjectId: testUser._id,
			locationObjectId: testLocation._id,
			responses: { question1: 'answer1' },
			childSurveyCodes: ['DDD44444', 'EEE55555', 'FFF66666']
		});
		const savedSurvey = await survey.save();

		// Try to update immutable field
		savedSurvey.locationObjectId = new mongoose.Types.ObjectId() as any;
		await expect(savedSurvey.save()).rejects.toThrow(
			'Path `locationObjectId` is immutable'
		);
	});

	test('immutable: cannot update coordinates after creation', async () => {
		// Create seed first
		const seed = new Seed({
			surveyCode: 'ORIGINAL6',
			locationObjectId: testLocation._id
		});
		await seed.save();

		const survey = new Survey({
			surveyCode: 'ORIGINAL6',
			parentSurveyCode: SYSTEM_SURVEY_CODE,
			createdByUserObjectId: testUser._id,
			locationObjectId: testLocation._id,
			responses: { question1: 'answer1' },
			childSurveyCodes: ['GGG77777', 'HHH88888', 'III99999'],
			coordinates: { latitude: 40.7128, longitude: -74.006 }
		});
		const savedSurvey = await survey.save();

		// Try to update immutable field
		savedSurvey.coordinates = { latitude: 41.0, longitude: -74.006 };
		await expect(savedSurvey.save()).rejects.toThrow(
			errors.IMMUTABLE_FIELD_VIOLATION.message
		);
	});

	test('mutable: can update responses and isCompleted after creation', async () => {

		const seed = new Seed({
			surveyCode: 'MUTABLE1',
			locationObjectId: testLocation._id
		});
		await seed.save();

		const survey = new Survey({
			surveyCode: 'MUTABLE1',
			parentSurveyCode: SYSTEM_SURVEY_CODE,
			createdByUserObjectId: testUser._id,
			locationObjectId: testLocation._id,
			responses: { question1: 'answer1' },
			childSurveyCodes: ['JJJ00000', 'KKK11111', 'LLL22222'],
			isCompleted: false
		});
		const savedSurvey = await survey.save();

		// Update mutable fields
		savedSurvey.responses = {
			question1: 'newanswer',
			question2: 'answer2'
		};
		savedSurvey.isCompleted = true;
		const updatedSurvey = await savedSurvey.save();

		expect(updatedSurvey.responses).toEqual({
			question1: 'newanswer',
			question2: 'answer2'
		});
		expect(updatedSurvey.isCompleted).toBe(true);
	});

	test('can create surveys with different locations', async () => {
		// Create a second location
		const location2 = new Location({
			hubName: 'Second Hub',
			hubType: HubType.CHURCH,
			locationType: LocationType.APPROXIMATE,
			address: '456 Second St'
		});
		const savedLocation2 = await location2.save();

		const seed = new Seed({
			surveyCode: 'SURVEY1',
			locationObjectId: testLocation._id
		});
		await seed.save();

		const seed2 = new Seed({
			surveyCode: 'SURVEY2',
			locationObjectId: savedLocation2._id
		});
		await seed2.save();

		// Ensure testUser exists and is saved
		expect(testUser._id).toBeDefined();
		expect(testLocation._id).toBeDefined();

		const survey1 = new Survey({
			surveyCode: 'SURVEY1',
			parentSurveyCode: SYSTEM_SURVEY_CODE,
			createdByUserObjectId: testUser._id,
			locationObjectId: testLocation._id
		});

		const survey2 = new Survey({
			surveyCode: 'SURVEY2',
			parentSurveyCode: SYSTEM_SURVEY_CODE,
			createdByUserObjectId: testUser._id,
			locationObjectId: savedLocation2._id
		});

		const savedSurvey1 = await survey1.save();
		const savedSurvey2 = await survey2.save();

		expect(savedSurvey1.locationObjectId).toEqual(testLocation._id);
		expect(savedSurvey2.locationObjectId).toEqual(savedLocation2._id);
		expect(savedSurvey1.surveyCode).not.toBe(savedSurvey2.surveyCode);
	});

	test('cannot create two surveys using the same seed code', async () => {
		// Create a seed
		const seed = new Seed({
			surveyCode: 'SHARED1',
			locationObjectId: testLocation._id
		});
		await seed.save();

		// Create first survey using the seed code
		const survey1 = new Survey({
			surveyCode: 'SHARED1',
			parentSurveyCode: SYSTEM_SURVEY_CODE,
			createdByUserObjectId: testUser._id,
			locationObjectId: testLocation._id,
			childSurveyCodes: ['CODE1AAA', 'CODE1BBB', 'CODE1CCC']
		});
		const savedSurvey1 = await survey1.save();
		expect(savedSurvey1._id).toBeDefined();

		// Try to create a second survey using the same seed code (should fail)
		const survey2 = new Survey({
			surveyCode: 'SHARED1', // Same seed code as survey1
			parentSurveyCode: SYSTEM_SURVEY_CODE,
			createdByUserObjectId: testUser._id,
			locationObjectId: testLocation._id,
			childSurveyCodes: ['CODE2AAA', 'CODE2BBB', 'CODE2CCC']
		});

		// Should fail because surveyCode must be unique
		await expect(survey2.save()).rejects.toThrow();
	});
});

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

import Survey from '../../../survey/mongoose/survey.model';
import { SiteLocation, SYSTEM_SURVEY_CODE } from '../../../utils/constants';
import { errors } from '../../../utils/errors';
import Seed from '../seed.model';

describe('Seed Model', () => {
	let mongoServer: MongoMemoryServer;

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
		await Seed.deleteMany({});
		await Survey.deleteMany({});
	});

	// Test schema validation
	test('valid seed creation (basic)', async () => {
		const validSeed = {
			surveyCode: '123456',
			locationObjectId: new mongoose.Types.ObjectId(),
			isFallback: false
		};

		const seed = new Seed(validSeed);
		const savedSeed = await seed.save();

		expect(savedSeed._id).toBeDefined();
		expect(savedSeed.surveyCode).toBe('123456');
		expect(savedSeed.locationObjectId).toEqual(validSeed.locationObjectId);
		expect(savedSeed.isFallback).toBe(false);
		expect(savedSeed.createdAt).toBeDefined();
	});

	test('valid seed creation with default isFallback', async () => {
		const validSeed = {
			surveyCode: '789012',
			locationObjectId: new mongoose.Types.ObjectId()
			// isFallback not provided, should default to false
		};

		const seed = new Seed(validSeed);
		const savedSeed = await seed.save();

		expect(savedSeed.isFallback).toBe(false);
	});

	test('invalid seed - missing required fields', async () => {
		const invalidSeed = {
			// Missing surveyCode and locationObjectId
			isFallback: true
		};

		const seed = new Seed(invalidSeed);
		await expect(seed.save()).rejects.toThrow();
	});

	test('invalid seed - invalid ObjectId format', async () => {
		const invalidSeed = {
			surveyCode: '123456',
			locationObjectId: 'invalid-object-id',
			isFallback: false
		};

		const seed = new Seed(invalidSeed);
		await expect(seed.save()).rejects.toThrow();
	});

	// Test uniqueness constraints
	test('duplicate surveyCode should fail', async () => {
		const seedData = {
			surveyCode: '123456',
			locationObjectId: new mongoose.Types.ObjectId(),
			isFallback: false
		};

		// Create first seed
		const seed1 = new Seed(seedData);
		await seed1.save();

		// Try to create second seed with same surveyCode
		const seed2 = new Seed(seedData);
		await expect(seed2.save()).rejects.toThrow();
	});

	// Test uniqueness validation hook
	test('uniqueness hook: rejects when surveyCode exists in Survey collection', async () => {
		// Create a survey with the surveyCode
		const survey = new Survey({
			surveyCode: '123456',
			parentSurveyCode: SYSTEM_SURVEY_CODE,
			createdByUserObjectId: new mongoose.Types.ObjectId(),
			siteLocation: SiteLocation.LOCATION_A
		});
		await survey.save();

		// Try to create seed with same surveyCode
		const seed = new Seed({
			surveyCode: '123456',
			locationObjectId: new mongoose.Types.ObjectId(),
			isFallback: false
		});

		await expect(seed.save()).rejects.toThrow(
			errors.SURVEY_CODE_ALREADY_EXISTS.message
		);
	});

	test('uniqueness hook: rejects when surveyCode exists in Survey childSurveyCodes', async () => {
		// Create a survey with the surveyCode in childSurveyCodes
		const survey = new Survey({
			surveyCode: 'PARENT123',
			parentSurveyCode: SYSTEM_SURVEY_CODE,
			createdByUserObjectId: new mongoose.Types.ObjectId(),
			siteLocation: SiteLocation.LOCATION_A,
			childSurveyCodes: ['123456', '789012']
		});
		await survey.save();

		// Try to create seed with surveyCode that exists in childSurveyCodes
		const seed = new Seed({
			surveyCode: '123456',
			locationObjectId: new mongoose.Types.ObjectId(),
			isFallback: false
		});

		await expect(seed.save()).rejects.toThrow(
			errors.SURVEY_CODE_ALREADY_EXISTS.message
		);
	});

	test('uniqueness hook: allows creation when surveyCode is unique', async () => {
		// Create a survey with different surveyCode
		const survey = new Survey({
			surveyCode: 'DIFFERENT',
			parentSurveyCode: SYSTEM_SURVEY_CODE,
			createdByUserObjectId: new mongoose.Types.ObjectId(),
			siteLocation: SiteLocation.LOCATION_A
		});
		await survey.save();

		// Create seed with unique surveyCode
		const seed = new Seed({
			surveyCode: '123456',
			locationObjectId: new mongoose.Types.ObjectId(),
			isFallback: false
		});

		const savedSeed = await seed.save();
		expect(savedSeed._id).toBeDefined();
		expect(savedSeed.surveyCode).toBe('123456');
	});

	// Test timestamps
	test('automatic timestamps', async () => {
		const seedData = {
			surveyCode: '123456',
			locationObjectId: new mongoose.Types.ObjectId(),
			isFallback: false
		};

		const seed = new Seed(seedData);
		const savedSeed = await seed.save();

		expect(savedSeed.createdAt).toBeDefined();
	});

	// Test default values
	test('default values are set correctly', async () => {
		const seedData = {
			surveyCode: '123456',
			locationObjectId: new mongoose.Types.ObjectId()
			// Not providing isFallback
		};

		const seed = new Seed(seedData);
		const savedSeed = await seed.save();

		// Make sure isFallback is false by default
		expect(savedSeed.isFallback).toBe(false);
	});

	// Test immutable fields
	test('immutable: cannot update surveyCode after creation', async () => {
		const seed = new Seed({
			surveyCode: 'ORIGINAL',
			locationObjectId: new mongoose.Types.ObjectId(),
			isFallback: false
		});
		const savedSeed = await seed.save();

		// Try to update immutable field
		savedSeed.surveyCode = 'NEWCODE';
		await expect(savedSeed.save()).rejects.toThrow(
			'Path `surveyCode` is immutable'
		);
	});

	test('immutable: cannot update locationObjectId after creation', async () => {
		const seed = new Seed({
			surveyCode: 'ORIGINAL2',
			locationObjectId: new mongoose.Types.ObjectId(),
			isFallback: false
		});
		const savedSeed = await seed.save();

		// Try to update immutable field
		savedSeed.locationObjectId = new mongoose.Types.ObjectId() as any;
		await expect(savedSeed.save()).rejects.toThrow(
			'Path `locationObjectId` is immutable'
		);
	});

	test('immutable: cannot update isFallback after creation', async () => {
		const seed = new Seed({
			surveyCode: 'ORIGINAL3',
			locationObjectId: new mongoose.Types.ObjectId(),
			isFallback: false
		});
		const savedSeed = await seed.save();

		// Try to update immutable field using Mongoose
		savedSeed.isFallback = true;
		savedSeed.markModified('isFallback'); // Explicitly mark as modified

		await expect(savedSeed.save()).rejects.toThrow(
			'Path `isFallback` is immutable'
		);
	});

	test('can create multiple seeds', async () => {
		const seed1 = new Seed({
			surveyCode: 'SEED001',
			locationObjectId: new mongoose.Types.ObjectId(),
			isFallback: false
		});

		const seed2 = new Seed({
			surveyCode: 'SEED002',
			locationObjectId: new mongoose.Types.ObjectId(),
			isFallback: true
		});

		const savedSeed1 = await seed1.save();
		const savedSeed2 = await seed2.save();

		expect(savedSeed1.isFallback).toBe(false);
		expect(savedSeed2.isFallback).toBe(true);
		expect(savedSeed1.surveyCode).not.toBe(savedSeed2.surveyCode);
	});
});

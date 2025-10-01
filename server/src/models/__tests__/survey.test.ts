import {
	afterAll,
	beforeAll,
	beforeEach,
	describe,
	expect,
	it
} from '@jest/globals';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

import Survey from '../survey';

describe('Survey Model Test', () => {
	let mongoServer: MongoMemoryServer;

	beforeAll(async () => {
		mongoServer = await MongoMemoryServer.create();
		const mongoUri = mongoServer.getUri();
		await mongoose.connect(mongoUri);
	});

	afterAll(async () => {
		await mongoose.disconnect();
		await mongoServer.stop();
	});

	beforeEach(async () => {
		await Survey.deleteMany({});
	});

	const validSurveyData = {
		employeeId: 'EMP1234',
		employeeName: 'John Doe',
		responses: {
			question1: 'answer1',
			question2: 'answer2'
		}
	};

	it('should create and save survey successfully', async () => {
		const surveyData = { ...validSurveyData };
		const survey = new Survey(surveyData);
		const savedSurvey = await survey.save();

		expect(savedSurvey._id).toBeDefined();
		expect(savedSurvey.employeeId).toBe(surveyData.employeeId);
		expect(savedSurvey.employeeName).toBe(surveyData.employeeName);
		expect(savedSurvey.responses).toEqual(surveyData.responses);
		expect(savedSurvey.createdAt).toBeDefined();
		expect(savedSurvey.lastUpdated).toBeDefined();
		expect(savedSurvey.referralCodes).toEqual([]);
		expect(savedSurvey.referredByCode).toBeNull();
		expect(savedSurvey.coords).toBeUndefined();
		expect(savedSurvey.completed).toBeUndefined();
	});

	it('should require employeeId field', async () => {
		const surveyData = { ...validSurveyData };
		delete (surveyData as any).employeeId;
		const survey = new Survey(surveyData);

		let err: any;
		try {
			await survey.save();
		} catch (error) {
			err = error;
		}

		expect(err).toBeDefined();
		expect(err.errors.employeeId).toBeDefined();
	});

	it('should require employeeName field', async () => {
		const surveyData = { ...validSurveyData };
		delete (surveyData as any).employeeName;
		const survey = new Survey(surveyData);

		let err: any;
		try {
			await survey.save();
		} catch (error) {
			err = error;
		}

		expect(err).toBeDefined();
		expect(err.errors.employeeName).toBeDefined();
	});

	it('should require responses field', async () => {
		const surveyData = { ...validSurveyData };
		delete (surveyData as any).responses;
		const survey = new Survey(surveyData);

		let err: any;
		try {
			await survey.save();
		} catch (error) {
			err = error;
		}

		expect(err).toBeDefined();
		expect(err.errors.responses).toBeDefined();
	});

	it('should save with referral codes', async () => {
		const surveyData = {
			...validSurveyData,
			referralCodes: [
				{ code: 'REF123', usedBySurvey: null, usedAt: null },
				{ code: 'REF456', usedBySurvey: null, usedAt: null }
			]
		};
		const survey = new Survey(surveyData);
		const savedSurvey = await survey.save();

		expect(savedSurvey.referralCodes).toHaveLength(2);
		expect(savedSurvey.referralCodes[0].code).toBe('REF123');
		expect(savedSurvey.referralCodes[1].code).toBe('REF456');
		expect(savedSurvey.referralCodes[0].usedBySurvey).toBeNull();
		expect(savedSurvey.referralCodes[0].usedAt).toBeNull();
	});

	it('should save with referredByCode', async () => {
		const surveyData = {
			...validSurveyData,
			referredByCode: 'PARENT123'
		};
		const survey = new Survey(surveyData);
		const savedSurvey = await survey.save();

		expect(savedSurvey.referredByCode).toBe('PARENT123');
	});

	it('should save with coordinates', async () => {
		const surveyData = {
			...validSurveyData,
			coords: {
				latitude: 47.6062,
				longitude: -122.3321
			}
		};
		const survey = new Survey(surveyData);
		const savedSurvey = await survey.save();

		expect(savedSurvey.coords).toEqual({
			latitude: 47.6062,
			longitude: -122.3321
		});
	});

	it('should save with completed flag', async () => {
		const surveyData = {
			...validSurveyData,
			completed: true
		};
		const survey = new Survey(surveyData);
		const savedSurvey = await survey.save();

		expect(savedSurvey.completed).toBe(true);
	});

	it('should update lastUpdated when modified', async () => {
		const survey = new Survey(validSurveyData);
		const savedSurvey = await survey.save();
		const originalLastUpdated = savedSurvey.lastUpdated;

		// Wait a bit to ensure different timestamp
		await new Promise(resolve => setTimeout(resolve, 10));

		savedSurvey.responses = {
			...savedSurvey.responses,
			newQuestion: 'newAnswer'
		};
		savedSurvey.lastUpdated = new Date();
		const updatedSurvey = await savedSurvey.save();

		expect(updatedSurvey.lastUpdated.getTime()).toBeGreaterThan(
			originalLastUpdated.getTime()
		);
	});

	it('should allow referral code to be marked as used', async () => {
		const parentSurvey = new Survey({
			...validSurveyData,
			employeeId: 'EMP1111',
			referralCodes: [
				{ code: 'REF123', usedBySurvey: null, usedAt: null }
			]
		});
		const savedParentSurvey = await parentSurvey.save();

		const childSurvey = new Survey({
			...validSurveyData,
			employeeId: 'EMP2222',
			referredByCode: 'REF123'
		});
		const savedChildSurvey = await childSurvey.save();

		// Mark the referral code as used
		savedParentSurvey.referralCodes[0].usedBySurvey =
			savedChildSurvey._id as any;
		savedParentSurvey.referralCodes[0].usedAt = new Date();
		const updatedParentSurvey = await savedParentSurvey.save();

		expect(updatedParentSurvey.referralCodes[0].usedBySurvey).toEqual(
			savedChildSurvey._id
		);
		expect(updatedParentSurvey.referralCodes[0].usedAt).toBeDefined();
	});

	it('should handle complex response objects', async () => {
		const complexResponses = {
			demographics: {
				age: 25,
				gender: 'male',
				education: 'bachelor'
			},
			preferences: ['option1', 'option2', 'option3'],
			ratings: {
				service: 5,
				quality: 4,
				value: 3
			},
			openEnded: 'This is a long text response with multiple sentences.'
		};

		const surveyData = {
			...validSurveyData,
			responses: complexResponses
		};
		const survey = new Survey(surveyData);
		const savedSurvey = await survey.save();

		expect(savedSurvey.responses).toEqual(complexResponses);
	});
});

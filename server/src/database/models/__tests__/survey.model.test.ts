import { describe, test, expect, beforeEach, beforeAll, afterAll } from '@jest/globals';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Survey from '../survey.model';
import { SiteLocation } from '../../utils/constants';

describe('Survey Model', () => {
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
        await Survey.deleteMany({});
    });

    // Test schema validation
    test('valid survey creation', async () => {
        const validSurvey = {
            surveyCode: '123456',
            referredBySurveyCode: '000000',
            generatedSurveyCodes: [
                { code: '111111', usedBySurveyObjectId: null },
                { code: '222222', usedBySurveyObjectId: null }
            ],
            responses: { question1: 'answer1', question2: 'answer2' },
            createdByUserObjectId: new mongoose.Types.ObjectId(),
            siteLocation: SiteLocation.LOCATION_A,
            coordinates: {
                latitude: 40.7128,
                longitude: -74.0060
            },
            isCompleted: false
        };

        const survey = new Survey(validSurvey);
        const savedSurvey = await survey.save();

        expect(savedSurvey._id).toBeDefined();
        expect(savedSurvey.surveyCode).toBe('123456');
        expect(savedSurvey.referredBySurveyCode).toBe('000000');
        expect(savedSurvey.generatedSurveyCodes).toHaveLength(2);
        expect(savedSurvey.responses).toEqual(validSurvey.responses);
        expect(savedSurvey.isCompleted).toBe(false);
        expect(savedSurvey.createdAt).toBeDefined();
        expect(savedSurvey.updatedAt).toBeDefined();
    });

    test('invalid survey - missing required fields', async () => {
        const invalidSurvey = {
            // Missing surveyCode, referredBySurveyCode, createdByUserObjectId, siteLocation
            responses: { question1: 'answer1' }
        };

        const survey = new Survey(invalidSurvey);
        
        await expect(survey.save()).rejects.toThrow();
    });

    test('invalid survey - invalid coordinates', async () => {
        const invalidSurvey = {
            surveyCode: '123456',
            referredBySurveyCode: '000000',
            createdByUserObjectId: new mongoose.Types.ObjectId(),
            siteLocation: SiteLocation.LOCATION_A,
            coordinates: {
                latitude: 91, // Invalid latitude
                longitude: -74.0060
            }
        };

        const survey = new Survey(invalidSurvey);
        
        await expect(survey.save()).rejects.toThrow();
    });

    test('invalid survey - invalid siteLocation enum', async () => {
        const invalidSurvey = {
            surveyCode: '123456',
            referredBySurveyCode: '000000',
            createdByUserObjectId: new mongoose.Types.ObjectId(),
            siteLocation: 'InvalidLocation' // Invalid enum value
        };

        const survey = new Survey(invalidSurvey);
        
        await expect(survey.save()).rejects.toThrow();
    });

    // Test uniqueness constraints
    test('duplicate surveyCode should fail', async () => {
        const surveyData = {
            surveyCode: '123456',
            referredBySurveyCode: '000000',
            createdByUserObjectId: new mongoose.Types.ObjectId(),
            siteLocation: SiteLocation.LOCATION_A
        };

        // Create first survey
        const survey1 = new Survey(surveyData);
        await survey1.save();

        // Try to create second survey with same surveyCode
        const survey2 = new Survey(surveyData);
        
        await expect(survey2.save()).rejects.toThrow();
    });

    // Test indexes
    test('generatedSurveyCodes.code intradocument uniqueness', async () => {
        const surveyData = {
            surveyCode: '123456',
            referredBySurveyCode: '000000',
            createdByUserObjectId: new mongoose.Types.ObjectId(),
            siteLocation: SiteLocation.LOCATION_A,
            generatedSurveyCodes: [
                { code: '111111', usedBySurveyObjectId: null },
                { code: '111111', usedBySurveyObjectId: null } // Duplicate code
            ]
        };

        const survey = new Survey(surveyData);
        
        await expect(survey.save()).rejects.toThrow();
    });

    test('generatedSurveyCodes.code interdocument uniqueness', async () => {
        const surveyData1 = {
            surveyCode: '123456',
            referredBySurveyCode: '000000',
            createdByUserObjectId: new mongoose.Types.ObjectId(),
            siteLocation: SiteLocation.LOCATION_A,
            generatedSurveyCodes: [
                { code: '111111', usedBySurveyObjectId: null },
                { code: '222222', usedBySurveyObjectId: null }
            ]
        };

        const surveyData2 = {
            surveyCode: '789012',
            referredBySurveyCode: '000000',
            createdByUserObjectId: new mongoose.Types.ObjectId(),
            siteLocation: SiteLocation.LOCATION_A,
            generatedSurveyCodes: [
                { code: '111111', usedBySurveyObjectId: null }, // Same code as surveyData1
                { code: '333333', usedBySurveyObjectId: null }
            ]
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
        const surveyData = {
            surveyCode: '123456',
            referredBySurveyCode: '000000',
            createdByUserObjectId: new mongoose.Types.ObjectId(),
            siteLocation: SiteLocation.LOCATION_A
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
        
        expect(updatedSurvey.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
        expect(updatedSurvey.createdAt).toEqual(savedSurvey.createdAt);
    });

    // Test default values
    test('default values are set correctly', async () => {
        const surveyData = {
            surveyCode: '123456',
            referredBySurveyCode: '000000',
            createdByUserObjectId: new mongoose.Types.ObjectId(),
            siteLocation: SiteLocation.LOCATION_A
            // Not providing responses, isCompleted, generatedSurveyCodes
        };

        const survey = new Survey(surveyData);
        const savedSurvey = await survey.save();

        expect(savedSurvey.responses).toEqual({});
        expect(savedSurvey.isCompleted).toBe(false);
        expect(savedSurvey.generatedSurveyCodes).toEqual([]);
    });
});
import { describe, test, expect, beforeEach, beforeAll, afterAll } from '@jest/globals';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Survey from '../survey.model';
import { SiteLocation, SYSTEM_SURVEY_CODE } from '../../utils/constants';
import { errors } from '../../utils/error';

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

    // Test schema validation (using system survey code as parent to avoid parent checks)
    test('valid survey creation (basic)', async () => {
        const validSurvey = {
            surveyCode: '123456',
            parentSurveyCode: SYSTEM_SURVEY_CODE,
            childSurveyCodes: [ '111111', '222222', '333333' ],
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
        expect(savedSurvey.parentSurveyCode).toBe(SYSTEM_SURVEY_CODE);
        expect(savedSurvey.childSurveyCodes).toHaveLength(3);
        expect(savedSurvey.responses).toEqual(validSurvey.responses);
        expect(savedSurvey.isCompleted).toBe(false);
        expect(savedSurvey.createdAt).toBeDefined();
        expect(savedSurvey.updatedAt).toBeDefined();
    });

    test('invalid survey - missing required fields', async () => {
        const invalidSurvey = {
            // Missing surveyCode, parentSurveyCode, createdByUserObjectId, siteLocation
            responses: { question1: 'answer1' }
        };

        const survey = new Survey(invalidSurvey);
        
        await expect(survey.save()).rejects.toThrow();
    });

    test('invalid survey - invalid siteLocation enum', async () => {
        const invalidSurvey = {
            surveyCode: '123456',
            parentSurveyCode: SYSTEM_SURVEY_CODE,
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
            parentSurveyCode: SYSTEM_SURVEY_CODE,
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
    test('childSurveyCodes intradocument uniqueness', async () => {
        const surveyData = {
            surveyCode: '123456',
            parentSurveyCode: SYSTEM_SURVEY_CODE,
            createdByUserObjectId: new mongoose.Types.ObjectId(),
            siteLocation: SiteLocation.LOCATION_A,
            childSurveyCodes: ['111111', '111111', '222222']
        };

        const survey = new Survey(surveyData);
        
        await expect(survey.save()).rejects.toThrow();
    });

    test('childSurveyCodes interdocument uniqueness', async () => {
        const surveyData1 = {
            surveyCode: '123456',
            parentSurveyCode: SYSTEM_SURVEY_CODE,
            createdByUserObjectId: new mongoose.Types.ObjectId(),
            siteLocation: SiteLocation.LOCATION_A,
            childSurveyCodes: ['111111', '222222', '333333']
        };

        const surveyData2 = {
            surveyCode: '789012',
            parentSurveyCode: SYSTEM_SURVEY_CODE,
            createdByUserObjectId: new mongoose.Types.ObjectId(),
            siteLocation: SiteLocation.LOCATION_A,
            childSurveyCodes: ['111111', '444444', '555555']
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
            parentSurveyCode: SYSTEM_SURVEY_CODE,
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
            parentSurveyCode: SYSTEM_SURVEY_CODE,
            createdByUserObjectId: new mongoose.Types.ObjectId(),
            siteLocation: SiteLocation.LOCATION_A
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
        const parent = new Survey({
            surveyCode: 'PARENT1',
            parentSurveyCode: SYSTEM_SURVEY_CODE,
            createdByUserObjectId: new mongoose.Types.ObjectId(),
            siteLocation: SiteLocation.LOCATION_A,
            childSurveyCodes: ['CHILD1A', 'CHILD1B', 'CHILD1C']
        });
        const savedParent = await parent.save();

        const child = new Survey({
            surveyCode: 'CHILD1A',
            parentSurveyCode: savedParent.surveyCode,
            createdByUserObjectId: new mongoose.Types.ObjectId(),
            siteLocation: SiteLocation.LOCATION_A,
            childSurveyCodes: ['CHILD1D', 'CHILD1E', 'CHILD1F']
        });

        const savedChild = await child.save();
        expect(savedChild._id).toBeDefined();
        expect(savedChild.parentSurveyCode).toBe(savedParent.surveyCode);
    });

    test('chronology: rejects when parent createdAt is in the future', async () => {
        const parent = new Survey({
            surveyCode: 'PARENT2',
            parentSurveyCode: SYSTEM_SURVEY_CODE,
            createdByUserObjectId: new mongoose.Types.ObjectId(),
            siteLocation: SiteLocation.LOCATION_A
        });
        const savedParent = await parent.save();

        const future = new Date(Date.now() + 60_000);
        // Hacky way to get around createdAt immutability
        await mongoose.connection.db?.collection(Survey.collection.name)
            .updateOne({ _id: savedParent._id }, { $set: { createdAt: future } });

        const child = new Survey({
            surveyCode: 'CHILD2A',
            parentSurveyCode: savedParent.surveyCode,
            createdByUserObjectId: new mongoose.Types.ObjectId(),
            siteLocation: SiteLocation.LOCATION_A
        });

        await expect(child.save()).rejects.toThrow(errors.REFERRAL_CHRONOLOGY_VIOLATION.message);
    });

    test('chronology: rejects when parent not found', async () => {
        const child = new Survey({
            surveyCode: 'CHILD3A',
            parentSurveyCode: '999999',
            createdByUserObjectId: new mongoose.Types.ObjectId(),
            siteLocation: SiteLocation.LOCATION_A
        });

        await expect(child.save()).rejects.toThrow(errors.PARENT_SURVEY_NOT_FOUND.message);
    });

    
});
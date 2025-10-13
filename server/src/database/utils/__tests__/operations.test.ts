import { describe, test, expect, beforeEach, beforeAll, afterAll } from '@jest/globals';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { create, update, read } from '../operations';
import { createSurveySchema, updateSurveySchema, readSurveysSchema } from '../../types/survey.type';
import Survey, { ISurvey } from '../../models/survey.model';
import { SiteLocation, SYSTEM_SURVEY_CODE } from '../constants';
import { Types } from 'mongoose';
import { AuthenticatedRequest } from '@/types/auth';
import { fail } from 'assert';

describe('Database Operations (smoke + key paths)', () => {
  let mongoServer: MongoMemoryServer;
  let validObjectId: string;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    validObjectId = new Types.ObjectId().toString();
  });

  afterAll(async () => {
    await mongoose.connection.close();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await Survey.deleteMany({});
  });

  function req(body: any = {}, params: any = {}): AuthenticatedRequest {
    return { body, params } as AuthenticatedRequest;
  }

  describe('create', () => {
    test('creates with minimal required fields and sets defaults', async () => {
      const body = {
        surveyCode: '789012',
        createdByUserObjectId: validObjectId,
        siteLocation: SiteLocation.LOCATION_A,
        responses: {'question1': 'answer1'},
        generatedSurveyCodes: [
          { code: '444444', usedBySurveyObjectId: null },
          { code: '555555', usedBySurveyObjectId: null },
          { code: '666666', usedBySurveyObjectId: null }
        ]
      };

      const result = await create(req(body), createSurveySchema);

      expect(result.status).toBe(201);
      if ('data' in result && !Array.isArray(result.data)) {
        const data = result.data as ISurvey;
        expect(data.surveyCode).toBe('789012');
        expect(data.referredBySurveyCode).toBe(SYSTEM_SURVEY_CODE);
        expect(data.responses).toEqual({ question1: 'answer1' });
        expect(data.isCompleted).toBe(false);
      } else {
        fail('Expected single object in data for create');
      }
    });

    test('returns 400 for validation error (bad types/lengths)', async () => {
      const bad = {
        surveyCode: '123',               // too short
        createdByUserObjectId: 'nope',   // not an ObjectId
        siteLocation: 'InvalidLocation'  // not enum
      };

      const result = await create(req(bad), createSurveySchema);
      expect(result.status).toBe(400);
      expect(result.message).toBe('Validation error');
    });
  });

  describe('update', () => {
    test('updates responses and isCompleted', async () => {
      const created = await Survey.create({
        surveyCode: '123456',
        referredBySurveyCode: SYSTEM_SURVEY_CODE,
        createdByUserObjectId: validObjectId,
        siteLocation: SiteLocation.LOCATION_A,
        responses: {'question1': 'answer1'},
        generatedSurveyCodes: [
          { code: '111111', usedBySurveyObjectId: null },
          { code: '222222', usedBySurveyObjectId: null },
          { code: '333333', usedBySurveyObjectId: null }
        ]
      });

      const body = { responses: { q1: 'a1' }, isCompleted: true };
      const result = await update(req(body, { objectId: created._id.toString() }), updateSurveySchema);

      expect(result.status).toBe(200);
      if ('data' in result && !Array.isArray(result.data)) {
        const data = result.data as ISurvey;
        expect(data._id.toString()).toBe(created._id.toString());
        expect(data.responses).toEqual({ q1: 'a1' });
        expect(data.isCompleted).toBe(true);
      } else {
        fail('Expected single object in data for update');
      }
    });

    test('returns 400 when objectId param missing', async () => {
      const body = { responses: { q1: 'a1' } };
      const result = await update(req(body), updateSurveySchema);

      expect(result.status).toBe(400);
      expect(result.message).toContain('objectId is required');
    });
  });

  describe('read', () => {
    beforeEach(async () => {
      await Survey.insertMany([
        {
          surveyCode: '111111',
          referredBySurveyCode: '333333',
          createdByUserObjectId: validObjectId,
          siteLocation: SiteLocation.LOCATION_A,
          isCompleted: true,
          generatedSurveyCodes: [
            { code: 'AAA111', usedBySurveyObjectId: null },
            { code: 'BBB222', usedBySurveyObjectId: null },
            { code: 'CCC333', usedBySurveyObjectId: null }
          ]
        },
        {
          surveyCode: '222222',
          referredBySurveyCode: SYSTEM_SURVEY_CODE,
          createdByUserObjectId: validObjectId,
          siteLocation: SiteLocation.LOCATION_A,
          isCompleted: false,
          generatedSurveyCodes: [
            { code: 'DDD444', usedBySurveyObjectId: null },
            { code: 'EEE555', usedBySurveyObjectId: null },
            { code: 'FFF666', usedBySurveyObjectId: null }
          ]
        }
      ]);
    });

    test('reads all with no filters', async () => {
      const result = await read(req({}), readSurveysSchema);
      expect(result.status).toBe(200);
      if ('data' in result && Array.isArray(result.data)) {
        const data = result.data as ISurvey[];
        expect(data.length).toBe(2);
      } else {
        fail('Expected array in data for read');
      }
    });

    test('reads with user filter', async () => {
      const result = await read(req({ createdByUserObjectId: validObjectId }), readSurveysSchema);
      expect(result.status).toBe(200);
      if ('data' in result && Array.isArray(result.data)) {
        const data = result.data as ISurvey[];
        expect(data.length).toBe(2);
        expect(data.every((s) => s.createdByUserObjectId.toString() === validObjectId)).toBe(true);
      } else {
        fail('Expected array in data for read');
      }
    });
  });

  describe('withValidation', () => {
    test('returns 400 on Zod validation failure', async () => {
      const result = await create(req({}), createSurveySchema);
      expect(result.status).toBe(400);
      expect(result.message).toBe('Validation error');
    });
  });
});

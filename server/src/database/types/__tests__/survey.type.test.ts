import { describe, test, expect } from '@jest/globals';
import { Types } from 'mongoose';
import { 
  createSurveySchema, 
  updateSurveySchema, 
  readSurveySchema, 
  readSurveysSchema 
} from '../survey.type';
import { SiteLocation, SYSTEM_SURVEY_CODE } from '../../utils/constants';

const validObjectId = new Types.ObjectId().toString();
const validSurveyObjectId = new Types.ObjectId().toString();

const validCreateData = {
    surveyCode: '123456',
    referredBySurveyCode: '000000',
    createdByUserObjectId: validObjectId,
    responses: { question1: 'answer1', question2: 'answer2' },
    isCompleted: false,
    coordinates: {
      latitude: 40.7128,
      longitude: -74.0060
    },
    siteLocation: SiteLocation.LOCATION_A,
    generatedSurveyCodes: [
      {
        code: '111111',
        usedBySurveyObjectId: validSurveyObjectId
      },
      {
        code: '222222',
        usedBySurveyObjectId: null
      },
      {
        code: '333333',
        usedBySurveyObjectId: null
      }
    ]
  };

describe('Survey Type Validation Schemas', () => {
  describe('createSurveySchema', () => {

    test('should validate valid create survey data', () => {
      const result = createSurveySchema.safeParse(validCreateData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validCreateData);
      }
    });

    test('should validate with minimal required fields', () => {
      const minimalData = {
        surveyCode: '123456',
        createdByUserObjectId: validObjectId,
        siteLocation: SiteLocation.LOCATION_A,
        responses: {
            question1: 'answer1',
        },
        generatedSurveyCodes: [
            {
                code: '111111',
                usedBySurveyObjectId: null
            },
            {
                code: '222222',
                usedBySurveyObjectId: null
            },
            {
                code: '333333',
                usedBySurveyObjectId: null
            }
        ]
      };
      
      const result = createSurveySchema.safeParse(minimalData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.referredBySurveyCode).toBe(SYSTEM_SURVEY_CODE);
        expect(result.data.responses).toEqual({ question1: 'answer1' });
        expect(result.data.isCompleted).toBe(false);
        expect(result.data.generatedSurveyCodes).toEqual([
            {
                code: '111111',
                usedBySurveyObjectId: null
            },
            {
                code: '222222',
                usedBySurveyObjectId: null
            },
            {
                code: '333333',
                usedBySurveyObjectId: null
            }
        ]);
      }
    });

    test('should reject invalid survey code length', () => {
      const invalidData = {
        ...validCreateData,
        surveyCode: '12345' // Too short
      };
      
      const result = createSurveySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('exactly 6 characters');
      }
    });

    test('should reject invalid referredBySurveyCode length', () => {
      const invalidData = {
        ...validCreateData,
        referredBySurveyCode: '12345' // Too short
      };
      
      const result = createSurveySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('exactly 6 characters');
      }
    });

    test('should reject invalid user objectId', () => {
      const invalidData = {
        ...validCreateData,
        createdByUserObjectId: 'invalid-id'
      };
      
      const result = createSurveySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Invalid user objectId');
      }
    });

    test('should reject invalid coordinates', () => {
      const invalidData = {
        ...validCreateData,
        coordinates: {
          latitude: 91, // Invalid latitude
          longitude: -74.0060
        }
      };
      
      const result = createSurveySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    test('should reject invalid site location', () => {
      const invalidData = {
        ...validCreateData,
        siteLocation: 'InvalidLocation'
      };
      
      const result = createSurveySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    test('should reject invalid generated survey code length', () => {
      const invalidData = {
        ...validCreateData,
        generatedSurveyCodes: [
          {
            code: '12345', // Too short
            usedBySurveyObjectId: validSurveyObjectId
          }
        ]
      };
      
      const result = createSurveySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('exactly 6 characters');
      }
    });

    test('should reject invalid survey objectId in generated codes', () => {
      const invalidData = {
        ...validCreateData,
        generatedSurveyCodes: [
          {
            code: '111111',
            usedBySurveyObjectId: 'invalid-id'
          }
        ]
      };
      
      const result = createSurveySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Invalid survey objectId');
      }
    });

    test('should accept null usedBySurveyObjectId', () => {
      const validData = {
        ...validCreateData,
        generatedSurveyCodes: [
          {
            code: '111111',
            usedBySurveyObjectId: null
          },
          {
            code: '222222',
            usedBySurveyObjectId: validSurveyObjectId
          },
          {
            code: '333333',
            usedBySurveyObjectId: null
          }
        ]
      };
      
      const result = createSurveySchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('updateSurveySchema', () => {
    const validUpdateData = {
      responses: { question1: 'updated answer', question2: 'another answer' },
      isCompleted: true
    };

    test('should validate valid update data', () => {
      const result = updateSurveySchema.safeParse(validUpdateData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validUpdateData);
      }
    });

    test('should validate with only responses', () => {
      const responsesOnly = {
        responses: { question1: 'answer' }
      };
      
      const result = updateSurveySchema.safeParse(responsesOnly);
      expect(result.success).toBe(true);
    });

    test('should reject empty responses object', () => {
      const invalidData = {
        responses: {}
      };
      
      const result = updateSurveySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('at least one response');
      }
    });

    test('should reject invalid isCompleted type', () => {
      const invalidData = {
        responses: { question1: 'answer' },
        isCompleted: 'true' // Should be boolean
      };
      
      const result = updateSurveySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    test('should reject invalid responses type', () => {
      const invalidData = {
        responses: 'not an object',
        isCompleted: true
      };
      
      const result = updateSurveySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('readSurveySchema', () => {
    test('should validate valid survey ID', () => {
      const validData = {
        _id: validObjectId
      };
      
      const result = readSurveySchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validData);
      }
    });

    test('should reject invalid survey ID', () => {
      const invalidData = {
        _id: 'invalid-id'
      };
      
      const result = readSurveySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Invalid survey objectId');
      }
    });

    test('should reject missing _id', () => {
      const invalidData = {};
      
      const result = readSurveySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('readSurveysSchema', () => {
    test('should validate with all optional filters', () => {
      const validData = {
        createdByUserObjectId: validObjectId,
        siteLocation: SiteLocation.LOCATION_A,
        isCompleted: true,
        referredBySurveyCode: '123456',
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-02')
      };
      
      const result = readSurveysSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validData);
      }
    });

    test('should validate with no filters (empty object)', () => {
      const emptyData = {};
      
      const result = readSurveysSchema.safeParse(emptyData);
      expect(result.success).toBe(true);
    });

    test('should validate with partial filters', () => {
      const partialData = {
        isCompleted: false,
        siteLocation: SiteLocation.LOCATION_A
      };
      
      const result = readSurveysSchema.safeParse(partialData);
      expect(result.success).toBe(true);
    });

    test('should reject invalid user objectId', () => {
      const invalidData = {
        createdByUserObjectId: 'invalid-id'
      };
      
      const result = readSurveysSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Invalid user objectId');
      }
    });

    test('should reject invalid site location', () => {
      const invalidData = {
        siteLocation: 'InvalidLocation'
      };
      
      const result = readSurveysSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    test('should reject invalid isCompleted type', () => {
      const invalidData = {
        isCompleted: 'true' // Should be boolean
      };
      
      const result = readSurveysSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    test('should reject invalid date format', () => {
      const invalidData = {
        createdAt: 'not-a-date'
      };
      
      const result = readSurveysSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    test('should accept valid date strings', () => {
      const validData = {
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-02T00:00:00.000Z'
      };
      
      const result = readSurveysSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    test('should accept Date objects', () => {
      const validData = {
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-02')
      };
      
      const result = readSurveysSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });
});

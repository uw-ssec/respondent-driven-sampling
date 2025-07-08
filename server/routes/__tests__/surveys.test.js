const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const surveyRoutes = require('../surveys');
const Survey = require('../../models/Survey');

// Mock the generateReferralCode utility
jest.mock('../../utils/generateReferralCode', () => {
  let counter = 0;
  return jest.fn().mockImplementation(() => {
    counter++;
    return `TESTCODE${counter}`;
  });
});

describe('Survey Routes', () => {
  let mongoServer;
  let app;
  let testSurvey;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    
    app = express();
    app.use(express.json());
    app.use('/api/surveys', surveyRoutes);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Clear surveys collection before each test
    await Survey.deleteMany({});
    
    // Create a test survey with referral codes
    testSurvey = new Survey({
      employeeId: 'EMP1234',
      employeeName: 'John Doe',
      responses: { 
        question1: 'answer1',
        question2: 'answer2'
      }
    });
    
    testSurvey.referralCodes.push({ code: 'VALIDCODE1' });
    testSurvey.referralCodes.push({ code: 'VALIDCODE2' });
    testSurvey.referralCodes.push({ code: 'USEDCODE' });
    
    const usedSurvey = new Survey({
      employeeId: 'EMP5678',
      employeeName: 'Jane Doe',
      responses: { question1: 'answer3' }
    });
    await usedSurvey.save();
    
    // Mark the USEDCODE as used
    testSurvey.referralCodes.find(r => r.code === 'USEDCODE').usedBySurvey = usedSurvey._id;
    testSurvey.referralCodes.find(r => r.code === 'USEDCODE').usedAt = new Date();
    
    await testSurvey.save();
  });

  describe('GET /api/surveys/validate-ref/:code', () => {
    test('should validate an existing unused referral code', async () => {
      const res = await request(app)
        .get('/api/surveys/validate-ref/VALIDCODE1');

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Valid referral code.');
      expect(res.body.surveyId).toBeDefined();
    });

    test('should reject a non-existent referral code', async () => {
      const res = await request(app)
        .get('/api/surveys/validate-ref/INVALIDCODE');

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/Invalid referral code/);
    });
    
    test('should reject an already used referral code', async () => {
      const res = await request(app)
        .get('/api/surveys/validate-ref/USEDCODE');

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/already been used/);
    });
  });

  describe('POST /api/surveys/submit', () => {
    test('should submit a new survey with generated referral codes', async () => {
      const newSurvey = {
        employeeId: 'EMP5678',
        employeeName: 'Jane Doe',
        responses: {
          question1: 'answer3',
          question2: 'answer4'
        }
      };

      const res = await request(app)
        .post('/api/surveys/submit')
        .send(newSurvey);

      expect(res.statusCode).toBe(201);
      expect(res.body.message).toBe('Survey submitted successfully!');
      expect(res.body.newSurveyId).toBeDefined();
      expect(res.body.referralCodes).toHaveLength(3);
      expect(res.body.referralCodes[0]).toBe('TESTCODE1');
      
      // Check that survey was saved with referral codes
      const savedSurvey = await Survey.findById(res.body.newSurveyId);
      expect(savedSurvey).toBeTruthy();
      expect(savedSurvey.referralCodes).toHaveLength(3);
    });

    test('should submit a survey with a valid referral code', async () => {
      const newSurvey = {
        employeeId: 'EMP8910',
        employeeName: 'Bob Smith',
        responses: {
          question1: 'answer5'
        },
        referredByCode: 'VALIDCODE1'
      };

      const res = await request(app)
        .post('/api/surveys/submit')
        .send(newSurvey);

      expect(res.statusCode).toBe(201);
      
      // Check that the referral code was marked as used
      const updatedOriginalSurvey = await Survey.findById(testSurvey._id);
      const referralObj = updatedOriginalSurvey.referralCodes.find(r => r.code === 'VALIDCODE1');
      expect(referralObj.usedBySurvey).toBeDefined();
      expect(referralObj.usedAt).toBeDefined();
    });

    test('should reject submission with missing required fields', async () => {
      const incompleteSurvey = {
        employeeId: 'EMP5678'
        // Missing employeeName and responses
      };

      const res = await request(app)
        .post('/api/surveys/submit')
        .send(incompleteSurvey);

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/Missing required fields/);
    });
  });

  describe('GET /api/surveys/all', () => {
    test('should return all surveys for admin users', async () => {
      const res = await request(app)
        .get('/api/surveys/all')
        .set('X-User-Role', 'Admin');

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(2); // Our test data has 2 surveys
    });

    test('should return only user\'s surveys for non-admin users', async () => {
      const res = await request(app)
        .get('/api/surveys/all')
        .set('X-User-Role', 'Volunteer')
        .set('X-Employee-ID', 'EMP1234');

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(1);
      expect(res.body[0].employeeId).toBe('EMP1234');
    });
  });

  describe('GET /api/surveys/:id', () => {
    test('should return a specific survey for admin users', async () => {
      const res = await request(app)
        .get(`/api/surveys/${testSurvey._id}`)
        .set('X-User-Role', 'Admin');

      expect(res.statusCode).toBe(200);
      expect(res.body.employeeId).toBe(testSurvey.employeeId);
      expect(res.body.employeeName).toBe(testSurvey.employeeName);
    });

    test('should return a specific survey for the owning user', async () => {
      const res = await request(app)
        .get(`/api/surveys/${testSurvey._id}`)
        .set('X-User-Role', 'Volunteer')
        .set('X-Employee-ID', 'EMP1234');

      expect(res.statusCode).toBe(200);
      expect(res.body.employeeId).toBe(testSurvey.employeeId);
    });

    test('should forbid access to other users\' surveys', async () => {
      const res = await request(app)
        .get(`/api/surveys/${testSurvey._id}`)
        .set('X-User-Role', 'Volunteer')
        .set('X-Employee-ID', 'EMP5678');

      expect(res.statusCode).toBe(403);
      expect(res.body.message).toMatch(/Forbidden/);
    });

    test('should return 404 for non-existent survey', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/api/surveys/${nonExistentId}`)
        .set('X-User-Role', 'Admin');

      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe('Survey not found');
    });
  });
}); 
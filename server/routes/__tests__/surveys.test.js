const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const surveyRoutes = require('../surveys');
const Survey = require('../../models/Survey');
const User = require('../../models/Users');
const { generateAuthToken } = require('../../utils/authTokenHandler');

// TODO: Need to change these tests so that they mock create tokens before using endpoints that need them

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

  // validate
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

  // all
  describe('GET /api/surveys/all', () => {
    test('add user to fake db', async () => {
      // Create a new user
      const user = await new User({
        employeeUd: "EMP1234",
        firstName: 'John',
        lastName: 'Doe',
        email: 'existing@example.com',
        phone: '1234567890',
        role: 'Admin'
      }).save();

      const updatedUser = await User.findOne({ employeeId: user.employeeId });
      expect(updatedUser.firstName).toBe("John");
    });

    test('should return all surveys for admin users', async () => {
      // Create a new user
      const user = await new User({
        employeeUd: "EMP1234",
        firstName: 'John',
        lastName: 'Doe',
        email: 'existing1@example.com',
        phone: '1234567890',
        role: 'Admin'
      }).save();

      const updatedUser = await User.findOne({ employeeId: user.employeeId });
      expect(updatedUser.firstName).toBe("John");

      // Create a token to send when calling api endpoint - FILL IN INFORMATION WITH A REAL EMPLOYEE FROM DB
      const token = generateAuthToken(
        "John",
        "Admin",
        "EMP1234"
      );

      // Await
      const res = await request(app)
        .get('/api/surveys/all')
        .set('X-User-Role', 'Admin')
        .set('x-employee-id', 'EMP1234')
        .set('Authorization', `Bearer ${token}`);

        //Authorization: `Bearer ${token}`
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

  // get/:id
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

  // Test for save endpoint
  describe('POST /api/surveys/save/:inProgress', () => {
    test('Should submit a new survey with generated referral codes', async () => {
      const newSurvey = {
        employeeId: 'EMP5678',
        employeeName: 'Jane Doe',
        responses: {
          question1: 'answer3',
          question2: 'answer4'
        }
      };

      const res = await request(app)
        .post(`/api/surveys/submit/${false}`)
        .send(newSurvey);

      expect(res.statusCode).toBe(201);
      expect(res.body.message).toBe('Survey saved successfully!');
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

}); 

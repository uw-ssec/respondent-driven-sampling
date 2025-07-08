const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Survey = require('../Survey');

describe('Survey Model Test', () => {
  let mongoServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  afterEach(async () => {
    await Survey.deleteMany({});
  });

  test('should create and save a survey successfully', async () => {
    const surveyData = {
      employeeId: 'EMP1234',
      employeeName: 'John Doe',
      responses: { 
        question1: 'answer1',
        question2: 'answer2'
      }
    };
    
    const validSurvey = new Survey(surveyData);
    const savedSurvey = await validSurvey.save();
    
    expect(savedSurvey._id).toBeDefined();
    expect(savedSurvey.employeeId).toBe(surveyData.employeeId);
    expect(savedSurvey.employeeName).toBe(surveyData.employeeName);
    expect(savedSurvey.responses).toEqual(surveyData.responses);
    expect(savedSurvey.createdAt).toBeDefined();
    expect(savedSurvey.referralCodes).toEqual([]);
    expect(savedSurvey.referredByCode).toBeNull();
  });

  test('should fail validation for missing required fields', async () => {
    const incompleteData = {
      employeeId: 'EMP1234'
    };
    
    const invalidSurvey = new Survey(incompleteData);
    
    let err;
    try {
      await invalidSurvey.save();
    } catch (error) {
      err = error;
    }
    
    expect(err).toBeDefined();
    expect(err.name).toBe('ValidationError');
  });

  test('should add a referral code to the survey', async () => {
    const surveyData = {
      employeeId: 'EMP1234',
      employeeName: 'John Doe',
      responses: { question1: 'answer1' }
    };
    
    const survey = new Survey(surveyData);
    survey.referralCodes.push({ code: 'ABCD1234' });
    const savedSurvey = await survey.save();
    
    expect(savedSurvey.referralCodes.length).toBe(1);
    expect(savedSurvey.referralCodes[0].code).toBe('ABCD1234');
    expect(savedSurvey.referralCodes[0].usedBySurvey).toBeNull();
    expect(savedSurvey.referralCodes[0].usedAt).toBeNull();
  });

  test('should mark a referral code as used', async () => {
    // Create first survey with a referral code
    const survey1 = new Survey({
      employeeId: 'EMP1234',
      employeeName: 'John Doe',
      responses: { question1: 'answer1' }
    });
    survey1.referralCodes.push({ code: 'ABCD1234' });
    await survey1.save();

    // Create second survey that uses the referral code
    const survey2 = new Survey({
      employeeId: 'EMP5678',
      employeeName: 'Jane Doe',
      responses: { question1: 'answer2' },
      referredByCode: 'ABCD1234'
    });
    await survey2.save();

    // Mark the referral code as used
    const referralObj = survey1.referralCodes.find(rc => rc.code === 'ABCD1234');
    referralObj.usedBySurvey = survey2._id;
    referralObj.usedAt = new Date();
    await survey1.save();

    // Retrieve the updated survey and check if the referral code is marked as used
    const updatedSurvey = await Survey.findById(survey1._id);
    const updatedRef = updatedSurvey.referralCodes.find(rc => rc.code === 'ABCD1234');
    
    expect(updatedRef.usedBySurvey).toBeDefined();
    expect(updatedRef.usedBySurvey.toString()).toBe(survey2._id.toString());
    expect(updatedRef.usedAt).toBeDefined();
  });

  test('should save a survey with coordinates', async () => {
    const surveyData = {
      employeeId: 'EMP1234',
      employeeName: 'John Doe',
      responses: { question1: 'answer1' },
      coords: { lat: 47.6062, lng: -122.3321 }
    };
    
    const survey = new Survey(surveyData);
    const savedSurvey = await survey.save();
    
    expect(savedSurvey.coords).toEqual(surveyData.coords);
  });
}); 
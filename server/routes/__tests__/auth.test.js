const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const authRoutes = require('../auth');
const User = require('../../models/Users');

// Mock twilio
jest.mock('twilio', () => {
  return jest.fn().mockImplementation(() => {
    return {
      verify: {
        v2: {
          services: jest.fn().mockReturnValue({
            verifications: {
              create: jest.fn().mockResolvedValue({ status: 'pending' })
            },
            verificationChecks: {
              create: jest.fn().mockImplementation(({ code }) => {
                return Promise.resolve({ 
                  status: code === '123456' ? 'approved' : 'rejected' 
                });
              })
            }
          })
        }
      }
    };
  });
});

describe('Auth Routes', () => {
  let mongoServer;
  let app;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    
    app = express();
    app.use(express.json());
    app.use('/api/auth', authRoutes);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await User.deleteMany({});
  });

  describe('POST /api/auth/send-otp-signup', () => {
    test('should send OTP for new user signup', async () => {
      const res = await request(app)
        .post('/api/auth/send-otp-signup')
        .send({ phone: '1234567890', email: 'newuser@example.com' });

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('OTP sent!');
    });

    test('should reject existing user', async () => {
      // Create a user first
      await new User({
        firstName: 'John',
        lastName: 'Doe',
        email: 'existing@example.com',
        phone: '1234567890',
        role: 'Volunteer'
      }).save();

      const res = await request(app)
        .post('/api/auth/send-otp-signup')
        .send({ phone: '1234567890', email: 'existing@example.com' });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/User already exists/);
    });
  });

  describe('POST /api/auth/verify-otp-signup', () => {
    test('should create a new user when OTP is valid', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '1234567890',
        role: 'Volunteer',
        code: '123456'
      };

      const res = await request(app)
        .post('/api/auth/verify-otp-signup')
        .send(userData);

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Signup successful!');
      expect(res.body.firstName).toBe(userData.firstName);
      expect(res.body.role).toBe(userData.role);
      expect(res.body.employeeId).toMatch(/^EMP\d{4}$/);
      
      // Check that user was created in database
      const user = await User.findOne({ email: userData.email });
      expect(user).toBeTruthy();
      expect(user.firstName).toBe(userData.firstName);
    });

    test('should reject invalid OTP', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '1234567890',
        role: 'Volunteer',
        code: 'invalid'
      };

      const res = await request(app)
        .post('/api/auth/verify-otp-signup')
        .send(userData);

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe('Invalid OTP');
      
      // Check that no user was created
      const user = await User.findOne({ email: userData.email });
      expect(user).toBeNull();
    });
  });

  describe('GET /api/auth/users/:employeeId', () => {
    test('should fetch a user by employee ID', async () => {
      // Create a test user
      const user = new User({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '1234567890',
        role: 'Volunteer'
      });
      await user.save();

      const res = await request(app)
        .get(`/api/auth/users/${user.employeeId}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.firstName).toBe(user.firstName);
      expect(res.body.lastName).toBe(user.lastName);
      expect(res.body.email).toBe(user.email);
    });

    test('should return 404 for non-existent employee ID', async () => {
      const res = await request(app)
        .get('/api/auth/users/EMP9999');

      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe('User not found');
    });
  });
  
  describe('PUT /api/auth/users/:employeeId', () => {
    test('should update user profile', async () => {
      // Create a test user
      const user = new User({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '1234567890',
        role: 'Volunteer'
      });
      await user.save();
      
      const updates = {
        firstName: 'Johnny',
        lastName: 'Doe',
        email: 'johnny@example.com',
        phone: '1234567890',
        role: 'Manager'
      };

      const res = await request(app)
        .put(`/api/auth/users/${user.employeeId}`)
        .send(updates);

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Profile updated successfully');
      
      // Verify the changes in the database
      const updatedUser = await User.findOne({ employeeId: user.employeeId });
      expect(updatedUser.firstName).toBe(updates.firstName);
      expect(updatedUser.lastName).toBe(updates.lastName);
      expect(updatedUser.email).toBe(updates.email);
      expect(updatedUser.role).toBe(updates.role);
    });
  });
}); 
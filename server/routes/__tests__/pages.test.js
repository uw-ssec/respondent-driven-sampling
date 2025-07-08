const request = require('supertest');
const express = require('express');
const pagesRoutes = require('../pages');

describe('Pages Routes', () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/pages', pagesRoutes);
  });

  describe('GET /api/pages/dashboard', () => {
    test('should return welcome message for dashboard', async () => {
      const res = await request(app).get('/api/pages/dashboard');
      
      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Welcome to the dashboard!');
    });
  });

  describe('GET /api/pages/survey', () => {
    test('should return survey page loaded message', async () => {
      const res = await request(app).get('/api/pages/survey');
      
      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Survey page loaded!');
    });
  });

  describe('GET /api/pages/signup', () => {
    test('should return signup page loaded message', async () => {
      const res = await request(app).get('/api/pages/signup');
      
      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Signup page loaded!');
    });
  });

  describe('GET /api/pages/login', () => {
    test('should return login page loaded message', async () => {
      const res = await request(app).get('/api/pages/login');
      
      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Login page loaded!');
    });
  });
}); 
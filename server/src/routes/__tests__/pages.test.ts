import { describe, expect, it, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import pagesRouter from '../pages';

describe('Pages Routes', () => {
	let app: express.Application;

	beforeAll(() => {
		app = express();
		app.use(express.json());
		app.use('/api/pages', pagesRouter);
	});

	describe('GET /dashboard', () => {
		it('should return welcome message for dashboard', async () => {
			const response = await request(app)
				.get('/api/pages/dashboard')
				.expect(200);

			expect(response.body).toEqual({
				message: 'Welcome to the dashboard!'
			});
		});
	});

	describe('GET /survey', () => {
		it('should return survey page loaded message', async () => {
			const response = await request(app)
				.get('/api/pages/survey')
				.expect(200);

			expect(response.body).toEqual({
				message: 'Survey page loaded!'
			});
		});
	});

	describe('GET /signup', () => {
		it('should return signup page loaded message', async () => {
			const response = await request(app)
				.get('/api/pages/signup')
				.expect(200);

			expect(response.body).toEqual({
				message: 'Signup page loaded!'
			});
		});
	});

	describe('GET /login', () => {
		it('should return login page loaded message', async () => {
			const response = await request(app)
				.get('/api/pages/login')
				.expect(200);

			expect(response.body).toEqual({
				message: 'Login page loaded!'
			});
		});
	});

	describe('GET /nonexistent', () => {
		it('should return 404 for non-existent routes', async () => {
			await request(app)
				.get('/api/pages/nonexistent')
				.expect(404);
		});
	});
});

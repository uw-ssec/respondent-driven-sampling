import express, { Request, Response } from 'express';

const router = express.Router();

//Sends static messages

// Dashboard Page
// This route handles the dashboard page
// It responds with a welcome message
router.get('/dashboard', (_req: Request, res: Response) => {
	res.json({ message: 'Welcome to the dashboard!' });
});

// Survey Page
// This route handles the survey page
// It responds with a message indicating the survey page is loaded
// It is useful for users to fill out surveys
router.get('/survey', (_req: Request, res: Response) => {
	res.json({ message: 'Survey page loaded!' });
});

// Signup Page
// This route handles the signup page
// It responds with a message indicating the signup page is loaded
// It is useful for new users to register
router.get('/signup', (_req: Request, res: Response) => {
	res.json({ message: 'Signup page loaded!' });
});

// Login Page
// This route handles the login page
// It responds with a message indicating the login page is loaded
// It is useful for existing users to log in
router.get('/login', (_req: Request, res: Response) => {
	res.json({ message: 'Login page loaded!' });
});

export default router;

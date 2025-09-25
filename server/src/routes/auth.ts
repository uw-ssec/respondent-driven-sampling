import express, { Request, Response } from 'express';
import twilio from 'twilio';

import { auth } from '@/middleware/auth';
import User from '@/models/users';
import {
	AuthenticatedRequest,
	LoginRequest,
	OTPRequest,
	SignupRequest
} from '@/types/auth';
import { generateAuthToken } from '@/utils/authTokenHandler.js';

const router = express.Router();

const accountSid = process.env.TWILIO_ACCOUNT_SID as string;
const authToken = process.env.TWILIO_AUTH_TOKEN as string;
const verifySid = process.env.TWILIO_VERIFY_SID as string;

const client = twilio(accountSid, authToken);
const verifyService = client.verify.v2.services(verifySid);

// ─── Send OTP for SIGNUP ─────────────────────────────────────────────
router.post(
	'/send-otp-signup',
	async (req: Request, res: Response): Promise<void> => {
		const { phone, email }: OTPRequest = req.body;
		try {
			const existingUser = await User.findOne({
				$or: [{ phone }, { email }]
			});
			if (existingUser) {
				res.status(400).json({
					message: 'User already exists – please log in.'
				});
				return;
			}
			await verifyService.verifications.create({
				to: phone,
				channel: 'sms'
			});
			res.json({ message: 'OTP sent!' });
		} catch (err) {
			console.error('Send OTP signup error:', err);
			res.status(500).json({ message: 'Failed to send OTP' });
		}
	}
);

// ─── Send OTP for LOGIN ──────────────────────────────────────────────
router.post(
	'/send-otp-login',
	async (req: Request, res: Response): Promise<void> => {
		const { email, phone }: OTPRequest = req.body;
		try {
			const user = await User.findOne({ email, phone });
			if (!user) {
				res.status(400).json({
					message: 'Email and phone number do not match any user.'
				});
				return;
			}
			await verifyService.verifications.create({
				to: phone,
				channel: 'sms'
			});
			res.json({ message: 'OTP sent!' });
		} catch (err) {
			console.error('Send OTP login error:', err);
			res.status(500).json({ message: 'Failed to send OTP' });
		}
	}
);

// ─── Verify OTP for SIGNUP ──────────────────────────────────────────
router.post(
	'/verify-otp-signup',
	async (req: Request, res: Response): Promise<void> => {
		const {
			phone,
			code,
			firstName,
			lastName,
			email,
			role
		}: SignupRequest & {
			firstName: string;
			lastName: string;
			role: string;
		} = req.body;
		try {
			const check = await verifyService.verificationChecks.create({
				to: phone,
				code
			});
			if (check.status !== 'approved') {
				res.status(400).json({ message: 'Invalid OTP' });
				return;
			}
			if (await User.findOne({ phone })) {
				res.status(400).json({
					message: 'User already exists – please log in.'
				});
				return;
			}
			const newUser = new User({
				firstName,
				lastName,
				email,
				phone,
				role
			});
			await newUser.save();
			const token = generateAuthToken(
				newUser.firstName,
				newUser.role,
				newUser.employeeId
			);

			res.json({
				message: 'Signup successful!',
				token: token,
				redirectTo: '/dashboard'
			});
		} catch (err) {
			console.error('Verify OTP signup error:', err);
			res.status(500).json({
				message: 'Failed to verify OTP during signup'
			});
		}
	}
);

// ─── Verify OTP for LOGIN ────────────────────────────────────────────
router.post(
	'/verify-otp-login',
	async (req: Request, res: Response): Promise<void> => {
		const { phone, code }: LoginRequest = req.body;
		try {
			const check = await verifyService.verificationChecks.create({
				to: phone,
				code
			});
			if (check.status !== 'approved') {
				res.status(400).json({ message: 'Invalid OTP' });
				return;
			}
			const user = await User.findOne({ phone });
			if (!user) {
				res.status(400).json({
					message: 'No account for this phone – please sign up.'
				});
				return;
			}
			if (user.approvalStatus !== 'Approved') {
				res.status(403).json({
					message:
						'Account not approved yet. Please contact your admin.'
				});
				return;
			}
			const token = generateAuthToken(
				user.firstName,
				user.role,
				user.employeeId
			);

			res.json({
				message: 'Login successful!',
				token: token,
				redirectTo: '/dashboard'
			});
		} catch (err) {
			console.error('Verify OTP login error:', err);
			res.status(500).json({
				message: 'Failed to verify OTP during login'
			});
		}
	}
);

// ─── Admin Approvals ────────────────────────────────────────────────
router.get(
	'/users',
	[auth],
	async (req: AuthenticatedRequest, res: Response): Promise<void> => {
		if (req.user?.role !== 'Admin') {
			res.sendStatus(403);
			return;
		}
		try {
			const users = await User.find(
				{},
				'firstName lastName role approvalStatus'
			);
			res.json(users);
		} catch (err) {
			console.error('Error fetching users:', err);
			res.status(500).json({
				message: 'Server error: Unable to fetch users'
			});
		}
	}
);

router.put(
	'/users/:id/approve',
	auth,
	async (req: AuthenticatedRequest, res: Response): Promise<void> => {
		if (req.user?.role !== 'Admin') {
			res.sendStatus(403);
			return;
		}
		try {
			const { status } = req.body;
			if (!['Approved', 'Rejected'].includes(status)) {
				res.status(400).json({ message: 'Invalid status update.' });
				return;
			}
			const updatedUser = await User.findByIdAndUpdate(
				req.params.id,
				{ approvalStatus: status },
				{ new: true }
			);
			if (!updatedUser) {
				res.status(404).json({ message: 'User not found.' });
				return;
			}
			res.json({ message: `User ${status}`, user: updatedUser });
		} catch (err) {
			console.error('Error updating approval status:', err);
			res.status(500).json({
				message: 'Server error: Unable to update approval status.'
			});
		}
	}
);

// ─── For Admin to PreAuthorize  ───────────────────────────────────────
router.post(
	'/preapprove',
	auth,
	async (req: AuthenticatedRequest, res: Response): Promise<void> => {
		if (req.user?.role !== 'Admin') {
			res.sendStatus(403);
			return;
		}
		try {
			const { firstName, lastName, email, phone, role } = req.body;
			if (await User.findOne({ phone })) {
				res.status(400).json({
					message: 'User already exists with this phone'
				});
				return;
			}
			const newUser = new User({
				firstName,
				lastName,
				email,
				phone,
				role,
				approvalStatus: 'Approved'
			});
			await newUser.save();
			res.status(201).json({ message: 'User registered successfully!' });
		} catch (error) {
			console.error(error);
			res.status(500).json({
				message: 'Server Error: Could not register user'
			});
		}
	}
);

// ─── View Profile   ───────────────────────────────────────
router.get(
	'/users/:employeeId',
	auth,
	async (req: AuthenticatedRequest, res: Response): Promise<void> => {
		if (
			!['Admin', 'Manager'].includes(req.user?.role || '') &&
			req.user?.employeeId !== req.params.employeeId
		) {
			res.sendStatus(403);
			return;
		}
		try {
			const user = await User.findOne({
				employeeId: req.params.employeeId
			});
			console.log('User found:', user);
			if (!user) {
				res.status(404).json({ message: 'User not found' });
				return;
			}

			res.json(user);
		} catch (err) {
			console.error('Error fetching user profile:', err);
			res.status(500).json({
				message: 'Server error: Unable to fetch user profile'
			});
		}
	}
);

// ─── Edit User Profile  ───────────────────────────────────────
router.put(
	'/users/:employeeId',
	auth,
	async (req: AuthenticatedRequest, res: Response): Promise<void> => {
		if (
			req.user?.role !== 'Admin' &&
			req.user?.employeeId !== req.params.employeeId
		) {
			res.sendStatus(403);
			return;
		}
		try {
			const { firstName, lastName, email, phone, role } = req.body;

			const updatedUser = await User.findOneAndUpdate(
				{ employeeId: req.params.employeeId },
				{ firstName, lastName, email, phone, role },
				{ new: true }
			);

			if (!updatedUser) {
				res.status(404).json({ message: 'User not found' });
				return;
			}

			res.json({
				message: 'Profile updated successfully',
				user: updatedUser
			});
		} catch (err) {
			console.error('Error updating user profile:', err);
			res.status(500).json({
				message: 'Server error: Unable to update user profile'
			});
		}
	}
);

// ─── View Profile by _id ───────────────────────────────────────
router.get(
	'/users/by-id/:id',
	auth,
	async (req: AuthenticatedRequest, res: Response): Promise<void> => {
		if (req.user?.role !== 'Admin') {
			res.sendStatus(403);
			return;
		}
		try {
			const user = await User.findById(req.params.id);
			console.log('User found:', user);
			if (!user) {
				res.status(404).json({ message: 'User not found' });
				return;
			}

			res.json(user);
		} catch (err) {
			console.error('Error fetching user profile by _id:', err);
			res.status(500).json({
				message: 'Server error: Unable to fetch user profile'
			});
		}
	}
);

// ─── Edit User Profile by _id ───────────────────────────────────────
router.put(
	'/users/by-id/:id',
	auth,
	async (req: AuthenticatedRequest, res: Response): Promise<void> => {
		if (req.user?.role !== 'Admin') {
			res.sendStatus(403);
			return;
		}
		try {
			const { firstName, lastName, email, phone, role } = req.body;

			const updatedUser = await User.findByIdAndUpdate(
				req.params.id,
				{ firstName, lastName, email, phone, role },
				{ new: true }
			);

			if (!updatedUser) {
				res.status(404).json({ message: 'User not found' });
				return;
			}

			res.json({
				message: 'Profile updated successfully',
				user: updatedUser
			});
		} catch (err) {
			console.error('Error updating user profile by _id:', err);
			res.status(500).json({
				message: 'Server error: Unable to update user profile'
			});
		}
	}
);

export default router;

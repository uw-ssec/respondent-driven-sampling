import express, { Request, Response } from 'express';
import { Types } from 'mongoose';
import twilio from 'twilio';
import { z } from 'zod';

import User from '@/database/user/mongoose/user.model';
import {
	sendOtpLoginSchema,
	sendOtpSignupSchema,
	verifyOtpLoginSchema,
	verifyOtpSignupSchema
} from '@/database/user/zod/auth.validator';
import { ApprovalStatus } from '@/database/utils/constants';
import { validate } from '@/middleware/validate';
import { generateAuthToken } from '@/utils/authTokenHandler';

const router = express.Router();

const accountSid = process.env.TWILIO_ACCOUNT_SID as string;
const authToken = process.env.TWILIO_AUTH_TOKEN as string;
const verifySid = process.env.TWILIO_VERIFY_SID as string;

const client = twilio(accountSid, authToken);
const verifyService = client.verify.v2.services(verifySid);

// ─── Send OTP for SIGNUP ─────────────────────────────────────────────
router.post(
	'/send-otp-signup',
	[validate(sendOtpSignupSchema)],
	async (req: Request, res: Response): Promise<void> => {
		const { phone, email }: z.infer<typeof sendOtpSignupSchema> = req.body;
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
	[validate(sendOtpLoginSchema)],
	async (req: Request, res: Response): Promise<void> => {
		const { phone }: z.infer<typeof sendOtpLoginSchema> = req.body;
		try {
			const user = await User.findOne({ phone });
			if (!user) {
				res.status(400).json({
					message: 'No account for this phone – please sign up.'
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
	[validate(verifyOtpSignupSchema)],
	async (req: Request, res: Response): Promise<void> => {
		const {
			phone,
			code,
			firstName,
			lastName,
			email,
			role,
			locationObjectId
		}: z.infer<typeof verifyOtpSignupSchema> = req.body;

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

			const newUser = await User.create({
				firstName,
				lastName,
				email,
				phone,
				role,
				locationObjectId: new Types.ObjectId(locationObjectId)
			});
			const token = generateAuthToken(newUser.id);

			res.json({
				message: 'Signup successful! Your account is pending approval.',
				token: token
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
	[validate(verifyOtpLoginSchema)],
	async (req: Request, res: Response): Promise<void> => {
		const { phone, code }: z.infer<typeof verifyOtpLoginSchema> = req.body;
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
			if (user.approvalStatus !== ApprovalStatus.APPROVED) {
				res.status(403).json({
					message:
						'Account not approved yet. Please contact your admin and log in again once approved.'
				});
				return;
			}
			const token = generateAuthToken(user.id);

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

export default router;

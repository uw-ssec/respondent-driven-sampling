import { z } from 'zod';

import { createUserSchema } from '@/database/user/zod/user.validator';

// OTP code validation
const otpCodeSchema = z
	.string()
	.length(6, 'OTP code must be 6 digits')
	.regex(/^\d{6}$/, 'OTP code must contain only digits');

export const sendOtpSignupSchema = createUserSchema.strict();

export const sendOtpLoginSchema = createUserSchema
	.pick({
		phone: true,
		email: true
	})
	.partial({ email: true })
	.strict();

export const verifyOtpSignupSchema = createUserSchema
	.extend({
		code: otpCodeSchema
	})
	.strict();

export const verifyOtpLoginSchema = createUserSchema
	.pick({
		phone: true
	})
	.extend({
		code: otpCodeSchema
	})
	.strict();

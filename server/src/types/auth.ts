import { Request } from 'express';
import { JwtPayload } from 'jsonwebtoken';

import { Ability } from '@/permissions/constants';

export interface AuthenticatedRequest extends Request {
	user?: {
		userObjectId: string;
		role: string;
		firstName: string;
		locationObjectId: string;
	};
	authorization?: Ability;
}

export interface JWTPayload extends JwtPayload {
	userObjectId: string;
	role: string;
	firstName: string;
}

export interface OTPRequest {
	phone: string;
	// Removed email to simplify OTP flow based on phone number only
	// email: string;
}

export interface VerifyOTPRequest extends OTPRequest {
	code: string;
}

export interface SignupRequest extends VerifyOTPRequest {
	name: string;
	role: string;
}

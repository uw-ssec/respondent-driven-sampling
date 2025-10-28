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
}

export interface OTPRequest {
	phone: string;
	email: string;
}

export interface VerifyOTPRequest extends OTPRequest {
	code: string;
}

export interface SignupRequest extends VerifyOTPRequest {
	name: string;
	role: string;
}

export interface LoginRequest extends VerifyOTPRequest {}

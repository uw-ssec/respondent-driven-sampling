import { Request } from 'express';
import { JwtPayload } from 'jsonwebtoken';

export interface AuthenticatedRequest extends Request {
	user?: {
		id: string;
		employeeId: string;
		role: string;
	};
}

export interface JWTPayload extends JwtPayload {
	id: string;
	employeeId: string;
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

import dotenv from 'dotenv';
import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/Users.js';
import { AuthenticatedRequest } from '../types/auth.js';
import { verifyAuthToken } from '../utils/authTokenHandler.js';

dotenv.config({ path: './.env' });

// Middleware for verifying token signature and storing token info in response
// If this call passes to the next handler, it means the user is atleast a volunteer
// and has been approved by an admin.
export async function auth(
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction
): Promise<void> {
	const authHeader = req.headers['authorization'];
	const token = authHeader && authHeader.split(' ')[1];

	if (!token) {
		res.status(401).json({ message: 'Access denied. No token provided' });
		return;
	}

	try {
		const decodedAuthToken = verifyAuthToken(token);

		// Add the decoded token to the request object
		req.user = {
			id: decodedAuthToken.id || decodedAuthToken.employeeId,
			employeeId: decodedAuthToken.employeeId,
			role: decodedAuthToken.role
		};

		// Checking if the user's account is approved
		const user = await User.findOne({
			employeeId: decodedAuthToken.employeeId
		});

		console.log(user);

		if (!user) {
			// This case means that the user has a valid JWT signed by our server but
			// the account it is linked to does not exist in our database.
			res.status(400).json({
				message: 'User account not found. Please contact your admin.'
			});
			return;
		}

		if (user.approvalStatus !== 'Approved') {
			res.status(403).json({
				message:
					'User account not approved yet. Please contact your admin.'
			});
			return;
		}

		next();
	} catch (err: any) {
		res.status(401).json({ message: `Invalid Token: ${err.name}` });
		return;
	}
}

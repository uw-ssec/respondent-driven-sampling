import { NextFunction, Response } from 'express';

import User from '@/models/users';
import { AuthenticatedRequest } from '@/types/auth';
import { verifyAuthToken } from '@/utils/authTokenHandler';
import defineAbilitiesForUser from '@/utils/roleBasedAccess';

// Middleware for verifying token signature and storing token info in response
// If this call passes to the next handler, it means the user is atleast a volunteer
// and has been approved by an admin.
export async function auth(
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction
): Promise<void> {
	const authHeader = req.headers['authorization'];

	if (!authHeader) {
		res.status(401).json({ message: 'Access denied. No token provided' });
		return;
	}

	const parts = authHeader.split(' ');
	const token = parts.length === 2 ? parts[1] : authHeader;

	if (!token) {
		res.status(401).json({ message: 'Access denied. No token provided' });
		return;
	}

	try {
		const decodedAuthToken = verifyAuthToken(token);

		// Add the decoded token to the request object
		req.user = {
			employeeId: decodedAuthToken.employeeId,
			role: decodedAuthToken.role,
			firstName: decodedAuthToken.firstName
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

		// Add role authorization to the request
		req.authorization = defineAbilitiesForUser(req, user.id, user.permissions);

		next();
	} catch (err: any) {
		res.status(401).json({ message: `Invalid Token: ${err.name}` });
		return;
	}
}

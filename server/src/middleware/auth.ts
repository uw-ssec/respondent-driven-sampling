import { NextFunction, Response } from 'express';

import Survey from '@/database/survey/mongoose/survey.model';
import User, { IUser } from '@/database/user/mongoose/user.model';
import { ApprovalStatus } from '@/database/utils/constants';
import defineAbilitiesForUser from '@/permissions/abilityBuilder';
import { AuthenticatedRequest } from '@/types/auth';
import { verifyAuthToken } from '@/utils/authTokenHandler';

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

		// Get user account from database
		const user: IUser | null = await User.findById(
			decodedAuthToken.userObjectId
		);

		if (!user) {
			// This case means that the user has a valid JWT signed by our server but
			// the account it is linked to does not exist in our database.
			res.status(400).json({
				message: 'User account not found. Please contact your admin.'
			});
			return;
		}

		// Check if user is approved
		if (user.approvalStatus !== ApprovalStatus.APPROVED) {
			res.status(403).json({
				message:
					'User account not approved yet. Please contact your admin.'
			});
			return;
		}

		// Derive latest location objectId from user's latest survey
		// This is for read/update permissions for surveys, where users can only read/update surveys created at their own location
		const latestSurvey = await Survey.findOne({
			createdByUserObjectId: decodedAuthToken.userObjectId
		}).sort({ updatedAt: -1 });
		// If user has no associated surveys, use the user's profile location
		const latestLocationObjectId =
			latestSurvey?.locationObjectId ?? user.locationObjectId;

		// Add user information to request object now that we have fully validated the user
		// and fetched their latest location
		req.user = {
			userObjectId: decodedAuthToken.userObjectId.toString(),
			role: user.role,
			firstName: user.firstName,
			locationObjectId: latestLocationObjectId.toString()
		};

		// Add role authorization to the request
		req.authorization = defineAbilitiesForUser(
			req,
			decodedAuthToken.userObjectId,
			latestLocationObjectId.toString(),
			user.permissions.map(permission => ({
				action: permission.action,
				subject: permission.subject,
				conditions: permission.conditions
			}))
		);
		if (!req.authorization) {
			res.sendStatus(403);
			return;
		}

		next();
	} catch (err: any) {
		res.status(401).json({ message: `Invalid Token: ${err.name}` });
		return;
	}
}

import { subject } from '@casl/ability';
import { accessibleBy } from '@casl/mongoose';
import express, { NextFunction, Response } from 'express';

import User from '@/database/user/mongoose/user.model';
import {
	createUserSchema,
	updateUserSchema
} from '@/database/user/zod/user.validator';
import { auth } from '@/middleware/auth';
import { validate } from '@/middleware/validate';
import { ACTIONS, SUBJECTS } from '@/permissions/constants';
import { DEFAULT_TIMEZONE } from '@/permissions/utils';
import { AuthenticatedRequest } from '@/types/auth';

const router = express.Router();

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users
 *     description: Retrieve all users with optional query filters and permission-based access control
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *       403:
 *         description: Forbidden - insufficient permissions
 *       500:
 *         description: Internal server error
 */
router.get(
	'/',
	[auth],
	async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
		if (!req.authorization?.can(ACTIONS.CASL.READ, SUBJECTS.USER)) {
			return res.sendStatus(403);
		}
		try {
			const result = await User.find({
				$and: [
					req.query,
					accessibleBy(req.authorization, ACTIONS.CASL.READ).ofType(
						User.modelName
					),
					{ deletedAt: null }
				]
			});
			// Successfully fetched users
			res.status(200).json({
				message: 'Users fetched successfully',
				data: result.map(item => item.toObject())
			});
		} catch (err) {
			next(err);
		}
	}
);

/**
 * @swagger
 * /api/users/{objectId}:
 *   get:
 *     summary: Get user by ID
 *     description: Retrieve a specific user by its ObjectId
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: objectId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ObjectId
 *     responses:
 *       200:
 *         description: User retrieved successfully
 *       403:
 *         description: Forbidden - insufficient permissions
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.get(
	'/:objectId',
	[auth],
	async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
		// Can't check for just permission just based on _id because user may have custom permissions around read access beyond just _id
		// If a user has a custom permission that allows them to read target user's profile, it may reject early if we only check for _id permission
		if (!req.authorization?.can(ACTIONS.CASL.READ, SUBJECTS.USER)) {
			return res.status(403).json({ message: 'Forbidden' });
		}
		try {
			const result = await User.findOne({
				_id: req.params.objectId,
				...accessibleBy(req.authorization, ACTIONS.CASL.READ).ofType(
					User.modelName
				) // Dynamic filter for handling custom permissions
			});
		if (!result) {
			return res.status(404).json({ message: 'User not found' });
		}
		res.status(200).json({
			message: 'User fetched successfully',
			data: result.toObject(),
			serverTimezone: DEFAULT_TIMEZONE
		});
	} catch (err) {
		next(err);
	}
}
);

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Create user
 *     description: Create a new user with the provided data
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *     responses:
 *       201:
 *         description: User created successfully
 *       403:
 *         description: Forbidden - insufficient permissions
 *       409:
 *         description: Conflict - email already exists
 *       500:
 *         description: Internal server error
 */
router.post(
	'/',
	[auth, validate(createUserSchema)],
	async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
		if (!req.authorization?.can(ACTIONS.CASL.CREATE, SUBJECTS.USER)) {
			return res.status(403).json({ message: 'Forbidden' });
		}
		try {
			const result = await User.create(req.body);
			res.status(201).json({
				message: 'User created successfully',
				data: result.toObject()
			});
		} catch (err) {
			next(err);
		}
	}
);

/**
 * @swagger
 * /api/users/{objectId}:
 *   patch:
 *     summary: Update user
 *     description: Update a specific user by its ObjectId
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: objectId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ObjectId
 *     requestBody:
 *       required: true
 *     responses:
 *       200:
 *         description: User updated successfully
 *       403:
 *         description: Forbidden - insufficient permissions
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.patch(
	'/:objectId',
	[auth, validate(updateUserSchema)],
	async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
		if (!req.authorization?.can(ACTIONS.CASL.UPDATE, SUBJECTS.USER)) {
			return res.status(403).json({ message: 'Forbidden' });
		}
		try {
			// Update access if document-dependent AND field-dependent (i.e. fields in our request body)
			// so we first need to fetch the document and check permissions (more below)
			const user = await User.findById(req.params.objectId);
			if (!user) {
				return res.status(404).json({ message: 'User not found' });
			}

			// Check if we are allowed to update all fields in request body
			// These checks depend on interactions between our current user's role and location and the target user's role and location
			// ex. a manager can only approve users with 'VOLUNTEER' role at their current location today, but are also allowed to update their own profile
			// if the request tries to update a field that is impermissible for the document we fetched, we will return a 403 error
			if (
				!Object.keys(req.body).every(field =>
					req.authorization?.can(
						ACTIONS.CASL.UPDATE,
						subject(SUBJECTS.USER, user.toObject()),
						field
					)
				)
			) {
				return res.status(403).json({
					message:
						'You are not allowed to make this update on this user'
				});
			}

			// Passed permission checks, update user document
			const result = await User.findByIdAndUpdate(
				req.params.objectId,
				req.body,
				{ new: true }
			);
			if (!result) {
				return res.status(404).json({ message: 'User not found' });
			}
			res.status(200).json({
				message: 'User updated successfully',
				data: result.toObject()
			});
		} catch (err) {
			next(err);
		}
	}
);

/**
 * @swagger
 * /api/users/{objectId}:
 *   delete:
 *     summary: Soft delete user
 *     description: Soft delete a specific user by setting deletedAt timestamp (user is not permanently removed)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: objectId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ObjectId
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       403:
 *         description: Forbidden - insufficient permissions
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.delete(
	'/:objectId',
	[auth],
	async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
		if (
			!req.authorization?.can(
				ACTIONS.CASL.DELETE,
				subject(SUBJECTS.USER, { _id: req.params.objectId })
			) // NOTE: will need to change forced subject() to SUBJECTS.USER if delete permissions ever become field-dependent/document-dependent
		) {
			return res.status(403).json({ message: 'Forbidden' });
		}
		try {
			const result = await User.findByIdAndUpdate(
				req.params.objectId,
				{ deletedAt: new Date() },
				{ new: true }
			);
			if (!result) {
				return res.status(404).json({ message: 'User not found' });
			}
			res.status(200).json({
				message: 'User deleted successfully',
				data: result.toObject()
			});
		} catch (err) {
			next(err);
		}
	}
);

export default router;

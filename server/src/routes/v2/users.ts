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
import { AuthenticatedRequest } from '@/types/auth';

const router = express.Router();

/**
 * @swagger
 * /api/v2/users:
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
	[auth], // TODO: add `read_users` permission check
	async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
		try {
			const result = await User.find({
				$and: [
					req.query,
					req?.authorization
						? accessibleBy(req.authorization).ofType(User.modelName)
						: {},
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
 * /api/v2/users/{objectId}:
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
	[auth], // TODO: add `read_users` permission check
	async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
		try {
			const result = await User.findById(req.params.objectId);
			if (!result) {
				return res.status(404).json({ message: 'User not found' });
			}
			res.status(200).json({
				message: 'User fetched successfully',
				data: result.toObject()
			});
		} catch (err) {
			next(err);
		}
	}
);

/**
 * @swagger
 * /api/v2/users:
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
	[auth, validate(createUserSchema)], // TODO: add `create_users` permission check
	async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
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
 * /api/v2/users/{objectId}:
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
	[auth, validate(updateUserSchema)], // TODO: add `update_users` permission check
	async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
		try {
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
 * /api/v2/users/{objectId}:
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
	[auth], // TODO: add `delete_users` permission check
	async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
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

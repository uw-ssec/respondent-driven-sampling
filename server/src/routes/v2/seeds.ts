import express, { NextFunction, Response } from 'express';

import Seed, { ISeed } from '@/database/seed/mongoose/seed.model';
import { createSeedSchema } from '@/database/seed/zod/seed.validator';
import { generateUniqueSurveyCode } from '@/database/survey/survey.controller';
import { auth } from '@/middleware/auth';
import { validate } from '@/middleware/validate';
import { ACTIONS, SUBJECTS } from '@/permissions/constants';
import { AuthenticatedRequest } from '@/types/auth';

const router = express.Router();

/**
 * @swagger
 * /api/v2/seeds:
 *   get:
 *     summary: Get all seeds
 *     description: Retrieve all seeds with optional query filters
 *     tags: [Seeds]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Seeds retrieved successfully
 *       403:
 *         description: Forbidden - insufficient permissions
 *       500:
 *         description: Internal server error
 */
router.get(
	'/',
	[auth], // TODO: add `read_seeds` permission check
	async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
		if (!req.authorization?.can(ACTIONS.CASL.READ, SUBJECTS.SEED)) {
			return res.sendStatus(403);
		}
		try {
			const result = await Seed.find({
				$and: [req.query]
			});
			// Successfully fetched seeds
			res.status(200).json({
				message: 'Seeds fetched successfully',
				data: result.map(item => item.toObject())
			});
		} catch (err) {
			next(err);
		}
	}
);

/**
 * @swagger
 * /api/v2/seeds/{objectId}:
 *   get:
 *     summary: Get seed by ID
 *     description: Retrieve a specific seed by its ObjectId
 *     tags: [Seeds]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: objectId
 *         required: true
 *         schema:
 *           type: string
 *         description: Seed ObjectId
 *     responses:
 *       200:
 *         description: Seed retrieved successfully
 *       403:
 *         description: Forbidden - insufficient permissions
 *       404:
 *         description: Seed not found
 *       500:
 *         description: Internal server error
 */
router.get(
	'/:objectId',
	[auth],
	async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
		if (!req.authorization?.can(ACTIONS.CASL.READ, SUBJECTS.SEED)) {
			return res.sendStatus(403);
		}
		try {
			const result = await Seed.findById(req.params.objectId);
			// Seed not found
			if (!result) {
				return res.status(404).json({ message: 'Seed not found' });
			}
			// Successfully fetched seed
			res.status(200).json({
				message: 'Seed fetched successfully',
				data: result.toObject()
			});
		} catch (err) {
			next(err);
		}
	}
);

/**
 * @swagger
 * /api/v2/seeds:
 *   post:
 *     summary: Create seed
 *     description: Create a new seed. A unique `surveyCode` is generated server-side; clients provide a `locationObjectId` and optionally `isFallback`.
 *     tags: [Seeds]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - locationObjectId
 *             properties:
 *               locationObjectId:
 *                 type: string
 *                 description: Mongoose ObjectId of the location
 *               isFallback:
 *                 type: boolean
 *                 default: false
 *                 description: Whether this seed was generated as a fallback
 *     responses:
 *       201:
 *         description: Seed created successfully
 *       403:
 *         description: Forbidden - insufficient permissions
 *       409:
 *         description: Conflict - survey code already exists
 *       500:
 *         description: Internal server error
 */
router.post(
	'/',
	[auth, validate(createSeedSchema)],
	async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
		if (!req.authorization?.can(ACTIONS.CASL.CREATE, SUBJECTS.SEED)) {
			return res.sendStatus(403);
		}
		try {
			// Generate a unique survey code for the seed
			const surveyCode = await generateUniqueSurveyCode();

			// Create the seed data with information from the request
			const seedData: ISeed = { surveyCode, ...req.body };

			// Create the seed
			const result = await Seed.create(seedData);

			// Successful!
			res.status(201).json({
				message: 'Seed created successfully',
				data: result.toObject()
			});
		} catch (err) {
			next(err);
		}
	}
);

// Possible TODO: support batch creation of seeds?

// No update route (intentional) - seeds are immutable once created

/**
 * @swagger
 * /api/v2/seeds/{objectId}:
 *   delete:
 *     summary: Delete seed
 *     description: Delete a specific seed by its ObjectId
 *     tags: [Seeds]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: objectId
 *         required: true
 *         schema:
 *           type: string
 *         description: Seed ObjectId
 *     responses:
 *       200:
 *         description: Seed deleted successfully
 *       403:
 *         description: Forbidden - insufficient permissions
 *       404:
 *         description: Seed not found
 *       500:
 *         description: Internal server error
 */
router.delete(
	'/:objectId',
	[auth],
	async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
		if (!req.authorization?.can(ACTIONS.CASL.DELETE, SUBJECTS.SEED)) {
			return res.sendStatus(403);
		}
		try {
			const result = await Seed.findByIdAndDelete(req.params.objectId);
			// Seed not found
			if (!result) {
				return res.status(404).json({ message: 'Seed not found' });
			}
			// Successfully deleted seed
			res.status(200).json({
				message: 'Seed deleted successfully',
				data: result.toObject()
			});
		} catch (err) {
			next(err);
		}
	}
);

export default router;

import express, { NextFunction, Request, Response } from 'express';

import Location, {
	ILocation
} from '@/database/location/mongoose/location.model';
import {
	createLocationSchema,
	updateLocationSchema
} from '@/database/location/zod/location.validator';
import { auth } from '@/middleware/auth';
import { validate } from '@/middleware/validate';
import { ACTIONS, SUBJECTS } from '@/permissions/constants';
import { AuthenticatedRequest } from '@/types/auth';

const router = express.Router();

/**
 * @swagger
 * /api/locations:
 *   get:
 *     summary: Get all locations
 *     description: Retrieve all locations with optional query filters
 *     tags: [Locations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Locations retrieved successfully
 *       403:
 *         description: Forbidden - insufficient permissions
 *       500:
 *         description: Internal server error
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
	try {
		const result = await Location.find({
			$and: [req.query]
		}).sort({ hubName: 1 });
		res.status(200).json({
			message: 'Locations fetched successfully',
			data: result.map(item => item.toObject())
		});
	} catch (err) {
		next(err);
	}
});

/**
 * @swagger
 * /api/locations/{id}:
 *   get:
 *     summary: Get location by ID
 *     description: Retrieve a specific location by its ObjectId
 *     tags: [Locations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Location ObjectId
 *     responses:
 *       200:
 *         description: Location retrieved successfully
 *       403:
 *         description: Forbidden - insufficient permissions
 *       404:
 *         description: Location not found
 *       500:
 *         description: Internal server error
 */
router.get(
	'/:id',
	[auth],
	async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
		if (!req.authorization?.can(ACTIONS.CASL.READ, SUBJECTS.LOCATION)) {
			return res.sendStatus(403);
		}
		try {
			const result = await Location.findById(req.params.id);
			if (!result) {
				return res.status(404).json({ message: 'Location not found' });
			}
			res.status(200).json({
				message: 'Location fetched successfully',
				data: result.toObject()
			});
		} catch (err) {
			next(err);
		}
	}
);

/**
 * @swagger
 * /api/locations:
 *   post:
 *     summary: Create location
 *     description: Create a new location with the provided data
 *     tags: [Locations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name of the location
 *               address:
 *                 type: string
 *                 description: Address of the location
 *               coordinates:
 *                 type: object
 *                 properties:
 *                   latitude:
 *                     type: number
 *                   longitude:
 *                     type: number
 *                 description: Geographic coordinates of the location
 *     responses:
 *       201:
 *         description: Location created successfully
 *       403:
 *         description: Forbidden - insufficient permissions
 *       500:
 *         description: Internal server error
 */
router.post(
	'/',
	[auth, validate(createLocationSchema)],
	async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
		if (!req.authorization?.can(ACTIONS.CASL.CREATE, SUBJECTS.LOCATION)) {
			return res.sendStatus(403);
		}
		try {
			const locationData: ILocation = { ...req.body };
			const result = await Location.create(locationData);
			res.status(201).json({
				message: 'Location created successfully',
				data: result.toObject()
			});
		} catch (err) {
			next(err);
		}
	}
);

/**
 * @swagger
 * /api/locations/{objectId}:
 *   patch:
 *     summary: Update location
 *     description: Update a specific location by its ObjectId
 *     tags: [Locations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: objectId
 *         required: true
 *         schema:
 *           type: string
 *         description: Location ObjectId
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name of the location
 *               address:
 *                 type: string
 *                 description: Address of the location
 *               coordinates:
 *                 type: object
 *                 properties:
 *                   latitude:
 *                     type: number
 *                   longitude:
 *                     type: number
 *                 description: Geographic coordinates of the location
 *     responses:
 *       200:
 *         description: Location updated successfully
 *       403:
 *         description: Forbidden - insufficient permissions
 *       404:
 *         description: Location not found
 *       500:
 *         description: Internal server error
 */
router.patch(
	'/:objectId',
	[auth, validate(updateLocationSchema)],
	async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
		if (!req.authorization?.can(ACTIONS.CASL.UPDATE, SUBJECTS.LOCATION)) {
			return res.sendStatus(403);
		}
		try {
			const result = await Location.findByIdAndUpdate(
				req.params.objectId,
				req.body,
				{ new: true }
			);
			if (!result) {
				return res.status(404).json({ message: 'Location not found' });
			}
			res.status(200).json({
				message: 'Location updated successfully',
				data: result.toObject()
			});
		} catch (err) {
			next(err);
		}
	}
);

/**
 * @swagger
 * /api/locations/{objectId}:
 *   delete:
 *     summary: Delete location
 *     description: Delete a specific location by its ObjectId
 *     tags: [Locations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: objectId
 *         required: true
 *         schema:
 *           type: string
 *         description: Location ObjectId
 *     responses:
 *       200:
 *         description: Location deleted successfully
 *       403:
 *         description: Forbidden - insufficient permissions
 *       404:
 *         description: Location not found
 *       500:
 *         description: Internal server error
 */
router.delete(
	'/:objectId',
	[auth],
	async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
		if (!req.authorization?.can(ACTIONS.CASL.DELETE, SUBJECTS.LOCATION)) {
			return res.sendStatus(403);
		}
		try {
			const result = await Location.findByIdAndDelete(
				req.params.objectId
			);
			if (!result) {
				return res.status(404).json({ message: 'Location not found' });
			}
			res.status(200).json({
				message: 'Location deleted successfully',
				data: result.toObject()
			});
		} catch (err) {
			next(err);
		}
	}
);

export default router;

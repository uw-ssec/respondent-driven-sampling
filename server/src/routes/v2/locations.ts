import express, { NextFunction, Response } from 'express';

import Location, {
	ILocation
} from '@/database/location/mongoose/location.model';
import {
	createLocationSchema,
	updateLocationSchema
} from '@/database/location/zod/location.validator';
import { auth } from '@/middleware/auth';
import { validate } from '@/middleware/validate';
import { AuthenticatedRequest } from '@/types/auth';

const router = express.Router();

router.get(
	'/',
	[auth],
	async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
		try {
			const result = await Location.find({
				$and: [req.query]
			});
			res.status(200).json({
				message: 'Locations fetched successfully',
				data: result.map(item => item.toObject())
			});
		} catch (err) {
			next(err);
		}
	}
);

router.get(
	'/:id',
	[auth],
	async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
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

router.post(
	'/',
	[auth, validate(createLocationSchema)],
	async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
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

router.patch(
	'/:objectId',
	[auth, validate(updateLocationSchema)],
	async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
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

router.delete('/:objectId', [auth], async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
	try {
		const result = await Location.findByIdAndDelete(req.params.objectId);
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
});

export default router;

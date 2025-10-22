import express, { NextFunction, Response } from 'express';

import Seed, { ISeed } from '@/database/seed/mongoose/seed.model';
import { createSeedSchema } from '@/database/seed/zod/seed.validator';
import { generateUniqueReferralCode } from '@/database/survey/survey.controller';
import { auth } from '@/middleware/auth';
import { validate } from '@/middleware/validate';
import { AuthenticatedRequest } from '@/types/auth';

const router = express.Router();

router.get(
	'/',
	[auth], // TODO: add `read_seeds` permission check
	async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
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

router.get(
	'/:objectId',
	[auth], // TODO: add `read_seeds` permission check
	async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
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

router.post(
	'/',
	[auth, validate(createSeedSchema)], // TODO: add `create_seeds` permission check
	async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
		try {
			// Generate a unique survey code for the seed
			const surveyCode = generateUniqueReferralCode();

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

router.delete(
	'/:objectId',
	[auth], // TODO: add `delete_seeds` permission check
	async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
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
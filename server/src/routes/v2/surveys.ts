import { accessibleBy } from '@casl/mongoose';
import express, { NextFunction, Response } from 'express';

import Survey, { ISurvey } from '@/database/survey/mongoose/survey.model';
import {
	generateUniqueChildSurveyCodes,
	getParentSurveyCode
} from '@/database/survey/survey.controller';
import {
	createSurveySchema,
	updateSurveySchema
} from '@/database/survey/zod/survey.validator';
import { SYSTEM_SURVEY_CODE } from '@/database/utils/constants';
import { errors } from '@/database/utils/errors';
import { auth } from '@/middleware/auth';
import { validate } from '@/middleware/validate';
import { ACTIONS, SUBJECTS } from '@/permissions/constants';
import { AuthenticatedRequest } from '@/types/auth';
import Seed from '@/database/seed/mongoose/seed.model';

const router = express.Router();

/**
 * @swagger
 * /api/v2/surveys:
 *   get:
 *     summary: Get all surveys
 *     description: Retrieve all surveys with optional query filters
 *     tags: [Surveys]
 *     responses:
 *       200:
 *         description: Surveys retrieved successfully
 *       403:
 *         description: Forbidden - insufficient permissions
 *       500:
 *         description: Internal server error
 */
router.get(
	'/',
	[auth],
	async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
		if (!req.authorization?.can(ACTIONS.CASL.READ, SUBJECTS.SURVEY)) {
			return res.sendStatus(403);
		}
		try {
			const result = await Survey.find({
				$and: [
					req.query,
					accessibleBy(req.authorization).ofType(Survey.modelName),
					{ deletedAt: null }
				]
			}).sort({ createdAt: -1 }); // always sort most to least recent

			// Successfully fetched surveys
			res.status(200).json({
				message: 'Surveys fetched successfully',
				data: result.map(item => item.toObject())
			});
		} catch (err) {
			next(err);
		}
	}
);

/**
 * @swagger
 * /api/v2/surveys/{objectId}:
 *   get:
 *     summary: Get survey by ID
 *     description: Retrieve a specific survey by its ObjectId
 *     tags: [Surveys]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: objectId
 *         required: true
 *         schema:
 *           type: string
 *         description: Survey ObjectId
 *     responses:
 *       200:
 *         description: Survey retrieved successfully
 *       403:
 *         description: Forbidden - insufficient permissions
 *       404:
 *         description: Survey not found
 *       500:
 *         description: Internal server error
 */
router.get(
	'/:objectId',
	[auth],
	async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
		// Check for basic read permission (more permission checks happen within Mongo query)
		if (!req.authorization?.can(ACTIONS.CASL.READ, SUBJECTS.SURVEY)) {
			return res.sendStatus(403);
		}
		try {
			const result = await Survey.findOne({
				$and: [
					{ _id: req.params.objectId },
					accessibleBy(req.authorization).ofType(Survey.modelName), // Need to pass in dynamic filter here because access is determined by `createdAt` and `locationObjectId` inside of Survey
					{ deletedAt: null }
				]
			});
			// Survey not found
			if (!result) {
				return res.status(404).json({
					message:
						'Survey not found or you do not have permission to read this survey'
				});
			}
			// Successfully fetched survey
			res.status(200).json({
				message: 'Survey fetched successfully',
				data: result.toObject()
			});
		} catch (err) {
			next(err);
		}
	}
);

/**
 * @swagger
 * /api/v2/surveys/{objectId}:
 *   patch:
 *     summary: Update survey
 *     description: Update a specific survey by its ObjectId
 *     tags: [Surveys]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: objectId
 *         required: true
 *         schema:
 *           type: string
 *         description: Survey ObjectId
 *     requestBody:
 *       required: true
 *     responses:
 *       200:
 *         description: Survey updated successfully
 *       403:
 *         description: Forbidden - insufficient permissions
 *       404:
 *         description: Survey not found
 *       500:
 *         description: Internal server error
 */
router.patch(
	'/:objectId',
	[auth, validate(updateSurveySchema)],
	async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
		// Basic check if user is allowed to update any survey at all
		if (!req.authorization?.can(ACTIONS.CASL.UPDATE, SUBJECTS.SURVEY)) {
			return res.sendStatus(403);
		}
		try {
			// Update access is document-dependent but not field-dependent, so we only need to pass in
			// an accessibleBy filter here
			const result = await Survey.findOneAndUpdate(
				{
					$and: [
						{ _id: req.params.objectId },
						accessibleBy(req.authorization).ofType(
							Survey.modelName
						),
						{ deletedAt: null }
					]
				},
				req.body,
				{ new: true }
			);
			if (!result) {
				return res.status(404).json({
					message:
						'Survey not found or you do not have permission to update this survey'
				});
			}
			res.status(200).json({
				message: 'Survey updated successfully',
				data: result.toObject()
			});
		} catch (err) {
			next(err);
		}
	}
);

/**
 * @swagger
 * /api/v2/surveys:
 *   post:
 *     summary: Create survey
 *     description: Create a new survey
 *     tags: [Surveys]
 *     requestBody:
 *       required: true
 *     responses:
 *       201:
 *         description: Survey created successfully
 *       403:
 *         description: Forbidden - insufficient permissions
 *       500:
 *         description: Internal server error
 */
router.post(
	'/',
	[auth, validate(createSurveySchema)],
	async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
		// Different permissions based on creation with or without referral
		// Check permission based on the action type based on query param `new`
		if (req.body.surveyCode === null) {
			if (!req.authorization?.can(ACTIONS.CUSTOM.CREATE_WITHOUT_REFERRAL, SUBJECTS.SURVEY)) {
				return res.status(403).json({ message: 'Please provide a referral code to create a survey.' });
			}
		} else {
			if (!req.authorization?.can(ACTIONS.CASL.CREATE, SUBJECTS.SURVEY)) {
				return res.status(403).json({ message: 'Forbidden' });
			}
		}
		try {
			const surveyData: ISurvey = req.body;

			// Generate unique child survey codes for the new survey
			surveyData.childSurveyCodes =
				await generateUniqueChildSurveyCodes();

			if (surveyData.parentSurveyCode === SYSTEM_SURVEY_CODE) {
				// System code indicates that survey code should map to an existing seed
				const seed = await Seed.findOne({ surveyCode: surveyData.surveyCode });
				if (!seed) {
					// Seed not found
					const err = errors.SEED_CODE_NOT_FOUND;
					return res.status(err.status).json({
						message: err.message
					});
				}
				else {
					// Seed found, set locationObjectId to the seed's locationObjectId
					surveyData.locationObjectId = seed.locationObjectId as any;
				}
			}
			else {
				// If survey code is provided, try to find parent survey
				const parentSurveyCode = await getParentSurveyCode(
					surveyData.surveyCode
				);
				if (parentSurveyCode) {
					// Found parent survey
					surveyData.parentSurveyCode = parentSurveyCode;
				} else {
					// Parent survey not found, try to find a seed
					const seed = await Seed.findOne({ surveyCode: surveyData.surveyCode });
					if (seed) {
						// Seed found, set locationObjectId to the seed's locationObjectId
						surveyData.locationObjectId = seed.locationObjectId as any;
						surveyData.parentSurveyCode = SYSTEM_SURVEY_CODE;
					}

					// No parent survey or seed found, return error
					else {
						const err = errors.PARENT_SURVEY_NOT_FOUND;
						return res.status(err.status).json({
							message: err.message
						});
					}
				}
			}

			// Attempt to create the survey
			const result = await Survey.create(surveyData);

			// Successful!
			res.status(201).json({
				message: 'Survey created successfully',
				data: result.toObject()
			});
		} catch (err) {
			next(err);
		}
	}
);

/**
 * @swagger
 * /api/v2/surveys/{objectId}:
 *   delete:
 *     summary: Delete survey
 *     description: Delete a specific survey by its ObjectId
 *     tags: [Surveys]
 *     parameters:
 *       - in: path
 *         name: objectId
 *         required: true
 *         schema:
 *           type: string
 *         description: Survey ObjectId
 *     responses:
 *       200:
 *         description: Survey deleted successfully
 *       403:
 *         description: Forbidden - insufficient permissions
 *       404:
 *         description: Survey not found
 *       500:
 *         description: Internal server error
 */
router.delete(
	'/:objectId',
	[auth],
	async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
		// TODO: may want to revisit here and see if we need to make a distinction for
		// hard/soft-delete in permissions
		if (!req.authorization?.can(ACTIONS.CASL.DELETE, SUBJECTS.SURVEY)) {
			return res.sendStatus(403);
		}
		try {
			// TODO: Delete specific fields within survey document as well
			const result = await Survey.findByIdAndUpdate(
				req.params.objectId,
				{ deletedAt: new Date() },
				{ new: true }
			);
			if (!result) {
				return res.status(404).json({ message: 'Survey not found' });
			}
			res.status(200).json({
				message: 'Survey deleted successfully',
				data: result.toObject()
			});
		} catch (err) {
			next(err);
		}
	}
);
export default router;

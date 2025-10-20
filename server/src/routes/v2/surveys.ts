import { subject } from '@casl/ability';
import { accessibleBy } from '@casl/mongoose';
import express, { NextFunction, Response } from 'express';

import Survey, { ISurvey } from '@/database/survey/mongoose/survey.model';
import {
	generateUniqueChildSurveyCodes,
	generateUniqueReferralCode,
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
import { AuthenticatedRequest } from '@/types/auth';
import { ACTIONS, SUBJECTS } from '@/utils/roleDefinitions';

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
		try {
			const result = await Survey.find({
				$and: [
					req.query,
					req?.authorization
						? accessibleBy(req.authorization).ofType(
								Survey.modelName
							)
						: {},
					{ deletedAt: null }
				]
			});

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
		if (
			!req.authorization?.can(
				ACTIONS.CASL.READ,
				subject(SUBJECTS.SURVEY, { _id: req.params.objectId })
			)
		) {
			return res.sendStatus(403);
		}
		try {
			const result = await Survey.findOne({
				_id: req.params.objectId,
				deletedAt: null
			});
			// Survey not found
			if (!result) {
				return res.status(404).json({ message: 'Survey not found' });
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
		if (
			!req.authorization?.can(
				ACTIONS.CASL.UPDATE,
				subject(SUBJECTS.SURVEY, { _id: req.params.objectId })
			)
		) {
			return res.sendStatus(403);
		}
		try {
			const result = await Survey.findOneAndUpdate(
				{ _id: req.params.objectId, deletedAt: null },
				req.body,
				{ new: true }
			);
			if (!result) {
				return res.status(404).json({ message: 'Survey not found' });
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
		if (!req.authorization?.can(ACTIONS.CASL.CREATE, SUBJECTS.SURVEY)) {
			return res.sendStatus(403);
		}
		try {
			const surveyData: ISurvey = req.body;

			// Generate unique child survey codes for the new survey
			surveyData.childSurveyCodes = generateUniqueChildSurveyCodes();

			// Resolve parent survey code
			if (surveyData.surveyCode) {
				// If survey code is provided, try to find parent survey
				const parentSurveyCode = await getParentSurveyCode(
					surveyData.surveyCode
				);
				if (parentSurveyCode) {
					// Found parent survey
					surveyData.parentSurveyCode = parentSurveyCode;
				} else {
					// Parent survey not found
					const err = errors.PARENT_SURVEY_NOT_FOUND;
					return res.status(err.status).json({
						message: err.message
					});
				}
			} else if (req.query.new === 'true') {
				// If `new` query parameter is true, generate new survey code and set parent to seed
				surveyData.parentSurveyCode = SYSTEM_SURVEY_CODE;
				surveyData.surveyCode = generateUniqueReferralCode();
			} else {
				const err = errors.NO_SURVEY_CODE_PROVIDED;
				return res.status(err.status).json({
					message: err.message
				});
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

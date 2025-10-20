import { subject } from '@casl/ability';
import express, { Response } from 'express';

import {
	createSurvey,
	deleteSurvey,
	getSurvey,
	getSurveys,
	updateSurvey
} from '@/database/survey/survey.controller';
import {
	createSurveySchema,
	updateSurveySchema
} from '@/database/survey/zod/survey.validator';
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
router.get('/', [auth], async (req: AuthenticatedRequest, res: Response) => {
	if (!req.authorization) {
		res.sendStatus(403);
		return;
	}
	try {
		await getSurveys(req, res);
	} catch (error) {
		console.error('Error fetching survey:', error);
	}
});

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
	async (req: AuthenticatedRequest, res: Response) => {
		if (
			!req.authorization?.can(
				ACTIONS.CASL.READ,
				subject(SUBJECTS.SURVEY, { _id: req.params.objectId })
			)
		) {
			res.sendStatus(403);
			return;
		}
		try {
			await getSurvey(req, res);
		} catch (error) {
			console.error('Error fetching survey:', error);
		}
	}
);

/**
 * @swagger
 * /api/v2/surveys/{objectId}:
 *   put:
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
	async (req: AuthenticatedRequest, res: Response) => {
		if (
			!req.authorization?.can(
				ACTIONS.CASL.UPDATE,
				subject(SUBJECTS.SURVEY, { _id: req.params.objectId })
			)
		) {
			res.sendStatus(403);
			return;
		}
		try {
			await updateSurvey(req, res);
		} catch (error) {
			console.error('Error updating survey:', error);
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
	async (req: AuthenticatedRequest, res: Response) => {
		if (!req.authorization?.can(ACTIONS.CASL.CREATE, SUBJECTS.SURVEY)) {
			res.sendStatus(403);
			return;
		}
		try {
			await createSurvey(req, res);
		} catch (error) {
			console.error('Error creating survey:', error);
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
	async (req: AuthenticatedRequest, res: Response) => {
		try {
			await deleteSurvey(req, res);
		} catch (error) {
			console.error('Error deleting survey:', error);
		}
	}
);
export default router;

import { subject } from '@casl/ability';
import express, { Response } from 'express';

import {
	createSurvey,
	getSurvey,
	getSurveys,
	updateSurvey
} from '@/database/controllers/survey.controller';
import { auth } from '@/middleware/auth';
import { AuthenticatedRequest } from '@/types/auth';
import { ACTIONS, SUBJECTS } from '@/utils/roleDefinitions';

const router = express.Router();

router.get('/', [auth], async (req: AuthenticatedRequest, res: Response) => {
	// REVIEW: Let's move this to auth middleware?.
	if (!req.authorization) {
		// REVIEW: Will we ever reach here? Why will req.authorization be undefined?
		res.sendStatus(403);
		return;
	}
	try {
		await getSurveys(req, res);
	} catch (error) {
		console.error('Error fetching survey:', error);
	}
});

// REVIEW: surveyObjectId vs objectId. How does client send this?
// REVIEW: Params vs body consistency.
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

router.post(
	'/:objectId',
	[auth],
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
			// REVIEW: Update call on POST threw me off.
			await updateSurvey(req, res);
		} catch (error) {
			console.error('Error updating survey:', error);
		}
	}
);

router.put('/', [auth], async (req: AuthenticatedRequest, res: Response) => {
	if (!req.authorization?.can(ACTIONS.CASL.CREATE, SUBJECTS.SURVEY)) {
		res.sendStatus(403);
		return;
	}
	try {
		await createSurvey(req, res);
	} catch (error) {
		console.error('Error creating survey:', error);
	}
});

export default router;

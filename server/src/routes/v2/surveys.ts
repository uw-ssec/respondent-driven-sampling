import express, { Response } from 'express';

import { auth } from '@/middleware/auth';
import { AuthenticatedRequest } from '@/types/auth';
import { createSurvey, updateSurvey, getSurvey, getSurveys } from '@/database/controllers/survey.controller';
import { ACTIONS, SUBJECTS } from '@/utils/roleDefinitions';
import { subject } from '@casl/ability';

const router = express.Router();

router.get(
	'/',
	[auth],
	async (req: AuthenticatedRequest, res: Response) => {
        if (!req.authorization) {
            res.sendStatus(403);
            return;
        }
		try {
			await getSurveys(req, res);
		} catch (error) {
			console.error('Error fetching survey:', error);
		}
	}
)

router.get(
	'/:objectId',
	[auth],
	async (req: AuthenticatedRequest, res: Response) => {
        if (!req.authorization?.can(
            ACTIONS.CASL.READ, 
            subject(SUBJECTS.SURVEY, { _id: req.params.objectId })
        )) {
            res.sendStatus(403);
            return;
        }
		try {
			await getSurvey(req, res);
		} catch (error) {
			console.error('Error fetching survey:', error);
		}
	}
)


router.post(
	'/:objectId',
	[auth],
	async (req: AuthenticatedRequest, res: Response) => {
        if (!req.authorization?.can(
            ACTIONS.CASL.UPDATE,
            subject(SUBJECTS.SURVEY, { _id: req.params.objectId })
        )) {
            res.sendStatus(403);
            return;
        }
		try {
			await updateSurvey(req, res);
		} catch (error) {
			console.error('Error updating survey:', error);
		}
	}
)

router.put(
	'/create',
	[auth],
	async (req: AuthenticatedRequest, res: Response) => {
        if (!req.authorization?.can(
            ACTIONS.CASL.CREATE,
            SUBJECTS.SURVEY
        )) {
            res.sendStatus(403);
            return;
        }
		try {
			await createSurvey(req, res);
		} catch (error) {
			console.error('Error creating survey:', error);
		}
	}
)

export default router;
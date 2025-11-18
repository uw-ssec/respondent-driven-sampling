import express, { NextFunction, Response } from 'express';
import { z } from 'zod';

import Seed, { ISeed } from '@/database/seed/mongoose/seed.model';
import Survey, { ISurvey } from '@/database/survey/mongoose/survey.model';
import { SURVEY_CODE_LENGTH } from '@/database/utils/constants';
import { auth } from '@/middleware/auth';
import { validate } from '@/middleware/validate';
import { AuthenticatedRequest } from '@/types/auth';

const router = express.Router();

const validateReferralCodeSchema = z
	.object({
		code: z
			.string()
			.length(
				SURVEY_CODE_LENGTH,
				`Referral code must be exactly ${SURVEY_CODE_LENGTH} characters`
			)
	})
	.strict()
	.meta({ model: null }); // No specific model associated

// Define the API endpoint
router.post(
	'/validate-referral-code',
	[auth, validate(validateReferralCodeSchema)],
	async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
		try {
			const { code } = req.body;

			const parentSurvey: ISurvey | null = await Survey.findOne({
				childSurveyCodes: code,
				deletedAt: null
			});

			const seed: ISeed | null = await Seed.findOne({
				surveyCode: code,
				deletedAt: null
			});

			// if there is no parent survey or seed connected to this survey code, return false
			if (!parentSurvey && !seed) {
				return res.json({
					isValid: false,
					message:
						'This survey code does not exist. Please try again.'
				});
			}

			const surveyBySurveyCode = await Survey.findOne({
				surveyCode: code,
				deletedAt: null
			});
			// If the survey document already exists, return false
			if (surveyBySurveyCode) {
				return res.json({
					isValid: false,
					message:
						'This survey has already been used. If you have access to it, visit Survey Entry Dashboard to view it.'
				});
			}
			res.status(200).json({
				isValid: true,
				message: 'Referral code is valid'
			});
		} catch (error) {
			next(error);
		}
	}
);

export default router;

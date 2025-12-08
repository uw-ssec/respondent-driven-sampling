import express, { Request, Response } from 'express';

const router = express.Router();

/**
 * GET /api/config
 * Returns client-side configuration from server environment variables.
 * This endpoint is public (no auth required) as it only exposes safe config values.
 * 
 * @returns {object} Configuration object with qualtricsSurveyUrl
 */
router.get('/', (_req: Request, res: Response) => {
	const qualtricsSurveyUrl = process.env.QUALTRICS_SURVEY_URL;

	// Return 500 if required config is missing (requires manual intervention)
	if (!qualtricsSurveyUrl) {
		return res.status(500).json({
			error: 'Server configuration error',
			message: 'Qualtrics survey URL not configured on server'
		});
	}

	return res.status(200).json({
		qualtricsSurveyUrl
	});
});

export default router;

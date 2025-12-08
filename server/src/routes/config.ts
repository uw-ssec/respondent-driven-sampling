import express from 'express';

const router = express.Router();

/**
 * GET /api/config
 * Returns client-side configuration from server environment variables
 * This endpoint is public (no auth required) as it only exposes safe config values
 */
router.get('/', (_req, res) => {
	res.json({
		qualtricsSurveyUrl: process.env.QUALTRICS_SURVEY_URL || null
	});
});

export default router;

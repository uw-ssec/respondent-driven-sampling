import Survey from '@/models/survey';
import express, { Request, Response } from 'express';

import { AuthenticatedRequest } from '@/types/auth';
import generateReferralCode from '@/utils/generateReferralCode';
import { auth } from '@/middleware/auth';

const router = express.Router();

// Validate Referral Code - GET /api/surveys/validate-ref/:code
// This route checks if a referral code is valid and has not been used yet
// It returns a success message if the code is valid
// and a failure message if the code is invalid or already used
router.get(
	'/validate-ref/:code',
	[auth],
	async (req: AuthenticatedRequest, res: Response): Promise<void> => {
		try {
			const { code } = req.params;

			// This is the referral code being validated
			const surveyWithCode = await Survey.findOne({
				'referralCodes.code': code
			});

			if (!surveyWithCode) {
				res.status(400).json({
					message: 'Invalid referral code. Please check again.'
				});
				return;
			}

			const referralObj = surveyWithCode.referralCodes.find(
				rc => rc.code === code
			);

			if (!referralObj) {
				console.log('not found ' + code);
				res.status(400).json({ message: 'Referral code not found.' });
				return;
			}

			if (referralObj.usedBySurvey) {
				console.log('already used ' + code);
				res.status(400).json({
					message: 'This referral code has already been used.'
				});
				return;
			}

			console.log('valid code' + code);
			res.json({
				message: 'Valid referral code.',
				surveyId: surveyWithCode._id
			});
		} catch (error) {
			console.error('Error validating referral code:', error);
			res.status(500).json({
				message: 'Server error. Unable to validate referral code.'
			});
		}
	}
);

// GET /api/surveys/all - Fetch all surveys (Admins get all, others get their own)
// This route fetches all surveys from the database
// It checks the user's role and employee ID from headers
// If the user is an Admin, they can see all surveys
// If the user is not an Admin, they can only see their own surveys
// It returns the surveys in descending order of creation date
router.get(
	'/all',
	[auth],
	async (req: AuthenticatedRequest, res: Response): Promise<void> => {
		try {
			const userRole = req.user?.role;
			const userEmployeeId = req.user?.employeeId;

			if (userRole === 'Admin') {
				const surveys = await Survey.find().sort({ createdAt: -1 });
				res.json(surveys);
				return;
			}

			const surveys = await Survey.find({
				employeeId: userEmployeeId
			}).sort({
				createdAt: -1
			});
			res.json(surveys);
		} catch (error) {
			console.error('Error fetching surveys:', error);
			res.status(500).json({
				message: 'Server error: Unable to fetch surveys'
			});
		}
	}
);

// POST /api/surveys/submit - Submitting a new survey
// This route handles the submission of a new survey
// It checks for required fields in the request body
// It creates a new survey document in the database
// It generates three referral codes for the new survey
router.post(
	'/submit',
	[auth],
	async (req: AuthenticatedRequest, res: Response): Promise<void> => {
		try {
			const employeeId = req.user?.employeeId;
			const employeeName = req.user?.employeeId; // Note: This seems wrong in original code - should probably be name
			const { responses, referredByCode, coords } = req.body;

			if (!employeeId || !employeeName || !responses) {
				res.status(400).json({ message: 'Missing required fields' });
				return;
			}

			// 1️ Create the new Survey document
			const newSurvey = new Survey({
				employeeId,
				employeeName,
				responses,
				referredByCode: referredByCode || null,
				coords
			});

			// 2️ Generate two referral codes for this new survey
			const code1 = generateReferralCode();
			const code2 = generateReferralCode();
			const code3 = generateReferralCode();

			newSurvey.referralCodes.push({
				code: code1,
				usedBySurvey: null,
				usedAt: null
			});
			newSurvey.referralCodes.push({
				code: code2,
				usedBySurvey: null,
				usedAt: null
			});
			newSurvey.referralCodes.push({
				code: code3,
				usedBySurvey: null,
				usedAt: null
			});

			// 3️ Save the new survey to the database
			await newSurvey.save();

			// 4️ If the new survey was created using a referral code, mark that code as used
			if (referredByCode) {
				const parentSurvey = await Survey.findOne({
					'referralCodes.code': referredByCode
				});

				if (!parentSurvey) {
					res.status(400).json({ message: 'Invalid referral code.' });
					return;
				}

				const referralObj = parentSurvey.referralCodes.find(
					rc => rc.code === referredByCode
				);

				if (!referralObj || referralObj.usedBySurvey) {
					res.status(400).json({
						message: 'This referral code has already been used.'
					});
					return;
				}

				// Mark referral code as used
				referralObj.usedBySurvey = newSurvey._id as any;
				referralObj.usedAt = new Date();
				await parentSurvey.save();
			}

			// Return success message + new referral codes
			res.status(201).json({
				message: 'Survey submitted successfully!',
				newSurveyId: newSurvey._id,
				referralCodes: [code1, code2, code3] // Return all 3 codes
			});
		} catch (error) {
			console.error('Error saving survey:', error);
			res.status(500).json({
				message: 'Server error: Could not save survey'
			});
		}
	}
);

// ─── DRAFT CODE  ───────────────────────────────────────

// POST /api/surveys/autosave - Autosaves a new survey
// This route handles the  temporary submission of a new survey
// It checks for required fields in the request body
// It creates a new survey document in the database

// TODO: Add path for possibility that the survey is a root; currently, this endpoint just ignores it. Waiting to add once front end provides functionality
router.post(
	'/autosave',
	[auth],
	async (req: AuthenticatedRequest, res: Response): Promise<void> => {
		try {
			const employeeId = req.user?.employeeId;
			const employeeName = req.user?.employeeId; // Note: This seems wrong in original code
			const { responses, referredByCode, coords } = req.body;

			console.log('These are responses!');
			console.log(responses);

			if (!employeeId || !employeeName || !responses) {
				res.status(400).json({ message: 'Missing required fields' });
				return;
			}

			const surveyWithCode = await Survey.findOne({
				referredByCode: referredByCode
			});
			console.log('Survey with code?');
			console.log(surveyWithCode);

			// If root
			if (
				referredByCode == null ||
				(surveyWithCode && !surveyWithCode.inProgress)
			) {
				res.status(201).json({
					message: 'This survey is a root, cannot be autosaved.'
				});
				return;
			}
			//---------------------------------------------------------------------------------------------------------------
			// 1 See if there is a survey with this refferal code already in progress or if a new one needs to be created
			if (!surveyWithCode) {
				// Create and submit new survey
				const inProgress = true;
				const lastUpdated = new Date();

				// 2 Create the new Survey document
				const newSurvey = new Survey({
					employeeId,
					employeeName,
					responses,
					referredByCode: referredByCode || null,
					coords,
					inProgress,
					lastUpdated
				});

				// 3️ Save the new survey to the database
				await newSurvey.save();
			} else {
				// Update survey only if there is one in progress
				// 2 Update survey responses and last updated
				//console.log("Im getting to update right now");
				if (surveyWithCode.inProgress == true) {
					//console.log("I passed this test!");

					await Survey.updateOne(
						{ referredByCode: referredByCode },
						{
							$set: { responses: responses },
							$currentDate: { lastUpdated: true }
						}
					);
				}
			}

			//https://www.mongodb.com/docs/manual/tutorial/update-documents/ - update docs

			// Return success message + new referral codes
			res.status(201).json({
				message: 'Survey autosaved successfully!'
			});
		} catch (error) {
			console.error('Error saving survey:', error);
			res.status(500).json({
				message: 'Server error: Could not save survey'
			});
		}
	}
);

// GET /api/surveys/:id - Fetch a specific survey
// This route fetches a specific survey by its ID
// It checks the user's role and employee ID from headers
// If the user is an Admin, they can view any survey
// If the user is not an Admin, they can only view their own survey
router.get(
	'/:id',
	[auth],
	async (req: AuthenticatedRequest, res: Response): Promise<void> => {
		try {
			const userRole = req.user?.role;
			const userEmployeeId = req.user?.employeeId;

			const survey = await Survey.findById(req.params.id);
			if (!survey) {
				res.status(404).json({ message: 'Survey not found' });
				return;
			}

			// If Admin, they can view any survey
			if (userRole === 'Admin') {
				res.json(survey);
				return;
			}

			// Otherwise, check if the survey belongs to this user
			if (survey.employeeId !== userEmployeeId) {
				res.status(403).json({
					message: 'Forbidden: You do not have access to this survey'
				});
				return;
			}

			res.json(survey);
		} catch (error) {
			console.error('Error fetching survey:', error);
			res.status(500).json({
				message: 'Server error: Unable to fetch survey'
			});
		}
	}
);

export default router;

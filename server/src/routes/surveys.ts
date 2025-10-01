import express, { Response } from 'express';

import { auth } from '@/middleware/auth';
import Survey from '@/models/survey';
import { AuthenticatedRequest } from '@/types/auth';
import { ISurvey } from '@/types/models';
import generateReferralCode from '@/utils/generateReferralCode';

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

			// 1. Check that the code is not already associated with an in-progress survey
			// (i.e., the code was used to start a survey but that survey is not yet completed)
			// If so, return that the survey is in progress and cannot be used again
			const inProgressSurvey = await Survey.findOne({
				referredByCode: code
			});

			// Check if completed property is defined on inProgressSurvey
			if (inProgressSurvey && inProgressSurvey.completed !== true) {
				res.status(400).json({
					message:
						'This survey is already in progress. Please continue.',
					survey: inProgressSurvey
				});
				return;
			}

			// 2: Check that the code was created by an existing survey, because the code needs to actually have been distributed
			const surveyWithCode = await Survey.findOne({
				'referralCodes.code': code
			});

			if (!surveyWithCode) {
				res.status(400).json({
					message:
						'Referral code not found. Invalid referral code. Please check again.'
				});
				return;
			}

			// 3: Check to see if this survey was already used and finished by a survey
			const referralObj = surveyWithCode.referralCodes.find(
				rc => rc.code === code
			);

			if (referralObj?.usedBySurvey) {
				res.status(400).json({
					message: 'This referral code has already been used.'
				});
				return;
			}

			res.status(200).json({
				message: 'Valid referral code.',
				// Send back the survey that created this code in case the front end wants to show info about the referrer
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

// POST /api/surveys/save/:completed - Submitting a new survey
// This route handles saving a survey instance to the database.
// The "completed" parameter will indicate whether or not
// the survey being saved is completed or not completed
router.post(
	'/save',
	[auth],
	async (req: AuthenticatedRequest, res: Response) => {
		try {
			// Set survey values from request
			const employeeId = req.user?.employeeId;
			const employeeName = req.user?.firstName;
			const { responses, referredByCode, coords, objectId, completed } =
				req.body;
			const lastUpdated = new Date();
			// TODO: Integrate zod validation here
			if (!employeeId || !employeeName || !responses) {
				return res
					.status(400)
					.json({ message: 'Missing required fields' });
			}

			if (objectId) {
				if (!completed) {
					// Survey exists, so it must be an update
					await updateSurvey(objectId, responses);
					// Return success message, object id, and new referral codes
					return res.status(201).json({
						message: 'Survey updated successfully!',
						objectId: objectId
					});
				} else {
					// If the survey is being marked as completed, we need to update it and also generate referral codes if they don't exist
					await updateSurvey(objectId, responses, completed);
					// Fetch the updated survey to get referral codes
					const updatedSurvey = await Survey.findById(objectId);
					return res.status(201).json({
						message: 'Survey completed successfully!',
						objectId: objectId,
						referralCodes: [
							updatedSurvey?.referralCodes[0].code,
							updatedSurvey?.referralCodes[1].code,
							updatedSurvey?.referralCodes[2].code
						]
					});
				}
			} else {
				// If no objectId is provided, we proceed to create a new survey
				// This handles the case where a new survey is being created
				// even if it is not a root survey (i.e., it has a referredByCode)
				// but does not have an objectId yet because it is new
				// We will create a new survey instance in this case
				const newSurvey = await createNewSurvey(
					employeeId,
					employeeName,
					responses,
					referredByCode,
					coords,
					lastUpdated,
					completed
				);
				return res.status(201).json({
					message: 'Survey saved successfully!',
					objectId: newSurvey._id, // Object Id is returned so that the client has a way to uniquely identify root surveys - since this object id is the only unique identifier in the database
					referralCodes: [
						newSurvey.referralCodes[0].code,
						newSurvey.referralCodes[1].code,
						newSurvey.referralCodes[2].code
					]
				});
			}
		} catch (error) {
			console.error('Error saving survey:', error);
			res.status(500).json({
				message: 'Server error: Could not save survey'
			});
		}
	}
);

// NOTE: The /submit route is kept for backward compatibility with the front end. This can be removed after the front end is updated to use /save instead.
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
			const employeeName = req.user?.employeeId; // NOTE: This seems wrong in original code - should probably be name
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

/**
 * Helper function: create a new survey and insert into database, this automatically
 * links the new survey to its parent
 * @param {String} employeeId employeeId linked to this survey object
 * @param {String} employeeName employee name to be saved with new survey
 * @param {Object} responses responses to be saved with new survey
 * @param {String} referredByCode the code this survey was referred by if not null
 * @param {Object} coords coords where the new survey was completed, default value is 0,0
 * @param {boolean} inProgress indicates whether or not this new survey is in progress
 * @param {String} lastUpdated indicates when the new survey was last updated
 * @returns a new survey object
 */
async function createNewSurvey(
	employeeId: string,
	employeeName: string,
	responses: object,
	referredByCode: string | null,
	coords: object,
	lastUpdated: Date,
	completed: boolean
): Promise<ISurvey> {
	// Create new survey object
	const newSurvey = new Survey({
		employeeId,
		employeeName,
		responses,
		referredByCode: referredByCode ?? null,
		coords,
		lastUpdated,
		completed
	});

	// TODO: Should we only create referral codes if the survey is completed?
	// Currently, referral codes are created even if the survey is just in progress
	// Create new referral codes
	newSurvey.referralCodes.push({
		code: generateReferralCode(),
		usedBySurvey: null,
		usedAt: null
	});
	newSurvey.referralCodes.push({
		code: generateReferralCode(),
		usedBySurvey: null,
		usedAt: null
	});
	newSurvey.referralCodes.push({
		code: generateReferralCode(),
		usedBySurvey: null,
		usedAt: null
	});

	await newSurvey.save(); // insert in database

	// If referred by code, link this new child to its parent by marking the referral code as used in the parent
	if (referredByCode) {
		const parentSurvey = await Survey.findOne({
			'referralCodes.code': referredByCode
		}); // find parent to newly created child survey
		if (parentSurvey) {
			const referralObj = parentSurvey.referralCodes.find(
				rc => rc.code === referredByCode
			);
			// Update referral code array in parent with child's information
			if (referralObj) {
				referralObj.usedAt = new Date();
				referralObj.usedBySurvey = newSurvey._id as any;
			}
			await parentSurvey.save();
		}
	}

	return newSurvey;
}

/**
 * Helper function: Updates the response and inProgress fields of an exisitng survey given its MongoDB object ID
 * @param {String} objectId unique id of survey that will be updated
 * @param {Object} responses new respones object to be saved in survey
 * @returns promise returned by server upon being updated
 */

async function updateSurvey(
	objectId: string,
	responses: object,
	completed?: boolean
) {
	// Update the survey in the databse that has the given objectId
	return await Survey.updateOne(
		{ _id: objectId },
		{
			$set: {
				responses: responses,
				completed: completed ?? false
			},
			$currentDate: { lastUpdated: true }
		}
	);
}

export default router;

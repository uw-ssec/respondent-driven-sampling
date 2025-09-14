const express = require('express');
const Survey = require('../models/Survey');
const { auth } = require('../middleware/auth');
const generateReferralCode = require('../utils/generateReferralCode');

const router = express.Router();

// Validate Referral Code - GET /api/surveys/validate-ref/:code
// This route checks if a referral code is valid and has not been used yet
// It returns a success message if the code is valid
// and a failure message if the code is invalid or already used
router.get("/validate-ref/:code", async (req, res) => {
  try {
      const { code } = req.params;

      // 1: Check to make sure this referral code is not already connected to an in progress survey
      const inProgressSurvey = await Survey.findOne({ "referredByCode": code }); // Look in database for a survey that was referred by this code
      if(inProgressSurvey && inProgressSurvey.inProgress == true)  { // If this survey already exists 
        return res.status(400).json({ message: "This survey is in progress. Please continue.", survey: inProgressSurvey});
      }

      // 2: Check to make sure that this code was created by an existing survey: because the code needs to actually have been distributed
      const surveyWithCode = await Survey.findOne({ "referralCodes.code": code }); // Look for a parent survey that may have generated this child code

      if (!surveyWithCode) { // If this object does not exist it means that no parent has this referral code
          return res.status(400).json({ message: "Invalid referral code. Please check again." });
      }

		const referralObj = surveyWithCode.referralCodes.find(
			rc => rc.code === code
		);

		if (!referralObj) {
			console.log('not found ' + code);
			return res
				.status(400)
				.json({ message: 'Referral code not found.' });
		}

        // 3: Check to see if this survey was already used and finished by a survey
		if (referralObj.usedBySurvey) {
			console.log('already used ' + code);
			return res
				.status(400)
				.json({ message: 'This referral code has already been used.' });
		}

        // If the three checks above pass, this code is valid to use
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
});

// GET /api/surveys/all - Fetch all surveys (Admins get all, others get their own)
// This route fetches all surveys from the database
// It checks the user's role and employee ID from headers
// If the user is an Admin, they can see all surveys
// If the user is not an Admin, they can only see their own surveys
// It returns the surveys in descending order of creation date
router.get('/all', [auth], async (req, res) => {
	try {
		const userRole = req.decodedAuthToken.role;
		const userEmployeeId = req.decodedAuthToken.employeeId;

		if (userRole === 'Admin') {
			const surveys = await Survey.find().sort({ createdAt: -1 });
			return res.json(surveys);
		}

		const surveys = await Survey.find({ employeeId: userEmployeeId }).sort({
			createdAt: -1
		});
		return res.json(surveys);
	} catch (error) {
		console.error('Error fetching surveys:', error);
		res.status(500).json({
			message: 'Server error: Unable to fetch surveys'
		});
	}
});

// POST /api/surveys/save/:inProgress - Submitting a new survey
// This route handles saving a survey instance to the database. 
// The "inProgress" parameter will indicate whether or not 
// the survey being saved is in progress or not in progress
router.post('/save', [auth], async (req, res) => {
	try {
        // Set survey values from request
		const employeeId = req.decodedAuthToken.employeeId;
		const employeeName = req.decodedAuthToken.firstName;
		const { responses, referredByCode, coords, objectId, inProgress} = req.body;
        const lastUpdated = new Date();
        if (!employeeId || !employeeName || !responses) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        // Find any potential surveys that may have been autosaved with a referredByCode OR an objectId
        let survey = await findSurvey(referredByCode, objectId); // survey will be null or a survey object

        if (!survey) { // If a survey is not found with the objectId or referral code from the request -> create new survey
            survey = await createNewSurvey(employeeId, employeeName, responses, referredByCode, coords, inProgress, lastUpdated);
        } else { // If this survey exists and is currently in progress -> update the responses object within the found survey object
            if (survey.inProgress == true)
                await updateSurvey(objectId, responses, inProgress); // Update the responses and in progress status of an existing in progress survey
        }
      
        // Return success message, object id, and new referral codes
        return res.status(201).json({
            message: "Survey saved successfully!",
            objectId: survey._id, // Object Id is returned so that the client has a way to uniquely identify root surveys - since this object id is the only unique identifier in the database
            referralCodes: [survey.referralCodes[0].code, survey.referralCodes[1].code, survey.referralCodes[2].code]
        });

    } catch (error) {
        console.error("Error saving survey:", error);
        res.status(500).json({ message: "Server error: Could not save survey" });
    }
});

// GET /api/surveys/:id - Fetch a specific survey
// This route fetches a specific survey by its ID
// It checks the user's role and employee ID from headers
// If the user is an Admin, they can view any survey
// If the user is not an Admin, they can only view their own survey
router.get('/:id', [auth], async (req, res) => {
	try {
		const userRole = req.decodedAuthToken.role;
		const userEmployeeId = req.decodedAuthToken.employeeId;

		const survey = await Survey.findById(req.params.id);
		if (!survey) {
			return res.status(404).json({ message: 'Survey not found' });
		}

		// If Admin, they can view any survey
		if (userRole === 'Admin') {
			return res.json(survey);
		}

		// Otherwise, check if the survey belongs to this user
		if (survey.employeeId !== userEmployeeId) {
			return res.status(403).json({
				message: 'Forbidden: You do not have access to this survey'
			});
		}

		return res.json(survey);
	} catch (error) {
		console.error('Error fetching survey:', error);
		res.status(500).json({
			message: 'Server error: Unable to fetch survey'
		});
	}
});

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
async function createNewSurvey(employeeId, employeeName, responses, referredByCode, coords, inProgress, lastUpdated) {
     // Create new survey object 
    const newSurvey = new Survey({
        employeeId,
        employeeName,
        responses,
        referredByCode: referredByCode || null,
        coords, 
        lastUpdated,
        inProgress
    });

    // Create new referral codes 
    newSurvey.referralCodes.push({ code: generateReferralCode() });
    newSurvey.referralCodes.push({ code: generateReferralCode() });
    newSurvey.referralCodes.push({ code: generateReferralCode() });

    // If referred by code, link this new child to its parent by marking the referral code as used in the parent
    if (referredByCode) {
        const parentSurvey = await Survey.findOne({ "referralCodes.code": referredByCode }); // find parent to newly created child survey
        const referralObj = parentSurvey.referralCodes.find(rc => rc.code === referredByCode);

        // Update referral code array in parent with child's information
        referralObj.usedAt = new Date();
        referralObj.usedBySurvey = newSurvey._id;
        await parentSurvey.save();
    }

    await newSurvey.save(); // insert in database
    return newSurvey;
}

/**
 * Helper function: Updates the response and inProgress fields of an exisitng survey given its MongoDB object ID
 * @param {String} objectId unique id of survey that will be updated
 * @param {Object} responses new respones object to be saved in survey
 * @param {boolean} inProgress new in progress value to be saved in the survey
 * @returns promise returned by server upon being updated
 */
async function updateSurvey(objectId, responses, inProgress) {
    // Update the survey in the databse that has the given objectId
    return await Survey.updateOne(
        { _id: objectId },
        {
            $set: { 
                responses: responses,
                inProgress: inProgress
            },
            $currentDate: { lastUpdated: true }
        }
    );
}

/**
 * Find a survey with a refferal code and an object ID. Returns null if 
 * a survey does not exist.
 * @param {String} refferalCode refferal code for survey. Can be null
 * @param {String} objectId object id for survey. Cab be null
 */
async function findSurvey(refferalCode, objectId) {
    if (objectId != '') {
        // find with object id
        const surveyWithCode = await Survey.findOne({ "_id": objectId });
        return surveyWithCode;
    } else if(refferalCode != null) {
        // look for refferral code, then return 
        const surveyWithCode = await Survey.findOne({ "referredByCode": refferalCode });
        return surveyWithCode;
    } 
    return null;
}

module.exports = router;

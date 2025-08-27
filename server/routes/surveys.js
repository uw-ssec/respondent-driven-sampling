const express = require("express");
const Survey = require("../models/Survey");
const generateReferralCode = require("../utils/generateReferralCode");

const router = express.Router();


// validate Referral Code - GET /api/surveys/validate-ref/:code
// This route checks if a referral code is valid and has not been used yet
// It returns a success message if the code is valid
// and a failure message if the code is invalid or already used
router.get("/validate-ref/:code", async (req, res) => {
  try {
      const { code } = req.params;
      const inProgressSurvey = await Survey.findOne({ "referredByCode": code });
      if(inProgressSurvey && inProgressSurvey.inProgress == true)  { // Survey is in progress
        return res.status(400).json({ message: "This survey is in progress. Please continue.", survey: inProgressSurvey});
      }

      const surveyWithCode = await Survey.findOne({ "referralCodes.code": code });

      if (!surveyWithCode) { // No parent has this referral code
          return res.status(400).json({ message: "Invalid referral code. Please check again." });
      }

      const referralObj = surveyWithCode.referralCodes.find(rc => rc.code === code);

      if (!referralObj) {
        console.log("not found " + code);
          return res.status(400).json({ message: "Referral code not found." });
      }

      if (referralObj.usedBySurvey) {
        console.log("already used " + code);
        return res.status(400).json({ message: "This referral code has already been used." });
      }

      console.log("valid code" + code);
      res.json({ message: "Valid referral code.", surveyId: surveyWithCode._id });

  } catch (error) {
      console.error("Error validating referral code:", error);
      res.status(500).json({ message: "Server error. Unable to validate referral code." });
  }
});



// GET /api/surveys/all - Fetch all surveys (Admins get all, others get their own)
// This route fetches all surveys from the database
// It checks the user's role and employee ID from headers
// If the user is an Admin, they can see all surveys
// If the user is not an Admin, they can only see their own surveys
// It returns the surveys in descending order of creation date
router.get("/all", async (req, res) => {
    try {
        const userRole = req.headers["x-user-role"];
        const userEmployeeId = req.headers["x-employee-id"];

        if (userRole === "Admin") {
            const surveys = await Survey.find().sort({ createdAt: -1 });
            return res.json(surveys);
        }

        const surveys = await Survey.find({ employeeId: userEmployeeId }).sort({ createdAt: -1 });
        return res.json(surveys);
    } catch (error) {
        console.error("Error fetching surveys:", error);
        res.status(500).json({ message: "Server error: Unable to fetch surveys" });
    }
});

// POST /api/surveys/submit - Submitting a new survey
// This route handles the submission of a new survey
// It checks for required fields in the request body
// It creates a new survey document in the database
// It generates three referral codes for the new survey
router.post("/submit", async (req, res) => {
    try {
        const { employeeId, employeeName, responses, referredByCode, coords, objectId} = req.body;
        const surveyWithCode = await findSurvey(referredByCode, objectId);

        if (!employeeId || !employeeName || !responses) {
            return res.status(400).json({ message: "Missing required fields" });
        }
        let newId = null;
        let code1 = null;
        let code2 = null;
        let code3 = null;

        if (!surveyWithCode) {
            const inProgress = false;
            const lastUpdated = new Date();

            const newSurvey = new Survey({
                employeeId,
                employeeName,
                responses,
                referredByCode: referredByCode || null,
                coords, 
                lastUpdated,
                inProgress
            });

            code1 = generateReferralCode();
            code2 = generateReferralCode();
            code3 = generateReferralCode();
            
            newSurvey.referralCodes.push({ code: code1 });
            newSurvey.referralCodes.push({ code: code2 });
            newSurvey.referralCodes.push({ code: code3 });

            await newSurvey.save();
            newId = newSurvey._id;
        } else {
            if (surveyWithCode.inProgress == true) {
                await Survey.updateOne(
                { _id: objectId },
                {
                    $set: { 
                        responses: responses,
                        inProgress: false
                    },
                    $currentDate: { lastUpdated: true }
                }
                );
            } 
            newId = surveyWithCode._id;
            code1 = surveyWithCode.referralCodes[0].code
            code2 = surveyWithCode.referralCodes[1].code
            code3 = surveyWithCode.referralCodes[2].code
        }


        // If the new survey was created using a referral code, mark that code as used
        if (referredByCode) {
          const parentSurvey = await Survey.findOne({ "referralCodes.code": referredByCode });
      
          if (!parentSurvey) {
              return res.status(400).json({ message: "Invalid referral code." });
          }
      
          const referralObj = parentSurvey.referralCodes.find(rc => rc.code === referredByCode);
      
          if (!referralObj || referralObj.usedBySurvey) {
              return res.status(400).json({ message: "This referral code has already been used." });
          }
      
          // Mark referral code as used
          referralObj.usedBySurvey = newId;
          referralObj.usedAt = new Date();
          referralObj.inProgress = false;
          await parentSurvey.save();
      }
      

        // Return success message + new referral codes
        return res.status(201).json({
            message: "Survey submitted s uccessfully!",
            newSurveyId: newId,
            referralCodes: [code1, code2, code3]  // Return all 3 codes
        });

    } catch (error) {
        console.error("Error saving survey:", error);
        res.status(500).json({ message: "Server error: Could not save survey" });
    }
});

// POST /api/surveys/submit - Autosaves a new survey
// This route handles the  temporary submission of a new survey
// It checks for required fields in the request body
// It creates a new survey document in the database
router.post("/autosave", async (req, res) => {
    try {
        const { employeeId, employeeName, responses, referredByCode, coords, objectId} = req.body;

        if (!employeeId || !employeeName || !responses) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        const surveyWithCode = await findSurvey(referredByCode, objectId);
        let objId = null;
        
        // Create new survey
        if (!surveyWithCode) {
            const inProgress = true;
            const lastUpdated = new Date();

            const newSurvey = new Survey({
                employeeId,
                employeeName,
                responses,
                referredByCode: referredByCode || null,
                coords, 
                inProgress, 
                lastUpdated
            });

            await newSurvey.save();

            // Refferal codes + Link account 
            const code1 = generateReferralCode();
            const code2 = generateReferralCode();
            const code3 = generateReferralCode();
            
            newSurvey.referralCodes.push({ code: code1 });
            newSurvey.referralCodes.push({ code: code2 });
            newSurvey.referralCodes.push({ code: code3 });

            // Link code to parent
            if(referredByCode) {
                const parentSurvey = await Survey.findOne({ "referralCodes.code": referredByCode });
                const referralObj = parentSurvey.referralCodes.find(rc => rc.code === referredByCode);
                referralObj.usedAt = new Date();
                referralObj.inProgress = true;
                await parentSurvey.save();
            }

            let promise = await newSurvey.save();
            objId = promise._id.valueOf();
        } else {
            if (surveyWithCode.inProgress == true) {
                await Survey.updateOne( 
                { referredByCode: referredByCode },
                {
                    $set: { responses: responses},
                    $currentDate: { lastUpdated: true }
                }
                );
                objId = surveyWithCode._id;
            } 
        }
        return res.status(201).json({
            message: "Survey autosaved successfully!", 
            objectId: objId
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
router.get("/:id", async (req, res) => {
    try {
        const userRole = req.headers["x-user-role"];
        const userEmployeeId = req.headers["x-employee-id"];

        const survey = await Survey.findById(req.params.id);
        if (!survey) {
            return res.status(404).json({ message: "Survey not found" });
        }

        // If Admin, they can view any survey
        if (userRole === "Admin") {
            return res.json(survey);
        }

        // Otherwise, check if the survey belongs to this user
        if (survey.employeeId !== userEmployeeId) {
            return res.status(403).json({ message: "Forbidden: You do not have access to this survey" });
        }

        return res.json(survey);
    } catch (error) {
        console.error("Error fetching survey:", error);
        res.status(500).json({ message: "Server error: Unable to fetch survey" });
    }
});

// THIS ONE IS DELETED IN MAIN:
// Validate Referral Code - GET /api/surveys/validate-ref/:code
// This route checks if a referral code is valid
// and has not been used yet
// It returns a success message if the code is valid
// and a failure message if the code is invalid or already used
router.get("/validate-ref/:code", async (req, res) => {
  try {
      const { code } = req.params;

      // Find a survey that has this referral code and is NOT used yet
      const existingSurvey = await Survey.findOne({
          "referralCodes.code": code,
          "referralCodes.usedBySurvey": null // Ensure it's not already used
      });

      if (!existingSurvey) {
          return res.status(400).json({ message: "Invalid or already used referral code." });
      }

      res.json({ message: "Valid referral code." });
  } catch (error) {
      console.error("Error validating referral code:", error);
      res.status(500).json({ message: "Server error. Please try again." });
  }
});


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
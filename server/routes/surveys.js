const express = require("express");
const Survey = require("../models/Survey");
const authenticateToken = require('../utils/tokenHandling')
const generateReferralCode = require("../utils/generateReferralCode");

const router = express.Router();


// Validate Referral Code - GET /api/surveys/validate-ref/:code
// This route checks if a referral code is valid and has not been used yet
// It returns a success message if the code is valid
// and a failure message if the code is invalid or already used
router.get("/validate-ref/:code", authenticateToken, async (req, res) => {
  try {
      const { code } = req.params;

      //console.log("THIS IS THE CODE BEING VALIDATED 1: " + code);
      const surveyWithCode = await Survey.findOne({ "referralCodes.code": code });

      if (!surveyWithCode) {
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
router.get("/all", authenticateToken, async (req, res) => {
    try {
        const userRole = req.decodedToken.role;
        const userEmployeeId = req.decodedToken.employeeId;

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
router.post("/submit", authenticateToken, async (req, res) => {
    try {
        const employeeId = req.decodedToken.employeeId;
        const employeeName = req.decodedToken.firstName;
        const { responses, referredByCode, coords} = req.body;
        
        const surveyWithCode = await Survey.findOne({ "referredByCode": referredByCode });


        if (!responses) {
            return res.status(400).json({ message: "Missing required fields" });
        }


        // 2️ Generate three referral codes for this new survey
        const code1 = generateReferralCode();
        const code2 = generateReferralCode();
        const code3 = generateReferralCode();

        //let newSurvey = null;
        let newId = null;

        if (!surveyWithCode) {
            // Create and submit new survey
            const inProgress = true;
            const lastUpdated = new Date();

            //console.log('inProgress:', inProgress);


            // 2 Create the new Survey document
            const newSurvey = new Survey({
                employeeId,
                employeeName,
                responses,
                referredByCode: referredByCode || null,
                coords, 
                lastUpdated,
                inProgress
            });
            
            newSurvey.referralCodes.push({ code: code1 });
            newSurvey.referralCodes.push({ code: code2 });
            newSurvey.referralCodes.push({ code: code3 });

            // 3️ Save the new survey to the databasenewId = newSurvey._id;
            await newSurvey.save();
            newId = newSurvey._id;
    
        } else {
            //console.log('inProgress:', inProgress);
            console.log(surveyWithCode);
            // Update survey only if there is one in progress
            // 2 Update survey responses and last updated
            if (surveyWithCode.inProgress == true) {
                await Survey.updateOne( 
                { referredByCode: referredByCode },
                {
                    $set: { responses: responses},
                    $set: { inProgress: false},
                    $push: { referralCodes: { $each: [{ code: code1}, { code: code2}, {code: code3}] }},
                    $currentDate: { lastUpdated: true }
                }
                );
            } 
            newId = surveyWithCode._id;
        }


        // 4️ If the new survey was created using a referral code, mark that code as used
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
          await parentSurvey.save();
      }
      

        // Return success message + new referral codes
        return res.status(201).json({
            message: "Survey submitted successfully!",
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

// TODO: Add path for possibility that the survey is a root; currently, this endpoint just ignores it. Waiting to add once front end provides functionality
router.post("/autosave", authenticateToken, async (req, res) => {
    try {
        const employeeId = req.decodedToken.employeeId;
        const employeeName = req.decodedToken.firstName;
        const { responses, referredByCode, coords} = req.body;

        console.log("These are responses!");
        console.log(responses);

        if (!employeeId || !employeeName || !responses) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        const surveyWithCode = await Survey.findOne({ "referredByCode": referredByCode });
        console.log("Survey with code?");
        console.log(surveyWithCode);

        // If root
        if (referredByCode == null || (surveyWithCode && !(surveyWithCode.inProgress))) { 
            return res.status(201).json({
                message: "This survey is a root, cannot be autosaved."
            });
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
                    $set: { responses: responses},
                    $currentDate: { lastUpdated: true }
                }
                );
            } 
        }

        //https://www.mongodb.com/docs/manual/tutorial/update-documents/ - update docs

        // Return success message + new referral codes
        return res.status(201).json({
            message: "Survey autosaved successfully!"
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
router.get("/:id", authenticateToken, async (req, res) => {
    try {
        const userRole = req.decodedToken.role;
        const userEmployeeId = req.decodedToken.employeeId;

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

// Validate Referral Code - GET /api/surveys/validate-ref/:code
// This route checks if a referral code is valid
// and has not been used yet
// It returns a success message if the code is valid
// and a failure message if the code is invalid or already used
router.get("/validate-ref/:code", authenticateToken, async (req, res) => {
  try {
      const { code } = req.params;

      console.log("THIS IS THE CODE BEING VALIDATED: " + code);

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

// Test token
// This is a temporary endpoint meant to test JWT
router.get("/token/token", async (req, res) => {
  try {
    console.log("Testing tihs");
    const token = createToken();
    return res.status(201).json({
        token: token
    });
  } catch(error) {
      console.error("Error!", error);
      res.status(500).json({ message: "Server error. Please try again." });
  }
});

// Token article: https://www.geeksforgeeks.org/web-tech/json-web-token-jwt/
function createToken() {
    const jwt = require('jsonwebtoken');
    const secretKey = 'abcde12345';

    const token = jwt.sign({
    id: 1,
    username: 'GFG'
    }, secretKey, { expiresIn: '1h' });

    console.log(token);
    return token;
}

function verifyToken(token) {
    jwt.verify(token, 'abcde12345', (err, decoded) => {
    if (err) {
      console.log('Token is invalid');
    } else {
      console.log('Decoded Token:', decoded);
    }
  });
}


module.exports = router;
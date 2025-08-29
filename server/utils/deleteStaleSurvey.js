const Survey = require("../models/Survey");

/**
 * Deletes all in progress surveys within surveys table 
 */
module.exports = async function deleteStaleSurveys() {
    await Survey.deleteMany({inProgress : "true"});

    // Delete links
    const surveys = await Survey.find({ "referralCodes.inProgress": true});
    for(let i = 0; i < surveys.length; i++) {
        let curSurvey = surveys[i];
        let referralCodes = curSurvey.referralCodes;
        console.log(referralCodes);
        for (let j = 0; j < 3; j++) {
            let curReferralObj = referralCodes[j];
            if(curReferralObj.inProgress == true) {
                curReferralObj.usedBySurvey = null;
                curReferralObj.usedAt= null;
                curReferralObj.inProgress = false;
            }
            referralCodes[j] = curReferralObj;
        }
        await Survey.updateOne(
        { _id: curSurvey._id},
        {
            $set: { 
                referralCodes: referralCodes,
            }
        }
        );
    }
};
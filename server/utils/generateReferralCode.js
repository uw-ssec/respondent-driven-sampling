const Survey = require('../models/Survey');

/**
 * Returns a unique 8 character code. Returns null if there is a problem
 * @returns a unique 8 char random stringsss
 */
module.exports = async function generateReferralCode() {
  return await getUniqueCode();
}

/**
 * Helper function that queries the database and returns a promise with a unique referral code
 * @returns a promise that contains a unique referral code
 */ 
async function getUniqueCode() {
  let refCode = Math.random().toString(36).substring(2, 10).toUpperCase();
  let surveyWithCode = await Survey.findOne({referredByCode: refCode});
  while (surveyWithCode) {
    refCode = Math.random().toString(36).substring(2, 10).toUpperCase();
    surveyWithCode = await Survey.findOne({referredByCode: refCode});
  }
  return refCode;
};

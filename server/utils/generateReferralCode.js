// This function generates a random referral code
// consisting of 8 alphanumeric characters.
// The code is case-insensitive and can be used for
// tracking referrals in a system.
module.exports = function generateReferralCode() {
  // e.g. 8-char random string
  return Math.random().toString(36).substring(2, 10).toUpperCase();
};

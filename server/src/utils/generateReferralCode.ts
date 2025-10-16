// This function generates a random referral code
// consisting of 6 alphanumeric characters.
// The code is case-insensitive and can be used for
// tracking referrals in a system.
export default function generateReferralCode(): string {
	// e.g. 6-char random string
	return Math.random().toString(36).substring(2, 8).toUpperCase();
}

import Survey from '@/database/survey/mongoose/survey.model';
import { errors } from '@/database/utils/errors';
import { AuthenticatedRequest } from '@/types/auth';

/**
 * Finds the parent survey that contains the given survey code in its childSurveyCodes
 * @param req - The authenticated request
 * @returns Promise<string | null> - The parent survey code or null if not found
 */
export async function getParentSurveyCode(
	surveyCode: string
): Promise<string | null> {
	const parentSurvey = await Survey.findOne({
		childSurveyCodes: { $in: [surveyCode] }
	}).select({ surveyCode: 1 });
	return parentSurvey?.surveyCode ?? null;
}

/**
 * Handles collision errors by regenerating codes and determining if retry should occur
 * @param req - The authenticated request
 * @param message - The error message from the operation
 * @returns boolean - true if collision was handled and retry should occur, false otherwise
 */
export function handleCollision(
	req: AuthenticatedRequest,
	message: string | undefined
): boolean {
	// No message -- no known collision error, do not retry and return
	if (!message) {
		return false;
	}

	// Child survey codes not unique within this survey or across all surveys, retry
	if (
		message?.includes(errors.CHILD_SURVEY_CODES_NOT_UNIQUE.message) ||
		message?.includes(
			errors.CHILD_SURVEY_CODES_NOT_UNIQUE_ACROSS_ALL_SURVEYS.message
		)
	) {
		req.body.childSurveyCodes = generateChildSurveyCodes();
		return true;
	}

	// System generated survey code found in previous child codes or survey code already exists, retry
	else if (
		message?.includes(
			errors.SYSTEM_GENERATED_SURVEY_CODE_FOUND_IN_PREVIOUS_CHILD_CODES
				.message
		) ||
		message?.includes(errors.SURVEY_CODE_ALREADY_EXISTS.message)
	) {
		req.body.surveyCode = generateReferralCode();
		return true;
	}

	// Some other error -- do not retry and return
	else {
		return false;
	}
}

/**
 * Generates child survey codes for a new survey
 * @returns Array<string> - The generated child survey codes
 */
export function generateChildSurveyCodes(): Array<string> {
	// TODO: Natalie, thoughts on inserting the validation logic here?
	return Array.from({ length: 3 }, () => generateReferralCode());
}

// This function generates a random referral code
// consisting of 6 alphanumeric characters.
// The code is case-insensitive and can be used for
// tracking referrals in a system.
export function generateReferralCode(): string {
	// e.g. 6-char random string
	// TODO: Natalie, thoughts on inserting the validation logic here?
	return Math.random().toString(36).substring(2, 8).toUpperCase();
}

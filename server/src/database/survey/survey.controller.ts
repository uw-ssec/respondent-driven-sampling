import { randomBytes } from 'crypto';

import Seed from '@/database/seed/mongoose/seed.model';
import Survey from '@/database/survey/mongoose/survey.model';
import { errors } from '@/database/utils/errors';

/**
 * Finds the parent survey that contains the given survey code in its childSurveyCodes
 * @param req - The authenticated request
 * @returns Promise<string | null> - The parent survey code or null if not found
 */
export async function getParentSurveySurveyCodeUsingSurveyCode(
	surveyCode: string
): Promise<string | null> {
	const parentSurvey = await Survey.findOne({
		childSurveyCodes: { $in: [surveyCode] }
	}).select({ surveyCode: 1 });
	return parentSurvey?.surveyCode ?? null;
}

/**
 * Generates child survey codes for a new survey, guarantees uniqueness within array and across all surveys
 * @returns Array<string> - The generated child survey codes
 * @throws {Error} - Throws SURVEY_CODE_GENERATION_ERROR if unable to generate unique codes after 3 retries
 */
export async function generateUniqueChildSurveyCodes(): Promise<Array<string>> {
	for (let retries = 0; retries < 3; retries++) {
		const codes = await Promise.all(
			Array.from({ length: 3 }, () => generateUniqueSurveyCode())
		);
		// Enforce uniqueness within the array
		if (isUniqueSurveyCodeArray(codes)) {
			return codes;
		}
	}
	// If we've retried 3 times and still haven't generated valid codes, throw error
	throw errors.SURVEY_CODE_GENERATION_ERROR;
}

/**
 * Validates that all codes in the array are unique (no duplicates)
 * @param codes - Array of survey codes to validate
 * @returns boolean - true if all codes are unique, false otherwise
 */
function isUniqueSurveyCodeArray(codes: Array<string>): boolean {
	// Enforce uniqueness within the array
	return new Set(codes).size === codes.length;
}

/**
 * Generates a random referral code consisting of 8 hexadecimal characters.
 * The code is case-insensitive and can be used for tracking referrals in a system.
 * Guaranteed to be unique across all surveys within the database.
 * @returns string - A unique 8-character hexadecimal code in uppercase
 * @throws {Error} - Throws SURVEY_CODE_GENERATION_ERROR if unable to generate unique code after 3 retries
 */
export async function generateUniqueSurveyCode(): Promise<string> {
	for (let retries = 0; retries < 3; retries++) {
		const code = randomBytes(4).toString('hex').toUpperCase();
		// Enforce individual code uniqueness
		if (await isUniqueSurveyCode(code)) {
			return code;
		}
	}
	// After 3 retries, throw error and prompt user to try again
	throw errors.SURVEY_CODE_GENERATION_ERROR;
}

/**
 * Checks if a survey code is unique within the database by verifying it doesn't exist
 * as a main survey code, parent survey code, or child survey code in any existing survey
 * or as a seed code in any existing seed
 * @param code - The survey code to check for uniqueness
 * @returns boolean - true if the code is unique, false if it already exists
 */
async function isUniqueSurveyCode(code: string): Promise<boolean> {
	return (
		(await Survey.findOne({ surveyCode: code })) === null &&
		(await Survey.findOne({ childSurveyCodes: { $in: [code] } })) ===
			null &&
		(await Survey.findOne({ parentSurveyCode: code })) === null &&
		(await Seed.findOne({ surveyCode: code })) === null
	);
}

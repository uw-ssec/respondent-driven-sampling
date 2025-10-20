import { AuthenticatedRequest } from '@/types/auth';
import { SYSTEM_SURVEY_CODE } from '../utils/constants';
import generateReferralCode from '@/utils/generateReferralCode';
import { ErrorCode, errors } from '../utils/errors';
import Survey from './mongoose/survey.model';

/**
 * Resolves the parent survey code for a new survey creation
 * If a survey code is provided, finds the parent survey and sets it as the parent survey code
 * If the parent survey is not found, returns 404 response
 * If not survey code is provided but `new` query parameter is true, generates new survey code and sets parent to seed
 * If no survey code is provided and `new`` query parameter is not true, returns 400 response
 * @param req - The authenticated request
 * @returns Promise<ErrorCode | null> - null if successful, ErrorCode with appropriate status and message if not
 */
export async function resolveParentSurveyCode(req: AuthenticatedRequest): Promise<ErrorCode | null> {
    if (req.body.surveyCode) {
        const parentSurveyCode = await getParentSurvey(req.body.surveyCode);
        if (parentSurveyCode) {
            req.body.parentSurveyCode = parentSurveyCode;
            return null;
        } else {
            return errors.PARENT_SURVEY_NOT_FOUND;
        }
    }
    else if (req.query.new === 'true') {
        req.body.parentSurveyCode = SYSTEM_SURVEY_CODE;
        req.body.surveyCode = generateReferralCode();
        return null;
    }
    else {
        return errors.NO_SURVEY_CODE_PROVIDED;
    }
}

/**
 * Finds the parent survey that contains the given survey code in its childSurveyCodes
 * @param req - The authenticated request
 * @returns Promise<string | null> - The parent survey code or null if not found
 */
export async function getParentSurvey(surveyCode: string): Promise<string | null> {
    const parentSurvey = await Survey.findOne({ childSurveyCodes: { $in: [surveyCode] } }).select({ surveyCode: 1 });
    return parentSurvey?.surveyCode || null;
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
	return Array.from({ length: 3 }, () => generateReferralCode());
}

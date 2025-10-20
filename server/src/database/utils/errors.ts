/**
 * @swagger
 * components:
 *   schemas:
 *     ErrorCode:
 *       description: Custom error class for structured error handling
 *       type: object
 *       properties:
 *         code:
 *           type: string
 *           description: Unique error code identifier
 *           example: "PARENT_SURVEY_NOT_FOUND"
 *         message:
 *           type: string
 *           description: Human-readable error message
 *           example: "Parent survey does not exist"
 *         status:
 *           type: integer
 *           description: HTTP status code
 *           example: 404
 *         name:
 *           type: string
 *           description: Error class name
 *           example: "ErrorCode"
 *     SurveyErrors:
 *       description: Collection of all survey-related error codes
 *       type: object
 *       properties:
 *         PARENT_SURVEY_NOT_FOUND:
 *           $ref: '#/components/schemas/ErrorCode'
 *         SURVEY_CODE_NOT_FOUND_IN_PARENT_CODES:
 *           $ref: '#/components/schemas/ErrorCode'
 *         SYSTEM_GENERATED_SURVEY_CODE_FOUND_IN_PREVIOUS_CHILD_CODES:
 *           $ref: '#/components/schemas/ErrorCode'
 *         PARENT_SURVEY_MISSING_CREATED_AT:
 *           $ref: '#/components/schemas/ErrorCode'
 *         REFERRAL_CHRONOLOGY_VIOLATION:
 *           $ref: '#/components/schemas/ErrorCode'
 *         CHILD_SURVEY_CODES_NOT_UNIQUE:
 *           $ref: '#/components/schemas/ErrorCode'
 *         CHILD_SURVEY_CODES_NOT_UNIQUE_ACROSS_ALL_SURVEYS:
 *           $ref: '#/components/schemas/ErrorCode'
 *         OBJECT_ID_REQUIRED:
 *           $ref: '#/components/schemas/ErrorCode'
 *         OBJECT_ID_NOT_FOUND:
 *           $ref: '#/components/schemas/ErrorCode'
 *         VALIDATION_ERROR:
 *           $ref: '#/components/schemas/ErrorCode'
 *         IMMUTABLE_FIELD_VIOLATION:
 *           $ref: '#/components/schemas/ErrorCode'
 */

export class ErrorCode extends Error {
	constructor(
		public code: string,
		message: string,
		public status = 400
	) {
		super(message);
		this.name = 'ErrorCode';
	}

	toJSON() {
		return {
			code: this.code,
			message: this.message,
			status: this.status
		};
	}
}

export const errors = {
	PARENT_SURVEY_NOT_FOUND: new ErrorCode(
		'PARENT_SURVEY_NOT_FOUND',
		'Could not find parent survey with matching survey code',
		404
	),
	NO_SURVEY_CODE_PROVIDED: new ErrorCode(
		'NO_SURVEY_CODE_PROVIDED',
		'No survey code provided. Please provide a survey code or use the `new` query parameter.',
		400
	),
	SURVEY_CODE_NOT_FOUND_IN_PARENT_CODES: new ErrorCode(
		'SURVEY_CODE_NOT_FOUND_IN_PARENT_CODES',
		'Survey code not found in parent survey codes',
		404
	),
	SYSTEM_GENERATED_SURVEY_CODE_FOUND_IN_PREVIOUS_CHILD_CODES: new ErrorCode(
		'SYSTEM_GENERATED_SURVEY_CODE_FOUND_IN_PREVIOUS_CHILD_CODES',
		'System generated survey code found in the child code of an already existing survey',
		409
	),
	PARENT_SURVEY_MISSING_CREATED_AT: new ErrorCode(
		'PARENT_SURVEY_MISSING_CREATED_AT',
		'Parent survey is missing a valid createdAt timestamp',
		500
	),
	REFERRAL_CHRONOLOGY_VIOLATION: new ErrorCode(
		'REFERRAL_CHRONOLOGY_VIOLATION',
		'Child survey must be created after its parent survey',
		409
	),
	CHILD_SURVEY_CODES_NOT_UNIQUE: new ErrorCode(
		'CHILD_SURVEY_CODES_NOT_UNIQUE',
		'Duplicate survey codes found within this survey',
		400
	),
	CHILD_SURVEY_CODES_NOT_UNIQUE_ACROSS_ALL_SURVEYS: new ErrorCode(
		'CHILD_SURVEY_CODES_NOT_UNIQUE_ACROSS_ALL_SURVEYS',
		'Duplicate survey codes found in this survey and another survey',
		409
	),
	SURVEY_CODE_ALREADY_EXISTS: new ErrorCode(
		'SURVEY_CODE_ALREADY_EXISTS',
		'Survey code already exists in database',
		409
	),
	OBJECT_ID_REQUIRED: new ErrorCode(
		'OBJECT_ID_REQUIRED',
		'Object ID is required',
		400
	),
	OBJECT_ID_NOT_FOUND: new ErrorCode(
		'OBJECT_ID_NOT_FOUND',
		'Could not find document with matching object ID',
		404
	),
	VALIDATION_ERROR: new ErrorCode(
		'VALIDATION_ERROR',
		'Validation error',
		400
	),
	IMMUTABLE_FIELD_VIOLATION: new ErrorCode(
		'IMMUTABLE_FIELD_VIOLATION',
		'Cannot modify immutable field after creation',
		400
	),
	SURVEY_CODE_GENERATION_ERROR: new ErrorCode(
		'SURVEY_CODE_GENERATION_ERROR',
		'Could not generate valid survey code(s) after maximum retry attempts. Please try again.',
		500
	)
};

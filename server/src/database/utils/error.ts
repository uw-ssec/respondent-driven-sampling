export class ErrorCode extends Error {
    constructor(public code: string, message: string, public status = 400) {
      super(message);
      this.name = 'ErrorCode';
    }
}

export const errors = {
    PARENT_SURVEY_NOT_FOUND: new ErrorCode('PARENT_SURVEY_NOT_FOUND', 'Parent survey does not exist', 404),
    SURVEY_CODE_NOT_FOUND_IN_PARENT_CODES: new ErrorCode('SURVEY_CODE_NOT_FOUND_IN_PARENT_CODES', 'Survey code not found in parent survey codes', 404),
    PARENT_SURVEY_MISSING_CREATED_AT: new ErrorCode('PARENT_SURVEY_MISSING_CREATED_AT', 'Parent survey is missing a valid createdAt timestamp', 500),
    REFERRAL_CHRONOLOGY_VIOLATION: new ErrorCode('REFERRAL_CHRONOLOGY_VIOLATION', 'Child survey must be created after its parent survey', 409),
    CHILD_SURVEY_CODES_NOT_UNIQUE: new ErrorCode('CHILD_SURVEY_CODES_NOT_UNIQUE', 'Duplicate survey codes found within this survey', 400),
    CHILD_SURVEY_CODES_NOT_UNIQUE_ACROSS_ALL_SURVEYS: new ErrorCode('CHILD_SURVEY_CODES_NOT_UNIQUE_ACROSS_ALL_SURVEYS', 'Duplicate survey codes found in this survey and another survey', 409),
    OBJECT_ID_REQUIRED: new ErrorCode('OBJECT_ID_REQUIRED', 'Object ID is required', 400),
    OBJECT_ID_NOT_FOUND: new ErrorCode('OBJECT_ID_NOT_FOUND', 'Could not find document with matching object ID', 404),
    VALIDATION_ERROR: new ErrorCode('VALIDATION_ERROR', 'Validation error', 400),
    IMMUTABLE_FIELD_VIOLATION: new ErrorCode('IMMUTABLE_FIELD_VIOLATION', 'Cannot modify immutable field after creation', 400),
}
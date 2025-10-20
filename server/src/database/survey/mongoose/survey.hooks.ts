import { Schema } from 'mongoose';
import { errors } from '../../utils/errors';
import { SYSTEM_SURVEY_CODE } from '../../utils/constants';

// Pre-save hook to enforce uniqueness in generated survey codes (inter- and intra-document)
export const uniquenessValidationHook = async function(this: any, next: any) {
    if (this.isNew) { // Only check for new documents
        const codes = this.childSurveyCodes;
        
        // Check if any of these codes already exist in other documents
        const existingSurveys = await this.constructor.find({
            'childSurveyCodes': { $in: codes }
        });
        
        if (existingSurveys.length > 0) {
            return next(errors.CHILD_SURVEY_CODES_NOT_UNIQUE_ACROSS_ALL_SURVEYS);
        }
    }
    next();
};

// Pre-save hook to enforce chronological ordering of referrals
export const chronologicalValidationHook = async function(this: any, next: any) {
    if (!this.isNew) return next();

    try {
        // If the survey is a system survey, skip the chronological ordering check
        const parentCode = this.parentSurveyCode as string;
        if (parentCode === SYSTEM_SURVEY_CODE) {
            // Check if the survey code exists in any other survey's childSurveyCodes
            const existingSurveyWithCode = await this.constructor.findOne({
                childSurveyCodes: { $in: [this.surveyCode] }
            });

            if (existingSurveyWithCode) {
                return next(errors.SYSTEM_GENERATED_SURVEY_CODE_FOUND_IN_PREVIOUS_CHILD_CODES);
            }
            return next();
        }

        // Get the parent survey
        const parentSurvey = await this.constructor.findOne({ surveyCode: parentCode }).select({ createdAt: 1, childSurveyCodes: 1 });

        // Check if the parent survey exists
        if (!parentSurvey) {
            return next(errors.PARENT_SURVEY_NOT_FOUND);
        }

        // Check if the parent survey has a valid createdAt timestamp
        const now = new Date();
        if (!(parentSurvey.createdAt instanceof Date)) {
            return next(errors.PARENT_SURVEY_MISSING_CREATED_AT);
        }

        // Check if the child survey is created after the parent survey
        if (now <= parentSurvey.createdAt) {
            return next(errors.REFERRAL_CHRONOLOGY_VIOLATION);
        }

        // Check if the survey code is one of the parent survey's child survey codes
        if (!parentSurvey.childSurveyCodes.includes(this.surveyCode)) {
            return next(errors.SURVEY_CODE_NOT_FOUND_IN_PARENT_CODES);
        }

        return next();
    } catch (err) {
        return next(err as Error);
    }
};

// Pre-save hook to enforce immutability on complex fields
export const immutabilityValidationHook = async function(this: any, next: any) {
    if (this.isNew) return next();

    // The immutable flags in our schema can only handle top-level fields
    // So we need to check each nested field or array field individually
    if (this.coordinates && this.isModified('coordinates') || this.isModified('childSurveyCodes')) {
        return next(errors.IMMUTABLE_FIELD_VIOLATION);
    }
    next();
};

// Function to register all hooks on a schema
export const injectSurveyHooks = (schema: Schema) => {
    schema.pre('save', uniquenessValidationHook);
    schema.pre('save', chronologicalValidationHook);
    schema.pre('save', immutabilityValidationHook);
};

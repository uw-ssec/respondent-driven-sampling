// TODO: Implement Survey mongoose model

import mongoose, { InferSchemaType, Model, Schema, Types } from 'mongoose';
import { SiteLocation, SYSTEM_SURVEY_CODE } from '../utils/constants';
import { errors } from '../utils/error';

// SCHEMA

const surveySchema = new Schema({
    surveyCode: { type: String, required: true, unique: true, immutable: true },
    parentSurveyCode: { type: String, required: true, immutable: true },
    childSurveyCodes: [ { type: String, required: true } ], // immutable via pre-save hook
    responses: { type: Object, default: {}, required: true }, // mutable
    createdByUserObjectId: { type: Types.ObjectId, ref: 'User', required: true, immutable: true },
    siteLocation: { type: String, enum: SiteLocation, required: true, immutable: true },
    coordinates: {
        latitude: { type: Number },
        longitude: { type: Number }
    }, // optional, immutable via pre-save hook
    isCompleted: { type: Boolean, default: false }, // optional, mutable
}, { 
    timestamps: true, // Automatically adds createdAt and updatedAt fields
    strict: 'throw', 
    indexes: [ // Faster queries on these fields
        { fields: 'surveyCode', unique: true },
        { fields: 'parentSurveyCode' },
        { fields: 'childSurveyCodes', unique: true },
        { fields: 'createdByUserObjectId' },
        { fields: 'siteLocation' },
    ]
});

// MIDDLEWARE

// Pre-save hook to enforce uniqueness in generated survey codes (inter- and intra-document)
surveySchema.pre('save', async function(next) {
    if (this.isNew) { // Only check for new documents
        const codes = this.childSurveyCodes;

        // Check for uniqueness within the document
        const uniqueCodes = [...new Set(codes)];
        if (uniqueCodes.length !== codes.length) {
            return next(errors.CHILD_SURVEY_CODES_NOT_UNIQUE);
        }
        
        // Check if any of these codes already exist in other documents
        const existingSurveys = await Survey.find({
            'childSurveyCodes': { $in: codes }
        });
        
        if (existingSurveys.length > 0) {
            return next(errors.CHILD_SURVEY_CODES_NOT_UNIQUE_ACROSS_ALL_SURVEYS);
        }
    }
    next();
});


// Pre-save hook to enforce chronological ordering of referrals
// A child survey must be created strictly after its parent survey
surveySchema.pre('save', async function(next) {
    if (!this.isNew) return next();

    try {
        // If the survey is a system survey, skip the chronological ordering check
        const parentCode = this.parentSurveyCode as string;
        if (parentCode === SYSTEM_SURVEY_CODE) {
            // Check if the survey code exists in any other survey's childSurveyCodes
            const existingSurveyWithCode = await Survey.findOne({
                childSurveyCodes: { $in: [this.surveyCode] }
            });

            if (existingSurveyWithCode) {
                return next(errors.SYSTEM_GENERATED_SURVEY_CODE_FOUND_IN_PREVIOUS_CHILD_CODES);
            }
            return next();
        }

        // Get the parent survey
        const parentSurvey = await Survey.findOne({ surveyCode: parentCode }).select({ createdAt: 1, childSurveyCodes: 1 });

        // Check if the parent survey exists
        if (!parentSurvey) {
            return next(errors.PARENT_SURVEY_NOT_FOUND);
        }

        // Check if the parent survey has a valid createdAt timestamp
        // Should never happen, but avoids null errors for chck below
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
});

// Pre-save hook to enforce immutability on complex fields
surveySchema.pre('save', async function(next) {
    if (this.isNew) return next();

    // The immutable flags in our schema can only handle top-level fields
    // So we need to check each nested field or array field individually
    if (this.coordinates && this.isModified('coordinates') || this.isModified('childSurveyCodes')) {
        return next(errors.IMMUTABLE_FIELD_VIOLATION);
    }
    next();
});

// MODEL

export type ISurvey = InferSchemaType<typeof surveySchema>;
const Survey: Model<ISurvey> = mongoose.model<ISurvey>('Survey', surveySchema);
export default Survey;
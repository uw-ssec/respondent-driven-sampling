// TODO: Implement Survey mongoose model

import mongoose, { InferSchemaType, Model, Schema, Types } from 'mongoose';
import { SiteLocation, SYSTEM_SURVEY_CODE } from '../utils/constants';
import { errors } from '../utils/error';

// SCHEMA

const surveySchema = new Schema({
    surveyCode: { type: String, required: true, unique: true },
    parentSurveyCode: { type: String, required: true },
    childSurveyCodes: [ { type: String, required: true } ],
    responses: { type: Object, default: {}, required: true },
    createdByUserObjectId: { type: Types.ObjectId, ref: 'User', required: true },
    siteLocation: { type: String, enum: SiteLocation, required: true },
    coordinates: {
        latitude: { type: Number },
        longitude: { type: Number }
    }, // optional
    isCompleted: { type: Boolean, default: false }, // optional
}, { 
    timestamps: true, // Automatically adds createdAt and updatedAt fields
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

// MODEL

export type ISurvey = InferSchemaType<typeof surveySchema>;
const Survey: Model<ISurvey> = mongoose.model<ISurvey>('Survey', surveySchema);
export default Survey;
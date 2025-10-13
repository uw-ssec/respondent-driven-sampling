// TODO: Implement Survey mongoose model

import mongoose, { InferSchemaType, Model, Schema, Types } from 'mongoose';
import { SiteLocation } from '../utils/constants';

const surveySchema = new Schema({
    surveyCode: { type: String, required: true, unique: true },
    referredBySurveyCode: { type: String, required: true },
    generatedSurveyCodes: [{
        code: { type: String, required: true },
        usedBySurveyObjectId: { type: Types.ObjectId, ref: 'Survey', default: null } // could derive this instead of store
    }],
    responses: { type: Object, default: {} },
    createdByUserObjectId: { type: Types.ObjectId, ref: 'User', required: true },
    siteLocation: { type: String, enum: SiteLocation, required: true },
    coordinates: {
        latitude: { type: Number, min: -90, max: 90 },
        longitude: { type: Number, min: -180, max: 180 }
    },
    isCompleted: { type: Boolean, default: false },
}, { 
    timestamps: true // Automatically adds createdAt and updatedAt fields
});

// Pre-save hook to enforce uniqueness in generated survey codes (inter- and intra-document)
surveySchema.pre('save', async function(next) {
    if (this.isNew) { // Only check for new documents
        const codes = this.generatedSurveyCodes.map((item: any) => item.code);

        // Check for uniqueness within the document
        const uniqueCodes = [...new Set(codes)];
        if (uniqueCodes.length !== codes.length) {
            return next(new Error('Generated survey codes must be unique'));
        }
        
        // Check if any of these codes already exist in other documents
        const existingSurveys = await Survey.find({
            'generatedSurveyCodes.code': { $in: codes }
        });
        
        if (existingSurveys.length > 0) {
            return next(new Error('Generated survey codes must be unique across all surveys'));
        }
    }
    next();
});

// Add the implicit _id field to our schema
export type ISurvey = InferSchemaType<typeof surveySchema> & { _id: Types.ObjectId };

const Survey: Model<ISurvey> = mongoose.model<ISurvey>('Survey', surveySchema);
export default Survey;
import mongoose, { Model, Schema } from 'mongoose';
import { IReferralCode, ISurvey } from '../types/models.js';

// Schema for a single referral code associated with a survey.
// Each survey can have multiple referral codes.
// The referral code is used to track which survey referred this one.
// The `usedBySurvey` field references the survey that used this referral code.
const referralCodeSchema = new Schema<IReferralCode>({
	code: { type: String, required: true },
	usedBySurvey: {
		type: Schema.Types.ObjectId,
		ref: 'Survey',
		default: null
	},
	usedAt: { type: Date, default: null }
});

// Main schema for the survey.
// Each survey is associated with an employee and contains their responses.
// The `employeeId` and `employeeName` fields are required.
// The `responses` field is an object that contains the survey responses.
const surveySchema = new Schema<ISurvey>({
	employeeId: { type: String, required: true },
	employeeName: { type: String, required: true },
	responses: { type: Object, required: true },
	createdAt: { type: Date, default: Date.now },
	lastUpdated: { type: Date, default: Date.now }, // Date the survey was last edited
	inProgress: { type: Boolean, required: false }, // TODO: Edit later to required: True - currently this is fixing a bug but should look at this later

	// 2 referral codes stored here
	referralCodes: [referralCodeSchema],

	// The code that referred this new survey
	referredByCode: { type: String, default: null },

	//geolocation
	coords: { type: Object, required: false }
});

// Create the model for the survey using the defined schema.
// The model is used to interact with the MongoDB collection for surveys.
const Survey: Model<ISurvey> = mongoose.model<ISurvey>('Survey', surveySchema);
export default Survey;

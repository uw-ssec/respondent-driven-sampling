// Import Mongoose for MongoDB object modeling.
const mongoose = require('mongoose');
// const { FaBullseye } = require('react-icons/fa6');

// Schema for a single referral code associated with a survey.
// Each survey can have multiple referral codes.
// The referral code is used to track which survey referred this one.
// The `usedBySurvey` field references the survey that used this referral code.
const referralCodeSchema = new mongoose.Schema({
	code: { type: String, required: true }, // A code that will be distributed to participants that will create child surveys
	usedBySurvey: {  // Object ID of child survey that used this referral code
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Survey',
		default: null
	},
	usedAt: { type: Date, default: null } // Date that this survey was used at
});

// Main schema for the survey.
// Each survey is associated with an employee and contains their responses.
// The `employeeId` and `employeeName` fields are required.
// The `responses` field is an object that contains the survey responses.
const surveySchema = new mongoose.Schema({
  employeeId: { type: String, required: true }, // Employee ID of employee who administered survey
  employeeName: { type: String, required: true }, // Employee name of employee who administered survey
  responses: { type: Object, required: true }, // Survey questions and responses
  createdAt: { type: Date, default: Date.now }, // The time the survey was created at 
  lastUpdated: { type: Date, default: Date.now }, // Date this survey was last edited
  inProgress: {type: Boolean, required: false}, // A boolean indicating whether or not the survey is still in progress 


	// 2 referral codes that are distributed at the end of the survey are stored here
	referralCodes: [referralCodeSchema],

	// The code that referred this new survey; null indicates it is a "root" survey
	referredByCode: { type: String, default: null },

	// Geolocation of where survey was administered 
	coords: { type: Object, required: false }
});

// Create the model for the survey using the defined schema.
// The model is used to interact with the MongoDB collection for surveys.
const Survey = mongoose.model('Survey', surveySchema);
module.exports = Survey;

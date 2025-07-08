
// Import Mongoose for MongoDB object modeling.
const mongoose = require('mongoose');
// const { FaBullseye } = require('react-icons/fa6');

// Schema for a single referral code associated with a survey.
// Each survey can have multiple referral codes.
// The referral code is used to track which survey referred this one.
// The `usedBySurvey` field references the survey that used this referral code.
const referralCodeSchema = new mongoose.Schema({
  code: { type: String, required: true },
  usedBySurvey: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Survey',
    default: null
  },
  usedAt: { type: Date, default: null }
});

// Main schema for the survey.
// Each survey is associated with an employee and contains their responses.
// The `employeeId` and `employeeName` fields are required.
// The `responses` field is an object that contains the survey responses.
const surveySchema = new mongoose.Schema({
  employeeId: { type: String, required: true },
  employeeName: { type: String, required: true },
  responses: { type: Object, required: true },
  createdAt: { type: Date, default: Date.now },

  // 2 referral codes stored here
  referralCodes: [referralCodeSchema],

  // The code that referred this new survey
  referredByCode: { type: String, default: null },

  //geolocation
  coords: { type: Object, required: false },
});

// Create the model for the survey using the defined schema.
// The model is used to interact with the MongoDB collection for surveys.
const Survey = mongoose.model('Survey', surveySchema);
module.exports = Survey;

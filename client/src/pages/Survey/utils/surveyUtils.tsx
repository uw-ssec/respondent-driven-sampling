import { Model } from 'survey-core';

import { SurveyDocument } from '@/types/Survey';

import surveyJsonData from './survey.json';
import { themeJson } from './surveyTheme';

// Helper function to initialize survey with or without existing data
export const initializeSurvey = (
	surveyByRefCode: SurveyDocument | null,
	surveyByObjectId: SurveyDocument | null,
	parentSurvey: SurveyDocument | null,
	isEditMode: boolean = false
) => {
	// Clone the survey JSON to avoid mutating the original
	const surveyJson = JSON.parse(JSON.stringify(surveyJsonData));

	if (isEditMode) {
		// Edit mode only uses first 3 pages: volunteer-pre-screen, consent, survey-validation
		surveyJson.title = 'Homelessness Experience Survey (Edit Mode)';
		surveyJson.pages = [
			...surveyJson.pages.slice(0, 4), 
			surveyJson.pages[16], 
			surveyJson.pages[17]
		].filter(page => page !== undefined);

		// Remove any early stop triggers to allow full editing of survey
		// Without this, the survey will stop early if consent is revoked, not allowing any edits to consecutive pages
		if (surveyJson.triggers) {
			delete surveyJson.triggers;
		}
	}

	const survey = new Model(surveyJson);

	// Apply custom theme
	survey.applyTheme(themeJson);

	// Populate with existing data from objectId if found
	if (surveyByObjectId) {
		survey.data = surveyByObjectId.responses;
		return {
			survey,
			existingData: {
				surveyData: surveyByObjectId,
				objectId: surveyByObjectId._id,
				parentSurveyCode: surveyByObjectId.parentSurveyCode
			}
		};
	}
	// Populate with existing data from coupon code if found
	else if (surveyByRefCode) {
		survey.data = surveyByRefCode.responses;
		return {
			survey,
			existingData: {
				surveyData: surveyByRefCode,
				objectId: surveyByRefCode._id,
				parentSurveyCode: parentSurvey?.surveyCode
			}
		};
	}

	// No existing data found, return blank new survey

	survey.data = {};
	return { survey, existingData: null };
};

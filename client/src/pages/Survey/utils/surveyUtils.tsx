import { Model } from 'survey-core';

import { LocationDocument } from '@/types/Locations';
import { SurveyDocument } from '@/types/Survey';

import { generateEditSurveyJson, generateSurveyJson } from './SurveyJson';
import { themeJson } from './surveyTheme';

// Helper function to initialize survey with or without existing data
export const initializeSurvey = (
	locations: LocationDocument[],
	surveyByRefCode: SurveyDocument | null,
	surveyByObjectId: SurveyDocument | null,
	parentSurvey: SurveyDocument | null,
	isEditMode: boolean = false
) => {
	const locationChoices = locations.map((location: LocationDocument) => ({
		value: location._id,
		text: location.hubName
	}));

	const surveyJson = isEditMode
		? generateEditSurveyJson(locationChoices)
		: generateSurveyJson(locationChoices);
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
	// Populate with existing data from referral code if found
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

import { Model } from 'survey-core';

import { SurveyDocument } from '@/types/Survey';

import surveyJsonData from './survey.json';
import { themeJson } from './surveyTheme';

// Helper function to initialize survey with or without existing data
export const initializeSurvey = (
	surveyByRefCode: SurveyDocument | null,
	surveyByObjectId: SurveyDocument | null,
	parentSurvey: SurveyDocument | null,
	isEditMode: boolean = false,
	editMode: string | null = null
) => {
	// Clone the survey JSON to avoid mutating the original
	const surveyJson = JSON.parse(JSON.stringify(surveyJsonData));

	if (isEditMode) {
		let pageNames: string[] = [];
		let title = 'Homelessness Experience Survey (Edit Mode)';

		// Determine which pages to show based on edit mode
		if (editMode === 'details') {
			// Edit Survey Details
			title = 'Edit Survey Details';
			pageNames = [
				'volunteer-pre-screen',
				'age_check',
				'consent',
				'survey-validation',
			];
		} else if (editMode === 'giftcard') {
			// Edit Gift Card Information
			title = 'Edit Gift Card Information';
			pageNames = ['giftCards', 'giftCards2'];
		} else if (editMode === 'feedback') {
			// Leave Feedback
			title = 'Leave Feedback';
			pageNames = ['end_page'];
		} else {
			// Default: all edit pages
			pageNames = [
				'volunteer-pre-screen',
				'age_check',
				'consent',
				'survey-validation',
				'giftCards',
				'giftCards2',
				'end_page'
			];
		}

		surveyJson.title = title;
		surveyJson.pages = surveyJson.pages.filter((page: any) =>
			pageNames.includes(page.name)
		);

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

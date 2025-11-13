import {
	generateEditSurveyJson,
	generateSurveyJson
} from './SurveyJson';
import { ACTIONS, SUBJECTS } from '@/permissions/constants';
import { Model } from 'survey-core';

// Helper function to validate referral code and permissions
export const validateReferralCode = (
	surveyCodeInUrl: string | null,
	surveyByRefCode: any,
	parentSurvey: any,
	seed: any,
	ability: any
) => {
	// Run validation if there's a code present
	if (surveyCodeInUrl) {
		// if there is no parent survey or seed connected to this survey code, return false
		if (!parentSurvey && !seed) {
			return {
				isValid: false,
				message: 'Invalid survey code. Please try again.'
			};
		}
		// If the survey is already completed, return false
		if (surveyByRefCode?.isCompleted) {
			return {
				isValid: false,
				message: 'This survey has already been completed.'
			}
		}
	} else {
		// No referral code - check permissions to see if they can create w/o referral
		if (
			!ability.can(
				ACTIONS.CUSTOM.CREATE_WITHOUT_REFERRAL,
				SUBJECTS.SURVEY
			)
		) {
			return {
				isValid: false,
				message:
					'You do not have permission to create a survey without a referral code.'
			};
		}
	}
	return { isValid: true, message: '' };
};

// Helper function to initialize survey with or without existing data
export const initializeSurvey = (
	locations: any[],
	surveyByRefCode: any,
	surveyByObjectId: any,
	parentSurvey: any,
	isEditMode: boolean = false
) => {
	const locationChoices = locations.map((location: any) => ({
		value: location._id,
		text: location.hubName
	}));

	const surveyJson = isEditMode
		? generateEditSurveyJson(locationChoices)
		: generateSurveyJson(locationChoices);
	const survey = new Model(surveyJson);

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

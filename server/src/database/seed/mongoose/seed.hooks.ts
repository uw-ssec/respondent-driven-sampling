import { Schema } from 'mongoose';

import Location from '@/database/location/mongoose/location.model';
import Survey from '@/database/survey/mongoose/survey.model';
import { errors } from '@/database/utils/errors';

export const uniquenessValidationHook = async function (this: any, next: any) {
	if (this.isNew) {
		// Ensure no current Survey has this survey code
		const existingSurveyWithMatchingCode = await Survey.findOne({
			surveyCode: this.surveyCode
		});
		if (existingSurveyWithMatchingCode) {
			next(errors.SURVEY_CODE_ALREADY_EXISTS);
		}

		// Ensure no current Survey's child codes include this survey code
		const existingSurveyWithMatchingChildCode = await Survey.findOne({
			childSurveyCodes: { $in: [this.surveyCode] }
		});
		if (existingSurveyWithMatchingChildCode) {
			next(errors.SURVEY_CODE_ALREADY_EXISTS);
		}
	}
	next();
};

export const locationValidationHook = async function (this: any, next: any) {
	const location = await Location.findById(this.locationObjectId);
	if (!location) {
		return next(errors.LOCATION_NOT_FOUND);
	}
	next();
};

export const injectSeedHooks = (schema: Schema) => {
	schema.pre('save', uniquenessValidationHook);
	schema.pre('save', locationValidationHook);
};

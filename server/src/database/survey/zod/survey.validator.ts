import Survey from '../mongoose/survey.model';
import { baseSurveySchema } from './survey.base';

export const createSurveySchema = baseSurveySchema
	.pick({
		surveyCode: true,
		createdByUserObjectId: true,
		siteLocation: true,
		responses: true,
		isCompleted: true,
		coordinates: true
	})
	.partial({
		// Optional fields
		surveyCode: true,
		coordinates: true,
		isCompleted: true
	})
	.strict()
	.meta({ model: Survey });

// Update schema - only updatable fields
export const updateSurveySchema = baseSurveySchema
	.pick({
		// Updatable fields
		// NOTE: Verify if we can specify which keys are updatable in responses object.
		responses: true,
		isCompleted: true
	})
	.strict()
	.meta({ model: Survey });

// Read schema - for filtering to fetch one or more surveys by any field(s)
export const readSurveySchema = baseSurveySchema
	.partial()
	.meta({ model: Survey });

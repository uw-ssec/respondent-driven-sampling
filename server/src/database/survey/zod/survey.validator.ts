import Survey from '@/database/survey/mongoose/survey.model';
import { baseSurveySchema } from '@/database/survey/zod/survey.base';
import { SYSTEM_SURVEY_CODE } from '@/database/utils/constants';

export const createSurveySchema = baseSurveySchema
	// fields the client should send when creating a survey.
	.pick({
		surveyCode: true,
		parentSurveyCode: true,
		createdByUserObjectId: true,
		locationObjectId: true,
		responses: true,
		isCompleted: true,
		coordinates: true
	})
	.partial({
		// Optional fields
		parentSurveyCode: true,
		coordinates: true,
		isCompleted: true
	})
	.refine(
		data =>
			!data.parentSurveyCode ||
			data.parentSurveyCode === SYSTEM_SURVEY_CODE,
		{
			message:
				'Cannot create a survey with a pre-defined parentSurveyCode unless it is a system-generated survey code seed.',
			path: ['parentSurveyCode']
		}
	)
	// enforcing no additional properties in object schemas
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

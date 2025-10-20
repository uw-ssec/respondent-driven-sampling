import { Schema } from 'mongoose';

import { SYSTEM_SURVEY_CODE } from '../../utils/constants';
import { errors } from '../../utils/errors';

// Pre-save hook to enforce uniqueness in generated survey codes (inter- and intra-document)
export const uniquenessValidationHook = async function (this: any, next: any) {
	// Return if not a new document
	if (!this.isNew) next();
	try {
		const currentDocumentChildSurveyCodes = this.childSurveyCodes;

		// Check if any of the child survey codes already exist in other documents
		const existingSurveys = await this.constructor.find({
			childSurveyCodes: { $in: currentDocumentChildSurveyCodes }
		});

		if (existingSurveys.length > 0) {
			next(errors.CHILD_SURVEY_CODES_NOT_UNIQUE_ACROSS_ALL_SURVEYS);
		}
		next();
	} catch (err) {
		return next(err as Error);
	}
};

// Pre-save hook to enforce chronological ordering of referrals
// Ensures that a child survey is created after its parent survey
// and that the survey code is listed in the parent survey's childSurveyCodes
export const chronologicalValidationHook = async function (
	this: any,
	next: any
) {
	// Return if not a new document
	if (!this.isNew) next();

	try {
		// If the survey is a system / seed survey, skip the chronological ordering check
		const currentDocumentParentCode = this.parentSurveyCode as string;
		if (currentDocumentParentCode === SYSTEM_SURVEY_CODE) {
			// Check if the survey code exists in any other survey's childSurveyCodes
			const existingSurveyWithCode = await this.constructor.findOne({
				childSurveyCodes: { $in: [this.surveyCode] }
			});

			if (existingSurveyWithCode) {
				next(
					errors.SYSTEM_GENERATED_SURVEY_CODE_FOUND_IN_PREVIOUS_CHILD_CODES
				);
			}
			next();
		}

		// Get the parent survey
		const parentSurvey = await this.constructor
			.findOne({ surveyCode: currentDocumentParentCode })
			.select({ createdAt: 1, childSurveyCodes: 1 });

		// Check if the parent survey exists
		if (!parentSurvey) {
			return next(errors.PARENT_SURVEY_NOT_FOUND);
		}

		// Check if the parent survey has a valid createdAt timestamp
		const now = new Date();
		if (!(parentSurvey.createdAt instanceof Date)) {
			return next(errors.PARENT_SURVEY_MISSING_CREATED_AT);
		}

		// Check if the child survey is created after the parent survey
		if (now <= parentSurvey.createdAt) {
			return next(errors.REFERRAL_CHRONOLOGY_VIOLATION);
		}

		// Check if the survey code is one of the parent survey's child survey codes
		if (!parentSurvey.childSurveyCodes.includes(this.surveyCode)) {
			return next(errors.SURVEY_CODE_NOT_FOUND_IN_PARENT_CODES);
		}

		next();
	} catch (err) {
		next(err as Error);
	}
};

// Pre-save hook to enforce immutability on complex fields
export const immutabilityValidationHook = async function (
	this: any,
	next: any
) {
	// Return if new document
	if (this.isNew) next();

	// The immutable flags in our schema can only handle top-level fields
	// So we need to check each nested field or array field individually
	if (
		(this.coordinates && this.isModified('coordinates')) ||
		this.isModified('childSurveyCodes')
	) {
		next(errors.IMMUTABLE_FIELD_VIOLATION);
	}
	next();
};

// Function to register all hooks on a schema
export const injectSurveyHooks = (schema: Schema) => {
	schema.pre('save', uniquenessValidationHook);
	schema.pre('save', chronologicalValidationHook);
	schema.pre('save', immutabilityValidationHook);
};

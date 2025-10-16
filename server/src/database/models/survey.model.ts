import mongoose, { InferSchemaType, Model, Schema, Types } from 'mongoose';

import { SiteLocation, SYSTEM_SURVEY_CODE } from '../utils/constants';
import { errors } from '../utils/error';

/**
 * @swagger
 * components:
 *   schemas:
 *     Survey:
 *       type: object
 *       required:
 *         - surveyCode
 *         - parentSurveyCode
 *         - createdByUserObjectId
 *         - siteLocation
 *         - responses
 *       properties:
 *         _id:
 *           type: string
 *           description: MongoDB ObjectId
 *           example: "507f1f77bcf86cd799439011"
 *         surveyCode:
 *           type: string
 *           description: Unique 6-character survey code
 *           minLength: 6
 *           maxLength: 6
 *           example: "ABC123"
 *         parentSurveyCode:
 *           type: string
 *           description: 6-character code of the parent survey that referred this one
 *           minLength: 6
 *           maxLength: 6
 *           example: "XYZ789"
 *         childSurveyCodes:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of 6-character codes for surveys that can be referred from this one
 *           minItems: 3
 *           maxItems: 3
 *           example: ["DEF456", "GHI789", "JKL012"]
 *         responses:
 *           type: object
 *           description: Survey responses as key-value pairs
 *           example: {"question1": "answer1", "question2": "answer2"}
 *         createdByUserObjectId:
 *           type: string
 *           description: MongoDB ObjectId of the user who created this survey
 *           example: "507f1f77bcf86cd799439011"
 *         siteLocation:
 *           type: string
 *           enum: [Location A, Location B, Location C]
 *           description: Physical location where the survey was conducted
 *           example: "Location A"
 *         coordinates:
 *           type: object
 *           description: GPS coordinates of the survey location
 *           properties:
 *             latitude:
 *               type: number
 *               minimum: -90
 *               maximum: 90
 *               example: 40.7128
 *             longitude:
 *               type: number
 *               minimum: -180
 *               maximum: 180
 *               example: -74.0060
 *         isCompleted:
 *           type: boolean
 *           description: Whether the survey has been completed
 *           default: false
 *           example: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the survey was created
 *           example: "2023-12-01T10:30:00.000Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the survey was last updated
 *           example: "2023-12-01T10:30:00.000Z"
 */

const surveySchema = new Schema(
	{
		surveyCode: {
			type: String,
			required: true,
			unique: true,
			immutable: true
		},
		parentSurveyCode: { type: String, required: true, immutable: true },
		childSurveyCodes: [{ type: String, required: true }], // immutable via pre-save hook
		responses: { type: Object, default: {}, required: true }, // mutable
		createdByUserObjectId: {
			type: Types.ObjectId,
			ref: 'User',
			required: true,
			immutable: true
		},
		siteLocation: {
			type: String,
			enum: SiteLocation,
			required: true,
			immutable: true
		},
		coordinates: {
			latitude: { type: Number },
			longitude: { type: Number }
		}, // optional, immutable via pre-save hook
		isCompleted: { type: Boolean, default: false } // optional, mutable
	},
	{
		timestamps: true, // Automatically adds createdAt and updatedAt fields
		strict: 'throw',
		indexes: [
			// Faster queries on these fields
			{ fields: 'surveyCode', unique: true },
			{ fields: 'parentSurveyCode' },
			{ fields: 'childSurveyCodes', unique: true },
			{ fields: 'createdByUserObjectId' },
			{ fields: 'siteLocation' }
		]
	}
);

// MIDDLEWARE

/**
 * @swagger
 * components:
 *   schemas:
 *     SurveyMiddleware:
 *       description: Pre-save middleware hooks that enforce business rules
 *       properties:
 *         uniquenessValidation:
 *           description: Ensures childSurveyCodes are unique within and across documents
 *           type: object
 *           properties:
 *             intraDocument:
 *               description: Checks for duplicate codes within the same survey
 *               type: boolean
 *             interDocument:
 *               description: Checks for duplicate codes across all surveys
 *               type: boolean
 *         chronologicalValidation:
 *           description: Ensures child surveys are created after parent surveys
 *           type: object
 *           properties:
 *             systemSurveyBypass:
 *               description: System surveys (_SEED_) bypass chronological checks
 *               type: boolean
 *             parentExists:
 *               description: Verifies parent survey exists in database
 *               type: boolean
 *             timestampValidation:
 *               description: Ensures child createdAt > parent createdAt
 *               type: boolean
 *             codeMatching:
 *               description: Ensures child surveyCode is in parent's childSurveyCodes array
 *               type: boolean
 *         immutabilityValidation:
 *           description: Prevents modification of immutable fields after creation
 *           type: object
 *           properties:
 *             coordinates:
 *               description: Prevents updates to coordinates after first set
 *               type: boolean
 *             childSurveyCodes:
 *               description: Prevents updates to childSurveyCodes array
 *               type: boolean
 */

// REVIEW: Could you explain the hooks?

// Pre-save hook to enforce uniqueness in generated survey codes (inter- and intra-document)
surveySchema.pre('save', async function (next) {
	// REVIEW: These properties will need comments. What is isNew, isModified, etc. I have guessed what they do, but not sure.
	// Check if the document is new or if childSurveyCodes were modified
	// We only need to check on creation, since childSurveyCodes is immutable
	if (this.isNew) {
		// Only check for new documents
		const codes = this.childSurveyCodes;

		// Check if any of these codes already exist in other documents
		const existingSurveys = await Survey.find({
			childSurveyCodes: { $in: codes }
		});

		if (existingSurveys.length > 0) {
			return next(
				errors.CHILD_SURVEY_CODES_NOT_UNIQUE_ACROSS_ALL_SURVEYS
			);
		}
	}
	next();
});

// Pre-save hook to enforce chronological ordering of referrals
// A child survey must be created strictly after its parent survey
surveySchema.pre('save', async function (next) {
	if (!this.isNew) return next();

	try {
		// If the survey is a system survey, skip the chronological ordering check
		const parentCode = this.parentSurveyCode as string;
		if (parentCode === SYSTEM_SURVEY_CODE) {
			// Check if the survey code exists in any other survey's childSurveyCodes
			const existingSurveyWithCode = await Survey.findOne({
				childSurveyCodes: { $in: [this.surveyCode] }
			});

			if (existingSurveyWithCode) {
				return next(
					errors.SYSTEM_GENERATED_SURVEY_CODE_FOUND_IN_PREVIOUS_CHILD_CODES
				);
			}
			return next();
		}

		// Get the parent survey
		const parentSurvey = await Survey.findOne({
			surveyCode: parentCode
		}).select({ createdAt: 1, childSurveyCodes: 1 });

		// Check if the parent survey exists
		if (!parentSurvey) {
			return next(errors.PARENT_SURVEY_NOT_FOUND);
		}

		// Check if the parent survey has a valid createdAt timestamp
		// Should never happen, but avoids null errors for chck below
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

		return next();
	} catch (err) {
		return next(err as Error);
	}
});

// Pre-save hook to enforce immutability on complex fields
surveySchema.pre('save', async function (next) {
	if (this.isNew) return next();

	// The immutable flags in our schema can only handle top-level fields
	// So we need to check each nested field or array field individually
	if (
		(this.coordinates && this.isModified('coordinates')) ||
		this.isModified('childSurveyCodes')
	) {
		return next(errors.IMMUTABLE_FIELD_VIOLATION);
	}
	next();
});

// MODEL

/**
 * @swagger
 * components:
 *   schemas:
 *     ISurvey:
 *       description: TypeScript interface for Survey documents
 *       allOf:
 *         - $ref: '#/components/schemas/Survey'
 *         - type: object
 *           properties:
 *             _id:
 *               type: string
 *               description: MongoDB ObjectId as string
 *             createdByUserObjectId:
 *               type: string
 *               description: MongoDB ObjectId as string
 */
export type ISurvey = InferSchemaType<typeof surveySchema>;
const Survey: Model<ISurvey> = mongoose.model<ISurvey>('Survey', surveySchema);
export default Survey;

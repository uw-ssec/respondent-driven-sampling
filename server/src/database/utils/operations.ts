import { accessibleBy } from '@casl/mongoose';
import { Model } from 'mongoose';
import { z } from 'zod';

import { ISurvey } from '@/database/models/survey.model';
import { AuthenticatedRequest } from '@/types/auth';

import { errors } from './error';
import {
	CreateResult,
	generateError,
	ReadResult,
	Result,
	UpdateResult
} from './results';

/**
 * @swagger
 * components:
 *   schemas:
 *     DatabaseOperations:
 *       description: Generic database operations with validation and authorization
 *       properties:
 *         create:
 *           description: Creates a new document with validation
 *           type: object
 *         read:
 *           description: Reads documents with optional filtering and authorization
 *           type: object
 *         update:
 *           description: Updates an existing document by ObjectId
 *           type: object
 *         withValidation:
 *           description: Wrapper function that adds Zod validation to operations
 *           type: object
 */

// Operation types
type Operation = typeof _create | typeof _update | typeof _read; // TODO: add other operations when implemented
type OperationResult = CreateResult | UpdateResult | ReadResult | Result;
type Interface = ISurvey; // TODO: add other interfaces when implemented (e.g. IUser)

// REVIEW: Think these abstractions are useful? Or did I overengineer this?
// REVIEW: Can these be used with other models too?
async function _read(
	model: Model<Interface>,
	data: Record<string, any>,
	req?: AuthenticatedRequest
): Promise<ReadResult | Result> {
	try {
		// REVIEW: Can you help me understand when to use casl with mongoose, and when to use it aobove in the router?
		const result = await model.find({
			$and: [
				data,
				req?.params.objectId ? { _id: req.params.objectId } : {},
				req?.authorization
					? accessibleBy(req.authorization).ofType(model.modelName)
					: {}
			]
		});
		return {
			status: 200,
			data: result.map(item => item.toObject())
		} as ReadResult;
	} catch (error: any) {
		return generateError(error.message, 500);
	}
}

async function _create(
	model: Model<Interface>,
	data: Record<string, any>
): Promise<CreateResult | Result> {
	try {
		const result = await model.create(data);
		return {
			status: 201,
			data: result.toObject(),
			message: `${model.modelName} created successfully`
		} as CreateResult;
	} catch (error: any) {
		// Handle MongoDB duplicate key errors
		if (error.code === 11000) {
			// Check which field caused the duplicate key error
			if (error.keyPattern?.surveyCode) {
				const error = errors.SURVEY_CODE_ALREADY_EXISTS;
				return generateError(error.message, error.status);
			}
			if (error.keyPattern?.childSurveyCodes) {
				const error =
					errors.CHILD_SURVEY_CODES_NOT_UNIQUE_ACROSS_ALL_SURVEYS;
				return generateError(error.message, error.status);
			}
			// Generic duplicate key error
			return generateError(
				'Duplicate key error: A record with this value already exists',
				409
			);
		}

		// Handle other Mongoose errors
		if (error.name === 'ErrorCode') {
			return generateError(error.message, error.status);
		}

		return generateError(error.message, 500);
	}
}

async function _update(
	model: Model<Interface>,
	data: Record<string, any>,
	req?: AuthenticatedRequest
): Promise<UpdateResult | Result> {
	try {
		const objectId = req?.params.objectId;

		// Could not find objectId in req params
		if (!objectId) {
			const error = errors.OBJECT_ID_REQUIRED;
			return generateError(error.message, error.status);
		}

		const result = await model.findByIdAndUpdate(objectId, data, {
			new: true
		});

		// Could not find objectId in database
		if (!result) {
			const error = errors.OBJECT_ID_NOT_FOUND;
			return generateError(error.message, error.status);
		}

		// Successfully updated object
		return {
			status: 200,
			data: result.toObject(),
			message: `${model.modelName} updated successfully`
		};
	} catch (error: any) {
		if (error.message.includes('immutable')) {
			const immutableError = errors.IMMUTABLE_FIELD_VIOLATION;
			return generateError(immutableError.message, immutableError.status);
		}
		// Error updating object
		return generateError(error.message, 500);
	}
}

/**
 * @swagger
 * components:
 *   schemas:
 *     WithValidation:
 *       description: Wrapper function that adds Zod validation to database operations
 *       type: object
 *       properties:
 *         validation:
 *           description: Validates request data against Zod schema
 *           type: boolean
 *         errorHandling:
 *           description: Handles validation errors and returns formatted error messages
 *           type: boolean
 *         modelExtraction:
 *           description: Extracts Mongoose model from schema metadata
 *           type: boolean
 */

/* withValidation
 * Wraps an operation function with validation
 * Validates the data against a Zod schema
 * Extracts the model from the schema's metadata
 * Calls the underlying operation function with the validated data and model
 */
// REVIEW: Can we validate the schema as a middleware after "auth".
export function withValidation(
	fn: Operation
): (
	req: AuthenticatedRequest,
	schema: z.ZodSchema<any>
) => Promise<OperationResult> {
	return async (req: AuthenticatedRequest, schema: z.ZodSchema<any>) => {
		try {
			// Try to validate data against our Zod schema
			const validatedData = schema.parse(req.body);

			// Extract the model from our schema's metadata
			const model = schema.meta()?.model as Model<Interface>;

			// Call the underlying operation function with the validated data and model
			return await fn(model, validatedData, req);
		} catch (error: any) {
			if (error instanceof z.ZodError) {
				const formattedErrors = error.issues
					.map(issue => {
						const field = issue.path.join('.');
						return `${field}: ${issue.message}`;
					})
					.join(', ');

				// Throw validation error
				return generateError(`Invalid input: ${formattedErrors}`, 400);
			}
			// Else throw a generic server error
			return generateError(error.message, 500);
		}
	};
}

// Export our underlying operation functions with the validation wrapper
export const create = withValidation(_create);
export const update = withValidation(_update);
export const read = withValidation(_read);

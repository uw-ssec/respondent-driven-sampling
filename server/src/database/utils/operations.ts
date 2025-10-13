import { z } from "zod";
import { CreateResult, ReadResult, Result, UpdateResult, generateError } from "./results";
import { Model } from "mongoose";
import { accessibleBy } from "@casl/mongoose";
import { AuthenticatedRequest } from "@/types/auth";
import { ISurvey } from "@/database/models/survey.model";

// Operation types
type Operation = typeof _create | typeof _update | typeof _read; // TODO: add other operations when implemented
type OperationResult = CreateResult | UpdateResult | ReadResult | Result;
type Interface = ISurvey; // TODO: add other interfaces when implemented (e.g. IUser)

async function _read(
    model: Model<Interface>, 
    data: Record<string, any>,
    req?: AuthenticatedRequest
): Promise<ReadResult | Result> {
    try {
        const result = await model.find({
            $and: [
                data,
                req?.params.objectId ? { _id: req.params.objectId } : {},
                req?.authorization ? accessibleBy(req.authorization).ofType(model.modelName) : {}
            ]
        });
        return {
            status: 200,
            data: result.map((item) => item.toObject()),
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
            message: `${model.modelName} created successfully`,
        } as CreateResult;
    } catch (error: any) {
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
            return generateError(`${model.modelName} objectId is required for update`, 400);
        }

        const result = await model.findByIdAndUpdate(objectId, data, { new: true });
        // Could not find objectId in database
        if (!result) {
            return generateError(`${model.modelName} not found`, 404);
        }

        // Successfully updated object
        return {
            status: 200,
            data: result.toObject(),
            message: `${model.modelName} updated successfully`,
        }
    } catch (error: any) {
        // Error updating object
        return generateError(error.message, 500);
    }
}

/* withValidation
  * Wraps an operation function with validation
 * Validates the data against a Zod schema
 * Extracts the model from the schema's metadata
 * Calls the underlying operation function with the validated data and model
*/
export function withValidation(
    fn: Operation,
): (req: AuthenticatedRequest, schema: z.ZodSchema<any>) => Promise<OperationResult> {
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
                return generateError('Validation error', 400);
            }
            throw error;
        }
    }
}

// Export our underlying operation functions with the validation wrapper
export const create = withValidation(_create);
export const update = withValidation(_update);
export const read = withValidation(_read);
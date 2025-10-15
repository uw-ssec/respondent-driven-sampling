import { z } from 'zod';
import { SiteLocation, GENERATED_SURVEY_CODES_LENGTH, SURVEY_CODE_LENGTH } from '../utils/constants';
import Survey from '@/database/models/survey.model';
import { Types } from 'mongoose';

/**
 * @swagger
 * components:
 *   schemas:
 *     SurveyValidation:
 *       description: Zod validation schemas for Survey operations
 *       properties:
 *         baseSchema:
 *           description: Base survey schema with all fields and validation rules
 *           type: object
 *         createSchema:
 *           description: Schema for creating new surveys (omits timestamps)
 *           type: object
 *         updateSchema:
 *           description: Schema for updating surveys (only mutable fields)
 *           type: object
 *         readSchema:
 *           description: Schema for reading surveys (all fields optional for filtering)
 *           type: object
 *         readByObjectIdSchema:
 *           description: Schema for reading a single survey by ObjectId
 *           type: object
 */

// Base field definitions - reusable across all survey schemas
export const surveyZodSchema = z.object({
    surveyCode: z.string()
        .length(SURVEY_CODE_LENGTH, `Survey code must be exactly ${SURVEY_CODE_LENGTH} characters`),
  
    parentSurveyCode: z.string()
        .length(SURVEY_CODE_LENGTH, `Referral survey code must be exactly ${SURVEY_CODE_LENGTH} characters`),
    
    childSurveyCodes: z.array(z.string().length(SURVEY_CODE_LENGTH, `Child survey code must be exactly ${SURVEY_CODE_LENGTH} characters`))
        .length(GENERATED_SURVEY_CODES_LENGTH, `Must have exactly ${GENERATED_SURVEY_CODES_LENGTH} generated survey codes`),
  
    createdByUserObjectId: z.string()
        .refine(Types.ObjectId.isValid, "Invalid user objectId"),
  
    responses: z.record(z.string(), z.any())
        .refine((data) => Object.keys(data).length > 0, {
        message: "Responses must contain at least one response"
    }),
  
    isCompleted: z.boolean().optional(), 
  
    coordinates: z.object({
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180)
    }).optional(),
  
    siteLocation: z.enum(SiteLocation),

    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
})
// Refinements across all fields
.refine((data) => data.parentSurveyCode !== data.surveyCode, {
    message: "Cannot use same survey code to refer to itself"
})


/**
 * @swagger
 * components:
 *   schemas:
 *     CreateSurveyRequest:
 *       description: Request body for creating a new survey
 *       type: object
 *       required:
 *         - surveyCode
 *         - parentSurveyCode
 *         - createdByUserObjectId
 *         - siteLocation
 *         - responses
 *       properties:
 *         surveyCode:
 *           type: string
 *           minLength: 6
 *           maxLength: 6
 *         parentSurveyCode:
 *           type: string
 *           minLength: 6
 *           maxLength: 6
 *         createdByUserObjectId:
 *           type: string
 *           pattern: "^[0-9a-fA-F]{24}$"
 *         siteLocation:
 *           type: string
 *           enum: [Location A, Location B, Location C]
 *         responses:
 *           type: object
 *         coordinates:
 *           type: object
 *           properties:
 *             latitude:
 *               type: number
 *               minimum: -90
 *               maximum: 90
 *             longitude:
 *               type: number
 *               minimum: -180
 *               maximum: 180
 *         isCompleted:
 *           type: boolean
 *           default: false
 */
// Create schema - all base fields included except for timestamps
export const createSurveySchema = surveyZodSchema
    .omit({ createdAt: true, updatedAt: true })
    .strict()
    .meta({ model: Survey });

/**
 * @swagger
 * components:
 *   schemas:
 *     UpdateSurveyRequest:
 *       description: Request body for updating an existing survey
 *       type: object
 *       properties:
 *         responses:
 *           type: object
 *           description: Updated survey responses
 *         isCompleted:
 *           type: boolean
 *           description: Survey completion status
 */
// Update schema - only updatable fields
export const updateSurveySchema = surveyZodSchema.pick({
    responses: true,
    isCompleted: true
}).meta({ model: Survey });

/**
 * @swagger
 * components:
 *   schemas:
 *     ReadSurveyByIdRequest:
 *       description: Request parameters for reading a survey by ObjectId
 *       type: object
 *       required:
 *         - _id
 *       properties:
 *         _id:
 *           type: string
 *           pattern: "^[0-9a-fA-F]{24}$"
 */
// Read schema by id - for fetching a single survey by objectId
export const readSurveyByObjectIdSchema = z.object({
  _id: z.string().refine(Types.ObjectId.isValid, "Invalid survey objectId"),
}).meta({ model: Survey });

/**
 * @swagger
 * components:
 *   schemas:
 *     ReadSurveysRequest:
 *       description: Request body for filtering surveys (all fields optional) -- does not include _id
 *       type: object
 *       properties:
 *         surveyCode:
 *           type: string
 *         parentSurveyCode:
 *           type: string
 *         createdByUserObjectId:
 *           type: string
 *           pattern: "^[0-9a-fA-F]{24}$"
 *         siteLocation:
 *           type: string
 *           enum: [Location A, Location B, Location C]
 *         isCompleted:
 *           type: boolean
 *         createdAt:
 *           type: string
 *           format: date-time
 */
// Read schema - for filtering to fetch one or more surveys by any field(s)
export const readSurveySchema = surveyZodSchema.partial().meta({ model: Survey });
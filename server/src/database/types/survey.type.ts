import { z } from 'zod';
import { SiteLocation, GENERATED_SURVEY_CODES_LENGTH, SURVEY_CODE_LENGTH } from '../utils/constants';
import Survey from '@/database/models/survey.model';
import { Types } from 'mongoose';

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


// Create schema - all base fields included except for timestamps
export const createSurveySchema = surveyZodSchema
    .omit({ createdAt: true, updatedAt: true })
    .strict()
    .meta({ model: Survey });

// Update schema - only updatable fields
export const updateSurveySchema = surveyZodSchema.pick({
    responses: true,
    isCompleted: true
}).meta({ model: Survey });

// Read schema by id - for fetching a single survey by objectId
export const readSurveyByObjectIdSchema = z.object({
  _id: z.string().refine(Types.ObjectId.isValid, "Invalid survey objectId"),
}).meta({ model: Survey });

// Read schema - for filtering to fetch one or more surveys by any field(s)
export const readSurveySchema = surveyZodSchema.partial().meta({ model: Survey });
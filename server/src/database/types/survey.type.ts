import { z } from 'zod';
import { SiteLocation, GENERATED_SURVEY_CODES_LENGTH, SURVEY_CODE_LENGTH, SYSTEM_SURVEY_CODE } from '../utils/constants';
import Survey from '@/database/models/survey.model';
import { Types } from 'mongoose';

// Base field definitions - reusable across all survey schemas
const baseFields = {
    surveyCode: z.string()
        .length(SURVEY_CODE_LENGTH, `Survey code must be exactly ${SURVEY_CODE_LENGTH} characters`),
  
    referredBySurveyCode: z.string()
        .length(SURVEY_CODE_LENGTH, `Referral survey code must be exactly ${SURVEY_CODE_LENGTH} characters`)
        .default(SYSTEM_SURVEY_CODE),
  
    createdByUserObjectId: z.string()
        .refine(Types.ObjectId.isValid, "Invalid user objectId"),
  
    responses: z.record(z.string(), z.any())
        .refine((data) => Object.keys(data).length > 0, {
        message: "Responses must contain at least one response"
    }),
  
    isCompleted: z.boolean().optional().default(false),
  
    coordinates: z.object({
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180)
    }).optional(),
  
    siteLocation: z.enum(SiteLocation),
  
    generatedSurveyCodes: z.array(z.object({
        code: z.string().length(SURVEY_CODE_LENGTH, `Generated code must be exactly ${SURVEY_CODE_LENGTH} characters`),
        usedBySurveyObjectId: z.null()
            .or(z.string()
                .refine(Types.ObjectId.isValid, "Invalid survey objectId")
            )
    })).length(GENERATED_SURVEY_CODES_LENGTH, `Must have exactly ${GENERATED_SURVEY_CODES_LENGTH} generated survey codes`)
};

// Create schema - all base fields included
export const createSurveySchema = z.object(baseFields).meta({ model: Survey });

// Update schema - only updatable fields
export const updateSurveySchema = z.object(baseFields).pick({
    responses: true,
    isCompleted: true
}).meta({ model: Survey });

// Read schemas - for filtering
export const readSurveySchema = z.object({
  _id: z.string().refine(Types.ObjectId.isValid, "Invalid survey objectId"),
}).meta({ model: Survey });

export const readSurveysSchema = z.object({
  createdByUserObjectId: z.string()
    .refine(Types.ObjectId.isValid, "Invalid user objectId")
    .optional(),
  siteLocation: z.enum(SiteLocation).optional(),
  isCompleted: z.boolean().optional(),
  referredBySurveyCode: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
}).meta({ model: Survey });
// TODO: Implement Survey repository

import { create, read, update } from "../utils/operations";
import { createSurveySchema, updateSurveySchema, readSurveySchema, readSurveysSchema } from "../types/survey.type";
import { Response } from "express";
import generateReferralCode from "@/utils/generateReferralCode";
import { AuthenticatedRequest } from "@/types/auth";
import { errors } from "../utils/error";

export async function createSurvey(req: AuthenticatedRequest, res: Response) {
    const maxRetries = 3;
    let attempts = 0;
    
    while (attempts < maxRetries) {
        // Generate new codes for each attempt
        req.body.childSurveyCodes = Array.from({ length: 3 }, () => generateReferralCode());
        
        // Attempt to create the survey
        const result = await create(req, createSurveySchema);
        
        // Successful!
        if (result.status === 201) {
            return res.status(result.status).json(result);
        }
        
        // If it's a survey code uniqueness error that can be fixed by re-generating, retry
        if (result.message?.includes(errors.CHILD_SURVEY_CODES_NOT_UNIQUE.message)) {
            attempts++;
            continue;
        }
        else {
            // For other errors, return immediately
            return res.status(result.status).json(result);
        }
    }
    
    // Failed to generate unique codes after retries
    return res.status(500).json({ message: `Failed to generate unique codes after ${maxRetries} retries` });
}

export async function updateSurvey(req: AuthenticatedRequest, res: Response) {
    // Insert any request manipulation here

    const result = await update(req, updateSurveySchema);
    res.status(result.status).json(result);
}

export async function getSurvey(req: AuthenticatedRequest, res: Response) {
    // Insert any request manipulation here

    const result = await read(req, readSurveySchema);
    res.status(result.status).json(result);
}

export async function getSurveys(req: AuthenticatedRequest, res: Response) {
    // Insert any request manipulation here

    const result = await read(req, readSurveysSchema);
    res.status(result.status).json(result);
}
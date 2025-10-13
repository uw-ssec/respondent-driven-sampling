// TODO: Implement Survey repository

import { create, read, update } from "../utils/operations";
import { createSurveySchema, updateSurveySchema, readSurveySchema, readSurveysSchema } from "../types/survey.type";
import { Response } from "express";
import generateReferralCode from "@/utils/generateReferralCode";
import { AuthenticatedRequest } from "@/types/auth";

export async function createSurvey(req: AuthenticatedRequest, res: Response) {
    // Generate 3 unique survey codes for the survey and add to request body
    req.body.generatedSurveyCodes = Array.from({ length: 3 }, () => ({
        code: generateReferralCode(),
        usedBySurveyObjectId: null
    }));

    const result = await create(req, createSurveySchema);
    res.status(result.status).json(result);
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
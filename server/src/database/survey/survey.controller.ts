import { Response } from "express";
import { AuthenticatedRequest } from "@/types/auth";
import { resolveParentSurveyCode, generateChildSurveyCodes, handleCollision } from "./survey.utils";
import Survey from "./mongoose/survey.model";
import { accessibleBy } from "@casl/mongoose";

export async function createSurvey(req: AuthenticatedRequest, res: Response) {
    const MAX_RETRIES = 3;
    let attempts = 0;

    // Generate child survey codes
    req.body.childSurveyCodes = generateChildSurveyCodes();

    // Resolve parent survey code
    const parentResolved = await resolveParentSurveyCode(req);
    if (parentResolved !== null) {
        return res.status(parentResolved.status).json(parentResolved);
    }
    
    while (attempts < MAX_RETRIES) {

        try {
            // Attempt to create the survey
            const result = await Survey.create(req.body);

            // Successful!
            return res.status(201).json({ message: "Survey created successfully", data: result.toObject() });
        } catch (error: any) {
            const handledCollision = handleCollision(req, error.message);

            if (handledCollision) { // If collision was handled, retry
                attempts++;
                continue;
            }
            else { // System error, don't retry
                return res.status(500).json({ message: error.message });
            }
        }
    }
    
    // Failed to generate unique codes after retries
    return res.status(500).json({ message: `Failed to generate unique codes after ${MAX_RETRIES} retries` });
}

export async function updateSurvey(req: AuthenticatedRequest, res: Response) {
    const result = await Survey.findOneAndUpdate(
        { _id: req.params.objectId, deletedAt: null },
        req.body, 
        { new: true }
    );
    if (!result) {
        return res.status(404).json({ message: "Survey not found" });
    }
    return res.status(200).json({ message: "Survey updated successfully", data: result.toObject() });
}

export async function getSurvey(req: AuthenticatedRequest, res: Response) {
    try {
        const result = await Survey.findOne({ _id: req.params.objectId, deletedAt: null });

        // Survey not found
        if (!result) {
            return res.status(404).json({ message: "Survey not found" });
        }

        // Successfully fetched survey
        return res.status(200).json({ message: "Survey fetched successfully", data: result.toObject() });
    } catch (error: any) {
        // System error
        return res.status(500).json({ message: error.message });
    }
}

export async function getSurveys(req: AuthenticatedRequest, res: Response) {
    try {
        const result = await Survey.find({
            $and: [
                req.query,
                req?.authorization ? accessibleBy(req.authorization).ofType(Survey.modelName) : {},
                { deletedAt: null }
            ]
        });

        // Successfully fetched surveys 
        return res.status(200).json({ message: "Surveys fetched successfully", data: result.map((item) => item.toObject()) });
    } catch (error: any) {
        // System error
        return res.status(500).json({ message: error.message });
    }
}

export async function deleteSurvey(req: AuthenticatedRequest, res: Response) {
    // TODO: Delete specific fields within survey document as well
    const result = await Survey.findByIdAndUpdate(
        req.params.objectId,
        { deletedAt: new Date() },
        { new: true }
    );
    if (!result) {
        return res.status(404).json({ message: "Survey not found" });
    }
    return res.status(200).json({ message: "Survey deleted successfully", data: result.toObject() });
}
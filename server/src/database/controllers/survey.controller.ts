// TODO: Implement Survey repository

import { create, read, update } from "../utils/operations";
import { createSurveySchema, updateSurveySchema, readSurveySchema, readSurveyByObjectIdSchema } from "../types/survey.type";
import { Response } from "express";
import { AuthenticatedRequest } from "@/types/auth";
import { resolveParentSurveyCode, handledCollision, generateChildSurveyCodes } from "../utils/survey.utils";

/**
 * @swagger
 * components:
 *   schemas:
 *     CreateSurveyResponse:
 *       description: Response after successfully creating a survey
 *       type: object
 *       properties:
 *         status:
 *           type: integer
 *           example: 201
 *         data:
 *           $ref: '#/components/schemas/Survey'
 *         message:
 *           type: string
 *           example: "Survey created successfully"
 *     CreateSurveyError:
 *       description: Error response when survey creation fails
 *       type: object
 *       properties:
 *         status:
 *           type: integer
 *           example: 400
 *         message:
 *           type: string
 *           example: "Invalid input: surveyCode: Survey code must be exactly 6 characters"
 *     UpdateSurveyResponse:
 *       description: Response after successfully updating a survey
 *       type: object
 *       properties:
 *         status:
 *           type: integer
 *           example: 200
 *         data:
 *           $ref: '#/components/schemas/Survey'
 *         message:
 *           type: string
 *           example: "Survey updated successfully"
 *     ReadSurveyResponse:
 *       description: Response after successfully reading surveys
 *       type: object
 *       properties:
 *         status:
 *           type: integer
 *           example: 200
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Survey'
 */

/**
 * @swagger
 * /api/v2/surveys:
 *   put:
 *     summary: Create a new survey
 *     description: Creates a new survey with auto-generated child survey codes and retry logic for uniqueness
 *     tags: [Surveys]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateSurveyRequest'
 *     responses:
 *       201:
 *         description: Survey created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CreateSurveyResponse'
 *       400:
 *         description: Validation error or invalid input
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CreateSurveyError'
 *       403:
 *         description: Insufficient permissions
 *       500:
 *         description: Server error or failed to generate unique codes after retries
 */
export async function createSurvey(req: AuthenticatedRequest, res: Response) {
    const maxRetries = 3;
    let attempts = 0;

    // Generate child survey codes
    req.body.childSurveyCodes = generateChildSurveyCodes();

    // Resolve parent survey code
    const parentResolved = await resolveParentSurveyCode(req, res);
    if (parentResolved !== null) { // If parent is not resolved, we get an error response
        return res.status(parentResolved.status).json(parentResolved);
    }
    
    while (attempts < maxRetries) {
        // Attempt to create the survey
        const result = await create(req, createSurveySchema);
        
        // Successful!
        if (result.status === 201) {
            return res.status(result.status).json(result);
        }

        // If it's a survey code uniqueness error that can be fixed by re-generating, retry
        if (handledCollision(req, result.message)) {
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


/**
 * @swagger
 * /api/v2/surveys/{objectId}:
 *   post:
 *     summary: Update an existing survey
 *     description: Updates a survey's responses and completion status
 *     tags: [Surveys]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: objectId
 *         required: true
 *         schema:
 *           type: string
 *           pattern: "^[0-9a-fA-F]{24}$"
 *         description: MongoDB ObjectId of the survey to update
 *         example: "507f1f77bcf86cd799439011"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateSurveyRequest'
 *     responses:
 *       200:
 *         description: Survey updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UpdateSurveyResponse'
 *       400:
 *         description: Validation error or immutable field violation
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: Survey not found
 *       500:
 *         description: Server error
 */
export async function updateSurvey(req: AuthenticatedRequest, res: Response) {
    // Insert any request manipulation here

    const result = await update(req, updateSurveySchema);
    res.status(result.status).json(result);
}

/**
 * @swagger
 * /api/v2/surveys/{objectId}:
 *   get:
 *     summary: Get a survey by ID
 *     description: Retrieves a single survey by its ObjectId
 *     tags: [Surveys]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: objectId
 *         required: true
 *         schema:
 *           type: string
 *           pattern: "^[0-9a-fA-F]{24}$"
 *         description: MongoDB ObjectId of the survey to retrieve
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Survey retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ReadSurveyResponse'
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: Survey not found
 *       500:
 *         description: Server error
 */
export async function getSurvey(req: AuthenticatedRequest, res: Response) {
    // Insert any request manipulation here

    const result = await read(req, readSurveyByObjectIdSchema);
    res.status(result.status).json(result);
}

/**
 * @swagger
 * /api/v2/surveys:
 *   get:
 *     summary: Get surveys with optional filtering
 *     description: Retrieves surveys with optional filtering by any field
 *     tags: [Surveys]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ReadSurveysRequest'
 *     responses:
 *       200:
 *         description: Surveys retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ReadSurveyResponse'
 *       403:
 *         description: Insufficient permissions
 *       500:
 *         description: Server error
 */
export async function getSurveys(req: AuthenticatedRequest, res: Response) {
    // Insert any request manipulation here

    const result = await read(req, readSurveySchema);
    res.status(result.status).json(result);
}
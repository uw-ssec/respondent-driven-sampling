import { NextFunction, Response } from 'express';
import { z } from 'zod';

import { AuthenticatedRequest } from '@/types/auth';

export function validate(
	schema: z.ZodSchema<any>
): (req: AuthenticatedRequest, res: Response, next: NextFunction) => void {
	return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
		try {
			const validatedData = schema.parse(req.body);
			req.body = validatedData;
			next();
		} catch (error) {
			if (error instanceof z.ZodError) {
				res.status(400).json({
					code: 'VALIDATION_ERROR',
					message: 'Invalid request body',
					status: 400,
					errors: error.issues
				});
				return;
			}
			res.status(500).json({
				code: 'INTERNAL_SERVER_ERROR',
				message: 'Could not validate request body'
			});
			return;
		}
	};
}

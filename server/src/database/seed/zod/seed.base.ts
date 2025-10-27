import { Types } from 'mongoose';
import { z } from 'zod';

import { SURVEY_CODE_LENGTH } from '../../utils/constants';
import Seed from '../mongoose/seed.model';

export const baseSeedSchema = z
	.object({
		surveyCode: z
			.string()
			.length(
				SURVEY_CODE_LENGTH,
				`Survey code must be exactly ${SURVEY_CODE_LENGTH} characters`
			),
		locationObjectId: z
			.string()
			.refine(Types.ObjectId.isValid, 'Invalid location objectId'),
		isFallback: z.boolean().optional().default(false) // Assume false unless otherwise specified
	})
	.meta({ model: Seed });

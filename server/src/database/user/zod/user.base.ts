import { Types } from 'mongoose';
import { z } from 'zod';

import { ApprovalStatus } from '@/database/utils/constants';
import {
	ACTION_ENUM,
	CONDITION_ENUM,
	ROLE_ENUM,
	SUBJECT_ENUM
} from '@/permissions/constants';

export const baseUserSchema = z
	.object({
		firstName: z.string().min(1, 'First name is required'),
		lastName: z.string().min(1, 'Last name is required'),
		email: z.email(),
		phone: z
			.string()
			.length(10, 'Phone number must be exactly 10 digits')
			.regex(/^\d+$/, 'Phone number must contain only digits'),
		role: z.enum(ROLE_ENUM),
		approvalStatus: z.enum(ApprovalStatus),
		approvedByUserObjectId: z
			.string()
			.refine(Types.ObjectId.isValid, 'Invalid user objectId'),
		locationObjectId: z
			.string()
			.refine(Types.ObjectId.isValid, 'Invalid location objectId'),
		permissions: z.array(
			z.object({
				action: z.enum(ACTION_ENUM),
				subject: z.enum(SUBJECT_ENUM),
				condition: z.enum(CONDITION_ENUM).optional() // Mongoose handles default, which is empty array
			})
		)
	})
	.strict();

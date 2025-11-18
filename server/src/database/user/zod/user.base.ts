import { Types } from 'mongoose';
import { z } from 'zod';

import { ApprovalStatus } from '@/database/utils/constants';
import { ROLE_ENUM } from '@/permissions/constants';

export const baseUserSchema = z
	.object({
		firstName: z.string().min(1, 'First name is required'),
		lastName: z.string().min(1, 'Last name is required'),
		email: z.email({ message: 'Please provide a valid email address' }),
		phone: z
			.string()
			.regex(
				/^\+1\d{10}$/,
				'Please provide a valid 10-digit phone number with country code (+1XXXXXXXXXX)'
			),
		role: z.enum(ROLE_ENUM, {
			message: 'Please provide a valid role'
		}),
		approvalStatus: z.enum(ApprovalStatus, {
			message: 'Invalid approval status'
		}),
		approvedByUserObjectId: z
			.string()
			.refine(Types.ObjectId.isValid, 'Please provide a valid user ID'),
		locationObjectId: z
			.string()
			.refine(Types.ObjectId.isValid, 'Please provide a valid location')
	})
	.strict();

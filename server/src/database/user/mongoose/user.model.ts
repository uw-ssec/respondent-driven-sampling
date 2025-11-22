// TODO: Implement User mongoose model

import mongoose, { InferSchemaType, Model, Schema, Types } from 'mongoose';

import { injectUserHooks } from '@/database/user/mongoose/user.hooks';
import { ApprovalStatus } from '@/database/utils/constants';
import {
	ACTION_ENUM,
	CONDITION_ENUM,
	ROLE_ENUM,
	SUBJECT_ENUM
} from '@/permissions/constants';

const userSchema = new Schema(
	{
		firstName: { type: String, required: true },
		lastName: { type: String, required: true },
		email: { type: String, required: true, unique: true },
		phone: { type: String, required: true, unique: true },
		role: { type: String, enum: ROLE_ENUM, required: true },
		approvalStatus: {
			type: String,
			enum: ApprovalStatus,
			default: ApprovalStatus.PENDING,
			required: true
		},
		approvedByUserObjectId: {
			type: Types.ObjectId,
			ref: 'User',
			default: null
		},
		locationObjectId: {
			// location at time of creation
			type: Types.ObjectId,
			ref: 'Location',
			required: true
		},
		// EXAMPLE OF PERMISSIONS ARRAY: [
		//   { action: 'CREATE', subject: 'SURVEY', conditions: ['IS_CREATED_BY_SELF'] },
		//   { action: 'READ', subject: 'USER', conditions: ['HAS_SAME_LOCATION'] }
		// ]
		// Refer to permissions/constants.ts for the possible values of action, subject, and conditions
		// If we want to support complex field permissions OR revoking permissions (can vs. cannot), we will need to update this array
		// with more fields and update applyCustomPermissions in permissions/abilityBuilder.ts
		permissions: [
			{
				action: { type: String, enum: ACTION_ENUM, required: true },
				subject: { type: String, enum: SUBJECT_ENUM, required: true },
				conditions: {
					type: [String],
					enum: CONDITION_ENUM,
					required: true,
					default: []
				}
			}
		],
		deletedAt: { type: Date, default: null, select: false }
	},
	{ timestamps: true, strict: 'throw' }
);

injectUserHooks(userSchema);

export type IUser = InferSchemaType<typeof userSchema>;
const User: Model<IUser> = mongoose.model<IUser>('User', userSchema);
export default User;

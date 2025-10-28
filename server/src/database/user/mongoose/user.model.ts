// TODO: Implement User mongoose model

import mongoose, { InferSchemaType, Model, Schema, Types } from 'mongoose';

import { injectUserHooks } from '@/database/user/mongoose/user.hooks';
import { ApprovalStatus, Role } from '@/database/utils/constants';
import {
	ACTION_ENUM,
	CONDITION_ENUM,
	SUBJECT_ENUM
} from '@/permissions/constants';

const userSchema = new Schema(
	{
		firstName: { type: String, required: true },
		lastName: { type: String, required: true },
		email: { type: String, required: true, unique: true },
		phone: { type: String, required: true, unique: true },
		role: { type: String, enum: Role, required: true },
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
		// NOTE: could supplement this with a `fields` field that declares
		// which fields fall under the perview of the permission. e.g. "read:survey:firstname"
		// This would add complexity but allow for more granular dynamic permissions management.
		// Also consider adding a `can` boolean field that indicates awarding or revoking the given permission.
		permissions: [
			{
				action: { type: String, enum: ACTION_ENUM, required: true },
				subject: { type: String, enum: SUBJECT_ENUM, required: true },
				condition: { type: String, enum: CONDITION_ENUM }
			}
		],
		default: [],
		deletedAt: { type: Date, default: null, select: false }
	},
	{ timestamps: true, strict: 'throw' }
);

injectUserHooks(userSchema);

export type IUser = InferSchemaType<typeof userSchema>;
const User: Model<IUser> = mongoose.model<IUser>('User', userSchema);
export default User;

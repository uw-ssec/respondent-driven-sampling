// TODO: Implement User mongoose model

import mongoose, { InferSchemaType, Model, Schema, Types } from 'mongoose';

import { ApprovalStatus, Role } from '@/database/utils/constants';
import {
	ACTION_ENUM,
	CONDITION_ENUM,
	SUBJECT_ENUM
} from '@/utils/roleDefinitions';

const userSchema = new Schema(
	{
		firstName: { type: String, required: true },
		lastName: { type: String, required: true },
		email: { type: String, required: true, unique: true },
		phone: { type: String, required: true, unique: true },
		role: { type: String, enum: Role, required: true },
		approval: {
			type: {
				status: {
					type: String,
					enum: ApprovalStatus,
					default: ApprovalStatus.PENDING
				},
				approvedByUserObjectId: {
					type: Types.ObjectId,
					ref: 'User',
					required: true
				}
			},
			required: true
		},
		locationObjectId: {
			type: Types.ObjectId,
			ref: 'Location',
			required: true,
			immutable: true
		}, // location at time of creation
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

export type IUser = InferSchemaType<typeof userSchema>;
const User: Model<IUser> = mongoose.model<IUser>('User', userSchema);
export default User;

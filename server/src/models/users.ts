import mongoose, { Model, Schema } from 'mongoose';

import { IUser, IPermission } from '@/types/models';
import { ACTION_ENUM, RESOURCE_ENUM, SCOPE_ENUM } from '@/utils/roleBasedAccess';

// Permission schema definition
// This schema defines the structure of the permission data assigned to a user for a single operation.
// It includes fields for action, resource, and scope.
// These permissions are used in addition to the default permissions for each role
const permissionSchema = new Schema<IPermission>({
	action: { type: String, enum: ACTION_ENUM, required: true },
	resource: { type: String, enum: RESOURCE_ENUM, required: true },
	scope: { type: String, enum: SCOPE_ENUM, required: true }
});

// User schema definition
// This schema defines the structure of the user data in the MongoDB database.
// It includes fields for employee ID, first name, last name, email, phone number,
const userSchema = new Schema<IUser>(
	{
		employeeId: {
			type: String,
			unique: true,
			default: function (): string {
				return `EMP${Math.floor(1000 + Math.random() * 9000)}`;
			}
		},
		firstName: { type: String, required: true },
		lastName: { type: String, required: true },
		email: { type: String, required: true, unique: true },
		phone: { type: String, required: true },
		role: {
			type: String,
			enum: ['Volunteer', 'Manager', 'Admin'] as const,
			required: true
		},
		approvalStatus: {
			type: String,
			enum: ['Pending', 'Approved', 'Rejected'] as const,
			default: 'Pending'
		},
		permissions: {
			type: [permissionSchema],
			default: []
		}
	},
	{ timestamps: true }
);

const User: Model<IUser> = mongoose.model<IUser>('User', userSchema);
export default User;

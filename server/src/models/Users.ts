import mongoose, { Model, Schema } from 'mongoose';
import { IUser } from '../types/models';

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
		}
	},
	{ timestamps: true }
);

const User: Model<IUser> = mongoose.model<IUser>('User', userSchema);
export default User;

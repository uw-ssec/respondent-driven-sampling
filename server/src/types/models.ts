import { Document, Types } from 'mongoose';
import { Action, Subject, Condition } from '@/utils/roleDefinitions';

export interface IReferralCode {
	// QR code that will be distributed to participants, and will be used to create child surveys
	code: string;
	// usedBySurvey: ObjectId of child survey document that used this referral code
	usedBySurvey: Types.ObjectId | null;
	// Date the survey was used at
	usedAt: Date | null;
}

export interface ISurvey extends Document {
	// Employee ID in the user document who created this survey
	employeeId: string;
	employeeName: string;
	// All survey responses stored as key-value pairs
	// Keys are question IDs, values are the responses
	responses: Record<string, any>;
	// Date the survey was created
	createdAt: Date;
	// Date the survey was last updated
	lastUpdated: Date;
	// Array of 3 referral codes associated with this survey
	referralCodes: IReferralCode[];
	// The code that referred this survey; null indicates it is a "root" survey
	referredByCode: string | null;
	// Optional geolocation coordinates where the survey was filled out
	coords?: {
		latitude: number;
		longitude: number;
	};
	// Whether the survey is marked as completed. All surveys start as false or incomplete.
	completed?: boolean;
}

export interface IUser extends Document {
	employeeId: string;
	firstName: string;
	lastName: string;
	email: string;
	phone: string;
	role: 'Admin' | 'Manager' | 'Volunteer';
	approvalStatus: 'Pending' | 'Approved' | 'Rejected';
	createdAt: Date;
	updatedAt: Date;
	permissions: IPermission[];
}

export interface IPermission {
	action: Action;
	subject: Subject;
	condition?: Condition;
}

import { Document, Types } from 'mongoose';

export interface IReferralCode {
	code: string;
	usedBySurvey: Types.ObjectId | null;
	usedAt: Date | null;
}

export interface ISurvey extends Document {
	employeeId: string;
	employeeName: string;
	responses: Record<string, any>;
	createdAt: Date;
	lastUpdated: Date;
	inProgress?: boolean;
	referralCodes: IReferralCode[];
	referredByCode: string | null;
	coords?: {
		latitude: number;
		longitude: number;
	};
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
}

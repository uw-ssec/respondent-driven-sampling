import { ReferralCode } from '@/types/ReferralCode';

export interface Survey {
	referralCodes: ReferralCode[];
	responses: Object;
	_id: string;
	employeeId: string;
	employeeName: string;
	createdAt: string;
	referredByCode?: string;
}

// import { ReferralCode } from '@/types/ReferralCode';

// export interface Survey {
// 	referralCodes: ReferralCode[];
// 	responses: Object;
// 	_id: string;
// 	employeeId: string;
// 	employeeName: string;
// 	createdAt: string;
// 	referredByCode?: string;
// }

import { ISurvey } from '@/database/survey/mongoose/survey.model';

export interface SurveyDocument extends ISurvey {
	_id: string;
	employeeId: string;
	employeeName: string;
	locationName: string;
}

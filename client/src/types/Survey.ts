import { ISurvey } from '@/database/survey/mongoose/survey.model';

export interface SurveyDocument extends ISurvey {
	_id: string;
	employeeId: string;
	employeeName: string;
	locationName: string;
}

import { create } from 'zustand';
import { combine, persist } from 'zustand/middleware';

type SurveyState = {
	employeeId: string;
	employeeName: string;
	userObjectId: string;
	surveyData: {
		objectId?: string | null;
		parentSurveyCode?: string | null;
		responses?: any;
		[key: string]: any;
		childSurveyCodes?: string[];
	} | null;
};

type SurveyActions = {
	setEmployeeId: (id: string) => void;
	setEmployeeName: (name: string) => void;
	setSurveyData: (data: any | null) => void;
	setParentSurveyCode: (code: string | null) => void; // Helper to set parentSurveyCode within surveyData
	getParentSurveyCode: () => string | null; // Helper to get parentSurveyCode from surveyData
	setObjectId: (id: string | null) => void; // Helper to set objectId within surveyData
	getObjectId: () => string | null; // Helper to get objectId from surveyData
	setSurveyCode: (code: string | null) => void; // Helper to set surveyCode within surveyData
	getSurveyCode: () => string | null; // Helper to get surveyCode from surveyData
	setChildSurveyCodes: (codes: string[]) => void; // Helper to set childSurveyCodes within surveyData
	clearSession: () => void; // Clear all survey data (for logout)
	clearSurvey: () => void; // Clear survey-specific data (for navigating away from survey)
};

export const useSurveyStore = create(
	persist(
		combine<SurveyState, SurveyActions>(
			{
				employeeId: '',
				employeeName: '',
				surveyData: null,
				userObjectId: ''
			},
			(set, get) => ({
				setUserObjectId: (userObjectId: string) =>
					set({ userObjectId }),
				getUserObjectId: () => get().userObjectId,
				setEmployeeId: (employeeId: string) => set({ employeeId }),
				setEmployeeName: (employeeName: string) =>
					set({ employeeName }),
				setSurveyData: (surveyData: any | null) => set({ surveyData }),
				setParentSurveyCode: (parentSurveyCode: string | null) => {
					const currentData = get().surveyData || {};
					set({ surveyData: { ...currentData, parentSurveyCode } });
				},
				setSurveyCode: (surveyCode: string | null) => {
					const currentData = get().surveyData || {};
					set({ surveyData: { ...currentData, surveyCode } });
				},
				getSurveyCode: () => get().surveyData?.surveyCode || null,
				getParentSurveyCode: () =>
					get().surveyData?.parentSurveyCode || null,
				setObjectId: (objectId: string | null) => {
					const currentData = get().surveyData || {};
					set({ surveyData: { ...currentData, objectId } });
				},
				getObjectId: () => get().surveyData?.objectId || null,
				setChildSurveyCodes: (childSurveyCodes: string[]) => {
					const currentData = get().surveyData || {};
					set({ surveyData: { ...currentData, childSurveyCodes } });
				},
				clearSession: () => {
					set({ employeeId: '', employeeName: '', surveyData: null });
					useSurveyStore.persist.clearStorage();
				},
				clearSurvey: () => {
					set({ surveyData: null });
				}
			})
		),
		{ name: 'survey-storage' }
	)
);

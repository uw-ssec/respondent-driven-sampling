import { create } from 'zustand';
import { combine, persist } from 'zustand/middleware';

type SurveyState = {
	userObjectId: string;
	surveyData: {
		objectId?: string | null;
		parentSurveyCode?: string | null;
		responses?: any;
		childSurveyCodes?: string[];
		surveyCode?: string | null;
	} | null;
};

type SurveyActions = {
	setUserObjectId: (userObjectId: string) => void;
	getUserObjectId: () => string;
	setSurveyData: (data: any | null) => void;
	setParentSurveyCode: (code: string | null) => void;
	getParentSurveyCode: () => string | null;
	setObjectId: (id: string | null) => void;
	getObjectId: () => string | null;
	setSurveyCode: (code: string | null) => void;
	getSurveyCode: () => string | null;
	setChildSurveyCodes: (codes: string[]) => void;
	clearSession: () => void;
	clearSurvey: () => void;
};

export const useSurveyStore = create(
	persist(
		combine<SurveyState, SurveyActions>(
			{
				surveyData: null,
				userObjectId: ''
			},
			(set, get) => ({
				setUserObjectId: (userObjectId: string) =>
					set({ userObjectId }),
				getUserObjectId: () => get().userObjectId,
				setSurveyData: (surveyData: any | null) => set({ surveyData }),
				setParentSurveyCode: (parentSurveyCode: string | null) => {
					const currentData = get().surveyData ?? {};
					set({ surveyData: { ...currentData, parentSurveyCode } });
				},
				setSurveyCode: (surveyCode: string | null) => {
					const currentData = get().surveyData ?? {};
					set({ surveyData: { ...currentData, surveyCode } });
				},
				getSurveyCode: () => get().surveyData?.surveyCode || null,
				getParentSurveyCode: () =>
					get().surveyData?.parentSurveyCode ?? null,
				setObjectId: (objectId: string | null) => {
					const currentData = get().surveyData ?? {};
					set({ surveyData: { ...currentData, objectId } });
				},
				getObjectId: () => get().surveyData?.objectId ?? null,
				setChildSurveyCodes: (childSurveyCodes: string[]) => {
					const currentData = get().surveyData ?? {};
					set({ surveyData: { ...currentData, childSurveyCodes } });
				},
				clearSession: () => {
					set({ userObjectId: '', surveyData: null });
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

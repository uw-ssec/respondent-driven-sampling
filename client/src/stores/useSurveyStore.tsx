import { create } from 'zustand';
import { persist, combine } from 'zustand/middleware';

type SurveyState = {
    employeeId: string;
    employeeName: string;
    surveyData: {
        objectId?: string | null;
        referredByCode?: string | null;
        responses?: any;
        [key: string]: any;
    } | null;
};

type SurveyActions = {
    setEmployeeId: (id: string) => void;
    setEmployeeName: (name: string) => void;
    setSurveyData: (data: any | null) => void;
    setReferredByCode: (code: string | null) => void; // Helper to set referredByCode within surveyData
    getReferredByCode: () => string | null; // Helper to get referredByCode from surveyData
    setObjectId: (id: string | null) => void; // Helper to set objectId within surveyData
    getObjectId: () => string | null; // Helper to get objectId from surveyData
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
            },
            (set, get) => ({
                setEmployeeId: (employeeId : string) => set({ employeeId }),
                setEmployeeName: (employeeName : string) => set({ employeeName }),
                setSurveyData: (surveyData : any | null) => set({ surveyData }),
                setReferredByCode: (referredByCode : string | null) => {
                    const currentData = get().surveyData || {};
                    set({ surveyData: { ...currentData, referredByCode } });
                },
                getReferredByCode: () => get().surveyData?.referredByCode || null,
                setObjectId: (objectId : string | null) => {
                    const currentData = get().surveyData || {};
                    set({ surveyData: { ...currentData, objectId } });
                },
                getObjectId: () => get().surveyData?.objectId || null,
                clearSession: () => {
                    set({ employeeId: '', employeeName: '', surveyData: null }); 
                    useSurveyStore.persist.clearStorage()
                },
                clearSurvey: () => {
                    set({ surveyData: null }); 
                }
            })
        ),
        { name: 'survey-storage' }
    )
);
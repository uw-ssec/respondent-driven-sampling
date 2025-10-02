import { create } from 'zustand';
import { persist, combine } from 'zustand/middleware';

type SurveyState = {
    employeeId: string;
    employeeName: string;
    referredByCode: string | null;
    objectId: string | null;
};

type SurveyActions = {
    setEmployeeId: (id: string) => void;
    setEmployeeName: (name: string) => void;
    setReferredByCode: (code: string | null) => void;
    setObjectId: (id: string | null) => void;
    clearSession: () => void; // Clear all survey data (for logout)
    clearSurvey: () => void; // Clear survey-specific data (for navigating away from survey)
};

export const useSurveyStore = create(
    persist(
        combine<SurveyState, SurveyActions>(
            {
                employeeId: '',
                employeeName: '',
                referredByCode: null,   
                objectId: null,
            },
            (set) => ({
                setEmployeeId: (employeeId : string) => set({ employeeId }),
                setEmployeeName: (employeeName : string) => set({ employeeName }),
                setReferredByCode: (referredByCode : string | null) => set({ referredByCode }),
                setObjectId: (objectId : string | null) => set({ objectId }),
                clearSession: () => {
                    set({ employeeId: '', employeeName: '', referredByCode: null, objectId: null }); 
                    useSurveyStore.persist.clearStorage()
                },
                clearSurvey: () => {
                    set({ referredByCode: null, objectId: null }); 
                }
            })
        ),
        { name: 'survey-storage' }
    )
);
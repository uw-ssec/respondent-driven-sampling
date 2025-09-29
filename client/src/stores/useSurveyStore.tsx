import { create } from 'zustand';
import { persist, combine } from 'zustand/middleware';

type SurveyState = {
    employeeId: string;
    employeeName: string;
    referredByCode: string | null;
};

type SurveyActions = {
    setEmployeeId: (id: string) => void;
    setEmployeeName: (name: string) => void;
    setReferredByCode: (code: string | null) => void;
    clearSession: () => void;
};

export const useSurveyStore = create(
    persist(
        combine<SurveyState, SurveyActions>(
            {
                employeeId: '',
                employeeName: '',
                referredByCode: null
            },
            (set) => ({
                setEmployeeId: (employeeId : string) => set({ employeeId }),
                setEmployeeName: (employeeName : string) => set({ employeeName }),
                setReferredByCode: (referredByCode : string | null) => set({ referredByCode }),
                clearSession: () => {
                    set({ employeeId: '', employeeName: '', referredByCode: null }); 
                    useSurveyStore.persist.clearStorage()
                }
            })
        ),
        { name: 'survey-storage' }
    )
);
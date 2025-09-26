import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SurveyState {
    employeeId: string;
    setEmployeeId: (id: string) => void;
    employeeName: string;
    setEmployeeName: (name: string) => void;
    referredByCode: string | null;
    setReferredByCode: (code: string | null) => void;
}

export const useSurveyStore = create<SurveyState>()(
    persist(
        (set) => ({
            employeeId: '',
            setEmployeeId: (id : string) => set({ employeeId: id }),
            employeeName: '',
            setEmployeeName: (name : string) => set({ employeeName: name }),
            referredByCode: null,
            setReferredByCode: (code : string | null) => set({ referredByCode: code })
        }),
        { name: "survey-storage" }
    )
);
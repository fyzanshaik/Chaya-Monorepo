import { create } from 'zustand';
import type { UseFormReturn } from 'react-hook-form';

type TabType = 'basic' | 'drying' | 'final';

interface ProcessingFormState {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  goToNextTab: () => void;
  goToPreviousTab: () => void;
  form: UseFormReturn<any> | null;
  setForm: (form: UseFormReturn<any>) => void;
  isSubmitting: boolean;
  setIsSubmitting: (isSubmitting: boolean) => void;
  procurementId: number | null;
  initializeForm: (procurementId: number) => void;
}

export const useProcessingFormStore = create<ProcessingFormState>((set, get) => ({
  activeTab: 'basic',
  setActiveTab: tab => set({ activeTab: tab }),
  goToNextTab: () => {
    const { activeTab } = get();
    if (activeTab === 'basic') set({ activeTab: 'drying' });
    else if (activeTab === 'drying') set({ activeTab: 'final' });
  },
  goToPreviousTab: () => {
    const { activeTab } = get();
    if (activeTab === 'final') set({ activeTab: 'drying' });
    else if (activeTab === 'drying') set({ activeTab: 'basic' });
  },
  form: null,
  setForm: form => set({ form }),
  isSubmitting: false,
  setIsSubmitting: isSubmitting => set({ isSubmitting }),
  procurementId: null,
  initializeForm: procurementId => {
    set({
      procurementId,
      activeTab: 'basic',
      isSubmitting: false,
    });
  },
}));

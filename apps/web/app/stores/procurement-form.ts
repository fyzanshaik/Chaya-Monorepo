import { create } from 'zustand';
import type { UseFormReturn } from 'react-hook-form';
import type { ProcurementWithRelations } from '@/app/(dashboard)/procurements/lib/types';

type TabType = 'basic' | 'details' | 'review';

interface ProcurementFormState {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  goToNextTab: () => void;
  goToPreviousTab: () => void;
  form: UseFormReturn<any> | null;
  setForm: (form: UseFormReturn<any>) => void;
  isSubmitting: boolean;
  setIsSubmitting: (isSubmitting: boolean) => void;
  initialData: ProcurementWithRelations | null;
  mode: 'add' | 'edit';
  initializeForm: (initialData: ProcurementWithRelations | null | undefined, mode: 'add' | 'edit') => void;
}

export const useProcurementFormStore = create<ProcurementFormState>((set, get) => ({
  activeTab: 'basic',
  setActiveTab: tab => set({ activeTab: tab }),
  goToNextTab: () => {
    const { activeTab } = get();
    if (activeTab === 'basic') set({ activeTab: 'details' });
    else if (activeTab === 'details') set({ activeTab: 'review' });
  },
  goToPreviousTab: () => {
    const { activeTab } = get();
    if (activeTab === 'review') set({ activeTab: 'details' });
    else if (activeTab === 'details') set({ activeTab: 'basic' });
  },
  form: null,
  setForm: form => set({ form }),
  isSubmitting: false,
  setIsSubmitting: isSubmitting => set({ isSubmitting }),
  initialData: null,
  mode: 'add',
  initializeForm: (initialData, mode) => {
    set({
      initialData: initialData || null,
      mode,
      activeTab: 'basic',
      isSubmitting: false,
    });
  },
}));

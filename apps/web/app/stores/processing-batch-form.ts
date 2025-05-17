import { create } from 'zustand';
import type { UseFormReturn } from 'react-hook-form';
import type { Procurement, CreateProcessingBatchInput } from '@chaya/shared';

type ProcessingBatchFormStep = 'selectCriteria' | 'selectProcurements' | 'firstStageDetails' | 'review';

interface ProcessingBatchFormState {
  activeStep: ProcessingBatchFormStep;
  setActiveStep: (step: ProcessingBatchFormStep) => void;
  goToNextStep: () => void;
  goToPreviousStep: () => void;

  // Form data collected across steps
  selectedCrop: string | null;
  selectedLotNo: number | null;
  availableProcurements: Procurement[]; // Fetched based on crop/lot
  selectedProcurementIds: number[];
  firstStageDetails: Partial<CreateProcessingBatchInput['firstStageDetails']>;

  setCriteria: (crop: string, lotNo: number) => void;
  setAvailableProcurements: (procurements: Procurement[]) => void;
  toggleSelectedProcurement: (id: number) => void;
  setFirstStageDetails: (details: Partial<CreateProcessingBatchInput['firstStageDetails']>) => void;

  form: UseFormReturn<any> | null; // For the current step's form if needed
  setForm: (form: UseFormReturn<any> | null) => void;

  isSubmitting: boolean;
  setIsSubmitting: (isSubmitting: boolean) => void;

  resetForm: () => void;
}

const initialFirstStageDetails: Partial<CreateProcessingBatchInput['firstStageDetails']> = {
  processMethod: 'wet', // Default
  dateOfProcessing: new Date(),
  doneBy: '',
};

const initialState = {
  activeStep: 'selectCriteria' as ProcessingBatchFormStep,
  selectedCrop: null,
  selectedLotNo: null,
  availableProcurements: [],
  selectedProcurementIds: [],
  firstStageDetails: { ...initialFirstStageDetails },
  form: null,
  isSubmitting: false,
};

export const useProcessingBatchFormStore = create<ProcessingBatchFormState>((set, get) => ({
  ...initialState,
  setActiveStep: step => set({ activeStep: step }),
  goToNextStep: () => {
    const { activeStep } = get();
    if (activeStep === 'selectCriteria') set({ activeStep: 'selectProcurements' });
    else if (activeStep === 'selectProcurements') set({ activeStep: 'firstStageDetails' });
    else if (activeStep === 'firstStageDetails') set({ activeStep: 'review' });
  },
  goToPreviousStep: () => {
    const { activeStep } = get();
    if (activeStep === 'review') set({ activeStep: 'firstStageDetails' });
    else if (activeStep === 'firstStageDetails') set({ activeStep: 'selectProcurements' });
    else if (activeStep === 'selectProcurements') set({ activeStep: 'selectCriteria' });
  },
  setCriteria: (crop: string, lotNo: number) =>
    set({ selectedCrop: crop, selectedLotNo: lotNo, selectedProcurementIds: [], availableProcurements: [] }),
  setAvailableProcurements: procurements => set({ availableProcurements: procurements }),
  toggleSelectedProcurement: id => {
    set(state => {
      const selectedIds = state.selectedProcurementIds.includes(id)
        ? state.selectedProcurementIds.filter(pid => pid !== id)
        : [...state.selectedProcurementIds, id];
      return { selectedProcurementIds: selectedIds };
    });
  },
  setFirstStageDetails: details =>
    set(state => ({
      firstStageDetails: { ...state.firstStageDetails, ...details },
    })),
  setForm: form => set({ form }),
  setIsSubmitting: isSubmitting => set({ isSubmitting }),
  resetForm: () => set({ ...initialState, firstStageDetails: { ...initialFirstStageDetails } }),
}));

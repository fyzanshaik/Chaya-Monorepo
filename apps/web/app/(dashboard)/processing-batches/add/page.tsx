'use client';

import { useProcessingBatchFormStore } from '@/app/stores/processing-batch-form';
import { Button } from '@workspace/ui/components/button';
import { Progress } from '@workspace/ui/components/progress';
import { useEffect } from 'react';

import { SelectCriteriaStep } from './components/select-criteria-step';
import { SelectProcurementsStep } from './components/select-procurements-step';
import { FirstStageDetailsStep } from './components/first-stage-details-step';
import { ReviewAndSubmitStep } from './components/review-submit-step';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import axios from 'axios';

export default function AddProcessingBatchPage() {
  const router = useRouter();
  const {
    activeStep,
    goToNextStep,
    goToPreviousStep,
    selectedCrop,
    selectedLotNo,
    selectedProcurementIds,
    firstStageDetails,
    isSubmitting,
    setIsSubmitting,
    resetForm,
  } = useProcessingBatchFormStore();

  useEffect(() => {
    return () => {};
  }, [resetForm]);

  const steps = [
    { id: 'selectCriteria', title: 'Select Crop & Lot', progress: 25 },
    { id: 'selectProcurements', title: 'Select Procurements', progress: 50 },
    { id: 'firstStageDetails', title: 'First Stage Details (P1)', progress: 75 },
    { id: 'review', title: 'Review & Submit', progress: 100 },
  ];

  const currentStepConfig = steps.find(s => s.id === activeStep);

  const handleNext = async () => {
    if (activeStep === 'selectCriteria' && (!selectedCrop || !selectedLotNo)) {
      toast.error('Please select a crop and enter a lot number.');
      return;
    }
    if (activeStep === 'selectProcurements' && selectedProcurementIds.length === 0) {
      toast.error('Please select at least one procurement.');
      return;
    }

    const form = useProcessingBatchFormStore.getState().form;
    if (activeStep === 'firstStageDetails' && form) {
      const isValid = await form.trigger();
      if (!isValid) {
        toast.error('Please fill in all required P1 details.');
        return;
      }
      useProcessingBatchFormStore.getState().setFirstStageDetails(form.getValues());
    }
    goToNextStep();
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const p1Date = firstStageDetails.dateOfProcessing;
      let p1DateString: string | undefined = undefined;

      if (p1Date instanceof Date) {
        p1DateString = p1Date.toISOString();
      } else if (typeof p1Date === 'string') {
        try {
          p1DateString = new Date(p1Date).toISOString();
        } catch (e) {}
      }

      if (!p1DateString) {
        toast.error('P1 Date of Processing is missing or invalid.');
        setIsSubmitting(false);
        return;
      }
      if (!firstStageDetails.processMethod) {
        toast.error('P1 Process Method is missing.');
        setIsSubmitting(false);
        return;
      }
      if (!firstStageDetails.doneBy) {
        toast.error('P1 Done By is missing.');
        setIsSubmitting(false);
        return;
      }

      const lotNumber = typeof selectedLotNo === 'string' ? parseInt(selectedLotNo, 10) : selectedLotNo;
      if (lotNumber === null || isNaN(lotNumber) || lotNumber <= 0) {
        toast.error('Lot number is invalid.');
        setIsSubmitting(false);
        return;
      }

      const payload = {
        crop: selectedCrop,
        lotNo: lotNumber,
        procurementIds: selectedProcurementIds,
        firstStageDetails: {
          processMethod: firstStageDetails.processMethod,
          dateOfProcessing: p1DateString,
          doneBy: firstStageDetails.doneBy,
        },
      };

      const response = await axios.post('/api/processing-batches', payload, { withCredentials: true });

      if (response.status === 201) {
        toast.success('Processing Batch created successfully!');
        const dataChangedEvent = new CustomEvent('processingBatchDataChanged');
        document.dispatchEvent(dataChangedEvent);
        resetForm();
        router.push('/processing-batches');
      } else {
        throw new Error(response.data.error || 'Failed to create processing batch');
      }
    } catch (error: any) {
      console.error('Error creating processing batch:', error);
      toast.error(`Error: ${error.response?.data?.error || error.message || 'Something went wrong'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Add New Processing Batch</h1>

      <Progress value={currentStepConfig?.progress || 0} className="w-full" />
      <p className="text-sm text-muted-foreground">Step: {currentStepConfig?.title}</p>

      <div className="mt-6">
        {activeStep === 'selectCriteria' && <SelectCriteriaStep />}
        {activeStep === 'selectProcurements' && <SelectProcurementsStep />}
        {activeStep === 'firstStageDetails' && <FirstStageDetailsStep />}
        {activeStep === 'review' && <ReviewAndSubmitStep />}
      </div>

      <div className="flex justify-between mt-8">
        <Button variant="outline" onClick={goToPreviousStep} disabled={activeStep === 'selectCriteria' || isSubmitting}>
          Previous
        </Button>
        {activeStep !== 'review' ? (
          <Button onClick={handleNext} disabled={isSubmitting}>
            Next
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Create Batch & Start P1'}
          </Button>
        )}
      </div>
    </div>
  );
}

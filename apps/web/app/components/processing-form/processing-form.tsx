'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@workspace/ui/components/tabs';
import { Button } from '@workspace/ui/components/button';
import { BasicInfoSection } from './basic-info-section';
import { DryingSection } from './drying-section';
import { FinalSection } from './final-section';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@workspace/ui/components/dialog';
import axios from 'axios';
import { useProcessingFormStore } from '@/app/stores/processing-form';
import type { FieldValues } from 'react-hook-form';
import { toast } from 'sonner';
import { useProcessingFormContext } from '@/app/providers/processing-form-provider';

interface ProcessingFormProps {
  procurementId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProcessingForm({ procurementId, open, onOpenChange }: ProcessingFormProps) {
  const { activeTab, setActiveTab, goToNextTab, goToPreviousTab, form, isSubmitting, setIsSubmitting } =
    useProcessingFormStore();
  const { procurementId: contextProcurementId } = useProcessingFormContext();

  const title = 'Add Processing Details';

  const handleSubmit = async (data: FieldValues) => {
    setIsSubmitting(true);
    console.log('Submitting processing data:', JSON.stringify(data, null, 2));

    try {
      const axiosConfig = {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
        },
      };

      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

      // First create the processing record
      const processingData = {
        procurementId: contextProcurementId,
        lotNo: data.lotNo,
        crop: data.crop,
        procuredForm: data.procuredForm,
        quantity: data.quantity,
        speciality: data.speciality,
        processMethod: data.processMethod,
        dateOfProcessing: data.dateOfProcessing.toISOString(),
        dateOfCompletion: data.dateOfCompletion ? data.dateOfCompletion.toISOString() : null,
        quantityAfterProcess: data.quantityAfterProcess || null,
        doneBy: data.doneBy,
      };

      const processingResponse = await axios.post(`${apiBaseUrl}/api/processing`, processingData, axiosConfig);

      const processingId = processingResponse.data.processing.id;

      // Then add drying details if provided
      if (data.drying && data.drying.length > 0) {
        for (const day of data.drying) {
          await axios.post(
            `${apiBaseUrl}/api/processing/${processingId}/drying`,
            {
              day: day.day,
              temperature: day.temperature,
              humidity: day.humidity,
              pH: day.pH,
              moistureQuantity: day.moistureQuantity,
            },
            axiosConfig
          );
        }
      }

      toast.success('Processing details added successfully');
      const dataChangedEvent = new CustomEvent('processingDataChanged');
      document.dispatchEvent(dataChangedEvent);
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error submitting form:', error);
      console.error('Error response:', error.response?.data);

      if (error.response?.status === 401) {
        toast.error('Your session has expired. Please log in again.');
      } else {
        toast.error(`Error: ${error.response?.data?.error || error.message || 'Something went wrong'}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <Tabs value={activeTab} onValueChange={value => setActiveTab(value as any)} className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="drying">Drying Details</TabsTrigger>
            <TabsTrigger value="final">Final Quantity</TabsTrigger>
          </TabsList>
          <TabsContent value="basic" className="space-y-4">
            <BasicInfoSection />
          </TabsContent>
          <TabsContent value="drying" className="space-y-4">
            <DryingSection />
          </TabsContent>
          <TabsContent value="final" className="space-y-4">
            <FinalSection />
          </TabsContent>
        </Tabs>
        <DialogFooter className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={goToPreviousTab} disabled={activeTab === 'basic'}>
              Previous
            </Button>
            <Button variant="outline" onClick={goToNextTab} disabled={activeTab === 'final'}>
              Next
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            {activeTab === 'final' && (
              <Button
                type="button"
                onClick={async () => {
                  console.log('Submit button clicked, form exists:', !!form);
                  if (form) {
                    const values = form.getValues();

                    const isValid = await form.trigger();

                    if (isValid) {
                      handleSubmit(values);
                    } else {
                      setTimeout(() => {
                        const errors = form.formState.errors;
                        console.log('Validation errors:', JSON.stringify(errors, null, 2));
                      }, 100);
                      toast.error('Form validation failed. Please check all tabs for errors.');
                    }
                  } else {
                    toast.error('Form data is not available. Please try again.');
                  }
                }}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving...' : 'Save Processing'}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

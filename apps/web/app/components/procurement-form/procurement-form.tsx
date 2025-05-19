'use client';

import { useEffect } from 'react';
import { useForm, FormProvider, type FieldValues } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@workspace/ui/components/tabs';
import { Button } from '@workspace/ui/components/button';
import { BasicInfoSection } from './basic-info-section';
import { DetailsSection } from './details-section';
import { ReviewSection } from './review-section';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@workspace/ui/components/dialog';
import axios from 'axios';
import {
  useProcurementFormStore,
  procurementFullFormSchema,
  type ProcurementFullFormValues,
  type TabType,
} from '@/app/stores/procurement-form';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface ProcurementFormProps {
  mode: 'add' | 'edit';
  open: boolean;
  onOpenChange: (open: boolean) => void;
  procurementId?: number;
}

export function ProcurementForm({ mode, open, onOpenChange, procurementId }: ProcurementFormProps) {
  const {
    activeTab,
    setActiveTab,
    goToNextTab,
    goToPreviousTab,
    setForm: setZustandForm,
    isSubmitting,
    setIsSubmitting,
    initialData,
  } = useProcurementFormStore();

  const title = mode === 'add' ? 'Add New Procurement' : 'Edit Procurement';

  const methods = useForm<ProcurementFullFormValues>({
    resolver: zodResolver(procurementFullFormSchema),
    defaultValues:
      mode === 'edit' && initialData
        ? {
            farmerId: initialData.farmerId,
            crop: initialData.crop,
            procuredForm: initialData.procuredForm,
            speciality: initialData.speciality,
            quantity: initialData.quantity,
            date: initialData.date ? new Date(initialData.date) : new Date(),
            time: initialData.time ? format(new Date(initialData.time), 'HH:mm:ss') : format(new Date(), 'HH:mm:ss'),
            lotNo: initialData.lotNo,
            procuredBy: initialData.procuredBy,
            vehicleNo: initialData.vehicleNo || '',
          }
        : {
            farmerId: undefined,
            crop: '',
            procuredForm: '',
            speciality: '',
            quantity: undefined,
            date: new Date(),
            time: format(new Date(), 'HH:mm:ss'),
            lotNo: 1,
            procuredBy: '',
            vehicleNo: '',
          },
  });

  useEffect(() => {
    setZustandForm(methods);
    if (mode === 'edit' && initialData) {
      methods.reset({
        farmerId: initialData.farmerId,
        crop: initialData.crop,
        procuredForm: initialData.procuredForm,
        speciality: initialData.speciality,
        quantity: initialData.quantity,
        date: new Date(initialData.date),
        time: format(new Date(initialData.time), 'HH:mm:ss'),
        lotNo: initialData.lotNo,
        procuredBy: initialData.procuredBy,
        vehicleNo: initialData.vehicleNo || '',
      });
    } else if (mode === 'add') {
      methods.reset({
        farmerId: undefined,
        crop: '',
        procuredForm: '',
        speciality: '',
        quantity: undefined,
        date: new Date(),
        time: format(new Date(), 'HH:mm:ss'),
        lotNo: 1,
        procuredBy: '',
        vehicleNo: '',
      });
    }
  }, [setZustandForm, mode, initialData]);

  const processAndSubmitData = async (data: ProcurementFullFormValues) => {
    setIsSubmitting(true);

    const payload = {
      ...data,
      date: data.date instanceof Date ? data.date.toISOString().split('T')[0] : data.date,
    };

    console.log('Submitting data to backend:', JSON.stringify(payload, null, 2));

    try {
      const axiosConfig = {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
        },
      };
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

      if (mode === 'add') {
        await axios.post(`${apiBaseUrl}/api/procurements`, payload, axiosConfig);
        toast.success('Procurement added successfully');
      } else {
        await axios.put(`${apiBaseUrl}/api/procurements/${procurementId}`, payload, axiosConfig);
        toast.success('Procurement updated successfully');
      }

      document.dispatchEvent(new CustomEvent('procurementDataChanged'));
      onOpenChange(false);
      methods.reset();
      useProcurementFormStore.getState().initializeForm(null, 'add');
    } catch (error: any) {
      console.error('Error submitting form:', error.response?.data || error.message);
      const errorDetails = error.response?.data?.details;
      let errorMessage = error.response?.data?.error || error.message || 'Something went wrong';
      if (errorDetails && Array.isArray(errorDetails)) {
        errorMessage = errorDetails.map((detail: any) => `${detail.path.join('.')}: ${detail.message}`).join('; ');
      }
      toast.error(`Error: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={isOpen => {
        onOpenChange(isOpen);
        if (!isOpen) {
          methods.reset();
          useProcurementFormStore.getState().initializeForm(null, 'add');
        }
      }}
    >
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(processAndSubmitData)}>
            <Tabs value={activeTab} onValueChange={value => setActiveTab(value as TabType)} className="mt-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="review">Review</TabsTrigger>
              </TabsList>
              <TabsContent value="basic" className="space-y-4">
                <BasicInfoSection />
              </TabsContent>
              <TabsContent value="details" className="space-y-4">
                <DetailsSection />
              </TabsContent>
              <TabsContent value="review" className="space-y-4">
                <ReviewSection />
              </TabsContent>
            </Tabs>
            <DialogFooter className="flex items-center justify-between pt-4">
              <div className="flex items-center gap-4">
                <Button type="button" variant="outline" onClick={goToPreviousTab} disabled={activeTab === 'basic'}>
                  Previous
                </Button>
                <Button type="button" variant="outline" onClick={goToNextTab} disabled={activeTab === 'review'}>
                  Next
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                {activeTab === 'review' && (
                  <Button type="submit" disabled={isSubmitting || (!methods.formState.isDirty && mode === 'edit')}>
                    {isSubmitting ? 'Saving...' : 'Save Procurement'}
                  </Button>
                )}
              </div>
            </DialogFooter>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}

'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useProcessingBatchFormStore } from '@/app/stores/processing-batch-form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@workspace/ui/components/card';
import { Label } from '@workspace/ui/components/label';
import { Input } from '@workspace/ui/components/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@workspace/ui/components/select';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@workspace/ui/components/form';
import { useEffect } from 'react';

// Assuming a list of possible crops. This could be fetched or be a static list.
const CROP_OPTIONS = ['Rice', 'Wheat', 'Maize', 'Soybean', 'Cotton', 'Coffee', 'Tea', 'Spices']; // Example

const criteriaSchema = z.object({
  crop: z.string().min(1, 'Crop is required'),
  lotNo: z.coerce.number().int().min(1, 'Lot number must be a positive integer'),
});

type CriteriaFormValues = z.infer<typeof criteriaSchema>;

export function SelectCriteriaStep() {
  const { selectedCrop, selectedLotNo, setCriteria, form: zustandForm, setForm } = useProcessingBatchFormStore();

  const form = useForm<CriteriaFormValues>({
    resolver: zodResolver(criteriaSchema),
    defaultValues: {
      crop: selectedCrop || '',
      lotNo: selectedLotNo || undefined,
    },
  });

  useEffect(() => {
    if (zustandForm !== form) {
      setForm(form as any); // Store RHF instance in Zustand
    }
    // Sync zustand with form values if they change externally
    form.reset({
      crop: selectedCrop || '',
      lotNo: selectedLotNo || undefined,
    });
  }, [selectedCrop, selectedLotNo, form, zustandForm, setForm]);

  const onSubmit = (data: CriteriaFormValues) => {
    // This function might not be directly called if validation happens on "Next" click in parent
    setCriteria(data.crop, data.lotNo);
  };

  // Update zustand store on field change to keep it in sync for parent "Next" button
  const handleValueChange = () => {
    const values = form.getValues();
    if (values.crop && values.lotNo !== undefined && values.lotNo !== null && !isNaN(values.lotNo)) {
      if (values.crop !== selectedCrop || values.lotNo !== selectedLotNo) {
        setCriteria(values.crop, values.lotNo);
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Step 1: Select Crop and Lot Number</CardTitle>
        <CardDescription>Specify the crop and lot number to find unbatched procurements.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onChange={handleValueChange} className="space-y-6">
            {' '}
            {/* Use onChange for immediate zustand update */}
            <FormField
              control={form.control}
              name="crop"
              render={({ field }) => (
                <FormItem>
                  <Label htmlFor="crop">Crop Name</Label>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger id="crop">
                        <SelectValue placeholder="Select a crop" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CROP_OPTIONS.map(cropName => (
                        <SelectItem key={cropName} value={cropName}>
                          {cropName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="lotNo"
              render={({ field }) => (
                <FormItem>
                  <Label htmlFor="lotNo">Lot Number</Label>
                  <FormControl>
                    <Input id="lotNo" type="number" placeholder="Enter lot number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* Form submission is handled by the parent component's "Next" button */}
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

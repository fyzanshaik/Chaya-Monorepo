'use client';

import { useEffect, useState } from 'react';
import { useForm, Controller, useWatch } from 'react-hook-form'; // Added useWatch
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useProcurementFormStore } from '@/app/stores/procurement-form';
import { Card, CardContent } from '@workspace/ui/components/card';
import { Label } from '@workspace/ui/components/label';
import { Input } from '@workspace/ui/components/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@workspace/ui/components/select';
import { Combobox } from '@workspace/ui/components/combobox';
import axios from 'axios';
import { toast } from 'sonner';

const basicInfoSchema = z.object({
  farmerId: z.number({
    required_error: 'Farmer is required',
  }),
  crop: z.string().min(1, 'Crop is required'),
  procuredForm: z.string().min(1, 'Procured form is required'), // Validation still happens here
  speciality: z.string().min(1, 'Speciality is required'),
  quantity: z
    .number({
      required_error: 'Quantity is required',
      invalid_type_error: 'Quantity must be a number',
    })
    .positive('Quantity must be a positive number'),
});

type BasicInfoFormValues = z.infer<typeof basicInfoSchema>;

interface Farmer {
  id: number;
  name: string;
  village: string;
  mandal: string;
}

const CROP_OPTIONS = ['Turmeric', 'Coffee', 'Ginger', 'Pepper'] as const;
type CropType = (typeof CROP_OPTIONS)[number];

const PROCURED_FORMS_BY_CROP: Record<CropType, string[]> = {
  Turmeric: ['Fresh Finger', 'Fresh Bulb', 'Dried Finger', 'Dried Bulb'],
  Coffee: ['Fruit', 'Dry Cherry', 'Parchment'],
  Ginger: ['Fresh', 'Dried'],
  Pepper: ['Green Pepper', 'Black Pepper'],
};

export function BasicInfoSection() {
  const { form, setForm, initialData } = useProcurementFormStore(); // form here refers to the Zustand store's form ref
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [isLoadingFarmers, setIsLoadingFarmers] = useState(false);

  const methods = useForm<BasicInfoFormValues>({
    resolver: zodResolver(basicInfoSchema),
    defaultValues: {
      farmerId: initialData?.farmerId || undefined, // Use undefined for Combobox placeholder
      crop: initialData?.crop || '',
      procuredForm: initialData?.procuredForm || '',
      speciality: initialData?.speciality || '',
      quantity: initialData?.quantity || undefined,
    },
  });

  const {
    control,
    formState: { errors },
    setValue, // To reset procuredForm when crop changes
  } = methods;

  const watchedCrop = useWatch({ control: methods.control, name: 'crop' });

  useEffect(() => {
    // This effect sets the react-hook-form instance into the Zustand store
    // It's important this 'form' in Zustand is correctly typed and used by other parts
    if (setForm && methods) {
      // Check if setForm and methods are defined
      setForm(methods as any); // Casting as any if types mismatch, ensure types align
    }
  }, [methods, setForm]);

  useEffect(() => {
    if (watchedCrop) {
      setValue('procuredForm', ''); // Reset procured form when crop changes
    }
  }, [watchedCrop, setValue]);

  useEffect(() => {
    const fetchFarmers = async () => {
      setIsLoadingFarmers(true);
      try {
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';
        const response = await axios.get(`${apiBaseUrl}/api/farmers`, {
          params: { limit: 1000, isActive: true }, // Fetch more farmers, ensure they are active
          withCredentials: true,
        });
        setFarmers(response.data.farmers);
      } catch (error) {
        console.error('Error fetching farmers:', error);
        toast.error('Failed to load farmers. Please try again.');
      } finally {
        setIsLoadingFarmers(false);
      }
    };
    fetchFarmers();
  }, []);

  const currentProcuredForms = watchedCrop ? PROCURED_FORMS_BY_CROP[watchedCrop as CropType] || [] : [];

  return (
    <Card>
      <CardContent className="pt-6">
        <form className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="farmerId">Farmer</Label>
              <Controller
                control={control}
                name="farmerId"
                render={({ field }) => (
                  <Combobox
                    items={farmers.map(farmer => ({
                      label: `${farmer.name} (${farmer.village}, ${farmer.mandal})`,
                      value: farmer.id.toString(),
                    }))}
                    value={field.value ? field.value.toString() : ''}
                    onChange={val => field.onChange(val ? parseInt(val) : undefined)}
                    placeholder="Select a farmer"
                    isLoading={isLoadingFarmers}
                  />
                )}
              />
              {errors.farmerId && <p className="text-sm text-red-500 mt-1">{errors.farmerId.message}</p>}
            </div>

            <div>
              <Label htmlFor="crop">Crop</Label>
              <Controller
                control={control}
                name="crop"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select crop" />
                    </SelectTrigger>
                    <SelectContent>
                      {CROP_OPTIONS.map(cropName => (
                        <SelectItem key={cropName} value={cropName}>
                          {cropName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.crop && <p className="text-sm text-red-500 mt-1">{errors.crop.message}</p>}
            </div>

            <div>
              <Label htmlFor="procuredForm">Procured Form</Label>
              <Controller
                control={control}
                name="procuredForm"
                render={({ field }) => (
                  <Select
                    onValueChange={field.onChange}
                    value={field.value} // Use value for controlled component
                    disabled={!watchedCrop || currentProcuredForms.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select form (after choosing crop)" />
                    </SelectTrigger>
                    <SelectContent>
                      {currentProcuredForms.map(formName => (
                        <SelectItem key={formName} value={formName}>
                          {formName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.procuredForm && <p className="text-sm text-red-500 mt-1">{errors.procuredForm.message}</p>}
            </div>

            <div>
              <Label htmlFor="speciality">Speciality</Label>
              <Controller
                control={control}
                name="speciality"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select speciality" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Organic">Organic</SelectItem>
                      <SelectItem value="Non-GMO">Non-GMO</SelectItem>
                      <SelectItem value="Fair Trade">Fair Trade</SelectItem>
                      <SelectItem value="Standard">Standard</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.speciality && <p className="text-sm text-red-500 mt-1">{errors.speciality.message}</p>}
            </div>

            <div>
              <Label htmlFor="quantity">Quantity (kg)</Label>
              <Controller
                control={control}
                name="quantity"
                render={({ field }) => (
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    {...field}
                    value={field.value === undefined ? '' : field.value} // Handle undefined for placeholder
                    onChange={e => field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))}
                  />
                )}
              />
              {errors.quantity && <p className="text-sm text-red-500 mt-1">{errors.quantity.message}</p>}
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

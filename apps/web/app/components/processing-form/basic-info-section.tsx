'use client';

import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useProcessingFormStore } from '@/app/stores/processing-form';
import { Card, CardContent } from '@workspace/ui/components/card';
import { Label } from '@workspace/ui/components/label';
import { Input } from '@workspace/ui/components/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@workspace/ui/components/select';
import { Calendar } from '@workspace/ui/components/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@workspace/ui/components/popover';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@workspace/ui/lib/utils';
import { format } from 'date-fns';
import axios from 'axios';
import { toast } from 'sonner';
import { Button } from '@workspace/ui/components/button';

const basicInfoSchema = z.object({
  lotNo: z.number().int().min(1).max(3, 'Lot number must be 1, 2, or 3'),
  crop: z.string().min(1, 'Crop is required'),
  procuredForm: z.string().min(1, 'Procured form is required'),
  quantity: z.number().positive('Quantity must be a positive number'),
  speciality: z.string().min(1, 'Speciality is required'),
  processMethod: z.enum(['wet', 'dry']),
  dateOfProcessing: z.date({
    required_error: 'Processing date is required',
  }),
  dateOfCompletion: z.date().optional(),
  doneBy: z.string().min(1, 'Done by is required'),
});

type BasicInfoFormValues = z.infer<typeof basicInfoSchema>;

export function BasicInfoSection() {
  const { form, setForm, procurementId } = useProcessingFormStore();
  const [procurementData, setProcurementData] = useState<any>(null);

  useEffect(() => {
    const fetchProcurementData = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/procurements/${procurementId}`, {
          withCredentials: true,
        });
        setProcurementData(response.data.procurement);
      } catch (error) {
        console.error('Error fetching procurement data:', error);
        toast.error('Failed to load procurement details');
      }
    };

    if (procurementId) {
      fetchProcurementData();
    }
  }, [procurementId]);

  const methods = useForm<BasicInfoFormValues>({
    resolver: zodResolver(basicInfoSchema),
    defaultValues: {
      lotNo: procurementData?.lotNo || 1,
      crop: procurementData?.crop || '',
      procuredForm: procurementData?.procuredForm || '',
      quantity: procurementData?.quantity || 0,
      speciality: procurementData?.speciality || '',
      processMethod: 'wet',
      dateOfProcessing: new Date(),
      doneBy: '',
    },
  });

  const {
    register,
    control,
    formState: { errors },
  } = methods;

  useEffect(() => {
    setForm(methods);
  }, [methods, setForm]);

  return (
    <Card>
      <CardContent className="pt-6">
        <form className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="lotNo">Lot Number</Label>
              <Controller
                control={control}
                name="lotNo"
                render={({ field }) => (
                  <Select
                    onValueChange={value => field.onChange(Number.parseInt(value))}
                    defaultValue={field.value?.toString()}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select lot number" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1</SelectItem>
                      <SelectItem value="2">2</SelectItem>
                      <SelectItem value="3">3</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.lotNo && <p className="text-sm text-red-500 mt-1">{errors.lotNo.message}</p>}
            </div>

            <div>
              <Label htmlFor="crop">Crop</Label>
              <Input id="crop" {...register('crop')} readOnly className="bg-gray-100" />
            </div>

            <div>
              <Label htmlFor="procuredForm">Procured Form</Label>
              <Input id="procuredForm" {...register('procuredForm')} readOnly className="bg-gray-100" />
            </div>

            <div>
              <Label htmlFor="quantity">Quantity (kg)</Label>
              <Input
                id="quantity"
                {...register('quantity', { valueAsNumber: true })}
                readOnly
                className="bg-gray-100"
              />
            </div>

            <div>
              <Label htmlFor="speciality">Speciality</Label>
              <Input id="speciality" {...register('speciality')} readOnly className="bg-gray-100" />
            </div>

            <div>
              <Label htmlFor="processMethod">Process Method</Label>
              <Controller
                control={control}
                name="processMethod"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select process method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="wet">Wet</SelectItem>
                      <SelectItem value="dry">Dry</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.processMethod && <p className="text-sm text-red-500 mt-1">{errors.processMethod.message}</p>}
            </div>

            <div>
              <Label htmlFor="dateOfProcessing">Processing Date</Label>
              <Controller
                control={control}
                name="dateOfProcessing"
                render={({ field }) => (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !field.value && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                    </PopoverContent>
                  </Popover>
                )}
              />
              {errors.dateOfProcessing && (
                <p className="text-sm text-red-500 mt-1">{errors.dateOfProcessing.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="doneBy">Done By</Label>
              <Input id="doneBy" {...register('doneBy')} />
              {errors.doneBy && <p className="text-sm text-red-500 mt-1">{errors.doneBy.message}</p>}
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

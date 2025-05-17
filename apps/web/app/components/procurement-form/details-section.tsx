'use client';

import { useEffect } from 'react';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useProcurementFormStore } from '@/app/stores/procurement-form';
import { Card, CardContent } from '@workspace/ui/components/card';
import { Label } from '@workspace/ui/components/label';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@workspace/ui/components/select';
import { format, parse } from 'date-fns';
import { Calendar } from '@workspace/ui/components/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@workspace/ui/components/popover';
import { CalendarIcon, Clock } from 'lucide-react';
import { cn } from '@workspace/ui/lib/utils';

const detailsSchema = z.object({
  date: z.date({
    required_error: 'Date is required',
  }),
  time: z.string().regex(/^\d{2}:\d{2}:\d{2}$/, 'Invalid time format (expected HH:mm:ss)'),
  lotNo: z
    .number({
      required_error: 'Lot number is required',
      invalid_type_error: 'Lot number must be a number',
    })
    .int()
    .min(1)
    .max(3, 'Lot number must be 1, 2, or 3'),
  procuredBy: z.string().min(1, 'Procured by is required'),
  vehicleNo: z.string().min(1, 'Vehicle number is required'),
});

type DetailsFormValues = z.infer<typeof detailsSchema>;

export function DetailsSection() {
  const { form, setForm, initialData } = useProcurementFormStore();

  const methods = useForm<DetailsFormValues>({
    resolver: zodResolver(detailsSchema),
    defaultValues: {
      date: initialData?.date ? new Date(initialData.date) : new Date(),
      time: initialData?.time ? format(new Date(initialData.time), 'HH:mm:ss') : '00:00:00',
      lotNo: initialData?.lotNo || 1,
      procuredBy: initialData?.procuredBy || '',
      vehicleNo: initialData?.vehicleNo || '',
    },
  });

  const {
    register,
    control,
    formState: { errors },
    setValue,
  } = methods;

  const watchedValues = useWatch({
    control,
  });

  useEffect(() => {
    if (form) {
      Object.keys(watchedValues).forEach(key => {
        form.setValue(key as any, watchedValues[key as keyof DetailsFormValues], {
          shouldValidate: true,
          shouldDirty: true,
        });
      });
    }
  }, [form, watchedValues]);

  useEffect(() => {
    if (methods && !form) {
      setForm(methods as any);
    }
  }, [methods, form, setForm]);

  return (
    <Card>
      <CardContent className="pt-6">
        <form className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="date">Date</Label>
              <Controller
                control={control}
                name="date"
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
              {errors.date && <p className="text-sm text-red-500 mt-1">{errors.date.message}</p>}
            </div>

            <div>
              <Label htmlFor="time">Time</Label>
              <Controller
                control={control}
                name="time"
                render={({ field }) => (
                  <div className="flex items-center">
                    <Input
                      type="time"
                      step="1"
                      className="flex-1"
                      value={field.value ? field.value.substring(0, 8) : '00:00:00'}
                      onChange={e => {
                        let timeValue = e.target.value;
                        if (timeValue.match(/^\d{2}:\d{2}$/)) {
                          timeValue += ':00';
                        } else if (timeValue.match(/^\d{2}:\d{2}:\d{2}$/)) {
                        } else {
                          timeValue = '00:00:00';
                        }
                        field.onChange(timeValue);
                      }}
                    />
                    <Clock className="ml-2 h-4 w-4 text-muted-foreground" />
                  </div>
                )}
              />
              {errors.time && <p className="text-sm text-red-500 mt-1">{errors.time.message}</p>}
            </div>

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
              <Label htmlFor="procuredBy">Procured By</Label>
              <Input id="procuredBy" {...register('procuredBy')} />
              {errors.procuredBy && <p className="text-sm text-red-500 mt-1">{errors.procuredBy.message}</p>}
            </div>

            <div>
              <Label htmlFor="vehicleNo">Vehicle Number</Label>
              <Input id="vehicleNo" {...register('vehicleNo')} />
              {errors.vehicleNo && <p className="text-sm text-red-500 mt-1">{errors.vehicleNo.message}</p>}
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

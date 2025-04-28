'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@workspace/ui/components/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@workspace/ui/components/select';
import { Input } from '@workspace/ui/components/input';
import { Button } from '@workspace/ui/components/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@workspace/ui/components/dialog';
import { Calendar } from '@workspace/ui/components/calendar';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@workspace/ui/components/popover';
import { cn } from '@workspace/ui/lib/utils';
import axios from 'axios';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';
import { RadioGroup, RadioGroupItem } from '@workspace/ui/components/radio-group';
import { Label } from '@workspace/ui/components/label';
import { useFieldArray } from 'react-hook-form';

const processingFormSchema = z.object({
  processMethod: z.enum(['wet', 'dry']),
  dateOfProcessing: z.date({
    required_error: 'Processing date is required',
  }),
  doneBy: z.string().min(1, 'Done by is required'),
  dryingDays: z
    .array(
      z.object({
        day: z.number().min(1, 'Day must be at least 1'),
        temperature: z.number().min(0, 'Temperature must be positive'),
        humidity: z.number().min(0, 'Humidity must be positive'),
        pH: z.number().min(0, 'pH must be positive'),
        moistureQuantity: z.number().min(0, 'Moisture must be positive'),
      })
    )
    .optional(),
  finalAction: z.enum(['curing', 'selling']).optional(),
  quantityAfterProcess: z.number().min(0, 'Quantity must be positive').optional(),
  dateOfCompletion: z.date().optional(),
});

type ProcessingFormValues = z.infer<typeof processingFormSchema>;

export function ProcessingFormDialog({
  procurementId,
  open,
  onOpenChange,
  onSuccess,
}: {
  procurementId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<ProcessingFormValues>({
    resolver: zodResolver(processingFormSchema),
    defaultValues: {
      processMethod: 'wet',
      dateOfProcessing: new Date(),
      doneBy: '',
      dryingDays: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'dryingDays',
  });

  const addDryingDay = () => {
    const currentDays = form.getValues('dryingDays') || [];
    const nextDay = currentDays.length > 0 ? Math.max(...currentDays.map(d => d.day)) + 1 : 1;

    append({
      day: nextDay,
      temperature: 0,
      humidity: 0,
      pH: 0,
      moistureQuantity: 0,
    });
  };

  const onSubmit = async (data: ProcessingFormValues) => {
    setIsLoading(true);
    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';
      const processingData = {
        procurementId,
        processMethod: data.processMethod,
        dateOfProcessing: data.dateOfProcessing.toISOString(),
        doneBy: data.doneBy,
        dryingDays: data.dryingDays || [],
        finalAction: data.finalAction || null,
        quantityAfterProcess: data.quantityAfterProcess || null,
        dateOfCompletion: data.dateOfCompletion ? data.dateOfCompletion.toISOString() : null,
      };

      const response = await axios.post(`${apiBaseUrl}/api/processing`, processingData, {
        withCredentials: true,
      });

      if (response.status !== 200 && response.status !== 201) {
        throw new Error('Failed to save processing data');
      }

      toast.success('Processing data saved successfully');
      const dataChangedEvent = new CustomEvent('processingDataChanged');
      document.dispatchEvent(dataChangedEvent);
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving processing data:', error);
      toast.error('Failed to save processing data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Processing Details</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="processMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Process Method</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select method" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="wet">Wet</SelectItem>
                        <SelectItem value="dry">Dry</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dateOfProcessing"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Processing Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn('w-full pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}
                          >
                            {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={date => date > new Date() || date < new Date('1900-01-01')}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="doneBy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Done By</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="border rounded-lg p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-medium">Drying Details</h3>
                <Button type="button" variant="outline" size="sm" onClick={addDryingDay}>
                  Add Day
                </Button>
              </div>

              {fields.map((field, index) => (
                <div key={field.id} className="mb-4 p-3 border rounded-md">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium">Day {index + 1}</h4>
                    <Button type="button" variant="ghost" size="sm" onClick={() => remove(index)}>
                      Remove
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name={`dryingDays.${index}.temperature`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Temperature (°C)</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`dryingDays.${index}.humidity`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Humidity (%)</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`dryingDays.${index}.pH`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>pH Level</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.1"
                              {...field}
                              onChange={e => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`dryingDays.${index}.moistureQuantity`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Moisture Quantity</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.1"
                              {...field}
                              onChange={e => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-4">Final Processing</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="finalAction"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Final Action</FormLabel>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="flex flex-col space-y-1"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="curing" id="curing" />
                          <Label htmlFor="curing">Curing/Roasting</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="selling" id="selling" />
                          <Label htmlFor="selling">Selling</Label>
                        </div>
                      </RadioGroup>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {form.watch('finalAction') && (
                  <>
                    <FormField
                      control={form.control}
                      name="quantityAfterProcess"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quantity After Process (kg)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.1"
                              {...field}
                              onChange={e => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="dateOfCompletion"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Completion Date</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    'w-full pl-3 text-left font-normal',
                                    !field.value && 'text-muted-foreground'
                                  )}
                                >
                                  {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={date => date > new Date() || date < new Date('1900-01-01')}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saving...' : 'Save Processing'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

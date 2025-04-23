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

const processingFormSchema = z.object({
  processMethod: z.enum(['wet', 'dry']),
  dateOfProcessing: z.date(),
  doneBy: z.string().min(1, 'Required'),
  dryingDays: z
    .array(
      z.object({
        day: z.number().min(1),
        temperature: z.number().min(0),
        humidity: z.number().min(0),
        pH: z.number().min(0),
        moistureQuantity: z.number().min(0),
      })
    )
    .optional(),
  finalAction: z.enum(['curing', 'selling']).optional(),
  quantityAfterProcess: z.number().min(0).optional(),
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
  const [existingDryingDays, setExistingDryingDays] = useState<any[]>([]);
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

  useEffect(() => {
    if (open && procurementId) {
      const fetchDryingDays = async () => {
        try {
          setIsLoading(true);
          const response = await axios.get(`/api/processing/${procurementId}/drying`, { withCredentials: true });
          setExistingDryingDays(response.data.dryingDays);
        } catch (error) {
          console.error('Error fetching drying days:', error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchDryingDays();
    }
  }, [open, procurementId]);

  const onSubmit = async (data: ProcessingFormValues) => {
    try {
      const processingData = {
        procurementId,
        processMethod: data.processMethod,
        dateOfProcessing: data.dateOfProcessing.toISOString(),
        doneBy: data.doneBy,
        dryingDays: data.dryingDays,
        finalAction: data.finalAction,
        quantityAfterProcess: data.quantityAfterProcess,
        dateOfCompletion: data.dateOfCompletion?.toISOString(),
      };

      const response = await fetch('/api/processing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(processingData),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save processing data');
      }

      toast.success('Processing data saved successfully');
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving processing data:', error);
      toast.error('Failed to save processing data');
    }
  };

  const addDryingDay = () => {
    const currentDays = form.getValues('dryingDays') || [];
    const nextDay = currentDays.length > 0 ? Math.max(...currentDays.map(d => d.day)) + 1 : 1;

    form.setValue('dryingDays', [
      ...currentDays,
      {
        day: nextDay,
        temperature: 0,
        humidity: 0,
        pH: 0,
        moistureQuantity: 0,
      },
    ]);
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

              {form.watch('dryingDays')?.map((day, index) => (
                <div key={index} className="mb-4 p-3 border rounded">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium">Day {day.day}</h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const days = form.getValues('dryingDays') || [];
                        form.setValue(
                          'dryingDays',
                          days.filter((_, i) => i !== index)
                        );
                      }}
                    >
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

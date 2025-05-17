'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { type CreateSaleInput as BackendCreateSaleInputType, ProcessingStage } from '@chaya/shared';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@workspace/ui/components/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@workspace/ui/components/form';
import { Input } from '@workspace/ui/components/input';
import { Button } from '@workspace/ui/components/button';
import { Popover, PopoverContent, PopoverTrigger } from '@workspace/ui/components/popover';
import { Calendar } from '@workspace/ui/components/calendar';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@workspace/ui/lib/utils';
import { format } from 'date-fns';
import { toast } from 'sonner';
import axios from 'axios';

const saleFormDialogSchema = z.object({
  quantitySold: z.coerce
    .number({
      required_error: 'Quantity sold is required',
      invalid_type_error: 'Quantity sold must be a number',
    })
    .positive('Quantity sold must be positive'),
  dateOfSale: z.date({
    required_error: 'Date of Sale is required',
    invalid_type_error: "That's not a valid date!",
  }),
});

type SaleFormDialogValues = z.infer<typeof saleFormDialogSchema>;

interface RecordSaleDialogProps {
  processingBatchId: number;
  processingStage: Pick<ProcessingStage, 'id' | 'processingCount' | 'quantityAfterProcess' | 'status'>;
  batchCode: string;
  availableForSaleFromStage: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function RecordSaleDialog({
  processingBatchId,
  processingStage,
  batchCode,
  availableForSaleFromStage,
  open,
  onOpenChange,
  onSuccess,
}: RecordSaleDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<SaleFormDialogValues>({
    resolver: zodResolver(saleFormDialogSchema),
    defaultValues: {
      quantitySold: undefined,
      dateOfSale: new Date(),
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        quantitySold: undefined,
        dateOfSale: new Date(),
      });
    }
  }, [open, form]);

  const onSubmit = async (data: SaleFormDialogValues) => {
    setIsSubmitting(true);
    if (data.quantitySold > availableForSaleFromStage) {
      toast.error(
        `Cannot sell ${data.quantitySold}kg. Only ${availableForSaleFromStage.toFixed(2)}kg available from P${processingStage.processingCount}.`
      );
      setIsSubmitting(false);
      return;
    }

    const payload: BackendCreateSaleInputType = {
      quantitySold: data.quantitySold,
      dateOfSale: data.dateOfSale,
      processingBatchId,
      processingStageId: processingStage.id,
    };
    try {
      await axios.post(`/api/sales`, payload, { withCredentials: true });
      toast.success(
        `Sale of ${data.quantitySold}kg for Batch ${batchCode} (from P${processingStage.processingCount}) recorded.`
      );
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error recording sale:', error);
      toast.error(`Error: ${error.response?.data?.error || 'Failed to record sale'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            Record Sale from Batch {batchCode} - Stage P{processingStage.processingCount}
          </DialogTitle>
          <DialogDescription>
            Available from P{processingStage.processingCount}: {availableForSaleFromStage.toFixed(2)}kg.
            {processingStage.status !== 'FINISHED' && " Note: This stage is not marked 'FINISHED'."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <FormField
              control={form.control}
              name="quantitySold"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity Sold (kg)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder={`Max ${availableForSaleFromStage.toFixed(2)}`}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="dateOfSale"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date of Sale</FormLabel>
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
                      <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || availableForSaleFromStage <= 0}>
                {isSubmitting ? 'Recording...' : 'Record Sale'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

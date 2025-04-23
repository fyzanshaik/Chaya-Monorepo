'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@workspace/ui/components/form';
import { Input } from '@workspace/ui/components/input';
import { Button } from '@workspace/ui/components/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@workspace/ui/components/dialog';
import { RadioGroup, RadioGroupItem } from '@workspace/ui/components/radio-group';
import { Label } from '@workspace/ui/components/label';
import axios from 'axios';
import { toast } from 'sonner';
import type { ProcessingWithRelations } from '../lib/types';

const completeProcessingSchema = z.object({
  action: z.enum(['sell', 'continue']),
  quantityAfterProcess: z.number().min(0, 'Quantity must be positive'),
});

type CompleteProcessingValues = z.infer<typeof completeProcessingSchema>;

export function CompleteProcessingDialog({
  processing,
  open,
  onOpenChange,
  onSuccess,
}: {
  processing: ProcessingWithRelations;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const form = useForm<CompleteProcessingValues>({
    resolver: zodResolver(completeProcessingSchema),
    defaultValues: {
      action: 'sell',
      quantityAfterProcess: processing.quantityAfterProcess || 0,
    },
  });

  const onSubmit = async (data: CompleteProcessingValues) => {
    try {
      await axios.post(`/api/processing/${processing.id}/complete`, data, {
        withCredentials: true,
      });
      toast.success(data.action === 'sell' ? 'Processing marked as finished' : 'Processing continued for next stage');
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error completing processing:', error);
      toast.error('Failed to complete processing');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Complete Processing</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="action"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Action</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="sell" id="sell" />
                        <Label htmlFor="sell">Sell (Finish Processing)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="continue" id="continue" />
                        <Label htmlFor="continue">Continue Processing (Curing/Roasting)</Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                      min="0"
                      {...field}
                      onChange={e => field.onChange(parseFloat(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full">
              Confirm
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

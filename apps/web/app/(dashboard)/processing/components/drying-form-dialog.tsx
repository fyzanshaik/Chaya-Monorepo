"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@workspace/ui/components/form";
import { Input } from "@workspace/ui/components/input";
import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import axios from "axios";
import { toast } from "sonner";
import { useEffect, useState } from "react";

const dryingFormSchema = z.object({
  day: z.number().min(1, "Day must be at least 1"),
  temperature: z.number().min(0, "Temperature must be positive"),
  humidity: z.number().min(0, "Humidity must be positive"),
  pH: z.number().min(0, "pH must be positive"),
  moistureQuantity: z.number().min(0, "Moisture must be positive"),
});

type DryingFormValues = z.infer<typeof dryingFormSchema>;

export function DryingFormDialog({
  processingId,
  open,
  onOpenChange,
  onSuccess,
}: {
  processingId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const [dryingDays, setDryingDays] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const form = useForm<DryingFormValues>({
    resolver: zodResolver(dryingFormSchema),
    defaultValues: {
      day: 1,
      temperature: 0,
      humidity: 0,
      pH: 0,
      moistureQuantity: 0,
    },
  });

  useEffect(() => {
    if (open) {
      const fetchDryingDays = async () => {
        try {
          setLoading(true);
          const response = await fetch(
            `/api/processing/${processingId}/drying`,
            {
              credentials: "include",
            }
          );
          const data = await response.json();
          setDryingDays(data.dryingDays);
        } catch (error) {
          console.error("Error fetching drying days:", error);
        } finally {
          setLoading(false);
        }
      };

      fetchDryingDays();
    }
  }, [open, processingId]);

  useEffect(() => {
    if (dryingDays.length > 0) {
      const nextDay = Math.max(...dryingDays.map(d => d.day)) + 1;
      form.setValue("day", nextDay);
    } else {
      form.setValue("day", 1);
    }
  }, [dryingDays, form]);

  const onSubmit = async (data: DryingFormValues) => {
    try {
      await axios.post(`/api/processing/${processingId}/drying`, data, {
        withCredentials: true,
      });
      toast.success("Drying data added successfully");
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error adding drying data:", error);
      toast.error("Failed to add drying data");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Drying Data</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="day"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Day</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      {...field}
                      onChange={e => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="temperature"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Temperature (°C)</FormLabel>
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

            <FormField
              control={form.control}
              name="humidity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Humidity (%)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      {...field}
                      onChange={e => field.onChange(parseFloat(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="pH"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>pH Level</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      max="14"
                      {...field}
                      onChange={e => field.onChange(parseFloat(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="moistureQuantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Moisture Quantity (kg)</FormLabel>
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

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Adding..." : "Add Drying Data"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

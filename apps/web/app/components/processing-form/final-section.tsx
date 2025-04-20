"use client";

import { Controller, useFormContext } from "react-hook-form";
import { Card, CardContent } from "@workspace/ui/components/card";
import { Label } from "@workspace/ui/components/label";
import { Input } from "@workspace/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { Calendar } from "@workspace/ui/components/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover";
import { CalendarIcon } from "lucide-react";
import { cn } from "@workspace/ui/lib/utils";
import { format } from "date-fns";
import { Button } from "@workspace/ui/components/button";

export function FinalSection() {
  const { register, control, watch } = useFormContext();
  const processMethod = watch("processMethod");

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="quantityAfterProcess">
              Quantity After Process (kg)
            </Label>
            <Input
              type="number"
              step="0.1"
              id="quantityAfterProcess"
              {...register("quantityAfterProcess", { valueAsNumber: true })}
            />
          </div>

          <div>
            <Label htmlFor="dateOfCompletion">Completion Date</Label>
            <Controller
              control={control}
              name="dateOfCompletion"
              render={({ field }) => (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              )}
            />
          </div>

          <div>
            <Label htmlFor="finalAction">Final Action</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select final action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="curing">Curing/Roasting</SelectItem>
                <SelectItem value="selling">Selling</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {processMethod === "dry" && (
            <div className="rounded-md bg-yellow-50 p-4 border border-yellow-100">
              <p className="text-sm text-yellow-700">
                For dry processing, please ensure all drying details are
                properly recorded.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

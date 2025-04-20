"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import type { ProcessingWithRelations } from "../lib/types";
import { format } from "date-fns";
import { Separator } from "@workspace/ui/components/separator";
import { Badge } from "@workspace/ui/components/badge";

interface ProcessingDetailsDialogProps {
  processing: ProcessingWithRelations;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProcessingDetailsDialog({
  processing,
  open,
  onOpenChange,
}: ProcessingDetailsDialogProps) {
  const status = processing.status || "NOT_STARTED";
  const variant = {
    FINISHED: "default",
    RUNNING: "secondary",
    NOT_STARTED: "outline",
  }[status];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Processing Details</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">Batch Information</h3>
              <Separator className="my-2" />
              <div className="grid grid-cols-2 gap-2">
                <div className="text-sm font-medium">Batch No:</div>
                <div className="text-sm">{processing.batchNo}</div>
                <div className="text-sm font-medium">Crop:</div>
                <div className="text-sm">
                  {processing.procurement?.crop || processing.crop}
                </div>
                <div className="text-sm font-medium">Procured Form:</div>
                <div className="text-sm">
                  {processing.procurement?.procuredForm ||
                    processing.procuredForm}
                </div>
                <div className="text-sm font-medium">Quantity:</div>
                <div className="text-sm">
                  {processing.procurement?.quantity || processing.quantity} kg
                </div>
                <div className="text-sm font-medium">Speciality:</div>
                <div className="text-sm">
                  {processing.procurement?.speciality || processing.speciality}
                </div>
                <div className="text-sm font-medium">Lot Number:</div>
                <div className="text-sm">{processing.lotNo}</div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold">Processing Details</h3>
              <Separator className="my-2" />
              <div className="grid grid-cols-2 gap-2">
                <div className="text-sm font-medium">Process Method:</div>
                <div className="text-sm">
                  {processing.processMethod
                    ? processing.processMethod.toUpperCase()
                    : "-"}
                </div>
                <div className="text-sm font-medium">Processing Date:</div>
                <div className="text-sm">
                  {processing.dateOfProcessing
                    ? format(
                        new Date(processing.dateOfProcessing),
                        "dd/MM/yyyy"
                      )
                    : "-"}
                </div>
                <div className="text-sm font-medium">Completion Date:</div>
                <div className="text-sm">
                  {processing.dateOfCompletion
                    ? format(
                        new Date(processing.dateOfCompletion),
                        "dd/MM/yyyy"
                      )
                    : "-"}
                </div>
                <div className="text-sm font-medium">
                  Quantity After Process:
                </div>
                <div className="text-sm">
                  {processing.quantityAfterProcess
                    ? `${processing.quantityAfterProcess} kg`
                    : "-"}
                </div>
                <div className="text-sm font-medium">Done By:</div>
                <div className="text-sm">{processing.doneBy || "-"}</div>
                <div className="text-sm font-medium">Status:</div>
                <div className="text-sm">
                  <Badge variant={variant as any}>
                    {status === "FINISHED"
                      ? "Finished"
                      : status === "RUNNING"
                        ? "Running"
                        : "Not Started"}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {processing.drying && processing.drying.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold">Drying Details</h3>
                <Separator className="my-2" />
                <div className="space-y-4">
                  {processing.drying.map((day, index) => (
                    <div key={index} className="border rounded p-3">
                      <h4 className="font-medium">Day {day.day}</h4>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <div className="text-sm font-medium">Temperature:</div>
                        <div className="text-sm">{day.temperature}°C</div>
                        <div className="text-sm font-medium">Humidity:</div>
                        <div className="text-sm">{day.humidity}%</div>
                        <div className="text-sm font-medium">pH:</div>
                        <div className="text-sm">{day.pH}</div>
                        <div className="text-sm font-medium">Moisture:</div>
                        <div className="text-sm">{day.moistureQuantity}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

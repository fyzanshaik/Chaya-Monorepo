"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import type { ProcurementWithRelations } from "../lib/types";
import { format } from "date-fns";
import { Separator } from "@workspace/ui/components/separator";

interface ProcurementDetailsDialogProps {
  procurement: ProcurementWithRelations;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProcurementDetailsDialog({
  procurement,
  open,
  onOpenChange,
}: ProcurementDetailsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Procurement Details</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">Batch Information</h3>
              <Separator className="my-2" />
              <div className="grid grid-cols-2 gap-2">
                <div className="text-sm font-medium">Batch Code:</div>
                <div className="text-sm">{procurement.batchCode}</div>
                <div className="text-sm font-medium">Crop:</div>
                <div className="text-sm">{procurement.crop}</div>
                <div className="text-sm font-medium">Procured Form:</div>
                <div className="text-sm">{procurement.procuredForm}</div>
                <div className="text-sm font-medium">Speciality:</div>
                <div className="text-sm">{procurement.speciality}</div>
                <div className="text-sm font-medium">Quantity:</div>
                <div className="text-sm">{procurement.quantity} kg</div>
                <div className="text-sm font-medium">Lot Number:</div>
                <div className="text-sm">{procurement.lotNo}</div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold">Procurement Details</h3>
              <Separator className="my-2" />
              <div className="grid grid-cols-2 gap-2">
                <div className="text-sm font-medium">Date:</div>
                <div className="text-sm">
                  {format(new Date(procurement.date), "dd/MM/yyyy")}
                </div>
                <div className="text-sm font-medium">Time:</div>
                <div className="text-sm">
                  {format(new Date(procurement.time), "hh:mm a")}
                </div>
                <div className="text-sm font-medium">Procured By:</div>
                <div className="text-sm">{procurement.procuredBy}</div>
                <div className="text-sm font-medium">Vehicle Number:</div>
                <div className="text-sm">{procurement.vehicleNo}</div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">Farmer Information</h3>
              <Separator className="my-2" />
              <div className="grid grid-cols-2 gap-2">
                <div className="text-sm font-medium">Name:</div>
                <div className="text-sm">{procurement.farmer.name}</div>
                <div className="text-sm font-medium">Village:</div>
                <div className="text-sm">{procurement.farmer.village}</div>
                <div className="text-sm font-medium">Panchayath:</div>
                <div className="text-sm">{procurement.farmer.panchayath}</div>
                <div className="text-sm font-medium">Mandal:</div>
                <div className="text-sm">{procurement.farmer.mandal}</div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold">System Information</h3>
              <Separator className="my-2" />
              <div className="grid grid-cols-2 gap-2">
                <div className="text-sm font-medium">Created At:</div>
                <div className="text-sm">
                  {format(
                    new Date(procurement.createdAt),
                    "dd/MM/yyyy hh:mm a"
                  )}
                </div>
                <div className="text-sm font-medium">Last Updated:</div>
                <div className="text-sm">
                  {format(
                    new Date(procurement.updatedAt),
                    "dd/MM/yyyy hh:mm a"
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

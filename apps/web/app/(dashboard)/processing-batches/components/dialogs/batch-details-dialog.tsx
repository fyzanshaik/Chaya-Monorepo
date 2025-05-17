'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@workspace/ui/components/dialog';
import type { ProcessingBatchWithDetails } from '../../lib/types';
import { useProcessingBatchCache } from '../../context/processing-batch-cache-context';
import { Separator } from '@workspace/ui/components/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@workspace/ui/components/table';
import { Badge } from '@workspace/ui/components/badge';
import { ScrollArea } from '@workspace/ui/components/scroll-area';
import { format } from 'date-fns';

interface BatchDetailsDialogProps {
  batchId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BatchDetailsDialog({ batchId, open, onOpenChange }: BatchDetailsDialogProps) {
  const { getBatchDetails } = useProcessingBatchCache();
  const [batch, setBatch] = useState<ProcessingBatchWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open && batchId) {
      setIsLoading(true);
      getBatchDetails(batchId)
        .then(data => setBatch(data))
        .finally(() => setIsLoading(false));
    } else if (!open) {
      setBatch(null); // Clear data when dialog closes
    }
  }, [open, batchId, getBatchDetails]);

  if (isLoading || !batch) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Loading Batch Details...</DialogTitle>
          </DialogHeader>
          <div className="p-6 text-center">Loading...</div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Batch Details: {batch.batchCode}</DialogTitle>
          <DialogDescription>
            Crop: {batch.crop} | Lot No: {batch.lotNo} | Created By: {batch.createdBy.name} on{' '}
            {format(new Date(batch.createdAt), 'PP')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">Procurements Included ({batch.procurements.length})</h3>
            <Separator />
            <ScrollArea className="h-40 border rounded-md mt-2">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Proc. Code</TableHead>
                    <TableHead>Farmer</TableHead>
                    <TableHead>Village</TableHead>
                    <TableHead>Qty (kg)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {batch.procurements.map(p => (
                    <TableRow key={p.id}>
                      <TableCell>{p.batchCode}</TableCell>
                      <TableCell>{p.farmer.name}</TableCell>
                      <TableCell>{p.farmer.village || 'N/A'}</TableCell>
                      <TableCell className="text-right">{p.quantity.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
            <p className="text-sm font-medium mt-1">
              Total Initial Quantity: {batch.initialBatchQuantity.toFixed(2)} kg
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Processing Stages ({batch.processingStages.length})</h3>
            <Separator />
            {batch.processingStages.map(stage => (
              <div key={stage.id} className="mt-3 border p-3 rounded-md">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-semibold">
                    Stage P{stage.processingCount}{' '}
                    <Badge variant={stage.status === 'FINISHED' ? 'default' : 'secondary'}>{stage.status}</Badge>
                  </h4>
                  <span className="text-xs text-muted-foreground">
                    Method: {stage.processMethod.toUpperCase()} | By: {stage.doneBy}
                  </span>
                </div>
                <p className="text-xs">
                  Started: {format(new Date(stage.dateOfProcessing), 'PPp')}
                  {stage.dateOfCompletion ? ` | Completed: ${format(new Date(stage.dateOfCompletion), 'PPp')}` : ''}
                </p>
                <p className="text-xs">
                  Initial Qty: {stage.initialQuantity.toFixed(2)}kg{' '}
                  {stage.quantityAfterProcess !== null ? `| Yield: ${stage.quantityAfterProcess.toFixed(2)}kg` : ''}
                </p>
                {stage.dryingEntries.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs font-medium mb-1">Drying Entries ({stage.dryingEntries.length}):</p>
                    <ScrollArea className="h-28 border rounded-md">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Day</TableHead>
                            <TableHead>Temp</TableHead>
                            <TableHead>Humid</TableHead>
                            <TableHead>pH</TableHead>
                            <TableHead>Moist%</TableHead>
                            <TableHead>Qty</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {stage.dryingEntries.map(d => (
                            <TableRow key={d.id}>
                              <TableCell>{d.day}</TableCell>
                              <TableCell>{d.temperature}°C</TableCell>
                              <TableCell>{d.humidity}%</TableCell>
                              <TableCell>{d.pH}</TableCell>
                              <TableCell>{d.moisturePercentage}%</TableCell>
                              <TableCell>{d.currentQuantity.toFixed(2)}kg</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Sales Recorded ({batch.sales.length})</h3>
            <Separator />
            {batch.sales.length > 0 ? (
              <ScrollArea className="h-32 border rounded-md mt-2">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>From P#</TableHead>
                      <TableHead>Qty Sold (kg)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {batch.sales.map(s => (
                      <TableRow key={s.id}>
                        <TableCell>{format(new Date(s.dateOfSale), 'PP')}</TableCell>
                        <TableCell>P{s.processingStage.processingCount}</TableCell>
                        <TableCell className="text-right">{s.quantitySold.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            ) : (
              <p className="text-sm text-muted-foreground mt-2">No sales recorded for this batch yet.</p>
            )}
            <p className="text-sm font-medium mt-1">
              Total Sold from Batch: {batch.totalQuantitySoldFromBatch.toFixed(2)} kg
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

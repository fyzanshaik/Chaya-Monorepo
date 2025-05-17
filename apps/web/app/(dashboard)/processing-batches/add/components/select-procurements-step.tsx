'use client';

import { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { useProcessingBatchFormStore } from '@/app/stores/processing-batch-form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@workspace/ui/components/card';
import { Checkbox } from '@workspace/ui/components/checkbox';
import { Label } from '@workspace/ui/components/label';
import { Input } from '@workspace/ui/components/input';
import { ScrollArea } from '@workspace/ui/components/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@workspace/ui/components/table';
import { toast } from 'sonner';
import type { Procurement } from '@chaya/shared'; // Ensure Prisma types are exported and available
import { format } from 'date-fns';

interface ProcurementWithFarmer extends Procurement {
  farmer: { name: string; village: string };
}

export function SelectProcurementsStep() {
  const {
    selectedCrop,
    selectedLotNo,
    availableProcurements,
    selectedProcurementIds,
    setAvailableProcurements,
    toggleSelectedProcurement,
  } = useProcessingBatchFormStore();

  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState(''); // For client-side search by survey number or farmer name

  useEffect(() => {
    const fetchProcurements = async () => {
      if (!selectedCrop || !selectedLotNo) {
        setAvailableProcurements([]);
        return;
      }
      setIsLoading(true);
      try {
        const response = await axios.get<{ procurements: ProcurementWithFarmer[] }>(`/api/procurements/unbatched`, {
          params: { crop: selectedCrop, lotNo: selectedLotNo },
          withCredentials: true,
        });
        setAvailableProcurements(response.data.procurements);
      } catch (error) {
        console.error('Error fetching unbatched procurements:', error);
        toast.error('Failed to load procurements for selection.');
        setAvailableProcurements([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProcurements();
  }, [selectedCrop, selectedLotNo, setAvailableProcurements]);

  const filteredProcurements = useMemo(() => {
    if (!searchTerm.trim()) {
      return availableProcurements;
    }
    const lowerSearchTerm = searchTerm.toLowerCase();
    return availableProcurements.filter(
      p =>
        (p as ProcurementWithFarmer).farmer.name.toLowerCase().includes(lowerSearchTerm) ||
        p.batchCode.toLowerCase().includes(lowerSearchTerm) || // Assuming survey number is part of batchCode or another field
        p.id.toString().includes(lowerSearchTerm)
    );
  }, [availableProcurements, searchTerm]);

  const totalSelectedQuantity = useMemo(() => {
    return availableProcurements
      .filter(p => selectedProcurementIds.includes(p.id))
      .reduce((sum, p) => sum + p.quantity, 0);
  }, [availableProcurements, selectedProcurementIds]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Step 2: Select Procurements</CardTitle>
        <CardDescription>
          Select the procurements matching '{selectedCrop}' - Lot {selectedLotNo} to include in this batch.
        </CardDescription>
        {totalSelectedQuantity > 0 && (
          <p className="text-sm font-medium mt-2">Total Selected Quantity: {totalSelectedQuantity.toFixed(2)} kg</p>
        )}
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <Input
            placeholder="Search by Farmer Name, Procurement ID/BatchCode..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        {isLoading && <p>Loading procurements...</p>}
        {!isLoading && filteredProcurements.length === 0 && (
          <p className="text-muted-foreground">
            No unbatched procurements found for the selected crop and lot number, or matching your search.
          </p>
        )}
        {!isLoading && filteredProcurements.length > 0 && (
          <ScrollArea className="h-[300px] border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">Select</TableHead>
                  <TableHead>Proc. ID / Code</TableHead>
                  <TableHead>Farmer</TableHead>
                  <TableHead>Village</TableHead>
                  <TableHead>Quantity (kg)</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProcurements.map(proc => (
                  <TableRow key={proc.id}>
                    <TableCell>
                      <Checkbox
                        id={`proc-${proc.id}`}
                        checked={selectedProcurementIds.includes(proc.id)}
                        onCheckedChange={() => toggleSelectedProcurement(proc.id)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      {proc.batchCode} (ID: {proc.id})
                    </TableCell>
                    <TableCell>{(proc as ProcurementWithFarmer).farmer.name}</TableCell>
                    <TableCell>{(proc as ProcurementWithFarmer).farmer.village}</TableCell>
                    <TableCell className="text-right">{proc.quantity.toFixed(2)}</TableCell>
                    <TableCell>{format(new Date(proc.date), 'dd/MM/yyyy')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

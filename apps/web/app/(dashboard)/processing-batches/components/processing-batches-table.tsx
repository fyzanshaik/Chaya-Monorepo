'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  ColumnFiltersState,
  getFilteredRowModel,
  SortingState,
  getSortedRowModel,
} from '@tanstack/react-table';
import { batchColumns } from '../lib/columns-batch';
import type { ProcessingBatchWithSummary, ProcessingStageWithDrying } from '../lib/types';
import { useProcessingBatchCache } from '../context/processing-batch-cache-context';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@workspace/ui/components/table';
import { Button } from '@workspace/ui/components/button';
import { ScrollArea } from '@workspace/ui/components/scroll-area';
import { toast } from 'sonner';
import { RefreshCw, Eye, Wind, CheckSquare, ShoppingCart, Layers, Trash2, ArrowUpDown } from 'lucide-react';
import { useAuth } from '@/app/providers/auth-provider';
import { ColumnFilter } from '@/app/(dashboard)/procurements/components/column-filter'; // Reusable
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@workspace/ui/components/alert-dialog';
import axios from 'axios'; // For delete operations if not using server actions

// Import Dialogs
import { BatchDetailsDialog } from './dialogs/batch-details-dialog';
import { AddDryingDialog } from './dialogs/add-drying-dialog';
import { FinalizeStageDialog } from './dialogs/finalize-stage-dialog';
import { StartNextStageDialog } from './dialogs/start-next-stage-dialog';
import { RecordSaleDialog } from './dialogs/record-sale-dialog';

interface ProcessingBatchesTableProps {
  query: string;
  currentPage: number;
  statusFilter: string;
}

export default function ProcessingBatchesTable({ query, currentPage, statusFilter }: ProcessingBatchesTableProps) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const { fetchProcessingBatchesSummary, refreshCurrentPageSummary, clearBatchDetailCache } = useProcessingBatchCache();

  const [records, setRecords] = useState<ProcessingBatchWithSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sorting, setSorting] = React.useState<SortingState>([{ id: 'createdAt', desc: true }]); // Default sort
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState({});

  const [selectedBatchForAction, setSelectedBatchForAction] = useState<ProcessingBatchWithSummary | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showAddDryingDialog, setShowAddDryingDialog] = useState(false);
  const [showFinalizeStageDialog, setShowFinalizeStageDialog] = useState(false);
  const [showStartNextStageDialog, setShowStartNextStageDialog] = useState(false);
  const [showRecordSaleDialog, setShowRecordSaleDialog] = useState(false);
  const [showDeleteBatchDialog, setShowDeleteBatchDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchData = useCallback(
    async (page: number, q: string, status: string) => {
      setLoading(true);
      try {
        const data = await fetchProcessingBatchesSummary(page, q, status);
        setRecords(data);
      } catch (error) {
        toast.error('Failed to load processing batches.');
      } finally {
        setLoading(false);
      }
    },
    [fetchProcessingBatchesSummary]
  );

  const handleRefresh = useCallback(async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      const freshData = await refreshCurrentPageSummary(currentPage, query, statusFilter);
      setRecords(freshData);
      toast.success('Data refreshed successfully');
      // Clear specific detail cache if a modified batch was in it
      if (selectedBatchForAction) clearBatchDetailCache(selectedBatchForAction.id);
    } catch (error) {
      toast.error('Failed to refresh data.');
    } finally {
      setRefreshing(false);
    }
  }, [
    refreshing,
    currentPage,
    query,
    statusFilter,
    refreshCurrentPageSummary,
    selectedBatchForAction,
    clearBatchDetailCache,
  ]);

  useEffect(() => {
    fetchData(currentPage, query, statusFilter);
  }, [fetchData, currentPage, query, statusFilter]);

  useEffect(() => {
    const handleDataChange = () => handleRefresh();
    document.addEventListener('processingBatchDataChanged', handleDataChange);
    return () => document.removeEventListener('processingBatchDataChanged', handleDataChange);
  }, [handleRefresh]);

  const table = useReactTable({
    data: records,
    columns: batchColumns,
    state: { sorting, columnFilters, columnVisibility },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    manualPagination: true, // Since pagination is handled by URL params & cache context
  });

  const openDialog = (
    dialogSetter: React.Dispatch<React.SetStateAction<boolean>>,
    batch: ProcessingBatchWithSummary
  ) => {
    setSelectedBatchForAction(batch);
    dialogSetter(true);
  };

  const confirmDeleteBatch = async () => {
    if (!selectedBatchForAction) return;
    setIsDeleting(true);
    try {
      await axios.delete(`/api/processing-batches/${selectedBatchForAction.id}`, { withCredentials: true });
      toast.success(`Batch ${selectedBatchForAction.batchCode} deleted.`);
      setShowDeleteBatchDialog(false);
      handleRefresh(); // Refresh list
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete batch.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Calculate available for sale from the specific stage's yield (quantityAfterProcess)
  // This needs the full batch details to accurately determine prior sales *from that specific stage*.
  // For simplicity in table actions, we pass what the LATEST stage could offer.
  // A more precise calculation needs the detail dialog logic.
  const getAvailableForSaleFromLatestFinishedStage = (batch: ProcessingBatchWithSummary): number => {
    if (batch.latestStageSummary?.status === 'FINISHED') {
      // This is a simplification. Backend sales check is more robust.
      // This `quantityAfterProcess` is the *yield of that stage*. Sales reduce the overall batch quantity.
      return batch.latestStageSummary.quantityAfterProcess || 0;
    }
    return 0;
  };

  if (loading && records.length === 0) {
    return <div className="p-4 text-center">Loading processing batches...</div>; // Simplified loading state
  }

  return (
    <div className="mt-6 space-y-4">
      <div className="flex justify-between items-center">
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing || loading} className="h-8">
          <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
        <ColumnFilter table={table} />
      </div>
      <ScrollArea className="rounded-md border h-[calc(100vh-350px)] w-full">
        {' '}
        {/* Adjust height as needed */}
        <Table>
          <TableHeader className="sticky top-0 bg-secondary z-10">
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <TableHead key={header.id} className="whitespace-nowrap">
                    {header.isPlaceholder ? null : (
                      <div
                        className={header.column.getCanSort() ? 'cursor-pointer select-none flex items-center' : ''}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getCanSort() && <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />}
                      </div>
                    )}
                  </TableHead>
                ))}
                <TableHead className="sticky right-0 bg-secondary z-10">Actions</TableHead>
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map(row => (
                <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                  {row.getVisibleCells().map(cell => (
                    <TableCell key={cell.id} className="whitespace-nowrap">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                  <TableCell className="sticky right-0 bg-background z-0 flex items-center gap-1 py-1.5">
                    {' '}
                    {/* bg-background for row scroll */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openDialog(setShowDetailsDialog, row.original)}
                      title="View Details"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {row.original.latestStageSummary?.status === 'IN_PROGRESS' && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openDialog(setShowAddDryingDialog, row.original)}
                          title="Add Drying Data"
                        >
                          <Wind className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openDialog(setShowFinalizeStageDialog, row.original)}
                          title="Finalize Stage"
                        >
                          <CheckSquare className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    {row.original.latestStageSummary?.status === 'FINISHED' && (
                      <>
                        {(row.original.latestStageSummary.quantityAfterProcess || 0) >
                          0 /* Can only start next stage if there is yield */ && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openDialog(setShowStartNextStageDialog, row.original)}
                            title="Start Next Stage"
                          >
                            <Layers className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openDialog(setShowRecordSaleDialog, row.original)}
                          title="Record Sale"
                          disabled={getAvailableForSaleFromLatestFinishedStage(row.original) <= 0}
                        >
                          <ShoppingCart className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    {isAdmin && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => openDialog(setShowDeleteBatchDialog, row.original)}
                        title="Delete Batch"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={batchColumns.length + 1} className="h-24 text-center">
                  No batches found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </ScrollArea>

      {/* Dialogs */}
      {selectedBatchForAction && (
        <>
          <BatchDetailsDialog
            batchId={selectedBatchForAction.id}
            open={showDetailsDialog}
            onOpenChange={setShowDetailsDialog}
          />

          {selectedBatchForAction.latestStageSummary && showAddDryingDialog && (
            <AddDryingDialog
              processingStageId={selectedBatchForAction.latestStageSummary.id}
              batchCode={selectedBatchForAction.batchCode}
              processingCount={selectedBatchForAction.latestStageSummary.processingCount}
              open={showAddDryingDialog}
              onOpenChange={setShowAddDryingDialog}
              onSuccess={handleRefresh}
            />
          )}
          {selectedBatchForAction.latestStageSummary && showFinalizeStageDialog && (
            <FinalizeStageDialog
              processingStageId={selectedBatchForAction.latestStageSummary.id}
              batchCode={selectedBatchForAction.batchCode}
              processingCount={selectedBatchForAction.latestStageSummary.processingCount}
              currentInitialQuantity={selectedBatchForAction.latestStageSummary.initialQuantity}
              open={showFinalizeStageDialog}
              onOpenChange={setShowFinalizeStageDialog}
              onSuccess={handleRefresh}
            />
          )}
          {selectedBatchForAction.latestStageSummary &&
            showStartNextStageDialog &&
            selectedBatchForAction.latestStageSummary.status === 'FINISHED' && (
              <StartNextStageDialog
                processingBatchId={selectedBatchForAction.id}
                batchCode={selectedBatchForAction.batchCode}
                previousStageId={selectedBatchForAction.latestStageSummary.id}
                previousProcessingCount={selectedBatchForAction.latestStageSummary.processingCount}
                previousStageYield={selectedBatchForAction.latestStageSummary.quantityAfterProcess || 0}
                open={showStartNextStageDialog}
                onOpenChange={setShowStartNextStageDialog}
                onSuccess={handleRefresh}
              />
            )}
          {selectedBatchForAction.latestStageSummary &&
            showRecordSaleDialog &&
            selectedBatchForAction.latestStageSummary.status === 'FINISHED' && (
              <RecordSaleDialog
                processingBatchId={selectedBatchForAction.id}
                processingStage={selectedBatchForAction.latestStageSummary as any} // Casting needed if types don't fully align for dialog props
                batchCode={selectedBatchForAction.batchCode}
                availableForSaleFromStage={getAvailableForSaleFromLatestFinishedStage(selectedBatchForAction)}
                open={showRecordSaleDialog}
                onOpenChange={setShowRecordSaleDialog}
                onSuccess={handleRefresh}
              />
            )}
        </>
      )}

      <AlertDialog open={showDeleteBatchDialog} onOpenChange={setShowDeleteBatchDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Batch: {selectedBatchForAction?.batchCode}?</AlertDialogTitle>
            <AlertDialogDescription>
              This action is irreversible. All stages, drying data, and sales for this batch will be deleted.
              Procurements will be unlinked.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={confirmDeleteBatch}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete Batch'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

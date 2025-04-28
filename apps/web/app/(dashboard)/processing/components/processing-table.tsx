'use client';

import { useEffect, useState } from 'react';
import { useReactTable, getCoreRowModel, flexRender } from '@tanstack/react-table';
import { columns, defaultVisibleColumns } from '../lib/columns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@workspace/ui/components/table';
import { toast } from 'sonner';
import type { ProcessingWithRelations } from '../lib/types';
import { Button } from '@workspace/ui/components/button';
import { PlusCircle, RefreshCw, Eye } from 'lucide-react';
import { ProcessingFormDialog } from './processing-form-dialog';
import { ProcessingDetailsDialog } from './processing-details-dialog';
import { DryingFormDialog } from './drying-form-dialog';
import { CompleteProcessingDialog } from './complete-processing-dialog';
import { useProcessingCache } from '../context/processing-cache-context';
import { ColumnFilter } from './column-filter';
import { ScrollArea } from '@workspace/ui/components/scroll-area';

export default function ProcessingTable({ query, currentPage }: { query: string; currentPage: number }) {
  const { fetchProcessingRecords, refreshCurrentPage } = useProcessingCache();
  const [records, setRecords] = useState<ProcessingWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<ProcessingWithRelations | null>(null);
  const [viewingRecord, setViewingRecord] = useState<ProcessingWithRelations | null>(null);
  const [showProcessingForm, setShowProcessingForm] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showDryingForm, setShowDryingForm] = useState(false);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);

  const [columnVisibility, setColumnVisibility] = useState(() => {
    const initialVisibility: Record<string, boolean> = {};
    defaultVisibleColumns.forEach(col => {
      initialVisibility[col] = true;
    });
    return initialVisibility;
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchProcessingRecords(currentPage, query);
      setRecords(data);
    } catch (error) {
      toast.error('Failed to load processing records. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (refreshing) return;

    setRefreshing(true);
    try {
      const freshData = await refreshCurrentPage(currentPage, query);
      setRecords(freshData);
      toast.success('Data refreshed successfully');
    } catch (error) {
      toast.error('Failed to refresh data. Please try again.');
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [fetchProcessingRecords, currentPage, query]);

  const table = useReactTable({
    data: records,
    columns,
    state: {
      columnVisibility,
    },
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
  });

  const handleViewDetails = (record: ProcessingWithRelations) => {
    setViewingRecord(record);
    setShowViewDialog(true);
  };

  const handleStartProcessing = (record: ProcessingWithRelations) => {
    setSelectedRecord(record);
    setShowProcessingForm(true);
  };

  const handleAddDrying = (record: ProcessingWithRelations) => {
    setSelectedRecord(record);
    setShowDryingForm(true);
  };

  const handleCompleteProcessing = (record: ProcessingWithRelations) => {
    setSelectedRecord(record);
    setShowCompleteDialog(true);
  };

  if (loading && records.length === 0) {
    return (
      <div className="mt-6 space-y-4">
        <div className="flex justify-between items-center">
          <div className="w-24 h-8 bg-gray-200 rounded animate-pulse"></div>
          <div className="w-28 h-8 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="rounded-md border">
          <div className="h-12 border-b bg-secondary px-4 flex items-center">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded w-32 mx-4 animate-pulse"></div>
            ))}
          </div>
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="border-b px-4 py-4 flex items-center">
              {Array.from({ length: 6 }).map((_, j) => (
                <div key={j} className="h-4 bg-gray-200 rounded w-32 mx-4 animate-pulse"></div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing || loading}
            className="h-8 ml-2"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
        <ColumnFilter table={table} />
      </div>
      <div className="rounded-md border overflow-x-auto">
        <ScrollArea className="h-[calc(100vh-350px)] w-full">
          <Table className="min-w-max">
            <TableHeader className="sticky top-0 bg-secondary">
              {table.getHeaderGroups().map(headerGroup => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                  <TableHead>Actions</TableHead>
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map(row => (
                  <TableRow key={row.id} onDoubleClick={() => handleViewDetails(row.original)}>
                    {row.getVisibleCells().map(cell => (
                      <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                    ))}
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(row.original)}
                          className="h-8 w-8 p-0"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {!row.original.id && (
                          <Button size="sm" onClick={() => handleStartProcessing(row.original)} className="h-8">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Start Processing
                          </Button>
                        )}
                        {row.original.id && row.original.status !== 'FINISHED' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAddDrying(row.original)}
                              className="h-8"
                            >
                              Add Drying
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCompleteProcessing(row.original)}
                              className="h-8"
                            >
                              Complete
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length + 1} className="h-24 text-center">
                    {loading || refreshing ? 'Loading...' : 'No records found.'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>

      {selectedRecord && showProcessingForm && (
        <ProcessingFormDialog
          procurementId={selectedRecord.procurementId}
          open={showProcessingForm}
          onOpenChange={setShowProcessingForm}
          onSuccess={loadData}
        />
      )}

      {viewingRecord && (
        <ProcessingDetailsDialog processing={viewingRecord} open={showViewDialog} onOpenChange={setShowViewDialog} />
      )}

      {selectedRecord && showDryingForm && selectedRecord.id && (
        <DryingFormDialog
          processingId={selectedRecord.id}
          open={showDryingForm}
          onOpenChange={setShowDryingForm}
          onSuccess={loadData}
        />
      )}

      {selectedRecord && showCompleteDialog && selectedRecord.id && (
        <CompleteProcessingDialog
          processing={selectedRecord}
          open={showCompleteDialog}
          onOpenChange={setShowCompleteDialog}
          onSuccess={loadData}
        />
      )}
    </div>
  );
}

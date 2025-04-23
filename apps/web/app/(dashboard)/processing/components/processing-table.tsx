'use client';

import { useEffect, useState } from 'react';
import { useReactTable, getCoreRowModel, flexRender } from '@tanstack/react-table';
import { columns } from '../lib/columns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@workspace/ui/components/table';
import { toast } from 'sonner';
import type { ProcessingWithRelations } from '../lib/types';
import { Button } from '@workspace/ui/components/button';
import { PlusCircle } from 'lucide-react';
import { ProcessingFormDialog } from './processing-form-dialog';
import { useProcessingCache } from '../context/processing-cache-context';

export default function ProcessingTable({ query, currentPage }: { query: string; currentPage: number }) {
  const { fetchProcessingRecords } = useProcessingCache();
  const [records, setRecords] = useState<ProcessingWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState<ProcessingWithRelations | null>(null);
  const [showProcessingForm, setShowProcessingForm] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchProcessingRecords(currentPage, query);
      setRecords(data);
    } catch (error) {
      console.error('Error loading processing records:', error);
      toast.error('Failed to load processing records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [fetchProcessingRecords, currentPage, query]);

  const table = useReactTable({
    data: records,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="mt-6 space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <TableHead key={header.id}>
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
                <TableHead>Actions</TableHead>
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map(row => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map(cell => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                  <TableCell>
                    {!row.original.processing && (
                      <Button
                        size="sm"
                        onClick={() => {
                          // Pass the entire record to access procurementId
                          setSelectedRecord(row.original);
                          setShowProcessingForm(true);
                        }}
                      >
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Start Processing
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length + 1} className="h-24 text-center">
                  No records found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {selectedRecord && (
        <ProcessingFormDialog
          procurementId={selectedRecord.procurementId}
          open={showProcessingForm}
          onOpenChange={setShowProcessingForm}
          onSuccess={() => {
            loadData();
          }}
        />
      )}
    </div>
  );
}

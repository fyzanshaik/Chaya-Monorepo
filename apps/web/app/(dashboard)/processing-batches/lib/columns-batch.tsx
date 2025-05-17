'use client';

import type { ColumnDef } from '@tanstack/react-table';
import type { ProcessingBatchWithSummary } from './types'; // Ensure this type is correctly defined
import { Badge } from '@workspace/ui/components/badge';
import { format } from 'date-fns';
import { Checkbox } from '@workspace/ui/components/checkbox'; // If selection is needed for bulk actions

export const defaultVisibleBatchColumns = [
  // 'select', // if bulk actions are planned
  'batchCode',
  'crop',
  'lotNo',
  'latestStageStatus',
  'latestStageCount',
  'netAvailableFromBatch',
  'totalQuantitySoldFromBatch',
  'createdAt',
];

export const batchColumns: ColumnDef<ProcessingBatchWithSummary>[] = [
  // Example selection column if needed for bulk delete (admin only)
  // {
  //   id: 'select',
  //   header: ({ table }) => (
  //     <Checkbox
  //       checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')}
  //       onCheckedChange={value => table.toggleAllPageRowsSelected(!!value)}
  //       aria-label="Select all"
  //     />
  //   ),
  //   cell: ({ row }) => (
  //     <Checkbox
  //       checked={row.getIsSelected()}
  //       onCheckedChange={value => row.toggleSelected(!!value)}
  //       aria-label="Select row"
  //     />
  //   ),
  //   enableSorting: false,
  //   enableHiding: false,
  // },
  {
    accessorKey: 'batchCode',
    header: 'Batch Code',
    cell: ({ row }) => <div className="font-medium">{row.original.batchCode}</div>,
  },
  {
    accessorKey: 'crop',
    header: 'Crop',
    cell: ({ row }) => row.original.crop,
  },
  {
    accessorKey: 'lotNo',
    header: 'Lot No.',
    cell: ({ row }) => row.original.lotNo,
  },
  {
    accessorKey: 'latestStageCount',
    header: 'Stage (P#)',
    cell: ({ row }) =>
      row.original.latestStageSummary ? `P${row.original.latestStageSummary.processingCount}` : 'N/A',
  },
  {
    accessorKey: 'latestStageStatus',
    header: 'Current Status',
    cell: ({ row }) => {
      const status = row.original.latestStageSummary?.status;
      if (!status) return <Badge variant="outline">No Stages</Badge>;

      const variantMap: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
        IN_PROGRESS: 'secondary',
        FINISHED: 'default',
        CANCELLED: 'destructive',
      };
      return <Badge variant={variantMap[status] || 'outline'}>{status.replace('_', ' ')}</Badge>;
    },
  },
  {
    accessorKey: 'netAvailableFromBatch',
    header: 'Net Available (kg)',
    cell: ({ row }) => <div className="text-right">{row.original.netAvailableFromBatch.toFixed(2)}</div>,
  },
  {
    accessorKey: 'currentStageDisplayQuantity',
    header: 'Current Stage Qty (kg)',
    cell: ({ row }) => <div className="text-right">{row.original.currentStageDisplayQuantity.toFixed(2)}</div>,
  },
  {
    accessorKey: 'totalQuantitySoldFromBatch',
    header: 'Total Sold (kg)',
    cell: ({ row }) => {
      const totalSold = row.original.totalQuantitySoldFromBatch;
      const displayValue = (typeof totalSold === 'number' ? totalSold : 0).toFixed(2);
      return <div className="text-right">{displayValue}</div>;
    },
  },
  {
    accessorKey: 'initialBatchQuantity',
    header: 'Initial Batch (kg)',
    cell: ({ row }) => <div className="text-right">{row.original.initialBatchQuantity.toFixed(2)}</div>,
  },
  {
    accessorKey: 'createdAt',
    header: 'Created On',
    cell: ({ row }) => format(new Date(row.original.createdAt), 'dd/MM/yyyy'),
  },
];

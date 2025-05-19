'use client';

import type { ColumnDef } from '@tanstack/react-table';
import type { ProcessingBatchWithSummary, ExtendedProcessingStageStatus } from './types';
import { Badge } from '@workspace/ui/components/badge';
import { format } from 'date-fns';

export const defaultVisibleBatchColumns = [
  'batchCode',
  'crop',
  'lotNo',
  'latestStageStatus',
  'latestStageCount',
  'netAvailableQuantity',
  'totalQuantitySoldFromBatch',
  'createdAt',
];

export const batchColumns: ColumnDef<ProcessingBatchWithSummary>[] = [
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
      const status: ExtendedProcessingStageStatus | undefined = row.original.latestStageSummary?.status;
      if (!status) return <Badge variant="outline">No Stages</Badge>;

      let displayStatus = status.toString().replace('_', ' ');
      let variant: 'default' | 'secondary' | 'destructive' | 'outline' = 'outline';

      switch (status) {
        case 'IN_PROGRESS':
          variant = 'secondary';
          displayStatus = 'In Progress';
          break;
        case 'FINISHED':
          variant = 'default';
          break;
        case 'CANCELLED':
          variant = 'destructive';
          break;
        case 'SOLD_OUT':
          variant = 'default';
          displayStatus = 'Sold Out';
          break;
        case 'NO_STAGES':
          variant = 'outline';
          displayStatus = 'No Stages';
          break;
        default:
          variant = 'outline';
      }
      return <Badge variant={variant}>{displayStatus}</Badge>;
    },
  },
  {
    accessorKey: 'netAvailableQuantity',
    header: 'Remaining Qty (kg)',
    cell: ({ row }) => <div className="text-right">{row.original.netAvailableQuantity.toFixed(2)}</div>,
  },
  {
    accessorKey: 'totalQuantitySoldFromBatch',
    header: 'Total Sold (kg)',
    cell: ({ row }) => <div className="text-right">{row.original.totalQuantitySoldFromBatch.toFixed(2)}</div>,
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

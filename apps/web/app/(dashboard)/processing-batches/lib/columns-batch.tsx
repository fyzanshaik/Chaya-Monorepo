'use client';

import type { ColumnDef } from '@tanstack/react-table';
import type { ProcessingBatchWithSummary, ExtendedProcessingStageStatus } from './types';
import { Badge } from '@workspace/ui/components/badge';
import { format } from 'date-fns';

export const defaultVisibleBatchColumns = [
  'batchCode',
  'crop',
  'lotNo',
  'latestStageStatus', // Changed from latestStage.status to this
  'latestStageCount',
  'netAvailableQuantity',
  // 'totalQuantitySoldFromBatch', // Often this is less relevant in summary than net from stage
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
    accessorKey: 'latestStageStatus', // This now comes directly from summary
    header: 'Current Status',
    cell: ({ row }) => {
      const status: ExtendedProcessingStageStatus | undefined = row.original.latestStageSummary?.status;
      if (!status) return <Badge variant="outline">No Stages</Badge>;

      let displayStatus = status.toString().replace(/_/g, ' ');
      let variant: 'default' | 'secondary' | 'destructive' | 'outline' = 'outline';

      switch (status) {
        case 'IN_PROGRESS':
          variant = 'secondary';
          displayStatus = 'In Progress';
          break;
        case 'FINISHED':
          variant = 'default'; // Assuming green/blue for default is "good"
          break;
        case 'SOLD_OUT':
          variant = 'default'; // Visually similar to finished, or choose another like outline with specific text
          displayStatus = 'Sold Out';
          break;
        case 'CANCELLED':
          variant = 'destructive';
          break;
        case 'NO_STAGES': // Should be covered by !status check already
        default:
          variant = 'outline';
          break;
      }
      return <Badge variant={variant}>{displayStatus}</Badge>;
    },
  },
  {
    accessorKey: 'netAvailableQuantity', // This is now "Net Available from Latest Stage"
    header: 'Avail. from Stage (kg)', // Renamed header for clarity
    cell: ({ row }) => <div className="text-right">{row.original.netAvailableQuantity.toFixed(2)}</div>,
  },
  // { // This can be added back if needed, but might clutter the summary view
  //   accessorKey: 'totalQuantitySoldFromBatch',
  //   header: 'Total Batch Sold (kg)',
  //   cell: ({ row }) => <div className="text-right">{row.original.totalQuantitySoldFromBatch.toFixed(2)}</div>,
  // },
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

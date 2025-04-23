'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { Checkbox } from '@workspace/ui/components/checkbox';
import type { ProcessingWithRelations, ProcessingStatus } from './types';
import { format } from 'date-fns';
import { Badge } from '@workspace/ui/components/badge';

export const defaultVisibleColumns = [
  'select',
  'lotNo',
  'batchNo',
  'processingCount',
  'crop',
  'procuredForm',
  'quantity',
  'speciality',
  'processMethod',
  'dateOfProcessing',
  'dateOfCompletion',
  'doneBy',
  'status',
];

export const columns: ColumnDef<ProcessingWithRelations>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')}
        onCheckedChange={value => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={value => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'lotNo',
    header: 'Lot No',
    cell: ({ row }) => <div>{row.getValue('lotNo')}</div>,
  },
  {
    accessorKey: 'batchNo',
    header: 'Batch No',
    cell: ({ row }) => <div className="font-medium">{row.getValue('batchNo')}</div>,
  },
  {
    accessorKey: 'crop',
    header: 'Crop',
    cell: ({ row }) => <div>{row.original.procurement?.crop || row.getValue('crop')}</div>,
  },
  {
    accessorKey: 'procuredForm',
    header: 'Procured Form',
    cell: ({ row }) => <div>{row.original.procurement?.procuredForm || row.getValue('procuredForm')}</div>,
  },
  {
    accessorKey: 'quantity',
    header: 'Quantity (kg)',
    cell: ({ row }) => <div>{row.original.procurement?.quantity || row.getValue('quantity')}</div>,
  },
  {
    accessorKey: 'speciality',
    header: 'Speciality',
    cell: ({ row }) => <div>{row.original.procurement?.speciality || row.getValue('speciality')}</div>,
  },
  {
    accessorKey: 'processMethod',
    header: 'Process Method',
    cell: ({ row }) => <div>{row.original.processMethod ? row.original.processMethod.toUpperCase() : '-'}</div>,
  },
  {
    accessorKey: 'dateOfProcessing',
    header: 'Processing Date',
    cell: ({ row }) => (
      <div>{row.original.dateOfProcessing ? format(new Date(row.original.dateOfProcessing), 'dd/MM/yyyy') : '-'}</div>
    ),
  },
  {
    accessorKey: 'dateOfCompletion',
    header: 'Completion Date',
    cell: ({ row }) => (
      <div>{row.original.dateOfCompletion ? format(new Date(row.original.dateOfCompletion), 'dd/MM/yyyy') : '-'}</div>
    ),
  },
  {
    accessorKey: 'doneBy',
    header: 'Done By',
    cell: ({ row }) => <div>{row.original.doneBy || '-'}</div>,
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status: ProcessingStatus = row.original.status ? (row.original.status as ProcessingStatus) : 'NOT_STARTED';

      const variant = {
        FINISHED: 'default',
        RUNNING: 'secondary',
        NOT_STARTED: 'outline',
      }[status];

      return (
        <Badge variant={variant as any}>
          {status === 'FINISHED' ? 'Finished' : status === 'RUNNING' ? 'Running' : 'Not Started'}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'processingCount',
    header: 'Process Count',
    cell: ({ row }) => <div className="text-center">{row.original.processingCount || 1}</div>,
  },
];

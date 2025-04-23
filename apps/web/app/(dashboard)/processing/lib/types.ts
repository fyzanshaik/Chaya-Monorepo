import type { Processing, Procurement, Drying } from '@chaya/shared';

export interface ProcessingWithRelations extends Processing {
  processing: any;
  procurement: Pick<Procurement, 'batchCode' | 'crop' | 'quantity' | 'speciality' | 'procuredForm' | 'lotNo'>;
  drying: Drying[];
  processingCount: number;
}

export type ProcessingStatus = 'NOT_STARTED' | 'RUNNING' | 'FINISHED';

import type { ProcessingBatch, Procurement, ProcessingStage, Drying, Sale, User } from '@chaya/shared';

// For list view, summarizing the latest stage and overall availability
export interface ProcessingBatchWithSummary extends ProcessingBatch {
  latestStageSummary: {
    id: number;
    processingCount: number;
    status: ProcessingStage['status'];
    processMethod: string;
    dateOfProcessing: Date;
    doneBy: string;
    initialQuantity: number;
    quantityAfterProcess: number | null; // Yield of this specific stage
    lastDryingQuantity: number | null; // if IN_PROGRESS and has drying data
  } | null;
  totalQuantitySoldFromBatch: number;
  currentStageDisplayQuantity: number; // Qty this stage currently represents (e.g., from last drying or yield if finished)
  netAvailableFromBatch: number; // currentStageDisplayQuantity - totalQuantitySoldFromBatch
  procurements: Pick<Procurement, 'id' | 'batchCode' | 'quantity'>[]; // For basic listing if needed
}

// For detailed view of a single batch
export interface ProcessingStageWithDrying extends ProcessingStage {
  dryingEntries: Drying[];
}
export interface SaleWithStageInfo extends Sale {
  processingStage: Pick<ProcessingStage, 'processingCount'>;
}

export interface ProcessingBatchWithDetails extends ProcessingBatch {
  procurements: (Procurement & { farmer: Pick<User, 'name'> & { village?: string } })[]; // Assuming farmer name is needed for procurements list in detail
  processingStages: ProcessingStageWithDrying[];
  sales: SaleWithStageInfo[];
  createdBy: Pick<User, 'id' | 'name'>;
  totalQuantitySoldFromBatch: number;
}

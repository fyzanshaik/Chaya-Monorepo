import type {
  ProcessingBatch,
  Procurement,
  ProcessingStage,
  Drying,
  Sale,
  User,
  ProcessingStageStatus as PrismaProcessingStageStatus,
} from '@chaya/shared';

export type ExtendedProcessingStageStatus = PrismaProcessingStageStatus | 'SOLD_OUT' | 'NO_STAGES';

export interface ProcessingBatchWithSummary
  extends Omit<ProcessingBatch, 'processingStages' | 'procurements' | 'sales'> {
  latestStageSummary: {
    id: number;
    processingCount: number;
    status: ExtendedProcessingStageStatus;
    processMethod: string;
    dateOfProcessing: Date;
    doneBy: string;
    initialQuantity: number;
    quantityAfterProcess: number | null;
    lastDryingQuantity: number | null;
  } | null;
  totalQuantitySoldFromBatch: number;
  netAvailableQuantity: number;
}

export interface ProcessingStageWithDrying extends ProcessingStage {
  dryingEntries: Drying[];
}
export interface SaleWithStageInfo extends Sale {
  processingStage: Pick<ProcessingStage, 'processingCount'>;
}

export interface ProcessingBatchWithDetails extends ProcessingBatch {
  procurements: (Procurement & { farmer: Pick<User, 'name'> & { village?: string } })[];
  processingStages: ProcessingStageWithDrying[];
  sales: SaleWithStageInfo[];
  createdBy: Pick<User, 'id' | 'name'>;
  totalQuantitySoldFromBatch: number;
  netAvailableQuantity: number;
  latestStageSummary?: {
    id: number;
    processingCount: number;
    status: ExtendedProcessingStageStatus;
    processMethod: string;
    dateOfProcessing: Date;
    doneBy: string;
    initialQuantity: number;
    quantityAfterProcess: number | null;
    lastDryingQuantity: number | null;
  } | null;
}

/*eslint-disable */
'use server';

import { cookies } from 'next/headers';
import type { ProcessingBatchWithDetails, ProcessingBatchWithSummary } from './types';
import type { Drying, FinalizeProcessingStageInput } from '@chaya/shared';

const BACKEND_API_URL = process.env.PROD_BACKEND_URL || 'http://localhost:5000';

export async function getProcessingBatchDetailsById(batchId: number): Promise<ProcessingBatchWithDetails> {
  if (isNaN(batchId)) {
    throw new Error('Batch ID must be a valid number.');
  }
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      throw new Error('Authentication required');
    }

    const fetchURL = `${BACKEND_API_URL}/api/processing-batches/${batchId}`;
    const response = await fetch(fetchURL, {
      method: 'GET',
      headers: {
        Cookie: `token=${token}`,
      },
      cache: 'no-store',
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error || `Failed to fetch processing batch ${batchId} from backend. Status: ${response.status}`
      );
    }
    return data as ProcessingBatchWithDetails;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error in server action.';
    console.error(`[Server Action Error] getProcessingBatchDetailsById(${batchId}):`, errorMessage);
    throw new Error(errorMessage);
  }
}

export async function getDryingEntriesForStage(stageId: number): Promise<Drying[]> {
  if (isNaN(stageId)) {
    throw new Error('Stage ID must be a valid number.');
  }
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await fetch(`${BACKEND_API_URL}/api/processing-stages/${stageId}/drying`, {
      method: 'GET',
      headers: { Cookie: `token=${token}` },
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch drying entries');
    }
    return data.dryingEntries || [];
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error fetching drying entries.';
    console.error(`[Server Action Error] getDryingEntriesForStage(${stageId}):`, errorMessage);
    throw new Error(errorMessage);
  }
}

export async function getProcessingBatchesList(params: {
  page: number;
  limit: number;
  search: string;
  statusFilter?: string;
}): Promise<{ processingBatches: ProcessingBatchWithSummary[]; pagination: any }> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) {
      throw new Error('Authentication required');
    }

    const searchParams = new URLSearchParams({
      page: params.page.toString(),
      limit: params.limit.toString(),
      search: params.search,
    });
    if (params.statusFilter) {
      searchParams.set('status', params.statusFilter);
    }

    const response = await fetch(`${BACKEND_API_URL}/api/processing-batches?${searchParams.toString()}`, {
      method: 'GET',
      headers: { Cookie: `token=${token}` },
      cache: 'no-store',
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch processing batches list from backend');
    }
    return data;
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Internal server error fetching processing batches list.';
    console.error('[Server Action Error] getProcessingBatchesList:', errorMessage);
    throw new Error(errorMessage);
  }
}

export async function finalizeProcessingStageAction(
  stageId: number,
  payload: FinalizeProcessingStageInput
): Promise<any> {
  if (isNaN(stageId)) {
    throw new Error('Stage ID must be a valid number.');
  }
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await fetch(`${BACKEND_API_URL}/api/processing-stages/${stageId}/finalize`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `token=${token}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || `Failed to finalize stage ${stageId}`);
    }
    return data;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error finalizing stage.';
    console.error(`[Server Action Error] finalizeProcessingStageAction(${stageId}):`, errorMessage);
    throw new Error(errorMessage);
  }
}

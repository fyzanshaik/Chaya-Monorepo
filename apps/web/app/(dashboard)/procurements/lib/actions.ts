'use server';

import axios from 'axios';
import { cookies } from 'next/headers';
import type { ProcurementWithRelations } from './types';
import type { UpdateProcurementInput } from '@chaya/shared';
import type { ProcurementWithFarmerForStore } from '@/app/stores/processing-batch-form';

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

interface GetProcurementsParams {
  page?: number;
  limit?: number;
  query?: string;
}

export async function getProcurements({ page = 1, limit = 10, query = '' }: GetProcurementsParams) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      throw new Error('Authentication token not found');
    }

    const response = await axios.get(`${API_URL}/api/procurements`, {
      headers: {
        Cookie: `token=${token}`,
      },
      params: {
        page,
        limit,
        search: query,
      },
      withCredentials: true,
    });

    return response.data.procurements;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      console.error('Error fetching procurements:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error || error.message || 'Failed to fetch procurements');
    }
    console.error('Error fetching procurements:', error);
    throw new Error('Failed to fetch procurements');
  }
}

export async function getProcurementPages(query = '') {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      throw new Error('Authentication token not found');
    }

    const response = await axios.get(`${API_URL}/api/procurements`, {
      headers: {
        Cookie: `token=${token}`,
      },
      params: {
        page: 1,
        limit: 10,
        search: query,
      },
      withCredentials: true,
    });

    const totalCount = response.data.pagination.totalCount;
    const totalPages = Math.ceil(totalCount / 10);
    return totalPages;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      console.error('Error fetching procurement count:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error || error.message || 'Failed to fetch procurement pages');
    }
    console.error('Error fetching procurement count:', error);
    throw new Error('Failed to fetch procurement pages');
  }
}

export async function bulkDeleteProcurements(ids: number[]) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return { success: false, error: 'Authentication token not found' };
    }

    const response = await fetch(`${API_URL}/api/procurements/bulk`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `token=${token}`,
      },
      body: JSON.stringify({ ids }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { success: false, error: errorData.error || 'Failed to delete procurements' };
    }

    return { success: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error during bulk delete';
    console.error('Error bulk deleting procurements (server action):', errorMessage);
    return { success: false, error: errorMessage };
  }
}

export async function deleteProcurementAction(id: number) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return { success: false, error: 'Authentication token not found' };
    }

    const response = await fetch(`${API_URL}/api/procurements/${id}`, {
      method: 'DELETE',
      headers: {
        Cookie: `token=${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { success: false, error: errorData.error || 'Failed to delete procurement' };
    }
    return { success: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error deleting procurement (server action):', errorMessage);
    return { success: false, error: errorMessage };
  }
}

export async function getUnbatchedProcurementsAction(params?: {
  crop?: string;
  lotNo?: string;
}): Promise<ProcurementWithFarmerForStore[]> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) {
      throw new Error('Authentication required');
    }

    const queryParams = new URLSearchParams();
    if (params?.crop) queryParams.set('crop', params.crop);
    if (params?.lotNo) queryParams.set('lotNo', params.lotNo);

    const response = await fetch(`${API_URL}/api/procurements/unbatched?${queryParams.toString()}`, {
      method: 'GET',
      headers: { Cookie: `token=${token}` },
      cache: 'no-store',
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch unbatched procurements from backend');
    }
    return data.procurements || [];
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Internal server error fetching unbatched procurements.';
    console.error('[Server Action Error] getUnbatchedProcurementsAction:', errorMessage);
    throw new Error(errorMessage);
  }
}

export async function updateProcurementAction(
  procurementId: number,
  payload: Partial<UpdateProcurementInput>
): Promise<{ procurement: ProcurementWithRelations }> {
  if (isNaN(procurementId)) {
    throw new Error('Procurement ID must be a valid number.');
  }
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await fetch(`${API_URL}/api/procurements/${procurementId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `token=${token}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || `Failed to update procurement ${procurementId}`);
    }
    return data;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error updating procurement.';
    console.error(`[Server Action Error] updateProcurementAction(${procurementId}):`, errorMessage);
    throw new Error(errorMessage);
  }
}

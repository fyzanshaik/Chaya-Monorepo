'use server';

import axios from 'axios';
import { cookies } from 'next/headers';

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

interface GetProcurementsParams {
  page?: number;
  query?: string;
}

export async function getProcurements({ page = 1, query = '' }: GetProcurementsParams) {
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
        limit: 10,
        search: query,
      },
      withCredentials: true,
    });

    return response.data.procurements;
  } catch (error) {
    console.error('Error fetching procurements:', error);
    throw error;
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
  } catch (error) {
    console.error('Error fetching procurement count:', error);
    throw error;
  }
}

export async function bulkDeleteProcurements(ids: number[]) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      throw new Error('Authentication token not found');
    }

    const response = await axios.delete(`${API_URL}/api/procurements/bulk`, {
      headers: {
        Cookie: `token=${token}`,
      },
      data: { ids },
      withCredentials: true,
    });

    return { success: true };
  } catch (error) {
    console.error('Error deleting procurements:', error);
    return { success: false };
  }
}

export async function deleteProcurement(id: number) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      throw new Error('Authentication token not found');
    }

    const response = await axios.delete(`${API_URL}/api/procurements/${id}`, {
      headers: {
        Cookie: `token=${token}`,
      },
      withCredentials: true,
    });

    return { success: true };
  } catch (error) {
    console.error('Error deleting procurement:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

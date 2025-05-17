'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import type { ProcessingBatchWithSummary, ProcessingBatchWithDetails } from '../lib/types';
import { toast } from 'sonner';
import axios from 'axios';

interface ProcessingBatchCacheContextType {
  processingBatchesSummary: Record<string, ProcessingBatchWithSummary[]>;
  totalPages: Record<string, number>;
  fetchProcessingBatchesSummary: (
    page: number,
    query: string,
    statusFilter: string
  ) => Promise<ProcessingBatchWithSummary[]>;
  fetchTotalPages: (query: string, statusFilter: string) => Promise<number>;
  clearCache: () => void;
  refreshCurrentPageSummary: (
    page: number,
    query: string,
    statusFilter: string
  ) => Promise<ProcessingBatchWithSummary[]>;
  getBatchDetails: (batchId: number) => Promise<ProcessingBatchWithDetails | null>;
  clearBatchDetailCache: (batchId: number) => void;
}

const ProcessingBatchCacheContext = createContext<ProcessingBatchCacheContextType | undefined>(undefined);

export function ProcessingBatchCacheProvider({ children }: { children: React.ReactNode }) {
  const [processingBatchesSummary, setProcessingBatchesSummary] = useState<
    Record<string, ProcessingBatchWithSummary[]>
  >({});
  const [totalPages, setTotalPages] = useState<Record<string, number>>({});
  const [batchDetailsCache, setBatchDetailsCache] = useState<Record<number, ProcessingBatchWithDetails>>({});

  const createListKey = useCallback((page: number, query: string, status: string) => `${query}:${status}:${page}`, []);

  const fetchProcessingBatchesSummary = useCallback(
    async (page: number, query: string, statusFilter: string): Promise<ProcessingBatchWithSummary[]> => {
      const key = createListKey(page, query, statusFilter);
      if (processingBatchesSummary[key]) {
        return processingBatchesSummary[key];
      }
      try {
        const params = new URLSearchParams({ page: page.toString(), limit: '10', search: query });
        if (statusFilter) params.set('status', statusFilter);

        const response = await axios.get(`/api/processing-batches?${params.toString()}`, { withCredentials: true });
        const data = response.data;

        setProcessingBatchesSummary(prev => ({ ...prev, [key]: data.processingBatches }));
        setTotalPages(prev => ({ ...prev, [`${query}:${statusFilter}`]: data.pagination.totalPages }));
        return data.processingBatches;
      } catch (error) {
        toast.error('Failed to fetch processing batches summary.');
        throw error;
      }
    },
    [processingBatchesSummary]
  );

  const fetchTotalPages = useCallback(
    async (query: string, statusFilter: string): Promise<number> => {
      const key = `${query}:${statusFilter}`;
      if (totalPages[key] !== undefined) {
        return totalPages[key];
      }
      try {
        const params = new URLSearchParams({ page: '1', limit: '10', search: query });
        if (statusFilter) params.set('status', statusFilter);

        const response = await axios.get(`/api/processing-batches?${params.toString()}`, { withCredentials: true });
        const pages = response.data.pagination.totalPages;
        setTotalPages(prev => ({ ...prev, [key]: pages }));
        return pages;
      } catch (error) {
        toast.error('Failed to fetch pagination data.');
        return 1; // Default to 1 page on error
      }
    },
    [totalPages]
  );

  const refreshCurrentPageSummary = useCallback(
    async (page: number, query: string, statusFilter: string): Promise<ProcessingBatchWithSummary[]> => {
      const key = createListKey(page, query, statusFilter);
      try {
        const params = new URLSearchParams({ page: page.toString(), limit: '10', search: query });
        if (statusFilter) params.set('status', statusFilter);

        const response = await axios.get(`/api/processing-batches?${params.toString()}`, { withCredentials: true });
        const data = response.data;

        setProcessingBatchesSummary(prev => ({ ...prev, [key]: data.processingBatches }));
        setTotalPages(prev => ({ ...prev, [`${query}:${statusFilter}`]: data.pagination.totalPages })); // refresh total pages too
        return data.processingBatches;
      } catch (error) {
        toast.error(`Failed to refresh batches data for page ${page}.`);
        throw error;
      }
    },
    []
  );

  const getBatchDetails = useCallback(
    async (batchId: number): Promise<ProcessingBatchWithDetails | null> => {
      if (batchDetailsCache[batchId]) {
        return batchDetailsCache[batchId];
      }
      try {
        const response = await axios.get<ProcessingBatchWithDetails>(`/api/processing-batches/${batchId}`, {
          withCredentials: true,
        });
        setBatchDetailsCache(prev => ({ ...prev, [batchId]: response.data }));
        return response.data;
      } catch (error) {
        toast.error(`Failed to fetch details for batch ID ${batchId}.`);
        return null;
      }
    },
    [batchDetailsCache]
  );

  const clearBatchDetailCache = useCallback((batchId: number) => {
    setBatchDetailsCache(prev => {
      const newState = { ...prev };
      delete newState[batchId];
      return newState;
    });
  }, []);

  const clearCache = useCallback(() => {
    setProcessingBatchesSummary({});
    setTotalPages({});
    setBatchDetailsCache({});
    toast.info('Processing batches cache cleared.');
  }, []);

  return (
    <ProcessingBatchCacheContext.Provider
      value={{
        processingBatchesSummary,
        totalPages,
        fetchProcessingBatchesSummary,
        fetchTotalPages,
        clearCache,
        refreshCurrentPageSummary,
        getBatchDetails,
        clearBatchDetailCache,
      }}
    >
      {children}
    </ProcessingBatchCacheContext.Provider>
  );
}

export function useProcessingBatchCache() {
  const context = useContext(ProcessingBatchCacheContext);
  if (context === undefined) {
    throw new Error('useProcessingBatchCache must be used within a ProcessingBatchCacheProvider');
  }
  return context;
}

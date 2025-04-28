'use client';

import { createContext, useContext, useState, useCallback } from 'react';
import type { ProcessingWithRelations } from '../lib/types';
import { toast } from 'sonner';

interface ProcessingCacheContextType {
  processingRecords: Record<string, ProcessingWithRelations[]>;
  fetchProcessingRecords: (page: number, query: string) => Promise<ProcessingWithRelations[]>;
  fetchTotalPages: (query: string) => Promise<number>;
  clearCache: () => void;
  refreshCurrentPage: (page: number, query: string) => Promise<ProcessingWithRelations[]>;
}

const ProcessingCacheContext = createContext<ProcessingCacheContextType | undefined>(undefined);

export function ProcessingCacheProvider({ children }: { children: React.ReactNode }) {
  const [processingRecords, setProcessingRecords] = useState<Record<string, ProcessingWithRelations[]>>({});
  const [totalPagesCache, setTotalPagesCache] = useState<Record<string, number>>({});

  const createKey = useCallback((page: number, query: string) => `${query}:${page}`, []);

  const fetchProcessingRecords = useCallback(
    async (page: number, query: string): Promise<ProcessingWithRelations[]> => {
      const key = createKey(page, query);

      if (processingRecords[key]) {
        console.log(`Using cached data for page ${page}, query "${query}"`);
        return processingRecords[key];
      }

      console.log(`Fetching page ${page}, query "${query}" from server`);
      try {
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';
        const response = await fetch(`${apiBaseUrl}/api/processing?query=${encodeURIComponent(query)}&page=${page}`, {
          credentials: 'include',
        });
        if (!response.ok) {
          throw new Error('Failed to fetch processing records');
        }
        const data = await response.json();
        const records = data.processingRecords;

        setProcessingRecords(prev => ({
          ...prev,
          [key]: records,
        }));

        if (typeof data.totalPages === 'number') {
          setTotalPagesCache(prev => ({
            ...prev,
            [query]: data.totalPages,
          }));
        }

        return records;
      } catch (error) {
        toast.error('Failed to fetch processing records from server.');
        throw error;
      }
    },
    [processingRecords, createKey]
  );

  const fetchTotalPages = useCallback(
    async (query: string): Promise<number> => {
      if (totalPagesCache[query] !== undefined) {
        return totalPagesCache[query];
      }
      try {
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';
        const response = await fetch(`${apiBaseUrl}/api/processing?query=${encodeURIComponent(query)}&page=1`, {
          credentials: 'include',
        });
        if (!response.ok) {
          throw new Error('Failed to fetch total pages');
        }
        const data = await response.json();
        if (typeof data.totalPages === 'number') {
          setTotalPagesCache(prev => ({
            ...prev,
            [query]: data.totalPages,
          }));
          return data.totalPages;
        }
        return 1;
      } catch (error) {
        toast.error('Failed to fetch pagination data.');
        return 1;
      }
    },
    [totalPagesCache]
  );

  const refreshCurrentPage = useCallback(
    async (page: number, query: string): Promise<ProcessingWithRelations[]> => {
      const key = createKey(page, query);

      console.log(`Force refreshing page ${page}, query "${query}" from server`);
      try {
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';
        const response = await fetch(`${apiBaseUrl}/api/processing?query=${encodeURIComponent(query)}&page=${page}`, {
          credentials: 'include',
        });
        if (!response.ok) {
          throw new Error('Failed to refresh processing records');
        }
        const data = await response.json();
        const records = data.processingRecords;

        setProcessingRecords(prev => ({
          ...prev,
          [key]: records,
        }));

        if (typeof data.totalPages === 'number') {
          setTotalPagesCache(prev => ({
            ...prev,
            [query]: data.totalPages,
          }));
        }

        return records;
      } catch (error) {
        toast.error(`Failed to refresh data for page ${page}.`);
        throw error;
      }
    },
    [createKey]
  );

  const clearCache = useCallback(() => {
    setProcessingRecords({});
    setTotalPagesCache({});
    toast.success('Cache cleared successfully.');
  }, []);

  return (
    <ProcessingCacheContext.Provider
      value={{
        processingRecords,
        fetchProcessingRecords,
        fetchTotalPages,
        clearCache,
        refreshCurrentPage,
      }}
    >
      {children}
    </ProcessingCacheContext.Provider>
  );
}

export function useProcessingCache() {
  const context = useContext(ProcessingCacheContext);
  if (context === undefined) {
    throw new Error('useProcessingCache must be used within a ProcessingCacheProvider');
  }
  return context;
}

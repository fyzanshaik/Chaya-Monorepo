'use client';

import type React from 'react';
import { createContext, useContext, useState, useCallback } from 'react';
import { getProcurements, getProcurementPages } from '../lib/actions';
import type { ProcurementWithRelations } from '../lib/types';

interface ProcurementsCacheContextType {
  procurements: Record<string, ProcurementWithRelations[]>;
  totalPages: Record<string, number>;
  fetchProcurements: (page: number, query: string) => Promise<ProcurementWithRelations[]>;
  fetchTotalPages: (query: string) => Promise<number>;
  clearCache: () => void;
  prefetchPages: (startPage: number, endPage: number, query: string) => Promise<void>;
}

const ProcurementsCacheContext = createContext<ProcurementsCacheContextType | undefined>(undefined);

export function ProcurementsCacheProvider({ children }: { children: React.ReactNode }) {
  // Cache state
  const [procurements, setProcurements] = useState<Record<string, ProcurementWithRelations[]>>({});
  const [totalPages, setTotalPages] = useState<Record<string, number>>({});

  // Create a key from page and query
  const createKey = (page: number, query: string) => `${query}:${page}`;

  // Fetch procurements with caching
  const fetchProcurements = useCallback(
    async (page: number, query: string): Promise<ProcurementWithRelations[]> => {
      const key = createKey(page, query);

      // Return cached data if available
      if (procurements[key]) {
        console.log(`Using cached data for page ${page}, query "${query}"`);
        return procurements[key];
      }

      // Fetch new data
      console.log(`Fetching page ${page}, query "${query}" from server`);
      const data = (await getProcurements({
        page,
        query,
      })) as ProcurementWithRelations[];

      // Update cache
      setProcurements(prev => ({
        ...prev,
        [key]: data,
      }));

      return data;
    },
    [procurements]
  );

  // Fetch total pages with caching
  const fetchTotalPages = useCallback(
    async (query: string): Promise<number> => {
      // Return cached data if available
      if (totalPages[query] !== undefined) {
        return totalPages[query];
      }

      // Fetch new data
      const pages = await getProcurementPages(query);

      // Update cache
      setTotalPages(prev => ({
        ...prev,
        [query]: pages,
      }));

      return pages;
    },
    [totalPages]
  );

  // Prefetch multiple pages
  const prefetchPages = useCallback(
    async (startPage: number, endPage: number, query: string) => {
      console.log(`Prefetching pages ${startPage}-${endPage} for query "${query}"`);

      for (let page = startPage; page <= endPage; page++) {
        const key = createKey(page, query);

        // Skip if already cached
        if (procurements[key]) continue;

        try {
          const data = (await getProcurements({
            page,
            query,
          })) as ProcurementWithRelations[];
          setProcurements(prev => ({
            ...prev,
            [key]: data,
          }));
        } catch (error) {
          console.error(`Error prefetching page ${page}:`, error);
        }
      }
    },
    [procurements]
  );

  // Clear the cache
  const clearCache = useCallback(() => {
    setProcurements({});
    setTotalPages({});
  }, []);

  // Context value
  const value = {
    procurements,
    totalPages,
    fetchProcurements,
    fetchTotalPages,
    clearCache,
    prefetchPages,
  };

  return <ProcurementsCacheContext.Provider value={value}>{children}</ProcurementsCacheContext.Provider>;
}

export function useProcurementsCache() {
  const context = useContext(ProcurementsCacheContext);

  if (context === undefined) {
    throw new Error('useProcurementsCache must be used within a ProcurementsCacheProvider');
  }

  return context;
}

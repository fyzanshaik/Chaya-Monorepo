"use client";

import { createContext, useContext, useState, useCallback } from "react";
import type { ProcessingWithRelations } from "../lib/types";

interface ProcessingCacheContextType {
  processingRecords: Record<string, ProcessingWithRelations[]>;
  fetchProcessingRecords: (
    page: number,
    query: string
  ) => Promise<ProcessingWithRelations[]>;
  fetchTotalPages: (query: string) => Promise<number>;
  clearCache: () => void;
}

const ProcessingCacheContext = createContext<
  ProcessingCacheContextType | undefined
>(undefined);

export function ProcessingCacheProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [processingRecords, setProcessingRecords] = useState<
    Record<string, ProcessingWithRelations[]>
  >({});
  const [totalPagesCache, setTotalPagesCache] = useState<
    Record<string, number>
  >({});

  const createKey = (page: number, query: string) => `${query}:${page}`;

  const fetchProcessingRecords = useCallback(
    async (page: number, query: string): Promise<ProcessingWithRelations[]> => {
      const key = createKey(page, query);

      // Return cached data if available
      if (processingRecords[key]) {
        return processingRecords[key];
      }

      try {
        const response = await fetch(
          `/api/processing?query=${encodeURIComponent(query)}&page=${page}`,
          {
            credentials: "include",
          }
        );
        const data = await response.json();
        const records = data.processingRecords;

        // Update cache
        setProcessingRecords(prev => ({
          ...prev,
          [key]: records,
        }));

        // Also cache totalPages for this query
        if (typeof data.totalPages === "number") {
          setTotalPagesCache(prev => ({
            ...prev,
            [query]: data.totalPages,
          }));
        }

        return records;
      } catch (error) {
        console.error("Error fetching processing records:", error);
        throw error;
      }
    },
    [processingRecords]
  );

  // Fetch total pages for a query, with caching
  const fetchTotalPages = useCallback(
    async (query: string): Promise<number> => {
      if (totalPagesCache[query] !== undefined) {
        return totalPagesCache[query];
      }
      try {
        // Fetch first page to get totalPages
        const response = await fetch(
          `/api/processing?query=${encodeURIComponent(query)}&page=1`,
          {
            credentials: "include",
          }
        );
        const data = await response.json();
        if (typeof data.totalPages === "number") {
          setTotalPagesCache(prev => ({
            ...prev,
            [query]: data.totalPages,
          }));
          return data.totalPages;
        }
        return 1;
      } catch (error) {
        console.error("Error fetching total pages:", error);
        return 1;
      }
    },
    [totalPagesCache]
  );

  const clearCache = useCallback(() => {
    setProcessingRecords({});
    setTotalPagesCache({});
  }, []);

  return (
    <ProcessingCacheContext.Provider
      value={{
        processingRecords,
        fetchProcessingRecords,
        fetchTotalPages,
        clearCache,
      }}
    >
      {children}
    </ProcessingCacheContext.Provider>
  );
}

export function useProcessingCache() {
  const context = useContext(ProcessingCacheContext);
  if (context === undefined) {
    throw new Error(
      "useProcessingCache must be used within a ProcessingCacheProvider"
    );
  }
  return context;
}

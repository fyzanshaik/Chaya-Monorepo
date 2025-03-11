'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { getFarmers, getFarmerPages } from '../lib/actions';
import { FarmerWithRelations } from '../lib/types';

interface FarmersCacheContextType {
	farmers: Record<string, FarmerWithRelations[]>;
	totalPages: Record<string, number>;
	fetchFarmers: (page: number, query: string) => Promise<FarmerWithRelations[]>;
	fetchTotalPages: (query: string) => Promise<number>;
	clearCache: () => void;
	prefetchPages: (startPage: number, endPage: number, query: string) => Promise<void>;
}

const FarmersCacheContext = createContext<FarmersCacheContextType | undefined>(undefined);

export function FarmersCacheProvider({ children }: { children: React.ReactNode }) {
	// Cache state
	const [farmers, setFarmers] = useState<Record<string, FarmerWithRelations[]>>({});
	const [totalPages, setTotalPages] = useState<Record<string, number>>({});

	// Create a key from page and query
	const createKey = (page: number, query: string) => `${query}:${page}`;

	// Fetch farmers with caching
	const fetchFarmers = useCallback(
		async (page: number, query: string): Promise<FarmerWithRelations[]> => {
			const key = createKey(page, query);

			// Return cached data if available
			if (farmers[key]) {
				console.log(`Using cached data for page ${page}, query "${query}"`);
				return farmers[key];
			}

			// Fetch new data
			console.log(`Fetching page ${page}, query "${query}" from server`);
			const data = (await getFarmers({ page, query })) as FarmerWithRelations[];

			// Update cache
			setFarmers((prev) => ({
				...prev,
				[key]: data,
			}));

			return data;
		},
		[farmers]
	);

	// Fetch total pages with caching
	const fetchTotalPages = useCallback(
		async (query: string): Promise<number> => {
			// Return cached data if available
			if (totalPages[query] !== undefined) {
				return totalPages[query];
			}

			// Fetch new data
			const pages = await getFarmerPages(query);

			// Update cache
			setTotalPages((prev) => ({
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
				if (farmers[key]) continue;

				try {
					const data = (await getFarmers({ page, query })) as FarmerWithRelations[];
					setFarmers((prev) => ({
						...prev,
						[key]: data,
					}));
				} catch (error) {
					console.error(`Error prefetching page ${page}:`, error);
				}
			}
		},
		[farmers, createKey]
	);

	// Clear the cache
	const clearCache = useCallback(() => {
		setFarmers({});
		setTotalPages({});
	}, []);

	// Context value
	const value = {
		farmers,
		totalPages,
		fetchFarmers,
		fetchTotalPages,
		clearCache,
		prefetchPages,
	};

	return <FarmersCacheContext.Provider value={value}>{children}</FarmersCacheContext.Provider>;
}

export function useFarmersCache() {
	const context = useContext(FarmersCacheContext);

	if (context === undefined) {
		throw new Error('useFarmersCache must be used within a FarmersCacheProvider');
	}

	return context;
}

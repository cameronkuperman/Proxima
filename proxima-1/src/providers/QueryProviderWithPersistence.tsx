'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ReactNode, useState, useEffect } from 'react';
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';

// Create a persister using localStorage for instant loads
const localStoragePersister = createSyncStoragePersister({
  storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  key: 'PROXIMA_QUERY_CACHE',
});

// Configure optimized caching for maximum performance
const queryClientOptions = {
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 30, // 30 minutes - sessions rarely change
      gcTime: 1000 * 60 * 60 * 24, // 24 hours - keep in cache for a full day
      refetchOnWindowFocus: false,
      refetchOnReconnect: 'always',
      retry: 2,
      retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Enable network-only refetch for data integrity
      networkMode: 'offlineFirst' as const,
    },
    mutations: {
      retry: 1,
      networkMode: 'offlineFirst' as const,
    },
  },
};

export function QueryProviderWithPersistence({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient(queryClientOptions));

  useEffect(() => {
    // Only persist on client side
    if (typeof window !== 'undefined') {
      // persistQueryClient returns the unsubscribe function directly
      const unsubscribe = persistQueryClient({
        queryClient,
        persister: localStoragePersister,
        maxAge: 1000 * 60 * 60 * 24, // 24 hours
        hydrateOptions: undefined,
        dehydrateOptions: {
          // Only persist successful queries
          shouldDehydrateQuery: (query) => {
            return query.state.status === 'success';
          },
        },
      });

      // Ensure we return a function (unsubscribe should be a function)
      if (typeof unsubscribe === 'function') {
        return unsubscribe;
      }
      // If unsubscribe is not a function, return a no-op cleanup function
      return () => {};
    }
    // Return undefined implicitly when window is not defined
  }, [queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} position="bottom" />
      )}
    </QueryClientProvider>
  );
}
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ReactNode, useState } from 'react';

// Configure default options for all queries with optimized caching
const queryClientOptions = {
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 30, // 30 minutes - data is considered fresh (increased for better performance)
      gcTime: 1000 * 60 * 60 * 2, // 2 hours - keep in cache longer
      refetchOnWindowFocus: false, // Don't refetch on window focus
      refetchOnReconnect: true, // Refetch when reconnecting
      retry: 2, // Retry failed requests twice
      retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
    },
    mutations: {
      retry: 1, // Retry mutations once
    },
  },
};

export function QueryProvider({ children }: { children: ReactNode }) {
  // Create a stable QueryClient instance
  const [queryClient] = useState(() => new QueryClient(queryClientOptions));

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Show React Query DevTools in development */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} position="bottom" />
      )}
    </QueryClientProvider>
  );
}
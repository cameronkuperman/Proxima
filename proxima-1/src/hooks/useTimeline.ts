import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface TimelineInteraction {
  id: string;
  user_id: string;
  interaction_type: 'quick_scan' | 'deep_dive' | 'photo_analysis' | 'report' | 'oracle_chat' | 'tracking_log';
  created_at: string;
  title: string;
  severity: 'low' | 'medium' | 'high';
  metadata: {
    [key: string]: any;
  };
}

interface TimelinePagination {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

interface UseTimelineOptions {
  limit?: number;
  search?: string;
  type?: string;
}

export function useTimeline(options: UseTimelineOptions = {}) {
  const router = useRouter();
  const { user } = useAuth();
  const [interactions, setInteractions] = useState<TimelineInteraction[]>([]);
  const [pagination, setPagination] = useState<TimelinePagination>({
    total: 0,
    limit: options.limit || 50,
    offset: 0,
    hasMore: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Keep track of if we've attempted to load data
  const hasLoadedRef = useRef(false);
  
  // Fetch timeline data directly from Supabase
  const fetchTimeline = useCallback(async (offset = 0, append = false) => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    
    if (offset === 0) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }
    
    setError(null);
    
    try {
      // Build the query - RLS will ensure users only see their own data
      let query = supabase
        .from('user_interactions')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      // Add search filter if provided
      if (options.search) {
        query = query.or(`title.ilike.%${options.search}%,metadata->>body_part.ilike.%${options.search}%,metadata->>condition.ilike.%${options.search}%`);
      }
      
      // Add type filter if provided
      if (options.type) {
        query = query.eq('interaction_type', options.type);
      }
      
      // Add pagination
      query = query.range(offset, offset + (options.limit || 50) - 1);
      
      const { data, error: queryError, count } = await query;
      
      if (queryError) {
        throw new Error(queryError.message);
      }
      
      const interactions = data || [];
      
      if (append) {
        setInteractions(prev => [...prev, ...interactions]);
      } else {
        setInteractions(interactions);
      }
      
      setPagination({
        total: count || 0,
        limit: options.limit || 50,
        offset,
        hasMore: (count || 0) > offset + (options.limit || 50)
      });
      
      hasLoadedRef.current = true;
      
    } catch (err) {
      console.error('Timeline fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load timeline');
      
      // Set empty state on error
      if (!append) {
        setInteractions([]);
        setPagination({
          total: 0,
          limit: options.limit || 50,
          offset: 0,
          hasMore: false,
        });
      }
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [user, options.limit, options.search, options.type]);
  
  // Load more function for infinite scroll
  const loadMore = useCallback(() => {
    if (!isLoadingMore && pagination.hasMore) {
      fetchTimeline(pagination.offset + pagination.limit, true);
    }
  }, [fetchTimeline, isLoadingMore, pagination]);
  
  // Handle timeline item click with validation
  const handleItemClick = useCallback(async (interaction: TimelineInteraction) => {
    try {
      // For tracking logs, open the chart modal instead of navigating
      if (interaction.interaction_type === 'tracking_log') {
        // This will be handled by the dashboard component
        return { type: 'modal', configId: interaction.metadata.config_id };
      }
      
      // Navigate based on interaction type
      let navigationPath = '';
      
      switch (interaction.interaction_type) {
        case 'quick_scan':
          // For now, just go to the scan page
          // TODO: Implement a way to view historical scan results
          navigationPath = `/scan?mode=quick&result=${interaction.id}`;
          toast.info('Viewing historical scans coming soon!');
          break;
          
        case 'deep_dive':
          // For now, go to scan page in deep mode
          navigationPath = `/scan?mode=deep&session=${interaction.id}`;
          toast.info('Viewing historical deep dives coming soon!');
          break;
          
        case 'photo_analysis':
          navigationPath = `/photo-analysis?session=${interaction.metadata.session_id || interaction.id}`;
          break;
          
        case 'report':
          navigationPath = `/reports/${interaction.id}`;
          break;
          
        case 'oracle_chat':
          navigationPath = `/oracle?conversation=${interaction.id}`;
          break;
      }
      
      if (navigationPath) {
        router.push(navigationPath);
      } else {
        toast.error('This item is no longer available');
      }
      
    } catch (err) {
      console.error('Navigation error:', err);
      toast.error('Unable to open this item');
    }
  }, [router]);
  
  // Get color gradients for interaction types
  const getInteractionColor = useCallback((type: string) => {
    switch (type) {
      case 'quick_scan':
        return {
          gradient: 'from-emerald-500/20 to-green-500/20',
          iconColor: 'text-emerald-400',
          borderColor: 'border-emerald-500/20',
        };
      case 'deep_dive':
        return {
          gradient: 'from-indigo-500/20 to-purple-500/20',
          iconColor: 'text-indigo-400',
          borderColor: 'border-indigo-500/20',
        };
      case 'photo_analysis':
        return {
          gradient: 'from-pink-500/20 to-rose-500/20',
          iconColor: 'text-pink-400',
          borderColor: 'border-pink-500/20',
        };
      case 'report':
        return {
          gradient: 'from-blue-500/20 to-cyan-500/20',
          iconColor: 'text-blue-400',
          borderColor: 'border-blue-500/20',
        };
      case 'oracle_chat':
        return {
          gradient: 'from-amber-500/20 to-yellow-500/20',
          iconColor: 'text-amber-400',
          borderColor: 'border-amber-500/20',
        };
      case 'tracking_log':
        return {
          gradient: 'from-gray-500/20 to-slate-500/20',
          iconColor: 'text-gray-400',
          borderColor: 'border-gray-500/20',
        };
      default:
        return {
          gradient: 'from-gray-500/20 to-gray-500/20',
          iconColor: 'text-gray-400',
          borderColor: 'border-gray-500/20',
        };
    }
  }, []);
  
  // Initial load
  useEffect(() => {
    if (user) {
      fetchTimeline(0);
    }
  }, [user, fetchTimeline]);
  
  return {
    interactions,
    pagination,
    isLoading,
    isLoadingMore,
    error,
    hasLoaded: hasLoadedRef.current,
    loadMore,
    handleItemClick,
    getInteractionColor,
    refetch: () => fetchTimeline(0),
  };
}
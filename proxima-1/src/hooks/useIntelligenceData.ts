import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { 
  intelligenceClient,
  HealthVelocityData,
  BodySystemsData,
  TimelineData,
  PatternCard,
  DoctorReadinessData,
  ComparativeIntelligence
} from '@/lib/intelligence-client';
import { generateMockHealthData } from '@/lib/mock-health-data';

// Common options for intelligence queries
const INTELLIGENCE_QUERY_OPTIONS = {
  retry: 2,
  retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
  refetchOnWindowFocus: false
};

/**
 * Hook for fetching Health Velocity data
 */
export function useHealthVelocity(timeRange: '7D' | '30D' | '90D' = '7D') {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['health-velocity', user?.id, timeRange],
    queryFn: async () => {
      if (!user?.id) return null;
      
      console.log('[useHealthVelocity] Fetching data for:', timeRange);
      const data = await intelligenceClient.fetchHealthVelocity(user.id, timeRange);
      
      // Fallback to mock data if API fails
      if (!data) {
        console.log('[useHealthVelocity] Using mock data as fallback');
        const mockData = generateMockHealthData();
        return mockData.healthVelocity;
      }
      
      return data;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 60 * 2, // 2 hours
    ...INTELLIGENCE_QUERY_OPTIONS
  });
}

/**
 * Hook for fetching Body Systems data
 */
export function useBodySystems() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['body-systems', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      console.log('[useBodySystems] Fetching data');
      const data = await intelligenceClient.fetchBodySystems(user.id);
      
      // Fallback to mock data if API fails
      if (!data) {
        console.log('[useBodySystems] Using mock data as fallback');
        const mockData = generateMockHealthData();
        return mockData.bodySystems;
      }
      
      return data;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 60 * 2, // 2 hours
    ...INTELLIGENCE_QUERY_OPTIONS
  });
}

/**
 * Hook for fetching Master Timeline data
 */
export function useMasterTimeline(timeRange: '7D' | '30D' | '90D' | '1Y' | 'ALL' = '30D') {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['timeline', user?.id, timeRange],
    queryFn: async () => {
      if (!user?.id) return null;
      
      console.log('[useMasterTimeline] Fetching data for:', timeRange);
      const data = await intelligenceClient.fetchTimeline(user.id, timeRange);
      
      // Fallback to mock data if API fails
      if (!data) {
        console.log('[useMasterTimeline] Using mock data as fallback');
        const mockData = generateMockHealthData();
        return mockData.timeline;
      }
      
      return data;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 30, // 30 minutes (more dynamic data)
    gcTime: 1000 * 60 * 60, // 1 hour
    ...INTELLIGENCE_QUERY_OPTIONS
  });
}

/**
 * Hook for fetching Pattern Discovery cards
 */
export function usePatternDiscovery(limit = 10) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['patterns', user?.id, limit],
    queryFn: async () => {
      if (!user?.id) return [];
      
      console.log('[usePatternDiscovery] Fetching patterns, limit:', limit);
      const data = await intelligenceClient.fetchPatterns(user.id, limit);
      
      // Fallback to mock data if API fails or returns empty
      if (!data || data.length === 0) {
        console.log('[usePatternDiscovery] Using mock data as fallback');
        const mockData = generateMockHealthData();
        return mockData.patternCards;
      }
      
      return data;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 60 * 6, // 6 hours (patterns don't change often)
    gcTime: 1000 * 60 * 60 * 12, // 12 hours
    ...INTELLIGENCE_QUERY_OPTIONS
  });
}

/**
 * Hook for fetching Doctor Readiness score
 */
export function useDoctorReadiness() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['doctor-readiness', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      console.log('[useDoctorReadiness] Fetching data');
      const data = await intelligenceClient.fetchDoctorReadiness(user.id);
      
      // Fallback to mock data if API fails
      if (!data) {
        console.log('[useDoctorReadiness] Using mock data as fallback');
        const mockData = generateMockHealthData();
        return mockData.doctorReadiness;
      }
      
      return data;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 60 * 2, // 2 hours
    ...INTELLIGENCE_QUERY_OPTIONS
  });
}

/**
 * Hook for fetching Comparative Intelligence
 */
export function useComparativeIntelligence(patternLimit = 5) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['comparative-intelligence', user?.id, patternLimit],
    queryFn: async () => {
      if (!user?.id) return null;
      
      console.log('[useComparativeIntelligence] Fetching data, pattern limit:', patternLimit);
      const data = await intelligenceClient.fetchComparativeIntelligence(user.id, patternLimit);
      
      // Fallback to mock data if API fails
      if (!data) {
        console.log('[useComparativeIntelligence] Using mock data as fallback');
        const mockData = generateMockHealthData();
        return mockData.comparativeIntelligence;
      }
      
      return data;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 60 * 12, // 12 hours (aggregate data changes slowly)
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
    ...INTELLIGENCE_QUERY_OPTIONS
  });
}

/**
 * Hook to fetch all intelligence data at once (for initial load optimization)
 */
export function useAllIntelligenceData() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Fetch all data in parallel
  const healthVelocity = useHealthVelocity('7D');
  const bodySystems = useBodySystems();
  const timeline = useMasterTimeline('30D');
  const patterns = usePatternDiscovery(10);
  const doctorReadiness = useDoctorReadiness();
  const comparative = useComparativeIntelligence(5);
  
  // Check if all data is loaded
  const isLoading = 
    healthVelocity.isLoading ||
    bodySystems.isLoading ||
    timeline.isLoading ||
    patterns.isLoading ||
    doctorReadiness.isLoading ||
    comparative.isLoading;
  
  // Check for any errors
  const hasError = 
    healthVelocity.isError ||
    bodySystems.isError ||
    timeline.isError ||
    patterns.isError ||
    doctorReadiness.isError ||
    comparative.isError;
  
  // Refresh all data
  const refreshAll = async () => {
    console.log('[useAllIntelligenceData] Refreshing all data');
    
    // Clear cache
    if (user?.id) {
      await intelligenceClient.clearCache(user.id);
    }
    
    // Invalidate all queries
    await queryClient.invalidateQueries({ queryKey: ['health-velocity'] });
    await queryClient.invalidateQueries({ queryKey: ['body-systems'] });
    await queryClient.invalidateQueries({ queryKey: ['timeline'] });
    await queryClient.invalidateQueries({ queryKey: ['patterns'] });
    await queryClient.invalidateQueries({ queryKey: ['doctor-readiness'] });
    await queryClient.invalidateQueries({ queryKey: ['comparative-intelligence'] });
  };
  
  // Prefetch data for hover interactions
  const prefetchOnHover = (dataType: string) => {
    if (!user?.id) return;
    
    switch(dataType) {
      case 'velocity-30d':
        queryClient.prefetchQuery({
          queryKey: ['health-velocity', user.id, '30D'],
          queryFn: () => intelligenceClient.fetchHealthVelocity(user.id, '30D')
        });
        break;
      case 'velocity-90d':
        queryClient.prefetchQuery({
          queryKey: ['health-velocity', user.id, '90D'],
          queryFn: () => intelligenceClient.fetchHealthVelocity(user.id, '90D')
        });
        break;
      case 'timeline-year':
        queryClient.prefetchQuery({
          queryKey: ['timeline', user.id, '1Y'],
          queryFn: () => intelligenceClient.fetchTimeline(user.id, '1Y')
        });
        break;
      case 'patterns-all':
        queryClient.prefetchQuery({
          queryKey: ['patterns', user.id, 50],
          queryFn: () => intelligenceClient.fetchPatterns(user.id, 50)
        });
        break;
    }
  };
  
  return {
    data: {
      healthVelocity: healthVelocity.data,
      bodySystems: bodySystems.data,
      timeline: timeline.data,
      patterns: patterns.data,
      doctorReadiness: doctorReadiness.data,
      comparative: comparative.data
    },
    isLoading,
    hasError,
    refreshAll,
    prefetchOnHover,
    individualQueries: {
      healthVelocity,
      bodySystems,
      timeline,
      patterns,
      doctorReadiness,
      comparative
    }
  };
}
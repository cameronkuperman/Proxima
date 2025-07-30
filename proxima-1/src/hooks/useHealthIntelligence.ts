import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface HealthInsight {
  id: string;
  insight_type: 'positive' | 'warning' | 'neutral';
  title: string;
  description: string;
  confidence: number;
  created_at: string;
}

interface HealthPrediction {
  id: string;
  event_description: string;
  probability: number;
  timeframe: string;
  preventable: boolean;
  reasoning: string;
  suggested_actions?: string[];
}

interface ShadowPattern {
  id: string;
  pattern_name: string;
  pattern_category: string;
  last_seen_description: string;
  significance: 'high' | 'medium' | 'low';
  days_missing: number;
}

interface HealthStrategy {
  id: string;
  strategy: string;
  strategy_type: 'prevention' | 'optimization' | 'discovery' | 'maintenance';
  priority: number;
  rationale: string;
  expected_outcome: string;
}

interface HealthIntelligence {
  insights: HealthInsight[];
  predictions: HealthPrediction[];
  shadowPatterns: ShadowPattern[];
  strategies: HealthStrategy[];
  isLoading: boolean;
  isGenerating: boolean;
  weekOf: string;
  error: string | null;
}

export function useHealthIntelligence(): HealthIntelligence {
  const { user } = useAuth();
  const [insights, setInsights] = useState<HealthInsight[]>([]);
  const [predictions, setPredictions] = useState<HealthPrediction[]>([]);
  const [shadowPatterns, setShadowPatterns] = useState<ShadowPattern[]>([]);
  const [strategies, setStrategies] = useState<HealthStrategy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [weekOf, setWeekOf] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    // Load all components on mount and generate if needed
    loadHealthIntelligence();
  }, [user?.id]);

  const loadHealthIntelligence = async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    setError(null);
    
    console.log('🔍 Starting Health Intelligence Load...');
    console.log('User ID:', user.id);
    
    try {
      const API_URL = process.env.NEXT_PUBLIC_ORACLE_API_URL || process.env.NEXT_PUBLIC_API_URL || 'https://web-production-945c4.up.railway.app';
      console.log('API URL:', API_URL);
      
      // Fetch all components in parallel
      console.log('📡 Fetching all components...');
      const [insightsRes, predictionsRes, patternsRes, strategiesRes] = await Promise.all([
        fetch(`${API_URL}/api/insights/${user.id}`).then(res => {
          console.log(`✅ Insights Response: ${res.status} ${res.statusText}`);
          return res;
        }),
        fetch(`${API_URL}/api/predictions/${user.id}`).then(res => {
          console.log(`✅ Predictions Response: ${res.status} ${res.statusText}`);
          return res;
        }),
        fetch(`${API_URL}/api/shadow-patterns/${user.id}`).then(res => {
          console.log(`✅ Shadow Patterns Response: ${res.status} ${res.statusText}`);
          return res;
        }),
        fetch(`${API_URL}/api/strategies/${user.id}`).then(res => {
          console.log(`✅ Strategies Response: ${res.status} ${res.statusText}`);
          return res;
        })
      ]);

      const [insightsData, predictionsData, patternsData, strategiesData] = await Promise.all([
        insightsRes.json().then(data => {
          console.log('📊 Insights Data:', data);
          return data;
        }),
        predictionsRes.json().then(data => {
          console.log('📊 Predictions Data:', data);
          return data;
        }),
        patternsRes.json().then(data => {
          console.log('📊 Shadow Patterns Data:', data);
          return data;
        }),
        strategiesRes.json().then(data => {
          console.log('📊 Strategies Data:', data);
          return data;
        })
      ]);

      // Set data
      console.log('💾 Setting data to state...');
      setInsights(insightsData.insights || []);
      setPredictions(predictionsData.predictions || []);
      setShadowPatterns(patternsData.shadow_patterns || []);
      setStrategies(strategiesData.strategies || []);
      
      // Set week of from any response
      const weekDate = insightsData.week_of || predictionsData.week_of || patternsData.week_of || strategiesData.week_of;
      if (weekDate) {
        console.log('📅 Week Of:', weekDate);
        setWeekOf(weekDate);
      }

      // Check if we need to generate data
      const hasAnyData = 
        (insightsData.insights?.length > 0) ||
        (predictionsData.predictions?.length > 0) ||
        (patternsData.shadow_patterns?.length > 0) ||
        (strategiesData.strategies?.length > 0);

      console.log('📈 Data Status:', {
        hasInsights: insightsData.insights?.length > 0,
        hasPredictions: predictionsData.predictions?.length > 0,
        hasShadowPatterns: patternsData.shadow_patterns?.length > 0,
        hasStrategies: strategiesData.strategies?.length > 0,
        hasAnyData
      });

      if (!hasAnyData) {
        console.log('⚠️ No data exists, generating all components...');
        await generateAllComponents();
      } else {
        console.log('✨ Data loaded successfully!');
      }
    } catch (error) {
      console.error('❌ Error loading health intelligence:', error);
      setError('Failed to load health intelligence data');
      // Try to generate on error
      console.log('🔄 Attempting to generate after error...');
      await generateAllComponents();
    } finally {
      setIsLoading(false);
      console.log('🏁 Health Intelligence load complete');
    }
  };

  const generateAllComponents = async () => {
    if (!user?.id || isGenerating) return;
    
    setIsGenerating(true);
    setError(null);
    
    console.log('🚀 Starting Health Intelligence Generation...');
    
    try {
      const API_URL = process.env.NEXT_PUBLIC_ORACLE_API_URL || process.env.NEXT_PUBLIC_API_URL || 'https://web-production-945c4.up.railway.app';
      
      // Generate each component individually in sequence
      // First generate insights
      console.log('1️⃣ Generating Insights...');
      const insightsRes = await fetch(`${API_URL}/api/generate-insights/${user.id}`, { method: 'POST' });
      console.log(`   Insights Generation Response: ${insightsRes.status} ${insightsRes.statusText}`);
      if (insightsRes.ok) {
        const insightsData = await insightsRes.json();
        console.log('   Generated Insights:', insightsData);
        setInsights(insightsData.insights || []);
      } else {
        console.error('   ❌ Failed to generate insights:', await insightsRes.text());
      }
      
      // Then generate predictions
      console.log('2️⃣ Generating Predictions...');
      const predictionsRes = await fetch(`${API_URL}/api/generate-predictions/${user.id}`, { method: 'POST' });
      console.log(`   Predictions Generation Response: ${predictionsRes.status} ${predictionsRes.statusText}`);
      if (predictionsRes.ok) {
        const predictionsData = await predictionsRes.json();
        console.log('   Generated Predictions:', predictionsData);
        setPredictions(predictionsData.predictions || []);
      } else {
        console.error('   ❌ Failed to generate predictions:', await predictionsRes.text());
      }
      
      // Then generate shadow patterns
      console.log('3️⃣ Generating Shadow Patterns...');
      const patternsRes = await fetch(`${API_URL}/api/generate-shadow-patterns/${user.id}`, { method: 'POST' });
      console.log(`   Shadow Patterns Generation Response: ${patternsRes.status} ${patternsRes.statusText}`);
      if (patternsRes.ok) {
        const patternsData = await patternsRes.json();
        console.log('   Generated Shadow Patterns:', patternsData);
        setShadowPatterns(patternsData.shadow_patterns || []);
      } else {
        console.error('   ❌ Failed to generate shadow patterns:', await patternsRes.text());
      }
      
      // Finally generate strategies (needs other components)
      console.log('4️⃣ Generating Strategies...');
      const strategiesRes = await fetch(`${API_URL}/api/generate-strategies/${user.id}`, { method: 'POST' });
      console.log(`   Strategies Generation Response: ${strategiesRes.status} ${strategiesRes.statusText}`);
      if (strategiesRes.ok) {
        const strategiesData = await strategiesRes.json();
        console.log('   Generated Strategies:', strategiesData);
        setStrategies(strategiesData.strategies || []);
      } else {
        console.error('   ❌ Failed to generate strategies:', await strategiesRes.text());
      }
      
      // Reload to get fresh data
      console.log('♻️ Reloading fresh data...');
      await loadHealthIntelligence();
    } catch (error) {
      console.error('❌ Error generating health intelligence:', error);
      setError('Failed to generate health intelligence data');
    } finally {
      setIsGenerating(false);
      console.log('🏁 Generation complete');
    }
  };

  const regenerateComponent = async (component: 'insights' | 'predictions' | 'shadow-patterns' | 'strategies') => {
    if (!user?.id || isGenerating) return;
    
    setIsGenerating(true);
    setError(null);
    
    try {
      const API_URL = process.env.NEXT_PUBLIC_ORACLE_API_URL || process.env.NEXT_PUBLIC_API_URL || 'https://web-production-945c4.up.railway.app';
      const response = await fetch(`${API_URL}/api/generate-${component}/${user.id}`, { method: 'POST' });
      
      if (response.ok) {
        await loadHealthIntelligence();
      } else {
        throw new Error(`Failed to regenerate ${component}`);
      }
    } catch (error) {
      console.error(`Error regenerating ${component}:`, error);
      setError(`Failed to regenerate ${component}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    insights,
    predictions,
    shadowPatterns,
    strategies,
    isLoading,
    isGenerating,
    weekOf,
    error,
    refresh: loadHealthIntelligence,
    regenerateAll: generateAllComponents,
    regenerateComponent
  };
}

// Legacy hooks for compatibility
export function useHealthAnalysis(weekOf?: string) {
  const { insights, predictions, shadowPatterns, strategies, isLoading, error } = useHealthIntelligence();
  
  return {
    data: {
      insights,
      predictions,
      shadow_patterns: shadowPatterns,
      strategies
    },
    isLoading,
    error
  };
}

export function useGenerateAnalysis() {
  const { regenerateAll, isGenerating, error } = useHealthIntelligence();
  
  return {
    generate: regenerateAll,
    isGenerating,
    error
  };
}

export function useExportPDF() {
  return {
    exportPDF: async () => null,
    isExporting: false,
    error: null
  };
}

export function useShareWithDoctor() {
  return {
    share: async () => null,
    isSharing: false,
    error: null
  };
}
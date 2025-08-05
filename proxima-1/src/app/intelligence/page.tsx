'use client';

import { AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import NarrativeView from '@/components/intelligence/NarrativeView';
import DataView from '@/components/intelligence/DataView';
import UnifiedAuthGuard from '@/components/UnifiedAuthGuard';
import { useHealthIntelligence } from '@/hooks/useHealthIntelligence';
import { RefreshCw, Bug, Activity, AlertCircle } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function IntelligencePage() {
  const router = useRouter();
  const [activeView, setActiveView] = useState<'narrative' | 'data'>('narrative');
  const [showDebug, setShowDebug] = useState(false);
  const [forceRefresh, setForceRefresh] = useState(false);
  
  const {
    insights,
    predictions,
    shadowPatterns,
    strategies,
    isLoading,
    isGenerating,
    generatingInsights,
    generatingShadowPatterns,
    weekOf,
    error,
    insightsError,
    patternsError,
    generationStatus,
    cacheInfo,
    refresh,
    regenerateAll,
    regenerateComponent,
    generateWeeklyAnalysis,
    generateInsights,
    generateShadowPatterns
  } = useHealthIntelligence();
  
  // Debug logging
  useEffect(() => {
    console.log('🎯 Intelligence Page Data:', {
      insights,
      predictions,
      shadowPatterns,
      strategies,
      isLoading,
      error,
      generationStatus,
      cacheInfo
    });
  }, [insights, predictions, shadowPatterns, strategies, isLoading, error, generationStatus, cacheInfo]);

  // Auto-generate if no data after initial load
  useEffect(() => {
    if (!isLoading && !isGenerating) {
      const hasNoData = insights.length === 0 && predictions.length === 0 && 
                       shadowPatterns.length === 0 && strategies.length === 0;
      
      if (hasNoData && !error) {
        console.log('🚀 No intelligence data found, auto-generating all components...');
        regenerateAll(false);
      } else {
        // Check individual components that might need generation
        if (insights.length === 0 && !generatingInsights && !insightsError) {
          console.log('🚀 Auto-generating insights because none exist...');
          generateInsights(false);
        }
        
        if (shadowPatterns.length === 0 && !generatingShadowPatterns && !patternsError) {
          console.log('🚀 Auto-generating shadow patterns because none exist...');
          generateShadowPatterns(false);
        }
      }
    }
  }, [isLoading, isGenerating, insights.length, predictions.length, shadowPatterns.length, strategies.length, error, regenerateAll, generateInsights, generateShadowPatterns, generatingInsights, generatingShadowPatterns, insightsError, patternsError]);

  const handleRefresh = async () => {
    console.log('🔄 Manual refresh triggered');
    await refresh();
  };

  const handleRegenerate = async () => {
    console.log('🚀 Manual regeneration triggered');
    console.log('   Force refresh:', forceRefresh);
    await regenerateAll(forceRefresh);
  };

  const handleRegenerateComponent = async (component: 'insights' | 'predictions' | 'shadow-patterns' | 'strategies') => {
    console.log(`🔄 Regenerating ${component}...`);
    console.log('   Force refresh:', forceRefresh);
    await regenerateComponent(component, forceRefresh);
  };

  const handleGenerateWeeklyAnalysis = async () => {
    console.log('📊 Generating weekly analysis...');
    await generateWeeklyAnalysis({ forceRefresh });
  };

  return (
    <UnifiedAuthGuard requireAuth={true}>
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <div className="border-b border-white/[0.08] bg-[#0a0a0a]/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/[0.05] rounded-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <h1 className="text-xl font-semibold text-white">Health Intelligence</h1>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Debug Toggle */}
              <button
                onClick={() => setShowDebug(!showDebug)}
                className={`p-2 rounded-lg transition-all ${
                  showDebug ? 'bg-purple-500/20 text-purple-400' : 'text-gray-400 hover:text-white hover:bg-white/[0.05]'
                }`}
                title="Toggle Debug Panel"
              >
                <Bug className="w-5 h-5" />
              </button>

              {/* Refresh Button */}
              <button
                onClick={handleRefresh}
                disabled={isLoading || isGenerating}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] rounded-lg text-gray-400 hover:text-white transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading || isGenerating ? 'animate-spin' : ''}`} />
                {isLoading ? 'Loading...' : isGenerating ? 'Generating...' : 'Refresh'}
              </button>

              {/* View Toggle */}
              <div className="flex items-center gap-2 bg-white/[0.03] p-1 rounded-lg border border-white/[0.05]">
                <button
                  onClick={() => setActiveView('narrative')}
                  className={`px-4 py-1.5 text-sm rounded-md transition-all ${
                    activeView === 'narrative'
                      ? 'bg-white/[0.08] text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Narrative
                </button>
                <button
                  onClick={() => setActiveView('data')}
                  className={`px-4 py-1.5 text-sm rounded-md transition-all ${
                    activeView === 'data'
                      ? 'bg-white/[0.08] text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Data View
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Debug Panel */}
      {showDebug && (
        <div className="border-b border-white/[0.08] bg-black/50 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto px-6 py-4">
            <h3 className="text-white font-medium mb-3 flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Debug Information
            </h3>
            
            {/* Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="bg-white/[0.03] rounded-lg p-3 border border-white/[0.05]">
                <h4 className="text-sm text-gray-400 mb-2">Status</h4>
                <div className="space-y-1 text-sm">
                  <p className="text-gray-300">Loading: <span className={isLoading ? 'text-yellow-400' : 'text-green-400'}>{isLoading ? 'Yes' : 'No'}</span></p>
                  <p className="text-gray-300">Generating: <span className={isGenerating ? 'text-yellow-400' : 'text-green-400'}>{isGenerating ? 'Yes' : 'No'}</span></p>
                  <p className="text-gray-300">Week Of: <span className="text-white">{weekOf || 'Not set'}</span></p>
                  {error && <p className="text-red-400">Error: {error}</p>}
                </div>
              </div>
              
              <div className="bg-white/[0.03] rounded-lg p-3 border border-white/[0.05]">
                <h4 className="text-sm text-gray-400 mb-2">Data Status</h4>
                <div className="space-y-1 text-sm">
                  <p className="text-gray-300">
                    Insights: <span className={insights.length > 0 ? 'text-green-400' : 'text-gray-500'}>{insights.length} items</span>
                    {cacheInfo.insights && <span className="text-xs text-blue-400 ml-2">(cached)</span>}
                  </p>
                  <p className="text-gray-300">
                    Predictions: <span className={predictions.length > 0 ? 'text-green-400' : 'text-gray-500'}>{predictions.length} items</span>
                    {cacheInfo.predictions && <span className="text-xs text-blue-400 ml-2">(cached)</span>}
                  </p>
                  <p className="text-gray-300">
                    Shadow Patterns: <span className={shadowPatterns.length > 0 ? 'text-green-400' : 'text-gray-500'}>{shadowPatterns.length} items</span>
                    {cacheInfo.shadowPatterns && <span className="text-xs text-blue-400 ml-2">(cached)</span>}
                  </p>
                  <p className="text-gray-300">
                    Strategies: <span className={strategies.length > 0 ? 'text-green-400' : 'text-gray-500'}>{strategies.length} items</span>
                    {cacheInfo.strategies && <span className="text-xs text-blue-400 ml-2">(cached)</span>}
                  </p>
                </div>
              </div>
            </div>

            {/* Generation Status */}
            {generationStatus && (
              <div className="bg-white/[0.03] rounded-lg p-3 border border-white/[0.05] mb-4">
                <h4 className="text-sm text-gray-400 mb-2">Generation Status</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <p className="text-gray-300">
                    Insights: {generationStatus.insights ? 
                      <span className="text-green-400">✓ Generated</span> : 
                      <span className="text-yellow-400">⏳ Pending</span>
                    }
                  </p>
                  <p className="text-gray-300">
                    Predictions: {generationStatus.predictions ? 
                      <span className="text-green-400">✓ Generated</span> : 
                      <span className="text-yellow-400">⏳ Pending</span>
                    }
                  </p>
                  <p className="text-gray-300">
                    Shadow Patterns: {generationStatus.shadow_patterns ? 
                      <span className="text-green-400">✓ Generated</span> : 
                      <span className="text-yellow-400">⏳ Pending</span>
                    }
                  </p>
                  <p className="text-gray-300">
                    Strategies: {generationStatus.strategies ? 
                      <span className="text-green-400">✓ Generated</span> : 
                      <span className="text-yellow-400">⏳ Pending</span>
                    }
                  </p>
                </div>
                {generationStatus.last_generated && (
                  <p className="text-xs text-gray-500 mt-2">
                    Last generated: {new Date(generationStatus.last_generated).toLocaleString()}
                  </p>
                )}
                {generationStatus.refresh_limits && (
                  <div className="mt-3 p-2 bg-white/[0.02] rounded-lg">
                    <p className="text-xs text-gray-400">
                      Refreshes: {generationStatus.refresh_limits.refreshes_used}/{generationStatus.refresh_limits.weekly_limit} used
                    </p>
                    <p className="text-xs text-gray-400">
                      {generationStatus.refresh_limits.refreshes_remaining} remaining
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Resets: {new Date(generationStatus.refresh_limits.resets_at).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="space-y-2">
              {/* Force Refresh Toggle */}
              <div className="flex items-center gap-3 mb-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={forceRefresh}
                    onChange={(e) => setForceRefresh(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-purple-500 focus:ring-purple-500 focus:ring-offset-0"
                  />
                  <span className="text-sm text-gray-300">Force Refresh (bypass cache)</span>
                </label>
                {forceRefresh && (
                  <span className="text-xs text-yellow-400">⚠️ Will regenerate even if cached data exists</span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleRegenerate}
                  disabled={isGenerating}
                  className="px-3 py-1.5 text-sm bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg transition-all disabled:opacity-50"
                >
                  Regenerate All Components
                </button>
                <span className="text-xs text-gray-500">Generate all 4 components in sequence</span>
              </div>

              {/* Weekly Analysis Button */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleGenerateWeeklyAnalysis}
                  disabled={isGenerating}
                  className="px-3 py-1.5 text-sm bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-all disabled:opacity-50"
                >
                  Generate Weekly Analysis
                </button>
                <span className="text-xs text-gray-500">Use the comprehensive weekly endpoint</span>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => generateInsights(true)}
                  disabled={generatingInsights}
                  className="px-3 py-1.5 text-sm bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition-all disabled:opacity-50"
                >
                  {generatingInsights ? 'Generating Insights...' : 'Force Generate Insights'}
                </button>
                <button
                  onClick={() => generateShadowPatterns(true)}
                  disabled={generatingShadowPatterns}
                  className="px-3 py-1.5 text-sm bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg transition-all disabled:opacity-50"
                >
                  {generatingShadowPatterns ? 'Generating Patterns...' : 'Force Generate Shadow Patterns'}
                </button>
                <button
                  onClick={() => handleRegenerateComponent('predictions')}
                  disabled={isGenerating}
                  className="px-3 py-1.5 text-sm bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] rounded-lg text-gray-400 hover:text-white transition-all disabled:opacity-50"
                >
                  Regenerate Predictions
                </button>
                <button
                  onClick={() => handleRegenerateComponent('shadow-patterns')}
                  disabled={isGenerating}
                  className="px-3 py-1.5 text-sm bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] rounded-lg text-gray-400 hover:text-white transition-all disabled:opacity-50"
                >
                  Regenerate Shadow Patterns
                </button>
                <button
                  onClick={() => handleRegenerateComponent('strategies')}
                  disabled={isGenerating}
                  className="px-3 py-1.5 text-sm bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] rounded-lg text-gray-400 hover:text-white transition-all disabled:opacity-50"
                >
                  Regenerate Strategies
                </button>
              </div>

              <div className="mt-3 p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                <p className="text-xs text-yellow-400 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  Check the browser console (F12) for detailed logs of all API calls and responses. Each endpoint call is logged with emojis for easy tracking.
                </p>
              </div>
              
              {/* API Configuration Info */}
              <div className="mt-3 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                <h5 className="text-xs font-medium text-blue-400 mb-2">API Endpoints Reference</h5>
                <div className="space-y-1 text-xs font-mono text-gray-400">
                  <p>Base: {process.env.NEXT_PUBLIC_ORACLE_API_URL || process.env.NEXT_PUBLIC_API_URL || 'https://web-production-945c4.up.railway.app'}</p>
                  <p>Combined: /api/generate-all-intelligence/{'{user_id}'}</p>
                  <p>Insights: /api/generate-insights/{'{user_id}'}</p>
                  <p>Predictions: /api/generate-predictions/{'{user_id}'}</p>
                  <p>Shadow: /api/generate-shadow-patterns/{'{user_id}'}</p>
                  <p>Strategies: /api/generate-strategies/{'{user_id}'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content - Full width */}
      <div className="px-6 py-8">
        {/* Show error if backend is unreachable */}
        {error && error.includes('Cannot connect') && (
          <div className="max-w-4xl mx-auto mb-6">
            <div className="backdrop-blur-[20px] bg-red-500/10 border border-red-500/20 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-red-400 mb-2 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Backend Connection Error
              </h3>
              <p className="text-gray-300 mb-4">
                Unable to connect to the health intelligence API. The backend server may be down or there's a CORS configuration issue.
              </p>
              <div className="bg-black/20 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-400 font-mono">
                  API URL: {process.env.NEXT_PUBLIC_ORACLE_API_URL || process.env.NEXT_PUBLIC_API_URL || 'https://web-production-945c4.up.railway.app'}
                </p>
                <p className="text-sm text-gray-400 font-mono">
                  Error: {error}
                </p>
              </div>
              <p className="text-sm text-gray-400">
                Please contact the backend team to check if the health intelligence endpoints are deployed and accessible.
              </p>
            </div>
          </div>
        )}
        
        <AnimatePresence mode="wait">
          {activeView === 'narrative' ? (
            <NarrativeView key="narrative" />
          ) : (
            <DataView key="data" />
          )}
        </AnimatePresence>
      </div>
    </div>
    </UnifiedAuthGuard>
  );
}
'use client';

import { AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
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
  
  const {
    insights,
    predictions,
    shadowPatterns,
    strategies,
    isLoading,
    isGenerating,
    weekOf,
    error,
    refresh,
    regenerateAll,
    regenerateComponent
  } = useHealthIntelligence();

  const handleRefresh = async () => {
    console.log('🔄 Manual refresh triggered');
    await refresh();
  };

  const handleRegenerate = async () => {
    console.log('🚀 Manual regeneration triggered');
    await regenerateAll();
  };

  const handleRegenerateComponent = async (component: 'insights' | 'predictions' | 'shadow-patterns' | 'strategies') => {
    console.log(`🔄 Regenerating ${component}...`);
    await regenerateComponent(component);
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
                  <p className="text-gray-300">Insights: <span className={insights.length > 0 ? 'text-green-400' : 'text-gray-500'}>{insights.length} items</span></p>
                  <p className="text-gray-300">Predictions: <span className={predictions.length > 0 ? 'text-green-400' : 'text-gray-500'}>{predictions.length} items</span></p>
                  <p className="text-gray-300">Shadow Patterns: <span className={shadowPatterns.length > 0 ? 'text-green-400' : 'text-gray-500'}>{shadowPatterns.length} items</span></p>
                  <p className="text-gray-300">Strategies: <span className={strategies.length > 0 ? 'text-green-400' : 'text-gray-500'}>{strategies.length} items</span></p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2">
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
              
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleRegenerateComponent('insights')}
                  disabled={isGenerating}
                  className="px-3 py-1.5 text-sm bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] rounded-lg text-gray-400 hover:text-white transition-all disabled:opacity-50"
                >
                  Regenerate Insights
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
            </div>
          </div>
        </div>
      )}

      {/* Main Content - Full width */}
      <div className="px-6 py-8">
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
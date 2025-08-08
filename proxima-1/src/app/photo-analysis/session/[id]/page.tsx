'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Download, 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  ChevronLeft, 
  ChevronRight,
  ZoomIn,
  Layers,
  LineChart,
  Camera,
  Clock,
  AlertCircle
} from 'lucide-react';
import Image from 'next/image';
import { useAnalysisHistory, useSessionTimeline } from '@/hooks/queries/usePhotoAnalysisQueries';
import UnifiedAuthGuard from '@/components/UnifiedAuthGuard';

export default function PhotoSessionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params?.id as string;
  
  const [currentAnalysisIndex, setCurrentAnalysisIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'single' | 'compare' | 'timeline'>('single');
  const [compareIndex, setCompareIndex] = useState<number | null>(null);
  const [showZoom, setShowZoom] = useState(false);
  
  const { data: historyData, isLoading: historyLoading } = useAnalysisHistory(sessionId);
  const { data: timelineData, isLoading: timelineLoading } = useSessionTimeline(sessionId);
  
  const analyses = historyData?.analyses || [];
  const currentAnalysis = analyses[currentAnalysisIndex];
  const compareAnalysis = compareIndex !== null ? analyses[compareIndex] : null;
  
  // Navigation helpers
  const goToPrevious = () => {
    if (currentAnalysisIndex > 0) {
      setCurrentAnalysisIndex(currentAnalysisIndex - 1);
    }
  };
  
  const goToNext = () => {
    if (currentAnalysisIndex < analyses.length - 1) {
      setCurrentAnalysisIndex(currentAnalysisIndex + 1);
    }
  };
  
  // Get trend icon
  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingDown className="w-4 h-4 text-green-400" />;
      case 'worsening':
        return <TrendingUp className="w-4 h-4 text-red-400" />;
      default:
        return <Minus className="w-4 h-4 text-gray-400" />;
    }
  };
  
  // Get confidence color
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-400 bg-green-400/10';
    if (confidence >= 60) return 'text-yellow-400 bg-yellow-400/10';
    return 'text-red-400 bg-red-400/10';
  };
  
  if (historyLoading || timelineLoading) {
    return (
      <UnifiedAuthGuard requireAuth={true}>
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
          <div className="text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-12 h-12 border-3 border-orange-500 border-t-transparent rounded-full mx-auto mb-4"
            />
            <p className="text-gray-400">Loading session details...</p>
          </div>
        </div>
      </UnifiedAuthGuard>
    );
  }
  
  if (!historyData || analyses.length === 0) {
    return (
      <UnifiedAuthGuard requireAuth={true}>
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No analyses found for this session</p>
            <button
              onClick={() => router.push('/photo-analysis')}
              className="mt-4 px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              Back to Photo Analysis
            </button>
          </div>
        </div>
      </UnifiedAuthGuard>
    );
  }
  
  return (
    <UnifiedAuthGuard requireAuth={true}>
      <div className="min-h-screen bg-[#0a0a0a]">
        {/* Header */}
        <div className="border-b border-white/[0.05] bg-black/50 backdrop-blur-xl sticky top-0 z-20">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => router.push('/photo-analysis')}
                  className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Back
                </button>
                <div>
                  <h1 className="text-xl font-semibold text-white">
                    {historyData.session.condition_name}
                  </h1>
                  <p className="text-sm text-gray-400">
                    {analyses.length} analyses • Started {new Date(historyData.session.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <button className="p-2 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] transition-colors">
                  <Download className="w-5 h-5 text-gray-400" />
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Timeline Navigation */}
        <div className="border-b border-white/[0.05] bg-black/30 backdrop-blur-lg">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-400 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Analysis Timeline
              </h3>
              <div className="flex items-center gap-2">
                {['single', 'compare', 'timeline'].map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode as any)}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                      viewMode === mode
                        ? 'bg-orange-500 text-white'
                        : 'bg-white/[0.05] text-gray-400 hover:text-white'
                    }`}
                  >
                    {mode === 'single' && <Camera className="w-4 h-4 inline mr-1" />}
                    {mode === 'compare' && <Layers className="w-4 h-4 inline mr-1" />}
                    {mode === 'timeline' && <LineChart className="w-4 h-4 inline mr-1" />}
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Timeline Dots */}
            <div className="relative">
              <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-800" />
              <div className="relative flex justify-between overflow-x-auto pb-2">
                {analyses.map((analysis: any, index: number) => {
                  const isActive = index === currentAnalysisIndex;
                  const isCompare = index === compareIndex;
                  
                  return (
                    <motion.div
                      key={analysis.id}
                      className="relative flex-shrink-0 cursor-pointer"
                      onClick={() => {
                        if (viewMode === 'compare' && !isActive) {
                          setCompareIndex(index);
                        } else {
                          setCurrentAnalysisIndex(index);
                        }
                      }}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <div
                        className={`
                          relative w-8 h-8 rounded-full border-2 transition-all duration-300
                          ${isActive 
                            ? 'border-orange-500 bg-orange-500/20' 
                            : isCompare
                            ? 'border-blue-500 bg-blue-500/20'
                            : 'border-gray-700 bg-gray-900 hover:border-gray-600'
                          }
                        `}
                      >
                        <div className={`absolute inset-1 rounded-full ${
                          analysis.confidence >= 80 ? 'bg-green-500' :
                          analysis.confidence >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                        } opacity-50`} />
                        {analysis.trend && (
                          <div className="absolute -top-6 left-1/2 -translate-x-1/2">
                            {getTrendIcon(analysis.trend)}
                          </div>
                        )}
                      </div>
                      <div className="absolute top-10 left-1/2 -translate-x-1/2 text-xs text-gray-500 whitespace-nowrap">
                        {new Date(analysis.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
        
        {/* Main Content Area */}
        <div className="max-w-7xl mx-auto px-6 py-8">
          <AnimatePresence mode="wait">
            {viewMode === 'single' && currentAnalysis && (
              <motion.div
                key="single"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-8"
              >
                {/* Photo Viewer */}
                <div className="lg:col-span-2">
                  <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-900">
                    {currentAnalysis.photo_url ? (
                      <img
                        src={currentAnalysis.photo_url}
                        alt="Medical photo"
                        className="w-full h-full object-contain cursor-zoom-in"
                        onClick={() => setShowZoom(true)}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <Camera className="w-16 h-16 text-gray-700" />
                      </div>
                    )}
                    
                    {/* Navigation Arrows */}
                    <button
                      onClick={goToPrevious}
                      disabled={currentAnalysisIndex === 0}
                      className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-black/70 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronLeft className="w-6 h-6 text-white" />
                    </button>
                    <button
                      onClick={goToNext}
                      disabled={currentAnalysisIndex === analyses.length - 1}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-black/70 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronRight className="w-6 h-6 text-white" />
                    </button>
                    
                    {/* Zoom Icon */}
                    <button
                      onClick={() => setShowZoom(true)}
                      className="absolute top-4 right-4 p-2 rounded-lg bg-black/50 hover:bg-black/70 transition-all"
                    >
                      <ZoomIn className="w-5 h-5 text-white" />
                    </button>
                  </div>
                  
                  {/* Analysis Date & Number */}
                  <div className="mt-4 flex items-center justify-between">
                    <p className="text-gray-400">
                      Analysis #{currentAnalysisIndex + 1} of {analyses.length}
                    </p>
                    <p className="text-gray-400">
                      {new Date(currentAnalysis.date).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>
                </div>
                
                {/* Analysis Details */}
                <div className="space-y-4">
                  {/* Confidence Score */}
                  <div className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl p-6">
                    <h3 className="text-sm font-medium text-gray-400 mb-3">Confidence Score</h3>
                    <div className={`text-3xl font-bold ${getConfidenceColor(currentAnalysis.confidence)}`}>
                      {currentAnalysis.confidence}%
                    </div>
                    {currentAnalysis.trend && (
                      <div className="mt-2 flex items-center gap-2">
                        {getTrendIcon(currentAnalysis.trend)}
                        <span className="text-sm text-gray-400">
                          {currentAnalysis.trend.charAt(0).toUpperCase() + currentAnalysis.trend.slice(1)}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* Key Metrics */}
                  {currentAnalysis.key_metrics && Object.keys(currentAnalysis.key_metrics).length > 0 && (
                    <div className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl p-6">
                      <h3 className="text-sm font-medium text-gray-400 mb-3">Measurements</h3>
                      <div className="space-y-2">
                        {Object.entries(currentAnalysis.key_metrics).map(([key, value]) => (
                          <div key={key} className="flex justify-between">
                            <span className="text-gray-400 capitalize">
                              {key.replace(/_/g, ' ')}
                            </span>
                            <span className="text-white font-medium">
                              {value}
                              {key.includes('size') ? 'mm' : ''}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Red Flags Alert */}
                  {currentAnalysis.has_red_flags && (
                    <div className="backdrop-blur-[20px] bg-red-500/10 border border-red-500/20 rounded-xl p-6">
                      <div className="flex items-center gap-2 text-red-400">
                        <AlertCircle className="w-5 h-5" />
                        <h3 className="font-medium">Red Flags Detected</h3>
                      </div>
                      <p className="text-sm text-gray-400 mt-2">
                        This analysis identified concerning signs that may require medical attention.
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
            
            {viewMode === 'compare' && currentAnalysis && (
              <motion.div
                key="compare"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="text-center text-gray-400 mb-4">
                  {compareAnalysis 
                    ? `Comparing Analysis #${currentAnalysisIndex + 1} with Analysis #${compareIndex + 1}`
                    : 'Click on a timeline point to select a comparison photo'
                  }
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Current Photo */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-400 mb-3">
                      Current - {new Date(currentAnalysis.date).toLocaleDateString()}
                    </h3>
                    <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-900">
                      {currentAnalysis.photo_url ? (
                        <img
                          src={currentAnalysis.photo_url}
                          alt="Current photo"
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <Camera className="w-16 h-16 text-gray-700" />
                        </div>
                      )}
                    </div>
                    <div className="mt-3 p-4 bg-white/[0.03] rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Confidence</span>
                        <span className={`font-medium ${getConfidenceColor(currentAnalysis.confidence)}`}>
                          {currentAnalysis.confidence}%
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Comparison Photo */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-400 mb-3">
                      {compareAnalysis 
                        ? `Previous - ${new Date(compareAnalysis.date).toLocaleDateString()}`
                        : 'Select a photo to compare'
                      }
                    </h3>
                    <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-900">
                      {compareAnalysis?.photo_url ? (
                        <img
                          src={compareAnalysis.photo_url}
                          alt="Comparison photo"
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <Camera className="w-16 h-16 text-gray-700" />
                        </div>
                      )}
                    </div>
                    {compareAnalysis && (
                      <div className="mt-3 p-4 bg-white/[0.03] rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Confidence</span>
                          <span className={`font-medium ${getConfidenceColor(compareAnalysis.confidence)}`}>
                            {compareAnalysis.confidence}%
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Comparison Insights */}
                {compareAnalysis && (
                  <div className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl p-6">
                    <h3 className="text-lg font-medium text-white mb-4">Comparison Insights</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-400 mb-1">Time Between</p>
                        <p className="text-white font-medium">
                          {Math.abs(
                            Math.floor(
                              (new Date(currentAnalysis.date).getTime() - new Date(compareAnalysis.date).getTime()) 
                              / (1000 * 60 * 60 * 24)
                            )
                          )} days
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400 mb-1">Confidence Change</p>
                        <p className={`font-medium ${
                          currentAnalysis.confidence > compareAnalysis.confidence
                            ? 'text-green-400'
                            : currentAnalysis.confidence < compareAnalysis.confidence
                            ? 'text-red-400'
                            : 'text-gray-400'
                        }`}>
                          {currentAnalysis.confidence > compareAnalysis.confidence ? '+' : ''}
                          {currentAnalysis.confidence - compareAnalysis.confidence}%
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
            
            {viewMode === 'timeline' && timelineData && (
              <motion.div
                key="timeline"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <div className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl p-8">
                  <h3 className="text-xl font-semibold text-white mb-6">Progression Over Time</h3>
                  
                  {/* Chart would go here - using placeholder for now */}
                  <div className="h-64 bg-gray-900/50 rounded-lg flex items-center justify-center mb-6">
                    <LineChart className="w-16 h-16 text-gray-700" />
                    <p className="ml-4 text-gray-500">Progression chart visualization</p>
                  </div>
                  
                  {/* Summary Stats */}
                  {timelineData.summary && (
                    <div className="grid grid-cols-3 gap-6">
                      <div>
                        <p className="text-sm text-gray-400 mb-1">Overall Trend</p>
                        <div className="flex items-center gap-2">
                          {getTrendIcon(timelineData.summary.overall_trend)}
                          <p className="text-lg font-medium text-white capitalize">
                            {timelineData.summary.overall_trend}
                          </p>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400 mb-1">Monitoring Duration</p>
                        <p className="text-lg font-medium text-white">
                          {timelineData.summary.total_days} days
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400 mb-1">Improvement</p>
                        <p className={`text-lg font-medium ${
                          timelineData.summary.improvement_percentage > 0 
                            ? 'text-green-400' 
                            : 'text-red-400'
                        }`}>
                          {timelineData.summary.improvement_percentage > 0 ? '+' : ''}
                          {timelineData.summary.improvement_percentage}%
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* Zoom Modal */}
        {showZoom && currentAnalysis?.photo_url && (
          <div 
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-8 cursor-zoom-out"
            onClick={() => setShowZoom(false)}
          >
            <img
              src={currentAnalysis.photo_url}
              alt="Zoomed photo"
              className="max-w-full max-h-full object-contain"
            />
          </div>
        )}
      </div>
    </UnifiedAuthGuard>
  );
}
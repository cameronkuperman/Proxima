'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, TrendingUp, TrendingDown, Minus, Download, Share2, Calendar, ChevronRight, Shield, Clock, ChartLine, Image, Eye } from 'lucide-react';
import { AnalysisResult, FollowUpUploadResponse, AnalysisHistoryResponse } from '@/types/photo-analysis';
import EnhancedComparisonView from './EnhancedComparisonView';
import PhotoDisplay from './PhotoDisplay';
import PhotoComparison from './PhotoComparison';
import AnalysisTimeline from './AnalysisTimeline';
import { usePhotoAnalysis } from '@/hooks/usePhotoAnalysis';

interface PhotoAnalysisResultsProps {
  analysis: AnalysisResult;
  onNewAnalysis: () => void;
  onExport: () => void;
  onEnableReminders?: () => void;
  sessionId?: string;
  followUpData?: FollowUpUploadResponse | null;
  onViewProgression?: () => void;
}

export default function PhotoAnalysisResults({
  analysis,
  onNewAnalysis,
  onExport,
  onEnableReminders,
  sessionId,
  followUpData,
  onViewProgression
}: PhotoAnalysisResultsProps) {
  const { getAnalysisHistory } = usePhotoAnalysis();
  const [showPhotos, setShowPhotos] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [analysisHistory, setAnalysisHistory] = useState<AnalysisHistoryResponse | null>(null);
  const [currentAnalysisIndex, setCurrentAnalysisIndex] = useState(0);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  
  // Load analysis history if we have a session
  useEffect(() => {
    if (sessionId && !analysisHistory) {
      loadAnalysisHistory();
    }
  }, [sessionId]);
  
  const loadAnalysisHistory = async () => {
    if (!sessionId) return;
    
    try {
      setIsLoadingHistory(true);
      const history = await getAnalysisHistory(sessionId, analysis.analysis_id);
      setAnalysisHistory(history);
      setCurrentAnalysisIndex(history.current_index);
    } catch (error) {
      console.error('Failed to load analysis history:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };
  
  const handleSelectAnalysis = async (index: number) => {
    if (!analysisHistory || index === currentAnalysisIndex) return;
    
    const selectedAnalysis = analysisHistory.analyses[index];
    if (selectedAnalysis.analysis_data) {
      // We have the full analysis data, update the view
      // This would require parent component to handle analysis change
      console.log('Navigate to analysis:', selectedAnalysis);
      // TODO: Implement navigation to different analysis
    }
  };
  
  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!analysisHistory || analysisHistory.analyses.length <= 1) return;
      
      if (e.key === 'ArrowLeft' && currentAnalysisIndex > 0) {
        handleSelectAnalysis(currentAnalysisIndex - 1);
      } else if (e.key === 'ArrowRight' && currentAnalysisIndex < analysisHistory.analyses.length - 1) {
        handleSelectAnalysis(currentAnalysisIndex + 1);
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [analysisHistory, currentAnalysisIndex]);
  const getSeverityColor = (confidence: number) => {
    if (confidence >= 80) return 'from-green-500 to-emerald-500';
    if (confidence >= 60) return 'from-yellow-500 to-orange-500';
    return 'from-red-500 to-pink-500';
  };

  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingDown className="w-5 h-5 text-green-400" />;
      case 'worsening':
        return <TrendingUp className="w-5 h-5 text-red-400" />;
      default:
        return <Minus className="w-5 h-5 text-gray-400" />;
    }
  };

  const isTemporary = !!analysis.expires_at;
  const expiresIn = isTemporary ? new Date(analysis.expires_at!).getTime() - Date.now() : 0;
  const hoursRemaining = Math.floor(expiresIn / (1000 * 60 * 60));

  // Get current photo URL if available
  const currentPhotoUrl = followUpData?.uploaded_photos?.[0]?.preview_url || 
                         analysisHistory?.analyses?.[currentAnalysisIndex]?.photo_url;
  
  // Get previous photo for comparison (if available)
  const previousPhotoUrl = currentAnalysisIndex > 0 && analysisHistory
    ? analysisHistory.analyses[currentAnalysisIndex - 1].photo_url
    : null;

  return (
    <div className="space-y-6">
      {/* Analysis Timeline Navigation - Show only if we have multiple analyses */}
      {analysisHistory && analysisHistory.analyses.length > 1 && (
        <AnalysisTimeline
          analyses={analysisHistory.analyses.map(a => ({
            id: a.id,
            date: a.date,
            photo_url: a.photo_url,
            thumbnail_url: a.thumbnail_url,
            primary_assessment: a.primary_assessment,
            confidence: a.confidence,
            key_metrics: a.key_metrics,
            has_red_flags: a.has_red_flags,
            trend: a.trend
          }))}
          currentIndex={currentAnalysisIndex}
          onSelectAnalysis={handleSelectAnalysis}
        />
      )}
      
      {/* Photo Display Section - Only show if toggled and photos exist */}
      {showPhotos && currentPhotoUrl && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Photo Comparison Toggle */}
          {previousPhotoUrl && (
            <div className="flex justify-end">
              <button
                onClick={() => setShowComparison(!showComparison)}
                className="text-sm text-orange-400 hover:text-orange-300 transition-colors"
              >
                {showComparison ? 'Hide comparison' : 'Compare with previous'}
              </button>
            </div>
          )}
          
          {/* Photo Comparison or Single Photo */}
          {showComparison && previousPhotoUrl ? (
            <PhotoComparison
              beforePhoto={{
                url: previousPhotoUrl,
                date: analysisHistory!.analyses[currentAnalysisIndex - 1].date,
                label: 'Previous'
              }}
              afterPhoto={{
                url: currentPhotoUrl,
                date: analysisHistory!.analyses[currentAnalysisIndex].date || new Date().toISOString(),
                label: 'Current'
              }}
            />
          ) : (
            <PhotoDisplay
              photoUrl={currentPhotoUrl}
              alt="Analysis photo"
              date={analysisHistory?.analyses[currentAnalysisIndex].date || new Date().toISOString()}
              className="max-w-2xl mx-auto"
            />
          )}
        </motion.div>
      )}
      
      {/* Temporary Analysis Warning */}
      {isTemporary && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="backdrop-blur-[20px] bg-amber-500/10 border border-amber-500/30 rounded-lg p-4"
        >
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-amber-400 mt-0.5" />
            <div>
              <h5 className="text-sm font-medium text-amber-400 mb-1">Temporary Analysis</h5>
              <p className="text-xs text-gray-400">
                This analysis will expire in {hoursRemaining} hours. Photos are not stored.
                Download or copy the results to keep them.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Main Analysis Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 p-6 border-b border-white/[0.05]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-white">Medical Analysis</h2>
            <div className="flex items-center gap-2">
              {/* Photo View Toggle - Only show if we have photo URLs */}
              {(followUpData?.uploaded_photos?.[0]?.preview_url || analysisHistory?.analyses?.[currentAnalysisIndex]?.photo_url) && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowPhotos(!showPhotos)}
                  className="p-2 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] transition-colors"
                  title="Toggle photo view"
                >
                  <Eye className="w-5 h-5 text-white" />
                </motion.button>
              )}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onExport}
                className="p-2 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] transition-colors"
              >
                <Download className="w-5 h-5 text-white" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] transition-colors"
              >
                <Share2 className="w-5 h-5 text-white" />
              </motion.button>
            </div>
          </div>
          
          {/* Primary Assessment */}
          <div>
            <h3 className="text-3xl font-bold text-white mb-2">
              {analysis.analysis.primary_assessment}
            </h3>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">Confidence:</span>
                <span className="text-2xl font-bold text-white">{analysis.analysis.confidence}%</span>
              </div>
              <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${analysis.analysis.confidence}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className={`h-full bg-gradient-to-r ${getSeverityColor(analysis.analysis.confidence)}`}
                />
              </div>
            </div>
          </div>
          
          {/* Photo Available Indicator - Show when photos exist but aren't displayed */}
          {!showPhotos && currentPhotoUrl && (
            <div className="flex items-center gap-2 text-sm text-gray-400 mt-4">
              <Image className="w-4 h-4" />
              <span>Photo available</span>
              <button
                onClick={() => setShowPhotos(true)}
                className="text-orange-400 hover:text-orange-300 transition-colors"
              >
                View
              </button>
            </div>
          )}
        </div>

        {/* Visual Observations */}
        <div className="p-6 border-b border-white/[0.05]">
          <h4 className="text-sm font-medium text-gray-400 mb-3 uppercase">Visual Observations</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {analysis.analysis.visual_observations.map((observation, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-2"
              >
                <div className="w-2 h-2 rounded-full bg-orange-400" />
                <span className="text-gray-300">{observation}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Comparison Results - Use Enhanced View for Follow-ups */}
        {followUpData?.comparison_results?.visual_comparison ? (
          <>
            <EnhancedComparisonView
              comparison={followUpData.comparison_results.visual_comparison}
              measurements={followUpData.comparison_results.key_measurements}
              daysSinceLast={followUpData.comparison_results.days_since_last}
            />
            {/* Add photo comparison option for enhanced view */}
            {showPhotos && currentPhotoUrl && previousPhotoUrl && (
              <PhotoComparison
                beforePhoto={{
                  url: previousPhotoUrl,
                  date: followUpData.comparison_results.compared_with[0] || 'Previous',
                  label: 'Previous'
                }}
                afterPhoto={{
                  url: currentPhotoUrl,
                  date: new Date().toISOString(),
                  label: 'Current'
                }}
                className="mt-4"
              />
            )}
          </>
        ) : analysis.comparison ? (
          <div className="p-6 border-b border-white/[0.05] bg-gradient-to-r from-blue-500/5 to-purple-500/5">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-medium text-gray-400 uppercase">Progress Comparison</h4>
              <span className="text-xs text-gray-500">{analysis.comparison.days_between} days apart</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {analysis.comparison.changes.size && (
                <div className="bg-white/[0.03] rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-400">Size Change</span>
                    {getTrendIcon(analysis.comparison.changes.size.change > 0 ? 'worsening' : 'improving')}
                  </div>
                  <p className="text-lg font-semibold text-white">
                    {analysis.comparison.changes.size.from} → {analysis.comparison.changes.size.to} {analysis.comparison.changes.size.unit}
                  </p>
                  <p className="text-sm text-gray-400">
                    {analysis.comparison.changes.size.change > 0 ? '+' : ''}{analysis.comparison.changes.size.change}%
                  </p>
                </div>
              )}
              
              {analysis.comparison.changes.color && (
                <div className="bg-white/[0.03] rounded-lg p-4">
                  <span className="text-sm text-gray-400 block mb-2">Color Change</span>
                  <p className="text-white">{analysis.comparison.changes.color.description}</p>
                </div>
              )}
              
              {analysis.comparison.changes.texture && (
                <div className="bg-white/[0.03] rounded-lg p-4">
                  <span className="text-sm text-gray-400 block mb-2">Texture Change</span>
                  <p className="text-white">{analysis.comparison.changes.texture.description}</p>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-white/[0.03] rounded-lg">
              {getTrendIcon(analysis.comparison.trend)}
              <p className="text-white font-medium">{analysis.comparison.ai_summary}</p>
            </div>
          </div>
        ) : null}

        {/* Differential Diagnosis */}
        <div className="p-6 border-b border-white/[0.05]">
          <h4 className="text-sm font-medium text-gray-400 mb-3 uppercase">Other Possibilities</h4>
          <div className="space-y-2">
            {analysis.analysis.differential_diagnosis.map((diagnosis, index) => (
              <div key={index} className="flex items-center gap-2 text-gray-300">
                <span className="text-gray-500">{index + 1}.</span>
                {diagnosis}
              </div>
            ))}
          </div>
        </div>

        {/* Red Flags */}
        {analysis.analysis.red_flags.length > 0 && (
          <div className="p-6 border-b border-white/[0.05] bg-gradient-to-r from-red-500/10 to-pink-500/10">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-red-400 mb-2 uppercase">Urgent Concerns</h4>
                <ul className="space-y-1">
                  {analysis.analysis.red_flags.map((flag, index) => (
                    <li key={index} className="text-gray-300 text-sm">• {flag}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Recommendations */}
        <div className="p-6 border-b border-white/[0.05]">
          <h4 className="text-sm font-medium text-gray-400 mb-3 uppercase">Recommendations</h4>
          <div className="space-y-3">
            {analysis.analysis.recommendations.map((rec, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start gap-3"
              >
                <ChevronRight className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
                <span className="text-gray-300">{rec}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Trackable Metrics */}
        {analysis.analysis.trackable_metrics && analysis.analysis.trackable_metrics.length > 0 && (
          <div className="p-6 bg-gradient-to-r from-purple-500/10 to-pink-500/10">
            <h4 className="text-sm font-medium text-purple-400 mb-3 uppercase">Suggested Tracking</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {analysis.analysis.trackable_metrics.map((metric, index) => (
                <div key={index} className="bg-white/[0.03] rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-white">{metric.metric_name}</span>
                    <span className="text-xs text-gray-400">{metric.suggested_tracking}</span>
                  </div>
                  <p className="text-2xl font-bold text-white">
                    {metric.current_value} <span className="text-sm text-gray-400">{metric.unit}</span>
                  </p>
                </div>
              ))}
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onEnableReminders}
              className="mt-4 px-4 py-2 rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-colors text-sm font-medium flex items-center gap-2 mx-auto"
            >
              <Calendar className="w-4 h-4" />
              Enable Follow-up Reminders
            </motion.button>
          </div>
        )}
      </motion.div>

      {/* Actions */}
      <div className="flex gap-4">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onNewAnalysis}
          className="flex-1 py-3 rounded-lg bg-gray-900/50 text-gray-300 hover:bg-gray-900/70 transition-colors font-medium"
        >
          New Analysis
        </motion.button>
        {sessionId && onViewProgression && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onViewProgression}
            className="flex-1 py-3 rounded-lg bg-gradient-to-r from-orange-500 to-red-500 text-white font-medium flex items-center justify-center gap-2"
          >
            <ChartLine className="w-4 h-4" />
            View Progression
          </motion.button>
        )}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex-1 py-3 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium"
        >
          Schedule Doctor Visit
        </motion.button>
      </div>

      {/* Disclaimer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-xs text-gray-500 text-center"
      >
        <Shield className="w-4 h-4 inline mr-1" />
        This AI analysis is for informational purposes only and does not replace professional medical advice.
      </motion.div>
    </div>
  );
}
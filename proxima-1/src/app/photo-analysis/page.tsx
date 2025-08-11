'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Camera, Clock, TrendingUp, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import UnifiedAuthGuard from '@/components/UnifiedAuthGuard';
import PhotoUploadZone from '@/components/photo-analysis/PhotoUploadZone';
import PhotoAnalysisResults from '@/components/photo-analysis/PhotoAnalysisResults';
import PhotoSessionHistoryUltraFast from '@/components/photo-analysis/PhotoSessionHistoryUltraFast';
import SensitiveContentModal from '@/components/photo-analysis/SensitiveContentModal';
import PhotoQualityModal from '@/components/photo-analysis/PhotoQualityModal';
import ReminderOptIn from '@/components/photo-analysis/ReminderOptIn';
import PrivacyInfoModal from '@/components/photo-analysis/PrivacyInfoModal';
import ErrorModal from '@/components/photo-analysis/ErrorModal';
import SmartBatchingNotification from '@/components/photo-analysis/SmartBatchingNotification';
import AdaptiveSchedulingCard from '@/components/photo-analysis/AdaptiveSchedulingCard';
import ProgressionAnalysisView from '@/components/photo-analysis/ProgressionAnalysisView';
import { usePhotoAnalysis } from '@/hooks/usePhotoAnalysis';
import { PhotoSession, PhotoCategory, AnalysisResult, FollowUpUploadResponse } from '@/types/photo-analysis';

export const dynamic = 'force-dynamic';

export default function PhotoAnalysisPage() {
  const router = useRouter();
  const { } = useAuth();
  const { 
    sessions, 
    activeSession,
    setActiveSession,
    uploadPhotos,
    analyzePhotos,
    createSession,
    continueSession,
    exportSession,
    addFollowUpPhotos,
    configureReminder,
    getMonitoringSuggestions,
    getProgressionAnalysis,
    refetchSessions
  } = usePhotoAnalysis();
  
  // Sessions are loaded by the child components when needed

  // Listen for privacy info event
  React.useEffect(() => {
    const handleShowPrivacyInfo = () => setShowPrivacyInfo(true);
    window.addEventListener('showPrivacyInfo', handleShowPrivacyInfo);
    return () => window.removeEventListener('showPrivacyInfo', handleShowPrivacyInfo);
  }, []);

  const [mode, setMode] = useState<'new' | 'continue' | 'history'>('new');
  const [uploadedPhotos, setUploadedPhotos] = useState<File[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [showSensitiveModal, setShowSensitiveModal] = useState(false);
  const [showQualityModal, setShowQualityModal] = useState(false);
  const [sensitivePhotos, setSensitivePhotos] = useState<string[]>([]);
  const [unclearPhotos, setUnclearPhotos] = useState<string[]>([]);
  const [showReminderOptIn, setShowReminderOptIn] = useState(false);
  const [currentAnalysisId, setCurrentAnalysisId] = useState<string | null>(null);
  const [showPrivacyInfo, setShowPrivacyInfo] = useState(false);
  const [followUpData, setFollowUpData] = useState<FollowUpUploadResponse | null>(null);
  const [showProgressionAnalysis, setShowProgressionAnalysis] = useState(false);

  // Tab navigation
  const tabs = [
    { id: 'new', label: 'New Analysis', icon: Camera },
    { id: 'continue', label: 'Continue Tracking', icon: TrendingUp },
    { id: 'history', label: 'History', icon: Clock }
  ];

  // Handle file upload
  const handleFileUpload = async (files: File[]) => {
    if (files.length === 0) return;
    
    // Frontend validation
    const validFiles = files.filter(file => {
      if (file.size > 10 * 1024 * 1024) {
        alert(`${file.name} is too large (max 10MB)`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;
    
    setUploadedPhotos(prev => [...prev, ...validFiles]);
  };

  // Handle photo removal
  const removePhoto = (index: number) => {
    setUploadedPhotos(prev => prev.filter((_, i) => i !== index));
  };

  // Start analysis
  const startAnalysis = async (context: string) => {
    if (uploadedPhotos.length === 0) return;
    
    setIsAnalyzing(true);
    
    try {
      // Create or get session
      let sessionId = activeSession?.id;
      if (!sessionId && mode === 'new') {
        // Extract a better condition name from context
        let conditionName = 'New Condition';
        const contextLower = context.toLowerCase();
        
        // Try to extract condition from common patterns
        if (contextLower.includes('rash')) conditionName = 'Rash';
        else if (contextLower.includes('mole')) conditionName = 'Mole';
        else if (contextLower.includes('wound')) conditionName = 'Wound';
        else if (contextLower.includes('burn')) conditionName = 'Burn';
        else if (contextLower.includes('cut')) conditionName = 'Cut';
        else if (contextLower.includes('bruise')) conditionName = 'Bruise';
        else if (contextLower.includes('skin')) conditionName = 'Skin Condition';
        else if (contextLower.includes('infection')) conditionName = 'Infection';
        else if (contextLower.includes('bite')) conditionName = 'Bite';
        else if (contextLower.includes('acne')) conditionName = 'Acne';
        else if (contextLower.includes('eczema')) conditionName = 'Eczema';
        else if (contextLower.includes('psoriasis')) conditionName = 'Psoriasis';
        
        const session = await createSession({
          condition_name: conditionName,
          description: context
        });
        
        console.log('Created session:', session);
        
        if (!session || !session.id) {
          throw new Error('Session creation failed - no session ID returned');
        }
        
        sessionId = session.id;  // session.id is already normalized in usePhotoAnalysis hook
        console.log('Using session ID:', sessionId);
      }
      
      // Upload and categorize photos
      const uploadResult = await uploadPhotos(sessionId!, uploadedPhotos);
      
      // Handle categorization results
      const sensitiveFound = uploadResult.uploaded_photos.filter(p => p.category === 'medical_sensitive');
      const unclearFound = uploadResult.uploaded_photos.filter(p => p.category === 'unclear');
      
      if (sensitiveFound.length > 0) {
        setSensitivePhotos(sensitiveFound.map(p => p.id));
        setShowSensitiveModal(true);
        setIsAnalyzing(false);
        return;
      }
      
      if (unclearFound.length > 0) {
        setUnclearPhotos(unclearFound.map(p => p.id));
        setShowQualityModal(true);
        setIsAnalyzing(false);
        return;
      }
      
      // Proceed with analysis
      const validPhotos = uploadResult.uploaded_photos.filter(p => 
        ['medical_normal', 'medical_gore'].includes(p.category)
      );
      
      if (validPhotos.length > 0) {
        const analysis = await analyzePhotos({
          session_id: sessionId!,
          photo_ids: validPhotos.map(p => p.id),
          context
        });
        
        setAnalysisResult(analysis);
      }
    } catch (error) {
      console.error('Analysis error:', error);
      alert(error instanceof Error ? error.message : 'An error occurred during analysis. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Handle sensitive content decision
  const handleSensitiveDecision = async (decision: 'analyze_once' | 'analyze_24h' | 'store_normal' | 'cancel') => {
    setShowSensitiveModal(false);
    
    if (decision === 'cancel') {
      // Remove sensitive photos
      setSensitivePhotos([]);
      setUploadedPhotos([]);
      return;
    }
    
    if (decision === 'store_normal') {
      // User wants to store normally - proceed with regular analysis
      const context = (document.getElementById('analysis-context') as HTMLTextAreaElement)?.value || 'Please analyze this medical condition';
      const analysis = await analyzePhotos({
        session_id: activeSession?.id || '',
        photo_ids: sensitivePhotos,
        context,
        temporary_analysis: false
      });
      
      setAnalysisResult(analysis);
      return;
    }
    
    // For analyze_once or analyze_24h, use temporary analysis
    const context = (document.getElementById('analysis-context') as HTMLTextAreaElement)?.value || 'Please analyze this medical condition';
    const analysis = await analyzePhotos({
      session_id: activeSession?.id || '',
      photo_ids: sensitivePhotos,
      context,
      temporary_analysis: true
    });
    
    setAnalysisResult(analysis);
  };

  return (
    <UnifiedAuthGuard requireAuth={true}>
      <div className="min-h-screen bg-[#0a0a0a] relative">
        {/* Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 -left-48 w-96 h-96 bg-gradient-to-r from-orange-600/10 to-red-600/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 -right-48 w-96 h-96 bg-gradient-to-r from-purple-600/10 to-pink-600/10 rounded-full blur-3xl" />
        </div>

        {/* Content */}
        <div className="relative z-10 px-6 py-6">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <button
                onClick={() => router.push('/dashboard')}
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </button>
              
              <h1 className="text-4xl font-bold text-white mb-2">Photo Analysis</h1>
              <p className="text-gray-400">Upload photos for AI-powered medical analysis</p>
            </motion.div>

            {/* Tabs */}
            <div className="flex gap-2 mb-8">
              {tabs.map((tab) => (
                <motion.button
                  key={tab.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setMode(tab.id as 'new' | 'continue' | 'history');
                    // Reset active session when switching away from continue mode
                    if (tab.id !== 'continue') {
                      setActiveSession(null);
                    }
                  }}
                  className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                    mode === tab.id
                      ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white'
                      : 'bg-white/[0.03] text-gray-400 hover:text-white hover:bg-white/[0.05]'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </motion.button>
              ))}
            </div>

            {/* Main Content */}
            <AnimatePresence mode="wait">
              {mode === 'new' && !analysisResult && (
                <motion.div
                  key="new"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="grid grid-cols-1 lg:grid-cols-2 gap-8"
                >
                  {/* Upload Section */}
                  <div>
                    <h2 className="text-2xl font-semibold text-white mb-4">Upload Photos</h2>
                    <PhotoUploadZone
                      onUpload={handleFileUpload}
                      uploadedPhotos={uploadedPhotos}
                      onRemovePhoto={removePhoto}
                      maxPhotos={5}
                      isAnalyzing={isAnalyzing}
                    />
                  </div>

                  {/* Context Section */}
                  <div>
                    <h2 className="text-2xl font-semibold text-white mb-4">Describe Your Concern</h2>
                    <div className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl p-6">
                      <textarea
                        id="analysis-context"
                        placeholder="What would you like me to analyze? Describe your symptoms, how long you've had them, and any specific concerns..."
                        rows={6}
                        className="w-full px-4 py-3 rounded-lg bg-white/[0.03] text-white border border-white/[0.05] focus:border-orange-500 focus:outline-none resize-none"
                      />
                      
                      <div className="mt-4 space-y-2">
                        <p className="text-sm text-gray-400">Example questions:</p>
                        <div className="space-y-1">
                          {[
                            "Is this rash getting worse?",
                            "What type of skin condition is this?",
                            "Should I see a doctor for this?"
                          ].map((example, i) => (
                            <button
                              key={i}
                              onClick={() => {
                                const textarea = document.getElementById('analysis-context') as HTMLTextAreaElement;
                                textarea.value = example;
                              }}
                              className="block text-left text-sm text-orange-400 hover:text-orange-300 transition-colors"
                            >
                              • {example}
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          const textarea = document.getElementById('analysis-context') as HTMLTextAreaElement;
                          const context = textarea.value.trim() || 'Please analyze this medical condition';
                          startAnalysis(context);
                        }}
                        disabled={uploadedPhotos.length === 0 || isAnalyzing}
                        className="w-full mt-6 py-3 rounded-lg bg-gradient-to-r from-orange-500 to-red-500 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        {isAnalyzing ? (
                          <span className="flex items-center justify-center gap-2">
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                              className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                            />
                            Analyzing...
                          </span>
                        ) : (
                          'Analyze Photos'
                        )}
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              )}

              {mode === 'continue' && (
                <motion.div
                  key="continue"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  {activeSession ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Follow-up Upload Section */}
                      <div>
                        <h2 className="text-2xl font-semibold text-white mb-4">
                          Add Follow-up Photos
                        </h2>
                        <div className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl p-6 mb-4">
                          <h3 className="text-lg font-medium text-white mb-2">
                            {activeSession.condition_name}
                          </h3>
                          <p className="text-sm text-gray-400 mb-4">
                            Last photo: {activeSession.last_photo_at ? new Date(activeSession.last_photo_at).toLocaleDateString() : 'N/A'}
                          </p>
                          <p className="text-sm text-gray-300 mb-4">
                            {activeSession.description}
                          </p>
                        </div>
                        <PhotoUploadZone
                          onUpload={handleFileUpload}
                          uploadedPhotos={uploadedPhotos}
                          onRemovePhoto={removePhoto}
                          maxPhotos={5}
                          isAnalyzing={isAnalyzing}
                        />
                      </div>

                      {/* Follow-up Context */}
                      <div>
                        <h2 className="text-2xl font-semibold text-white mb-4">Update on Condition</h2>
                        <div className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl p-6">
                          <textarea
                            id="follow-up-notes"
                            placeholder="Any changes since last time? How are you feeling? Any new symptoms?"
                            rows={4}
                            className="w-full px-4 py-3 rounded-lg bg-white/[0.03] text-white border border-white/[0.05] focus:border-orange-500 focus:outline-none resize-none mb-4"
                          />
                          
                          <div className="flex items-center gap-3 mb-6">
                            <input
                              type="checkbox"
                              id="auto-compare"
                              defaultChecked
                              className="w-4 h-4 rounded border-gray-600 bg-white/[0.03] text-orange-500 focus:ring-orange-500"
                            />
                            <label htmlFor="auto-compare" className="text-sm text-gray-300">
                              Automatically compare with previous photos
                            </label>
                          </div>
                          
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={async () => {
                              if (uploadedPhotos.length === 0) return;
                              
                              setIsAnalyzing(true);
                              try {
                                const notes = (document.getElementById('follow-up-notes') as HTMLTextAreaElement).value;
                                const autoCompare = (document.getElementById('auto-compare') as HTMLInputElement).checked;
                                
                                const followUpResult = await addFollowUpPhotos(
                                  activeSession.id || activeSession.session_id || '',
                                  uploadedPhotos,
                                  {
                                    auto_compare: autoCompare,
                                    notes: notes || undefined
                                  }
                                );
                                
                                // Handle smart batching info if present
                                if (followUpResult.smart_batching_info) {
                                  console.log('Smart batching active:', followUpResult.smart_batching_info);
                                }
                                
                                // Analyze the new photos
                                const analysis = await analyzePhotos({
                                  session_id: activeSession.id || activeSession.session_id || '',
                                  photo_ids: followUpResult.uploaded_photos.map(p => p.id),
                                  context: notes || 'Follow-up photos for tracking progress'
                                });
                                
                                // Store follow-up data for display
                                setFollowUpData(followUpResult);
                                
                                setAnalysisResult(analysis);
                                setMode('new');
                              } catch (error) {
                                console.error('Follow-up error:', error);
                                alert('Failed to upload follow-up photos');
                              } finally {
                                setIsAnalyzing(false);
                              }
                            }}
                            disabled={uploadedPhotos.length === 0 || isAnalyzing}
                            className="w-full py-3 rounded-lg bg-gradient-to-r from-orange-500 to-red-500 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                          >
                            {isAnalyzing ? 'Analyzing...' : 'Analyze Follow-up Photos'}
                          </motion.button>
                        </div>
                        
                        <button
                          onClick={() => {
                            setMode('history');
                            setUploadedPhotos([]);
                          }}
                          className="w-full mt-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                        >
                          Choose Different Session
                        </button>
                      </div>
                    </div>
                  ) : (
                    <PhotoSessionHistoryUltraFast
                      onSelectSession={(session) => {
                        // Set active session directly when selected
                        setActiveSession(session);
                        setUploadedPhotos([]);
                        console.log('Selected session for continue tracking:', session);
                      }}
                      showContinueButton={true}
                    />
                  )}
                </motion.div>
              )}

              {mode === 'history' && (
                <motion.div
                  key="history"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <PhotoSessionHistoryUltraFast
                    onSelectSession={(session) => router.push(`/photo-analysis/session/${session.id}`)}
                    showContinueButton={false}
                  />
                </motion.div>
              )}

              {analysisResult && (
                <motion.div
                  key="results"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  {/* Smart Batching Notification */}
                  {followUpData?.smart_batching_info && (
                    <SmartBatchingNotification
                      batchingInfo={followUpData.smart_batching_info}
                      onViewAllPhotos={() => {
                        // TODO: Implement view all photos modal
                        console.log('View all photos clicked');
                      }}
                    />
                  )}
                  
                  <PhotoAnalysisResults
                    analysis={analysisResult}
                    sessionId={activeSession?.id || activeSession?.session_id}
                    onNewAnalysis={() => {
                      setAnalysisResult(null);
                      setUploadedPhotos([]);
                      setFollowUpData(null);
                      setMode('new');
                    }}
                    onExport={() => exportSession(analysisResult.analysis_id)}
                    onEnableReminders={() => {
                      if (analysisResult.analysis.trackable_metrics && analysisResult.analysis.trackable_metrics.length > 0) {
                        setCurrentAnalysisId(analysisResult.analysis_id);
                        setShowReminderOptIn(true);
                      }
                    }}
                    followUpData={followUpData}
                    onViewProgression={() => {
                      if (activeSession?.id || activeSession?.session_id) {
                        setShowProgressionAnalysis(true);
                      }
                    }}
                  />
                  
                  {/* Adaptive Scheduling Card */}
                  {followUpData?.follow_up_suggestion && (
                    <AdaptiveSchedulingCard
                      suggestion={followUpData.follow_up_suggestion}
                      onSetReminder={() => {
                        setCurrentAnalysisId(analysisResult.analysis_id);
                        setShowReminderOptIn(true);
                      }}
                      onSchedule={() => {
                        // TODO: Implement calendar integration
                        console.log('Schedule clicked');
                      }}
                    />
                  )}
                </motion.div>
              )}
              
              {/* Progression Analysis Modal/View */}
              {showProgressionAnalysis && (activeSession?.id || activeSession?.session_id) && (
                <motion.div
                  key="progression"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <div className="mb-4">
                    <button
                      onClick={() => setShowProgressionAnalysis(false)}
                      className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Back to Results
                    </button>
                  </div>
                  <ProgressionAnalysisView
                    sessionId={activeSession.id || activeSession.session_id || ''}
                    getProgressionAnalysis={getProgressionAnalysis}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Modals */}
        <SensitiveContentModal
          isOpen={showSensitiveModal}
          onClose={() => setShowSensitiveModal(false)}
          onDecision={handleSensitiveDecision}
        />

        <PhotoQualityModal
          isOpen={showQualityModal}
          onClose={() => setShowQualityModal(false)}
          onRetake={() => {
            setShowQualityModal(false);
            setUnclearPhotos([]);
            // Remove unclear photos from uploaded
            setUploadedPhotos(prev => prev.filter((_, i) => !unclearPhotos.includes(String(i))));
          }}
        />

        <ReminderOptIn
          isOpen={showReminderOptIn}
          onClose={() => setShowReminderOptIn(false)}
          analysisId={currentAnalysisId || ''}
          sessionId={activeSession?.id || activeSession?.session_id || ''}
          trackableMetrics={analysisResult?.analysis.trackable_metrics}
          suggestion={analysisResult?.analysis.trackable_metrics && analysisResult.analysis.trackable_metrics.length > 0 ? {
            benefits_from_tracking: true,
            suggested_interval_days: 30,
            reasoning: `Regular monitoring recommended for ${analysisResult.analysis.primary_assessment}`,
            priority: 'routine'
          } : undefined}
          onConfigure={async (config) => {
            try {
              await configureReminder(config);
              setShowReminderOptIn(false);
              // TODO: Show success toast
            } catch (error) {
              console.error('Failed to configure reminder:', error);
              // TODO: Show error toast
            }
          }}
        />

        <PrivacyInfoModal
          isOpen={showPrivacyInfo}
          onClose={() => setShowPrivacyInfo(false)}
        />
      </div>
    </UnifiedAuthGuard>
  );
}
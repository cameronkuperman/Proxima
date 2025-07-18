'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Camera, Upload, Clock, TrendingUp, ArrowLeft, Plus, X, AlertCircle, Check, Download, Share2, ChevronRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import AuthGuard from '@/components/AuthGuard';
import PhotoUploadZone from '@/components/photo-analysis/PhotoUploadZone';
import PhotoAnalysisResults from '@/components/photo-analysis/PhotoAnalysisResults';
import PhotoSessionHistory from '@/components/photo-analysis/PhotoSessionHistory';
import SensitiveContentModal from '@/components/photo-analysis/SensitiveContentModal';
import PhotoQualityModal from '@/components/photo-analysis/PhotoQualityModal';
import { usePhotoAnalysis } from '@/hooks/usePhotoAnalysis';
import { PhotoSession, PhotoCategory, AnalysisResult } from '@/types/photo-analysis';

export default function PhotoAnalysisPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { 
    sessions, 
    activeSession,
    isLoading,
    uploadPhotos,
    analyzePhotos,
    createSession,
    continueSession,
    exportSession
  } = usePhotoAnalysis();

  const [mode, setMode] = useState<'new' | 'continue' | 'history'>('new');
  const [uploadedPhotos, setUploadedPhotos] = useState<File[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [showSensitiveModal, setShowSensitiveModal] = useState(false);
  const [showQualityModal, setShowQualityModal] = useState(false);
  const [sensitivePhotos, setSensitivePhotos] = useState<string[]>([]);
  const [unclearPhotos, setUnclearPhotos] = useState<string[]>([]);

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
        sessionId = session.id;
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
    } catch (error: any) {
      console.error('Analysis error:', error);
      alert(error.message || 'An error occurred during analysis. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Handle sensitive content decision
  const handleSensitiveDecision = async (decision: 'analyze_once' | 'analyze_24h' | 'cancel') => {
    setShowSensitiveModal(false);
    
    if (decision === 'cancel') {
      // Remove sensitive photos
      setSensitivePhotos([]);
      return;
    }
    
    // Proceed with temporary analysis
    const context = "Analyze this medical condition";
    const analysis = await analyzePhotos({
      session_id: activeSession?.id || '',
      photo_ids: sensitivePhotos,
      context,
      temporary_analysis: true
    });
    
    setAnalysisResult(analysis);
  };

  return (
    <AuthGuard requireAuth={true}>
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
                  onClick={() => setMode(tab.id as any)}
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
                  <PhotoSessionHistory
                    sessions={sessions.filter(s => s.photo_count > 0)}
                    onSelectSession={(session) => {
                      continueSession(session.id);
                      setMode('new');
                    }}
                    showContinueButton={true}
                  />
                </motion.div>
              )}

              {mode === 'history' && (
                <motion.div
                  key="history"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <PhotoSessionHistory
                    sessions={sessions}
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
                >
                  <PhotoAnalysisResults
                    analysis={analysisResult}
                    onNewAnalysis={() => {
                      setAnalysisResult(null);
                      setUploadedPhotos([]);
                    }}
                    onExport={() => exportSession(analysisResult.analysis_id)}
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
      </div>
    </AuthGuard>
  );
}
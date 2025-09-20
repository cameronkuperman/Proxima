'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, Brain, FileText, TrendingUp, ChevronDown, ChevronRight, Sparkles, Eye, Download, X, Loader2, MessageSquare, Lightbulb, CheckCircle, Mail, ClipboardList } from 'lucide-react'
import OracleEmbedded from '@/components/OracleEmbedded'
import OracleAIModal from '@/components/OracleAIModal'
import { useRouter } from 'next/navigation'
import { useTrackingStore } from '@/stores/useTrackingStore'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { generateReportPDF } from '@/utils/pdfGenerator'
import { MedicalPdfGenerator, MedicalReportData } from '@/services/medicalPdfService'
import { format } from 'date-fns'

interface QuickScanResultsProps {
  scanData: {
    bodyPart: string
    formData: any
    analysis?: any
    confidence?: number
    scan_id?: string
  }
  onNewScan: () => void
  mode?: 'quick' | 'deep'
}

export default function QuickScanResults({ scanData, onNewScan, mode = 'quick' }: QuickScanResultsProps) {
  console.log('QuickScanResults rendered with:', { scanData, mode })
  const router = useRouter()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState(0)
  const [showWhy, setShowWhy] = useState(false)
  const [showOraclePanel, setShowOraclePanel] = useState(false)
  const [showOracleModal, setShowOracleModal] = useState(false)
  const [showTrackingSuggestion, setShowTrackingSuggestion] = useState(false)
  const [isGeneratingTracking, setIsGeneratingTracking] = useState(false)
  const [isLoadingTrackButton, setIsLoadingTrackButton] = useState(false)
  const [isThinkingHarder, setIsThinkingHarder] = useState(false)
  const [isAskingMore, setIsAskingMore] = useState(false)
  const [isUltraThinking, setIsUltraThinking] = useState(false)
  const [o4MiniAnalysis, setO4MiniAnalysis] = useState<any>(null)
  const [ultraAnalysis, setUltraAnalysis] = useState<any>(null)
  const [currentTier, setCurrentTier] = useState<'basic' | 'enhanced' | 'ultra'>('basic')
  const [showSuccessNotification, setShowSuccessNotification] = useState(false)
  const [showWhatThisMeans, setShowWhatThisMeans] = useState(false)
  
  const { generateSuggestion, currentSuggestion, suggestionId, loading: trackingStoreLoading } = useTrackingStore()

  // Extract analysis data with fallbacks
  const analysis = scanData.analysis || {}
  const confidence = scanData.confidence || 0
  
  // Extract new fields from backend
  const whatThisMeans = (scanData as any).what_this_means
  const immediateActions = (scanData as any).immediate_actions
  
  // Debug logging
  console.log('QuickScanResults - scanData analysis type:', typeof scanData.analysis)
  console.log('QuickScanResults - scanData analysis:', scanData.analysis)
  
  // Ensure all fields have defaults to prevent undefined errors
  const analysisResult = {
    confidence,
    primaryCondition: analysis.primaryCondition || 'Health Analysis',
    likelihood: analysis.likelihood || 'Based on your symptoms, further evaluation may be helpful',
    symptoms: Array.isArray(analysis.symptoms) ? analysis.symptoms : [],
    recommendations: Array.isArray(analysis.recommendations) ? analysis.recommendations.map((rec: any) => 
      typeof rec === 'string' ? rec : (rec.action || rec.text || 'See recommendation')) : 
      ['Consult with a healthcare professional', 'Monitor your symptoms', 'Rest and stay hydrated'],
    urgency: analysis.urgency || 'medium',
    differentials: Array.isArray(analysis.differentials) ? analysis.differentials : [],
    redFlags: Array.isArray(analysis.redFlags) ? analysis.redFlags.map((flag: any) => 
      typeof flag === 'string' ? flag : (flag.condition || flag.symptom || flag.text || 'See warning')) : 
      ['Severe or worsening symptoms', 'Difficulty breathing', 'Chest pain', 'High fever'],
    selfCare: Array.isArray(analysis.selfCare) ? analysis.selfCare.map((care: any) => 
      typeof care === 'string' ? care : (care.action || care.text || 'See care instruction')) : 
      ['Get adequate rest', 'Stay hydrated', 'Monitor symptoms'],
    timeline: analysis.timeline || 'Recovery time varies by condition',
    followUp: analysis.followUp || 'Follow up if symptoms persist or worsen',
    relatedSymptoms: Array.isArray(analysis.relatedSymptoms) ? analysis.relatedSymptoms.map((symptom: any) => 
      typeof symptom === 'string' ? symptom : (symptom.name || symptom.text || 'See symptom')) : []
  }

  // Generate tracking suggestion when scan completes
  useEffect(() => {
    const generateTrackingSuggestion = async () => {
      // Only generate tracking for Quick Scan, not Deep Dive
      if (mode === 'quick' && scanData.scan_id && !isGeneratingTracking) {
        console.log('[QuickScanResults] Generating tracking suggestion for quick scan:', scanData.scan_id)
        setIsGeneratingTracking(true)
        try {
          const { data: { user } } = await supabase.auth.getUser()
          
          if (user) {
            console.log('[QuickScanResults] Calling generateSuggestion for quick_scan')
            await generateSuggestion('quick_scan', scanData.scan_id, user.id)
            // Small delay to ensure the suggestion is loaded
            setTimeout(() => {
              setShowTrackingSuggestion(true)
              setIsGeneratingTracking(false)
            }, 500)
          }
        } catch (error) {
          console.error('Error generating tracking suggestion:', error)
          setIsGeneratingTracking(false)
        }
      } else if (mode === 'deep' && scanData.scan_id && !isGeneratingTracking) {
        // For Deep Dive, try to generate tracking with deep_dive type
        console.log('[QuickScanResults] Generating tracking suggestion for deep dive:', scanData.scan_id)
        setIsGeneratingTracking(true)
        try {
          const { data: { user } } = await supabase.auth.getUser()
          
          if (user) {
            // Use deep_dive type for Deep Dive results
            console.log('[QuickScanResults] Calling generateSuggestion for deep_dive')
            await generateSuggestion('deep_dive', scanData.scan_id, user.id)
            setTimeout(() => {
              setShowTrackingSuggestion(true)
              setIsGeneratingTracking(false)
            }, 500)
          }
        } catch (error) {
          console.error('Error generating Deep Dive tracking suggestion:', error)
          // Don't show error to user for Deep Dive tracking failures
          setIsGeneratingTracking(false)
        }
      } else {
        console.log('[QuickScanResults] Skipping tracking generation:', { mode, scan_id: scanData.scan_id, isGeneratingTracking })
      }
    }
    
    generateTrackingSuggestion()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scanData.scan_id, mode]) // Intentionally omit generateSuggestion to avoid infinite loop

  // PDF Export - Simple Quick Scan format
  const handleExportPDF = async () => {
    try {
      const reportData = {
        report_id: scanData.scan_id || `QS-${Date.now()}`,
        report_type: 'quick_scan',
        generated_at: new Date().toISOString(),
        confidence_score: confidence,
        model_used: 'Seimeo AI',
        report_data: {
          body_part: scanData.bodyPart,
          symptoms: scanData.formData,
          analysis: analysisResult,
          what_this_means: whatThisMeans,
          immediate_actions: immediateActions,
          tracking_data: currentSuggestion ? {
            metric: currentSuggestion.metric_name,
            frequency: currentSuggestion.frequency
          } : null
        }
      };

      await generateReportPDF(reportData, {
        includeMetadata: true,
        includeSummaryOnly: false,
        fileName: `quick-scan-${scanData.bodyPart.toLowerCase()}-${format(new Date(), 'MMM-dd-yyyy').toLowerCase()}.pdf`
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  // Generate Medical Report - Epic MyChart format for doctors
  const handleGenerateMedicalReport = async () => {
    try {
      const pdfGenerator = new MedicalPdfGenerator();
      
      // Prepare medical report data
      const medicalData: MedicalReportData = {
        scan_id: scanData.scan_id,
        user_id: user?.id || 'anonymous',
        assessment_date: new Date(),
        chief_complaint: {
          description: `${scanData.formData.symptoms || 'Symptoms'} in ${scanData.bodyPart}`,
          body_part: scanData.bodyPart,
          duration: scanData.formData.duration || 'Not specified',
          severity: scanData.formData.painLevel || scanData.formData.severity || 5,
          pattern: scanData.formData.pattern || scanData.formData.timing
        },
        urgency_level: analysisResult.urgency as 'critical' | 'high' | 'moderate' | 'low',
        ai_analysis: {
          primary_condition: analysisResult.primaryCondition,
          confidence: confidence,
          differentials: analysisResult.differentials.map((diff: any) => ({
            condition: typeof diff === 'string' ? diff : diff.condition || diff.name,
            probability: typeof diff === 'object' ? diff.probability || diff.likelihood || 50 : 50
          }))
        },
        symptom_timeline: currentSuggestion ? [
          { date: new Date(), severity: scanData.formData.painLevel || 5 }
        ] : undefined,
        red_flags: analysisResult.redFlags.map((flag: string) => ({
          symptom: flag,
          present: false // Would need to check against actual symptoms
        })),
        treatments_tried: scanData.formData.treatmentsTried ? 
          Object.entries(scanData.formData.treatmentsTried).map(([treatment, result]) => ({
            treatment,
            result: result as string
          })) : undefined,
        associated_symptoms: scanData.formData.associatedSymptoms?.map((symptom: any) => ({
          symptom: typeof symptom === 'string' ? symptom : symptom.name,
          onset_date: 'Recent',
          present: true
        })),
        triggers_patterns: {
          time: scanData.formData.timing,
          activity: scanData.formData.triggers,
          position: scanData.formData.position
        },
        medical_history: {
          medications: scanData.formData.currentMedications,
          allergies: scanData.formData.allergies,
          previous: scanData.formData.previousEpisodes
        }
      };

      const blob = await pdfGenerator.generateMedicalReport(medicalData);
      
      // Download the PDF
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `medical-report-${scanData.bodyPart.toLowerCase()}-${format(new Date(), 'MMM-dd-yyyy').toLowerCase()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      // Show success notification
      setShowSuccessNotification(true);
      setTimeout(() => setShowSuccessNotification(false), 3000);
    } catch (error) {
      console.error('Error generating medical report:', error);
      alert('Failed to generate medical report. Please try again.');
    }
  };

  // Email Medical Report
  const handleEmailMedicalReport = async () => {
    const email = prompt('Enter email address to send the medical report:');
    if (!email) return;
    
    try {
      // Generate the medical report first
      const pdfGenerator = new MedicalPdfGenerator();
      // ... (same medical data preparation as above)
      
      // For now, just show a message (backend email service would be implemented)
      alert(`Medical report would be sent to ${email}. (Email service to be implemented)`);
    } catch (error) {
      console.error('Error emailing report:', error);
      alert('Failed to email report. Please try again.');
    }
  };

  const handleTrackProgress = async () => {
    setIsLoadingTrackButton(true)
    
    // If we don't have a suggestion yet, generate one
    if (!currentSuggestion && scanData.scan_id) {
      console.log('[QuickScanResults] Manual track button clicked - checking if suggestion exists')
      try {
        const { data: { user } } = await supabase.auth.getUser()
        
        if (user) {
          console.log('[QuickScanResults] No existing suggestion, generating new one from button click')
          await generateSuggestion('quick_scan', scanData.scan_id, user.id)
        }
      } catch (error) {
        console.error('Error generating tracking suggestion:', error)
      }
    } else {
      console.log('[QuickScanResults] Suggestion already exists, just showing modal')
    }
    
    // Small delay for smooth UX
    setTimeout(() => {
      setShowTrackingSuggestion(true)
      setIsLoadingTrackButton(false)
    }, 300)
  }

  const handleAskOracle = () => {
    setShowOracleModal(true)
  }

  const handleThinkHarder = async () => {
    console.log('Think Harder clicked, scanData:', scanData)
    if (!scanData.scan_id) {
      console.error('No scan_id available:', scanData)
      alert('Unable to enhance analysis - scan ID not found. Please try refreshing.')
      return
    }
    if (isThinkingHarder) return
    
    setIsThinkingHarder(true)
    
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://web-production-945c4.up.railway.app'
      
      // For Deep Dive, use deep dive ultra-think endpoint with session_id
      let endpoint, requestBody
      
      if (mode === 'deep') {
        endpoint = '/api/deep-dive/ultra-think'
        requestBody = {
          session_id: scanData.scan_id,  // Deep dive uses session_id
          user_id: user?.id
        }
      } else {
        endpoint = '/api/quick-scan/think-harder-o4'
        requestBody = {
          scan_id: scanData.scan_id,
          user_id: user?.id
        }
      }
      
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Think Harder API error:', response.status, errorText)
        throw new Error('Failed to get enhanced analysis')
      }
      
      const result = await response.json()
      console.log('Think Harder API response:', result)
      
      // Ensure we have a valid response
      if (!result || (typeof result === 'object' && Object.keys(result).length === 0)) {
        throw new Error('Empty response from API')
      }
      
      if (mode === 'deep') {
        setUltraAnalysis(result)
        setCurrentTier('ultra')
      } else {
        // Store the entire result, not looking for nested properties
        setO4MiniAnalysis(result)
        setCurrentTier('enhanced')
        
        // Log the structure to debug
        console.log('Think Harder result structure:', {
          hasEnhancedAnalysis: !!result.enhanced_analysis,
          hasO4MiniAnalysis: !!result.o4_mini_analysis,
          keys: Object.keys(result)
        })
      }
      
      // Show success notification
      setShowSuccessNotification(true)
      setTimeout(() => setShowSuccessNotification(false), 4000)
      
    } catch (error) {
      console.error('Think Harder failed:', error)
      alert('Unable to enhance analysis right now. Please try again later.')
    } finally {
      setIsThinkingHarder(false)
    }
  }

  const handleAskMeMore = async () => {
    console.log('Ask Me More clicked, mode:', mode, 'scanData:', scanData)
    
    if (isAskingMore) return
    
    // Different behavior for Quick Scan vs Deep Dive
    if (mode === 'quick') {
      // Quick Scan: Redirect to Deep Dive
      if (!scanData.scan_id) return
      
      setIsAskingMore(true)
      try {
        const formDataEncoded = encodeURIComponent(JSON.stringify(scanData.formData))
        router.push(`/scan?mode=deep&bodyPart=${scanData.bodyPart}&formData=${formDataEncoded}&fromScan=${scanData.scan_id}&continueToTarget=90`)
      } catch (error) {
        console.error('Ask Me More failed:', error)
        alert('Unable to continue questioning right now. Please try again later.')
      } finally {
        setIsAskingMore(false)
      }
    } else if (mode === 'deep') {
      // Deep Dive: Continue with more questions in the existing session
      const sessionId = scanData.scan_id
      if (!sessionId) {
        console.error('No session ID found for Deep Dive Ask Me More')
        return
      }
      
      setIsAskingMore(true)
      try {
        // For Deep Dive, redirect back to the chat with a flag to continue
        const formDataEncoded = encodeURIComponent(JSON.stringify(scanData.formData))
        router.push(`/scan?mode=deep&bodyPart=${scanData.bodyPart}&formData=${formDataEncoded}&continueSession=${sessionId}&targetConfidence=90`)
      } catch (error) {
        console.error('Ask Me More Deep Dive failed:', error)
        alert('Unable to continue questioning. Please try again.')
      } finally {
        setIsAskingMore(false)
      }
    }
  }

  return (
    <>
      <div className="space-y-6">
        {/* Success Notification */}
        <AnimatePresence>
          {showSuccessNotification && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              className="fixed top-4 right-4 z-50"
            >
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <Brain className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium">
                    {currentTier === 'ultra' ? 'Grok 4 Analysis Complete!' : 'o4-mini Analysis Complete!'}
                  </p>
                  <p className="text-sm text-white/80">
                    Confidence increased to {currentTier === 'ultra' ? (ultraAnalysis?.ultra_confidence || ultraAnalysis?.confidence_progression?.ultra || ultraAnalysis?.confidence) : (o4MiniAnalysis?.o4_mini_confidence || o4MiniAnalysis?.confidence)}%
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {/* Main Analysis Card with Tabbed Interface */}
        <div className="bg-gray-900/50 rounded-3xl border border-white/10 overflow-hidden">
          {/* Header with dynamic confidence coloring */}
          <div className={`p-8 border-b border-white/10 bg-gradient-to-r ${
            (currentTier === 'ultra' ? ultraAnalysis?.confidence_progression?.ultra || confidence :
             currentTier === 'enhanced' ? o4MiniAnalysis?.o4_mini_confidence || confidence :
             confidence) > 85 ? 'from-green-500/20 to-emerald-500/20' :
            (currentTier === 'ultra' ? ultraAnalysis?.confidence_progression?.ultra || confidence :
             currentTier === 'enhanced' ? o4MiniAnalysis?.o4_mini_confidence || confidence :
             confidence) > 70 ? 'from-blue-500/20 to-cyan-500/20' :
            'from-amber-500/20 to-orange-500/20'
          }`}>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-3xl font-bold text-white mb-2">Your Health Analysis</h3>
                <p className="text-gray-300">Analysis for {scanData.bodyPart.toLowerCase()} symptoms</p>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold text-white mb-1">
                  {currentTier === 'ultra' ? ultraAnalysis?.confidence_progression?.ultra || confidence :
                   currentTier === 'enhanced' ? o4MiniAnalysis?.o4_mini_confidence || confidence :
                   confidence}%
                </div>
                <div className="text-sm text-gray-400">
                  {currentTier === 'ultra' ? 'Ultra Confidence' :
                   currentTier === 'enhanced' ? 'Enhanced Confidence' :
                   'Initial Confidence'}
                </div>
                {currentTier !== 'basic' && (
                  <div className="mt-1 text-xs text-purple-400">
                    {currentTier === 'ultra' ? 'Powered by Grok 4' : 'Powered by o4-mini'}
                  </div>
                )}
                {/* Confidence Progression */}
                {currentTier !== 'basic' && (
                  <div className="mt-2 text-xs text-gray-500">
                    {confidence}% → 
                    {currentTier === 'enhanced' && (
                      <span className="text-purple-400"> {o4MiniAnalysis?.o4_mini_confidence || confidence}%</span>
                    )}
                    {currentTier === 'ultra' && o4MiniAnalysis && (
                      <>
                        <span className="text-purple-400"> {o4MiniAnalysis.o4_mini_confidence}%</span>
                        {' → '}
                      </>
                    )}
                    {currentTier === 'ultra' && (
                      <span className="text-pink-400">{ultraAnalysis?.confidence_progression?.ultra || confidence}%</span>
                    )}
                  </div>
                )}
                
                {/* Subtle What This Means Toggle */}
                {whatThisMeans && (
                  <button
                    onClick={() => setShowWhatThisMeans(!showWhatThisMeans)}
                    className="mt-3 text-xs text-gray-400 hover:text-gray-300 transition-colors flex items-center gap-1"
                  >
                    What does this mean?
                    <ChevronDown className={`w-3 h-3 transition-transform ${showWhatThisMeans ? 'rotate-180' : ''}`} />
                  </button>
                )}
              </div>
            </div>
            
            {/* Expandable What This Means */}
            <AnimatePresence>
              {showWhatThisMeans && whatThisMeans && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="px-8 pb-4 overflow-hidden"
                >
                  <div className="p-3 bg-white/[0.02] rounded-lg border border-white/[0.05]">
                    <p className="text-sm text-gray-300 leading-relaxed">{whatThisMeans}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Three-stage tabs */}
          <div className="flex border-b border-gray-800">
            {['Diagnosis', 'Care Plan', 'Watch For'].map((tab, index) => (
              <button
                key={tab}
                onClick={() => setActiveTab(index)}
                className={`flex-1 py-4 px-6 font-medium transition-all relative ${
                  activeTab === index 
                    ? 'text-white bg-gray-800/30' 
                    : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800/10'
                }`}
              >
                <span className="relative z-10">{tab}</span>
                {activeTab === index && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 border-b-2 border-blue-500"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <AnimatePresence mode="wait">
            {activeTab === 0 && (
              <motion.div
                key="diagnosis"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-8"
              >
                {/* Primary diagnosis */}
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-400 mb-3">Most Likely Condition</h4>
                  <h3 className="text-3xl font-bold text-white mb-3">
                    {currentTier === 'ultra' && ultraAnalysis?.ultra_analysis?.primaryCondition ||
                     currentTier === 'enhanced' && (o4MiniAnalysis?.enhanced_analysis?.primary_diagnosis?.condition || o4MiniAnalysis?.o4_mini_analysis?.enhanced_diagnosis?.primary) ||
                     analysisResult.primaryCondition}
                  </h3>
                  <p className="text-gray-300 mb-3">
                    {currentTier === 'ultra' && ultraAnalysis?.ultra_analysis?.likelihood ||
                     currentTier === 'enhanced' && (o4MiniAnalysis?.enhanced_analysis?.primary_diagnosis?.supporting_evidence?.join(', ') || o4MiniAnalysis?.o4_mini_analysis?.enhanced_diagnosis?.description) ||
                     analysisResult.likelihood}
                  </p>
                  
                  {/* Enhanced insights */}
                  {currentTier === 'enhanced' && (o4MiniAnalysis?.enhanced_analysis || o4MiniAnalysis?.o4_mini_analysis?.overlooked_considerations) && (
                    <div className="mt-4 p-4 bg-purple-500/10 rounded-lg border border-purple-500/30">
                      <h5 className="text-sm font-medium text-purple-400 mb-2">Enhanced Analysis (o4-mini)</h5>
                      <div className="space-y-2">
                        {/* Handle both response formats */}
                        {o4MiniAnalysis?.enhanced_analysis ? (
                          <>
                            {/* New format from backend guide */}
                            <div className="text-sm">
                              <span className="text-purple-300 font-medium">Confidence:</span>
                              <span className="text-gray-400 ml-2">{o4MiniAnalysis.enhanced_confidence || o4MiniAnalysis.enhanced_analysis?.confidence || (o4MiniAnalysis.original_confidence + o4MiniAnalysis.confidence_improvement)}%</span>
                            </div>
                            {o4MiniAnalysis.enhanced_analysis.clinical_pearls && (
                              <div className="text-sm">
                                <span className="text-purple-300 font-medium">Clinical Insights:</span>
                                <span className="text-gray-400 ml-2">{o4MiniAnalysis.enhanced_analysis.clinical_pearls.join(', ')}</span>
                              </div>
                            )}
                            {o4MiniAnalysis.enhanced_analysis.red_flags && o4MiniAnalysis.enhanced_analysis.red_flags.length > 0 && (
                              <div className="text-sm">
                                <span className="text-purple-300 font-medium">Red Flags:</span>
                                <span className="text-gray-400 ml-2">{o4MiniAnalysis.enhanced_analysis.red_flags[0].symptom}</span>
                              </div>
                            )}
                          </>
                        ) : o4MiniAnalysis?.o4_mini_analysis?.overlooked_considerations ? (
                          <>
                            {/* Old format fallback */}
                            {o4MiniAnalysis.o4_mini_analysis.overlooked_considerations.map((item: any, i: number) => (
                              <div key={i} className="text-sm">
                                <span className="text-purple-300 font-medium">{item.factor}:</span>
                                <span className="text-gray-400 ml-2">{item.significance}</span>
                              </div>
                            ))}
                          </>
                        ) : (
                          <div className="text-sm text-gray-400">Enhanced analysis data loading...</div>
                        )}
                      </div>
                      {/* Show confidence improvement */}
                      {o4MiniAnalysis?.confidence_improvement && (
                        <div className="mt-3 pt-3 border-t border-purple-500/20">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-purple-400">Confidence Progression:</span>
                            <div className="flex items-center gap-2">
                              <span className="text-gray-400">{confidence}%</span>
                              <span className="text-purple-400">→</span>
                              <span className="text-purple-300 font-medium">{o4MiniAnalysis.enhanced_confidence || o4MiniAnalysis.original_confidence + o4MiniAnalysis.confidence_improvement || 88}%</span>
                              <span className="text-green-400 text-xs">(+{o4MiniAnalysis.confidence_improvement || 3}%)</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Ultra insights */}
                  {currentTier === 'ultra' && ultraAnalysis?.ultra_analysis?.critical_insights && (
                    <div className="mt-4 p-4 bg-pink-500/10 rounded-lg border border-pink-500/30">
                      <h5 className="text-sm font-medium text-pink-400 mb-2">Grok 4 Critical Insights</h5>
                      <div className="space-y-1">
                        {ultraAnalysis.ultra_analysis.critical_insights.map((insight: string, i: number) => (
                          <p key={i} className="text-sm text-gray-300">• {insight}</p>
                        ))}
                      </div>
                      {ultraAnalysis.ultra_analysis.complexity_score && (
                        <div className="mt-3 pt-3 border-t border-pink-500/20">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-pink-400">
                              Case Complexity: {ultraAnalysis.ultra_analysis.complexity_score}/10
                            </span>
                            {ultraAnalysis.confidence_progression && (
                              <div className="flex items-center gap-2 text-xs">
                                <span className="text-gray-400">{ultraAnalysis.confidence_progression.original || confidence}%</span>
                                <span className="text-pink-400">→</span>
                                <span className="text-pink-300 font-medium">{ultraAnalysis.confidence_progression.ultra || ultraAnalysis.ultra_analysis.confidence}%</span>
                                <span className="text-green-400">(+{(ultraAnalysis.confidence_progression.ultra || ultraAnalysis.ultra_analysis.confidence) - (ultraAnalysis.confidence_progression.original || confidence)}%)</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Why this diagnosis - collapsible */}
                  <button
                    onClick={() => setShowWhy(!showWhy)}
                    className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-2 transition-colors"
                  >
                    Why this diagnosis? 
                    <ChevronDown className={`w-4 h-4 transition-transform ${showWhy ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {showWhy && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-3 p-4 bg-gray-800/50 rounded-xl text-sm text-gray-300">
                          Based on your symptoms of {scanData.formData.symptoms} in the {scanData.bodyPart} area, 
                          along with the {scanData.formData.painType?.join(', ') || 'described'} pain pattern and {scanData.formData.duration || 'reported'} duration, 
                          this diagnosis best matches your presentation.
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Differential diagnoses */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-400 mb-3">Other Possibilities</h4>
                  <div className="space-y-3">
                    {(currentTier === 'ultra' && ultraAnalysis?.ultra_analysis?.differentials ||
                      currentTier === 'enhanced' && (o4MiniAnalysis?.enhanced_analysis?.differential_diagnoses || o4MiniAnalysis?.o4_mini_analysis?.differential_refinement) ||
                      analysisResult.differentials)?.map((diff: any, index: number) => (
                      <div key={index} className="bg-gray-800/30 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-white">{diff.condition}</span>
                          <span className="text-sm text-gray-400">{diff.probability}% likely</span>
                        </div>
                        <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${diff.probability}%` }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="h-full bg-gradient-to-r from-purple-500 to-purple-600"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Dive Deeper - Analysis depth indicator */}
                <div className="mt-6 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 max-w-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-400">Analysis Depth</span>
                        <span className="text-xs text-gray-400">{confidence}% confidence</span>
                      </div>
                      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${confidence}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                        />
                      </div>
                    </div>
                  </div>
                  
                </div>
              </motion.div>
            )}

            {activeTab === 1 && (
              <motion.div
                key="care"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-8"
              >
                {/* Immediate actions from backend or existing recommendations */}
                <div className="mb-8">
                  <h4 className="text-lg font-semibold text-gray-400 mb-4">Immediate Actions</h4>
                  <div className="space-y-3">
                    {(immediateActions || 
                      currentTier === 'ultra' && ultraAnalysis?.ultra_analysis?.diagnostic_strategy?.immediate_actions ||
                      currentTier === 'enhanced' && o4MiniAnalysis?.o4_mini_analysis?.specific_recommendations ||
                      analysisResult.recommendations?.slice(0, 3))?.map((rec: any, index: number) => (
                      <div key={index} className="flex items-start gap-4 p-4 bg-gray-800/30 rounded-lg">
                        <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-green-400 font-bold">{index + 1}</span>
                        </div>
                        <p className="text-gray-300">
                          {typeof rec === 'string' ? rec : (rec.action || rec.text || JSON.stringify(rec))}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Self-care */}
                <div className="mb-8">
                  <h4 className="text-lg font-semibold text-gray-400 mb-4">Self-Care Guidelines</h4>
                  <div className="grid gap-3">
                    {analysisResult.selfCare.map((care: any, index: number) => (
                      <div key={index} className="flex items-center gap-3 text-gray-300">
                        <Sparkles className="w-4 h-4 text-cyan-400" />
                        <span>{care}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Timeline */}
                <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/30">
                  <h4 className="text-sm font-medium text-blue-400 mb-2">Expected Timeline</h4>
                  <p className="text-gray-300">
                    {currentTier === 'enhanced' && o4MiniAnalysis?.o4_mini_analysis?.timeline_expectations?.recovery_estimate ||
                     currentTier === 'ultra' && ultraAnalysis?.ultra_analysis?.diagnostic_strategy?.timeline ||
                     analysisResult.timeline}
                  </p>
                  {currentTier === 'enhanced' && o4MiniAnalysis?.o4_mini_analysis?.timeline_expectations?.milestones && (
                    <div className="mt-2 pt-2 border-t border-blue-500/20">
                      <p className="text-xs text-blue-400 mb-1">Key Milestones:</p>
                      <ul className="space-y-1">
                        {o4MiniAnalysis.o4_mini_analysis.timeline_expectations.milestones.map((milestone: any, i: number) => (
                          <li key={i} className="text-xs text-gray-400">
                            • {milestone.timeframe}: {milestone.expectation}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 2 && (
              <motion.div
                key="watch"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-8"
              >
                {/* Red flags */}
                <div className="mb-8">
                  <h4 className="text-lg font-semibold text-red-400 mb-4">Seek Immediate Care If:</h4>
                  <div className="bg-red-500/10 rounded-lg p-4 border border-red-500/30">
                    <div className="space-y-2">
                      {analysisResult.redFlags.map((flag: any, index: number) => (
                        <div key={index} className="flex items-start gap-3">
                          <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
                          <span className="text-gray-300">{flag}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Monitor symptoms */}
                <div className="mb-8">
                  <h4 className="text-lg font-semibold text-gray-400 mb-4">Monitor These Changes</h4>
                  <div className="space-y-3">
                    {analysisResult.relatedSymptoms.map((symptom: any, index: number) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-gray-800/30 rounded-lg">
                        <Eye className="w-5 h-5 text-amber-400 mt-0.5" />
                        <span className="text-gray-300">{typeof symptom === 'string' ? symptom : (symptom.name || symptom.text || JSON.stringify(symptom))}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Follow-up */}
                <div className="p-4 bg-amber-500/10 rounded-lg border border-amber-500/30">
                  <h4 className="text-sm font-medium text-amber-400 mb-2">When to Follow Up</h4>
                  <p className="text-gray-300">{analysisResult.followUp}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Action Buttons with subtle Oracle integration */}
        <div className="bg-gray-900/50 rounded-2xl border border-white/10 p-6">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-lg font-semibold text-white">Next Steps</h4>
            {confidence < 70 && (
              <div className="flex items-center gap-2 text-sm text-amber-400">
                <AlertCircle className="w-4 h-4" />
                <span>Low confidence - consider deeper analysis</span>
              </div>
            )}
          </div>

          <div className="grid md:grid-cols-3 gap-4 mb-6">
            {/* Export PDF - Simple format */}
            <button 
              onClick={handleExportPDF}
              className="px-4 py-4 rounded-xl bg-gray-800 hover:bg-gray-700 transition-all flex items-center justify-center gap-3 group"
            >
              <Download className="w-5 h-5 text-gray-400 group-hover:text-gray-300" />
              <div className="text-left">
                <div className="font-medium text-white">Export PDF</div>
                <div className="text-xs text-gray-400">Quick scan results</div>
              </div>
            </button>

            {/* Generate Medical Report - Epic MyChart format */}
            <button 
              onClick={handleGenerateMedicalReport}
              className="px-4 py-4 rounded-xl bg-gradient-to-r from-purple-600/20 to-purple-600/10 hover:from-purple-600/30 hover:to-purple-600/20 border border-purple-500/30 hover:border-purple-500/50 transition-all flex items-center justify-center gap-3 group"
            >
              <ClipboardList className="w-5 h-5 text-purple-400 group-hover:text-purple-300" />
              <div className="text-left">
                <div className="font-medium text-white">Medical Report</div>
                <div className="text-xs text-purple-300">For doctor visits</div>
              </div>
            </button>
            
            {/* Track Over Time */}
            <button 
              onClick={handleTrackProgress}
              disabled={isLoadingTrackButton || isGeneratingTracking}
              className="px-4 py-4 rounded-xl bg-gray-800 hover:bg-gray-700 disabled:bg-gray-800/50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3 group"
            >
              {isLoadingTrackButton || isGeneratingTracking ? (
                <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
              ) : (
                <TrendingUp className="w-5 h-5 text-gray-400 group-hover:text-gray-300" />
              )}
              <div className="text-left">
                <div className="font-medium text-white">
                  {isLoadingTrackButton || isGeneratingTracking ? 'Preparing...' : 'Track Symptoms'}
                </div>
                <div className="text-xs text-gray-400">
                  {isLoadingTrackButton || isGeneratingTracking ? 'Setting up' : 'Monitor changes'}
                </div>
              </div>
            </button>
          </div>

          {/* Email option for Medical Report */}
          <div className="flex items-center justify-center mb-4">
            <button
              onClick={handleEmailMedicalReport}
              className="text-sm text-gray-400 hover:text-gray-300 flex items-center gap-2 transition-colors"
            >
              <Mail className="w-4 h-4" />
              Email medical report to doctor
            </button>
          </div>

          {/* Subtle Oracle prompt based on confidence or complexity */}
          <div className={`p-4 rounded-xl transition-all ${
            confidence < 70 
              ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30' 
              : 'bg-gray-800/50 border border-gray-700'
          }`}>
            <button
              onClick={handleAskOracle}
              className="w-full flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <Brain className={`w-5 h-5 ${
                  confidence < 70 ? 'text-purple-400' : 'text-gray-400'
                }`} />
                <div className="text-left">
                  <div className="font-medium text-white">
                    {confidence < 70 
                      ? 'Get a deeper analysis with Oracle AI' 
                      : confidence < 90
                      ? 'Want higher confidence? Ask Oracle AI'
                      : 'Have questions? Ask Oracle AI'}
                  </div>
                  <div className="text-xs text-gray-400">
                    {confidence < 90 
                      ? 'Ask for more questions to reach 90%+ confidence'
                      : 'Advanced reasoning for complex symptoms'}
                  </div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-300 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>

        {/* Enhanced Analysis Options */}
        <div className="space-y-3">
          <div className="text-center text-sm text-gray-400 mb-4">
            {mode === 'deep' ? 'Maximize diagnostic certainty' : 'Need even more certainty about your diagnosis?'}
          </div>
          
          <div className={`grid grid-cols-1 ${mode === 'quick' ? 'md:grid-cols-2' : confidence < 90 ? 'md:grid-cols-2' : 'md:grid-cols-1'} gap-3`}>
            {/* Quick Scan: Dive Deeper button */}
            {mode === 'quick' && (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
                onClick={() => {
                  const formDataEncoded = encodeURIComponent(JSON.stringify(scanData.formData))
                  router.push(`/scan?mode=deep&bodyPart=${scanData.bodyPart}&formData=${formDataEncoded}&fromScan=${scanData.scan_id}`)
                }}
                className="relative px-6 py-4 rounded-xl bg-gradient-to-r from-blue-600/20 to-indigo-600/20 border border-blue-500/30 text-blue-300 hover:from-blue-600/30 hover:to-indigo-600/30 hover:text-blue-200 hover:border-blue-400/50 hover:shadow-lg hover:shadow-blue-500/20 transition-all flex items-center justify-center gap-3 group overflow-hidden"
              >
                <Brain className="w-5 h-5 group-hover:animate-pulse" />
                <span className="font-medium">Dive Deeper</span>
                <motion.span
                  className="text-xs opacity-0 group-hover:opacity-100 transition-opacity absolute -bottom-6 left-1/2 transform -translate-x-1/2 whitespace-nowrap text-blue-400"
                >
                  Advanced questioning
                </motion.span>
              </motion.button>
            )}

            {/* Think Harder button - both modes */}
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 300 }}
              onClick={() => handleThinkHarder()}
              disabled={isThinkingHarder || isAskingMore}
              className="relative px-6 py-4 rounded-xl bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 text-purple-300 hover:from-purple-600/30 hover:to-pink-600/30 hover:text-purple-200 hover:border-purple-400/50 hover:shadow-lg hover:shadow-purple-500/20 transition-all flex items-center justify-center gap-3 group disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
            >
              {/* Animated background gradient */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-pink-600/10"
                animate={{
                  opacity: isThinkingHarder ? [0.1, 0.3, 0.1] : 0,
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
              
              {isThinkingHarder ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="font-medium"
                  >
                    {mode === 'deep' ? 'Grokking your symptoms...' : 'o4-mini-izing your symptoms...'}
                  </motion.div>
                </>
              ) : (
                <>
                  <Brain className="w-5 h-5 group-hover:animate-pulse transition-transform group-hover:scale-110" />
                  <span className="font-medium">Think Harder</span>
                  <motion.span
                    className="text-xs opacity-0 group-hover:opacity-100 transition-opacity absolute -bottom-6 left-1/2 transform -translate-x-1/2 whitespace-nowrap text-purple-400"
                  >
                    {mode === 'deep' ? 'Grok 4 reasoning' : 'o4-mini reasoning'}
                  </motion.span>
                </>
              )}
            </motion.button>
            
            {/* Ask Me More - Deep Dive only when confidence < 90% */}
            {mode === 'deep' && confidence < 90 && (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                transition={{ delay: 0.4, type: "spring", stiffness: 300 }}
                onClick={() => handleAskMeMore()}
                disabled={isThinkingHarder || isAskingMore}
                className="relative px-6 py-4 rounded-xl bg-gradient-to-r from-emerald-600/20 to-cyan-600/20 border border-emerald-500/30 text-emerald-300 hover:from-emerald-600/30 hover:to-cyan-600/30 hover:text-emerald-200 hover:border-emerald-400/50 hover:shadow-lg hover:shadow-emerald-500/20 transition-all flex items-center justify-center gap-3 group disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
              >
                {/* Animated background gradient */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-emerald-600/10 to-cyan-600/10"
                  animate={{
                    opacity: isAskingMore ? [0.1, 0.3, 0.1] : 0,
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
                
                {isAskingMore ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="font-medium"
                    >
                      Returning to Chat...
                    </motion.div>
                  </>
                ) : (
                  <>
                    <MessageSquare className="w-5 h-5 group-hover:animate-bounce transition-transform group-hover:scale-110" />
                    <span className="font-medium">Ask Me More</span>
                    <motion.span
                      className="text-xs opacity-0 group-hover:opacity-100 transition-opacity absolute -bottom-6 left-1/2 transform -translate-x-1/2 whitespace-nowrap text-emerald-400"
                    >
                      90%+ confidence
                    </motion.span>
                  </>
                )}
              </motion.button>
            )}
          </div>

          {/* Subtle explanation */}
          <div className="text-xs text-gray-400 text-center space-y-1">
            {mode === 'quick' ? (
              <>
                <p><span className="text-blue-400">Dive Deeper:</span> Advanced questioning for complex symptoms</p>
                <p><span className="text-purple-400">Think Harder:</span> o4-mini enhanced reasoning</p>
              </>
            ) : (
              <>
                <p><span className="text-purple-400">Think Harder:</span> Grok 4 maximum reasoning power</p>
                {confidence < 90 && (
                  <p><span className="text-emerald-400">Ask Me More:</span> Continue until 90%+ confidence</p>
                )}
              </>
            )}
          </div>
        </div>

        {/* New Scan Button */}
        <div className="text-center">
          <button
            onClick={onNewScan}
            className="px-6 py-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-medium transition-all"
          >
            Start New Scan
          </button>
        </div>
        {/* Tracking Suggestion */}
        <AnimatePresence>
          {showTrackingSuggestion && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="mt-6"
            >
              <div className="backdrop-blur-[20px] bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl p-6">
                {(trackingStoreLoading || !currentSuggestion) ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
                    <span className="ml-3 text-gray-300">Preparing your personalized tracking plan...</span>
                  </div>
                ) : (
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                      <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-2">
                        Track Your Symptoms Over Time
                      </h3>
                      <p className="text-gray-300 mb-4">
                        Based on your scan, we recommend tracking: <strong>{currentSuggestion.metric_name}</strong>
                      </p>
                      <p className="text-sm text-gray-400 mb-4">
                        {currentSuggestion.metric_description}
                      </p>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => router.push('/dashboard')}
                          className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all"
                        >
                          Start Tracking
                        </button>
                        <button
                          onClick={() => setShowTrackingSuggestion(false)}
                          className="px-4 py-2 bg-white/5 border border-white/10 text-gray-300 rounded-lg hover:bg-white/10 transition-all"
                        >
                          Maybe Later
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Oracle Panel Overlay */}
      <AnimatePresence>
        {showOraclePanel && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-900 rounded-3xl shadow-2xl max-w-5xl w-full h-[90vh] flex flex-col relative overflow-hidden"
              style={{
                boxShadow: '0 0 50px rgba(168, 85, 247, 0.15), 0 0 100px rgba(236, 72, 153, 0.1)'
              }}
            >
              {/* Gradient border effect */}
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 opacity-20" />
              <div className="absolute inset-[1px] rounded-3xl bg-gray-900" />
              
              {/* Header */}
              <div className="relative px-6 py-5 border-b border-gray-800/50 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-purple-500/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-lg opacity-50" />
                      <div className="relative w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                        <Brain className="w-7 h-7 text-white" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        Oracle AI Assistant
                        <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-normal">
                          Advanced Mode
                        </span>
                      </h3>
                      <p className="text-sm text-gray-400 mt-0.5">Powered by Claude 3 • Deep reasoning analysis</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowOraclePanel(false)}
                    className="p-2.5 rounded-xl bg-gray-800/50 hover:bg-gray-700/50 transition-all text-gray-400 hover:text-gray-300"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              {/* Oracle Chat */}
              <div className="relative flex-1 overflow-hidden">
                <OracleEmbedded 
                  quickScanContext={{
                    scanId: scanData.scan_id || null,
                    confidence,
                    analysis: analysisResult,
                    bodyPart: scanData.bodyPart,
                    symptoms: scanData.formData?.symptoms || ''
                  }}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Oracle AI Modal */}
      <OracleAIModal 
        isOpen={showOracleModal}
        onClose={() => setShowOracleModal(false)}
        analysisData={{
          confidence,
          diagnosis: analysisResult.primaryCondition,
          other_possibilities: analysisResult.differentials?.map((diff: any) => ({
            name: diff.condition,
            likelihood: diff.probability
          })) || [],
          reasoning: analysis.reasoning || ''
        }}
        bodyPart={scanData.bodyPart}
      />
    </>
  )
}
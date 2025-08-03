'use client'

import { useSearchParams } from 'next/navigation'
import { useState, useEffect, Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Zap, Brain, Sparkles } from 'lucide-react'
import { useRouter } from 'next/navigation'
import UnifiedScanForm from '@/components/UnifiedScanForm'
import GeneralAssessmentForm from '@/components/GeneralAssessmentForm'
import QuickScanResults from '@/components/QuickScanResults'
import DeepDiveChat from '@/components/DeepDiveChat'
import GeneralDeepDiveChat from '@/components/GeneralDeepDiveChat'
import FlashAssessmentResult from '@/components/results/FlashAssessmentResult'
import GeneralAssessmentResult from '@/components/results/GeneralAssessmentResult'
import UnifiedAuthGuard from '@/components/UnifiedAuthGuard'
import { useQuickScan } from '@/hooks/useQuickScan'
import { useAuth } from '@/contexts/AuthContext'
import { getUserProfile } from '@/utils/onboarding'

export const dynamic = 'force-dynamic'

function ScanPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const mode = searchParams.get('mode') as 'flash' | 'quick' | 'deep' || 'quick'
  const source = searchParams.get('source') || 'body' // 'body' or 'general'
  const bodyPart = searchParams.get('bodyPart')
  const formDataParam = searchParams.get('formData')
  const fromScan = searchParams.get('fromScan')
  const continueSession = searchParams.get('continueSession')
  const targetConfidence = searchParams.get('targetConfidence')
  const [currentStep, setCurrentStep] = useState<'intro' | 'form' | 'analysis'>('intro')
  const [scanData, setScanData] = useState<any>(null)
  const [userGender, setUserGender] = useState<'male' | 'female'>('male') // Default to male
  const { performScan, isLoading, error, scanResult } = useQuickScan()
  const { user } = useAuth()

  // Fetch user profile to get gender
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user?.id) {
        try {
          const profile = await getUserProfile(user.id, user.email || '', user.user_metadata?.full_name || null)
          // Convert is_male to gender string
          if (profile) {
            const gender = profile.is_male === false ? 'female' : 'male' // Default to male for null/true
            setUserGender(gender)
          }
        } catch (error) {
          console.error('Failed to fetch user profile:', error)
          // Keep default of male
        }
      }
    }
    fetchUserProfile()
  }, [user?.id])

  useEffect(() => {
    // If continuing a Deep Dive session or coming from a Quick Scan
    if ((fromScan || continueSession) && bodyPart && formDataParam && mode === 'deep') {
      try {
        const formData = JSON.parse(decodeURIComponent(formDataParam))
        setScanData({
          bodyPart,
          formData,
          mode: 'deep',
          fromScan,
          continueSession,
          targetConfidence: targetConfidence ? parseInt(targetConfidence) : undefined
        })
        setCurrentStep('analysis')
      } catch (error) {
        console.error('Failed to parse form data:', error)
        setCurrentStep('form')
      }
    } else {
      // Show intro for 2 seconds
      const timer = setTimeout(() => {
        setCurrentStep('form')
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [fromScan, continueSession, bodyPart, formDataParam, mode, targetConfidence])

  const handleFormComplete = async (data: any) => {
    if (source === 'general' && data.result) {
      // General assessment already has the result from API
      setScanData({
        ...data,
        source: 'general'
      })
      setCurrentStep('analysis')
    } else if (source === 'body' && (mode === 'quick' || mode === 'flash')) {
      // Body scan - use existing performScan
      try {
        const result = await performScan(
          data.bodyPart, 
          data.formData
        )
        setScanData({
          ...data,
          bodyPart: data.bodyPart,
          ...result,
          analysis: result.analysis,
          confidence: result.confidence,
          scan_id: result.scan_id
        })
        setCurrentStep('analysis')
      } catch (err) {
        console.error('Quick scan failed:', err)
        // Could show error state here
      }
    } else {
      // Deep dive mode - pass data directly
      setScanData({
        ...data,
        source,
        bodyPart: source === 'general' ? data.category || 'general' : data.bodyPart
      })
      setCurrentStep('analysis')
    }
  }

  const handleBack = () => {
    if (currentStep === 'analysis') {
      setCurrentStep('form')
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <UnifiedAuthGuard requireAuth={true}>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        {/* Header */}
        <div className="sticky top-0 z-50 backdrop-blur-lg bg-gray-900/50 border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <button
                onClick={handleBack}
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              
              <div className="flex items-center gap-2">
                {mode === 'flash' ? (
                  <>
                    <Sparkles className="w-5 h-5 text-amber-400" />
                    <span className="font-medium text-white">Flash Assessment</span>
                  </>
                ) : mode === 'quick' ? (
                  <>
                    <Zap className="w-5 h-5 text-emerald-400" />
                    <span className="font-medium text-white">Quick Scan</span>
                  </>
                ) : (
                  <>
                    <Brain className="w-5 h-5 text-indigo-400" />
                    <span className="font-medium text-white">Deep Dive</span>
                  </>
                )}
              </div>

              <div className="text-sm text-gray-400">
                {mode === 'flash' ? '10 seconds' : mode === 'quick' ? '30-45 seconds' : '2-5 minutes'}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="relative">
          <AnimatePresence mode="wait">
            {/* Intro Screen */}
            {currentStep === 'intro' && (
              <motion.div
                key="intro"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="min-h-[calc(100vh-4rem)] flex items-center justify-center"
              >
                <div className="text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", damping: 15 }}
                    className={`w-24 h-24 mx-auto mb-8 rounded-full flex items-center justify-center ${
                      mode === 'flash'
                        ? 'bg-gradient-to-br from-amber-500/20 to-yellow-500/20'
                        : mode === 'quick' 
                        ? 'bg-gradient-to-br from-emerald-500/20 to-green-500/20' 
                        : 'bg-gradient-to-br from-indigo-500/20 to-purple-500/20'
                    }`}
                  >
                    {mode === 'flash' ? (
                      <Sparkles className="w-12 h-12 text-amber-400" />
                    ) : mode === 'quick' ? (
                      <Zap className="w-12 h-12 text-emerald-400" />
                    ) : (
                      <Brain className="w-12 h-12 text-indigo-400" />
                    )}
                  </motion.div>
                  
                  <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-4xl font-bold text-white mb-4"
                  >
                    {mode === 'flash' ? 'Flash Assessment' : mode === 'quick' ? 'Quick Scan' : 'Deep Dive Analysis'}
                  </motion.h1>
                  
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-gray-400 text-lg"
                  >
                    {mode === 'flash'
                      ? 'Tell us what\'s happening in your own words'
                      : mode === 'quick' 
                      ? 'Get instant AI-powered health insights'
                      : 'Comprehensive analysis with personalized follow-up questions'
                    }
                  </motion.p>
                </div>
              </motion.div>
            )}

            {/* Form Screen */}
            {currentStep === 'form' && (
              <motion.div
                key="form"
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
              >
                {source === 'general' ? (
                  <GeneralAssessmentForm
                    mode={mode as 'flash' | 'quick' | 'deep'}
                    onComplete={handleFormComplete}
                    userGender={userGender}
                  />
                ) : (
                  <UnifiedScanForm 
                    mode={mode as 'quick' | 'deep'}
                    onComplete={handleFormComplete}
                    userGender={userGender}
                  />
                )}
              </motion.div>
            )}

            {/* Analysis Screen */}
            {currentStep === 'analysis' && scanData && (
              <motion.div
                key="analysis"
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
              >
                {/* Flash Assessment Result */}
                {mode === 'flash' && scanData.source === 'general' && scanData.result ? (
                  <FlashAssessmentResult 
                    result={scanData.result}
                    userQuery={scanData.formData.symptoms}
                    onNewAssessment={() => {
                      setScanData(null)
                      setCurrentStep('form')
                    }}
                  />
                ) : 
                /* General Assessment Result */
                mode === 'quick' && scanData.source === 'general' && scanData.result ? (
                  <GeneralAssessmentResult 
                    result={scanData.result}
                    category={scanData.category}
                    formData={scanData.formData}
                    onNewAssessment={() => {
                      setScanData(null)
                      setCurrentStep('form')
                    }}
                    onDeepDive={() => {
                      // Switch to deep dive mode with existing data
                      const params = new URLSearchParams({
                        mode: 'deep',
                        source: 'general',
                        category: scanData.category,
                        formData: encodeURIComponent(JSON.stringify(scanData.formData))
                      })
                      router.push(`/scan?${params.toString()}`)
                    }}
                  />
                ) : 
                /* Body Scan Results */
                (mode === 'quick' || mode === 'flash') && scanData.source !== 'general' ? (
                  <QuickScanResults 
                    scanData={scanData}
                    onNewScan={() => {
                      setScanData(null)
                      setCurrentStep('form')
                    }}
                    mode={mode === 'flash' ? 'quick' : mode}
                  />
                ) : 
                /* Deep Dive */
                mode === 'deep' ? (
                  scanData.source === 'general' ? (
                    <GeneralDeepDiveChat 
                      scanData={scanData}
                      onComplete={(finalAnalysis) => {
                        console.log('General Deep Dive complete:', finalAnalysis)
                      }}
                    />
                  ) : (
                    <DeepDiveChat 
                      scanData={scanData}
                      onComplete={(finalAnalysis) => {
                        console.log('Deep Dive complete:', finalAnalysis)
                      }}
                    />
                  )
                ) : null}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </UnifiedAuthGuard>
  )
}

export default function ScanPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    }>
      <ScanPageContent />
    </Suspense>
  )
}
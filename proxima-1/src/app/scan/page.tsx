'use client'

import { useSearchParams } from 'next/navigation'
import { useState, useEffect, Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Zap, Brain } from 'lucide-react'
import { useRouter } from 'next/navigation'
import UnifiedScanForm from '@/components/UnifiedScanForm'
import QuickScanResults from '@/components/QuickScanResults'
import DeepDiveChat from '@/components/DeepDiveChat'
import AuthGuard from '@/components/AuthGuard'
import { useQuickScan } from '@/hooks/useQuickScan'

function ScanPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const mode = searchParams.get('mode') || 'quick'
  const [currentStep, setCurrentStep] = useState<'intro' | 'form' | 'analysis'>('intro')
  const [scanData, setScanData] = useState(null)
  const { performScan, isLoading, error, scanResult } = useQuickScan()

  useEffect(() => {
    // Show intro for 2 seconds
    const timer = setTimeout(() => {
      setCurrentStep('form')
    }, 2000)
    return () => clearTimeout(timer)
  }, [])

  const handleFormComplete = async (data: any) => {
    if (mode === 'quick') {
      try {
        const result = await performScan(data.bodyPart, data.formData)
        setScanData({
          ...data,
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
      setScanData(data)
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
    <AuthGuard>
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
                {mode === 'quick' ? (
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
                {mode === 'quick' ? '3-5 seconds' : '2-3 minutes'}
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
                      mode === 'quick' 
                        ? 'bg-gradient-to-br from-emerald-500/20 to-green-500/20' 
                        : 'bg-gradient-to-br from-indigo-500/20 to-purple-500/20'
                    }`}
                  >
                    {mode === 'quick' ? (
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
                    {mode === 'quick' ? 'Quick Scan' : 'Deep Dive Analysis'}
                  </motion.h1>
                  
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-gray-400 text-lg"
                  >
                    {mode === 'quick' 
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
                <UnifiedScanForm 
                  mode={mode as 'quick' | 'deep'}
                  onComplete={handleFormComplete}
                />
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
                {mode === 'quick' ? (
                  <QuickScanResults 
                    scanData={scanData}
                    onNewScan={() => {
                      setScanData(null)
                      setCurrentStep('form')
                    }}
                  />
                ) : (
                  <DeepDiveChat 
                    scanData={scanData}
                    onComplete={(finalAnalysis) => {
                      // Show same results UI with deep dive data
                      console.log('Deep Dive complete:', finalAnalysis)
                    }}
                  />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </AuthGuard>
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
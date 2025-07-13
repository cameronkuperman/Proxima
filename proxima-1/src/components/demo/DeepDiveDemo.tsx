'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Brain } from 'lucide-react'
import UnifiedScanForm from '@/components/UnifiedScanForm'
import DeepDiveChat from '@/components/DeepDiveChat'

interface DeepDiveDemoProps {
  onComplete: () => void
}

export function DeepDiveDemo({ onComplete }: DeepDiveDemoProps) {
  const [step, setStep] = useState<'intro' | 'scan' | 'chat'>('intro')
  const [scanData, setScanData] = useState<any>(null)

  useEffect(() => {
    if (step === 'intro') {
      setTimeout(() => setStep('scan'), 3000)
    }
  }, [step])

  const handleScanComplete = (data: any) => {
    setScanData({
      ...data,
      mode: 'deep'
    })
    setStep('chat')
  }

  const handleDeepDiveComplete = (finalAnalysis: any) => {
    // The DeepDiveChat component already shows the results
    console.log('Deep Dive completed with analysis:', finalAnalysis)
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-8"
      >
        <button
          onClick={onComplete}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to features
        </button>
        
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm font-medium">
          <Brain className="w-3 h-3" />
          Deep Dive Demo
        </div>
      </motion.div>

      {/* Content */}
      <div className="flex-1 relative">
        <AnimatePresence mode="wait">
          {/* Intro */}
          {step === 'intro' && (
            <motion.div
              key="intro"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <div className="text-center max-w-2xl">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring" }}
                  className="mb-8"
                >
                  <div className="w-24 h-24 mx-auto bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                    <Brain className="w-12 h-12 text-white" />
                  </div>
                </motion.div>
                <h3 className="text-5xl font-bold text-white mb-4">Deep Dive Analysis</h3>
                <p className="text-xl text-gray-300">
                  Our AI asks intelligent follow-up questions to provide comprehensive health insights
                </p>
              </div>
            </motion.div>
          )}

          {/* 3D Scan Form */}
          {step === 'scan' && (
            <motion.div
              key="scan"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full"
            >
              <UnifiedScanForm 
                mode="deep"
                onComplete={handleScanComplete}
                demoMode={true}
              />
            </motion.div>
          )}

          {/* Deep Dive Chat */}
          {step === 'chat' && scanData && (
            <motion.div
              key="chat"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full"
            >
              <DeepDiveChat 
                scanData={scanData}
                onComplete={handleDeepDiveComplete}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
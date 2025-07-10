'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Play, Sparkles, ChevronRight, Check, Lock, Construction } from 'lucide-react'
import { FeatureCard } from './FeatureCard'
import { QuickScanDemo } from './QuickScanDemo'
import { DeepDiveDemo } from './DeepDiveDemo'
import { PhotoAnalysisDemo } from './PhotoAnalysisDemo'

interface WalkthroughState {
  isActive: boolean
  currentView: 'welcome' | 'cards' | 'quickScan' | 'deepDive' | 'photoAnalysis' | 'closing'
  exploredFeatures: string[]
  userEmail?: string
  hasSeenBefore: boolean
}

export function InteractiveWalkthrough() {
  const [state, setState] = useState<WalkthroughState>({
    isActive: false,
    currentView: 'welcome',
    exploredFeatures: [],
    hasSeenBefore: false
  })

  useEffect(() => {
    const savedState = localStorage.getItem('proxima-walkthrough')
    if (savedState) {
      const parsed = JSON.parse(savedState)
      setState(prev => ({ ...prev, hasSeenBefore: true }))
    }
  }, [])

  useEffect(() => {
    if (state.exploredFeatures.length > 0) {
      localStorage.setItem('proxima-walkthrough', JSON.stringify({
        exploredFeatures: state.exploredFeatures,
        lastSeen: new Date().toISOString()
      }))
    }
  }, [state.exploredFeatures])

  useEffect(() => {
    // Listen for custom event to trigger walkthrough
    const handleOpenWalkthrough = () => {
      startWalkthrough()
    }

    window.addEventListener('openWalkthrough', handleOpenWalkthrough)
    return () => window.removeEventListener('openWalkthrough', handleOpenWalkthrough)
  }, [])

  const startWalkthrough = () => {
    setState(prev => ({ ...prev, isActive: true, currentView: 'welcome' }))
    setTimeout(() => {
      setState(prev => ({ ...prev, currentView: 'cards' }))
    }, 3000)
  }

  const exploreFeature = (feature: string) => {
    setState(prev => ({
      ...prev,
      currentView: feature as any,
      exploredFeatures: [...new Set([...prev.exploredFeatures, feature])]
    }))
  }

  const backToCards = () => {
    setState(prev => ({ ...prev, currentView: 'cards' }))
  }

  const closeWalkthrough = () => {
    if (state.exploredFeatures.length === 3) {
      setState(prev => ({ ...prev, currentView: 'closing' }))
      setTimeout(() => {
        setState(prev => ({ ...prev, isActive: false }))
      }, 4000)
    } else {
      setState(prev => ({ ...prev, isActive: false }))
    }
  }

  const features = [
    {
      id: 'quickScan',
      title: 'Quick Scan',
      subtitle: 'Instant health insights',
      description: 'Click on your body, get answers in seconds',
      status: 'available' as const,
      icon: '⚡',
      gradient: 'from-blue-500 to-cyan-500',
      demo: <QuickScanDemo onComplete={backToCards} />
    },
    {
      id: 'deepDive',
      title: 'Deep Dive',
      subtitle: 'Comprehensive analysis',
      description: 'AI-powered follow-up questions for accuracy',
      status: 'beta' as const,
      releaseDate: 'Late 2025',
      icon: '🧬',
      gradient: 'from-purple-500 to-pink-500',
      demo: <DeepDiveDemo onComplete={backToCards} />
    },
    {
      id: 'photoAnalysis',
      title: 'Photo Analysis',
      subtitle: 'Visual symptom tracking',
      description: 'Track changes and healing over time',
      status: 'coming-soon' as const,
      releaseDate: 'Late 2025',
      icon: '📸',
      gradient: 'from-orange-500 to-red-500',
      demo: <PhotoAnalysisDemo onComplete={backToCards} />
    }
  ]

  const currentFeature = features.find(f => f.id === state.currentView)

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={startWalkthrough}
        className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-200"
      >
        Try Demo
      </button>

      {/* Walkthrough Overlay */}
      <AnimatePresence>
        {state.isActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-black backdrop-blur-sm"
          >
            {/* Close Button */}
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              onClick={closeWalkthrough}
              className="absolute top-6 right-6 p-2 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </motion.button>

            {/* Progress Indicator */}
            {state.currentView === 'cards' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2"
              >
                {features.map((feature) => (
                  <div
                    key={feature.id}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      state.exploredFeatures.includes(feature.id)
                        ? 'bg-white'
                        : 'bg-white/30'
                    }`}
                  />
                ))}
              </motion.div>
            )}

            {/* Content */}
            <div className="h-full flex items-center justify-center p-8">
              <AnimatePresence mode="wait">
                {/* Welcome Screen */}
                {state.currentView === 'welcome' && (
                  <motion.div
                    key="welcome"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="text-center max-w-2xl"
                  >
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="mb-8"
                    >
                      <Sparkles className="w-16 h-16 mx-auto mb-4 text-purple-500" />
                      <h1 className="text-5xl font-bold text-white mb-4">
                        Welcome to Proxima
                      </h1>
                      <p className="text-xl text-gray-300">
                        Your AI-powered health intelligence platform
                      </p>
                    </motion.div>
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.8 }}
                      className="text-gray-400 mb-8"
                    >
                      Explore three powerful ways to understand your health
                    </motion.p>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1.5 }}
                      className="flex items-center justify-center gap-2 text-sm text-gray-500"
                    >
                      <Construction className="w-4 h-4" />
                      <span>AI integration in active development</span>
                    </motion.div>
                  </motion.div>
                )}

                {/* Feature Cards */}
                {state.currentView === 'cards' && (
                  <motion.div
                    key="cards"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="w-full max-w-5xl"
                  >
                    <motion.div
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-center mb-12"
                    >
                      <h2 className="text-3xl font-bold text-white mb-2">
                        Choose Your Experience
                      </h2>
                      <p className="text-gray-400">
                        Click any card to explore • Available features are ready to use
                      </p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {features.map((feature, index) => (
                        <FeatureCard
                          key={feature.id}
                          feature={feature}
                          index={index}
                          isExplored={state.exploredFeatures.includes(feature.id)}
                          onClick={() => exploreFeature(feature.id)}
                        />
                      ))}
                    </div>

                    {state.exploredFeatures.length === 3 && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center mt-12"
                      >
                        <p className="text-green-400 mb-4">
                          🎉 You've explored all features!
                        </p>
                        <button
                          onClick={closeWalkthrough}
                          className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 transition-all"
                        >
                          Get Started
                        </button>
                      </motion.div>
                    )}
                  </motion.div>
                )}

                {/* Feature Demos */}
                {currentFeature && ['quickScan', 'deepDive', 'photoAnalysis'].includes(state.currentView) && (
                  <motion.div
                    key={state.currentView}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="w-full max-w-6xl h-full"
                  >
                    {currentFeature.demo}
                  </motion.div>
                )}

                {/* Closing Screen */}
                {state.currentView === 'closing' && (
                  <motion.div
                    key="closing"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="text-center max-w-2xl"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", delay: 0.2 }}
                      className="mb-8"
                    >
                      <Check className="w-20 h-20 mx-auto text-green-400" />
                    </motion.div>
                    <h2 className="text-4xl font-bold text-white mb-4">
                      You're Ready!
                    </h2>
                    <p className="text-xl text-gray-300 mb-8">
                      Start with Quick Scan today while we perfect the AI features
                    </p>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 }}
                      className="space-y-4"
                    >
                      <button className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 transition-all">
                        Create Free Account
                      </button>
                      <p className="text-sm text-gray-500">
                        Join 500+ early adopters shaping the future of health tech
                      </p>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
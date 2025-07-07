'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { X, Sparkles, ChevronRight } from 'lucide-react'
import { FeatureCard } from './FeatureCard'
import { QuickScanDemo } from './QuickScanDemo'
import { DeepDiveDemo } from './DeepDiveDemo'
import { PhotoAnalysisDemo } from './PhotoAnalysisDemo'

interface DemoState {
  currentView: 'welcome' | 'cards' | 'quickScan' | 'deepDive' | 'photoAnalysis' | 'closing'
  exploredFeatures: string[]
}

export function InteractiveDemo() {
  const router = useRouter()
  const [state, setState] = useState<DemoState>({
    currentView: 'welcome',
    exploredFeatures: []
  })

  useEffect(() => {
    // Save progress
    if (state.exploredFeatures.length > 0) {
      localStorage.setItem('proxima-demo-progress', JSON.stringify({
        exploredFeatures: state.exploredFeatures,
        lastSeen: new Date().toISOString()
      }))
    }
  }, [state.exploredFeatures])

  useEffect(() => {
    // Auto-advance from welcome
    if (state.currentView === 'welcome') {
      const timer = setTimeout(() => {
        setState(prev => ({ ...prev, currentView: 'cards' }))
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [state.currentView])

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

  const exitDemo = () => {
    router.push('/')
  }

  const features = [
    {
      id: 'quickScan',
      title: 'Quick Scan',
      subtitle: 'Instant health insights',
      description: 'Click on your body, get answers in seconds',
      status: 'available' as const,
      icon: '⚡',
      gradient: 'from-blue-500 via-cyan-500 to-teal-500',
      demo: <QuickScanDemo onComplete={backToCards} />
    },
    {
      id: 'deepDive',
      title: 'Deep Dive',
      subtitle: 'Comprehensive analysis',
      description: 'AI-powered follow-up questions for accuracy',
      status: 'beta' as const,
      releaseDate: 'January 2025',
      icon: '🧬',
      gradient: 'from-purple-500 via-pink-500 to-rose-500',
      demo: <DeepDiveDemo onComplete={backToCards} />
    },
    {
      id: 'photoAnalysis',
      title: 'Photo Analysis',
      subtitle: 'Visual symptom tracking',
      description: 'Track changes and healing over time',
      status: 'coming-soon' as const,
      releaseDate: 'Q1 2025',
      icon: '📸',
      gradient: 'from-orange-500 via-red-500 to-pink-500',
      demo: <PhotoAnalysisDemo onComplete={backToCards} />
    }
  ]

  const currentFeature = features.find(f => f.id === state.currentView)

  return (
    <div className="fixed inset-0 bg-black overflow-hidden">
      {/* Background gradient animation */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-blue-900/20" />
        <motion.div
          animate={{
            backgroundPosition: ['0% 0%', '100% 100%'],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            repeatType: 'reverse'
          }}
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: 'radial-gradient(circle at 20% 50%, #3b82f6 0%, transparent 50%), radial-gradient(circle at 80% 80%, #a855f7 0%, transparent 50%)',
            backgroundSize: '100% 100%'
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex items-center justify-between p-6"
        >
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-white">Proxima Demo</h1>
            {state.currentView === 'cards' && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2"
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
          </div>
          
          <button
            onClick={exitDemo}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </motion.header>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            {/* Welcome Screen */}
            {state.currentView === 'welcome' && (
              <motion.div
                key="welcome"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full flex items-center justify-center px-6"
              >
                <div className="text-center max-w-3xl">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 0.2 }}
                    className="mb-8"
                  >
                    <Sparkles className="w-20 h-20 mx-auto text-purple-500" />
                  </motion.div>
                  
                  <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-6xl font-bold text-white mb-6"
                  >
                    Welcome to Proxima
                  </motion.h1>
                  
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="text-2xl text-gray-300 mb-8"
                  >
                    Your AI-powered health intelligence platform
                  </motion.p>
                  
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                    className="text-gray-400"
                  >
                    Explore three powerful ways to understand your health
                  </motion.p>
                  
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.5 }}
                    className="mt-12 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/20 text-amber-400 text-sm"
                  >
                    <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
                    AI integration in active development
                  </motion.div>
                </div>
              </motion.div>
            )}

            {/* Feature Cards */}
            {state.currentView === 'cards' && (
              <motion.div
                key="cards"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full flex flex-col items-center justify-center px-6 py-12"
              >
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center mb-12"
                >
                  <h2 className="text-4xl font-bold text-white mb-4">
                    Choose Your Experience
                  </h2>
                  <p className="text-xl text-gray-400">
                    Click any card to explore • Available features are ready to use
                  </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl w-full">
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
                    className="mt-12 text-center"
                  >
                    <p className="text-green-400 mb-6 text-lg">
                      🎉 You've explored all features!
                    </p>
                    <button
                      onClick={exitDemo}
                      className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium hover:from-purple-600 hover:to-pink-600 transition-all text-lg"
                    >
                      Get Started with Proxima
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
                className="h-full px-6 py-6"
              >
                {currentFeature.demo}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
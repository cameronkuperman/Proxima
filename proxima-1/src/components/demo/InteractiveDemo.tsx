'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { X, Sparkles, Zap, Dna, Camera } from 'lucide-react'
import { FeatureCard } from './FeatureCard'
import { QuickScanDemo } from './QuickScanDemo'
import { DeepDiveDemo } from './DeepDiveDemo'
import { PhotoAnalysisDemo } from './PhotoAnalysisDemo'

interface DemoState {
  currentView: 'welcome' | 'cards' | 'quickScan' | 'deepDive' | 'photoAnalysis' | 'closing'
  exploredFeatures: string[]
  completedFeatures: string[]
}

export function InteractiveDemo() {
  const router = useRouter()
  const [state, setState] = useState<DemoState>({
    currentView: 'welcome',
    exploredFeatures: [],
    completedFeatures: []
  })

  useEffect(() => {
    // Save progress
    if (state.exploredFeatures.length > 0 || state.completedFeatures.length > 0) {
      localStorage.setItem('proxima-demo-progress', JSON.stringify({
        exploredFeatures: state.exploredFeatures,
        completedFeatures: state.completedFeatures,
        lastSeen: new Date().toISOString()
      }))
    }
  }, [state.exploredFeatures, state.completedFeatures])

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

  const completeFeature = (featureId: string) => {
    setState(prev => ({
      ...prev,
      currentView: 'cards',
      completedFeatures: [...new Set([...prev.completedFeatures, featureId])]
    }))
  }

  const backToCards = () => {
    setState(prev => ({ ...prev, currentView: 'cards' }))
  }

  const isFeatureUnlocked = (feature: typeof features[0]) => {
    return feature.prerequisites.every(prereq => state.completedFeatures.includes(prereq))
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
      icon: <Zap className="w-6 h-6" />,
      gradient: 'from-blue-500 via-cyan-500 to-teal-500',
      prerequisites: [] as string[],
      demo: <QuickScanDemo onComplete={() => completeFeature('quickScan')} />
    },
    {
      id: 'deepDive',
      title: 'Deep Dive',
      subtitle: 'Comprehensive analysis',
      description: 'AI-powered follow-up questions for accuracy',
      status: 'beta' as const,
      releaseDate: 'January 2025',
      icon: <Dna className="w-6 h-6" />,
      gradient: 'from-purple-500 via-pink-500 to-rose-500',
      prerequisites: ['quickScan'] as string[],
      demo: <DeepDiveDemo onComplete={() => completeFeature('deepDive')} />
    },
    {
      id: 'photoAnalysis',
      title: 'Photo Analysis',
      subtitle: 'Visual symptom tracking',
      description: 'Track changes and healing over time',
      status: 'coming-soon' as const,
      releaseDate: 'Q1 2025',
      icon: <Camera className="w-6 h-6" />,
      gradient: 'from-orange-500 via-red-500 to-pink-500',
      prerequisites: ['quickScan', 'deepDive'] as string[],
      demo: <PhotoAnalysisDemo onComplete={() => completeFeature('photoAnalysis')} />
    }
  ]

  const currentFeature = features.find(f => f.id === state.currentView)

  return (
    <div className="fixed inset-0 bg-[#0a0a0a] overflow-hidden">
      {/* Background gradient animation - matching main site style */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] via-[#0f0f0f] to-[#0a0a0a]" />
        
        {/* Subtle grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
          }}
        />
        
        {/* Gradient orbs - matching main site style */}
        <motion.div 
          className="absolute top-0 right-0 w-[800px] h-[800px] rounded-full bg-gradient-radial from-purple-500/10 via-purple-500/5 to-transparent blur-3xl"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div 
          className="absolute bottom-0 left-0 w-[600px] h-[600px] rounded-full bg-gradient-radial from-blue-500/10 via-blue-500/5 to-transparent blur-3xl"
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.5, 0.7, 0.5],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col">
        {/* Header - matching main site glassmorphism style */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-gray-800"
        >
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-center justify-between h-16">
              {/* Left side - Logo */}
              <div className="flex items-center">
                <Image src="/widelogoforbanner.png" alt="Proxima" width={200} height={50} priority className="h-10 w-auto" />
              </div>
              
              {/* Center - Demo title and progress */}
              <div className="flex items-center gap-4">
                <h1 className="text-xl font-semibold text-white tracking-tight">Demo Experience</h1>
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
                          state.completedFeatures.includes(feature.id)
                            ? 'bg-green-400'
                            : state.exploredFeatures.includes(feature.id)
                            ? 'bg-white'
                            : 'bg-white/30'
                        }`}
                      />
                    ))}
                  </motion.div>
                )}
              </div>
              
              {/* Right side - Exit actions */}
              <div className="flex items-center gap-4">
                <button
                  onClick={exitDemo}
                  className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
                >
                  Back to Site
                </button>
                <button
                  onClick={exitDemo}
                  className="p-2 text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
          </div>
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
                    transition={{ delay: 0.4, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                    className="text-5xl sm:text-6xl md:text-7xl font-semibold text-white mb-6 tracking-tight"
                  >
                    Welcome to Proxima
                  </motion.h1>
                  
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                    className="text-2xl sm:text-3xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed font-light"
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
                    transition={{ delay: 1.5, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                    className="mt-12 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-900/50 backdrop-blur-sm border border-gray-800 text-gray-400 text-sm"
                  >
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                    </span>
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
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className="h-full flex flex-col items-center justify-center px-6 py-12"
              >
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                  className="text-center mb-12"
                >
                  <h2 className="text-4xl sm:text-5xl font-semibold text-white mb-4 tracking-tight">
                    Choose Your Experience
                  </h2>
                  <p className="text-xl sm:text-2xl text-gray-400 font-light">
                    Complete features in order to unlock the next one
                  </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl w-full">
                  {features.map((feature, index) => {
                    const isUnlocked = isFeatureUnlocked(feature)
                    const isCompleted = state.completedFeatures.includes(feature.id)
                    
                    return (
                      <FeatureCard
                        key={feature.id}
                        feature={feature}
                        index={index}
                        isExplored={state.exploredFeatures.includes(feature.id)}
                        isUnlocked={isUnlocked}
                        isCompleted={isCompleted}
                        onClick={() => isUnlocked && exploreFeature(feature.id)}
                      />
                    )
                  })}
                </div>

                {state.completedFeatures.length === 3 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                    className="mt-12 text-center"
                  >
                    <p className="text-green-400 mb-6 text-lg font-light">
                      🎉 You've explored all features!
                    </p>
                    <motion.button
                      onClick={exitDemo}
                      className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 transition-all duration-200 text-lg"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    >
                      Get Started with Proxima
                    </motion.button>
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
'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, MousePointer, Sparkles, Check, ChevronDown, AlertCircle, Activity, Clock, BedDouble, TrendingUp, Shield, Calendar, Eye, Briefcase, Users, Dumbbell, Brain, FileText, Download, ChevronRight, X, Zap } from 'lucide-react'
import { useQuickScan } from '@/hooks/useQuickScan'
import { useRouter } from 'next/navigation'
import OracleEmbedded from '@/components/OracleEmbedded'

interface QuickScanDemoProps {
  onComplete: () => void
}

interface FormData {
  symptoms: string
  painType: string[]
  painLevel: string
  duration: string
  dailyImpact: string[]
  worseWhen: string
  betterWhen: string
  sleepImpact: string
  // New fields
  frequency: string
  whatTried: string
  didItHelp: string
  associatedSymptoms: string
  triggerEvent: string
}

interface AnalysisResult {
  confidence: number
  primaryCondition: string
  likelihood: string
  symptoms: string[]
  recommendations: string[]
  urgency: 'low' | 'medium' | 'high'
  differentials: { condition: string; probability: number }[]
  redFlags: string[]
  selfCare: string[]
  timeline: string
  followUp: string
  relatedSymptoms: string[]
}

export function QuickScanDemo({ onComplete }: QuickScanDemoProps) {
  const router = useRouter()
  const { performScan, isLoading, error, scanResult, reset } = useQuickScan()
  const [step, setStep] = useState<'intro' | 'interact' | 'form' | 'analyzing' | 'result'>('intro')
  const [selectedBodyPart, setSelectedBodyPart] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [, ] = useState({ x: 50, y: 50 })
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [activeTab, setActiveTab] = useState(0)
  const [showWhy, setShowWhy] = useState(false)
  const [showOraclePanel, setShowOraclePanel] = useState(false)
  const [scanId, setScanId] = useState<string | null>(null)
  const [hadTrigger, setHadTrigger] = useState<boolean | null>(null)
  
  const [formData, setFormData] = useState<FormData>({
    symptoms: '',
    painType: [],
    painLevel: '5',
    duration: '',
    dailyImpact: [],
    worseWhen: '',
    betterWhen: '',
    sleepImpact: '',
    frequency: 'first',
    whatTried: '',
    didItHelp: '',
    associatedSymptoms: '',
    triggerEvent: ''
  })

  // BioDigital configuration - exact URL with all UI elements
  // const bioDigitalUrl = `https://human.biodigital.com/viewer/?id=6F0C&ui-anatomy-descriptions=true&ui-anatomy-pronunciations=true&ui-anatomy-labels=true&ui-audio=true&ui-chapter-list=false&ui-fullscreen=true&ui-help=true&ui-info=true&ui-label-list=true&ui-layers=true&ui-skin-layers=true&ui-loader=circle&ui-media-controls=full&ui-menu=true&ui-nav=true&ui-search=true&ui-tools=true&ui-tutorial=false&ui-undo=true&ui-whiteboard=true&initial.none=true&disable-scroll=false&dk=4a7eb63719c66a365c746afeae476870503ba4be&paid=o_24754ad1`
  

  useEffect(() => {
    if (step === 'intro') {
      setTimeout(() => setStep('interact'), 3000)
    }
  }, [step])

  // Handle iframe load
  const handleIframeLoad = () => {
    // Model loads in background, no need for loading state
  }
  
  // Handle messages from hosted BioDigital
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Accept messages from same origin or trusted sources
      // Remove origin check since iframe is on same domain
      
      if (event.data.type === 'BIODIGITAL_PICK' || event.data.type === 'BIODIGITAL_SELECT') {
        console.log('BioDigital message received in QuickScanDemo:', event.data)
        const data = event.data.data
        setSelectedBodyPart(data.objectName || 'Unknown Body Part')
        setShowForm(true)
      }
    }
    
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.symptoms.trim() || !selectedBodyPart) {
      return
    }
    setShowForm(false)
    setStep('analyzing')
    
    try {
      console.log('Submitting Quick Scan:', { selectedBodyPart, formData })
      const result = await performScan(selectedBodyPart, formData)
      console.log('Quick Scan result:', result)
      setScanId(result.scan_id)
      setStep('result')
    } catch (err) {
      console.error('Quick Scan error:', err)
      // If error, go back to form
      setStep('interact')
      setShowForm(true)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleCheckboxChange = (field: 'painType' | 'dailyImpact', value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(value) 
        ? prev[field].filter(v => v !== value)
        : [...prev[field], value]
    }))
  }

  // Handler functions for new actions
  const handleAskOracle = () => {
    setShowOraclePanel(true)
  }

  const handleGenerateReport = () => {
    // TODO: Implement physician report generation
    console.log('Generating physician report for scan:', scanId)
    alert('Report generation will be implemented soon')
  }

  const handleTrackProgress = () => {
    // Navigate to symptom tracking (requires auth)
    router.push('/dashboard/symptoms')
  }

  // Use the actual analysis result from the API
  const analysisResult: AnalysisResult = scanResult?.analysis || {
    confidence: 0,
    primaryCondition: 'Loading...',
    likelihood: 'Analyzing...',
    symptoms: [],
    recommendations: [],
    urgency: 'low' as const,
    differentials: [],
    redFlags: [],
    selfCare: [],
    timeline: 'Processing...',
    followUp: 'Please wait...',
    relatedSymptoms: []
  }

  // Debug: Log when we have scan results
  useEffect(() => {
    if (scanResult) {
      console.log('Quick Scan Results:', {
        scanId: scanResult.scan_id,
        confidence: scanResult.confidence,
        bodyPart: scanResult.body_part,
        analysis: scanResult.analysis
      })
    }
  }, [scanResult])

  return (
    <>
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
        
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-green-400 to-emerald-400 text-black text-sm font-medium">
          <Check className="w-3 h-3" />
          Available Now
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
                  <div className="w-24 h-24 mx-auto bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                    <Sparkles className="w-12 h-12 text-white" />
                  </div>
                </motion.div>
                <h3 className="text-5xl font-bold text-white mb-4">Quick Scan</h3>
                <p className="text-xl text-gray-300">
                  Click anywhere on the 3D body to report symptoms and get instant insights
                </p>
              </div>
            </motion.div>
          )}

          {/* Interactive Demo */}
          {(step === 'interact' || step === 'form') && (
            <motion.div
              key="interact"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full flex gap-8"
            >
              {/* Instructions */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="w-96 space-y-6"
              >
                <div>
                  <h4 className="text-2xl font-semibold text-white mb-3">Try it yourself!</h4>
                  <p className="text-gray-400 text-lg">Click on any part of the body to see how Quick Scan works.</p>
                </div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="p-6 rounded-2xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <MousePointer className="w-6 h-6 text-blue-400" />
                    <span className="text-white font-medium text-lg">Pro tip</span>
                  </div>
                  <p className="text-gray-300">
                    Click anywhere on the 3D model to select a body region for analysis.
                  </p>
                </motion.div>

                {selectedBodyPart && (
                  <motion.div
                    key={selectedBodyPart}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-6 rounded-2xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20"
                  >
                    <p className="text-green-400">
                      Selected: <span className="font-semibold text-white">{selectedBodyPart}</span>
                    </p>
                  </motion.div>
                )}
              </motion.div>

              {/* 3D Model */}
              <div className="flex-1 relative rounded-3xl overflow-hidden bg-gray-900/50 border border-white/10">
                
                <iframe
                  id="biodigital-iframe"
                  ref={iframeRef}
                  src="/biodigital-viewer.html?gender=male"
                  className="w-full h-full"
                  style={{ border: 'none', pointerEvents: showForm ? 'none' : 'auto' }}
                  allow="autoplay; fullscreen; vr"
                  allowFullScreen
                  onLoad={handleIframeLoad}
                />
                

                {/* Form Modal */}
                <AnimatePresence>
                  {showForm && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 lg:p-8 z-50"
                      onClick={() => setShowForm(false)}
                    >
                      <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        transition={{ type: "spring", damping: 20, stiffness: 260 }}
                        className="bg-gradient-to-br from-gray-900/95 via-gray-900/95 to-gray-800/95 backdrop-blur-xl rounded-2xl p-5 sm:p-6 max-w-3xl w-full border border-gray-600/30 shadow-2xl max-h-[92vh] overflow-hidden flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {/* Header */}
                        <div className="flex items-start justify-between mb-5">
                          <div>
                            <h4 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-2">
                              Tell us about your <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">{selectedBodyPart}</span> symptoms
                            </h4>
                            <p className="text-gray-400 text-sm">Help us understand what you&apos;re experiencing</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowForm(false)}
                            className="p-2 rounded-lg hover:bg-gray-800/50 transition-all group"
                          >
                            <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-300 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                        
                        <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto space-y-4 pr-2">
                          {/* Primary symptom description - Required */}
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              What's bothering you? <span className="text-red-400">*</span>
                            </label>
                            <textarea
                              name="symptoms"
                              value={formData.symptoms}
                              onChange={handleInputChange}
                              placeholder="Describe what you're feeling..."
                              required
                              rows={3}
                              className="w-full px-4 py-3 rounded-xl bg-gray-800/50 text-white border border-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none resize-none transition-all placeholder-gray-500"
                            />
                          </div>

                          {/* Pain descriptors */}
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              How would you describe the pain?
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                              {['Sharp', 'Dull', 'Throbbing', 'Burning', 'Stabbing', 'Aching'].map((type) => (
                                <label key={type} className="relative">
                                  <input
                                    type="checkbox"
                                    checked={formData.painType.includes(type.toLowerCase())}
                                    onChange={() => handleCheckboxChange('painType', type.toLowerCase())}
                                    className="peer sr-only"
                                  />
                                  <div className="flex items-center justify-center p-3 rounded-lg bg-gray-800/30 border border-gray-700 hover:bg-gray-800/50 cursor-pointer transition-all peer-checked:bg-blue-500/20 peer-checked:border-blue-500 peer-checked:text-blue-400">
                                    <span className="text-sm font-medium">{type}</span>
                                  </div>
                                </label>
                              ))}
                            </div>
                          </div>

                          {/* Pain level */}
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              Pain intensity (1-10)
                            </label>
                            <div className="flex items-center gap-4">
                              <input
                                type="range"
                                name="painLevel"
                                min="1"
                                max="10"
                                value={formData.painLevel}
                                onChange={handleInputChange}
                                className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
                              />
                              <span className="text-2xl font-bold text-blue-400 w-12 text-center">{formData.painLevel}</span>
                            </div>
                            <div className="flex justify-between text-xs text-gray-500 mt-1 px-1">
                              <span>Mild</span>
                              <span>Moderate</span>
                              <span>Severe</span>
                            </div>
                          </div>

                          {/* Duration */}
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              How long has this been going on?
                            </label>
                            <select
                              name="duration"
                              value={formData.duration}
                              onChange={handleInputChange}
                              className="w-full px-4 py-3 rounded-xl bg-gray-800/50 text-white border border-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all appearance-none"
                            >
                              <option value="">Select duration</option>
                              <option value="hours">Just started (hours)</option>
                              <option value="today">Since today</option>
                              <option value="days">A few days</option>
                              <option value="week">About a week</option>
                              <option value="weeks">Several weeks</option>
                              <option value="months">More than a month</option>
                            </select>
                          </div>

                          {/* Daily impact */}
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              How is this affecting your daily life?
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                              {[
                                { id: 'work', label: 'Work/Study', icon: Briefcase },
                                { id: 'sleep', label: 'Sleep', icon: BedDouble },
                                { id: 'exercise', label: 'Exercise', icon: Dumbbell },
                                { id: 'social', label: 'Social life', icon: Users }
                              ].map((impact) => (
                                <label key={impact.id} className="relative">
                                  <input
                                    type="checkbox"
                                    checked={formData.dailyImpact.includes(impact.id)}
                                    onChange={() => handleCheckboxChange('dailyImpact', impact.id)}
                                    className="peer sr-only"
                                  />
                                  <div className="flex items-center gap-2 p-3 rounded-lg bg-gray-800/30 border border-gray-700 hover:bg-gray-800/50 cursor-pointer transition-all peer-checked:bg-blue-500/20 peer-checked:border-blue-500 peer-checked:text-blue-400">
                                    <impact.icon className="w-4 h-4" />
                                    <span className="text-sm font-medium">{impact.label}</span>
                                  </div>
                                </label>
                              ))}
                            </div>
                          </div>

                          {/* How did it start */}
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-3">
                              <div className="flex items-center gap-2">
                                <Zap className="w-4 h-4 text-amber-400" />
                                <span>Was there something specific that triggered this?</span>
                              </div>
                            </label>
                            <div className="space-y-3">
                              <div className="flex gap-3">
                                <button
                                  type="button"
                                  onClick={() => setHadTrigger(true)}
                                  className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${
                                    hadTrigger === true
                                      ? 'bg-blue-500/20 border-2 border-blue-500 text-blue-400'
                                      : 'bg-gray-800/50 border-2 border-gray-700 text-gray-300 hover:border-gray-600'
                                  }`}
                                >
                                  Yes, I remember
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setHadTrigger(false)
                                    setFormData(prev => ({ ...prev, triggerEvent: '' }))
                                  }}
                                  className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${
                                    hadTrigger === false
                                      ? 'bg-blue-500/20 border-2 border-blue-500 text-blue-400'
                                      : 'bg-gray-800/50 border-2 border-gray-700 text-gray-300 hover:border-gray-600'
                                  }`}
                                >
                                  No / Not sure
                                </button>
                              </div>
                              
                              <AnimatePresence>
                                {hadTrigger === true && (
                                  <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.2 }}
                                  >
                                    <textarea
                                      name="triggerEvent"
                                      value={formData.triggerEvent}
                                      onChange={handleInputChange}
                                      placeholder="What happened? (e.g., 'Lifted a heavy box', 'Slept in an awkward position', 'After eating certain food'...)"
                                      rows={2}
                                      className="w-full px-4 py-3 rounded-xl bg-gray-800/50 text-white border border-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none resize-none transition-all placeholder-gray-500"
                                    />
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          </div>

                          {/* Advanced questions toggle */}
                          <button
                            type="button"
                            onClick={() => setShowAdvanced(!showAdvanced)}
                            className="w-full flex items-center justify-center gap-2 py-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                          >
                            <ChevronDown className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
                            {showAdvanced ? 'Hide' : 'Show'} additional questions
                          </button>

                          {/* Advanced questions */}
                          <AnimatePresence>
                            {showAdvanced && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="space-y-4 overflow-hidden"
                              >
                                {/* What makes it worse */}
                                <div>
                                  <label className="block text-sm font-medium text-gray-300 mb-2">
                                    What makes it worse?
                                  </label>
                                  <input
                                    type="text"
                                    name="worseWhen"
                                    value={formData.worseWhen}
                                    onChange={handleInputChange}
                                    placeholder="e.g., Movement, sitting, cold weather..."
                                    className="w-full px-4 py-3 rounded-xl bg-gray-800/50 text-white border border-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all placeholder-gray-500"
                                  />
                                </div>

                                {/* What makes it better */}
                                <div>
                                  <label className="block text-sm font-medium text-gray-300 mb-2">
                                    What makes it better?
                                  </label>
                                  <input
                                    type="text"
                                    name="betterWhen"
                                    value={formData.betterWhen}
                                    onChange={handleInputChange}
                                    placeholder="e.g., Rest, heat, stretching..."
                                    className="w-full px-4 py-3 rounded-xl bg-gray-800/50 text-white border border-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all placeholder-gray-500"
                                  />
                                </div>

                                {/* Sleep impact */}
                                <div>
                                  <label className="block text-sm font-medium text-gray-300 mb-2">
                                    How is your sleep affected?
                                  </label>
                                  <select
                                    name="sleepImpact"
                                    value={formData.sleepImpact}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 rounded-xl bg-gray-800/50 text-white border border-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all appearance-none"
                                  >
                                    <option value="">Select sleep impact</option>
                                    <option value="none">Not affected</option>
                                    <option value="falling">Hard to fall asleep</option>
                                    <option value="waking">Wake up due to pain</option>
                                    <option value="both">Both falling asleep and waking up</option>
                                    <option value="position">Can't find comfortable position</option>
                                  </select>
                                </div>

                                {/* Previous episodes */}
                                <div>
                                  <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Have you experienced this before?
                                  </label>
                                  <select
                                    name="frequency"
                                    value={formData.frequency}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 rounded-xl bg-gray-800/50 text-white border border-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all appearance-none"
                                  >
                                    <option value="first">This is the first time</option>
                                    <option value="rarely">Rarely (few times a year)</option>
                                    <option value="sometimes">Sometimes (monthly)</option>
                                    <option value="often">Often (weekly)</option>
                                    <option value="veryOften">Very often (daily)</option>
                                    <option value="constant">Constantly</option>
                                  </select>
                                </div>

                                {/* What have you tried */}
                                <div>
                                  <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Have you tried anything for this?
                                  </label>
                                  <div className="space-y-3">
                                    <textarea
                                      name="whatTried"
                                      value={formData.whatTried}
                                      onChange={handleInputChange}
                                      placeholder="What did you try? (e.g., rest, ice, medication...)"
                                      rows={2}
                                      className="w-full px-4 py-3 rounded-xl bg-gray-800/50 text-white border border-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none resize-none transition-all placeholder-gray-500"
                                    />
                                    <textarea
                                      name="didItHelp"
                                      value={formData.didItHelp}
                                      onChange={handleInputChange}
                                      placeholder="Did it help? How?"
                                      rows={2}
                                      className="w-full px-4 py-3 rounded-xl bg-gray-800/50 text-white border border-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none resize-none transition-all placeholder-gray-500"
                                    />
                                  </div>
                                </div>

                                {/* Associated symptoms */}
                                <div>
                                  <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Any other symptoms elsewhere in your body?
                                  </label>
                                  <input
                                    type="text"
                                    name="associatedSymptoms"
                                    value={formData.associatedSymptoms}
                                    onChange={handleInputChange}
                                    placeholder="e.g., Fatigue, fever, other areas affected..."
                                    className="w-full px-4 py-3 rounded-xl bg-gray-800/50 text-white border border-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all placeholder-gray-500"
                                  />
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>

                        </form>
                        
                        {/* Fixed bottom buttons */}
                        <div className="flex gap-3 pt-4 mt-4 border-t border-gray-700/50">
                          <button
                            type="button"
                            onClick={() => setShowForm(false)}
                            className="flex-1 px-5 py-3 rounded-xl bg-gray-800/50 text-gray-300 hover:bg-gray-800 transition-all font-medium border border-gray-700/50 hover:border-gray-600/50"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            onClick={handleFormSubmit}
                            className="flex-1 px-5 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30"
                            disabled={!formData.symptoms.trim()}
                          >
                            Analyze Symptoms
                          </button>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {/* Analyzing */}
          {step === 'analyzing' && (
            <motion.div
              key="analyzing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <div className="text-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="w-24 h-24 mx-auto mb-8 border-4 border-blue-500 border-t-transparent rounded-full"
                />
                <h3 className="text-3xl font-bold text-white mb-4">Analyzing your symptoms...</h3>
                <p className="text-gray-400">Our AI is processing your information</p>
              </div>
            </motion.div>
          )}

          {/* Result */}
          {step === 'result' && scanResult && (
            <motion.div
              key="result"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-4xl mx-auto"
            >
              <div className="space-y-6">
                {/* Main Analysis Card with Tabbed Interface */}
                <div className="bg-gray-900/50 rounded-3xl border border-white/10 overflow-hidden">
                  {/* Header with dynamic confidence coloring */}
                  <div className={`p-8 border-b border-white/10 bg-gradient-to-r ${
                    scanResult.confidence > 85 ? 'from-green-500/20 to-emerald-500/20' :
                    scanResult.confidence > 70 ? 'from-blue-500/20 to-cyan-500/20' :
                    'from-amber-500/20 to-orange-500/20'
                  }`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-3xl font-bold text-white mb-2">Your Health Analysis</h3>
                        <p className="text-gray-300">Analysis for {selectedBodyPart.toLowerCase()} symptoms</p>
                      </div>
                      <div className="text-right">
                        <div className="text-4xl font-bold text-white mb-1">{scanResult.confidence}%</div>
                        <div className="text-sm text-gray-400">Confidence</div>
                        {scanResult.confidence < 70 && (
                          <div className="mt-2 text-xs text-amber-400">Consider Oracle consultation</div>
                        )}
                      </div>
                    </div>
                    {/* Doctor report button in header */}
                    <div className="absolute top-8 right-8">
                      <button
                        onClick={handleGenerateReport}
                        className="text-sm text-gray-400 hover:text-gray-300 flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Doctor Report
                      </button>
                    </div>
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
                          <h3 className="text-3xl font-bold text-white mb-3">{analysisResult.primaryCondition}</h3>
                          <p className="text-gray-300 mb-3">{analysisResult.likelihood}</p>
                          
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
                                  Based on your symptoms of {formData.symptoms} in the {selectedBodyPart} area, 
                                  along with the {formData.painType.join(', ')} pain pattern and {formData.duration} duration, 
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
                            {analysisResult.differentials.map((diff, index) => (
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
                        {/* Immediate actions */}
                        <div className="mb-8">
                          <h4 className="text-lg font-semibold text-gray-400 mb-4">Immediate Actions</h4>
                          <div className="space-y-3">
                            {analysisResult.recommendations.slice(0, 3).map((rec, index) => (
                              <div key={index} className="flex items-start gap-4 p-4 bg-gray-800/30 rounded-lg">
                                <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                                  <span className="text-green-400 font-bold">{index + 1}</span>
                                </div>
                                <p className="text-gray-300">{rec}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Self-care */}
                        <div className="mb-8">
                          <h4 className="text-lg font-semibold text-gray-400 mb-4">Self-Care Guidelines</h4>
                          <div className="grid gap-3">
                            {analysisResult.selfCare.map((care, index) => (
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
                          <p className="text-gray-300">{analysisResult.timeline}</p>
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
                              {analysisResult.redFlags.map((flag, index) => (
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
                            {analysisResult.relatedSymptoms.map((symptom, index) => (
                              <div key={index} className="flex items-start gap-3 p-3 bg-gray-800/30 rounded-lg">
                                <Eye className="w-5 h-5 text-amber-400 mt-0.5" />
                                <span className="text-gray-300">{symptom}</span>
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
                    {scanResult.confidence < 70 && (
                      <div className="flex items-center gap-2 text-sm text-amber-400">
                        <AlertCircle className="w-4 h-4" />
                        <span>Low confidence - consider deeper analysis</span>
                      </div>
                    )}
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 mb-6">
                    <button 
                      onClick={handleGenerateReport}
                      className="px-6 py-4 rounded-xl bg-gray-800 hover:bg-gray-700 transition-all flex items-center justify-center gap-3 group"
                    >
                      <FileText className="w-5 h-5 text-gray-400 group-hover:text-gray-300" />
                      <div className="text-left">
                        <div className="font-medium text-white">Generate Detailed Report</div>
                        <div className="text-xs text-gray-400">For your doctor visit</div>
                      </div>
                    </button>
                    
                    <button 
                      onClick={handleTrackProgress}
                      className="px-6 py-4 rounded-xl bg-gray-800 hover:bg-gray-700 transition-all flex items-center justify-center gap-3 group"
                    >
                      <TrendingUp className="w-5 h-5 text-gray-400 group-hover:text-gray-300" />
                      <div className="text-left">
                        <div className="font-medium text-white">Track Over Time</div>
                        <div className="text-xs text-gray-400">Monitor symptom changes</div>
                      </div>
                    </button>
                  </div>

                  {/* Subtle Oracle prompt based on confidence or complexity */}
                  <div className={`p-4 rounded-xl transition-all ${
                    scanResult.confidence < 70 
                      ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30' 
                      : 'bg-gray-800/50 border border-gray-700'
                  }`}>
                    <button
                      onClick={handleAskOracle}
                      className="w-full flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-3">
                        <Brain className={`w-5 h-5 ${
                          scanResult.confidence < 70 ? 'text-purple-400' : 'text-gray-400'
                        }`} />
                        <div className="text-left">
                          <div className="font-medium text-white">
                            {scanResult.confidence < 70 
                              ? 'Get a deeper analysis with Oracle AI' 
                              : 'Have questions? Ask Oracle AI'}
                          </div>
                          <div className="text-xs text-gray-400">
                            Advanced reasoning for complex symptoms
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-300 transition-transform group-hover:translate-x-1" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Complete Demo */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mt-8 text-center"
              >
                <button
                  onClick={onComplete}
                  className="px-8 py-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium hover:from-purple-600 hover:to-pink-600 transition-all text-lg"
                >
                  Explore More Features
                </button>
                <p className="text-sm text-gray-500 mt-3">
                  Full AI analysis available soon
                </p>
              </motion.div>
            </motion.div>
          )}

          {/* Error display */}
          {error && step === 'interact' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-2xl mx-auto mt-4"
            >
              <div className="p-4 rounded-xl bg-red-500/20 border border-red-500/50 text-red-300">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-5 h-5" />
                  <span className="font-medium">Analysis Error</span>
                </div>
                <p className="text-sm">{error}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>

    {/* Oracle slide-in panel */}
      <AnimatePresence>
        {showOraclePanel && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setShowOraclePanel(false)}
            />
          
          {/* Oracle panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed inset-y-0 right-0 w-full max-w-lg bg-gray-900 shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-800">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">Oracle Deep Analysis</h3>
                <button
                  onClick={() => setShowOraclePanel(false)}
                  className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-sm text-gray-400 mt-1">
                Continuing from your Quick Scan results...
              </p>
            </div>

            {/* Oracle chat embedded */}
            <div className="flex-1 overflow-hidden bg-gray-950">
              {scanResult ? (
                <OracleEmbedded
                  quickScanContext={{
                    scanId: scanId,
                    bodyPart: selectedBodyPart,
                    analysis: analysisResult,
                    confidence: scanResult.confidence
                  }}
                  onClose={() => setShowOraclePanel(false)}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <p>Complete a Quick Scan first</p>
                </div>
              )}
            </div>
          </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
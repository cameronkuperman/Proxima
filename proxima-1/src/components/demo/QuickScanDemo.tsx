'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, MousePointer, Sparkles, Check, ChevronDown, AlertCircle, Activity, Clock, BedDouble, TrendingUp, Shield, Calendar, Eye, Briefcase, Users, Dumbbell } from 'lucide-react'

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
  const [step, setStep] = useState<'intro' | 'interact' | 'form' | 'analyzing' | 'result'>('intro')
  const [selectedBodyPart, setSelectedBodyPart] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [isModelReady, setIsModelReady] = useState(false)
  const [clickPosition, setClickPosition] = useState({ x: 50, y: 50 })
  const iframeRef = useRef<HTMLIFrameElement>(null)
  
  const [formData, setFormData] = useState<FormData>({
    symptoms: '',
    painType: [],
    painLevel: '5',
    duration: '',
    dailyImpact: [],
    worseWhen: '',
    betterWhen: '',
    sleepImpact: ''
  })

  // BioDigital configuration - exact URL with all UI elements
  const bioDigitalUrl = `https://human.biodigital.com/viewer/?id=6F0C&ui-anatomy-descriptions=true&ui-anatomy-pronunciations=true&ui-anatomy-labels=true&ui-audio=true&ui-chapter-list=false&ui-fullscreen=true&ui-help=true&ui-info=true&ui-label-list=true&ui-layers=true&ui-skin-layers=true&ui-loader=circle&ui-media-controls=full&ui-menu=true&ui-nav=true&ui-search=true&ui-tools=true&ui-tutorial=false&ui-undo=true&ui-whiteboard=true&initial.none=true&disable-scroll=false&dk=4a7eb63719c66a365c746afeae476870503ba4be&paid=o_24754ad1`
  
  // Debug logging state
  const [debugLogs, setDebugLogs] = useState<string[]>([])
  
  const addDebugLog = (message: string) => {
    console.log(message)
    setDebugLogs(prev => [...prev, `[${new Date().toISOString().substr(11, 8)}] ${message}`])
  }

  useEffect(() => {
    if (step === 'intro') {
      setTimeout(() => setStep('interact'), 3000)
    }
  }, [step])

  // Handle iframe load
  const handleIframeLoad = () => {
    addDebugLog('🔄 BioDigital iframe loaded')
    
    // Wait for BioDigital to fully load
    setTimeout(() => {
      addDebugLog('✅ BioDigital model ready')
      setIsModelReady(true)
    }, 3000)
  }
  
  // Handle messages from hosted BioDigital
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'BIODIGITAL_PICK' || event.data.type === 'BIODIGITAL_SELECT') {
        const data = event.data.data
        addDebugLog(`🎯 BODY PART SELECTED: ${data.objectName}`)
        addDebugLog(`Description: ${data.description || 'No description available'}`)
        setSelectedBodyPart(data.objectName || 'Unknown Body Part')
        setShowForm(true)
      }
    }
    
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.symptoms.trim()) {
      return
    }
    setShowForm(false)
    setStep('analyzing')
    
    // Simulate analysis
    setTimeout(() => {
      setStep('result')
    }, 3000)
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

  // Mock analysis result based on selected body part
  const analysisResult: AnalysisResult = {
    confidence: 82,
    primaryCondition: selectedBodyPart === 'Head' ? 'Tension Headache' : 
                     selectedBodyPart === 'Neck/Shoulders' ? 'Muscle Strain' :
                     selectedBodyPart === 'Chest/Arms' ? 'Musculoskeletal Pain' :
                     selectedBodyPart === 'Abdomen/Lower Back' ? 'Lumbar Strain' :
                     selectedBodyPart === 'Hips/Thighs' ? 'Hip Flexor Strain' :
                     'General Muscle Discomfort',
    likelihood: 'High',
    symptoms: [
      formData.painType.includes('sharp') ? 'Sharp, localized pain' : 'Dull, aching pain',
      `Pain level ${formData.painLevel}/10`,
      formData.dailyImpact.includes('work') ? 'Affecting work performance' : 'Limited daily activities',
      formData.sleepImpact ? 'Sleep disturbance' : 'No sleep issues'
    ],
    recommendations: [
      'Schedule appointment with primary care physician within 3-5 days',
      'Apply ice for 15-20 minutes every 2-3 hours for first 48 hours',
      'Over-the-counter pain relief: Ibuprofen 400mg every 6 hours with food',
      'Gentle stretching exercises - avoid activities that worsen pain',
      'Monitor symptoms - seek immediate care if worsening'
    ],
    urgency: parseInt(formData.painLevel) > 7 ? 'high' : 
             parseInt(formData.painLevel) > 4 ? 'medium' : 'low',
    differentials: [
      { condition: 'Inflammation', probability: 15 },
      { condition: 'Nerve Involvement', probability: 8 },
      { condition: 'Referred Pain', probability: 5 }
    ],
    redFlags: [
      'Sudden severe pain with no clear cause',
      'Numbness or tingling spreading to other areas',
      'Loss of bladder/bowel control',
      'Fever above 101°F with pain',
      'Progressive weakness'
    ],
    selfCare: [
      'Rest in comfortable position',
      'Stay hydrated - aim for 8 glasses of water daily',
      'Practice stress reduction techniques',
      'Maintain good posture',
      'Use ergonomic supports if needed'
    ],
    timeline: formData.duration === 'hours' ? 'Acute onset - monitor closely for 24-48 hours' :
              formData.duration === 'days' ? 'Sub-acute - improvement expected within 1-2 weeks' :
              'Chronic pattern - comprehensive evaluation recommended',
    followUp: 'If no improvement in 3-5 days or worsening at any time',
    relatedSymptoms: [
      'Watch for: fever, rash, swelling, or color changes',
      'Note any new symptoms or pain spreading',
      'Track pain patterns throughout the day'
    ]
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
                
                {/* Debug logs panel */}
                <div className="mt-4 p-4 rounded-xl bg-gray-900/50 border border-gray-800 max-h-64 overflow-y-auto">
                  <h5 className="text-sm font-medium text-gray-400 mb-2">Debug Logs:</h5>
                  <div className="space-y-1 font-mono text-xs">
                    {debugLogs.slice(-10).map((log, i) => (
                      <div key={i} className={`text-gray-300 ${log.includes('❌') ? 'text-red-400' : log.includes('✅') ? 'text-green-400' : ''}`}>
                        {log}
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* 3D Model */}
              <div className="flex-1 relative rounded-3xl overflow-hidden bg-gray-900/50 border border-white/10">
                
                <iframe
                  id="biodigital-iframe"
                  ref={iframeRef}
                  src="/biodigital-viewer.html"
                  className="w-full h-full"
                  style={{ border: 'none', pointerEvents: showForm ? 'none' : 'auto' }}
                  allow="autoplay; fullscreen; vr"
                  allowFullScreen
                  onLoad={handleIframeLoad}
                />
                
                {/* Loading overlay */}
                {!isModelReady && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 flex items-center justify-center bg-black/50 pointer-events-none"
                  >
                    <div className="text-center">
                      <div className="w-16 h-16 mx-auto mb-4 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      <p className="text-white text-lg">Loading 3D model...</p>
                    </div>
                  </motion.div>
                )}

                {/* Form Modal */}
                <AnimatePresence>
                  {showForm && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 lg:p-8 z-20"
                      onClick={() => setShowForm(false)}
                    >
                      <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 rounded-2xl p-6 sm:p-8 max-w-4xl w-full border border-gray-700/50 shadow-2xl max-h-[85vh] overflow-hidden flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {/* Header */}
                        <div className="flex items-start justify-between mb-6">
                          <div>
                            <h4 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                              Tell us about your <span className="text-blue-400">{selectedBodyPart}</span> symptoms
                            </h4>
                            <p className="text-gray-400 text-sm">Help us understand what you're experiencing</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowForm(false)}
                            className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
                          >
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                              </motion.div>
                            )}
                          </AnimatePresence>

                        </form>
                        
                        {/* Fixed bottom buttons */}
                        <div className="flex gap-3 pt-6 mt-6 border-t border-gray-700/50">
                          <button
                            type="button"
                            onClick={() => setShowForm(false)}
                            className="flex-1 px-5 py-3 rounded-xl bg-gray-800/50 text-gray-300 hover:bg-gray-800 transition-all font-medium"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            onClick={handleFormSubmit}
                            className="flex-1 px-5 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/25"
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
          {step === 'result' && (
            <motion.div
              key="result"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-4xl mx-auto"
            >
              <div className="space-y-6">
                {/* Main Analysis Card */}
                <div className="bg-gray-900/50 rounded-3xl border border-white/10 overflow-hidden">
                  {/* Header with Urgency */}
                  <div className={`p-8 border-b border-white/10 bg-gradient-to-r ${
                    analysisResult.urgency === 'high' ? 'from-red-500/20 to-red-600/20' :
                    analysisResult.urgency === 'medium' ? 'from-amber-500/20 to-orange-500/20' :
                    'from-green-500/20 to-emerald-500/20'
                  }`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-3xl font-bold text-white mb-2">AI Health Analysis Complete</h3>
                        <p className="text-gray-300">Analysis for {selectedBodyPart.toLowerCase()} symptoms</p>
                      </div>
                      <div className={`px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 ${
                        analysisResult.urgency === 'high' ? 'bg-red-500/30 text-red-400 border border-red-500/50' :
                        analysisResult.urgency === 'medium' ? 'bg-amber-500/30 text-amber-400 border border-amber-500/50' :
                        'bg-green-500/30 text-green-400 border border-green-500/50'
                      }`}>
                        <Shield className="w-4 h-4" />
                        {analysisResult.urgency === 'high' ? 'Urgent Care Advised' :
                         analysisResult.urgency === 'medium' ? 'Medical Attention Recommended' :
                         'Self-Care Appropriate'}
                      </div>
                    </div>
                  </div>

                  {/* Primary Diagnosis with Confidence */}
                  <div className="p-8 bg-gradient-to-br from-blue-500/5 to-cyan-500/5">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h4 className="text-sm font-medium text-gray-400 mb-2">PRIMARY DIAGNOSIS</h4>
                        <h3 className="text-3xl font-bold text-white">{analysisResult.primaryCondition}</h3>
                      </div>
                      <div className="text-right">
                        <div className="text-4xl font-bold text-white mb-1">{analysisResult.confidence}%</div>
                        <div className="text-sm text-gray-400">Confidence</div>
                      </div>
                    </div>
                    <div className="w-full h-4 bg-gray-800 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${analysisResult.confidence}%` }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        className="h-full bg-gradient-to-r from-blue-500 to-cyan-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Key Information Grid */}
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Symptoms & Timeline */}
                  <div className="bg-gray-900/50 rounded-2xl border border-white/10 p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                        <Activity className="w-5 h-5 text-blue-400" />
                      </div>
                      <h4 className="text-lg font-semibold text-white">Symptoms & Timeline</h4>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-gray-400 mb-2">Identified Symptoms:</p>
                        <ul className="space-y-1">
                          {analysisResult.symptoms.map((symptom, index) => (
                            <li key={index} className="flex items-center gap-2 text-gray-300 text-sm">
                              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                              {symptom}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="pt-3 border-t border-gray-800">
                        <p className="text-sm text-gray-400 mb-1">Expected Timeline:</p>
                        <p className="text-gray-300">{analysisResult.timeline}</p>
                      </div>
                    </div>
                  </div>

                  {/* Differential Diagnosis */}
                  <div className="bg-gray-900/50 rounded-2xl border border-white/10 p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-purple-400" />
                      </div>
                      <h4 className="text-lg font-semibold text-white">Other Possibilities</h4>
                    </div>
                    <div className="space-y-3">
                      {analysisResult.differentials.map((diff, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-gray-300">{diff.condition}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-2 bg-gray-800 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-purple-500/50"
                                style={{ width: `${diff.probability}%` }}
                              />
                            </div>
                            <span className="text-sm text-gray-500 w-10 text-right">{diff.probability}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Red Flags Warning */}
                <div className="bg-red-500/10 rounded-2xl border border-red-500/30 p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center flex-shrink-0">
                      <AlertCircle className="w-5 h-5 text-red-400" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-white mb-3">Seek Immediate Care If You Experience:</h4>
                      <div className="grid md:grid-cols-2 gap-2">
                        {analysisResult.redFlags.map((flag, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-red-400 rounded-full" />
                            <span className="text-gray-300 text-sm">{flag}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Treatment & Care Plan */}
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Immediate Actions */}
                  <div className="bg-gray-900/50 rounded-2xl border border-white/10 p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                        <Check className="w-5 h-5 text-green-400" />
                      </div>
                      <h4 className="text-lg font-semibold text-white">Immediate Actions</h4>
                    </div>
                    <ul className="space-y-3">
                      {analysisResult.recommendations.slice(0, 3).map((rec, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <span className="text-green-400 font-medium mt-0.5">{index + 1}.</span>
                          <span className="text-gray-300 text-sm">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Self-Care Tips */}
                  <div className="bg-gray-900/50 rounded-2xl border border-white/10 p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-cyan-400" />
                      </div>
                      <h4 className="text-lg font-semibold text-white">Self-Care Guidelines</h4>
                    </div>
                    <ul className="space-y-2">
                      {analysisResult.selfCare.map((care, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full mt-1.5" />
                          <span className="text-gray-300 text-sm">{care}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Follow-up & Monitoring */}
                <div className="bg-gray-900/50 rounded-2xl border border-white/10 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-amber-400" />
                    </div>
                    <h4 className="text-lg font-semibold text-white">Follow-up & Monitoring</h4>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-400 mb-1">When to follow up:</p>
                      <p className="text-gray-300">{analysisResult.followUp}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400 mb-2">Monitor for these changes:</p>
                      <ul className="space-y-1">
                        {analysisResult.relatedSymptoms.map((symptom, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <Eye className="w-4 h-4 text-amber-400 mt-0.5" />
                            <span className="text-gray-300 text-sm">{symptom}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="bg-gray-900/50 rounded-2xl border border-white/10 p-6">
                  <div className="grid md:grid-cols-3 gap-4">
                    <button className="px-6 py-3 rounded-xl bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors font-medium">
                      📥 Download Report
                    </button>
                    <button className="px-6 py-3 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/50 hover:bg-blue-500/30 transition-colors font-medium">
                      📅 Schedule Follow-up
                    </button>
                    <button className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:from-blue-600 hover:to-cyan-600 transition-all font-medium">
                      🥼 Find Nearby Doctors
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
        </AnimatePresence>
      </div>
    </div>
  )
}
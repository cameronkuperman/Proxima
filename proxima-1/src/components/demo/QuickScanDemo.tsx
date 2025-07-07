'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, MousePointer, Sparkles, Check, Construction, ChevronDown, AlertCircle, Activity, Clock, BedDouble, TrendingUp, Shield, Calendar, Eye } from 'lucide-react'

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

  // BioDigital configuration
  const bioDigitalUrl = 'https://human.biodigital.com/viewer/?id=6CBo&ui-anatomy-descriptions=true&ui-anatomy-pronunciations=true&ui-anatomy-labels=true&ui-audio=false&ui-chapter-list=false&ui-fullscreen=false&ui-help=false&ui-info=false&ui-label-list=true&ui-layers=false&ui-skin-layers=false&ui-loader=circle&ui-media-controls=none&ui-menu=false&ui-nav=false&ui-search=false&ui-tools=false&ui-tutorial=false&ui-undo=false&ui-whiteboard=false&initial.none=true&disable-scroll=false&load-rotate=10&uaid=M4iCG&paid=o_159040f0'

  // Body region mapping based on click position
  const getBodyPartFromPosition = (x: number, y: number, width: number, height: number): string => {
    // Convert to percentage
    const xPercent = (x / width) * 100
    const yPercent = (y / height) * 100
    
    // Map regions based on typical human body proportions
    if (yPercent < 15) {
      return 'Head'
    } else if (yPercent < 20) {
      return 'Neck'
    } else if (yPercent < 35) {
      if (xPercent < 20 || xPercent > 80) {
        return 'Shoulder'
      }
      return 'Chest'
    } else if (yPercent < 45) {
      if (xPercent < 25 || xPercent > 75) {
        return 'Arm'
      }
      return 'Abdomen'
    } else if (yPercent < 55) {
      if (xPercent < 30 || xPercent > 70) {
        return 'Hand'
      }
      return 'Lower Back'
    } else if (yPercent < 65) {
      return 'Hip'
    } else if (yPercent < 80) {
      return 'Knee'
    } else {
      return 'Foot'
    }
  }

  useEffect(() => {
    if (step === 'intro') {
      setTimeout(() => setStep('interact'), 3000)
    }
  }, [step])

  // Handle click detection on the iframe overlay
  const handleIframeClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (isModelReady && !showForm && step === 'interact') {
      // Get click position relative to the container
      const rect = event.currentTarget.getBoundingClientRect()
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top
      
      // Determine body part based on click position
      const selectedPart = getBodyPartFromPosition(x, y, rect.width, rect.height)
      setSelectedBodyPart(selectedPart)
      setShowForm(true)
    }
  }

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

  // Mock analysis result
  const analysisResult: AnalysisResult = {
    confidence: 82,
    primaryCondition: selectedBodyPart === 'Head' ? 'Tension Headache' : 
                     selectedBodyPart === 'Lower Back' ? 'Lumbar Strain' :
                     selectedBodyPart === 'Knee' ? 'Patellofemoral Pain Syndrome' :
                     'Muscle Strain',
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
      { condition: selectedBodyPart === 'Head' ? 'Migraine' : 'Disc Herniation', probability: 15 },
      { condition: selectedBodyPart === 'Head' ? 'Cluster Headache' : 'Arthritis', probability: 8 },
      { condition: selectedBodyPart === 'Head' ? 'Sinusitis' : 'Nerve Impingement', probability: 5 }
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
              </motion.div>

              {/* 3D Model */}
              <div className="flex-1 relative rounded-3xl overflow-hidden bg-gray-900/50 border border-white/10">
                <div 
                  className="absolute inset-0 z-10 cursor-pointer"
                  onClick={handleIframeClick}
                />
                <iframe
                  ref={iframeRef}
                  src={bioDigitalUrl}
                  className="w-full h-full"
                  style={{ border: 'none', pointerEvents: 'none' }}
                  onLoad={() => {
                    setTimeout(() => {
                      setIsModelReady(true)
                    }, 3000)
                  }}
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
                      className="absolute inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-8 z-20"
                    >
                      <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="bg-gray-900/95 backdrop-blur-xl rounded-3xl p-8 max-w-3xl w-full border border-white/10 max-h-[85vh] overflow-y-auto"
                      >
                        <h4 className="text-3xl font-bold text-white mb-6">
                          Tell us about your {selectedBodyPart.toLowerCase()} symptoms
                        </h4>
                        
                        <form onSubmit={handleFormSubmit} className="space-y-6">
                          {/* Primary symptom description - Required */}
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-3">
                              What's bothering you? <span className="text-red-400">*</span>
                            </label>
                            <textarea
                              name="symptoms"
                              value={formData.symptoms}
                              onChange={handleInputChange}
                              placeholder="Describe what you're feeling..."
                              required
                              rows={3}
                              className="w-full px-6 py-4 rounded-xl bg-gray-800/50 text-white border border-gray-700 focus:border-blue-500 focus:outline-none resize-none"
                            />
                          </div>

                          {/* Pain descriptors */}
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-3">
                              How would you describe the pain?
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                              {['Sharp', 'Dull', 'Throbbing', 'Burning', 'Stabbing', 'Aching'].map((type) => (
                                <label key={type} className="flex items-center gap-3 p-4 rounded-xl bg-gray-800/50 hover:bg-gray-800 cursor-pointer transition-all group">
                                  <input
                                    type="checkbox"
                                    checked={formData.painType.includes(type.toLowerCase())}
                                    onChange={() => handleCheckboxChange('painType', type.toLowerCase())}
                                    className="w-5 h-5 text-blue-500 rounded"
                                  />
                                  <span className="text-gray-300 group-hover:text-white transition-colors">{type}</span>
                                </label>
                              ))}
                            </div>
                          </div>

                          {/* Pain level */}
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-3">
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
                                className="flex-1"
                              />
                              <span className="text-2xl font-bold text-white w-12 text-center">{formData.painLevel}</span>
                            </div>
                            <div className="flex justify-between text-xs text-gray-500 mt-2">
                              <span>Mild</span>
                              <span>Moderate</span>
                              <span>Severe</span>
                            </div>
                          </div>

                          {/* Duration */}
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-3">
                              How long has this been going on?
                            </label>
                            <select
                              name="duration"
                              value={formData.duration}
                              onChange={handleInputChange}
                              className="w-full px-6 py-4 rounded-xl bg-gray-800/50 text-white border border-gray-700 focus:border-blue-500 focus:outline-none"
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
                            <label className="block text-sm font-medium text-gray-300 mb-3">
                              How is this affecting your daily life?
                            </label>
                            <div className="space-y-3">
                              {[
                                { id: 'work', label: 'Can\'t work/study effectively', icon: Activity },
                                { id: 'sleep', label: 'Trouble sleeping', icon: BedDouble },
                                { id: 'exercise', label: 'Can\'t exercise', icon: Activity },
                                { id: 'social', label: 'Avoiding social activities', icon: Activity }
                              ].map((impact) => (
                                <label key={impact.id} className="flex items-center gap-3 p-4 rounded-xl bg-gray-800/50 hover:bg-gray-800 cursor-pointer transition-all group">
                                  <input
                                    type="checkbox"
                                    checked={formData.dailyImpact.includes(impact.id)}
                                    onChange={() => handleCheckboxChange('dailyImpact', impact.id)}
                                    className="w-5 h-5 text-blue-500 rounded"
                                  />
                                  <impact.icon className="w-5 h-5 text-gray-400" />
                                  <span className="text-gray-300 group-hover:text-white transition-colors">{impact.label}</span>
                                </label>
                              ))}
                            </div>
                          </div>

                          {/* Advanced questions toggle */}
                          <button
                            type="button"
                            onClick={() => setShowAdvanced(!showAdvanced)}
                            className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
                          >
                            <ChevronDown className={`w-5 h-5 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
                            {showAdvanced ? 'Hide' : 'Show'} additional questions
                          </button>

                          {/* Advanced questions */}
                          <AnimatePresence>
                            {showAdvanced && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="space-y-6 overflow-hidden"
                              >
                                {/* What makes it worse */}
                                <div>
                                  <label className="block text-sm font-medium text-gray-300 mb-3">
                                    What makes it worse?
                                  </label>
                                  <input
                                    type="text"
                                    name="worseWhen"
                                    value={formData.worseWhen}
                                    onChange={handleInputChange}
                                    placeholder="e.g., Movement, sitting, cold weather..."
                                    className="w-full px-6 py-4 rounded-xl bg-gray-800/50 text-white border border-gray-700 focus:border-blue-500 focus:outline-none"
                                  />
                                </div>

                                {/* What makes it better */}
                                <div>
                                  <label className="block text-sm font-medium text-gray-300 mb-3">
                                    What makes it better?
                                  </label>
                                  <input
                                    type="text"
                                    name="betterWhen"
                                    value={formData.betterWhen}
                                    onChange={handleInputChange}
                                    placeholder="e.g., Rest, heat, stretching..."
                                    className="w-full px-6 py-4 rounded-xl bg-gray-800/50 text-white border border-gray-700 focus:border-blue-500 focus:outline-none"
                                  />
                                </div>

                                {/* Sleep impact */}
                                <div>
                                  <label className="block text-sm font-medium text-gray-300 mb-3">
                                    How is your sleep affected?
                                  </label>
                                  <select
                                    name="sleepImpact"
                                    value={formData.sleepImpact}
                                    onChange={handleInputChange}
                                    className="w-full px-6 py-4 rounded-xl bg-gray-800/50 text-white border border-gray-700 focus:border-blue-500 focus:outline-none"
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

                          <div className="flex gap-4 pt-4">
                            <button
                              type="button"
                              onClick={() => setShowForm(false)}
                              className="flex-1 px-6 py-4 rounded-xl bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors text-lg font-medium"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              className="flex-1 px-6 py-4 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:from-blue-600 hover:to-cyan-600 transition-all text-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                              disabled={!formData.symptoms.trim()}
                            >
                              Analyze Symptoms
                            </button>
                          </div>
                        </form>
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
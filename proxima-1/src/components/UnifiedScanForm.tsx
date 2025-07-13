'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MousePointer, Sparkles, ChevronDown, Activity, BedDouble, TrendingUp, Briefcase, Users, Dumbbell, Zap, Brain } from 'lucide-react'

interface UnifiedScanFormProps {
  mode: 'quick' | 'deep'
  onComplete: (data: any) => void
  demoMode?: boolean
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
  frequency: string
  whatTried: string
  didItHelp: string
  associatedSymptoms: string
  triggerEvent: string
}

export default function UnifiedScanForm({ mode, onComplete, demoMode = false }: UnifiedScanFormProps) {
  const [selectedBodyPart, setSelectedBodyPart] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [hadTrigger, setHadTrigger] = useState<boolean | null>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  
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

  // Handle messages from BioDigital iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'BIODIGITAL_PICK' || event.data.type === 'BIODIGITAL_SELECT') {
        const data = event.data.data
        setSelectedBodyPart(data.objectName || 'Unknown Body Part')
        setShowForm(true)
      }
    }
    
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.symptoms.trim() || !selectedBodyPart) {
      return
    }
    
    onComplete({
      bodyPart: selectedBodyPart,
      formData: formData,
      mode: mode
    })
  }

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      {/* Left: 3D Body Model */}
      <div className="relative">
        <div className="sticky top-24">
          <div className="bg-gray-900/50 rounded-2xl border border-white/10 overflow-hidden">
            {/* Instructions */}
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center gap-3 mb-4">
                <MousePointer className="w-5 h-5 text-blue-400" />
                <h3 className="text-lg font-semibold text-white">Click where you feel symptoms</h3>
              </div>
              <p className="text-sm text-gray-400">
                Select the area on the 3D model that best represents where you're experiencing issues
              </p>
            </div>

            {/* 3D Model */}
            <div className="relative aspect-[4/5] bg-gray-950">
              <iframe
                ref={iframeRef}
                src="/biodigital-viewer.html"
                className="absolute inset-0 w-full h-full"
                title="BioDigital Human Viewer"
              />
              
              {/* Selected Part Indicator */}
              {selectedBodyPart && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute top-4 left-4 right-4 p-3 bg-blue-500/20 backdrop-blur-sm rounded-lg border border-blue-500/50"
                >
                  <p className="text-sm text-blue-300">
                    Selected: <span className="font-medium text-white">{selectedBodyPart}</span>
                  </p>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Right: Form or Placeholder */}
      <div>
        {!showForm ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="h-full flex items-center justify-center"
          >
            <div className="text-center p-8">
              <div className={`w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center ${
                mode === 'quick' 
                  ? 'bg-gradient-to-br from-emerald-500/20 to-green-500/20' 
                  : 'bg-gradient-to-br from-indigo-500/20 to-purple-500/20'
              }`}>
                {mode === 'quick' ? (
                  <Zap className="w-10 h-10 text-emerald-400" />
                ) : (
                  <Brain className="w-10 h-10 text-indigo-400" />
                )}
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">
                {mode === 'quick' ? 'Quick Scan Ready' : 'Deep Dive Ready'}
              </h3>
              <p className="text-gray-400 mb-6">
                Click on the 3D model to select the area where you're experiencing symptoms
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800/50 rounded-lg text-sm text-gray-400">
                <MousePointer className="w-4 h-4" />
                Click the body model to begin
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-gray-900/50 rounded-2xl border border-white/10 p-6"
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Header */}
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  Tell us about your <span className="text-blue-400">{selectedBodyPart}</span> symptoms
                </h3>
                <p className="text-gray-400 text-sm">
                  {mode === 'quick' 
                    ? 'Fill out this form for instant AI analysis'
                    : 'Complete this form to begin your comprehensive analysis'
                  }
                </p>
              </div>

              {/* Primary symptom description */}
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

              {/* Trigger question */}
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

                    {/* What makes it worse/better */}
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

              {/* Submit button */}
              <button
                type="submit"
                disabled={!formData.symptoms.trim()}
                className={`w-full py-4 px-6 rounded-xl font-medium text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                  mode === 'quick'
                    ? 'bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600'
                    : 'bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600'
                }`}
              >
                {mode === 'quick' ? (
                  <span className="flex items-center justify-center gap-2">
                    <Zap className="w-5 h-5" />
                    Start Quick Scan
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Brain className="w-5 h-5" />
                    Begin Deep Dive Analysis
                  </span>
                )}
              </button>
            </form>
          </motion.div>
        )}
      </div>
    </div>
  )
}
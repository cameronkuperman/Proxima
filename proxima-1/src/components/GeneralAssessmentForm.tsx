'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Sparkles, 
  Brain, 
  Heart, 
  Battery, 
  Pill, 
  RefreshCw, 
  HelpCircle,
  Activity,
  Loader2,
  ChevronDown,
  AlertCircle
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { generalAssessmentClient } from '@/lib/general-assessment-client'
import ErrorAlert from './ErrorAlert'

interface GeneralAssessmentFormProps {
  mode: 'flash' | 'quick' | 'deep'
  onComplete: (data: any) => void
  userGender?: 'male' | 'female'
}

interface GeneralFormData {
  // Flash mode
  description?: string
  
  // Core fields for all modes
  category?: string
  symptoms: string
  duration: string
  impactLevel: number
  aggravatingFactors: string[]
  triedInterventions: string[]
  
  // Category-specific fields (populated based on selected category)
  // Energy & Fatigue
  energyPattern?: string // morning/afternoon/evening/all-day
  sleepHours?: string
  wakingUpFeeling?: string // refreshed/tired/exhausted
  crashTimes?: string[]
  
  // Mental Health
  moodPattern?: string // stable/fluctuating/declining
  triggerEvents?: string
  copingStrategies?: string[]
  concentrationLevel?: number
  
  // Feeling Sick
  temperatureFeeling?: string // hot/cold/normal/fluctuating
  symptomProgression?: string // getting-worse/stable/improving
  contagiousExposure?: boolean
  hydrationLevel?: string
  
  // Medication Side Effects
  timeSinceStarted?: string
  doseChanges?: boolean
  symptomTiming?: string // right-after/hours-later/random
  missedDoses?: boolean
  
  // Multiple Issues
  primaryConcern?: string
  secondaryConcerns?: string[]
  symptomConnection?: string // related/unrelated/unsure
  
  // General fields for deeper assessment
  currentActivity?: string // what were you doing when symptoms started
  recentChanges?: string // any recent life/routine changes
  symptomVariation?: string // when symptoms are better/worse
  functionalImpact?: string[] // specific activities affected
  
  // Physical/Body Issues
  bodyRegion?: string // head_neck/chest/abdomen/back/arms/legs/joints/skin/multiple
  issueType?: string // pain/injury/rash/swelling/numbness/weakness/other
  occurrencePattern?: string // constant/movement/rest/random
  affectedSide?: string // left/right/both/center
  radiatingPain?: boolean
  specificMovements?: string
  
  // Optional location field for all categories
  bodyLocation?: {
    regions: string[]
    description?: string
  }
}

const categories = [
  { id: 'energy', label: 'Energy & Fatigue', icon: Battery, color: 'from-yellow-500 to-orange-500' },
  { id: 'mental', label: 'Mental Health', icon: Brain, color: 'from-purple-500 to-pink-500' },
  { id: 'sick', label: 'Feeling Sick', icon: Heart, color: 'from-red-500 to-pink-500' },
  { id: 'physical', label: 'Physical Pain/Injury', icon: Activity, color: 'from-red-500 to-rose-500' },
  { id: 'medication', label: 'Medicine Side Effects', icon: Pill, color: 'from-blue-500 to-cyan-500' },
  { id: 'multiple', label: 'Multiple Issues', icon: RefreshCw, color: 'from-green-500 to-teal-500' },
  { id: 'unsure', label: 'Not Sure', icon: HelpCircle, color: 'from-gray-500 to-gray-600' }
]

const aggravatingOptions = [
  'Stress', 'Poor sleep', 'Certain foods', 
  'Physical activity', 'Weather changes', 'Time of day',
  'Work/School', 'None/Not sure'
]

const interventionOptions = [
  'Rest', 'Over-the-counter meds', 'Changed diet',
  'Exercise more/less', 'Relaxation techniques', 'Nothing yet'
]

const bodyRegions = [
  { id: 'head_neck', label: 'Head & Neck' },
  { id: 'chest', label: 'Chest' },
  { id: 'abdomen', label: 'Abdomen' },
  { id: 'back', label: 'Back' },
  { id: 'arms', label: 'Arms' },
  { id: 'legs', label: 'Legs' },
  { id: 'joints', label: 'Joints' },
  { id: 'skin', label: 'Skin' },
  { id: 'multiple', label: 'Multiple Areas' }
]

const issueTypes = [
  { id: 'pain', label: 'Pain' },
  { id: 'injury', label: 'Injury' },
  { id: 'rash', label: 'Rash' },
  { id: 'swelling', label: 'Swelling' },
  { id: 'numbness', label: 'Numbness' },
  { id: 'weakness', label: 'Weakness' },
  { id: 'other', label: 'Other' }
]

const placeholderExamples = [
  "I've been feeling exhausted for the past two weeks...",
  "My anxiety has been getting worse lately...",
  "I think I might be getting sick, I have a fever and...",
  "Something feels off but I can't quite explain it...",
  "Ever since I started this new medication, I've been...",
  "I've been having trouble sleeping and it's affecting..."
]

export default function GeneralAssessmentForm({ mode, onComplete, userGender = 'male' }: GeneralAssessmentFormProps) {
  const router = useRouter()
  const { user } = useAuth()
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [showCategoryModal, setShowCategoryModal] = useState(mode !== 'flash')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [placeholderIndex, setPlaceholderIndex] = useState(0)
  const [currentStep, setCurrentStep] = useState(1)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState<GeneralFormData>({
    description: '',
    symptoms: '',
    duration: '',
    impactLevel: 5,
    aggravatingFactors: [],
    triedInterventions: []
  })

  // Cycle through placeholder examples for flash mode
  useEffect(() => {
    if (mode === 'flash') {
      const interval = setInterval(() => {
        setPlaceholderIndex((prev) => (prev + 1) % placeholderExamples.length)
      }, 3000)
      return () => clearInterval(interval)
    }
  }, [mode])

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId)
    setShowCategoryModal(false)
    setFormData(prev => ({ ...prev, category: categoryId }))
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  const handleCheckboxChange = (field: 'aggravatingFactors' | 'triedInterventions' | 'functionalImpact', value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field]?.includes(value) 
        ? prev[field].filter(v => v !== value)
        : [...(prev[field] || []), value]
    }))
  }

  const handleFlashSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.description?.trim() || isSubmitting) return
    
    setIsSubmitting(true)
    try {
      const result = await generalAssessmentClient.performFlashAssessment(
        formData.description,
        user?.id
      )
      await onComplete({
        mode: 'flash',
        category: 'general',
        result,
        formData: {
          symptoms: formData.description,
          duration: 'Not specified',
          impactLevel: 5
        }
      })
    } catch (error: any) {
      console.error('Flash assessment failed:', error)
      setError(error.message || 'Failed to complete flash assessment. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleQuickSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.symptoms.trim() || isSubmitting) return
    
    // Physical category validation
    if (selectedCategory === 'physical') {
      if (!formData.bodyRegion) {
        alert('Please select the affected body region')
        return
      }
      if (!formData.issueType) {
        alert('Please specify the type of issue')
        return
      }
      if (!formData.occurrencePattern) {
        alert('Please indicate when the issue occurs')
        return
      }
    }
    
    setIsSubmitting(true)
    try {
      const result = await generalAssessmentClient.performGeneralAssessment(
        selectedCategory || 'unsure',
        formData,
        user?.id
      )
      await onComplete({
        mode: 'quick',
        category: selectedCategory,
        result,
        formData: formData
      })
    } catch (error: any) {
      console.error('General assessment failed:', error)
      setError(error.message || 'Failed to complete assessment. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeepSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1)
      return
    }
    
    if (!formData.symptoms.trim() || isSubmitting) return
    
    // Physical category validation
    if (selectedCategory === 'physical') {
      if (!formData.bodyRegion) {
        alert('Please select the affected body region')
        return
      }
      if (!formData.issueType) {
        alert('Please specify the type of issue')
        return
      }
      if (!formData.occurrencePattern) {
        alert('Please indicate when the issue occurs')
        return
      }
    }
    
    setIsSubmitting(true)
    await onComplete({
      mode: 'deep',
      category: selectedCategory,
      formData: formData
    })
  }

  // Flash Assessment - Just a text box
  if (mode === 'flash') {
    return (
      <>
        <ErrorAlert error={error} onClose={() => setError(null)} />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto p-6"
        >
        <form onSubmit={handleFlashSubmit} className="space-y-6">
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-amber-500/20 to-yellow-500/20 mb-4"
            >
              <Sparkles className="w-8 h-8 text-amber-400" />
            </motion.div>
            <h2 className="text-3xl font-bold text-white mb-2">Flash Assessment</h2>
            <p className="text-gray-400">Tell us what's happening in your own words</p>
          </div>

          <div className="relative">
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder={placeholderExamples[placeholderIndex]}
              className="w-full h-40 px-6 py-4 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-amber-500/50 transition-all resize-none"
              autoFocus
            />
            <motion.div
              className="absolute -bottom-2 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-500 to-yellow-500"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: formData.description ? 1 : 0 }}
              transition={{ duration: 0.3 }}
            />
          </div>

          <motion.button
            type="submit"
            disabled={!formData.description?.trim() || isSubmitting}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`w-full py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
              formData.description?.trim() && !isSubmitting
                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white hover:from-amber-600 hover:to-yellow-600'
                : 'bg-gray-800 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                Get Instant Insight
                <Sparkles className="w-5 h-5" />
              </>
            )}
          </motion.button>
        </form>
      </motion.div>
      </>
    )
  }

  // Category Selection Modal
  if (showCategoryModal) {
    return (
      <>
        <ErrorAlert error={error} onClose={() => setError(null)} />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="max-w-4xl mx-auto p-6"
        >
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">What type of health concern do you have?</h2>
          <p className="text-gray-400">This helps us ask the right questions</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {categories.map((category) => {
            const Icon = category.icon
            return (
              <motion.button
                key={category.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleCategorySelect(category.id)}
                className="relative group"
              >
                <div className="absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity rounded-xl blur-xl"
                  style={{
                    background: `linear-gradient(to right, ${category.color.split(' ')[1]}, ${category.color.split(' ')[3]})`
                  }}
                />
                <div className="relative bg-white/[0.03] backdrop-blur-sm border border-white/[0.08] rounded-xl p-6 hover:border-white/[0.15] transition-all">
                  <Icon className={`w-8 h-8 mb-3 mx-auto bg-gradient-to-r ${category.color} bg-clip-text text-transparent`} />
                  <p className="text-white font-medium">{category.label}</p>
                </div>
              </motion.button>
            )
          })}
        </div>
      </motion.div>
      </>
    )
  }

  // Quick Scan Form
  if (mode === 'quick') {
    const selectedCategoryData = categories.find(c => c.id === selectedCategory)
    const Icon = selectedCategoryData?.icon || HelpCircle

    return (
      <>
        <ErrorAlert error={error} onClose={() => setError(null)} />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto p-6"
        >
        <form onSubmit={handleQuickSubmit} className="space-y-6">
          {/* Header */}
          <div className="text-center mb-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-r from-emerald-500/20 to-green-500/20 mb-3"
            >
              <Icon className="w-6 h-6 text-emerald-400" />
            </motion.div>
            <h2 className="text-2xl font-bold text-white mb-1">Quick {selectedCategoryData?.label} Assessment</h2>
            <p className="text-gray-400 text-sm">Answer a few questions for instant insights</p>
          </div>

          {/* 1. Describe what's happening */}
          <div>
            <label className="block text-white font-medium mb-2">
              1. Describe what's happening
            </label>
            <textarea
              name="symptoms"
              value={formData.symptoms}
              onChange={handleInputChange}
              placeholder={`Tell us about your ${selectedCategoryData?.label.toLowerCase()} concerns...`}
              className="w-full h-24 px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-emerald-500/50 transition-all resize-none"
              required
            />
          </div>

          {/* 2. Category-specific primary question (moved up) */}
          {selectedCategory && (
            <>
              {selectedCategory === 'energy' && (
                <div>
                  <label className="block text-white font-medium mb-2">
                    2. When is your energy lowest?
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {['Morning', 'Afternoon', 'Evening', 'All day'].map((time) => (
                      <label key={time} className="relative">
                        <input
                          type="radio"
                          name="energyPattern"
                          value={time}
                          onChange={handleInputChange}
                          className="sr-only"
                        />
                        <div className={`p-3 rounded-lg border text-center cursor-pointer transition-all ${
                          formData.energyPattern === time
                            ? 'bg-emerald-500/20 border-emerald-500 text-white'
                            : 'bg-white/[0.03] border-white/[0.08] text-gray-400 hover:border-white/[0.15]'
                        }`}>
                          {time}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {selectedCategory === 'mental' && (
                <div>
                  <label className="block text-white font-medium mb-2">
                    2. How would you describe your mood pattern?
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Stable', 'Fluctuating', 'Declining'].map((pattern) => (
                      <label key={pattern} className="relative">
                        <input
                          type="radio"
                          name="moodPattern"
                          value={pattern}
                          onChange={handleInputChange}
                          className="sr-only"
                        />
                        <div className={`p-3 rounded-lg border text-center cursor-pointer transition-all ${
                          formData.moodPattern === pattern
                            ? 'bg-emerald-500/20 border-emerald-500 text-white'
                            : 'bg-white/[0.03] border-white/[0.08] text-gray-400 hover:border-white/[0.15]'
                        }`}>
                          {pattern}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {selectedCategory === 'sick' && (
                <div>
                  <label className="block text-white font-medium mb-2">
                    2. How do you feel temperature-wise?
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {['Hot/Feverish', 'Cold/Chills', 'Normal', 'Fluctuating'].map((temp) => (
                      <label key={temp} className="relative">
                        <input
                          type="radio"
                          name="temperatureFeeling"
                          value={temp}
                          onChange={handleInputChange}
                          className="sr-only"
                        />
                        <div className={`p-3 rounded-lg border text-center cursor-pointer transition-all ${
                          formData.temperatureFeeling === temp
                            ? 'bg-emerald-500/20 border-emerald-500 text-white'
                            : 'bg-white/[0.03] border-white/[0.08] text-gray-400 hover:border-white/[0.15]'
                        }`}>
                          {temp}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {selectedCategory === 'physical' && (
                <div>
                  <label className="block text-white font-medium mb-2">
                    2. Where is the issue located?
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {bodyRegions.map((region) => (
                      <label key={region.id} className="relative">
                        <input
                          type="radio"
                          name="bodyRegion"
                          value={region.id}
                          onChange={handleInputChange}
                          className="sr-only"
                        />
                        <div className={`p-3 rounded-lg border text-center cursor-pointer transition-all ${
                          formData.bodyRegion === region.id
                            ? 'bg-emerald-500/20 border-emerald-500 text-white'
                            : 'bg-white/[0.03] border-white/[0.08] text-gray-400 hover:border-white/[0.15]'
                        }`}>
                          {region.label}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {selectedCategory === 'medication' && (
                <div>
                  <label className="block text-white font-medium mb-2">
                    2. When do symptoms occur after taking medication?
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Right after', 'Hours later', 'Random times'].map((timing) => (
                      <label key={timing} className="relative">
                        <input
                          type="radio"
                          name="symptomTiming"
                          value={timing}
                          onChange={handleInputChange}
                          className="sr-only"
                        />
                        <div className={`p-3 rounded-lg border text-center cursor-pointer transition-all ${
                          formData.symptomTiming === timing
                            ? 'bg-emerald-500/20 border-emerald-500 text-white'
                            : 'bg-white/[0.03] border-white/[0.08] text-gray-400 hover:border-white/[0.15]'
                        }`}>
                          {timing}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {selectedCategory === 'multiple' && (
                <div>
                  <label className="block text-white font-medium mb-2">
                    2. What's your PRIMARY concern?
                  </label>
                  <input
                    type="text"
                    name="primaryConcern"
                    value={formData.primaryConcern || ''}
                    onChange={handleInputChange}
                    placeholder="The issue that bothers you most..."
                    className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-emerald-500/50 transition-all"
                  />
                </div>
              )}

              {selectedCategory === 'unsure' && (
                <div>
                  <label className="block text-white font-medium mb-2">
                    2. What made you seek help today?
                  </label>
                  <textarea
                    name="currentActivity"
                    value={formData.currentActivity || ''}
                    onChange={handleInputChange}
                    placeholder="What happened that made you decide to check your health..."
                    className="w-full h-20 px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-emerald-500/50 transition-all resize-none"
                  />
                </div>
              )}
            </>
          )}

          {/* 3. Duration */}
          <div>
            <label className="block text-white font-medium mb-2">
              3. How long has this been going on?
            </label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {['Today', 'Few days', '1-2 weeks', 'Month+', 'Longer'].map((option) => (
                <label key={option} className="relative">
                  <input
                    type="radio"
                    name="duration"
                    value={option}
                    checked={formData.duration === option}
                    onChange={handleInputChange}
                    className="sr-only"
                  />
                  <div className={`p-3 rounded-lg border text-center cursor-pointer transition-all ${
                    formData.duration === option
                      ? 'bg-emerald-500/20 border-emerald-500 text-white'
                      : 'bg-white/[0.03] border-white/[0.08] text-gray-400 hover:border-white/[0.15]'
                  }`}>
                    {option}
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* 4. Impact Level */}
          <div>
            <label className="block text-white font-medium mb-2">
              4. How much is this affecting your life?
            </label>
            <div className="relative">
              <input
                type="range"
                name="impactLevel"
                min="1"
                max="10"
                value={formData.impactLevel}
                onChange={handleInputChange}
                className="w-full h-2 bg-white/[0.1] rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-2">
                <span>Not at all</span>
                <span className="text-white font-medium text-base">{formData.impactLevel}/10</span>
                <span>Can't function</span>
              </div>
            </div>
          </div>

          {/* 5. Second category-specific question */}
          {selectedCategory && (
            <>
              {selectedCategory === 'energy' && (
                <div>
                  <label className="block text-white font-medium mb-2">
                    5. How do you wake up feeling?
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Refreshed', 'Tired', 'Exhausted'].map((feeling) => (
                      <label key={feeling} className="relative">
                        <input
                          type="radio"
                          name="wakingUpFeeling"
                          value={feeling}
                          onChange={handleInputChange}
                          className="sr-only"
                        />
                        <div className={`p-3 rounded-lg border text-center cursor-pointer transition-all ${
                          formData.wakingUpFeeling === feeling
                            ? 'bg-emerald-500/20 border-emerald-500 text-white'
                            : 'bg-white/[0.03] border-white/[0.08] text-gray-400 hover:border-white/[0.15]'
                        }`}>
                          {feeling}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {selectedCategory === 'mental' && (
                <div>
                  <label className="block text-white font-medium mb-2">
                    5. Rate your ability to concentrate (1-10)
                  </label>
                  <input
                    type="range"
                    name="concentrationLevel"
                    min="1"
                    max="10"
                    value={formData.concentrationLevel || 5}
                    onChange={handleInputChange}
                    className="w-full h-2 bg-white/[0.1] rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-2">
                    <span>Can't focus</span>
                    <span className="text-white font-medium text-base">{formData.concentrationLevel || 5}/10</span>
                    <span>Sharp focus</span>
                  </div>
                </div>
              )}

              {selectedCategory === 'sick' && (
                <div>
                  <label className="block text-white font-medium mb-2">
                    5. Are symptoms getting...
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Worse', 'Stable', 'Better'].map((progression) => (
                      <label key={progression} className="relative">
                        <input
                          type="radio"
                          name="symptomProgression"
                          value={progression}
                          onChange={handleInputChange}
                          className="sr-only"
                        />
                        <div className={`p-3 rounded-lg border text-center cursor-pointer transition-all ${
                          formData.symptomProgression === progression
                            ? 'bg-emerald-500/20 border-emerald-500 text-white'
                            : 'bg-white/[0.03] border-white/[0.08] text-gray-400 hover:border-white/[0.15]'
                        }`}>
                          {progression}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {selectedCategory === 'physical' && (
                <div>
                  <label className="block text-white font-medium mb-2">
                    5. What type of issue is it?
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {issueTypes.map((type) => (
                      <label key={type.id} className="relative">
                        <input
                          type="radio"
                          name="issueType"
                          value={type.id}
                          onChange={handleInputChange}
                          className="sr-only"
                        />
                        <div className={`p-3 rounded-lg border text-center cursor-pointer transition-all ${
                          formData.issueType === type.id
                            ? 'bg-emerald-500/20 border-emerald-500 text-white'
                            : 'bg-white/[0.03] border-white/[0.08] text-gray-400 hover:border-white/[0.15]'
                        }`}>
                          {type.label}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {selectedCategory === 'medication' && (
                <div>
                  <label className="block text-white font-medium mb-2">
                    5. Any recent dose changes?
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {['Yes', 'No'].map((answer) => (
                      <label key={answer} className="relative">
                        <input
                          type="radio"
                          name="doseChanges"
                          value={answer}
                          onChange={(e) => setFormData(prev => ({ 
                            ...prev, 
                            doseChanges: e.target.value === 'Yes' 
                          }))}
                          className="sr-only"
                        />
                        <div className={`p-3 rounded-lg border text-center cursor-pointer transition-all ${
                          (formData.doseChanges === true && answer === 'Yes') || 
                          (formData.doseChanges === false && answer === 'No')
                            ? 'bg-emerald-500/20 border-emerald-500 text-white'
                            : 'bg-white/[0.03] border-white/[0.08] text-gray-400 hover:border-white/[0.15]'
                        }`}>
                          {answer}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {selectedCategory === 'multiple' && (
                <div>
                  <label className="block text-white font-medium mb-2">
                    5. Do these issues seem connected?
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Related', 'Unrelated', 'Unsure'].map((connection) => (
                      <label key={connection} className="relative">
                        <input
                          type="radio"
                          name="symptomConnection"
                          value={connection}
                          onChange={handleInputChange}
                          className="sr-only"
                        />
                        <div className={`p-3 rounded-lg border text-center cursor-pointer transition-all ${
                          formData.symptomConnection === connection
                            ? 'bg-emerald-500/20 border-emerald-500 text-white'
                            : 'bg-white/[0.03] border-white/[0.08] text-gray-400 hover:border-white/[0.15]'
                        }`}>
                          {connection}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {selectedCategory === 'unsure' && (
                <div>
                  <label className="block text-white font-medium mb-2">
                    5. Any recent changes in your life or routine?
                  </label>
                  <textarea
                    name="recentChanges"
                    value={formData.recentChanges || ''}
                    onChange={handleInputChange}
                    placeholder="New job, moved, diet change, stress, etc..."
                    className="w-full h-20 px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-emerald-500/50 transition-all resize-none"
                  />
                </div>
              )}
            </>
          )}

          {/* 6. Aggravating Factors */}
          <div>
            <label className="block text-white font-medium mb-2">
              6. Any of these making it worse? (check all that apply)
            </label>
            <div className="grid grid-cols-2 gap-2">
              {aggravatingOptions.map((option) => (
                <label key={option} className="flex items-center gap-2 p-3 bg-white/[0.03] border border-white/[0.08] rounded-lg hover:border-white/[0.15] cursor-pointer transition-all">
                  <input
                    type="checkbox"
                    checked={formData.aggravatingFactors.includes(option)}
                    onChange={() => handleCheckboxChange('aggravatingFactors', option)}
                    className="w-4 h-4 rounded border-gray-600 text-emerald-500 focus:ring-emerald-500"
                  />
                  <span className="text-gray-300 text-sm">{option}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 7. Third category-specific question */}
          {selectedCategory && (
            <>
              {selectedCategory === 'energy' && (
                <div>
                  <label className="block text-white font-medium mb-2">
                    7. How many hours of sleep?
                  </label>
                  <input
                    type="text"
                    name="sleepHours"
                    value={formData.sleepHours || ''}
                    onChange={handleInputChange}
                    placeholder="e.g., 6-7 hours"
                    className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-emerald-500/50 transition-all"
                  />
                </div>
              )}

              {selectedCategory === 'mental' && (
                <div>
                  <label className="block text-white font-medium mb-2">
                    7. Any specific triggers or events?
                  </label>
                  <textarea
                    name="triggerEvents"
                    value={formData.triggerEvents || ''}
                    onChange={handleInputChange}
                    placeholder="Describe any recent events or ongoing stressors..."
                    className="w-full h-20 px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-emerald-500/50 transition-all resize-none"
                  />
                </div>
              )}

              {selectedCategory === 'sick' && (
                <div>
                  <label className="block text-white font-medium mb-2">
                    7. Been around anyone sick recently?
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {['Yes', 'No'].map((answer) => (
                      <label key={answer} className="relative">
                        <input
                          type="radio"
                          name="contagiousExposure"
                          value={answer}
                          onChange={(e) => setFormData(prev => ({ 
                            ...prev, 
                            contagiousExposure: e.target.value === 'Yes' 
                          }))}
                          className="sr-only"
                        />
                        <div className={`p-3 rounded-lg border text-center cursor-pointer transition-all ${
                          (formData.contagiousExposure === true && answer === 'Yes') || 
                          (formData.contagiousExposure === false && answer === 'No')
                            ? 'bg-emerald-500/20 border-emerald-500 text-white'
                            : 'bg-white/[0.03] border-white/[0.08] text-gray-400 hover:border-white/[0.15]'
                        }`}>
                          {answer}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {selectedCategory === 'physical' && (
                <div>
                  <label className="block text-white font-medium mb-2">
                    7. When does it occur?
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {['Constant', 'With movement', 'At rest', 'Random'].map((pattern) => (
                      <label key={pattern} className="relative">
                        <input
                          type="radio"
                          name="occurrencePattern"
                          value={pattern}
                          onChange={handleInputChange}
                          className="sr-only"
                        />
                        <div className={`p-3 rounded-lg border text-center cursor-pointer transition-all ${
                          formData.occurrencePattern === pattern
                            ? 'bg-emerald-500/20 border-emerald-500 text-white'
                            : 'bg-white/[0.03] border-white/[0.08] text-gray-400 hover:border-white/[0.15]'
                        }`}>
                          {pattern}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {selectedCategory === 'medication' && (
                <div>
                  <label className="block text-white font-medium mb-2">
                    7. How long since you started this medication?
                  </label>
                  <input
                    type="text"
                    name="timeSinceStarted"
                    value={formData.timeSinceStarted || ''}
                    onChange={handleInputChange}
                    placeholder="e.g., 2 weeks, 3 months"
                    className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-emerald-500/50 transition-all"
                  />
                </div>
              )}

              {selectedCategory === 'multiple' && (
                <div>
                  <label className="block text-white font-medium mb-2">
                    7. List your other concerns
                  </label>
                  <textarea
                    name="secondaryConcerns"
                    placeholder="Other symptoms or issues you're experiencing..."
                    className="w-full h-20 px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-emerald-500/50 transition-all resize-none"
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      secondaryConcerns: e.target.value.split('\n').filter(c => c.trim()) 
                    }))}
                  />
                </div>
              )}
            </>
          )}

          {/* 8. What have you tried */}
          <div>
            <label className="block text-white font-medium mb-2">
              8. What have you tried?
            </label>
            <div className="grid grid-cols-2 gap-2">
              {interventionOptions.map((option) => (
                <label key={option} className="flex items-center gap-2 p-3 bg-white/[0.03] border border-white/[0.08] rounded-lg hover:border-white/[0.15] cursor-pointer transition-all">
                  <input
                    type="checkbox"
                    checked={formData.triedInterventions.includes(option)}
                    onChange={() => handleCheckboxChange('triedInterventions', option)}
                    className="w-4 h-4 rounded border-gray-600 text-emerald-500 focus:ring-emerald-500"
                  />
                  <span className="text-gray-300 text-sm">{option}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Physical Category Additional Fields */}
          {selectedCategory === 'physical' && (
            <>
              {/* Affected Side - only for bilateral body parts */}
              {formData.bodyRegion && ['arms', 'legs', 'joints'].includes(formData.bodyRegion) && (
                <div>
                  <label className="block text-white font-medium mb-2">
                    Which side is affected?
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { value: 'left', label: 'Left' },
                      { value: 'right', label: 'Right' },
                      { value: 'both', label: 'Both' },
                      { value: 'center', label: 'Center' }
                    ].map((option) => (
                      <label key={option.value} className="relative">
                        <input
                          type="radio"
                          name="affectedSide"
                          value={option.value}
                          onChange={handleInputChange}
                          className="sr-only"
                        />
                        <div className={`p-3 rounded-lg border text-center cursor-pointer transition-all ${
                          formData.affectedSide === option.value
                            ? 'bg-emerald-500/20 border-emerald-500 text-white'
                            : 'bg-white/[0.03] border-white/[0.08] text-gray-400 hover:border-white/[0.15]'
                        }`}>
                          {option.label}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Radiating Pain - only for pain issues */}
              {formData.issueType === 'pain' && (
                <div>
                  <label className="block text-white font-medium mb-2">
                    Does the pain radiate to other areas?
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {['Yes', 'No'].map((answer) => (
                      <label key={answer} className="relative">
                        <input
                          type="radio"
                          name="radiatingPain"
                          value={answer}
                          onChange={(e) => setFormData(prev => ({ 
                            ...prev, 
                            radiatingPain: e.target.value === 'Yes' 
                          }))}
                          className="sr-only"
                        />
                        <div className={`p-3 rounded-lg border text-center cursor-pointer transition-all ${
                          (formData.radiatingPain === true && answer === 'Yes') || 
                          (formData.radiatingPain === false && answer === 'No')
                            ? 'bg-emerald-500/20 border-emerald-500 text-white'
                            : 'bg-white/[0.03] border-white/[0.08] text-gray-400 hover:border-white/[0.15]'
                        }`}>
                          {answer}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Specific Movements */}
              <div>
                <label className="block text-white font-medium mb-2">
                  Specific movements that affect it (optional)
                </label>
                <textarea
                  name="specificMovements"
                  value={formData.specificMovements || ''}
                  onChange={handleInputChange}
                  placeholder="e.g., Hurts when bending forward, worse when climbing stairs..."
                  className="w-full h-20 px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-emerald-500/50 transition-all resize-none"
                />
              </div>
            </>
          )}

          {/* 9. Optional Body Location (for all categories except physical) */}
          {selectedCategory !== 'physical' && selectedCategory && (
            <div>
              <label className="block text-white font-medium mb-2">
                9. Is this affecting any specific body areas? (optional)
              </label>
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  {bodyRegions.map((region) => (
                    <label key={region.id} className="flex items-center gap-2 p-3 bg-white/[0.03] border border-white/[0.08] rounded-lg hover:border-white/[0.15] cursor-pointer transition-all">
                      <input
                        type="checkbox"
                        checked={formData.bodyLocation?.regions?.includes(region.id) || false}
                        onChange={() => {
                          const currentRegions = formData.bodyLocation?.regions || [];
                          const newRegions = currentRegions.includes(region.id)
                            ? currentRegions.filter(r => r !== region.id)
                            : [...currentRegions, region.id];
                          setFormData(prev => ({
                            ...prev,
                            bodyLocation: {
                              ...prev.bodyLocation,
                              regions: newRegions
                            }
                          }));
                        }}
                        className="w-4 h-4 rounded border-gray-600 text-emerald-500 focus:ring-emerald-500"
                      />
                      <span className="text-gray-300 text-sm">{region.label}</span>
                    </label>
                  ))}
                </div>
                {formData.bodyLocation?.regions && formData.bodyLocation.regions.length > 0 && (
                  <textarea
                    name="bodyLocationDescription"
                    value={formData.bodyLocation?.description || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      bodyLocation: {
                        regions: prev.bodyLocation?.regions || [],
                        ...prev.bodyLocation,
                        description: e.target.value
                      }
                    }))}
                    placeholder="Describe the location more specifically (optional)..."
                    className="w-full h-20 px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-emerald-500/50 transition-all resize-none"
                  />
                )}
              </div>
            </div>
          )}
          {selectedCategory && (
            <>
              {/* Energy & Fatigue specific */}
              {selectedCategory === 'energy' && (
                <>
                  <div>
                    <label className="block text-white font-medium mb-2">
                      6. When is your energy lowest?
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {['Morning', 'Afternoon', 'Evening', 'All day'].map((time) => (
                        <label key={time} className="relative">
                          <input
                            type="radio"
                            name="energyPattern"
                            value={time}
                            onChange={handleInputChange}
                            className="sr-only"
                          />
                          <div className={`p-3 rounded-lg border text-center cursor-pointer transition-all ${
                            formData.energyPattern === time
                              ? 'bg-emerald-500/20 border-emerald-500 text-white'
                              : 'bg-white/[0.03] border-white/[0.08] text-gray-400 hover:border-white/[0.15]'
                          }`}>
                            {time}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-white font-medium mb-2">
                      7. How do you wake up feeling?
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {['Refreshed', 'Tired', 'Exhausted'].map((feeling) => (
                        <label key={feeling} className="relative">
                          <input
                            type="radio"
                            name="wakingUpFeeling"
                            value={feeling}
                            onChange={handleInputChange}
                            className="sr-only"
                          />
                          <div className={`p-3 rounded-lg border text-center cursor-pointer transition-all ${
                            formData.wakingUpFeeling === feeling
                              ? 'bg-emerald-500/20 border-emerald-500 text-white'
                              : 'bg-white/[0.03] border-white/[0.08] text-gray-400 hover:border-white/[0.15]'
                          }`}>
                            {feeling}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-white font-medium mb-2">
                      8. How many hours of sleep?
                    </label>
                    <input
                      type="text"
                      name="sleepHours"
                      value={formData.sleepHours || ''}
                      onChange={handleInputChange}
                      placeholder="e.g., 6-7 hours"
                      className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-emerald-500/50 transition-all"
                    />
                  </div>
                </>
              )}

              {/* Mental Health specific */}
              {selectedCategory === 'mental' && (
                <>
                  <div>
                    <label className="block text-white font-medium mb-2">
                      6. How would you describe your mood pattern?
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {['Stable', 'Fluctuating', 'Declining'].map((pattern) => (
                        <label key={pattern} className="relative">
                          <input
                            type="radio"
                            name="moodPattern"
                            value={pattern}
                            onChange={handleInputChange}
                            className="sr-only"
                          />
                          <div className={`p-3 rounded-lg border text-center cursor-pointer transition-all ${
                            formData.moodPattern === pattern
                              ? 'bg-emerald-500/20 border-emerald-500 text-white'
                              : 'bg-white/[0.03] border-white/[0.08] text-gray-400 hover:border-white/[0.15]'
                          }`}>
                            {pattern}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-white font-medium mb-2">
                      7. Any specific triggers or events?
                    </label>
                    <textarea
                      name="triggerEvents"
                      value={formData.triggerEvents || ''}
                      onChange={handleInputChange}
                      placeholder="Describe any recent events or ongoing stressors..."
                      className="w-full h-20 px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-emerald-500/50 transition-all resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-white font-medium mb-2">
                      8. Rate your ability to concentrate (1-10)
                    </label>
                    <input
                      type="range"
                      name="concentrationLevel"
                      min="1"
                      max="10"
                      value={formData.concentrationLevel || 5}
                      onChange={handleInputChange}
                      className="w-full h-2 bg-white/[0.1] rounded-lg appearance-none cursor-pointer slider"
                    />
                    <div className="flex justify-between text-xs text-gray-400 mt-2">
                      <span>Can't focus</span>
                      <span className="text-white font-medium text-base">{formData.concentrationLevel || 5}/10</span>
                      <span>Sharp focus</span>
                    </div>
                  </div>
                </>
              )}

              {/* Feeling Sick specific */}
              {selectedCategory === 'sick' && (
                <>
                  <div>
                    <label className="block text-white font-medium mb-2">
                      6. How do you feel temperature-wise?
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {['Hot/Feverish', 'Cold/Chills', 'Normal', 'Fluctuating'].map((temp) => (
                        <label key={temp} className="relative">
                          <input
                            type="radio"
                            name="temperatureFeeling"
                            value={temp}
                            onChange={handleInputChange}
                            className="sr-only"
                          />
                          <div className={`p-3 rounded-lg border text-center cursor-pointer transition-all ${
                            formData.temperatureFeeling === temp
                              ? 'bg-emerald-500/20 border-emerald-500 text-white'
                              : 'bg-white/[0.03] border-white/[0.08] text-gray-400 hover:border-white/[0.15]'
                          }`}>
                            {temp}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-white font-medium mb-2">
                      7. Are symptoms getting...
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {['Worse', 'Stable', 'Better'].map((progression) => (
                        <label key={progression} className="relative">
                          <input
                            type="radio"
                            name="symptomProgression"
                            value={progression}
                            onChange={handleInputChange}
                            className="sr-only"
                          />
                          <div className={`p-3 rounded-lg border text-center cursor-pointer transition-all ${
                            formData.symptomProgression === progression
                              ? 'bg-emerald-500/20 border-emerald-500 text-white'
                              : 'bg-white/[0.03] border-white/[0.08] text-gray-400 hover:border-white/[0.15]'
                          }`}>
                            {progression}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-white font-medium mb-2">
                      8. Been around anyone sick recently?
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {['Yes', 'No'].map((answer) => (
                        <label key={answer} className="relative">
                          <input
                            type="radio"
                            name="contagiousExposure"
                            value={answer}
                            onChange={(e) => setFormData(prev => ({ 
                              ...prev, 
                              contagiousExposure: e.target.value === 'Yes' 
                            }))}
                            className="sr-only"
                          />
                          <div className={`p-3 rounded-lg border text-center cursor-pointer transition-all ${
                            (formData.contagiousExposure === true && answer === 'Yes') || 
                            (formData.contagiousExposure === false && answer === 'No')
                              ? 'bg-emerald-500/20 border-emerald-500 text-white'
                              : 'bg-white/[0.03] border-white/[0.08] text-gray-400 hover:border-white/[0.15]'
                          }`}>
                            {answer}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Medication Side Effects specific */}
              {selectedCategory === 'medication' && (
                <>
                  <div>
                    <label className="block text-white font-medium mb-2">
                      6. When do symptoms occur after taking medication?
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {['Right after', 'Hours later', 'Random times'].map((timing) => (
                        <label key={timing} className="relative">
                          <input
                            type="radio"
                            name="symptomTiming"
                            value={timing}
                            onChange={handleInputChange}
                            className="sr-only"
                          />
                          <div className={`p-3 rounded-lg border text-center cursor-pointer transition-all ${
                            formData.symptomTiming === timing
                              ? 'bg-emerald-500/20 border-emerald-500 text-white'
                              : 'bg-white/[0.03] border-white/[0.08] text-gray-400 hover:border-white/[0.15]'
                          }`}>
                            {timing}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-white font-medium mb-2">
                      7. Any recent dose changes?
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {['Yes', 'No'].map((answer) => (
                        <label key={answer} className="relative">
                          <input
                            type="radio"
                            name="doseChanges"
                            value={answer}
                            onChange={(e) => setFormData(prev => ({ 
                              ...prev, 
                              doseChanges: e.target.value === 'Yes' 
                            }))}
                            className="sr-only"
                          />
                          <div className={`p-3 rounded-lg border text-center cursor-pointer transition-all ${
                            (formData.doseChanges === true && answer === 'Yes') || 
                            (formData.doseChanges === false && answer === 'No')
                              ? 'bg-emerald-500/20 border-emerald-500 text-white'
                              : 'bg-white/[0.03] border-white/[0.08] text-gray-400 hover:border-white/[0.15]'
                          }`}>
                            {answer}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-white font-medium mb-2">
                      8. How long since you started this medication?
                    </label>
                    <input
                      type="text"
                      name="timeSinceStarted"
                      value={formData.timeSinceStarted || ''}
                      onChange={handleInputChange}
                      placeholder="e.g., 2 weeks, 3 months"
                      className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-emerald-500/50 transition-all"
                    />
                  </div>
                </>
              )}

              {/* Multiple Issues specific */}
              {selectedCategory === 'multiple' && (
                <>
                  <div>
                    <label className="block text-white font-medium mb-2">
                      6. What's your PRIMARY concern?
                    </label>
                    <input
                      type="text"
                      name="primaryConcern"
                      value={formData.primaryConcern || ''}
                      onChange={handleInputChange}
                      placeholder="The issue that bothers you most..."
                      className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-emerald-500/50 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-white font-medium mb-2">
                      7. Do these issues seem connected?
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {['Related', 'Unrelated', 'Unsure'].map((connection) => (
                        <label key={connection} className="relative">
                          <input
                            type="radio"
                            name="symptomConnection"
                            value={connection}
                            onChange={handleInputChange}
                            className="sr-only"
                          />
                          <div className={`p-3 rounded-lg border text-center cursor-pointer transition-all ${
                            formData.symptomConnection === connection
                              ? 'bg-emerald-500/20 border-emerald-500 text-white'
                              : 'bg-white/[0.03] border-white/[0.08] text-gray-400 hover:border-white/[0.15]'
                          }`}>
                            {connection}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-white font-medium mb-2">
                      8. List your other concerns
                    </label>
                    <textarea
                      name="secondaryConcerns"
                      placeholder="Other symptoms or issues you're experiencing..."
                      className="w-full h-20 px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-emerald-500/50 transition-all resize-none"
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        secondaryConcerns: e.target.value.split('\n').filter(c => c.trim()) 
                      }))}
                    />
                  </div>
                </>
              )}

              {/* Unsure specific */}
              {selectedCategory === 'unsure' && (
                <>
                  <div>
                    <label className="block text-white font-medium mb-2">
                      6. What made you seek help today?
                    </label>
                    <textarea
                      name="currentActivity"
                      value={formData.currentActivity || ''}
                      onChange={handleInputChange}
                      placeholder="What happened that made you decide to check your health..."
                      className="w-full h-24 px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-emerald-500/50 transition-all resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-white font-medium mb-2">
                      7. Any recent changes in your life or routine?
                    </label>
                    <textarea
                      name="recentChanges"
                      value={formData.recentChanges || ''}
                      onChange={handleInputChange}
                      placeholder="New job, moved, diet change, stress, etc..."
                      className="w-full h-20 px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-emerald-500/50 transition-all resize-none"
                    />
                  </div>
                </>
              )}
            </>
          )}


          {/* Submit Button */}
          <motion.button
            type="submit"
            disabled={!formData.symptoms.trim() || !formData.duration || isSubmitting}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`w-full py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
              formData.symptoms.trim() && formData.duration && !isSubmitting
                ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white hover:from-emerald-600 hover:to-green-600'
                : 'bg-gray-800 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Analyzing...
              </>
            ) : (
              'Submit for Analysis'
            )}
          </motion.button>
        </form>
      </motion.div>
      </>
    )
  }

  // Deep Dive Form (multi-step)
  if (mode === 'deep') {
    const selectedCategoryData = categories.find(c => c.id === selectedCategory)
    const Icon = selectedCategoryData?.icon || HelpCircle

    return (
      <>
        <ErrorAlert error={error} onClose={() => setError(null)} />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto p-6"
      >
        <form onSubmit={handleDeepSubmit} className="space-y-6">
          {/* Header with progress */}
          <div className="text-center mb-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-r from-indigo-500/20 to-purple-500/20 mb-3"
            >
              <Icon className="w-6 h-6 text-indigo-400" />
            </motion.div>
            <h2 className="text-2xl font-bold text-white mb-1">Deep {selectedCategoryData?.label} Assessment</h2>
            <p className="text-gray-400 text-sm">Comprehensive evaluation - Step {currentStep} of 3</p>
            
            {/* Progress bar */}
            <div className="flex gap-2 justify-center mt-4">
              {[1, 2, 3].map((step) => (
                <div
                  key={step}
                  className={`h-1 w-20 rounded-full transition-all ${
                    step <= currentStep ? 'bg-indigo-500' : 'bg-gray-700'
                  }`}
                />
              ))}
            </div>
          </div>

          <AnimatePresence mode="wait">
            {/* Step 1: Basic Information (same as quick scan) */}
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {/* Copy the quick scan fields here */}
                {/* 1. Describe what's happening */}
                <div>
                  <label className="block text-white font-medium mb-2">
                    Describe your symptoms in detail
                  </label>
                  <textarea
                    name="symptoms"
                    value={formData.symptoms}
                    onChange={handleInputChange}
                    placeholder={`Tell us everything about your ${selectedCategoryData?.label.toLowerCase()} concerns...`}
                    className="w-full h-32 px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-indigo-500/50 transition-all resize-none"
                    required
                  />
                </div>

                {/* Duration */}
                <div>
                  <label className="block text-white font-medium mb-2">
                    How long has this been going on?
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                    {['Today', 'Few days', '1-2 weeks', 'Month+', 'Longer'].map((option) => (
                      <label key={option} className="relative">
                        <input
                          type="radio"
                          name="duration"
                          value={option}
                          checked={formData.duration === option}
                          onChange={handleInputChange}
                          className="sr-only"
                        />
                        <div className={`p-3 rounded-lg border text-center cursor-pointer transition-all ${
                          formData.duration === option
                            ? 'bg-indigo-500/20 border-indigo-500 text-white'
                            : 'bg-white/[0.03] border-white/[0.08] text-gray-400 hover:border-white/[0.15]'
                        }`}>
                          {option}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Impact Level */}
                <div>
                  <label className="block text-white font-medium mb-2">
                    Impact on daily life
                  </label>
                  <div className="relative">
                    <input
                      type="range"
                      name="impactLevel"
                      min="1"
                      max="10"
                      value={formData.impactLevel}
                      onChange={handleInputChange}
                      className="w-full h-2 bg-white/[0.1] rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-gray-400 mt-2">
                      <span>Minimal</span>
                      <span className="text-white font-medium text-base">{formData.impactLevel}/10</span>
                      <span>Severe</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 2: Detailed Context */}
            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {/* Timeline */}
                <div>
                  <label className="block text-white font-medium mb-2">
                    Describe how symptoms have changed over time
                  </label>
                  <textarea
                    name="symptomVariation"
                    value={formData.symptomVariation || ''}
                    onChange={handleInputChange}
                    placeholder="Started gradually... got worse when... better in the mornings..."
                    className="w-full h-24 px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-indigo-500/50 transition-all resize-none"
                  />
                </div>


                {/* Aggravating and alleviating factors */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white font-medium mb-2">
                      What makes it worse?
                    </label>
                    <div className="space-y-2">
                      {aggravatingOptions.map((option) => (
                        <label key={option} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={formData.aggravatingFactors.includes(option)}
                            onChange={() => handleCheckboxChange('aggravatingFactors', option)}
                            className="w-4 h-4 rounded border-gray-600 text-indigo-500"
                          />
                          <span className="text-gray-300 text-sm">{option}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-white font-medium mb-2">
                      What have you tried?
                    </label>
                    <div className="space-y-2">
                      {interventionOptions.map((option) => (
                        <label key={option} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={formData.triedInterventions.includes(option)}
                            onChange={() => handleCheckboxChange('triedInterventions', option)}
                            className="w-4 h-4 rounded border-gray-600 text-indigo-500"
                          />
                          <span className="text-gray-300 text-sm">{option}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Category-specific deep dive questions */}
                {selectedCategory && (
                  <div className="space-y-4 mt-6">
                    <h4 className="text-white font-medium">Additional Information</h4>
                    
                    {selectedCategory === 'energy' && (
                      <>
                        <div>
                          <label className="block text-gray-300 text-sm mb-2">
                            Describe your energy crashes in detail
                          </label>
                          <textarea
                            name="crashDescription"
                            placeholder="When they happen, how they feel, how long they last..."
                            className="w-full h-20 px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-indigo-500/50 transition-all resize-none"
                          />
                        </div>
                        <div>
                          <label className="block text-gray-300 text-sm mb-2">
                            What activities are most affected?
                          </label>
                          <input
                            type="text"
                            name="affectedActivities"
                            placeholder="Work, exercise, social activities, etc..."
                            className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-indigo-500/50 transition-all"
                          />
                        </div>
                      </>
                    )}

                    {selectedCategory === 'mental' && (
                      <>
                        <div>
                          <label className="block text-gray-300 text-sm mb-2">
                            How are your symptoms affecting relationships?
                          </label>
                          <textarea
                            name="relationshipImpact"
                            placeholder="Impact on family, friends, work relationships..."
                            className="w-full h-20 px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-indigo-500/50 transition-all resize-none"
                          />
                        </div>
                        <div>
                          <label className="block text-gray-300 text-sm mb-2">
                            What thoughts keep recurring?
                          </label>
                          <textarea
                            name="recurringThoughts"
                            placeholder="Worries, fears, or thoughts that won't go away..."
                            className="w-full h-20 px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-indigo-500/50 transition-all resize-none"
                          />
                        </div>
                      </>
                    )}

                    {selectedCategory === 'sick' && (
                      <>
                        <div>
                          <label className="block text-gray-300 text-sm mb-2">
                            Any unusual symptoms beyond the main ones?
                          </label>
                          <textarea
                            name="unusualSymptoms"
                            placeholder="Anything that seems odd or different from usual illnesses..."
                            className="w-full h-20 px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-indigo-500/50 transition-all resize-none"
                          />
                        </div>
                        <div>
                          <label className="block text-gray-300 text-sm mb-2">
                            How's your appetite and thirst?
                          </label>
                          <input
                            type="text"
                            name="appetiteThirst"
                            placeholder="Normal, increased, decreased, etc..."
                            className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-indigo-500/50 transition-all"
                          />
                        </div>
                      </>
                    )}

                    {selectedCategory === 'medication' && (
                      <>
                        <div>
                          <label className="block text-gray-300 text-sm mb-2">
                            What specific side effects are you experiencing?
                          </label>
                          <textarea
                            name="specificSideEffects"
                            placeholder="List all side effects you've noticed..."
                            className="w-full h-20 px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-indigo-500/50 transition-all resize-none"
                          />
                        </div>
                        <div>
                          <label className="block text-gray-300 text-sm mb-2">
                            How are you taking the medication?
                          </label>
                          <input
                            type="text"
                            name="medicationSchedule"
                            placeholder="With food, time of day, frequency..."
                            className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-indigo-500/50 transition-all"
                          />
                        </div>
                      </>
                    )}

                    {selectedCategory === 'multiple' && (
                      <>
                        <div>
                          <label className="block text-gray-300 text-sm mb-2">
                            Which symptom appeared first?
                          </label>
                          <input
                            type="text"
                            name="firstSymptom"
                            placeholder="Describe the initial problem..."
                            className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-indigo-500/50 transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-gray-300 text-sm mb-2">
                            How did other symptoms develop?
                          </label>
                          <textarea
                            name="symptomDevelopment"
                            placeholder="Timeline of how symptoms appeared..."
                            className="w-full h-20 px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-indigo-500/50 transition-all resize-none"
                          />
                        </div>
                      </>
                    )}

                    {selectedCategory === 'unsure' && (
                      <>
                        <div>
                          <label className="block text-gray-300 text-sm mb-2">
                            What's your biggest health worry right now?
                          </label>
                          <textarea
                            name="biggestWorry"
                            placeholder="What concerns you most about how you're feeling..."
                            className="w-full h-20 px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-indigo-500/50 transition-all resize-none"
                          />
                        </div>
                        <div>
                          <label className="block text-gray-300 text-sm mb-2">
                            What would "feeling better" look like to you?
                          </label>
                          <input
                            type="text"
                            name="feelingBetter"
                            placeholder="Describe what improvement would mean..."
                            className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-indigo-500/50 transition-all"
                          />
                        </div>
                      </>
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {/* Step 3: Goals & Current State */}
            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >


                {/* Functional impact */}
                <div>
                  <label className="block text-white font-medium mb-2">
                    What activities are being affected?
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      'Work/School',
                      'Exercise/Sports',
                      'Social activities',
                      'Household tasks',
                      'Sleep',
                      'Eating',
                      'Hobbies',
                      'Self-care'
                    ].map((activity) => (
                      <label key={activity} className="flex items-center gap-2 p-3 bg-white/[0.03] border border-white/[0.08] rounded-lg hover:border-white/[0.15] cursor-pointer transition-all">
                        <input
                          type="checkbox"
                          checked={formData.functionalImpact?.includes(activity) || false}
                          onChange={() => handleCheckboxChange('functionalImpact', activity)}
                          className="w-4 h-4 rounded border-gray-600 text-indigo-500"
                        />
                        <span className="text-gray-300 text-sm">{activity}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* What would help */}
                <div>
                  <label className="block text-white font-medium mb-2">
                    What do you think would help most right now?
                  </label>
                  <textarea
                    name="whatWouldHelp"
                    placeholder="Rest, medication, lifestyle changes, seeing a specialist..."
                    className="w-full h-20 px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-indigo-500/50 transition-all resize-none"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="flex gap-4">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={() => setCurrentStep(currentStep - 1)}
                className="flex-1 py-3 rounded-xl border border-white/[0.08] text-white hover:bg-white/[0.03] transition-all"
              >
                Previous
              </button>
            )}
            
            <motion.button
              type="submit"
              disabled={isSubmitting || (currentStep === 1 && (!formData.symptoms.trim() || !formData.duration))}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`flex-1 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                isSubmitting || (currentStep === 1 && (!formData.symptoms.trim() || !formData.duration))
                  ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-600 hover:to-purple-600'
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Starting Deep Dive...
                </>
              ) : currentStep < 3 ? (
                'Next Step'
              ) : (
                'Begin Deep Analysis'
              )}
            </motion.button>
          </div>
        </form>
      </motion.div>
      </>
    )
  }

  return null
}

// Add custom styles for the range slider
const styles = `
  <style jsx global>{\`
    input[type="range"]::-webkit-slider-thumb {
      appearance: none;
      width: 20px;
      height: 20px;
      background: linear-gradient(to right, #10b981, #22c55e);
      border-radius: 50%;
      cursor: pointer;
    }
    
    input[type="range"]::-moz-range-thumb {
      width: 20px;
      height: 20px;
      background: linear-gradient(to right, #10b981, #22c55e);
      border-radius: 50%;
      cursor: pointer;
      border: none;
    }
  \`}</style>
`
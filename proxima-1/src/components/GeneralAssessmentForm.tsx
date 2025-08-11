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
  AlertCircle,
  Moon,
  User,
  Wind,
  Zap,
  Circle,
  Stethoscope
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { generalAssessmentClient } from '@/lib/general-assessment-client'
import ErrorAlert from './ErrorAlert'
import Tooltip from '@/components/ui/Tooltip'

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
  
  // Universal additional questions
  hadBefore?: string // never/once/multiple/chronic
  progression?: string // worse/better/same/variable
  
  // Category-specific fields
  // Energy & Fatigue
  energyPattern?: string
  energyPattern_other?: string
  sleepHours?: string
  wakingUpFeeling?: string
  energyCrashes?: string
  exerciseCapability?: string
  unexplainedWeightLoss?: boolean
  nightSweats?: boolean
  
  // Mental Health
  mainMentalIssue?: string
  mainMentalIssue_other?: string
  moodPattern?: string
  sleepAffected?: string
  appetiteChange?: string
  concentrationLevel?: number
  triggerEvents?: string
  triggerEvents_other?: string
  selfHarmThoughts?: boolean
  familyHistory?: boolean
  
  // Digestive Issues
  mainDigestive?: string
  mainDigestive_other?: string
  digestiveLocation?: string
  digestiveTiming?: string
  digestiveTiming_other?: string
  bowelChanges?: string
  foodTriggers?: string
  foodTriggers_other?: string
  digestiveBlood?: boolean
  digestiveWeightLoss?: boolean
  
  // Sleep Problems
  mainSleepProblem?: string
  mainSleepProblem_other?: string
  timeToSleep?: string
  wakeUpsPerNight?: string
  sleepQuality?: string
  daytimeSleepiness?: string
  sleepEnvironment?: string
  sleepEnvironment_other?: string
  snoring?: boolean
  sleepDriving?: boolean
  
  // Feeling Sick
  sickSymptoms?: string[]
  temperatureFeeling?: string
  symptomProgression?: string
  sickDuration?: string
  contagiousExposure?: boolean
  
  // Skin & Hair
  skinMainIssue?: string
  skinMainIssue_other?: string
  skinDuration?: string
  skinLocation?: string
  skinSpread?: boolean
  skinItchy?: boolean
  
  // Breathing & Chest
  breathingMain?: string
  breathingMain_other?: string
  breathingWhen?: string
  chestPain?: boolean
  breathingUrgent?: boolean
  
  // Hormonal/Reproductive
  hormonalMain?: string
  hormonalMain_other?: string
  periodChanges?: string
  hormonalSymptoms?: string[]
  
  // Neurological
  neuroMain?: string
  neuroMain_other?: string
  headacheType?: string
  neuroSymptoms?: string[]
  neuroTriggers?: string
  
  // Medication Side Effects
  medicationName?: string
  timeSinceStarted?: string
  doseChanges?: boolean
  symptomTiming?: string
  sideEffectSeverity?: string
  
  // Physical Pain
  bodyRegion?: string
  issueType?: string
  issueType_other?: string
  occurrencePattern?: string
  affectedSide?: string
  radiatingPain?: boolean
  specificMovements?: string
  painKillerQuestion?: boolean
  
  // Multiple Issues
  primaryConcern?: string
  secondaryConcerns?: string[]
  symptomConnection?: string
  firstSymptom?: string
  
  // Not Sure
  currentActivity?: string
  recentChanges?: string
  biggestWorry?: string
  feelingBetter?: string
}

// Enhanced categories with icons and descriptions
const categories = [
  // Main 9 - always visible
  { id: 'energy', label: 'Energy & Fatigue', icon: Battery, color: 'from-yellow-500 to-orange-500', description: 'Tired, exhausted, no energy' },
  { id: 'mental', label: 'Mental Health', icon: Brain, color: 'from-purple-500 to-pink-500', description: 'Mood, anxiety, focus issues' },
  { id: 'digestive', label: 'Digestive Issues', icon: Stethoscope, color: 'from-green-500 to-emerald-500', description: 'Stomach, bowel, eating problems' },
  { id: 'sick', label: 'Feeling Sick', icon: Heart, color: 'from-red-500 to-pink-500', description: 'Fever, flu-like symptoms' },
  { id: 'sleep', label: 'Sleep Problems', icon: Moon, color: 'from-indigo-500 to-blue-500', description: 'Insomnia, poor sleep quality' },
  { id: 'skin', label: 'Skin & Hair', icon: User, color: 'from-pink-500 to-rose-500', description: 'Rashes, hair loss, skin changes' },
  { id: 'breathing', label: 'Breathing & Chest', icon: Wind, color: 'from-cyan-500 to-blue-500', description: 'Shortness of breath, chest issues' },
  { id: 'hormonal', label: 'Hormonal/Cycles', icon: Circle, color: 'from-purple-500 to-pink-500', description: 'Periods, hormonal changes' },
  { id: 'neurological', label: 'Head & Neuro', icon: Zap, color: 'from-amber-500 to-orange-500', description: 'Headaches, dizziness, numbness' },
  
  // Show more - 3 additional
  { id: 'medication', label: 'Medicine Effects', icon: Pill, color: 'from-blue-500 to-cyan-500', description: 'Side effects from medications' },
  { id: 'physical', label: 'Physical Pain', icon: Activity, color: 'from-red-500 to-rose-500', description: 'Body pain, injuries' },
  { id: 'unsure', label: 'Not Sure', icon: HelpCircle, color: 'from-gray-500 to-gray-600', description: 'Help me figure it out' }
]

const aggravatingOptions = [
  'Stress', 'Poor sleep', 'Certain foods', 
  'Physical activity', 'Weather changes', 'Time of day',
  'Work/School', 'Medications', 'None/Not sure'
]

const interventionOptions = [
  'Rest', 'Over-the-counter meds', 'Changed diet',
  'Exercise more/less', 'Relaxation techniques', 'Hot/cold therapy',
  'Stretching', 'Hydration', 'Nothing yet'
]

const placeholderExamples = [
  "I've been feeling exhausted for the past two weeks...",
  "My anxiety has been getting worse lately...",
  "I think I might be getting sick, I have a fever and...",
  "Something feels off but I can't quite explain it...",
  "Ever since I started this new medication, I've been...",
  "I've been having trouble sleeping and it's affecting..."
]

// Enhanced Radio Button Component
const RadioCard = ({ name, value, checked, onChange, label, description, icon: Icon }: any) => (
  <label className="relative cursor-pointer group">
    <input
      type="radio"
      name={name}
      value={value}
      checked={checked}
      onChange={onChange}
      className="sr-only peer"
    />
    <div className="
      relative px-4 py-3 rounded-xl border-2 transition-all duration-200
      bg-[#0a0a0a] border-white/[0.06]
      group-hover:bg-white/[0.02] group-hover:border-white/[0.1] group-hover:shadow-[0_0_30px_rgba(255,255,255,0.03)]
      peer-checked:bg-gradient-to-br peer-checked:from-emerald-500/[0.08] peer-checked:to-green-500/[0.05]
      peer-checked:border-emerald-500/40 peer-checked:shadow-[0_0_30px_rgba(16,185,129,0.15)]
    ">
      {Icon && (
        <div className="w-8 h-8 rounded-lg bg-white/[0.03] flex items-center justify-center mb-2 group-hover:bg-white/[0.05] peer-checked:bg-emerald-500/10">
          <Icon className="w-4 h-4 text-gray-400 peer-checked:text-emerald-400" />
        </div>
      )}
      <div className="text-sm font-medium text-gray-300 peer-checked:text-white">
        {label}
      </div>
      {description && (
        <div className="text-xs text-gray-500 mt-1 peer-checked:text-gray-400">
          {description}
        </div>
      )}
      <div className="absolute top-2 right-2 opacity-0 peer-checked:opacity-100 transition-opacity">
        <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      </div>
    </div>
  </label>
)

// Enhanced Checkbox Component
const CheckboxCard = ({ checked, onChange, label }: any) => (
  <label className="
    relative flex items-center gap-3 p-3 rounded-xl cursor-pointer group
    bg-white/[0.02] border border-white/[0.06]
    hover:bg-white/[0.04] hover:border-white/[0.1] transition-all
    has-[:checked]:bg-emerald-500/[0.08] has-[:checked]:border-emerald-500/30
  ">
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      className="w-4 h-4 rounded bg-white/[0.05] border-gray-600 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-0"
    />
    <span className="text-sm text-gray-300 group-hover:text-white">
      {label}
    </span>
  </label>
)

export default function GeneralAssessmentForm({ mode, onComplete, userGender = 'male' }: GeneralAssessmentFormProps) {
  const router = useRouter()
  const { user } = useAuth()
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [showCategoryModal, setShowCategoryModal] = useState(mode !== 'flash')
  const [showMoreCategories, setShowMoreCategories] = useState(false)
  const [showAdvancedQuestions, setShowAdvancedQuestions] = useState(false)
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

  const handleCheckboxChange = (field: string, value: string) => {
    setFormData(prev => {
      const currentArray = (prev as any)[field] || []
      const updated = currentArray.includes(value) 
        ? currentArray.filter((v: string) => v !== value)
        : [...currentArray, value]
      return { ...prev, [field]: updated }
    })
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
    
    setIsSubmitting(true)
    await onComplete({
      mode: 'deep',
      category: selectedCategory,
      formData: formData
    })
  }

  // Flash Assessment
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

  // Category Selection Modal - Enhanced
  if (showCategoryModal) {
    return (
      <>
        <ErrorAlert error={error} onClose={() => setError(null)} />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="max-w-5xl mx-auto p-6"
        >
          <div className="text-center mb-8">
            <h2 className="text-2xl font-semibold text-white mb-2">What's bothering you?</h2>
            <p className="text-gray-400">Select the category that best fits your symptoms</p>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-4">
            {categories.slice(0, 9).map((category) => {
              const Icon = category.icon
              return (
                <motion.button
                  key={category.id}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleCategorySelect(category.id)}
                  className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.08] hover:bg-white/[0.04] hover:border-white/[0.1] transition-all group"
                >
                  <Icon className="w-6 h-6 mb-2 mx-auto text-gray-400 group-hover:text-white transition-colors" />
                  <p className="text-sm font-medium text-gray-300 group-hover:text-white mb-1">
                    {category.label}
                  </p>
                  <p className="text-xs text-gray-500 group-hover:text-gray-400">
                    {category.description}
                  </p>
                </motion.button>
              )
            })}
          </div>

          {!showMoreCategories ? (
            <button 
              onClick={() => setShowMoreCategories(true)}
              className="w-full py-3 text-gray-400 hover:text-white transition-colors flex items-center justify-center gap-2"
            >
              Show more options
              <ChevronDown className="w-4 h-4" />
            </button>
          ) : (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="grid grid-cols-3 gap-3"
            >
              {categories.slice(9).map((category) => {
                const Icon = category.icon
                return (
                  <motion.button
                    key={category.id}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleCategorySelect(category.id)}
                    className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.08] hover:bg-white/[0.04] hover:border-white/[0.1] transition-all group"
                  >
                    <Icon className="w-6 h-6 mb-2 mx-auto text-gray-400 group-hover:text-white transition-colors" />
                    <p className="text-sm font-medium text-gray-300 group-hover:text-white mb-1">
                      {category.label}
                    </p>
                    <p className="text-xs text-gray-500 group-hover:text-gray-400">
                      {category.description}
                    </p>
                  </motion.button>
                )
              })}
            </motion.div>
          )}
        </motion.div>
      </>
    )
  }

  // Quick Scan Form - Enhanced
  if (mode === 'quick') {
    const selectedCategoryData = categories.find(c => c.id === selectedCategory)
    const Icon = selectedCategoryData?.icon || HelpCircle

    return (
      <>
        <ErrorAlert error={error} onClose={() => setError(null)} />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto p-6"
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

          {/* Core Questions - Same for all categories */}
          <div className="space-y-6">
            {/* 1. Describe symptoms */}
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

            {/* 2. Duration */}
            <div>
              <label className="block text-white font-medium mb-3">
                2. How long has this been going on?
              </label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {['Today', 'Few days', '1-2 weeks', 'Month+', 'Longer'].map((option) => (
                  <RadioCard
                    key={option}
                    name="duration"
                    value={option}
                    checked={formData.duration === option}
                    onChange={handleInputChange}
                    label={option}
                  />
                ))}
              </div>
            </div>

            {/* 3. Impact Level - Enhanced */}
            <div>
              <label className="block text-white font-medium mb-3">
                3. How much is this affecting your life?
              </label>
              <div className="relative bg-white/[0.02] rounded-xl p-6 border border-white/[0.06]">
                <input
                  type="range"
                  name="impactLevel"
                  min="1"
                  max="10"
                  value={formData.impactLevel}
                  onChange={handleInputChange}
                  className="w-full h-2 bg-white/[0.05] rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, 
                      rgba(16,185,129,0.3) 0%, 
                      rgba(16,185,129,0.3) ${formData.impactLevel * 10}%, 
                      rgba(255,255,255,0.05) ${formData.impactLevel * 10}%, 
                      rgba(255,255,255,0.05) 100%)`
                  }}
                />
                <div className="flex justify-between mt-4">
                  <span className={`text-2xl transition-all ${formData.impactLevel <= 2 ? 'scale-125' : 'opacity-40'}`}>😊</span>
                  <span className={`text-2xl transition-all ${formData.impactLevel > 2 && formData.impactLevel <= 4 ? 'scale-125' : 'opacity-40'}`}>😐</span>
                  <span className={`text-2xl transition-all ${formData.impactLevel > 4 && formData.impactLevel <= 6 ? 'scale-125' : 'opacity-40'}`}>😕</span>
                  <span className={`text-2xl transition-all ${formData.impactLevel > 6 && formData.impactLevel <= 8 ? 'scale-125' : 'opacity-40'}`}>😣</span>
                  <span className={`text-2xl transition-all ${formData.impactLevel > 8 ? 'scale-125' : 'opacity-40'}`}>😖</span>
                </div>
                <div className="text-center mt-3">
                  <span className="text-3xl font-bold text-white">{formData.impactLevel}</span>
                  <span className="text-gray-400 text-sm ml-1">/ 10</span>
                </div>
              </div>
            </div>

            {/* Category-Specific Questions */}
            {renderCategorySpecificQuestions()}

            {/* Universal Additional Questions */}
            <div>
              <label className="block text-white font-medium mb-3">
                Have you had this before?
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {['Never', 'Once', 'Multiple times', 'Chronic issue'].map((option) => (
                  <RadioCard
                    key={option}
                    name="hadBefore"
                    value={option}
                    checked={formData.hadBefore === option}
                    onChange={handleInputChange}
                    label={option}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-white font-medium mb-3">
                Is this getting:
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {['Worse', 'Better', 'Staying same', 'Variable'].map((option) => (
                  <RadioCard
                    key={option}
                    name="progression"
                    value={option}
                    checked={formData.progression === option}
                    onChange={handleInputChange}
                    label={option}
                  />
                ))}
              </div>
            </div>

            {/* What makes it worse */}
            <div>
              <label className="block text-white font-medium mb-3">
                What makes it worse? (check all that apply)
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {aggravatingOptions.map((option) => (
                  <CheckboxCard
                    key={option}
                    checked={formData.aggravatingFactors.includes(option)}
                    onChange={() => handleCheckboxChange('aggravatingFactors', option)}
                    label={option}
                  />
                ))}
              </div>
            </div>

            {/* What have you tried */}
            <div>
              <label className="block text-white font-medium mb-3">
                What have you tried? (check all that apply)
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {interventionOptions.map((option) => (
                  <CheckboxCard
                    key={option}
                    checked={formData.triedInterventions.includes(option)}
                    onChange={() => handleCheckboxChange('triedInterventions', option)}
                    label={option}
                  />
                ))}
              </div>
            </div>

            {/* Advanced Questions Section */}
            <div className="mt-6 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <button
                type="button"
                onClick={() => setShowAdvancedQuestions(!showAdvancedQuestions)}
                className="w-full flex items-center justify-between text-left"
              >
                <span className="text-gray-300 font-medium">Additional questions for better accuracy</span>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showAdvancedQuestions ? 'rotate-180' : ''}`} />
              </button>
              
              {showAdvancedQuestions && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mt-4 space-y-4"
                >
                  {renderAdvancedQuestions()}
                </motion.div>
              )}
            </div>
          </div>

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

  // Deep Dive Form (keeping existing structure with enhancements)
  if (mode === 'deep') {
    const selectedCategoryData = categories.find(c => c.id === selectedCategory)
    const Icon = selectedCategoryData?.icon || HelpCircle

    return (
      <>
        <ErrorAlert error={error} onClose={() => setError(null)} />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl mx-auto p-6"
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
            {/* Step content would go here - similar structure to existing deep dive */}
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

  // Helper functions for rendering category-specific questions
  function renderCategorySpecificQuestions() {
    switch(selectedCategory) {
      case 'energy':
        return (
          <>
            <div>
              <label className="block text-white font-medium mb-3">
                When is your energy lowest?
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {['Morning', 'Afternoon', 'Evening', 'All day', 'After meals', 'Other'].map((option) => (
                  <RadioCard
                    key={option}
                    name="energyPattern"
                    value={option}
                    checked={formData.energyPattern === option}
                    onChange={handleInputChange}
                    label={option}
                  />
                ))}
              </div>
              {formData.energyPattern === 'Other' && (
                <motion.input
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  type="text"
                  name="energyPattern_other"
                  placeholder="Please describe..."
                  className="mt-2 w-full px-4 py-2.5 bg-white/[0.02] border border-white/[0.08] rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-emerald-500/50"
                  onChange={handleInputChange}
                />
              )}
            </div>

            <div>
              <label className="block text-white font-medium mb-3">
                How do you wake up feeling?
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['Refreshed', 'Tired', 'Exhausted'].map((option) => (
                  <RadioCard
                    key={option}
                    name="wakingUpFeeling"
                    value={option}
                    checked={formData.wakingUpFeeling === option}
                    onChange={handleInputChange}
                    label={option}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-white font-medium mb-3">
                How many hours of sleep do you get?
              </label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {['<6', '6-7', '7-8', '8-9', '9+'].map((option) => (
                  <RadioCard
                    key={option}
                    name="sleepHours"
                    value={option}
                    checked={formData.sleepHours === option}
                    onChange={handleInputChange}
                    label={option + ' hours'}
                  />
                ))}
              </div>
            </div>
          </>
        )

      case 'mental':
        return (
          <>
            <div>
              <label className="block text-white font-medium mb-3">
                What's the main issue?
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {['Anxiety', 'Depression', 'Both', 'Mood swings', 'Focus issues', 'Panic', 'Other'].map((option) => (
                  <RadioCard
                    key={option}
                    name="mainMentalIssue"
                    value={option}
                    checked={formData.mainMentalIssue === option}
                    onChange={handleInputChange}
                    label={option}
                  />
                ))}
              </div>
              {formData.mainMentalIssue === 'Other' && (
                <motion.input
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  type="text"
                  name="mainMentalIssue_other"
                  placeholder="Please describe..."
                  className="mt-2 w-full px-4 py-2.5 bg-white/[0.02] border border-white/[0.08] rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-emerald-500/50"
                  onChange={handleInputChange}
                />
              )}
            </div>

            <div>
              <label className="block text-white font-medium mb-3">
                How's your mood pattern?
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {['Stable', 'Up and down', 'Getting worse', 'Unpredictable'].map((option) => (
                  <RadioCard
                    key={option}
                    name="moodPattern"
                    value={option}
                    checked={formData.moodPattern === option}
                    onChange={handleInputChange}
                    label={option}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-white font-medium mb-3">
                Rate your concentration ability
              </label>
              <input
                type="range"
                name="concentrationLevel"
                min="1"
                max="10"
                value={formData.concentrationLevel || 5}
                onChange={handleInputChange}
                className="w-full h-2 bg-white/[0.1] rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-2">
                <span>Can't focus</span>
                <span className="text-white font-medium text-base">{formData.concentrationLevel || 5}/10</span>
                <span>Sharp focus</span>
              </div>
            </div>
          </>
        )

      case 'digestive':
        return (
          <>
            <div>
              <label className="block text-white font-medium mb-3">
                Main digestive issue?
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {['Pain', 'Nausea', 'Diarrhea', 'Constipation', 'Bloating', 'Heartburn', 'Vomiting', 'Other'].map((option) => (
                  <RadioCard
                    key={option}
                    name="mainDigestive"
                    value={option}
                    checked={formData.mainDigestive === option}
                    onChange={handleInputChange}
                    label={option}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-white font-medium mb-3">
                When does it happen?
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {['Before eating', 'After eating', 'Empty stomach', 'All the time', 'Random', 'Other'].map((option) => (
                  <RadioCard
                    key={option}
                    name="digestiveTiming"
                    value={option}
                    checked={formData.digestiveTiming === option}
                    onChange={handleInputChange}
                    label={option}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-white font-medium mb-3 text-red-400">
                Red flag check: Any blood, black stools, or severe pain?
              </label>
              <div className="grid grid-cols-2 gap-2">
                {['Yes', 'No'].map((option) => (
                  <RadioCard
                    key={option}
                    name="digestiveBlood"
                    value={option}
                    checked={formData.digestiveBlood === (option === 'Yes')}
                    onChange={(e: any) => setFormData(prev => ({ ...prev, digestiveBlood: e.target.value === 'Yes' }))}
                    label={option}
                  />
                ))}
              </div>
            </div>
          </>
        )

      case 'sleep':
        return (
          <>
            <div>
              <label className="block text-white font-medium mb-3">
                Main sleep problem?
              </label>
              <div className="grid grid-cols-2 gap-2">
                {['Can\'t fall asleep', 'Wake up often', 'Wake too early', 'Never feel rested', 'Nightmares', 'Other'].map((option) => (
                  <RadioCard
                    key={option}
                    name="mainSleepProblem"
                    value={option}
                    checked={formData.mainSleepProblem === option}
                    onChange={handleInputChange}
                    label={option}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-white font-medium mb-3">
                Time to fall asleep?
              </label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {['<15min', '15-30min', '30-60min', '1-2hr', '2+hr'].map((option) => (
                  <RadioCard
                    key={option}
                    name="timeToSleep"
                    value={option}
                    checked={formData.timeToSleep === option}
                    onChange={handleInputChange}
                    label={option}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-white font-medium mb-3">
                How many good nights of sleep per week?
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {['0-1', '2-3', '4-5', '6-7'].map((option) => (
                  <RadioCard
                    key={option}
                    name="sleepQuality"
                    value={option}
                    checked={formData.sleepQuality === option}
                    onChange={handleInputChange}
                    label={option + ' nights'}
                  />
                ))}
              </div>
            </div>
          </>
        )

      // Add more cases for other categories...
      default:
        return null
    }
  }

  function renderAdvancedQuestions() {
    switch(selectedCategory) {
      case 'energy':
        return (
          <>
            <div>
              <label className="block text-gray-300 text-sm mb-2">
                Can you exercise for 10 minutes if you had to?
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {['Yes easily', 'With difficulty', 'Maybe', 'No way'].map((option) => (
                  <RadioCard
                    key={option}
                    name="exerciseCapability"
                    value={option}
                    checked={formData.exerciseCapability === option}
                    onChange={handleInputChange}
                    label={option}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-gray-300 text-sm mb-2">
                Any unexplained weight loss?
              </label>
              <div className="grid grid-cols-2 gap-2">
                {['Yes', 'No'].map((option) => (
                  <RadioCard
                    key={option}
                    name="unexplainedWeightLoss"
                    value={option}
                    checked={formData.unexplainedWeightLoss === (option === 'Yes')}
                    onChange={(e: any) => setFormData(prev => ({ ...prev, unexplainedWeightLoss: e.target.value === 'Yes' }))}
                    label={option}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-gray-300 text-sm mb-2">
                Night sweats or fever?
              </label>
              <div className="grid grid-cols-2 gap-2">
                {['Yes', 'No'].map((option) => (
                  <RadioCard
                    key={option}
                    name="nightSweats"
                    value={option}
                    checked={formData.nightSweats === (option === 'Yes')}
                    onChange={(e: any) => setFormData(prev => ({ ...prev, nightSweats: e.target.value === 'Yes' }))}
                    label={option}
                  />
                ))}
              </div>
            </div>
          </>
        )

      case 'mental':
        return (
          <>
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <label className="block text-red-400 text-sm mb-2">
                Any thoughts of self-harm?
              </label>
              <div className="grid grid-cols-2 gap-2">
                {['Yes', 'No'].map((option) => (
                  <RadioCard
                    key={option}
                    name="selfHarmThoughts"
                    value={option}
                    checked={formData.selfHarmThoughts === (option === 'Yes')}
                    onChange={(e: any) => setFormData(prev => ({ ...prev, selfHarmThoughts: e.target.value === 'Yes' }))}
                    label={option}
                  />
                ))}
              </div>
              {formData.selfHarmThoughts && (
                <div className="mt-3 text-xs text-red-400">
                  Please reach out for help: Call 988 (Suicide & Crisis Lifeline) or text "HELLO" to 741741
                </div>
              )}
            </div>

            <div>
              <label className="block text-gray-300 text-sm mb-2">
                Family history of mental health issues?
              </label>
              <div className="grid grid-cols-2 gap-2">
                {['Yes', 'No'].map((option) => (
                  <RadioCard
                    key={option}
                    name="familyHistory"
                    value={option}
                    checked={formData.familyHistory === (option === 'Yes')}
                    onChange={(e: any) => setFormData(prev => ({ ...prev, familyHistory: e.target.value === 'Yes' }))}
                    label={option}
                  />
                ))}
              </div>
            </div>
          </>
        )

      // Add more cases for other categories...
      default:
        return null
    }
  }

  return null
}
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
  // Energy & Sleep (combined category)
  fatigueSeverity?: string
  activityCapacity?: string
  associatedSymptoms?: string[]
  specificActivitiesAffected?: string
  energyPattern?: string
  energyPattern_other?: string
  sleepHours?: string
  wakingUpFeeling?: string
  energyCrashes?: string
  exerciseCapability?: string
  unexplainedWeightLoss?: boolean
  nightSweats?: boolean
  
  // Mental Health
  mainDifficulty?: string[]
  symptomDescription?: string
  mainStruggle?: string[]
  durationPattern?: string
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
  primaryDigestiveSymptom?: string
  bowelPattern?: string
  timingRelationToFood?: string
  foodTriggers?: string[]
  associatedGISymptoms?: string[]
  mainDigestive?: string
  mainDigestive_other?: string
  digestiveLocation?: string
  digestiveTiming?: string
  digestiveTiming_other?: string
  bowelChanges?: string
  foodTriggers_old?: string
  foodTriggers_other?: string
  digestiveBlood?: boolean
  digestiveWeightLoss?: boolean
  
  // Feeling Sick
  onsetSpeed?: string
  mainSymptoms?: string[]
  severityProgression?: string
  riskFactors?: string[]
  additionalDetails?: string
  sickSymptoms?: string[]
  temperatureFeeling?: string
  symptomProgression?: string
  sickDuration?: string
  contagiousExposure?: boolean
  
  // Skin & Hair
  primarySkinConcern?: string
  skinDistribution?: string
  skinCharacteristics?: string[]
  hairSpecific?: string
  skinTriggers?: string[]
  skinMainIssue?: string
  skinMainIssue_other?: string
  skinDuration?: string
  skinLocation?: string
  skinSpread?: boolean
  skinItchy?: boolean
  
  // Breathing & Chest
  breathingPattern?: string
  exertionImpact?: string
  chestSymptoms?: string[]
  breathingTriggers?: string[]
  urgentBreathingScreen?: string[]
  breathingMain?: string
  breathingMain_other?: string
  breathingWhen?: string
  chestPain?: boolean
  breathingUrgent?: boolean
  
  // Hormonal/Reproductive
  biologicalSex?: string
  primaryHormonalConcern?: string
  cyclePattern?: string
  femaleHormonalSymptoms?: string[]
  maleHormonalSymptoms?: string[]
  hormonalOnsetPattern?: string
  hormonalRelevantFactors?: string[]
  hormonalImpactOnLife?: string
  hormonalMain?: string
  hormonalMain_other?: string
  periodChanges?: string
  hormonalSymptoms?: string[]
  
  // Neurological
  primaryNeuroSymptom?: string
  headachePattern?: string
  neurologicalTiming?: string
  associatedNeuroSymptoms?: string[]
  neuroRedFlags?: string[]
  neuroMain?: string
  neuroMain_other?: string
  headacheType?: string
  neuroSymptoms?: string[]
  neuroTriggers?: string
  
  // Medication Side Effects
  whichMedications?: string[]
  systemAffected?: string[]
  effectOnLife?: string
  medicationHistory?: string[]
  managementAttempts?: string[]
  timingDescription?: string
  medicationName?: string
  timeSinceStarted?: string
  doseChanges?: boolean
  symptomTiming?: string
  sideEffectSeverity?: string
  
  // Physical/Body
  bodyRegion?: string
  issueType?: string
  issueType_other?: string
  issueCharacteristics?: string[]
  mechanicalBehavior?: string
  redFlagScreen?: string[]
  whatHelped?: string[]
  previousEpisodes?: string
  occurrencePattern?: string
  affectedSide?: string
  radiatingPain?: boolean
  specificMovements?: string
  painKillerQuestion?: boolean
  
  // Multiple Issues
  symptomTimeline?: string
  symptomOrder?: string
  timingRelationship?: string
  patternRecognition?: string[]
  systemsInvolved?: string[]
  primaryConcern?: string
  secondaryConcerns?: string[]
  symptomConnection?: string
  firstSymptom?: string
  
  // Not Sure
  functionalTrigger?: string
  subtleChanges?: string[]
  currentActivity?: string
  recentChanges?: string
  biggestWorry?: string
  feelingBetter?: string
}

// Enhanced categories with icons and descriptions
const categories = [
  // Main 9 - always visible
  { id: 'energy', label: 'Energy & Sleep', icon: Battery, color: 'from-yellow-500 to-orange-500', description: 'Fatigue, exhaustion, sleep issues' },
  { id: 'mental', label: 'Mental Health', icon: Brain, color: 'from-purple-500 to-pink-500', description: 'Mood, anxiety, focus issues' },
  { id: 'digestive', label: 'Digestive Issues', icon: Stethoscope, color: 'from-green-500 to-emerald-500', description: 'Stomach, bowel, eating problems' },
  { id: 'sick', label: 'Feeling Sick', icon: Heart, color: 'from-red-500 to-pink-500', description: 'Fever, flu-like symptoms' },
  { id: 'skin', label: 'Skin & Hair', icon: User, color: 'from-pink-500 to-rose-500', description: 'Rashes, hair loss, skin changes' },
  { id: 'breathing', label: 'Breathing & Chest', icon: Wind, color: 'from-cyan-500 to-blue-500', description: 'Shortness of breath, chest issues' },
  { id: 'hormonal', label: 'Hormonal/Cycles', icon: Circle, color: 'from-purple-500 to-pink-500', description: 'Periods, hormonal changes' },
  { id: 'neurological', label: 'Head & Neuro', icon: Zap, color: 'from-amber-500 to-orange-500', description: 'Headaches, dizziness, numbness' },
  { id: 'multiple', label: 'Multiple Issues', icon: RefreshCw, color: 'from-indigo-500 to-purple-500', description: 'Several symptoms at once' },
  
  // Show more - 3 additional
  { id: 'medication', label: 'Medicine Effects', icon: Pill, color: 'from-blue-500 to-cyan-500', description: 'Side effects from medications' },
  { id: 'physical', label: 'Physical/Body', icon: Activity, color: 'from-red-500 to-rose-500', description: 'Body pain, injuries' },
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
                How would you describe your tiredness/fatigue?
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'normal_tired', label: 'Normal tired - better with rest' },
                  { value: 'exhausted_after_sleep', label: 'Exhausted even after sleeping' },
                  { value: 'sudden_crashes', label: 'Sudden energy crashes during day' },
                  { value: 'constant_drain', label: 'Constant drain, never refreshed' },
                  { value: 'not_tired', label: 'Not tired, other symptoms' }
                ].map((option) => (
                  <RadioCard
                    key={option.value}
                    name="fatigueSeverity"
                    value={option.value}
                    checked={formData.fatigueSeverity === option.value}
                    onChange={handleInputChange}
                    label={option.label}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-white font-medium mb-3">
                Compared to your normal self, you can do:
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {[
                  { value: '0-25%', label: '0-25% of usual activities' },
                  { value: '25-50%', label: '25-50% of usual activities' },
                  { value: '50-75%', label: '50-75% of usual activities' },
                  { value: '75-100%', label: '75-100% but struggling' }
                ].map((option) => (
                  <RadioCard
                    key={option.value}
                    name="activityCapacity"
                    value={option.value}
                    checked={formData.activityCapacity === option.value}
                    onChange={handleInputChange}
                    label={option.label}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-white font-medium mb-3">
                Along with fatigue, experiencing: (check all that apply)
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'muscle_weakness', label: 'Muscle weakness' },
                  { value: 'brain_fog', label: 'Brain fog/memory issues' },
                  { value: 'unrefreshing_sleep', label: 'Unrefreshing sleep' },
                  { value: 'body_aches', label: 'Body aches' },
                  { value: 'none', label: 'None of these' }
                ].map((option) => (
                  <CheckboxCard
                    key={option.value}
                    checked={formData.associatedSymptoms?.includes(option.value) || false}
                    onChange={() => handleCheckboxChange('associatedSymptoms', option.value)}
                    label={option.label}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-white font-medium mb-3">
                What specific activities are most affected by fatigue? (optional)
              </label>
              <textarea
                name="specificActivitiesAffected"
                value={formData.specificActivitiesAffected || ''}
                onChange={handleInputChange}
                placeholder="e.g., Can't climb stairs, can't concentrate at work"
                className="w-full h-20 px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-emerald-500/50 transition-all resize-none"
              />
            </div>
          </>
        )

      case 'mental':
        return (
          <>
            <div>
              <label className="block text-white font-medium mb-3">
                What aspect of daily life is most affected? (check all that apply)
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'energy_motivation', label: 'Energy and motivation' },
                  { value: 'mood_emotions', label: 'Mood and emotions' },
                  { value: 'worry_thoughts', label: 'Worry and racing thoughts' },
                  { value: 'sleep_appetite', label: 'Sleep and appetite' },
                  { value: 'memory_concentration', label: 'Memory and concentration' },
                  { value: 'physical_symptoms', label: 'Physical symptoms (headaches, chest pain, etc.)' },
                  { value: 'relationships', label: 'Relationships and social life' }
                ].map((option) => (
                  <CheckboxCard
                    key={option.value}
                    checked={formData.mainDifficulty?.includes(option.value) || false}
                    onChange={() => handleCheckboxChange('mainDifficulty', option.value)}
                    label={option.label}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-white font-medium mb-3">
                Briefly describe what you're experiencing
              </label>
              <textarea
                name="symptomDescription"
                value={formData.symptomDescription || ''}
                onChange={handleInputChange}
                placeholder="1-2 sentences about your main concerns"
                className="w-full h-20 px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-emerald-500/50 transition-all resize-none"
                required
              />
            </div>

            <div>
              <label className="block text-white font-medium mb-3">
                What's hardest right now? (check all that apply)
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'getting_through_day', label: 'Getting through the day' },
                  { value: 'controlling_worry', label: 'Controlling worry/fear' },
                  { value: 'feeling_happy', label: 'Feeling happy or motivated' },
                  { value: 'sleeping_eating', label: 'Sleeping or eating normally' },
                  { value: 'focusing', label: 'Focusing or remembering' },
                  { value: 'relationships', label: 'Managing relationships' }
                ].map((option) => (
                  <CheckboxCard
                    key={option.value}
                    checked={formData.mainStruggle?.includes(option.value) || false}
                    onChange={() => handleCheckboxChange('mainStruggle', option.value)}
                    label={option.label}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-white font-medium mb-3">
                This has been going on:
              </label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {[
                  { value: 'days', label: 'Days' },
                  { value: 'weeks', label: 'Weeks' },
                  { value: 'months', label: 'Months' },
                  { value: 'years', label: 'Years' },
                  { value: 'episodic', label: 'Comes and goes' }
                ].map((option) => (
                  <RadioCard
                    key={option.value}
                    name="durationPattern"
                    value={option.value}
                    checked={formData.durationPattern === option.value}
                    onChange={handleInputChange}
                    label={option.label}
                  />
                ))}
              </div>
            </div>
          </>
        )

      case 'digestive':
        return (
          <>
            <div>
              <label className="block text-white font-medium mb-3">
                What's your main digestive concern?
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'pain_cramping', label: 'Pain or cramping' },
                  { value: 'nausea_vomiting', label: 'Nausea or vomiting' },
                  { value: 'bowel_changes', label: 'Bowel habit changes' },
                  { value: 'bloating_gas', label: 'Bloating or gas' },
                  { value: 'swallowing_issues', label: 'Difficulty swallowing' },
                  { value: 'appetite_changes', label: 'Appetite changes' }
                ].map((option) => (
                  <RadioCard
                    key={option.value}
                    name="primaryDigestiveSymptom"
                    value={option.value}
                    checked={formData.primaryDigestiveSymptom === option.value}
                    onChange={handleInputChange}
                    label={option.label}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-white font-medium mb-3">
                Current bowel habits:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'diarrhea_frequent', label: 'Diarrhea (>3/day)' },
                  { value: 'constipation', label: 'Constipation (<3/week)' },
                  { value: 'alternating', label: 'Alternating diarrhea/constipation' },
                  { value: 'normal_painful', label: 'Normal frequency but painful' },
                  { value: 'blood_mucus', label: 'Blood or mucus present' }
                ].map((option) => (
                  <RadioCard
                    key={option.value}
                    name="bowelPattern"
                    value={option.value}
                    checked={formData.bowelPattern === option.value}
                    onChange={handleInputChange}
                    label={option.label}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-white font-medium mb-3">
                Symptoms in relation to eating:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'immediately_during', label: 'While eating or immediately after' },
                  { value: '30min_2hrs', label: '30 minutes to 2 hours after' },
                  { value: 'hours_later', label: 'Several hours after eating' },
                  { value: 'empty_stomach', label: 'Worse on empty stomach' },
                  { value: 'no_relation', label: 'No relation to meals' }
                ].map((option) => (
                  <RadioCard
                    key={option.value}
                    name="timingRelationToFood"
                    value={option.value}
                    checked={formData.timingRelationToFood === option.value}
                    onChange={handleInputChange}
                    label={option.label}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-white font-medium mb-3">
                Which foods make it worse? (check all that apply)
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'dairy', label: 'Dairy products' },
                  { value: 'gluten_wheat', label: 'Gluten/wheat' },
                  { value: 'fatty_fried', label: 'Fatty or fried foods' },
                  { value: 'spicy', label: 'Spicy foods' },
                  { value: 'alcohol_caffeine', label: 'Alcohol or caffeine' },
                  { value: 'no_pattern', label: 'No clear pattern' }
                ].map((option) => (
                  <CheckboxCard
                    key={option.value}
                    checked={formData.foodTriggers?.includes(option.value) || false}
                    onChange={() => handleCheckboxChange('foodTriggers', option.value)}
                    label={option.label}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-white font-medium mb-3">
                Also experiencing: (check all that apply)
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'weight_loss', label: 'Unintended weight loss' },
                  { value: 'night_symptoms', label: 'Symptoms waking you at night' },
                  { value: 'fever', label: 'Fever' },
                  { value: 'fatigue', label: 'Extreme fatigue' },
                  { value: 'joint_pain', label: 'Joint pain' }
                ].map((option) => (
                  <CheckboxCard
                    key={option.value}
                    checked={formData.associatedGISymptoms?.includes(option.value) || false}
                    onChange={() => handleCheckboxChange('associatedGISymptoms', option.value)}
                    label={option.label}
                  />
                ))}
              </div>
            </div>
          </>
        )

      case 'sick':
        return (
          <>
            <div>
              <label className="block text-white font-medium mb-3">
                Your symptoms started:
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {[
                  { value: 'sudden_hours', label: 'Suddenly (hours)' },
                  { value: 'quick_days', label: 'Quickly (1-2 days)' },
                  { value: 'gradual_week', label: 'Gradually (days-week)' },
                  { value: 'slow_weeks', label: 'Slowly (weeks+)' }
                ].map((option) => (
                  <RadioCard
                    key={option.value}
                    name="onsetSpeed"
                    value={option.value}
                    checked={formData.onsetSpeed === option.value}
                    onChange={handleInputChange}
                    label={option.label}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-white font-medium mb-3">
                Main symptoms include: (check all that apply)
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'fever_chills', label: 'Fever/chills' },
                  { value: 'cough_congestion', label: 'Cough/congestion' },
                  { value: 'sore_throat', label: 'Sore throat' },
                  { value: 'body_aches', label: 'Body aches' },
                  { value: 'stomach_issues', label: 'Stomach issues' },
                  { value: 'headache', label: 'Headache' },
                  { value: 'fatigue', label: 'Fatigue' },
                  { value: 'other', label: 'Other' }
                ].map((option) => (
                  <CheckboxCard
                    key={option.value}
                    checked={formData.mainSymptoms?.includes(option.value) || false}
                    onChange={() => handleCheckboxChange('mainSymptoms', option.value)}
                    label={option.label}
                  />
                ))}
              </div>
              {formData.mainSymptoms?.includes('other') && (
                <motion.textarea
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  name="additionalDetails"
                  value={formData.additionalDetails || ''}
                  onChange={handleInputChange}
                  placeholder="Please describe other symptoms..."
                  className="mt-2 w-full h-16 px-4 py-2.5 bg-white/[0.02] border border-white/[0.08] rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-emerald-500/50 resize-none"
                />
              )}
            </div>

            <div>
              <label className="block text-white font-medium mb-3">
                Over time, symptoms are:
              </label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {[
                  { value: 'worse_quickly', label: 'Getting worse quickly' },
                  { value: 'worse_slowly', label: 'Slowly worsening' },
                  { value: 'stable', label: 'Staying the same' },
                  { value: 'improving', label: 'Starting to improve' },
                  { value: 'fluctuating', label: 'Going up and down' }
                ].map((option) => (
                  <RadioCard
                    key={option.value}
                    name="severityProgression"
                    value={option.value}
                    checked={formData.severityProgression === option.value}
                    onChange={handleInputChange}
                    label={option.label}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-white font-medium mb-3">
                In past 2 weeks have you: (check all that apply)
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'traveled', label: 'Traveled' },
                  { value: 'sick_contact', label: 'Been around sick people' },
                  { value: 'new_medication', label: 'Started new medication' },
                  { value: 'unusual_food', label: 'Eaten unusual food' },
                  { value: 'high_stress', label: 'Been very stressed' },
                  { value: 'none', label: 'None of these' }
                ].map((option) => (
                  <CheckboxCard
                    key={option.value}
                    checked={formData.riskFactors?.includes(option.value) || false}
                    onChange={() => handleCheckboxChange('riskFactors', option.value)}
                    label={option.label}
                  />
                ))}
              </div>
            </div>
          </>
        )

      case 'medication':
        return (
          <>
            <div>
              <label className="block text-white font-medium mb-3">
                Experiencing side effects from: (check all that apply)
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'new_med', label: 'New medication (< 1 month)' },
                  { value: 'dose_change', label: 'Recent dose change' },
                  { value: 'long_term', label: 'Long-term medication' },
                  { value: 'multiple', label: 'Multiple medications' },
                  { value: 'stopped', label: 'Stopped a medication' },
                  { value: 'unsure', label: 'Unsure which one' }
                ].map((option) => (
                  <CheckboxCard
                    key={option.value}
                    checked={formData.whichMedications?.includes(option.value) || false}
                    onChange={() => handleCheckboxChange('whichMedications', option.value)}
                    label={option.label}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-white font-medium mb-3">
                Main side effect involves: (check all that apply)
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'stomach', label: 'Stomach/digestion' },
                  { value: 'dizzy_balance', label: 'Dizziness/balance' },
                  { value: 'mood_sleep', label: 'Mood/sleep changes' },
                  { value: 'skin_allergic', label: 'Skin/allergic' },
                  { value: 'sexual_urinary', label: 'Sexual/urinary' },
                  { value: 'other', label: 'Other system' }
                ].map((option) => (
                  <CheckboxCard
                    key={option.value}
                    checked={formData.systemAffected?.includes(option.value) || false}
                    onChange={() => handleCheckboxChange('systemAffected', option.value)}
                    label={option.label}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-white font-medium mb-3">
                Side effects are:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'tolerable', label: 'Tolerable, minor annoyance' },
                  { value: 'affecting_daily', label: 'Affecting daily activities' },
                  { value: 'unbearable', label: 'Unbearable, need alternative' },
                  { value: 'dangerous', label: 'Dangerous/concerning' }
                ].map((option) => (
                  <RadioCard
                    key={option.value}
                    name="effectOnLife"
                    value={option.value}
                    checked={formData.effectOnLife === option.value}
                    onChange={handleInputChange}
                    label={option.label}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-white font-medium mb-3">
                History with medications: (check all that apply)
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'sensitive', label: 'Sensitive to many medications' },
                  { value: 'low_doses', label: 'Need lower doses than typical' },
                  { value: 'allergic', label: 'Had allergic reactions' },
                  { value: 'first_time', label: 'First time with side effects' }
                ].map((option) => (
                  <CheckboxCard
                    key={option.value}
                    checked={formData.medicationHistory?.includes(option.value) || false}
                    onChange={() => handleCheckboxChange('medicationHistory', option.value)}
                    label={option.label}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-white font-medium mb-3">
                To manage side effects, tried: (check all that apply)
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'with_food', label: 'Taking with food' },
                  { value: 'timing_change', label: 'Different time of day' },
                  { value: 'split_dose', label: 'Splitting dose' },
                  { value: 'skipping', label: 'Skipping doses' },
                  { value: 'nothing', label: 'Nothing yet' },
                  { value: 'other', label: 'Other' }
                ].map((option) => (
                  <CheckboxCard
                    key={option.value}
                    checked={formData.managementAttempts?.includes(option.value) || false}
                    onChange={() => handleCheckboxChange('managementAttempts', option.value)}
                    label={option.label}
                  />
                ))}
              </div>
              {formData.managementAttempts?.includes('other') && (
                <motion.input
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  type="text"
                  name="timingDescription"
                  value={formData.timingDescription || ''}
                  onChange={handleInputChange}
                  placeholder="Please describe what you tried..."
                  className="mt-2 w-full px-4 py-2.5 bg-white/[0.02] border border-white/[0.08] rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-emerald-500/50"
                />
              )}
            </div>

            <div>
              <label className="block text-white font-medium mb-3">
                Describe the timing and nature of side effects (optional)
              </label>
              <textarea
                name="timingDescription"
                value={formData.timingDescription || ''}
                onChange={handleInputChange}
                placeholder="When do they occur, how long do they last?"
                className="w-full h-20 px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-emerald-500/50 transition-all resize-none"
              />
            </div>
          </>
        )

      case 'multiple':
        return (
          <>
            <div>
              <label className="block text-white font-medium mb-3">
                Did symptoms start simultaneously?
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'yes_simultaneous', label: 'Yes - all at once' },
                  { value: 'no_sequential', label: 'No - at different times' }
                ].map((option) => (
                  <RadioCard
                    key={option.value}
                    name="symptomTimeline"
                    value={option.value}
                    checked={formData.symptomTimeline === option.value}
                    onChange={handleInputChange}
                    label={option.label}
                  />
                ))}
              </div>
            </div>

            {formData.symptomTimeline === 'no_sequential' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
              >
                <label className="block text-white font-medium mb-3">
                  Which symptoms came first? List in order:
                </label>
                <textarea
                  name="symptomOrder"
                  value={formData.symptomOrder || ''}
                  onChange={handleInputChange}
                  placeholder="1st: [symptom], Then: [symptom], Then: [symptom]"
                  className="w-full h-20 px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-emerald-500/50 transition-all resize-none"
                />
              </motion.div>
            )}

            <div>
              <label className="block text-white font-medium mb-3">
                Your various symptoms:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'all_together', label: 'All started together' },
                  { value: 'cascade', label: 'One led to others' },
                  { value: 'independent', label: 'Independent timing' },
                  { value: 'flare_together', label: 'Flare up together' }
                ].map((option) => (
                  <RadioCard
                    key={option.value}
                    name="timingRelationship"
                    value={option.value}
                    checked={formData.timingRelationship === option.value}
                    onChange={handleInputChange}
                    label={option.label}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-white font-medium mb-3">
                Symptoms are worse: (check all that apply)
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {[
                  { value: 'morning', label: 'Morning' },
                  { value: 'evening', label: 'Evening' },
                  { value: 'with_stress', label: 'With stress' },
                  { value: 'with_activity', label: 'With activity' },
                  { value: 'with_foods', label: 'With certain foods' },
                  { value: 'no_pattern', label: 'No pattern' }
                ].map((option) => (
                  <CheckboxCard
                    key={option.value}
                    checked={formData.patternRecognition?.includes(option.value) || false}
                    onChange={() => handleCheckboxChange('patternRecognition', option.value)}
                    label={option.label}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-white font-medium mb-3">
                Symptoms involve: (check all that apply)
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'energy_joints', label: 'Energy + joint pain' },
                  { value: 'gut_skin_joints', label: 'Gut + skin + joints' },
                  { value: 'everything_hurts', label: 'Everything hurts' },
                  { value: 'neuro_fatigue', label: 'Neurological + fatigue' },
                  { value: 'random', label: 'Random/no pattern' }
                ].map((option) => (
                  <CheckboxCard
                    key={option.value}
                    checked={formData.systemsInvolved?.includes(option.value) || false}
                    onChange={() => handleCheckboxChange('systemsInvolved', option.value)}
                    label={option.label}
                  />
                ))}
              </div>
            </div>
          </>
        )

      case 'unsure':
        return (
          <>
            <div>
              <label className="block text-white font-medium mb-3">
                I'm seeking help because:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'others_noticed', label: 'Others say I\'m different' },
                  { value: 'cant_do_activities', label: 'Can\'t do usual activities' },
                  { value: 'worried', label: 'Worried about symptoms' },
                  { value: 'prevent_worsening', label: 'Want to prevent worsening' }
                ].map((option) => (
                  <RadioCard
                    key={option.value}
                    name="functionalTrigger"
                    value={option.value}
                    checked={formData.functionalTrigger === option.value}
                    onChange={handleInputChange}
                    label={option.label}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-white font-medium mb-3">
                Have you noticed: (check all that apply)
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'need_stimulants', label: 'Need more coffee/stimulants' },
                  { value: 'clothes_fit', label: 'Clothes fit differently' },
                  { value: 'people_asking', label: 'People asking if I\'m OK' },
                  { value: 'forgetful', label: 'More forgetful' },
                  { value: 'none', label: 'None really' }
                ].map((option) => (
                  <CheckboxCard
                    key={option.value}
                    checked={formData.subtleChanges?.includes(option.value) || false}
                    onChange={() => handleCheckboxChange('subtleChanges', option.value)}
                    label={option.label}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-white font-medium mb-3">
                What made you decide to seek help today?
              </label>
              <textarea
                name="currentActivity"
                value={formData.currentActivity || ''}
                onChange={handleInputChange}
                placeholder="What prompted this visit?"
                className="w-full h-20 px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-emerald-500/50 transition-all resize-none"
              />
            </div>

            <div>
              <label className="block text-white font-medium mb-3">
                Any recent changes in your life or routine?
              </label>
              <textarea
                name="recentChanges"
                value={formData.recentChanges || ''}
                onChange={handleInputChange}
                placeholder="New job, diet, stress, medications, etc."
                className="w-full h-20 px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-emerald-500/50 transition-all resize-none"
              />
            </div>
          </>
        )

      case 'physical':
        return (
          <>
            <div>
              <label className="block text-white font-medium mb-3">
                What area of your body is affected?
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {[
                  { value: 'head_neck', label: 'Head/Neck' },
                  { value: 'chest', label: 'Chest' },
                  { value: 'abdomen', label: 'Abdomen' },
                  { value: 'back', label: 'Back' },
                  { value: 'arms', label: 'Arms' },
                  { value: 'legs', label: 'Legs' },
                  { value: 'joints', label: 'Joints' },
                  { value: 'skin', label: 'Skin' },
                  { value: 'multiple', label: 'Multiple areas' }
                ].map((option) => (
                  <RadioCard
                    key={option.value}
                    name="bodyRegion"
                    value={option.value}
                    checked={formData.bodyRegion === option.value}
                    onChange={handleInputChange}
                    label={option.label}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-white font-medium mb-3">
                What type of issue are you experiencing?
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {[
                  { value: 'pain', label: 'Pain' },
                  { value: 'injury', label: 'Injury' },
                  { value: 'weakness', label: 'Weakness' },
                  { value: 'numbness', label: 'Numbness' },
                  { value: 'swelling', label: 'Swelling' },
                  { value: 'rash', label: 'Rash' },
                  { value: 'other', label: 'Other' }
                ].map((option) => (
                  <RadioCard
                    key={option.value}
                    name="issueType"
                    value={option.value}
                    checked={formData.issueType === option.value}
                    onChange={handleInputChange}
                    label={option.label}
                  />
                ))}
              </div>
            </div>

            {/* Dynamic characteristics based on issue type */}
            {formData.issueType && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
              >
                <label className="block text-white font-medium mb-3">
                  {formData.issueType === 'pain' ? 'Pain pattern:' :
                   formData.issueType === 'weakness' ? 'Weakness pattern:' :
                   formData.issueType === 'numbness' ? 'Numbness/tingling:' :
                   formData.issueType === 'swelling' ? 'Swelling pattern:' :
                   formData.issueType === 'rash' ? 'Rash characteristics:' :
                   'Issue characteristics:'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(formData.issueType === 'pain' ? [
                    { value: 'sharp_movement', label: 'Sharp with specific movements' },
                    { value: 'constant_ache', label: 'Constant ache' },
                    { value: 'throbbing', label: 'Throbbing/pulsing' },
                    { value: 'burning_tingling', label: 'Burning/tingling' },
                    { value: 'wave_pattern', label: 'Comes in waves' },
                    { value: 'moving', label: 'Changes location' },
                    { value: 'other', label: 'Other' }
                  ] : formData.issueType === 'weakness' ? [
                    { value: 'cant_lift', label: 'Can\'t lift/grip things' },
                    { value: 'legs_give_out', label: 'Legs give out' },
                    { value: 'general_weak', label: 'Generally feel weak' },
                    { value: 'one_side', label: 'One side weaker' },
                    { value: 'worse_with_use', label: 'Gets worse with use' }
                  ] : formData.issueType === 'numbness' ? [
                    { value: 'complete_loss', label: 'Complete loss of feeling' },
                    { value: 'pins_needles', label: 'Pins and needles' },
                    { value: 'intermittent', label: 'Comes and goes' },
                    { value: 'spreading', label: 'Spreading/getting worse' },
                    { value: 'positional', label: 'With position changes' }
                  ] : formData.issueType === 'swelling' ? [
                    { value: 'worse_evening', label: 'Worse by end of day' },
                    { value: 'constant', label: 'Constant' },
                    { value: 'intermittent', label: 'Comes and goes' },
                    { value: 'one_side', label: 'One side only' },
                    { value: 'multiple_areas', label: 'Multiple areas' }
                  ] : formData.issueType === 'rash' ? [
                    { value: 'itchy', label: 'Itchy' },
                    { value: 'painful', label: 'Painful/burning' },
                    { value: 'spreading', label: 'Spreading' },
                    { value: 'intermittent', label: 'Comes and goes' },
                    { value: 'with_symptoms', label: 'With other symptoms' }
                  ] : []
                  ).map((option) => (
                    <CheckboxCard
                      key={option.value}
                      checked={formData.issueCharacteristics?.includes(option.value) || false}
                      onChange={() => handleCheckboxChange('issueCharacteristics', option.value)}
                      label={option.label}
                    />
                  ))}
                </div>
                {formData.issueCharacteristics?.includes('other') && (
                  <motion.input
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    type="text"
                    name="issueType_other"
                    value={formData.issueType_other || ''}
                    onChange={handleInputChange}
                    placeholder="Please describe..."
                    className="mt-2 w-full px-4 py-2.5 bg-white/[0.02] border border-white/[0.08] rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-emerald-500/50"
                  />
                )}
              </motion.div>
            )}

            <div>
              <label className="block text-white font-medium mb-3">
                Issue behavior:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'predictable_movement', label: 'Predictable with specific movements' },
                  { value: 'constant_position', label: 'Constant regardless of position' },
                  { value: 'worse_rest', label: 'Worse at night/rest' },
                  { value: 'wave_attacks', label: 'Comes in waves/attacks' }
                ].map((option) => (
                  <RadioCard
                    key={option.value}
                    name="mechanicalBehavior"
                    value={option.value}
                    checked={formData.mechanicalBehavior === option.value}
                    onChange={handleInputChange}
                    label={option.label}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-white font-medium mb-3 text-red-400">
                Any of these with your symptoms? (check all that apply)
              </label>
              <div className="grid grid-cols-1 gap-2">
                {[
                  { value: 'bladder_bowel', label: 'Loss of bladder/bowel control' },
                  { value: 'groin_numbness', label: 'Numbness in groin/buttocks' },
                  { value: 'fever_pain', label: 'Fever with back pain' },
                  { value: 'night_pain', label: 'Pain waking from sleep' },
                  { value: 'none', label: 'None of these' }
                ].map((option) => (
                  <CheckboxCard
                    key={option.value}
                    checked={formData.redFlagScreen?.includes(option.value) || false}
                    onChange={() => handleCheckboxChange('redFlagScreen', option.value)}
                    label={option.label}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-white font-medium mb-3">
                Has anything helped temporarily? (check all that apply)
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {[
                  { value: 'rest', label: 'Rest' },
                  { value: 'movement', label: 'Movement/stretching' },
                  { value: 'heat', label: 'Heat' },
                  { value: 'ice', label: 'Ice' },
                  { value: 'medication', label: 'Medication' },
                  { value: 'massage', label: 'Massage' },
                  { value: 'nothing', label: 'Nothing helps' },
                  { value: 'other', label: 'Other' }
                ].map((option) => (
                  <CheckboxCard
                    key={option.value}
                    checked={formData.whatHelped?.includes(option.value) || false}
                    onChange={() => handleCheckboxChange('whatHelped', option.value)}
                    label={option.label}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-white font-medium mb-3">
                Have you had this before?
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {[
                  { value: 'first_time', label: 'First time' },
                  { value: 'resolved_before', label: 'Had it, fully resolved' },
                  { value: 'recurring', label: 'Recurring problem' },
                  { value: 'chronic', label: 'Chronic/ongoing' }
                ].map((option) => (
                  <RadioCard
                    key={option.value}
                    name="previousEpisodes"
                    value={option.value}
                    checked={formData.previousEpisodes === option.value}
                    onChange={handleInputChange}
                    label={option.label}
                  />
                ))}
              </div>
            </div>
          </>
        )

      case 'skin':
        return (
          <>
            <div>
              <label className="block text-white font-medium mb-3">
                Main skin/hair issue:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'rash', label: 'Rash or skin irritation' },
                  { value: 'hair_loss', label: 'Hair loss or thinning' },
                  { value: 'color_changes', label: 'Skin color changes' },
                  { value: 'texture_changes', label: 'Texture changes (dry, scaly)' },
                  { value: 'growths', label: 'New growths or moles' },
                  { value: 'wounds_not_healing', label: 'Wounds not healing' }
                ].map((option) => (
                  <RadioCard
                    key={option.value}
                    name="primarySkinConcern"
                    value={option.value}
                    checked={formData.primarySkinConcern === option.value}
                    onChange={handleInputChange}
                    label={option.label}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-white font-medium mb-3">
                Where is it located?
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'localized_one_area', label: 'One specific area' },
                  { value: 'symmetric_both_sides', label: 'Both sides of body equally' },
                  { value: 'spreading', label: 'Started small, now spreading' },
                  { value: 'random_patches', label: 'Random patches' },
                  { value: 'face_visible_areas', label: 'Face/visible areas mainly' }
                ].map((option) => (
                  <RadioCard
                    key={option.value}
                    name="skinDistribution"
                    value={option.value}
                    checked={formData.skinDistribution === option.value}
                    onChange={handleInputChange}
                    label={option.label}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-white font-medium mb-3">
                The affected area is: (check all that apply)
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'itchy', label: 'Itchy' },
                  { value: 'painful', label: 'Painful or tender' },
                  { value: 'raised', label: 'Raised or bumpy' },
                  { value: 'flaky_scaly', label: 'Flaky or scaly' },
                  { value: 'oozing_crusting', label: 'Oozing or crusting' },
                  { value: 'changing_size', label: 'Changing in size/color' }
                ].map((option) => (
                  <CheckboxCard
                    key={option.value}
                    checked={formData.skinCharacteristics?.includes(option.value) || false}
                    onChange={() => handleCheckboxChange('skinCharacteristics', option.value)}
                    label={option.label}
                  />
                ))}
              </div>
            </div>

            {formData.primarySkinConcern === 'hair_loss' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
              >
                <label className="block text-white font-medium mb-3">
                  Hair loss pattern:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'patches', label: 'Circular patches' },
                    { value: 'overall_thinning', label: 'Overall thinning' },
                    { value: 'receding', label: 'Receding hairline' },
                    { value: 'sudden_clumps', label: 'Sudden loss in clumps' },
                    { value: 'with_scalp_symptoms', label: 'With scalp itching/pain' }
                  ].map((option) => (
                    <RadioCard
                      key={option.value}
                      name="hairSpecific"
                      value={option.value}
                      checked={formData.hairSpecific === option.value}
                      onChange={handleInputChange}
                      label={option.label}
                    />
                  ))}
                </div>
              </motion.div>
            )}

            <div>
              <label className="block text-white font-medium mb-3">
                Started after or worse with: (check all that apply)
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'new_product', label: 'New product/cosmetic' },
                  { value: 'sun_exposure', label: 'Sun exposure' },
                  { value: 'stress', label: 'Stress period' },
                  { value: 'medication', label: 'New medication' },
                  { value: 'unknown', label: 'No clear trigger' }
                ].map((option) => (
                  <CheckboxCard
                    key={option.value}
                    checked={formData.skinTriggers?.includes(option.value) || false}
                    onChange={() => handleCheckboxChange('skinTriggers', option.value)}
                    label={option.label}
                  />
                ))}
              </div>
            </div>
          </>
        )

      case 'breathing':
        return (
          <>
            <div>
              <label className="block text-white font-medium mb-3">
                How is your breathing affected?
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'cant_catch_breath', label: "Can't catch my breath" },
                  { value: 'rapid_shallow', label: 'Rapid, shallow breathing' },
                  { value: 'wheezing', label: 'Wheezing or whistling' },
                  { value: 'tight_chest', label: 'Chest feels tight' },
                  { value: 'worse_lying_down', label: 'Worse when lying down' }
                ].map((option) => (
                  <RadioCard
                    key={option.value}
                    name="breathingPattern"
                    value={option.value}
                    checked={formData.breathingPattern === option.value}
                    onChange={handleInputChange}
                    label={option.label}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-white font-medium mb-3">
                Breathing difficulty occurs:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'at_rest', label: 'Even at rest' },
                  { value: 'minimal_activity', label: 'With minimal activity (dressing, bathing)' },
                  { value: 'moderate_activity', label: 'With moderate activity (walking)' },
                  { value: 'strenuous_only', label: 'Only with strenuous activity' }
                ].map((option) => (
                  <RadioCard
                    key={option.value}
                    name="exertionImpact"
                    value={option.value}
                    checked={formData.exertionImpact === option.value}
                    onChange={handleInputChange}
                    label={option.label}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-white font-medium mb-3">
                Chest symptoms include: (check all that apply)
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'sharp_pain', label: 'Sharp, stabbing pain' },
                  { value: 'pressure_squeezing', label: 'Pressure or squeezing' },
                  { value: 'burning', label: 'Burning sensation' },
                  { value: 'palpitations', label: 'Heart racing/skipping' },
                  { value: 'cough', label: 'Cough (dry or productive)' }
                ].map((option) => (
                  <CheckboxCard
                    key={option.value}
                    checked={formData.chestSymptoms?.includes(option.value) || false}
                    onChange={() => handleCheckboxChange('chestSymptoms', option.value)}
                    label={option.label}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-white font-medium mb-3">
                Breathing worse with: (check all that apply)
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'allergens', label: 'Dust, pollen, pets' },
                  { value: 'cold_air', label: 'Cold air' },
                  { value: 'stress_anxiety', label: 'Stress or anxiety' },
                  { value: 'position_change', label: 'Position changes' },
                  { value: 'no_trigger', label: 'No clear trigger' }
                ].map((option) => (
                  <CheckboxCard
                    key={option.value}
                    checked={formData.breathingTriggers?.includes(option.value) || false}
                    onChange={() => handleCheckboxChange('breathingTriggers', option.value)}
                    label={option.label}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-white font-medium mb-3 text-red-400">
                Any of these symptoms? (check all that apply)
              </label>
              <div className="grid grid-cols-1 gap-2">
                {[
                  { value: 'chest_pressure_pain', label: 'Chest pressure with sweating' },
                  { value: 'blue_lips', label: 'Blue lips or fingernails' },
                  { value: 'coughing_blood', label: 'Coughing up blood' },
                  { value: 'leg_swelling', label: 'Leg swelling' },
                  { value: 'none', label: 'None of these' }
                ].map((option) => (
                  <CheckboxCard
                    key={option.value}
                    checked={formData.urgentBreathingScreen?.includes(option.value) || false}
                    onChange={() => handleCheckboxChange('urgentBreathingScreen', option.value)}
                    label={option.label}
                  />
                ))}
              </div>
            </div>
          </>
        )

      case 'hormonal':
        return (
          <>
            <div>
              <label className="block text-white font-medium mb-3">
                Biological sex at birth:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'female', label: 'Female' },
                  { value: 'male', label: 'Male' },
                  { value: 'prefer_not_say', label: 'Prefer not to say' }
                ].map((option) => (
                  <RadioCard
                    key={option.value}
                    name="biologicalSex"
                    value={option.value}
                    checked={formData.biologicalSex === option.value}
                    onChange={handleInputChange}
                    label={option.label}
                  />
                ))}
              </div>
            </div>

            {(formData.biologicalSex === 'female' || formData.biologicalSex === 'prefer_not_say') && (
              <>
                <div>
                  <label className="block text-white font-medium mb-3">
                    Main hormonal concern:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: 'irregular_periods', label: 'Irregular periods' },
                      { value: 'heavy_painful_periods', label: 'Heavy or painful periods' },
                      { value: 'no_periods', label: 'Missed/absent periods' },
                      { value: 'menopause_symptoms', label: 'Menopause symptoms' },
                      { value: 'pms_pmdd', label: 'PMS/PMDD symptoms' },
                      { value: 'fertility_issues', label: 'Fertility concerns' },
                      { value: 'other_hormonal', label: 'Other hormonal symptoms' }
                    ].map((option) => (
                      <RadioCard
                        key={option.value}
                        name="primaryHormonalConcern"
                        value={option.value}
                        checked={formData.primaryHormonalConcern === option.value}
                        onChange={handleInputChange}
                        label={option.label}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-white font-medium mb-3">
                    Menstrual pattern:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: 'regular_21_35', label: 'Regular (21-35 days)' },
                      { value: 'irregular_unpredictable', label: 'Irregular/unpredictable' },
                      { value: 'frequent_under21', label: 'Too frequent (<21 days)' },
                      { value: 'infrequent_over35', label: 'Too infrequent (>35 days)' },
                      { value: 'absent_3months', label: 'Absent for 3+ months' },
                      { value: 'postmenopausal', label: 'Postmenopausal' }
                    ].map((option) => (
                      <RadioCard
                        key={option.value}
                        name="cyclePattern"
                        value={option.value}
                        checked={formData.cyclePattern === option.value}
                        onChange={handleInputChange}
                        label={option.label}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-white font-medium mb-3">
                    Experiencing: (check all that apply)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: 'hot_flashes', label: 'Hot flashes' },
                      { value: 'night_sweats', label: 'Night sweats' },
                      { value: 'mood_swings', label: 'Severe mood swings' },
                      { value: 'breast_tenderness', label: 'Breast tenderness' },
                      { value: 'pelvic_pain', label: 'Pelvic pain' },
                      { value: 'vaginal_changes', label: 'Vaginal dryness/changes' },
                      { value: 'weight_gain', label: 'Unexplained weight gain' },
                      { value: 'acne', label: 'Hormonal acne' },
                      { value: 'excess_hair', label: 'Excess facial/body hair' }
                    ].map((option) => (
                      <CheckboxCard
                        key={option.value}
                        checked={formData.femaleHormonalSymptoms?.includes(option.value) || false}
                        onChange={() => handleCheckboxChange('femaleHormonalSymptoms', option.value)}
                        label={option.label}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-white font-medium mb-3">
                    Relevant factors: (check all that apply)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: 'pregnancy_possible', label: 'Could be pregnant' },
                      { value: 'breastfeeding', label: 'Currently breastfeeding' },
                      { value: 'birth_control', label: 'On birth control' },
                      { value: 'trying_conceive', label: 'Trying to conceive' },
                      { value: 'recent_pregnancy', label: 'Recent pregnancy/miscarriage' },
                      { value: 'pcos_diagnosis', label: 'PCOS diagnosis' },
                      { value: 'thyroid_issues', label: 'Thyroid problems' }
                    ].map((option) => (
                      <CheckboxCard
                        key={option.value}
                        checked={formData.hormonalRelevantFactors?.includes(option.value) || false}
                        onChange={() => handleCheckboxChange('hormonalRelevantFactors', option.value)}
                        label={option.label}
                      />
                    ))}
                  </div>
                </div>
              </>
            )}

            {formData.biologicalSex === 'male' && (
              <>
                <div>
                  <label className="block text-white font-medium mb-3">
                    Main concern:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: 'low_energy', label: 'Low energy/fatigue' },
                      { value: 'libido_changes', label: 'Low libido' },
                      { value: 'erectile_issues', label: 'Erectile dysfunction' },
                      { value: 'mood_changes', label: 'Mood changes/irritability' },
                      { value: 'body_changes', label: 'Body composition changes' },
                      { value: 'fertility', label: 'Fertility concerns' },
                      { value: 'other_hormonal', label: 'Other hormonal symptoms' }
                    ].map((option) => (
                      <RadioCard
                        key={option.value}
                        name="primaryHormonalConcern"
                        value={option.value}
                        checked={formData.primaryHormonalConcern === option.value}
                        onChange={handleInputChange}
                        label={option.label}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-white font-medium mb-3">
                    Experiencing: (check all that apply)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: 'decreased_muscle', label: 'Decreased muscle mass' },
                      { value: 'increased_fat', label: 'Increased body fat' },
                      { value: 'breast_tissue', label: 'Breast tissue development' },
                      { value: 'hot_flashes', label: 'Hot flashes' },
                      { value: 'decreased_body_hair', label: 'Decreased body/facial hair' },
                      { value: 'testicular_changes', label: 'Testicular size changes' },
                      { value: 'sleep_issues', label: 'Sleep disturbances' },
                      { value: 'concentration', label: 'Poor concentration' },
                      { value: 'depression', label: 'Depression' }
                    ].map((option) => (
                      <CheckboxCard
                        key={option.value}
                        checked={formData.maleHormonalSymptoms?.includes(option.value) || false}
                        onChange={() => handleCheckboxChange('maleHormonalSymptoms', option.value)}
                        label={option.label}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-white font-medium mb-3">
                    These changes:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: 'gradual_months', label: 'Gradual over months' },
                      { value: 'sudden_weeks', label: 'Sudden over weeks' },
                      { value: 'years_slow', label: 'Very slow over years' },
                      { value: 'after_event', label: 'After specific event/illness' }
                    ].map((option) => (
                      <RadioCard
                        key={option.value}
                        name="hormonalOnsetPattern"
                        value={option.value}
                        checked={formData.hormonalOnsetPattern === option.value}
                        onChange={handleInputChange}
                        label={option.label}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-white font-medium mb-3">
                    Relevant factors: (check all that apply)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: 'testosterone_therapy', label: 'On testosterone therapy' },
                      { value: 'anabolic_steroids', label: 'History of steroid use' },
                      { value: 'testicular_injury', label: 'Previous testicular injury' },
                      { value: 'chemotherapy', label: 'Previous chemotherapy' },
                      { value: 'obesity', label: 'Significant weight gain' },
                      { value: 'diabetes', label: 'Diabetes diagnosis' },
                      { value: 'opioid_use', label: 'Chronic opioid use' }
                    ].map((option) => (
                      <CheckboxCard
                        key={option.value}
                        checked={formData.hormonalRelevantFactors?.includes(option.value) || false}
                        onChange={() => handleCheckboxChange('hormonalRelevantFactors', option.value)}
                        label={option.label}
                      />
                    ))}
                  </div>
                </div>
              </>
            )}

            {formData.biologicalSex && (
              <div>
                <label className="block text-white font-medium mb-3">
                  These symptoms:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'mild_manageable', label: 'Mild, manageable' },
                    { value: 'affecting_work', label: 'Affecting work/daily life' },
                    { value: 'affecting_relationships', label: 'Affecting relationships' },
                    { value: 'severe_disabling', label: 'Severe, disabling' }
                  ].map((option) => (
                    <RadioCard
                      key={option.value}
                      name="hormonalImpactOnLife"
                      value={option.value}
                      checked={formData.hormonalImpactOnLife === option.value}
                      onChange={handleInputChange}
                      label={option.label}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )

      case 'neurological':
        return (
          <>
            <div>
              <label className="block text-white font-medium mb-3">
                Main neurological issue:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'headaches', label: 'Headaches' },
                  { value: 'dizziness', label: 'Dizziness/vertigo' },
                  { value: 'numbness_tingling', label: 'Numbness or tingling' },
                  { value: 'vision_changes', label: 'Vision changes' },
                  { value: 'balance_coordination', label: 'Balance/coordination issues' },
                  { value: 'seizure_fainting', label: 'Seizures or fainting' },
                  { value: 'tremor', label: 'Tremor or shaking' }
                ].map((option) => (
                  <RadioCard
                    key={option.value}
                    name="primaryNeuroSymptom"
                    value={option.value}
                    checked={formData.primaryNeuroSymptom === option.value}
                    onChange={handleInputChange}
                    label={option.label}
                  />
                ))}
              </div>
            </div>

            {formData.primaryNeuroSymptom === 'headaches' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
              >
                <label className="block text-white font-medium mb-3">
                  Headache characteristics:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'throbbing_one_side', label: 'Throbbing, one side (migraine)' },
                    { value: 'band_around_head', label: 'Band around head (tension)' },
                    { value: 'stabbing_ice_pick', label: 'Stabbing/ice pick' },
                    { value: 'pressure_sinus', label: 'Pressure in face/sinuses' },
                    { value: 'cluster_eye', label: 'Severe around one eye' },
                    { value: 'thunderclap', label: 'Sudden, severe onset' }
                  ].map((option) => (
                    <RadioCard
                      key={option.value}
                      name="headachePattern"
                      value={option.value}
                      checked={formData.headachePattern === option.value}
                      onChange={handleInputChange}
                      label={option.label}
                    />
                  ))}
                </div>
              </motion.div>
            )}

            <div>
              <label className="block text-white font-medium mb-3">
                Symptoms occur:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'constant', label: 'Constant' },
                  { value: 'episodes_minutes', label: 'Episodes lasting minutes' },
                  { value: 'episodes_hours', label: 'Episodes lasting hours' },
                  { value: 'episodes_days', label: 'Episodes lasting days' },
                  { value: 'specific_triggers', label: 'With specific triggers' },
                  { value: 'random', label: 'Randomly' }
                ].map((option) => (
                  <RadioCard
                    key={option.value}
                    name="neurologicalTiming"
                    value={option.value}
                    checked={formData.neurologicalTiming === option.value}
                    onChange={handleInputChange}
                    label={option.label}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-white font-medium mb-3">
                Also experiencing: (check all that apply)
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'weakness', label: 'Weakness' },
                  { value: 'speech_changes', label: 'Speech changes' },
                  { value: 'memory_confusion', label: 'Memory issues/confusion' },
                  { value: 'vision_changes', label: 'Vision changes' },
                  { value: 'sensitivity', label: 'Light/sound sensitivity' },
                  { value: 'nausea', label: 'Nausea with symptoms' }
                ].map((option) => (
                  <CheckboxCard
                    key={option.value}
                    checked={formData.associatedNeuroSymptoms?.includes(option.value) || false}
                    onChange={() => handleCheckboxChange('associatedNeuroSymptoms', option.value)}
                    label={option.label}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-white font-medium mb-3 text-red-400">
                Any of these symptoms? (check all that apply)
              </label>
              <div className="grid grid-cols-1 gap-2">
                {[
                  { value: 'worst_headache_ever', label: 'Worst headache of life' },
                  { value: 'sudden_weakness', label: 'Sudden one-sided weakness' },
                  { value: 'speech_difficulty', label: 'Difficulty speaking' },
                  { value: 'vision_loss', label: 'Sudden vision loss' },
                  { value: 'confusion', label: 'New confusion' },
                  { value: 'seizure', label: 'Seizure activity' },
                  { value: 'none', label: 'None of these' }
                ].map((option) => (
                  <CheckboxCard
                    key={option.value}
                    checked={formData.neuroRedFlags?.includes(option.value) || false}
                    onChange={() => handleCheckboxChange('neuroRedFlags', option.value)}
                    label={option.label}
                  />
                ))}
              </div>
            </div>
          </>
        )

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
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { ArrowLeft, ArrowRight, Check, Loader2, AlertCircle, Sparkles, Stethoscope, Pill, Calendar, User, FileText, CheckCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface Question {
  id: string
  question: string
  type: 'multiple_choice' | 'text' | 'yes_no' | 'trigger_check'
  options?: string[]
  show_if?: string
  required?: boolean
  placeholder?: string
  category?: string
  rationale?: string
}

// Removed MedicalVisit interface - data will be stored directly in responses

interface FollowUpFormProps {
  assessmentId: string
  assessmentType: string
  questions: Question[]
  context?: {
    condition?: string
    days_since_original: number
    follow_up_number: number
  }
  onSubmit: (responses: Record<string, any>) => Promise<void>
  onCancel: () => void
}

export function FollowUpForm({
  assessmentId,
  assessmentType,
  questions,
  context,
  onSubmit,
  onCancel
}: FollowUpFormProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [responses, setResponses] = useState<Record<string, any>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const progress = ((currentQuestionIndex + 1) / questions.length) * 100
  const isLastQuestion = currentQuestionIndex === questions.length - 1
  const hasAnsweredAtLeastOne = Object.keys(responses).length > 0

  // Check if question should be shown based on conditions
  const shouldShowQuestion = (question: Question) => {
    if (!question.show_if) return true
    
    // Handle Q2 specifically - only show if Q1 is answered "Yes"
    if (question.id === 'q2') {
      const q1Response = responses.q1
      // Only show Q2 if Q1 is explicitly "Yes"
      return q1Response === 'Yes'
    }
    
    // Parse condition (e.g., "q1 != No", "q1 == Yes")
    const parts = question.show_if.split(' ')
    if (parts.length < 3) return true
    
    const questionId = parts[0]
    const operator = parts[1]
    const value = parts.slice(2).join(' ') // Handle multi-word values
    const response = responses[questionId]
    
    // If the referenced question hasn't been answered, hide this question
    if (!response) return false
    
    if (operator === '!=') return response !== value
    if (operator === '==') return response === value
    return true
  }

  // Get visible questions only
  const visibleQuestions = questions.filter(shouldShowQuestion)
  const actualCurrentQuestion = visibleQuestions[currentQuestionIndex]

  // Handle response update
  const updateResponse = (value: any) => {
    setResponses(prev => ({
      ...prev,
      [actualCurrentQuestion.id]: value
    }))
  }

  // Handle navigation
  const goToNext = () => {
    if (currentQuestionIndex < visibleQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
    }
  }

  const goToPrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1)
    }
  }

  // Handle form submission
  const handleSubmit = async () => {
    // Validate medical visit details if doctor was seen
    if (responses.q5 === 'Yes' && (!responses.q5_provider_type || !responses.q5_assessment || !responses.q5_treatments)) {
      setError('Please complete the medical visit details before submitting.')
      return
    }
    
    setIsSubmitting(true)
    setError(null)
    
    try {
      await onSubmit(responses)
    } catch (err) {
      setError('Failed to submit follow-up. Please try again.')
      setIsSubmitting(false)
    }
  }

  // Render question based on type
  const renderQuestion = () => {
    if (!actualCurrentQuestion) return null
    
    const isAiQuestion = actualCurrentQuestion.category === 'ai'
    
    console.log('Rendering question:', actualCurrentQuestion.id, 'Type:', actualCurrentQuestion.type)
    
    // Special handling for Q1 - always render as yes/no regardless of backend type
    if (actualCurrentQuestion.id === 'q1') {
      return (
        <div className="space-y-4">
          <RadioGroup
            value={responses[actualCurrentQuestion.id] || ''}
            onValueChange={updateResponse}
            className="space-y-3"
          >
            <div className="flex items-center space-x-3 p-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] transition-all border border-white/[0.05] hover:border-white/[0.1]">
              <RadioGroupItem value="Yes" id={`${actualCurrentQuestion.id}-yes`} />
              <Label htmlFor={`${actualCurrentQuestion.id}-yes`} className="cursor-pointer text-white">Yes</Label>
            </div>
            <div className="flex items-center space-x-3 p-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] transition-all border border-white/[0.05] hover:border-white/[0.1]">
              <RadioGroupItem value="No" id={`${actualCurrentQuestion.id}-no`} />
              <Label htmlFor={`${actualCurrentQuestion.id}-no`} className="cursor-pointer text-white">No</Label>
            </div>
          </RadioGroup>
          
          {/* Show info message if Yes is selected */}
          {responses[actualCurrentQuestion.id] === 'Yes' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-3 p-3 bg-gradient-to-r from-purple-500/[0.05] to-blue-500/[0.05] border border-purple-500/[0.2] rounded-lg"
            >
              <p className="text-sm text-purple-300">
                Great! The next question will ask about specific changes.
              </p>
            </motion.div>
          )}
        </div>
      )
    }

    // Special handling for Q5 (doctor visit question) - always render as yes/no with medical form
    if (actualCurrentQuestion.id === 'q5') {
      return (
        <div className="space-y-4">
          <RadioGroup
            value={responses[actualCurrentQuestion.id] || ''}
            onValueChange={updateResponse}
            className="space-y-3"
          >
            <div className="flex items-center space-x-3 p-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] transition-all border border-white/[0.05] hover:border-white/[0.1]">
              <RadioGroupItem value="Yes" id={`${actualCurrentQuestion.id}-yes`} />
              <Label htmlFor={`${actualCurrentQuestion.id}-yes`} className="cursor-pointer text-white">Yes</Label>
            </div>
            <div className="flex items-center space-x-3 p-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] transition-all border border-white/[0.05] hover:border-white/[0.1]">
              <RadioGroupItem value="No" id={`${actualCurrentQuestion.id}-no`} />
              <Label htmlFor={`${actualCurrentQuestion.id}-no`} className="cursor-pointer text-white">No</Label>
            </div>
          </RadioGroup>
          
          {/* Show inline medical visit form when Yes is selected */}
          <AnimatePresence>
            {responses[actualCurrentQuestion.id] === 'Yes' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="mt-6"
              >
                <div className="relative">
                  {/* Visual connector from Yes button to form */}
                  <div className="absolute -top-3 left-8 w-px h-3 bg-gradient-to-b from-purple-500/40 to-transparent" />
                  
                  <div className="backdrop-blur-[30px] bg-gradient-to-br from-purple-500/[0.08] via-purple-500/[0.05] to-blue-500/[0.08] border border-purple-500/[0.15] rounded-2xl p-6 shadow-2xl">
                    {/* Header with gradient accent */}
                    <div className="flex items-center gap-3 mb-5 pb-4 border-b border-white/[0.05]">
                      <div className="p-2 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-lg">
                        <Stethoscope className="w-5 h-5 text-purple-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">Medical Visit Details</h3>
                        <p className="text-xs text-gray-400 mt-0.5">Tell us about your doctor visit</p>
                      </div>
                    </div>
                    
                    {/* Provider Type with icon grid */}
                    <div className="space-y-3">
                      <Label className="text-gray-300 font-medium flex items-center gap-2">
                        <User className="w-4 h-4 text-purple-400" />
                        Who did you see?
                      </Label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {['Primary Care', 'Specialist', 'Urgent Care', 'Emergency', 'Telehealth'].map(option => (
                          <button
                            key={option}
                            type="button"
                            onClick={() => setResponses(prev => ({ ...prev, q5_provider_type: option }))}
                            className={`px-3 py-2.5 rounded-lg border transition-all text-sm font-medium ${
                              responses.q5_provider_type === option
                                ? 'bg-gradient-to-r from-purple-500/20 to-blue-500/20 border-purple-500/40 text-white shadow-lg shadow-purple-500/10'
                                : 'bg-white/[0.02] border-white/[0.05] text-gray-400 hover:bg-white/[0.05] hover:text-white hover:border-white/[0.1]'
                            }`}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                      
                      <AnimatePresence>
                        {responses.q5_provider_type === 'Specialist' && (
                          <motion.input
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 40 }}
                            exit={{ opacity: 0, height: 0 }}
                            type="text"
                            placeholder="What type of specialist? (e.g., Cardiologist, Dermatologist)"
                            className="w-full px-4 py-2.5 text-white bg-white/[0.03] border border-white/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500/30 placeholder-gray-500 text-sm transition-all"
                            value={responses.q5_specialty || ''}
                            onChange={(e) => setResponses(prev => ({ ...prev, q5_specialty: e.target.value }))}
                          />
                        )}
                      </AnimatePresence>
                    </div>
                    
                    {/* Assessment with enhanced textarea */}
                    <div className="space-y-3 mt-5">
                      <Label className="text-gray-300 font-medium flex items-center gap-2">
                        <FileText className="w-4 h-4 text-purple-400" />
                        What was their assessment?
                      </Label>
                      <Textarea
                        placeholder="Describe what the doctor said about your condition..."
                        value={responses.q5_assessment || ''}
                        onChange={(e) => setResponses(prev => ({ ...prev, q5_assessment: e.target.value }))}
                        className="min-h-[100px] resize-none"
                        rows={3}
                      />
                    </div>
                    
                    {/* Treatments with pill icon */}
                    <div className="space-y-3 mt-5">
                      <Label className="text-gray-300 font-medium flex items-center gap-2">
                        <Pill className="w-4 h-4 text-purple-400" />
                        What treatments did they recommend?
                      </Label>
                      <Textarea
                        placeholder="List any medications, procedures, therapy, or lifestyle changes..."
                        value={responses.q5_treatments || ''}
                        onChange={(e) => setResponses(prev => ({ ...prev, q5_treatments: e.target.value }))}
                        className="min-h-[100px] resize-none"
                        rows={3}
                      />
                    </div>
                    
                    {/* Follow-up timing with calendar */}
                    <div className="space-y-3 mt-5">
                      <Label className="text-gray-300 font-medium flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-purple-400" />
                        When is your next appointment?
                        <span className="text-xs text-gray-500 font-normal">(optional)</span>
                      </Label>
                      <input
                        type="text"
                        placeholder="e.g., In 2 weeks, Next month, As needed..."
                        className="w-full px-4 py-3 text-white bg-white/[0.03] border border-white/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500/30 placeholder-gray-500 transition-all"
                        value={responses.q5_follow_up_timing || ''}
                        onChange={(e) => setResponses(prev => ({ ...prev, q5_follow_up_timing: e.target.value }))}
                      />
                    </div>

                    {/* Completion indicator */}
                    {responses.q5_provider_type && responses.q5_assessment && responses.q5_treatments && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mt-5 p-3 bg-gradient-to-r from-green-500/[0.05] to-emerald-500/[0.05] border border-green-500/[0.2] rounded-lg"
                      >
                        <p className="text-sm text-green-400 flex items-center gap-2">
                          <Check className="w-4 h-4" />
                          Medical visit details complete
                        </p>
                      </motion.div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )
    }

    switch (actualCurrentQuestion.type) {
      case 'multiple_choice':
        return (
          <RadioGroup
            value={responses[actualCurrentQuestion.id] || ''}
            onValueChange={updateResponse}
            className="space-y-3"
          >
            {actualCurrentQuestion.options?.map(option => (
              <div key={option} className="flex items-center space-x-3 p-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] transition-all border border-white/[0.05] hover:border-white/[0.1]">
                <RadioGroupItem value={option} id={`${actualCurrentQuestion.id}-${option}`} />
                <Label htmlFor={`${actualCurrentQuestion.id}-${option}`} className="cursor-pointer flex-1 text-white">
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        )

      case 'trigger_check':
        return (
          <div className="space-y-4">
            <RadioGroup
              value={responses[actualCurrentQuestion.id] || ''}
              onValueChange={updateResponse}
              className="space-y-3"
            >
              {(actualCurrentQuestion.options || ['Yes', 'No', 'Not sure']).map(option => (
                <div key={option} className="flex items-center space-x-3 p-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] transition-all border border-white/[0.05] hover:border-white/[0.1]">
                  <RadioGroupItem value={option} id={`${actualCurrentQuestion.id}-${option}`} />
                  <Label htmlFor={`${actualCurrentQuestion.id}-${option}`} className="cursor-pointer text-white">
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
            
            {responses[actualCurrentQuestion.id] === 'Yes' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Textarea
                  placeholder="What specific triggers or patterns have you noticed?"
                  value={responses[`${actualCurrentQuestion.id}_triggers`] || ''}
                  onChange={(e) => setResponses(prev => ({
                    ...prev,
                    [`${actualCurrentQuestion.id}_triggers`]: e.target.value
                  }))}
                  className="mt-3"
                  rows={3}
                />
              </motion.div>
            )}
          </div>
        )

      case 'yes_no':
        return (
          <div className="space-y-4">
            <RadioGroup
              value={responses[actualCurrentQuestion.id] || ''}
              onValueChange={updateResponse}
              className="space-y-3"
            >
              <div className="flex items-center space-x-3 p-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] transition-all border border-white/[0.05] hover:border-white/[0.1]">
                <RadioGroupItem value="Yes" id={`${actualCurrentQuestion.id}-yes`} />
                <Label htmlFor={`${actualCurrentQuestion.id}-yes`} className="cursor-pointer text-white">Yes</Label>
              </div>
              <div className="flex items-center space-x-3 p-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] transition-all border border-white/[0.05] hover:border-white/[0.1]">
                <RadioGroupItem value="No" id={`${actualCurrentQuestion.id}-no`} />
                <Label htmlFor={`${actualCurrentQuestion.id}-no`} className="cursor-pointer text-white">No</Label>
              </div>
            </RadioGroup>
            
            {/* Q2 will be shown as a separate question if Q1 is Yes */}
            
            {/* Show inline medical visit form when Yes is selected for doctor question */}
            {actualCurrentQuestion.id === 'q5' && responses[actualCurrentQuestion.id] === 'Yes' && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: -20 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0, y: -20 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="mt-4"
              >
                <div className="relative">
                  {/* Connecting line from Yes button to form */}
                  <div className="absolute -top-4 left-8 w-0.5 h-4 bg-gradient-to-b from-purple-500/50 to-purple-500/20" />
                  
                  <div className="backdrop-blur-[20px] bg-gradient-to-r from-purple-500/[0.08] to-blue-500/[0.08] border border-purple-500/[0.2] rounded-xl p-6 space-y-5">
                    <div className="flex items-center gap-2 mb-4">
                      <Stethoscope className="w-5 h-5 text-purple-400" />
                      <h3 className="text-lg font-semibold text-white">Medical Visit Details</h3>
                    </div>
                    
                    {/* Provider Type */}
                    <div>
                      <Label className="text-gray-300 font-medium mb-2 flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Who did you see?
                      </Label>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {['Primary Care', 'Specialist', 'Urgent Care', 'Emergency', 'Telehealth'].map(option => (
                          <button
                            key={option}
                            type="button"
                            onClick={() => setResponses(prev => ({ ...prev, q5_provider_type: option }))}
                            className={`p-2 rounded-lg border transition-all text-sm ${
                              responses.q5_provider_type === option
                                ? 'bg-purple-500/20 border-purple-500/50 text-white'
                                : 'bg-white/[0.02] border-white/[0.05] text-gray-400 hover:bg-white/[0.05] hover:text-white'
                            }`}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                      
                      {responses.q5_provider_type === 'Specialist' && (
                        <motion.input
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          type="text"
                          placeholder="What type of specialist?"
                          className="mt-2 w-full px-4 py-2 text-white bg-white/[0.03] border border-white/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50 placeholder-gray-500 text-sm"
                          value={responses.q5_specialty || ''}
                          onChange={(e) => setResponses(prev => ({ ...prev, q5_specialty: e.target.value }))}
                        />
                      )}
                    </div>
                    
                    {/* Assessment */}
                    <div>
                      <Label className="text-gray-300 font-medium mb-2 flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        What was their assessment?
                      </Label>
                      <Textarea
                        placeholder="What the doctor said about your condition..."
                        value={responses.q5_assessment || ''}
                        onChange={(e) => setResponses(prev => ({ ...prev, q5_assessment: e.target.value }))}
                        className="mt-2"
                        rows={3}
                      />
                    </div>
                    
                    {/* Treatments */}
                    <div>
                      <Label className="text-gray-300 font-medium mb-2 flex items-center gap-2">
                        <Pill className="w-4 h-4" />
                        What treatments did they recommend?
                      </Label>
                      <Textarea
                        placeholder="Medications, procedures, therapy, lifestyle changes..."
                        value={responses.q5_treatments || ''}
                        onChange={(e) => setResponses(prev => ({ ...prev, q5_treatments: e.target.value }))}
                        className="mt-2"
                        rows={3}
                      />
                    </div>
                    
                    {/* Follow-up timing */}
                    <div>
                      <Label className="text-gray-300 font-medium mb-2 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        When is your next appointment? (optional)
                      </Label>
                      <input
                        type="text"
                        placeholder="e.g., 2 weeks, next month, as needed..."
                        className="mt-2 w-full px-4 py-3 text-white bg-white/[0.03] border border-white/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50 placeholder-gray-500"
                        value={responses.q5_follow_up_timing || ''}
                        onChange={(e) => setResponses(prev => ({ ...prev, q5_follow_up_timing: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        )

      case 'text':
        return (
          <Textarea
            placeholder={actualCurrentQuestion.placeholder || 'Enter your response...'}
            value={responses[actualCurrentQuestion.id] || ''}
            onChange={(e) => updateResponse(e.target.value)}
            rows={4}
            className="w-full"
          />
        )


      default:
        console.warn('Unknown question type:', actualCurrentQuestion.type)
        // Fallback to yes/no for unrecognized types
        return (
          <RadioGroup
            value={responses[actualCurrentQuestion.id] || ''}
            onValueChange={updateResponse}
            className="space-y-3"
          >
            <div className="flex items-center space-x-3 p-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] transition-all border border-white/[0.05] hover:border-white/[0.1]">
              <RadioGroupItem value="Yes" id={`${actualCurrentQuestion.id}-yes`} />
              <Label htmlFor={`${actualCurrentQuestion.id}-yes`} className="cursor-pointer text-white">Yes</Label>
            </div>
            <div className="flex items-center space-x-3 p-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] transition-all border border-white/[0.05] hover:border-white/[0.1]">
              <RadioGroupItem value="No" id={`${actualCurrentQuestion.id}-no`} />
              <Label htmlFor={`${actualCurrentQuestion.id}-no`} className="cursor-pointer text-white">No</Label>
            </div>
          </RadioGroup>
        )
    }
  }

  return (
    <>
      <Card className="max-w-2xl mx-auto p-6">
        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-400 mb-2">
            <span>Progress</span>
            <span className="text-purple-400">{Math.round(progress)}% complete</span>
          </div>
          <div className="h-2 bg-white/[0.05] rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
        
        {/* Context banner if follow-up number > 1 */}
        {context && context.follow_up_number > 1 && (
          <div className="mb-4 p-3 bg-gradient-to-r from-blue-500/[0.05] to-purple-500/[0.05] border border-blue-500/[0.2] rounded-lg">
            <p className="text-sm text-blue-300">
              Follow-up #{context.follow_up_number} • {context.days_since_original} days since initial assessment
              {context.condition && ` • Tracking: ${context.condition}`}
            </p>
          </div>
        )}

        {/* Question display */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestionIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="min-h-[300px]"
          >
            {/* AI Question indicator */}
            {actualCurrentQuestion?.category === 'ai' && (
              <div className="mb-3 inline-flex items-center gap-1.5 text-xs font-medium text-purple-600 dark:text-purple-400">
                <Sparkles className="h-3 w-3" />
                <span>Personalized Question</span>
              </div>
            )}
            
            <h2 className="text-xl font-semibold mb-2 text-white">
              {actualCurrentQuestion?.question}
            </h2>
            
            {/* Show rationale for AI questions */}
            {actualCurrentQuestion?.rationale && (
              <p className="text-sm text-gray-400 mb-4">
                {actualCurrentQuestion.rationale}
              </p>
            )}
            
            <div className="mt-6">
              {renderQuestion()}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Error display */}
        {error && (
          <div className="mt-4 p-3 bg-gradient-to-r from-red-500/[0.1] to-rose-500/[0.1] border border-red-500/[0.2] rounded-lg flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-400" />
            <span className="text-sm text-red-300">{error}</span>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            onClick={goToPrevious}
            disabled={currentQuestionIndex === 0}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          <div className="flex gap-2">
            <Button variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
            
            {isLastQuestion ? (
              <Button 
                onClick={handleSubmit} 
                disabled={isSubmitting || !hasAnsweredAtLeastOne}
                title={!hasAnsweredAtLeastOne ? 'Please answer at least one question' : ''}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Submit Follow-Up
                  </>
                )}
              </Button>
            ) : (
              <Button onClick={goToNext}>
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </Card>
    </>
  )
}
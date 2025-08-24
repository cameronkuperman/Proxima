'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import RefinementQuestion from './RefinementQuestion'
import { useRefinement } from '@/hooks/useRefinement'
import { AssessmentRefinementResponse } from '@/lib/general-assessment-client'
import { 
  Activity,
  AlertCircle,
  Brain,
  ChevronDown,
  ChevronRight,
  Heart,
  Lightbulb,
  Shield,
  TrendingUp,
  Battery,
  Pill,
  RefreshCw,
  HelpCircle,
  Target,
  FileText,
  ArrowRight,
  CheckCircle,
  Clock,
  AlertTriangle,
  BarChart3
} from 'lucide-react'
import { useRouter } from 'next/navigation'

interface GeneralAssessmentResultProps {
  result: {
    assessment_id: string
    analysis: {
      primary_assessment: string
      confidence: number
      key_findings: string[]
      possible_causes: Array<{
        condition: string
        likelihood: number
        explanation: string
      }>
      recommendations: string[]
      urgency: 'low' | 'medium' | 'high' | 'emergency'
      follow_up_questions?: string[]
    }
    // New fields from backend
    severity_level?: 'low' | 'moderate' | 'high' | 'urgent'
    confidence_level?: 'low' | 'medium' | 'high'
    what_this_means?: string
    immediate_actions?: string[]
    red_flags?: string[]
    tracking_metrics?: string[]
    follow_up_timeline?: {
      check_progress: string
      see_doctor_if: string
    }
  }
  category: string
  formData: any
  onNewAssessment: () => void
  onDeepDive?: () => void
}

const categoryConfig = {
  energy: { icon: Battery, color: 'from-yellow-500 to-orange-500', label: 'Energy & Fatigue' },
  mental: { icon: Brain, color: 'from-purple-500 to-pink-500', label: 'Mental Health' },
  sick: { icon: Heart, color: 'from-red-500 to-pink-500', label: 'Feeling Sick' },
  physical: { icon: Activity, color: 'from-red-500 to-rose-500', label: 'Physical Pain/Injury' },
  medication: { icon: Pill, color: 'from-blue-500 to-cyan-500', label: 'Medicine Side Effects' },
  multiple: { icon: RefreshCw, color: 'from-green-500 to-teal-500', label: 'Multiple Issues' },
  unsure: { icon: HelpCircle, color: 'from-gray-500 to-gray-600', label: 'Not Sure' }
}

const urgencyColors = {
  low: 'text-green-400',
  medium: 'text-amber-400',
  high: 'text-orange-400',
  emergency: 'text-red-400'
}

const severityConfig = {
  low: { color: 'bg-green-500/20 text-green-400 border-green-500/30', label: 'Low' },
  moderate: { color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', label: 'Moderate' },
  high: { color: 'bg-orange-500/20 text-orange-400 border-orange-500/30', label: 'High' },
  urgent: { color: 'bg-red-500/20 text-red-400 border-red-500/30 animate-pulse', label: 'Urgent' }
}

const confidenceLevels = {
  low: { width: '33%', color: 'bg-gray-400' },
  medium: { width: '66%', color: 'bg-amber-400' },
  high: { width: '100%', color: 'bg-green-400' }
}

export default function GeneralAssessmentResult({
  result,
  category: categoryId,
  formData,
  onNewAssessment,
  onDeepDive
}: GeneralAssessmentResultProps) {
  const router = useRouter()
  const [expandedCause, setExpandedCause] = useState<number | null>(null)
  const [showAllFindings, setShowAllFindings] = useState(false)
  const [showFollowUp, setShowFollowUp] = useState(false)
  const [showRefinement, setShowRefinement] = useState(false)
  const [refinedData, setRefinedData] = useState<AssessmentRefinementResponse | null>(null)
  
  const category = categoryConfig[categoryId as keyof typeof categoryConfig] || categoryConfig.unsure
  const CategoryIcon = category.icon
  
  // Use refinement hook if follow-up questions exist
  const refinementHook = result.analysis.follow_up_questions && result.analysis.follow_up_questions.length > 0
    ? useRefinement({
        assessmentId: result.assessment_id,
        questions: result.analysis.follow_up_questions,
        originalConfidence: result.analysis.confidence,
        onComplete: (refinedResult) => {
          setRefinedData(refinedResult)
          setShowRefinement(false)
        }
      })
    : null
    
  // Use refined data if available
  const displayConfidence = refinedData?.refined_confidence || result.analysis.confidence
  const displayAssessment = refinedData?.refined_analysis.refined_primary_assessment || result.analysis.primary_assessment

  return (
    <div className="max-w-4xl mx-auto">
      {/* Emergency Alert Banner */}
      {result.analysis.urgency === 'emergency' && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl"
        >
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-red-400 animate-pulse" />
            <div>
              <h2 className="text-lg font-bold text-red-400">Emergency Medical Attention Required</h2>
              <p className="text-sm text-red-300">This assessment indicates a potentially life-threatening condition. Seek immediate medical help.</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Header with Severity and Confidence */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r ${category.color} opacity-20 mb-4`}>
          <CategoryIcon className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">General Assessment Complete</h1>
        <p className="text-gray-400 mb-4">{category.label} Analysis</p>
        
        {/* Severity and Confidence Badges */}
        <div className="flex items-center justify-center gap-4">
          {result.severity_level && (
            <span className={`px-3 py-1 rounded-full text-sm font-medium border ${severityConfig[result.severity_level].color}`}>
              {severityConfig[result.severity_level].label} Severity
            </span>
          )}
          {result.confidence_level && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">Confidence:</span>
              <div className="w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${confidenceLevels[result.confidence_level].color} transition-all duration-500`}
                  style={{ width: confidenceLevels[result.confidence_level].width }}
                />
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* What This Means - New Section */}
      {result.what_this_means && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="backdrop-blur-[20px] bg-gradient-to-r from-blue-500/[0.05] to-purple-500/[0.05] border border-blue-500/[0.2] rounded-xl p-6 mb-6"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
              <Lightbulb className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">What This Means</h3>
              <p className="text-gray-300 leading-relaxed">{result.what_this_means}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Primary Assessment */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl p-6 mb-6"
      >
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${category.color} opacity-20 flex items-center justify-center flex-shrink-0`}>
            <Target className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">Primary Assessment</h3>
            <p className="text-gray-300 leading-relaxed">{displayAssessment}</p>
            <div className="mt-3 flex items-center gap-4">
              <span className={`text-sm font-medium ${urgencyColors[result.analysis.urgency]}`}>
                {result.analysis.urgency === 'emergency' ? 'EMERGENCY' : 
                 result.analysis.urgency.charAt(0).toUpperCase() + result.analysis.urgency.slice(1) + ' Priority'}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">
                  Confidence: {displayConfidence}%
                </span>
                {refinedData && (
                  <span className="text-xs text-green-400 font-medium">
                    (+{refinedData.confidence_improvement.toFixed(0)}% improved)
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Refined Results Section - Show when refinement is complete */}
      {refinedData && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="backdrop-blur-[20px] bg-gradient-to-r from-purple-500/[0.05] to-pink-500/[0.05] border border-purple-500/[0.2] rounded-xl p-6 mb-6"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-6 h-6 text-purple-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white mb-2">Refined Diagnosis</h3>
              <div className="space-y-4">
                {/* Diagnostic Certainty Badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/30">
                  <span className="text-sm font-medium text-purple-300">
                    {refinedData.diagnostic_certainty === 'definitive' ? 'Definitive' :
                     refinedData.diagnostic_certainty === 'probable' ? 'Probable' : 'Provisional'} Diagnosis
                  </span>
                </div>
                
                {/* Next Steps */}
                <div className="space-y-3">
                  <div className="p-3 bg-white/[0.03] rounded-lg border border-white/[0.05]">
                    <p className="text-xs text-gray-400 mb-1">Immediate Action</p>
                    <p className="text-sm text-white">{refinedData.refined_analysis.next_steps.immediate}</p>
                  </div>
                  <div className="p-3 bg-white/[0.03] rounded-lg border border-white/[0.05]">
                    <p className="text-xs text-gray-400 mb-1">Next 24-48 Hours</p>
                    <p className="text-sm text-white">{refinedData.refined_analysis.next_steps.short_term}</p>
                  </div>
                  <div className="p-3 bg-white/[0.03] rounded-lg border border-white/[0.05]">
                    <p className="text-xs text-gray-400 mb-1">Follow-up Required</p>
                    <p className="text-sm text-white">{refinedData.refined_analysis.next_steps.follow_up}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Immediate Actions - New Section */}
      {result.immediate_actions && result.immediate_actions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="backdrop-blur-[20px] bg-gradient-to-r from-emerald-500/[0.05] to-green-500/[0.05] border border-emerald-500/[0.2] rounded-xl p-6 mb-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            Take Action Now
          </h3>
          <div className="space-y-3">
            {result.immediate_actions.map((action, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-emerald-400">{index + 1}</span>
                </div>
                <p className="text-gray-300">{action}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Key Findings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl p-6 mb-6"
      >
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Brain className="w-5 h-5 text-purple-400" />
          Key Findings
        </h3>
        <div className="space-y-2">
          {result.analysis.key_findings
            .slice(0, showAllFindings ? undefined : 3)
            .map((finding, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="flex items-start gap-3"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2" />
                <p className="text-gray-300 text-sm">{finding}</p>
              </motion.div>
            ))}
        </div>
        {result.analysis.key_findings.length > 3 && (
          <button
            onClick={() => setShowAllFindings(!showAllFindings)}
            className="text-emerald-400 hover:text-emerald-300 text-sm mt-3 flex items-center gap-1"
          >
            {showAllFindings ? 'Show less' : `Show ${result.analysis.key_findings.length - 3} more`}
            <ChevronDown className={`w-4 h-4 transition-transform ${showAllFindings && 'rotate-180'}`} />
          </button>
        )}
      </motion.div>

      {/* Possible Causes */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl p-6 mb-6"
      >
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Brain className="w-5 h-5 text-indigo-400" />
          Possible Causes
        </h3>
        <div className="space-y-3">
          {result.analysis.possible_causes.map((cause, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + index * 0.1 }}
              className="border border-white/[0.05] rounded-lg p-4 cursor-pointer hover:bg-white/[0.02] transition-all"
              onClick={() => setExpandedCause(expandedCause === index ? null : index)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-500/20">
                    <span className="text-sm font-semibold text-indigo-400">
                      {cause.likelihood}%
                    </span>
                  </div>
                  <h4 className="font-medium text-white">{cause.condition}</h4>
                </div>
                <ChevronRight 
                  className={`w-4 h-4 text-gray-400 transition-transform ${
                    expandedCause === index && 'rotate-90'
                  }`} 
                />
              </div>
              <AnimatePresence>
                {expandedCause === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <p className="text-sm text-gray-400 mt-3 pl-11">
                      {cause.explanation}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Recommendations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl p-6 mb-6"
      >
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-green-400" />
          Recommendations
        </h3>
        <div className="grid gap-3">
          {result.analysis.recommendations.map((rec, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 + index * 0.1 }}
              className="flex items-start gap-3 p-3 bg-white/[0.02] rounded-lg"
            >
              <TrendingUp className="w-4 h-4 text-green-400 mt-0.5" />
              <p className="text-sm text-gray-300">{rec}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Follow-up Questions with Refinement */}
      {result.analysis.follow_up_questions && result.analysis.follow_up_questions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl p-6 mb-6"
        >
          <button
            onClick={() => setShowFollowUp(!showFollowUp)}
            className="w-full flex items-center justify-between"
          >
            <div>
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-purple-400" />
                AI Has Follow-up Questions - Answer to Improve Accuracy
              </h3>
              {result.analysis.confidence < 80 && !refinedData && (
                <p className="text-xs text-amber-400 mt-1 text-left">
                  Current confidence is {result.analysis.confidence}%. Answering these questions can boost accuracy by 15-30%.
                </p>
              )}
            </div>
            <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${showFollowUp && 'rotate-180'}`} />
          </button>
          <AnimatePresence>
            {showFollowUp && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mt-4"
              >
                {!showRefinement ? (
                  <>
                    {/* Show questions list when not refining */}
                    <div className="space-y-2 mb-4">
                      {result.analysis.follow_up_questions.map((question, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <span className="text-purple-400">•</span>
                          <p className="text-sm text-gray-300">{question}</p>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setShowRefinement(true)}
                        className="flex-1 py-2 rounded-lg bg-purple-500 text-white hover:bg-purple-600 transition-all flex items-center justify-center gap-2 font-medium"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Quick Refine
                      </button>
                      <button
                        onClick={onDeepDive}
                        className="flex-1 py-2 rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-all flex items-center justify-center gap-2"
                      >
                        Deep Dive
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </>
                ) : refinementHook ? (
                  <>
                    {/* Refinement Interface */}
                    <div className="mb-4">
                      {/* Confidence Progress Bar */}
                      <div className="mb-6">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-400">Confidence Progress</span>
                          <span className="text-sm font-medium text-white">
                            {refinementHook.confidenceProgress.toFixed(0)}%
                            {refinementHook.confidenceImprovement > 0 && (
                              <span className="text-green-400 ml-1">
                                (+{refinementHook.confidenceImprovement.toFixed(0)}%)
                              </span>
                            )}
                          </span>
                        </div>
                        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                            initial={{ width: `${result.analysis.confidence}%` }}
                            animate={{ width: `${refinementHook.confidenceProgress}%` }}
                            transition={{ duration: 0.5, ease: 'easeOut' }}
                          />
                        </div>
                      </div>

                      {/* Questions */}
                      <div className="space-y-3">
                        {result.analysis.follow_up_questions.map((question, index) => (
                          <RefinementQuestion
                            key={index}
                            question={question}
                            questionIndex={index}
                            totalQuestions={result.analysis.follow_up_questions.length}
                            isActive={index === refinementHook.currentQuestionIndex}
                            isAnswered={refinementHook.answers.has(question)}
                            onAnswer={(answer) => refinementHook.handleAnswer(index, answer)}
                            answer={refinementHook.answers.get(question)}
                          />
                        ))}
                      </div>

                      {/* Loading State */}
                      {refinementHook.isRefining && (
                        <div className="mt-4 p-4 bg-purple-500/10 rounded-lg border border-purple-500/20">
                          <div className="flex items-center gap-3">
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                              className="w-5 h-5 border-2 border-purple-400 border-t-transparent rounded-full"
                            />
                            <span className="text-sm text-purple-300">Refining assessment with your answers...</span>
                          </div>
                        </div>
                      )}

                      {/* Error State */}
                      {refinementHook.error && (
                        <div className="mt-4 p-4 bg-red-500/10 rounded-lg border border-red-500/20">
                          <p className="text-sm text-red-400">{refinementHook.error}</p>
                        </div>
                      )}
                    </div>

                    {/* Cancel Button */}
                    <button
                      onClick={() => {
                        setShowRefinement(false)
                        refinementHook.resetRefinement()
                      }}
                      className="w-full py-2 rounded-lg border border-gray-700 text-gray-400 hover:bg-white/[0.03] transition-all"
                    >
                      Cancel Refinement
                    </button>
                  </>
                ) : null}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Red Flags - New Section */}
      {result.red_flags && result.red_flags.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="backdrop-blur-[20px] bg-gradient-to-r from-red-500/[0.05] to-orange-500/[0.05] border border-red-500/[0.2] rounded-xl p-6 mb-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            Warning Signs to Watch For
          </h3>
          <div className="space-y-2">
            {result.red_flags.map((flag, index) => (
              <div key={index} className="flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                <p className="text-gray-300">{flag}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-red-500/10 rounded-lg border border-red-500/20">
            <p className="text-sm text-red-300">If you experience any of these symptoms, seek medical attention immediately.</p>
          </div>
        </motion.div>
      )}

      {/* Tracking Metrics - New Section */}
      {result.tracking_metrics && result.tracking_metrics.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl p-6 mb-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-cyan-400" />
            Track These Daily
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {result.tracking_metrics.map((metric, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-white/[0.02] rounded-lg border border-white/[0.05]">
                <div className="w-2 h-2 rounded-full bg-cyan-400" />
                <p className="text-gray-300 text-sm">{metric}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Follow-up Timeline - New Section */}
      {result.follow_up_timeline && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl p-6 mb-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-400" />
            Timeline & Follow-up
          </h3>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-indigo-400">✓</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-400">Check Progress</p>
                <p className="text-gray-300">{result.follow_up_timeline.check_progress}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-orange-400">!</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-400">See a Doctor If</p>
                <p className="text-gray-300">{result.follow_up_timeline.see_doctor_if}</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="flex gap-4"
      >
        <button
          onClick={onNewAssessment}
          className="flex-1 py-3 rounded-xl border border-white/[0.08] text-white hover:bg-white/[0.03] transition-all"
        >
          New Assessment
        </button>
        <button
          onClick={() => router.push('/reports/generate')}
          className="flex-1 py-3 rounded-xl border border-white/[0.08] text-white hover:bg-white/[0.03] transition-all flex items-center justify-center gap-2"
        >
          <FileText className="w-4 h-4" />
          Generate Report
        </button>
        <button
          onClick={() => router.push('/dashboard')}
          className={`flex-1 py-3 rounded-xl bg-gradient-to-r ${category.color} text-white font-semibold hover:opacity-90 transition-all`}
        >
          Back to Dashboard
        </button>
      </motion.div>
    </div>
  )
}
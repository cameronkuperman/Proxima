'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
  ArrowRight
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
  
  const category = categoryConfig[categoryId as keyof typeof categoryConfig] || categoryConfig.unsure
  const CategoryIcon = category.icon

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

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r ${category.color} opacity-20 mb-4`}>
          <CategoryIcon className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">General Assessment Complete</h1>
        <p className="text-gray-400">{category.label} Analysis</p>
      </motion.div>

      {/* Primary Assessment */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl p-6 mb-6"
      >
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${category.color} opacity-20 flex items-center justify-center flex-shrink-0`}>
            <Target className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">Primary Assessment</h3>
            <p className="text-gray-300 leading-relaxed">{result.analysis.primary_assessment}</p>
            <div className="mt-3 flex items-center gap-4">
              <span className={`text-sm font-medium ${urgencyColors[result.analysis.urgency]}`}>
                {result.analysis.urgency === 'emergency' ? 'EMERGENCY' : 
                 result.analysis.urgency.charAt(0).toUpperCase() + result.analysis.urgency.slice(1) + ' Priority'}
              </span>
              <span className="text-sm text-gray-400">
                Confidence: {result.analysis.confidence}%
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Key Findings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl p-6 mb-6"
      >
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-amber-400" />
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

      {/* Follow-up Questions */}
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
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-purple-400" />
              AI Has Follow-up Questions
            </h3>
            <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${showFollowUp && 'rotate-180'}`} />
          </button>
          <AnimatePresence>
            {showFollowUp && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mt-4 space-y-2"
              >
                {result.analysis.follow_up_questions.map((question, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <span className="text-purple-400">•</span>
                    <p className="text-sm text-gray-300">{question}</p>
                  </div>
                ))}
                <button
                  onClick={onDeepDive}
                  className="mt-4 w-full py-2 rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-all flex items-center justify-center gap-2"
                >
                  Answer with Deep Dive
                  <ArrowRight className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
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
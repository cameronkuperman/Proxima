'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Brain,
  MessageSquare,
  Target,
  Lightbulb,
  TrendingUp,
  Shield,
  FileText,
  ChevronDown,
  ChevronRight,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Sparkles
} from 'lucide-react'
import { useRouter } from 'next/navigation'

interface GeneralDeepDiveResultProps {
  result: {
    deep_dive_id: string
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
      urgency: 'low' | 'medium' | 'high'
      reasoning_snippets: string[]
    }
    category: string
    questions_asked: number
    session_duration_ms: number
  }
  conversationHistory: Array<{
    question: string
    answer: string
  }>
  onNewAssessment: () => void
}

const categoryColors = {
  energy: 'from-yellow-500 to-orange-500',
  mental: 'from-purple-500 to-pink-500',
  sick: 'from-red-500 to-pink-500',
  medication: 'from-blue-500 to-cyan-500',
  multiple: 'from-green-500 to-teal-500',
  unsure: 'from-gray-500 to-gray-600'
}

export default function GeneralDeepDiveResult({
  result,
  conversationHistory,
  onNewAssessment
}: GeneralDeepDiveResultProps) {
  const router = useRouter()
  const [showConversation, setShowConversation] = useState(false)
  const [expandedReasoning, setExpandedReasoning] = useState(false)
  const [expandedCause, setExpandedCause] = useState<number | null>(null)
  
  const categoryColor = categoryColors[(result?.category || 'unsure') as keyof typeof categoryColors] || categoryColors.unsure
  const sessionMinutes = Math.floor((result?.session_duration_ms || 0) / 60000)
  const sessionSeconds = Math.floor(((result?.session_duration_ms || 0) % 60000) / 1000)

  const urgencyConfig = {
    low: { color: 'text-green-400', icon: CheckCircle },
    medium: { color: 'text-amber-400', icon: AlertCircle },
    high: { color: 'text-red-400', icon: AlertCircle }
  }

  // Safely get urgency with fallback
  const urgency = result.analysis?.urgency || 'medium'
  const UrgencyIcon = urgencyConfig[urgency as keyof typeof urgencyConfig]?.icon || AlertCircle

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r ${categoryColor} opacity-20 mb-4`}>
          <Brain className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Deep Dive Complete</h1>
        <p className="text-gray-400">Comprehensive analysis based on {result.questions_asked} diagnostic questions</p>
      </motion.div>

      {/* Session Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-3 gap-4 mb-6"
      >
        <div className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl p-4 text-center">
          <Clock className="w-5 h-5 text-gray-400 mx-auto mb-1" />
          <p className="text-2xl font-bold text-white">{sessionMinutes}:{sessionSeconds.toString().padStart(2, '0')}</p>
          <p className="text-xs text-gray-400">Duration</p>
        </div>
        <div className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl p-4 text-center">
          <MessageSquare className="w-5 h-5 text-gray-400 mx-auto mb-1" />
          <p className="text-2xl font-bold text-white">{result.questions_asked}</p>
          <p className="text-xs text-gray-400">Questions</p>
        </div>
        <div className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl p-4 text-center">
          <Target className="w-5 h-5 text-gray-400 mx-auto mb-1" />
          <p className="text-2xl font-bold text-white">{result.analysis.confidence}%</p>
          <p className="text-xs text-gray-400">Confidence</p>
        </div>
      </motion.div>

      {/* Primary Assessment with Urgency */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl p-6 mb-6"
      >
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Primary Assessment</h3>
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.05] ${urgencyConfig[urgency as keyof typeof urgencyConfig]?.color || 'text-amber-400'}`}>
            <UrgencyIcon className="w-4 h-4" />
            <span className="text-sm font-medium">
              {urgency.charAt(0).toUpperCase() + urgency.slice(1)} Priority
            </span>
          </div>
        </div>
        <p className="text-gray-300 leading-relaxed text-lg">
          {result.analysis?.primary_assessment || 'Assessment details are being processed...'}
        </p>
      </motion.div>

      {/* AI Reasoning */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl p-6 mb-6"
      >
        <button
          onClick={() => setExpandedReasoning(!expandedReasoning)}
          className="w-full flex items-center justify-between"
        >
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            AI's Reasoning Process
          </h3>
          <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${expandedReasoning && 'rotate-180'}`} />
        </button>
        <AnimatePresence>
          {expandedReasoning && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-4 space-y-3"
            >
              {(result.analysis?.reasoning_snippets || []).map((snippet, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs text-indigo-400">{index + 1}</span>
                  </div>
                  <p className="text-sm text-gray-300">{snippet}</p>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Key Findings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl p-6 mb-6"
      >
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-amber-400" />
          Key Findings
        </h3>
        <div className="grid gap-3">
          {(result.analysis?.key_findings || []).map((finding, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + index * 0.1 }}
              className="flex items-start gap-3 p-3 bg-white/[0.02] rounded-lg"
            >
              <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5" />
              <p className="text-sm text-gray-300">{finding}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Possible Causes */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl p-6 mb-6"
      >
        <h3 className="text-lg font-semibold text-white mb-4">Differential Analysis</h3>
        <div className="space-y-3">
          {(result.analysis?.possible_causes || []).map((cause, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + index * 0.1 }}
              className="relative"
            >
              <div
                className="border border-white/[0.05] rounded-lg p-4 cursor-pointer hover:bg-white/[0.02] transition-all"
                onClick={() => setExpandedCause(expandedCause === index ? null : index)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="relative w-16 h-16">
                      <svg className="w-16 h-16 -rotate-90">
                        <circle
                          cx="32"
                          cy="32"
                          r="28"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                          className="text-white/[0.1]"
                        />
                        <circle
                          cx="32"
                          cy="32"
                          r="28"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                          strokeDasharray={`${2 * Math.PI * 28 * cause.likelihood / 100} ${2 * Math.PI * 28}`}
                          className="text-indigo-400"
                        />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white">
                        {cause.likelihood}%
                      </span>
                    </div>
                    <div>
                      <h4 className="font-medium text-white">{cause.condition}</h4>
                      <p className="text-sm text-gray-400">
                        {index === 0 ? 'Most likely' : `Alternative ${index}`}
                      </p>
                    </div>
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
                      <p className="text-sm text-gray-400 mt-4 pl-20">
                        {cause.explanation}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Conversation History */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl p-6 mb-6"
      >
        <button
          onClick={() => setShowConversation(!showConversation)}
          className="w-full flex items-center justify-between"
        >
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-gray-400" />
            Diagnostic Conversation
          </h3>
          <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${showConversation && 'rotate-180'}`} />
        </button>
        <AnimatePresence>
          {showConversation && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-4 space-y-4"
            >
              {conversationHistory.map((exchange, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-start gap-3">
                    <Brain className="w-5 h-5 text-indigo-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-400 mb-1">Question {index + 1}</p>
                      <p className="text-sm text-gray-300">{exchange.question}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 ml-8">
                    <div className="flex-1 p-3 bg-white/[0.02] rounded-lg">
                      <p className="text-sm text-white">{exchange.answer}</p>
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Recommendations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl p-6 mb-6"
      >
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-green-400" />
          Personalized Recommendations
        </h3>
        <div className="grid gap-3">
          {(result.analysis?.recommendations || []).map((rec, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.9 + index * 0.1 }}
              className="flex items-start gap-3"
            >
              <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-4 h-4 text-green-400" />
              </div>
              <p className="text-sm text-gray-300">{rec}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <button
          onClick={onNewAssessment}
          className="py-3 px-4 rounded-xl border border-white/[0.08] text-white hover:bg-white/[0.03] transition-all"
        >
          New Assessment
        </button>
        <button
          onClick={() => router.push('/reports/generate')}
          className="py-3 px-4 rounded-xl border border-white/[0.08] text-white hover:bg-white/[0.03] transition-all flex items-center justify-center gap-2"
        >
          <FileText className="w-4 h-4" />
          Generate Report
        </button>
        <button
          onClick={() => router.push('/dashboard')}
          className={`py-3 px-4 rounded-xl bg-gradient-to-r ${categoryColor} text-white font-semibold hover:opacity-90 transition-all flex items-center justify-center gap-2`}
        >
          Back to Dashboard
          <ArrowRight className="w-4 h-4" />
        </button>
      </motion.div>
    </div>
  )
}
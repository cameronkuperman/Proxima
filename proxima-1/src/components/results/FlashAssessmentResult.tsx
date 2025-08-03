'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Sparkles, 
  AlertCircle, 
  ChevronRight, 
  Activity,
  Brain,
  Stethoscope,
  Clock,
  ArrowRight,
  MessageSquare
} from 'lucide-react'
import { useRouter } from 'next/navigation'

interface FlashAssessmentResultProps {
  result: {
    flash_id: string
    response: string
    main_concern: string
    urgency: 'low' | 'medium' | 'high' | 'emergency'
    confidence: number
    next_steps: {
      recommended_action: 'general-assessment' | 'body-scan' | 'see-doctor' | 'monitor'
      reason: string
    }
  }
  userQuery: string
  onNewAssessment: () => void
}

const urgencyConfig = {
  low: {
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/20',
    icon: Clock,
    label: 'Low Urgency'
  },
  medium: {
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/20',
    icon: AlertCircle,
    label: 'Medium Urgency'
  },
  high: {
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/20',
    icon: AlertCircle,
    label: 'High Urgency'
  },
  emergency: {
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/20',
    icon: AlertCircle,
    label: 'Emergency'
  }
}

const actionConfig = {
  'general-assessment': {
    title: 'Take General Assessment',
    description: 'Get a more detailed analysis with structured questions',
    icon: Activity,
    color: 'from-emerald-500 to-green-500',
    route: '/scan?mode=quick&source=general'
  },
  'body-scan': {
    title: 'Use 3D Body Scan',
    description: 'Pinpoint exact location of symptoms on 3D model',
    icon: Stethoscope,
    color: 'from-purple-500 to-pink-500',
    route: '/scan?mode=quick&source=body'
  },
  'see-doctor': {
    title: 'See a Doctor',
    description: 'Your symptoms warrant professional medical attention',
    icon: Stethoscope,
    color: 'from-red-500 to-orange-500',
    route: null
  },
  'monitor': {
    title: 'Monitor Symptoms',
    description: 'Keep track of changes over the next few days',
    icon: Clock,
    color: 'from-blue-500 to-cyan-500',
    route: '/dashboard'
  }
}

export default function FlashAssessmentResult({ 
  result, 
  userQuery, 
  onNewAssessment 
}: FlashAssessmentResultProps) {
  const router = useRouter()
  const [showFullResponse, setShowFullResponse] = useState(false)
  
  const urgency = urgencyConfig[result.urgency]
  const UrgencyIcon = urgency.icon
  const recommendedAction = actionConfig[result.next_steps.recommended_action]
  const ActionIcon = recommendedAction.icon

  const handleActionClick = () => {
    if (recommendedAction.route) {
      router.push(recommendedAction.route)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-amber-500/20 to-yellow-500/20 mb-4">
          <Sparkles className="w-8 h-8 text-amber-400" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Flash Assessment Complete</h1>
        <p className="text-gray-400">Here's what I found based on your description</p>
      </motion.div>

      {/* Your Query */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl p-6 mb-6"
      >
        <div className="flex items-start gap-3">
          <MessageSquare className="w-5 h-5 text-gray-400 mt-1" />
          <div>
            <p className="text-sm text-gray-400 mb-1">You said:</p>
            <p className="text-white italic">"{userQuery}"</p>
          </div>
        </div>
      </motion.div>

      {/* Main Concern & Urgency */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6"
      >
        {/* Main Concern */}
        <div className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl p-6">
          <h3 className="text-sm text-gray-400 mb-2">Main Concern Identified</h3>
          <p className="text-lg font-semibold text-white">{result.main_concern}</p>
        </div>

        {/* Urgency Level */}
        <div className={`backdrop-blur-[20px] bg-white/[0.03] border ${urgency.borderColor} rounded-xl p-6`}>
          <h3 className="text-sm text-gray-400 mb-2">Urgency Level</h3>
          <div className="flex items-center gap-2">
            <UrgencyIcon className={`w-5 h-5 ${urgency.color}`} />
            <p className={`text-lg font-semibold ${urgency.color}`}>{urgency.label}</p>
          </div>
        </div>
      </motion.div>

      {/* AI Response */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl p-6 mb-6"
      >
        <h3 className="text-lg font-semibold text-white mb-3">AI Assessment</h3>
        <div className={`text-gray-300 leading-relaxed ${!showFullResponse && 'line-clamp-3'}`}>
          {result.response}
        </div>
        {result.response.length > 200 && (
          <button
            onClick={() => setShowFullResponse(!showFullResponse)}
            className="text-amber-400 hover:text-amber-300 text-sm mt-2 flex items-center gap-1"
          >
            {showFullResponse ? 'Show less' : 'Read full response'}
            <ChevronRight className={`w-4 h-4 transition-transform ${showFullResponse && 'rotate-90'}`} />
          </button>
        )}
      </motion.div>

      {/* Recommended Next Step */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mb-6"
      >
        <h3 className="text-lg font-semibold text-white mb-4">Recommended Next Step</h3>
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleActionClick}
          className={`backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.08] rounded-xl p-6 cursor-pointer group ${
            !recommendedAction.route && 'cursor-default'
          }`}
        >
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${recommendedAction.color} opacity-20 flex items-center justify-center`}>
              <ActionIcon className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h4 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
                {recommendedAction.title}
                {recommendedAction.route && (
                  <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </h4>
              <p className="text-gray-400 text-sm mb-2">{recommendedAction.description}</p>
              <p className="text-xs text-gray-500">
                Why: {result.next_steps.reason}
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Confidence Score */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl p-4 mb-6"
      >
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">AI Confidence</span>
          <div className="flex items-center gap-2">
            <div className="w-32 h-2 bg-white/[0.1] rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${result.confidence}%` }}
                transition={{ duration: 1, delay: 0.6 }}
                className="h-full bg-gradient-to-r from-amber-500 to-yellow-500"
              />
            </div>
            <span className="text-sm text-white font-medium">{result.confidence}%</span>
          </div>
        </div>
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="flex gap-4"
      >
        <button
          onClick={onNewAssessment}
          className="flex-1 py-3 rounded-xl border border-white/[0.08] text-white hover:bg-white/[0.03] transition-all"
        >
          New Assessment
        </button>
        <button
          onClick={() => router.push('/dashboard')}
          className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-white font-semibold hover:from-amber-600 hover:to-yellow-600 transition-all"
        >
          Back to Dashboard
        </button>
      </motion.div>
    </div>
  )
}
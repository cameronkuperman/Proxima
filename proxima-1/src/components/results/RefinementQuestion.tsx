'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, ChevronRight } from 'lucide-react'

interface RefinementQuestionProps {
  question: string
  questionIndex: number
  totalQuestions: number
  isActive: boolean
  isAnswered: boolean
  onAnswer: (answer: string) => void
  answer?: string
}

export default function RefinementQuestion({
  question,
  questionIndex,
  totalQuestions,
  isActive,
  isAnswered,
  onAnswer,
  answer: savedAnswer
}: RefinementQuestionProps) {
  const [answer, setAnswer] = useState(savedAnswer || '')
  const [hasInteracted, setHasInteracted] = useState(false)

  const handleSubmit = () => {
    if (answer.trim()) {
      onAnswer(answer.trim())
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ 
        opacity: isActive || isAnswered ? 1 : 0.5,
        height: 'auto'
      }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className={`relative ${!isActive && !isAnswered ? 'pointer-events-none' : ''}`}
    >
      <div className={`
        p-4 rounded-lg border transition-all duration-300
        ${isActive 
          ? 'bg-purple-500/10 border-purple-500/30 shadow-lg shadow-purple-500/10' 
          : isAnswered 
            ? 'bg-green-500/5 border-green-500/20' 
            : 'bg-white/[0.02] border-white/[0.05]'
        }
      `}>
        {/* Question Header */}
        <div className="flex items-start gap-3 mb-3">
          <div className={`
            w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5
            transition-all duration-300
            ${isAnswered 
              ? 'bg-green-500/20 text-green-400' 
              : isActive
                ? 'bg-purple-500/20 text-purple-400'
                : 'bg-gray-700 text-gray-500'
            }
          `}>
            {isAnswered ? (
              <Check className="w-3 h-3" />
            ) : (
              <span className="text-xs font-bold">{questionIndex + 1}</span>
            )}
          </div>
          <div className="flex-1">
            <p className={`
              text-sm transition-colors duration-300
              ${isActive ? 'text-white' : isAnswered ? 'text-gray-300' : 'text-gray-500'}
            `}>
              {question}
            </p>
            
            {/* Answer Field */}
            <AnimatePresence>
              {isActive && !isAnswered && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="mt-3"
                >
                  <textarea
                    value={answer}
                    onChange={(e) => {
                      setAnswer(e.target.value)
                      if (!hasInteracted) setHasInteracted(true)
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder="Type your answer here..."
                    rows={3}
                    autoFocus
                    className="w-full px-3 py-2 rounded-lg bg-black/30 text-white text-sm
                             border border-purple-500/30 focus:border-purple-400 focus:outline-none
                             placeholder-gray-500 resize-none"
                  />
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-500">
                      Question {questionIndex + 1} of {totalQuestions}
                    </span>
                    <button
                      onClick={handleSubmit}
                      disabled={!answer.trim()}
                      className={`
                        px-4 py-1.5 rounded-lg text-sm font-medium
                        flex items-center gap-2 transition-all duration-200
                        ${answer.trim()
                          ? 'bg-purple-500 text-white hover:bg-purple-600'
                          : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                        }
                      `}
                    >
                      Continue
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Saved Answer Display */}
            {isAnswered && savedAnswer && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-2 p-2 rounded bg-black/20 border border-green-500/10"
              >
                <p className="text-sm text-gray-400">{savedAnswer}</p>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
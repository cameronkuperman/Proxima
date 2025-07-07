'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Brain, MessageSquare, Sparkles, Construction, Send, MousePointer, ChevronDown, FileText, Activity, Shield, TrendingUp, Calendar, AlertCircle, Heart, Stethoscope } from 'lucide-react'

interface DeepDiveDemoProps {
  onComplete: () => void
}

interface Message {
  id: string
  type: 'user' | 'ai'
  content: string
  typing?: boolean
}

interface FormData {
  bodyPart: string
  symptoms: string
  painLevel: string
  duration: string
  frequency: string
  triggers: string
  dailyImpact: string
  sleepImpact: string
  worseWhen: string
  betterWhen: string
}

export function DeepDiveDemo({ onComplete }: DeepDiveDemoProps) {
  const [step, setStep] = useState<'intro' | 'body' | 'form' | 'chat' | 'report'>('intro')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    bodyPart: 'Head',
    symptoms: '',
    painLevel: '5',
    duration: '',
    frequency: '',
    triggers: '',
    dailyImpact: '',
    sleepImpact: '',
    worseWhen: '',
    betterWhen: ''
  })
  const [messages, setMessages] = useState<Message[]>([])
  const [currentTyping, setCurrentTyping] = useState('')
  const [userInput, setUserInput] = useState('')
  const [showPresetResponses, setShowPresetResponses] = useState(false)

  useEffect(() => {
    if (step === 'intro') {
      setTimeout(() => setStep('body'), 3000)
    } else if (step === 'body') {
      setTimeout(() => setStep('form'), 3000)
    }
  }, [step])

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.symptoms.trim()) {
      return
    }
    setStep('chat')
    
    // Initialize chat with AI starting the conversation
    setTimeout(() => {
      const initialMessage: Message = {
        id: '1',
        type: 'ai',
        content: '',
        typing: true
      }
      setMessages([initialMessage])
      
      const aiGreeting = `Thank you for providing that information. I understand you're experiencing ${formData.symptoms} in your ${formData.bodyPart.toLowerCase()} area with a pain level of ${formData.painLevel}/10. Let me ask you a few follow-up questions to better understand your condition.`
      typeMessage(aiGreeting, '1', () => {
        // After greeting, ask first question
        setTimeout(() => {
          const questionMessage: Message = {
            id: '2',
            type: 'ai',
            content: '',
            typing: true
          }
          setMessages(prev => [...prev, questionMessage])
          const firstQuestion = "Have you noticed if the symptoms worsen at any particular time of day or during specific activities?"
          typeMessage(firstQuestion, '2', () => {
            setShowPresetResponses(true)
          })
        }, 1000)
      })
    }, 500)
  }

  const typeMessage = (text: string, messageId: string, onComplete?: () => void) => {
    let index = 0
    const interval = setInterval(() => {
      if (index < text.length) {
        setMessages(prev => prev.map(msg => 
          msg.id === messageId 
            ? { ...msg, content: text.slice(0, index + 1), typing: index < text.length - 1 }
            : msg
        ))
        index++
      } else {
        clearInterval(interval)
        if (onComplete) onComplete()
      }
    }, 20)
  }

  const handlePresetResponse = (response: string) => {
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: response
    }
    setMessages(prev => [...prev, userMessage])
    setShowPresetResponses(false)

    // AI responds
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: '',
        typing: true
      }
      setMessages(prev => [...prev, aiMessage])
      
      let aiResponse = ""
      if (messages.length < 4) {
        aiResponse = "I see. That's helpful information. Can you describe the nature of the pain? Is it sharp, dull, throbbing, or burning?"
      } else {
        aiResponse = "Based on what you've told me, this appears to be consistent with tension headaches, likely triggered by stress and poor sleep. The pattern you describe - worsening throughout the day and throbbing pain - is characteristic. I'd recommend scheduling an appointment with a healthcare provider for a proper evaluation. Would you like to see a detailed analysis report?"
      }
      
      typeMessage(aiResponse, aiMessage.id, () => {
        if (messages.length < 4) {
          setShowPresetResponses(true)
        } else {
          // Show button to view full report
          setTimeout(() => {
            const reportButton: Message = {
              id: 'report-btn',
              type: 'ai',
              content: '[VIEW_FULL_REPORT]'
            }
            setMessages(prev => [...prev, reportButton])
          }, 500)
        }
      })
    }, 1000)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const presetResponses = {
    timeOfDay: [
      "Mostly in the morning when I wake up",
      "Gets worse throughout the day",
      "No particular pattern",
      "Worse at night before bed"
    ],
    painType: [
      "Sharp, stabbing pain",
      "Dull, constant ache",
      "Throbbing or pulsating",
      "Burning sensation"
    ]
  }

  const currentPresets = messages.length < 3 ? presetResponses.timeOfDay : presetResponses.painType

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-8"
      >
        <button
          onClick={onComplete}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to features
        </button>
        
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-amber-400 to-orange-400 text-black text-sm font-medium">
          <Construction className="w-3 h-3" />
          Beta Access - January 2025
        </div>
      </motion.div>

      {/* Content */}
      <div className="flex-1 relative">
        <AnimatePresence mode="wait">
          {/* Intro */}
          {step === 'intro' && (
            <motion.div
              key="intro"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <div className="text-center max-w-2xl">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring" }}
                  className="mb-8"
                >
                  <div className="w-24 h-24 mx-auto bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                    <Brain className="w-12 h-12 text-white" />
                  </div>
                </motion.div>
                <h3 className="text-5xl font-bold text-white mb-4">Deep Dive Analysis</h3>
                <p className="text-xl text-gray-300">
                  Our AI asks intelligent follow-up questions to provide comprehensive health insights
                </p>
              </div>
            </motion.div>
          )}

          {/* Body Selection Step */}
          {step === 'body' && (
            <motion.div
              key="body"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <div className="text-center max-w-3xl">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring" }}
                  className="mb-6"
                >
                  <div className="w-20 h-20 mx-auto bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full flex items-center justify-center border-2 border-purple-500">
                    <MousePointer className="w-10 h-10 text-purple-400" />
                  </div>
                </motion.div>
                <h3 className="text-4xl font-bold text-white mb-6">
                  Since you just tried the 3D model, we won't have you do that again
                </h3>
                <p className="text-xl text-gray-300 mb-8">
                  Deep Dive normally starts with precise 3D body selection, followed by our comprehensive health form
                </p>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/20 text-purple-400 text-sm"
                >
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
                  Moving to detailed health form...
                </motion.div>
              </div>
            </motion.div>
          )}

          {/* Initial Form */}
          {step === 'form' && (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-4xl mx-auto"
            >
              <div className="text-center mb-8">
                <h3 className="text-3xl font-bold text-white mb-2">
                  Let's gather detailed information
                </h3>
                <p className="text-gray-400 text-lg">
                  The more details you provide, the better our AI can help
                </p>
              </div>

              <form onSubmit={handleFormSubmit} className="bg-gray-900/50 rounded-3xl p-10 border border-white/10">
                <div className="space-y-6">
                  {/* Body part (pre-filled from 3D selection) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-3">
                      Selected body area
                    </label>
                    <input
                      type="text"
                      value={formData.bodyPart}
                      disabled
                      className="w-full px-6 py-4 rounded-xl bg-gray-800/30 text-gray-400 border border-gray-700"
                    />
                  </div>

                  {/* Primary symptom description - Required */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-3">
                      Describe your symptoms in detail <span className="text-red-400">*</span>
                    </label>
                    <textarea
                      name="symptoms"
                      value={formData.symptoms}
                      onChange={handleInputChange}
                      placeholder="Be as specific as possible about what you're experiencing..."
                      required
                      rows={4}
                      className="w-full px-6 py-4 rounded-xl bg-gray-800/50 text-white border border-gray-700 focus:border-purple-500 focus:outline-none resize-none"
                    />
                  </div>

                  {/* Pain level */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-3">
                      Pain level (1-10)
                    </label>
                    <div className="flex items-center gap-4">
                      <input
                        type="range"
                        name="painLevel"
                        min="1"
                        max="10"
                        value={formData.painLevel}
                        onChange={handleInputChange}
                        className="flex-1"
                      />
                      <span className="text-2xl font-bold text-white w-12 text-center">{formData.painLevel}</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-2">
                      <span>Mild</span>
                      <span>Moderate</span>
                      <span>Severe</span>
                    </div>
                  </div>

                  {/* Duration */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-3">
                      How long have you experienced these symptoms?
                    </label>
                    <select
                      name="duration"
                      value={formData.duration}
                      onChange={handleInputChange}
                      className="w-full px-6 py-4 rounded-xl bg-gray-800/50 text-white border border-gray-700 focus:border-purple-500 focus:outline-none"
                    >
                      <option value="">Select duration</option>
                      <option value="hours">A few hours</option>
                      <option value="today">Since today</option>
                      <option value="days">1-3 days</option>
                      <option value="week">4-7 days</option>
                      <option value="weeks">1-2 weeks</option>
                      <option value="month">2-4 weeks</option>
                      <option value="months">More than a month</option>
                    </select>
                  </div>

                  {/* Advanced questions toggle */}
                  <button
                    type="button"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors"
                  >
                    <ChevronDown className={`w-5 h-5 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
                    {showAdvanced ? 'Hide' : 'Show'} advanced health information
                  </button>

                  {/* Advanced questions */}
                  <AnimatePresence>
                    {showAdvanced && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="space-y-6 overflow-hidden"
                      >
                        {/* Frequency */}
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-3">
                            Frequency of symptoms
                          </label>
                          <select
                            name="frequency"
                            value={formData.frequency}
                            onChange={handleInputChange}
                            className="w-full px-6 py-4 rounded-xl bg-gray-800/50 text-white border border-gray-700 focus:border-purple-500 focus:outline-none"
                          >
                            <option value="">Select frequency</option>
                            <option value="constant">Constant</option>
                            <option value="intermittent">Comes and goes</option>
                            <option value="activity">During specific activities</option>
                            <option value="rest">At rest</option>
                            <option value="random">Random/unpredictable</option>
                          </select>
                        </div>

                        {/* Daily Impact */}
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-3">
                            How is this affecting your daily life?
                          </label>
                          <textarea
                            name="dailyImpact"
                            value={formData.dailyImpact}
                            onChange={handleInputChange}
                            placeholder="e.g., Can't work, difficulty sleeping, avoiding activities..."
                            rows={2}
                            className="w-full px-6 py-4 rounded-xl bg-gray-800/50 text-white border border-gray-700 focus:border-purple-500 focus:outline-none resize-none"
                          />
                        </div>

                        {/* Sleep Impact */}
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-3">
                            How is your sleep affected?
                          </label>
                          <select
                            name="sleepImpact"
                            value={formData.sleepImpact}
                            onChange={handleInputChange}
                            className="w-full px-6 py-4 rounded-xl bg-gray-800/50 text-white border border-gray-700 focus:border-purple-500 focus:outline-none"
                          >
                            <option value="">Select sleep impact</option>
                            <option value="none">Not affected</option>
                            <option value="falling">Hard to fall asleep</option>
                            <option value="waking">Wake up due to pain</option>
                            <option value="both">Both falling asleep and waking up</option>
                            <option value="position">Can't find comfortable position</option>
                          </select>
                        </div>

                        {/* What makes it worse */}
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-3">
                            What makes the symptoms worse?
                          </label>
                          <input
                            type="text"
                            name="worseWhen"
                            value={formData.worseWhen}
                            onChange={handleInputChange}
                            placeholder="e.g., Movement, sitting, cold weather, stress..."
                            className="w-full px-6 py-4 rounded-xl bg-gray-800/50 text-white border border-gray-700 focus:border-purple-500 focus:outline-none"
                          />
                        </div>

                        {/* What makes it better */}
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-3">
                            What makes the symptoms better?
                          </label>
                          <input
                            type="text"
                            name="betterWhen"
                            value={formData.betterWhen}
                            onChange={handleInputChange}
                            placeholder="e.g., Rest, heat, stretching, medication..."
                            className="w-full px-6 py-4 rounded-xl bg-gray-800/50 text-white border border-gray-700 focus:border-purple-500 focus:outline-none"
                          />
                        </div>

                        {/* Triggers */}
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-3">
                            Known triggers or patterns
                          </label>
                          <input
                            type="text"
                            name="triggers"
                            value={formData.triggers}
                            onChange={handleInputChange}
                            placeholder="e.g., After eating, during exercise, weather changes..."
                            className="w-full px-6 py-4 rounded-xl bg-gray-800/50 text-white border border-gray-700 focus:border-purple-500 focus:outline-none"
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="flex gap-4 mt-8"
                >
                  <button
                    type="submit"
                    className="flex-1 px-8 py-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium text-lg hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!formData.symptoms.trim()}
                  >
                    Start AI Analysis
                  </button>
                </motion.div>
              </form>
            </motion.div>
          )}

          {/* Chat Interface */}
          {step === 'chat' && (
            <motion.div
              key="chat"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full flex flex-col max-w-5xl mx-auto"
            >
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">
                  AI Health Analysis
                </h3>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-sm">
                  <Construction className="w-3 h-3" />
                  Demo Mode - Real AI coming January 2025
                </div>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 bg-gray-900/50 rounded-3xl border border-white/10 p-8 overflow-y-auto mb-6">
                <div className="space-y-6">
                  {messages.map((message, index) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-2xl px-6 py-4 rounded-2xl ${
                        message.type === 'user' 
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' 
                          : 'bg-gray-800 text-gray-300'
                      }`}>
                        {message.type === 'ai' && (
                          <div className="flex items-center gap-2 mb-2">
                            <Brain className="w-5 h-5 text-purple-400" />
                            <span className="text-sm text-purple-400 font-medium">Proxima AI</span>
                          </div>
                        )}
                        {message.content === '[VIEW_FULL_REPORT]' ? (
                          <button
                            onClick={() => setStep('report')}
                            className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium hover:from-purple-600 hover:to-pink-600 transition-all flex items-center gap-2"
                          >
                            <FileText className="w-5 h-5" />
                            View Detailed Analysis Report
                          </button>
                        ) : (
                          <p className="text-base leading-relaxed">{message.content}</p>
                        )}
                        {message.typing && (
                          <motion.span
                            initial={{ opacity: 0 }}
                            animate={{ opacity: [0, 1, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                            className="inline-block w-1 h-5 bg-current ml-1"
                          />
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Preset Responses */}
              <AnimatePresence>
                {showPresetResponses && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="mb-4"
                  >
                    <p className="text-sm text-gray-400 mb-3">Choose a response or type your own:</p>
                    <div className="grid grid-cols-2 gap-3">
                      {currentPresets.map((response, index) => (
                        <motion.button
                          key={index}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.1 }}
                          onClick={() => handlePresetResponse(response)}
                          className="px-4 py-3 rounded-xl bg-gray-800/50 text-gray-300 hover:bg-gray-800 hover:text-white transition-all text-sm text-left border border-gray-700 hover:border-purple-500"
                        >
                          {response}
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Input Field */}
              <div className="relative">
                <input
                  type="text"
                  placeholder={showPresetResponses ? "Or type your own response..." : "Chat is in demo mode"}
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  disabled={!showPresetResponses}
                  className="w-full px-6 py-4 pr-14 rounded-xl bg-gray-800/50 text-white border border-gray-700 focus:border-purple-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && userInput.trim() && showPresetResponses) {
                      handlePresetResponse(userInput)
                      setUserInput('')
                    }
                  }}
                />
                <button
                  disabled={!showPresetResponses || !userInput.trim()}
                  onClick={() => {
                    if (userInput.trim()) {
                      handlePresetResponse(userInput)
                      setUserInput('')
                    }
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>

              {/* Complete Demo Button */}
              {messages.length >= 6 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 text-center"
                >
                  <button
                    onClick={onComplete}
                    className="px-8 py-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium hover:from-purple-600 hover:to-pink-600 transition-all"
                  >
                    Explore More Features
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}
          {/* Full Analysis Report */}
          {step === 'report' && (
            <motion.div
              key="report"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-6xl mx-auto"
            >
              <div className="mb-6">
                <button
                  onClick={() => setStep('chat')}
                  className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to chat
                </button>
              </div>

              <div className="space-y-6">
                {/* Report Header */}
                <div className="bg-gray-900/50 rounded-3xl border border-white/10 overflow-hidden">
                  <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 p-8">
                    <div className="flex items-start justify-between">
                      <div>
                        <h2 className="text-3xl font-bold text-white mb-2">Deep Dive Analysis Report</h2>
                        <p className="text-gray-300">Comprehensive AI assessment based on extended consultation</p>
                      </div>
                      <div className="px-4 py-2 rounded-xl bg-amber-500/30 text-amber-400 border border-amber-500/50 flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        Medical Attention Advised
                      </div>
                    </div>
                  </div>

                  {/* Patient Information Summary */}
                  <div className="p-8 border-b border-white/10">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <Stethoscope className="w-5 h-5 text-purple-400" />
                      Clinical Summary
                    </h3>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <p className="text-sm text-gray-400 mb-1">Chief Complaint:</p>
                        <p className="text-gray-300">{formData.symptoms}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400 mb-1">Duration:</p>
                        <p className="text-gray-300">{formData.duration || 'Not specified'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400 mb-1">Pain Level:</p>
                        <p className="text-gray-300">{formData.painLevel}/10</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400 mb-1">Impact on Daily Life:</p>
                        <p className="text-gray-300">{formData.dailyImpact || 'Moderate impact'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Primary Assessment */}
                  <div className="p-8">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <Brain className="w-5 h-5 text-purple-400" />
                      AI Assessment
                    </h3>
                    <div className="bg-purple-500/10 rounded-xl p-6 border border-purple-500/30">
                      <h4 className="text-xl font-semibold text-white mb-2">Primary Diagnosis: Tension-Type Headache</h4>
                      <p className="text-gray-300 mb-4">
                        Based on the symptom pattern, duration, and characteristics described, this presentation is most consistent with tension-type headaches. The bilateral location, pressing quality, and association with stress are classic features.
                      </p>
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-purple-400">78%</div>
                          <div className="text-sm text-gray-400">Confidence</div>
                        </div>
                        <div className="flex-1">
                          <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                            <div className="h-full w-[78%] bg-gradient-to-r from-purple-500 to-pink-500" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Detailed Findings Grid */}
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Differential Diagnosis */}
                  <div className="bg-gray-900/50 rounded-2xl border border-white/10 p-6">
                    <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-blue-400" />
                      Differential Diagnosis
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50">
                        <span className="text-gray-300">Tension Headache</span>
                        <span className="text-purple-400 font-medium">78%</span>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50">
                        <span className="text-gray-300">Migraine</span>
                        <span className="text-gray-400">15%</span>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50">
                        <span className="text-gray-300">Cluster Headache</span>
                        <span className="text-gray-400">5%</span>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50">
                        <span className="text-gray-300">Secondary Headache</span>
                        <span className="text-gray-400">2%</span>
                      </div>
                    </div>
                  </div>

                  {/* Risk Factors */}
                  <div className="bg-gray-900/50 rounded-2xl border border-white/10 p-6">
                    <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-amber-400" />
                      Identified Risk Factors
                    </h4>
                    <ul className="space-y-3">
                      <li className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-amber-400 rounded-full mt-2" />
                        <div>
                          <p className="text-gray-300 font-medium">Stress</p>
                          <p className="text-sm text-gray-500">High stress levels reported</p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-amber-400 rounded-full mt-2" />
                        <div>
                          <p className="text-gray-300 font-medium">Sleep Issues</p>
                          <p className="text-sm text-gray-500">{formData.sleepImpact || 'Disrupted sleep pattern'}</p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-amber-400 rounded-full mt-2" />
                        <div>
                          <p className="text-gray-300 font-medium">Posture</p>
                          <p className="text-sm text-gray-500">Potential ergonomic factors</p>
                        </div>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Treatment Plan */}
                <div className="bg-gray-900/50 rounded-2xl border border-white/10 p-6">
                  <h4 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                    <Heart className="w-5 h-5 text-green-400" />
                    Recommended Treatment Plan
                  </h4>
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="space-y-3">
                      <h5 className="text-sm font-medium text-gray-400 uppercase">Immediate Actions</h5>
                      <ul className="space-y-2">
                        <li className="text-gray-300 text-sm flex items-start gap-2">
                          <span className="text-green-400">1.</span>
                          OTC pain relief (ibuprofen 400mg)
                        </li>
                        <li className="text-gray-300 text-sm flex items-start gap-2">
                          <span className="text-green-400">2.</span>
                          Apply cold compress to neck/head
                        </li>
                        <li className="text-gray-300 text-sm flex items-start gap-2">
                          <span className="text-green-400">3.</span>
                          Rest in dark, quiet room
                        </li>
                      </ul>
                    </div>
                    <div className="space-y-3">
                      <h5 className="text-sm font-medium text-gray-400 uppercase">Lifestyle Modifications</h5>
                      <ul className="space-y-2">
                        <li className="text-gray-300 text-sm flex items-start gap-2">
                          <span className="text-blue-400">•</span>
                          Stress management techniques
                        </li>
                        <li className="text-gray-300 text-sm flex items-start gap-2">
                          <span className="text-blue-400">•</span>
                          Regular sleep schedule
                        </li>
                        <li className="text-gray-300 text-sm flex items-start gap-2">
                          <span className="text-blue-400">•</span>
                          Ergonomic workspace setup
                        </li>
                        <li className="text-gray-300 text-sm flex items-start gap-2">
                          <span className="text-blue-400">•</span>
                          Regular exercise routine
                        </li>
                      </ul>
                    </div>
                    <div className="space-y-3">
                      <h5 className="text-sm font-medium text-gray-400 uppercase">Follow-up Care</h5>
                      <ul className="space-y-2">
                        <li className="text-gray-300 text-sm flex items-start gap-2">
                          <span className="text-purple-400">→</span>
                          See PCP within 1 week
                        </li>
                        <li className="text-gray-300 text-sm flex items-start gap-2">
                          <span className="text-purple-400">→</span>
                          Consider neurology referral
                        </li>
                        <li className="text-gray-300 text-sm flex items-start gap-2">
                          <span className="text-purple-400">→</span>
                          Headache diary tracking
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Warning Signs */}
                <div className="bg-red-500/10 rounded-2xl border border-red-500/30 p-6">
                  <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-red-400" />
                    Seek Emergency Care If:
                  </h4>
                  <div className="grid md:grid-cols-2 gap-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-red-400 rounded-full" />
                      <span className="text-gray-300 text-sm">Sudden, severe "thunderclap" headache</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-red-400 rounded-full" />
                      <span className="text-gray-300 text-sm">Headache with fever and stiff neck</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-red-400 rounded-full" />
                      <span className="text-gray-300 text-sm">Vision changes or loss</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-red-400 rounded-full" />
                      <span className="text-gray-300 text-sm">Confusion or difficulty speaking</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="bg-gray-900/50 rounded-2xl border border-white/10 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm text-gray-400">Report generated on {new Date().toLocaleDateString()}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Construction className="w-3 h-3" />
                      Demo Report - Real AI Coming Soon
                    </div>
                  </div>
                  <div className="grid md:grid-cols-3 gap-4">
                    <button className="px-6 py-3 rounded-xl bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors font-medium">
                      📥 Download Full Report
                    </button>
                    <button className="px-6 py-3 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/50 hover:bg-purple-500/30 transition-colors font-medium">
                      📧 Email to Doctor
                    </button>
                    <button className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 transition-all font-medium">
                      🥼 Find Specialists
                    </button>
                  </div>
                </div>
              </div>

              {/* Complete Demo */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mt-8 text-center"
              >
                <button
                  onClick={onComplete}
                  className="px-8 py-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium hover:from-purple-600 hover:to-pink-600 transition-all"
                >
                  Explore More Features
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
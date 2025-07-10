'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Camera, Upload, Clock, TrendingUp, Lock, Image, Plus, X, AlertCircle, ChevronRight } from 'lucide-react'

interface PhotoAnalysisDemoProps {
  onComplete: () => void
}

interface UploadedPhoto {
  id: string
  name: string
  url: string
  date: string
  description?: string
}

interface AnalysisReport {
  confidence: number
  primaryFinding: string
  description: string
  otherPossibilities: string[]
  recommendations: string[]
  severity: 'low' | 'medium' | 'high'
}

interface FormData {
  overallDescription: string
  photoDescriptions: { [key: string]: string }
}

export function PhotoAnalysisDemo({ onComplete }: PhotoAnalysisDemoProps) {
  const [step, setStep] = useState<'intro' | 'upload' | 'form' | 'analysis' | 'report'>('intro')
  const [uploadedPhotos, setUploadedPhotos] = useState<UploadedPhoto[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    overallDescription: '',
    photoDescriptions: {}
  })
  const [currentExample, setCurrentExample] = useState('')
  const [exampleIndex, setExampleIndex] = useState(0)
  const [charIndex, setCharIndex] = useState(0)
  const [isTyping, setIsTyping] = useState(true)

  const EXAMPLE_QUERIES = [
    "Is this spider bite infected?",
    "What type of rash is this?",
    "Should I be concerned about this mole?",
    "Is this healing normally?",
    "Does this look like eczema?",
    "Is this a fungal infection?"
  ]

  useEffect(() => {
    if (step === 'intro') {
      setTimeout(() => setStep('upload'), 3000)
    }
  }, [step])

  // Typing animation effect
  useEffect(() => {
    if (step === 'form') {
      const currentText = EXAMPLE_QUERIES[exampleIndex]
      
      if (isTyping) {
        if (charIndex < currentText.length) {
          const timeout = setTimeout(() => {
            setCurrentExample(currentText.slice(0, charIndex + 1))
            setCharIndex(charIndex + 1)
          }, 50)
          return () => clearTimeout(timeout)
        } else {
          const timeout = setTimeout(() => {
            setIsTyping(false)
          }, 2000)
          return () => clearTimeout(timeout)
        }
      } else {
        if (charIndex > 0) {
          const timeout = setTimeout(() => {
            setCurrentExample(currentText.slice(0, charIndex - 1))
            setCharIndex(charIndex - 1)
          }, 30)
          return () => clearTimeout(timeout)
        } else {
          setExampleIndex((prev) => (prev + 1) % EXAMPLE_QUERIES.length)
          setIsTyping(true)
        }
      }
    }
  }, [charIndex, isTyping, exampleIndex, step, EXAMPLE_QUERIES])

  const handlePhotoUpload = () => {
    const newPhoto: UploadedPhoto = {
      id: Date.now().toString(),
      name: `skin_condition_${uploadedPhotos.length + 1}.jpg`,
      url: `/api/placeholder/200/200`,
      date: new Date().toLocaleDateString()
    }
    
    setUploadedPhotos(prev => [...prev, newPhoto])
    
    if (uploadedPhotos.length === 0) {
      // Show "add more" prompt after first upload
    }
  }

  const startAnalysis = () => {
    setShowForm(true)
    setStep('form')
  }

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.overallDescription.trim()) {
      return
    }
    setIsAnalyzing(true)
    setTimeout(() => {
      setIsAnalyzing(false)
      setStep('analysis')
    }, 3000)
  }

  const handleInputChange = (field: string, value: string) => {
    if (field === 'overallDescription') {
      setFormData(prev => ({ ...prev, overallDescription: value }))
    } else {
      setFormData(prev => ({
        ...prev,
        photoDescriptions: {
          ...prev.photoDescriptions,
          [field]: value
        }
      }))
    }
  }

  const mockReport: AnalysisReport = {
    confidence: 87,
    primaryFinding: "Atypical Nevus",
    description: "Based on the irregular borders and asymmetrical shape you're concerned about, this appears to be an atypical nevus. While most are benign, the irregular features warrant professional evaluation to rule out any concerning changes.",
    otherPossibilities: ["Seborrheic keratosis", "Melanoma"],
    recommendations: [
      "Schedule a dermatologist appointment within 2 weeks",
      "Monitor for any changes in size, color, or shape",
      "Take photos every 2 weeks to track progression",
      "Avoid sun exposure to the area"
    ],
    severity: 'medium'
  }

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
        
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-400 text-sm">
          <Lock className="w-3 h-3" />
          Coming Soon - Q1 2025
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
              <div className="text-center max-w-lg">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring" }}
                  className="mb-6"
                >
                  <div className="w-20 h-20 mx-auto bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                    <Camera className="w-10 h-10 text-white" />
                  </div>
                </motion.div>
                <h3 className="text-3xl font-bold text-white mb-4">Photo Analysis</h3>
                <p className="text-gray-300">
                  Upload photos of your symptoms for AI-powered visual analysis
                </p>
              </div>
            </motion.div>
          )}

          {/* Upload Interface */}
          {(step === 'upload' || step === 'form') && (
            <motion.div
              key="upload"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-3xl mx-auto"
            >
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-white mb-2">
                  Upload photos for analysis
                </h3>
                <p className="text-gray-400">
                  Add up to 5 photos to track progression over time
                </p>
              </div>

              {/* Upload Area */}
              <div className="bg-gray-900/50 rounded-2xl border border-white/10 p-8">
                {/* Uploaded Photos Grid */}
                {uploadedPhotos.length > 0 && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-medium text-white">Uploaded Photos</h4>
                      <span className="text-sm text-gray-400">{uploadedPhotos.length}/5 photos</span>
                    </div>
                    
                    <div className="grid grid-cols-5 gap-3">
                      {uploadedPhotos.map((photo) => (
                        <motion.div
                          key={photo.id}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="relative group"
                        >
                          <div className="aspect-square rounded-lg bg-gray-800 overflow-hidden">
                            <Image className="w-full h-full p-4 text-gray-600" />
                          </div>
                          <button
                            onClick={() => setUploadedPhotos(prev => prev.filter(p => p.id !== photo.id))}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3 text-white" />
                          </button>
                          <p className="text-xs text-gray-500 mt-1 truncate">{photo.date}</p>
                        </motion.div>
                      ))}
                      
                      {uploadedPhotos.length < 5 && (
                        <motion.button
                          onClick={handlePhotoUpload}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="aspect-square rounded-lg border-2 border-dashed border-gray-600 hover:border-orange-500 transition-colors flex items-center justify-center group"
                        >
                          <Plus className="w-8 h-8 text-gray-600 group-hover:text-orange-500" />
                        </motion.button>
                      )}
                    </div>
                  </div>
                )}

                {/* Initial Upload Button */}
                {uploadedPhotos.length === 0 && (
                  <motion.button
                    onClick={handlePhotoUpload}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full"
                  >
                    <div className="border-2 border-dashed border-gray-600 rounded-2xl p-12 text-center hover:border-orange-500 hover:bg-gray-900/70 transition-all group">
                      <Upload className="w-16 h-16 mx-auto mb-4 text-gray-500 group-hover:text-orange-500" />
                      <p className="text-lg font-medium text-gray-300 mb-2">
                        Click to upload photos
                      </p>
                      <p className="text-sm text-gray-500">
                        or drag and drop your images here
                      </p>
                    </div>
                  </motion.button>
                )}

                {/* Analyze Button */}
                {uploadedPhotos.length > 0 && !showForm && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-8 text-center"
                  >
                    <button
                      onClick={startAnalysis}
                      className="px-8 py-3 rounded-lg bg-gradient-to-r from-orange-500 to-red-500 text-white font-medium hover:from-orange-600 hover:to-red-600 transition-all"
                    >
                      Next: Describe Symptoms
                    </button>
                    <p className="text-xs text-gray-500 mt-2">
                      You'll be able to describe each photo
                    </p>
                  </motion.div>
                )}

                {/* Description Form */}
                {showForm && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-8"
                  >
                    <form onSubmit={handleFormSubmit} className="space-y-6">
                      {/* Typing animation */}
                      <div className="text-center mb-6">
                        <p className="text-sm text-gray-500 mb-2">Examples of what you can ask:</p>
                        <p className="text-xl text-orange-400 font-medium min-h-[32px]">
                          {currentExample}
                          <motion.span
                            initial={{ opacity: 0 }}
                            animate={{ opacity: [0, 1, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                            className="inline-block w-0.5 h-6 bg-orange-400 ml-1"
                          />
                        </p>
                      </div>

                      {/* Overall description - Required */}
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-3">
                          What's your main concern? <span className="text-red-400">*</span>
                        </label>
                        <textarea
                          value={formData.overallDescription}
                          onChange={(e) => handleInputChange('overallDescription', e.target.value)}
                          placeholder="Describe your symptoms or what you'd like the AI to analyze..."
                          required
                          rows={3}
                          className="w-full px-6 py-4 rounded-xl bg-gray-800/50 text-white border border-gray-700 focus:border-orange-500 focus:outline-none resize-none"
                        />
                      </div>

                      {/* Individual photo descriptions - Optional */}
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-3">
                          Describe individual photos <span className="text-gray-500">(optional)</span>
                        </label>
                        <div className="space-y-3">
                          {uploadedPhotos.map((photo, index) => (
                            <div key={photo.id} className="flex gap-3 items-start">
                              <div className="w-16 h-16 rounded-lg bg-gray-800 flex items-center justify-center flex-shrink-0">
                                <Image className="w-8 h-8 text-gray-600" />
                              </div>
                              <div className="flex-1">
                                <p className="text-xs text-gray-500 mb-1">Photo {index + 1} - {photo.date}</p>
                                <input
                                  type="text"
                                  value={formData.photoDescriptions[photo.id] || ''}
                                  onChange={(e) => handleInputChange(photo.id, e.target.value)}
                                  placeholder="e.g., Close-up of affected area, taken in morning light"
                                  className="w-full px-4 py-2 rounded-lg bg-gray-800/50 text-white border border-gray-700 focus:border-orange-500 focus:outline-none text-sm"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-4">
                        <button
                          type="button"
                          onClick={() => setShowForm(false)}
                          className="flex-1 px-6 py-3 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors"
                        >
                          Back
                        </button>
                        <button
                          type="submit"
                          disabled={isAnalyzing || !formData.overallDescription.trim()}
                          className="flex-1 px-6 py-3 rounded-lg bg-gradient-to-r from-orange-500 to-red-500 text-white font-medium hover:from-orange-600 hover:to-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isAnalyzing ? (
                            <span className="flex items-center justify-center gap-2">
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                              />
                              Analyzing...
                            </span>
                          ) : (
                            'Analyze Photos'
                          )}
                        </button>
                      </div>
                    </form>
                  </motion.div>
                )}
              </div>

              {/* Tips */}
              {!showForm && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="mt-6 p-4 rounded-lg bg-blue-500/10 border border-blue-500/30"
                >
                  <h5 className="text-sm font-medium text-blue-400 mb-2">Photo Tips:</h5>
                  <ul className="space-y-1 text-xs text-gray-400">
                    <li>• Use good lighting without flash</li>
                    <li>• Include a ruler or coin for size reference</li>
                    <li>• Take photos from the same angle each time</li>
                    <li>• Ensure the area is in focus</li>
                  </ul>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Analysis Report */}
          {step === 'analysis' && (
            <motion.div
              key="analysis"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-2xl mx-auto"
            >
              <div className="bg-gray-900/50 rounded-2xl border border-white/10 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 p-6 border-b border-white/10">
                  <h3 className="text-2xl font-bold text-white mb-2">Medical Analysis</h3>
                  <p className="text-gray-400">AI assessment complete</p>
                </div>

                {/* Analysis Confidence */}
                <div className="p-6 border-b border-white/10">
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-400">Analysis Confidence</span>
                      <span className="text-2xl font-bold text-white">{mockReport.confidence}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${mockReport.confidence}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="h-full bg-gradient-to-r from-orange-500 to-red-500"
                      />
                    </div>
                  </div>
                  <p className="text-sm text-gray-400 italic">
                    {mockReport.description}
                  </p>
                </div>

                {/* Other Possibilities */}
                <div className="p-6 border-b border-white/10">
                  <h4 className="text-sm font-medium text-gray-400 mb-3">OTHER POSSIBILITIES</h4>
                  <ul className="space-y-2">
                    {mockReport.otherPossibilities.map((possibility, index) => (
                      <li key={index} className="flex items-center gap-2 text-gray-300">
                        <span className="text-gray-500">•</span>
                        {possibility}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Key Findings */}
                <div className="p-6 border-b border-white/10">
                  <h4 className="text-sm font-medium text-gray-400 mb-3">KEY FINDINGS</h4>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-amber-400 mt-0.5" />
                      <div>
                        <p className="text-white font-medium">Irregular borders detected</p>
                        <p className="text-sm text-gray-400">Asymmetrical shape with uneven edges</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <TrendingUp className="w-5 h-5 text-blue-400 mt-0.5" />
                      <div>
                        <p className="text-white font-medium">Size progression noted</p>
                        <p className="text-sm text-gray-400">15% increase over comparison period</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recommendations */}
                <div className="p-6">
                  <h4 className="text-sm font-medium text-gray-400 mb-3">RECOMMENDATIONS</h4>
                  <ul className="space-y-2">
                    {mockReport.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <ChevronRight className="w-4 h-4 text-orange-400 mt-0.5" />
                        <span className="text-gray-300 text-sm">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Action Buttons */}
                <div className="p-6 bg-gray-900/50 flex gap-3">
                  <button className="flex-1 px-4 py-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors">
                    Save Report
                  </button>
                  <button className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600 transition-all">
                    Schedule Appointment
                  </button>
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
                  className="px-6 py-3 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium hover:from-purple-600 hover:to-pink-600 transition-all"
                >
                  Explore More Features
                </button>
                <p className="text-sm text-gray-500 mt-2">
                  Get notified when Photo Analysis launches
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
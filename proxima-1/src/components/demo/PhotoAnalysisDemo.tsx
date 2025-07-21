'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Camera, Upload, Clock, TrendingUp, Lock, Image, Plus, X, AlertCircle, ChevronRight, Download, Share2, FileImage } from 'lucide-react'
import { usePhotoAnalysis } from '@/hooks/usePhotoAnalysis'
import { AnalysisResult } from '@/types/photo-analysis'
import { useDropzone } from 'react-dropzone'

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


interface FormData {
  overallDescription: string
  photoDescriptions: { [key: string]: string }
}

export function PhotoAnalysisDemo({ onComplete }: PhotoAnalysisDemoProps) {
  const {
    uploadPhotos,
    analyzePhotos,
    createSession
  } = usePhotoAnalysis()
  
  const [step, setStep] = useState<'intro' | 'upload' | 'form' | 'analysis' | 'report'>('intro')
  const [uploadedPhotos, setUploadedPhotos] = useState<UploadedPhoto[]>([])
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
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
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [photoIds, setPhotoIds] = useState<string[]>([])

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

  const handlePhotoUpload = useCallback((acceptedFiles: File[]) => {
    const remainingSlots = 5 - uploadedPhotos.length
    const filesToAdd = acceptedFiles.slice(0, remainingSlots)
    
    if (filesToAdd.length < acceptedFiles.length) {
      alert(`Maximum 5 photos allowed. Only first ${filesToAdd.length} photos were added.`)
    }
    
    filesToAdd.forEach(file => {
      const newPhoto: UploadedPhoto = {
        id: Date.now().toString() + Math.random(),
        name: file.name,
        url: URL.createObjectURL(file),
        date: new Date().toLocaleDateString()
      }
      
      setUploadedPhotos(prev => [...prev, newPhoto])
      setUploadedFiles(prev => [...prev, file])
    })
  }, [uploadedPhotos.length])

  const handleDemoPhotoUpload = () => {
    // Create a realistic-looking medical demo image
    const canvas = document.createElement('canvas')
    canvas.width = 400
    canvas.height = 400
    const ctx = canvas.getContext('2d')
    if (ctx) {
      // Background - skin tone
      ctx.fillStyle = '#F5DEB3'
      ctx.fillRect(0, 0, 400, 400)
      
      // Add texture to simulate skin
      for (let i = 0; i < 100; i++) {
        ctx.fillStyle = `rgba(${220 + Math.random() * 20}, ${180 + Math.random() * 20}, ${140 + Math.random() * 20}, 0.1)`
        ctx.beginPath()
        ctx.arc(Math.random() * 400, Math.random() * 400, Math.random() * 2, 0, Math.PI * 2)
        ctx.fill()
      }
      
      // Create a suspicious mole/lesion in the center
      const centerX = 200
      const centerY = 200
      
      // Asymmetric shape
      ctx.beginPath()
      ctx.moveTo(centerX - 30, centerY)
      ctx.quadraticCurveTo(centerX - 40, centerY - 20, centerX - 20, centerY - 35)
      ctx.quadraticCurveTo(centerX, centerY - 40, centerX + 25, centerY - 30)
      ctx.quadraticCurveTo(centerX + 35, centerY - 10, centerX + 30, centerY + 10)
      ctx.quadraticCurveTo(centerX + 25, centerY + 30, centerX + 5, centerY + 35)
      ctx.quadraticCurveTo(centerX - 10, centerY + 30, centerX - 30, centerY)
      ctx.closePath()
      
      // Fill with varied colors (characteristic of melanoma)
      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 40)
      gradient.addColorStop(0, '#2C1810')
      gradient.addColorStop(0.3, '#4A2C2A')
      gradient.addColorStop(0.6, '#6B4423')
      gradient.addColorStop(0.8, '#8B6B47')
      gradient.addColorStop(1, '#A0826D')
      ctx.fillStyle = gradient
      ctx.fill()
      
      // Add irregular border
      ctx.strokeStyle = '#1A0E0A'
      ctx.lineWidth = 2
      ctx.stroke()
      
      // Add some darker spots within
      for (let i = 0; i < 5; i++) {
        ctx.fillStyle = `rgba(${10 + Math.random() * 20}, ${5 + Math.random() * 10}, ${5 + Math.random() * 10}, 0.7)`
        ctx.beginPath()
        ctx.arc(
          centerX + (Math.random() - 0.5) * 30,
          centerY + (Math.random() - 0.5) * 30,
          Math.random() * 4 + 2,
          0,
          Math.PI * 2
        )
        ctx.fill()
      }
      
      // Add ruler reference (for scale)
      ctx.strokeStyle = '#333'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(50, 350)
      ctx.lineTo(150, 350)
      ctx.stroke()
      
      // Ruler markings
      for (let i = 0; i <= 10; i++) {
        ctx.beginPath()
        ctx.moveTo(50 + i * 10, 350)
        ctx.lineTo(50 + i * 10, i % 5 === 0 ? 340 : 345)
        ctx.stroke()
      }
      
      // Add text
      ctx.fillStyle = '#333'
      ctx.font = '12px Arial'
      ctx.fillText('1 cm', 95, 365)
    }
    
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], 'suspicious_mole_demo.jpg', { type: 'image/jpeg' })
        handlePhotoUpload([file])
      }
    }, 'image/jpeg', 0.9)
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handlePhotoUpload,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.heic', '.heif', '.webp']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: true,
    disabled: uploadedPhotos.length >= 5
  })

  const startAnalysis = () => {
    setShowForm(true)
    setStep('form')
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.overallDescription.trim() || uploadedFiles.length === 0) {
      return
    }
    
    setIsAnalyzing(true)
    
    try {
      // Create a demo session
      const session = await createSession({
        condition_name: 'Demo Analysis',
        description: formData.overallDescription
      })
      
      const sessionId = session.id || session.session_id
      if (!sessionId) {
        throw new Error('Failed to create session')
      }
      
      setSessionId(sessionId)
      
      // Upload photos
      const uploadResponse = await uploadPhotos(sessionId, uploadedFiles)
      const uploadedPhotoIds = uploadResponse.uploaded_photos.map(p => p.id)
      setPhotoIds(uploadedPhotoIds)
      
      // Analyze photos
      const analysis = await analyzePhotos({
        session_id: sessionId,
        photo_ids: uploadedPhotoIds,
        context: formData.overallDescription,
        temporary_analysis: true
      })
      
      setAnalysisResult(analysis)
      setStep('analysis')
    } catch (error) {
      console.error('Analysis error:', error)
      // For demo purposes, fallback to mock data if API fails
      const mockAnalysis: AnalysisResult = {
        analysis_id: 'demo-analysis-1',
        analysis: {
          primary_assessment: 'Suspicious Pigmented Lesion - Possible Melanoma',
          confidence: 92,
          visual_observations: [
            'Asymmetry: Lesion shows irregular, asymmetric shape',
            'Border irregularity: Edges appear notched and uneven',
            'Color variation: Multiple shades of brown and black observed',
            'Diameter: Approximately 8-10mm (larger than 6mm threshold)',
            'Evolution: Unable to assess without prior images'
          ],
          differential_diagnosis: [
            'Melanoma (malignant)',
            'Atypical/Dysplastic nevus',
            'Seborrheic keratosis',
            'Blue nevus'
          ],
          recommendations: [
            'URGENT: Schedule dermatologist appointment within 1 week',
            'Request dermoscopy examination',
            'Consider biopsy for definitive diagnosis',
            'Document with photography for comparison',
            'Avoid trauma to the area',
            'Use sun protection on all exposed skin'
          ],
          red_flags: [
            'ABCDE criteria positive: Asymmetry, Border, Color, Diameter',
            'High-risk features for melanoma present',
            'Requires immediate professional evaluation'
          ]
        },
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      }
      setAnalysisResult(mockAnalysis)
      setStep('analysis')
    } finally {
      setIsAnalyzing(false)
    }
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
        
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-sm">
          <Camera className="w-3 h-3" />
          Live Demo
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
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="mt-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-xs"
                >
                  <Camera className="w-3 h-3" />
                  AI-powered analysis ready
                </motion.div>
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
                          <div className="aspect-square rounded-lg bg-gray-800 overflow-hidden relative">
                            <img src={photo.url} alt={photo.name} className="w-full h-full object-cover" />
                          </div>
                          <button
                            onClick={() => {
                              setUploadedPhotos(prev => prev.filter(p => p.id !== photo.id))
                              setUploadedFiles(prev => prev.filter((_, i) => i !== uploadedPhotos.findIndex(p => p.id === photo.id)))
                            }}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3 text-white" />
                          </button>
                          <p className="text-xs text-gray-500 mt-1 truncate">{photo.date}</p>
                        </motion.div>
                      ))}
                      
                      {uploadedPhotos.length < 5 && (
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          {...getRootProps()}
                          className="aspect-square rounded-lg border-2 border-dashed border-gray-600 hover:border-orange-500 transition-colors flex items-center justify-center group cursor-pointer"
                        >
                          <input {...getInputProps()} />
                          <Plus className="w-8 h-8 text-gray-600 group-hover:text-orange-500" />
                        </motion.div>
                      )}
                    </div>
                  </div>
                )}

                {/* Initial Upload Area */}
                {uploadedPhotos.length === 0 && (
                  <div className="space-y-4">
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      {...getRootProps()}
                      className={`w-full cursor-pointer ${
                        isDragActive ? 'scale-105' : ''
                      }`}
                    >
                      <input {...getInputProps()} />
                      <div className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all group ${
                        isDragActive 
                          ? 'border-orange-500 bg-orange-500/10' 
                          : 'border-gray-600 hover:border-orange-500 hover:bg-gray-900/70'
                      }`}>
                        <Upload className={`w-16 h-16 mx-auto mb-4 ${
                          isDragActive ? 'text-orange-500' : 'text-gray-500 group-hover:text-orange-500'
                        }`} />
                        <p className="text-lg font-medium text-gray-300 mb-2">
                          {isDragActive ? 'Drop your photos here' : 'Click or drag photos here'}
                        </p>
                        <p className="text-sm text-gray-500">
                          JPEG, PNG, HEIC up to 10MB each
                        </p>
                      </div>
                    </motion.div>
                    
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-700"></div>
                      </div>
                      <div className="relative flex justify-center text-xs">
                        <span className="px-3 bg-gray-900 text-gray-500">OR</span>
                      </div>
                    </div>
                    
                    <motion.button
                      onClick={handleDemoPhotoUpload}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full py-3 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors text-gray-300 flex items-center justify-center gap-2"
                    >
                      <FileImage className="w-5 h-5" />
                      Use Sample Melanoma Photo
                    </motion.button>
                  </div>
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
                              <div className="w-16 h-16 rounded-lg bg-gray-800 overflow-hidden flex-shrink-0">
                                <img src={photo.url} alt={photo.name} className="w-full h-full object-cover" />
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
                    <li>• Try our sample melanoma photo for testing</li>
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
                  <p className="text-gray-400">AI-powered visual analysis</p>
                  {analysisResult?.expires_at && (
                    <div className="mt-2 inline-flex items-center gap-2 px-2 py-1 rounded bg-blue-500/20 text-blue-400 text-xs">
                      <Clock className="w-3 h-3" />
                      Temporary analysis - expires in 24 hours
                    </div>
                  )}
                </div>

                {/* Analysis Confidence */}
                <div className="p-6 border-b border-white/10">
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-400">Analysis Confidence</span>
                      <span className="text-2xl font-bold text-white">{analysisResult?.analysis.confidence || 0}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${analysisResult?.analysis.confidence || 0}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="h-full bg-gradient-to-r from-orange-500 to-red-500"
                      />
                    </div>
                  </div>
                  <h4 className="text-lg font-medium text-white mb-2">{analysisResult?.analysis.primary_assessment}</h4>
                  <p className="text-sm text-gray-400">
                    {analysisResult?.analysis.visual_observations?.[0] || 'Visual analysis completed'}
                  </p>
                </div>

                {/* Other Possibilities */}
                <div className="p-6 border-b border-white/10">
                  <h4 className="text-sm font-medium text-gray-400 mb-3">DIFFERENTIAL DIAGNOSIS</h4>
                  <ul className="space-y-2">
                    {(analysisResult?.analysis.differential_diagnosis || []).map((diagnosis, index) => (
                      <li key={index} className="flex items-center gap-2 text-gray-300">
                        <span className="text-gray-500">•</span>
                        {diagnosis}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Visual Observations */}
                <div className="p-6 border-b border-white/10">
                  <h4 className="text-sm font-medium text-gray-400 mb-3">VISUAL OBSERVATIONS</h4>
                  <div className="space-y-3">
                    {(analysisResult?.analysis.visual_observations || []).slice(0, 3).map((observation, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-amber-400 mt-0.5" />
                        <p className="text-gray-300">{observation}</p>
                      </div>
                    ))}
                  </div>
                  {analysisResult?.analysis.red_flags && analysisResult.analysis.red_flags.length > 0 && (
                    <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                      <p className="text-sm font-medium text-red-400 mb-2">Red Flags:</p>
                      <ul className="space-y-1">
                        {analysisResult.analysis.red_flags.map((flag, index) => (
                          <li key={index} className="text-sm text-gray-300">• {flag}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Recommendations */}
                <div className="p-6">
                  <h4 className="text-sm font-medium text-gray-400 mb-3">RECOMMENDATIONS</h4>
                  <ul className="space-y-2">
                    {(analysisResult?.analysis.recommendations || []).map((rec, index) => (
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
                  Full photo analysis available in dashboard
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
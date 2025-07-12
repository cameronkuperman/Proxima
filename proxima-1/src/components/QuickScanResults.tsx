'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, Brain, FileText, TrendingUp, ChevronDown, ChevronRight, Sparkles, Eye, Download, X } from 'lucide-react'
import OracleEmbedded from '@/components/OracleEmbedded'
import { useRouter } from 'next/navigation'

interface QuickScanResultsProps {
  scanData: {
    bodyPart: string
    formData: any
    analysis?: any
    confidence?: number
    scan_id?: string
  }
  onNewScan: () => void
}

export default function QuickScanResults({ scanData, onNewScan }: QuickScanResultsProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState(0)
  const [showWhy, setShowWhy] = useState(false)
  const [showOraclePanel, setShowOraclePanel] = useState(false)

  // Extract analysis data with fallbacks
  const analysis = scanData.analysis || {}
  const confidence = scanData.confidence || 0
  
  const analysisResult = {
    confidence,
    primaryCondition: analysis.primaryCondition || 'Unknown Condition',
    likelihood: analysis.likelihood || 'Unable to determine likelihood',
    symptoms: analysis.symptoms || [],
    recommendations: analysis.recommendations || [],
    urgency: analysis.urgency || 'medium',
    differentials: analysis.differentials || [],
    redFlags: analysis.redFlags || [],
    selfCare: analysis.selfCare || [],
    timeline: analysis.timeline || 'Timeline not available',
    followUp: analysis.followUp || 'Follow up as needed',
    relatedSymptoms: analysis.relatedSymptoms || []
  }

  const handleGenerateReport = () => {
    console.log('Generating physician report...')
    // TODO: Implement report generation
  }

  const handleTrackProgress = () => {
    console.log('Starting symptom tracking...')
    // TODO: Implement symptom tracking
  }

  const handleAskOracle = () => {
    setShowOraclePanel(true)
  }

  return (
    <>
      <div className="space-y-6">
        {/* Main Analysis Card with Tabbed Interface */}
        <div className="bg-gray-900/50 rounded-3xl border border-white/10 overflow-hidden">
          {/* Header with dynamic confidence coloring */}
          <div className={`p-8 border-b border-white/10 bg-gradient-to-r ${
            confidence > 85 ? 'from-green-500/20 to-emerald-500/20' :
            confidence > 70 ? 'from-blue-500/20 to-cyan-500/20' :
            'from-amber-500/20 to-orange-500/20'
          }`}>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-3xl font-bold text-white mb-2">Your Health Analysis</h3>
                <p className="text-gray-300">Analysis for {scanData.bodyPart.toLowerCase()} symptoms</p>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold text-white mb-1">{confidence}%</div>
                <div className="text-sm text-gray-400">Confidence</div>
                {confidence < 70 && (
                  <div className="mt-2 text-xs text-amber-400">Consider Oracle consultation</div>
                )}
              </div>
            </div>
          </div>

          {/* Three-stage tabs */}
          <div className="flex border-b border-gray-800">
            {['Diagnosis', 'Care Plan', 'Watch For'].map((tab, index) => (
              <button
                key={tab}
                onClick={() => setActiveTab(index)}
                className={`flex-1 py-4 px-6 font-medium transition-all relative ${
                  activeTab === index 
                    ? 'text-white bg-gray-800/30' 
                    : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800/10'
                }`}
              >
                <span className="relative z-10">{tab}</span>
                {activeTab === index && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 border-b-2 border-blue-500"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <AnimatePresence mode="wait">
            {activeTab === 0 && (
              <motion.div
                key="diagnosis"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-8"
              >
                {/* Primary diagnosis */}
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-400 mb-3">Most Likely Condition</h4>
                  <h3 className="text-3xl font-bold text-white mb-3">{analysisResult.primaryCondition}</h3>
                  <p className="text-gray-300 mb-3">{analysisResult.likelihood}</p>
                  
                  {/* Why this diagnosis - collapsible */}
                  <button
                    onClick={() => setShowWhy(!showWhy)}
                    className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-2 transition-colors"
                  >
                    Why this diagnosis? 
                    <ChevronDown className={`w-4 h-4 transition-transform ${showWhy ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {showWhy && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-3 p-4 bg-gray-800/50 rounded-xl text-sm text-gray-300">
                          Based on your symptoms of {scanData.formData.symptoms} in the {scanData.bodyPart} area, 
                          along with the {scanData.formData.painType?.join(', ') || 'described'} pain pattern and {scanData.formData.duration || 'reported'} duration, 
                          this diagnosis best matches your presentation.
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Differential diagnoses */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-400 mb-3">Other Possibilities</h4>
                  <div className="space-y-3">
                    {analysisResult.differentials.map((diff, index) => (
                      <div key={index} className="bg-gray-800/30 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-white">{diff.condition}</span>
                          <span className="text-sm text-gray-400">{diff.probability}% likely</span>
                        </div>
                        <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${diff.probability}%` }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="h-full bg-gradient-to-r from-purple-500 to-purple-600"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 1 && (
              <motion.div
                key="care"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-8"
              >
                {/* Immediate actions */}
                <div className="mb-8">
                  <h4 className="text-lg font-semibold text-gray-400 mb-4">Immediate Actions</h4>
                  <div className="space-y-3">
                    {analysisResult.recommendations.slice(0, 3).map((rec, index) => (
                      <div key={index} className="flex items-start gap-4 p-4 bg-gray-800/30 rounded-lg">
                        <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-green-400 font-bold">{index + 1}</span>
                        </div>
                        <p className="text-gray-300">{rec}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Self-care */}
                <div className="mb-8">
                  <h4 className="text-lg font-semibold text-gray-400 mb-4">Self-Care Guidelines</h4>
                  <div className="grid gap-3">
                    {analysisResult.selfCare.map((care, index) => (
                      <div key={index} className="flex items-center gap-3 text-gray-300">
                        <Sparkles className="w-4 h-4 text-cyan-400" />
                        <span>{care}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Timeline */}
                <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/30">
                  <h4 className="text-sm font-medium text-blue-400 mb-2">Expected Timeline</h4>
                  <p className="text-gray-300">{analysisResult.timeline}</p>
                </div>
              </motion.div>
            )}

            {activeTab === 2 && (
              <motion.div
                key="watch"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-8"
              >
                {/* Red flags */}
                <div className="mb-8">
                  <h4 className="text-lg font-semibold text-red-400 mb-4">Seek Immediate Care If:</h4>
                  <div className="bg-red-500/10 rounded-lg p-4 border border-red-500/30">
                    <div className="space-y-2">
                      {analysisResult.redFlags.map((flag, index) => (
                        <div key={index} className="flex items-start gap-3">
                          <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
                          <span className="text-gray-300">{flag}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Monitor symptoms */}
                <div className="mb-8">
                  <h4 className="text-lg font-semibold text-gray-400 mb-4">Monitor These Changes</h4>
                  <div className="space-y-3">
                    {analysisResult.relatedSymptoms.map((symptom, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-gray-800/30 rounded-lg">
                        <Eye className="w-5 h-5 text-amber-400 mt-0.5" />
                        <span className="text-gray-300">{symptom}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Follow-up */}
                <div className="p-4 bg-amber-500/10 rounded-lg border border-amber-500/30">
                  <h4 className="text-sm font-medium text-amber-400 mb-2">When to Follow Up</h4>
                  <p className="text-gray-300">{analysisResult.followUp}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Action Buttons with subtle Oracle integration */}
        <div className="bg-gray-900/50 rounded-2xl border border-white/10 p-6">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-lg font-semibold text-white">Next Steps</h4>
            {confidence < 70 && (
              <div className="flex items-center gap-2 text-sm text-amber-400">
                <AlertCircle className="w-4 h-4" />
                <span>Low confidence - consider deeper analysis</span>
              </div>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <button 
              onClick={handleGenerateReport}
              className="px-6 py-4 rounded-xl bg-gray-800 hover:bg-gray-700 transition-all flex items-center justify-center gap-3 group"
            >
              <FileText className="w-5 h-5 text-gray-400 group-hover:text-gray-300" />
              <div className="text-left">
                <div className="font-medium text-white">Generate Detailed Report</div>
                <div className="text-xs text-gray-400">For your doctor visit</div>
              </div>
            </button>
            
            <button 
              onClick={handleTrackProgress}
              className="px-6 py-4 rounded-xl bg-gray-800 hover:bg-gray-700 transition-all flex items-center justify-center gap-3 group"
            >
              <TrendingUp className="w-5 h-5 text-gray-400 group-hover:text-gray-300" />
              <div className="text-left">
                <div className="font-medium text-white">Track Over Time</div>
                <div className="text-xs text-gray-400">Monitor symptom changes</div>
              </div>
            </button>
          </div>

          {/* Subtle Oracle prompt based on confidence or complexity */}
          <div className={`p-4 rounded-xl transition-all ${
            confidence < 70 
              ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30' 
              : 'bg-gray-800/50 border border-gray-700'
          }`}>
            <button
              onClick={handleAskOracle}
              className="w-full flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <Brain className={`w-5 h-5 ${
                  confidence < 70 ? 'text-purple-400' : 'text-gray-400'
                }`} />
                <div className="text-left">
                  <div className="font-medium text-white">
                    {confidence < 70 
                      ? 'Get a deeper analysis with Oracle AI' 
                      : 'Have questions? Ask Oracle AI'}
                  </div>
                  <div className="text-xs text-gray-400">
                    Advanced reasoning for complex symptoms
                  </div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-300 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>

        {/* New Scan Button */}
        <div className="text-center">
          <button
            onClick={onNewScan}
            className="px-6 py-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-medium transition-all"
          >
            Start New Scan
          </button>
        </div>
      </div>

      {/* Oracle Panel Overlay */}
      <AnimatePresence>
        {showOraclePanel && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden relative"
            >
              <button
                onClick={() => setShowOraclePanel(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-300 z-10"
              >
                <X className="w-6 h-6" />
              </button>
              
              <OracleEmbedded 
                quickScanContext={{
                  confidence,
                  analysis: analysisResult,
                  bodyPart: scanData.bodyPart,
                  symptoms: scanData.formData.symptoms
                }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
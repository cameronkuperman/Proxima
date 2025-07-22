'use client'

import React, { useState } from 'react'
import { X, AlertCircle, Sparkles, Send, ChevronDown } from 'lucide-react'
import { Dialog, DialogContent } from '@/components/ui/dialog'

interface OracleAIModalProps {
  isOpen: boolean
  onClose: () => void
  analysisData: any
  bodyPart: string
}

export default function OracleAIModal({ isOpen, onClose, analysisData, bodyPart }: OracleAIModalProps) {
  const [activeTab, setActiveTab] = useState<'diagnosis' | 'carePlan' | 'watchFor'>('diagnosis')
  const [oracleQuestion, setOracleQuestion] = useState('')
  const [showWhyDiagnosis, setShowWhyDiagnosis] = useState(false)

  const confidence = analysisData?.confidence || 65
  const diagnosis = analysisData?.diagnosis || 'Muscle Strain (pulled muscle)'
  const otherPossibilities = analysisData?.other_possibilities || [
    { name: 'Costochondritis (inflammation of rib cartilage)', likelihood: 30 },
    { name: 'Muscle Strain (pulled muscle)', likelihood: 60 },
    { name: 'Muscle Spasm', likelihood: 20 }
  ]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh] bg-gray-900 border-gray-800 text-white p-0 overflow-hidden">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-gray-800">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-semibold mb-1">Your Health Analysis</h2>
                <p className="text-gray-400">Analysis for {bodyPart} symptoms</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-3xl font-bold text-orange-400">{confidence}%</div>
                  <div className="text-xs text-gray-400">Initial Confidence</div>
                </div>
                <button onClick={onClose} className="text-gray-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-800">
            <button
              onClick={() => setActiveTab('diagnosis')}
              className={`px-6 py-3 font-medium transition-colors relative ${
                activeTab === 'diagnosis' ? 'text-purple-400' : 'text-gray-400 hover:text-white'
              }`}
            >
              Diagnosis
              {activeTab === 'diagnosis' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-400" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('carePlan')}
              className={`px-6 py-3 font-medium transition-colors relative ${
                activeTab === 'carePlan' ? 'text-purple-400' : 'text-gray-400 hover:text-white'
              }`}
            >
              Care Plan
              {activeTab === 'carePlan' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-400" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('watchFor')}
              className={`px-6 py-3 font-medium transition-colors relative ${
                activeTab === 'watchFor' ? 'text-purple-400' : 'text-gray-400 hover:text-white'
              }`}
            >
              Watch For
              {activeTab === 'watchFor' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-400" />
              )}
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'diagnosis' && (
              <div className="space-y-6">
                {/* Most Likely Condition */}
                <div>
                  <p className="text-sm text-gray-400 mb-2">Most Likely Condition</p>
                  <div className="bg-gray-800 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-medium">{diagnosis}</h3>
                        <span className="inline-block mt-1 px-2 py-0.5 bg-gray-700 text-xs rounded">
                          Possible
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowWhyDiagnosis(!showWhyDiagnosis)}
                      className="mt-3 text-orange-400 text-sm flex items-center gap-1 hover:text-orange-300"
                    >
                      Why this diagnosis?
                      <ChevronDown className={`w-4 h-4 transition-transform ${showWhyDiagnosis ? 'rotate-180' : ''}`} />
                    </button>
                    {showWhyDiagnosis && (
                      <div className="mt-3 text-sm text-gray-300 pt-3 border-t border-gray-700">
                        {analysisData?.reasoning || 'Based on the symptoms you described and the location of pain, muscle strain is the most likely cause.'}
                      </div>
                    )}
                  </div>
                </div>

                {/* Other Possibilities */}
                <div>
                  <p className="text-sm text-gray-400 mb-2">Other Possibilities</p>
                  <div className="space-y-3">
                    {otherPossibilities.map((possibility: any, index: number) => (
                      <div key={index} className="bg-gray-800 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm">{possibility.name}</span>
                          <span className="text-xs text-gray-400">{possibility.likelihood}% likely</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              index === 1 ? 'bg-purple-500' : 'bg-gray-600'
                            }`}
                            style={{ width: `${possibility.likelihood}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Next Steps */}
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="flex items-start gap-3 mb-4">
                    <AlertCircle className="w-5 h-5 text-orange-400 mt-0.5" />
                    <p className="text-sm text-gray-300">
                      Low confidence - consider deeper analysis
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button className="px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg font-medium hover:from-blue-600 hover:to-blue-700 transition-all">
                      🤿 Dive Deeper
                    </button>
                    <button className="px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 transition-all">
                      🧠 Think Harder
                    </button>
                  </div>
                  <div className="mt-3 space-y-2">
                    <button className="w-full text-left px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors">
                      📋 Generate Detailed Report
                    </button>
                    <button className="w-full text-left px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors">
                      📈 Track Over Time
                    </button>
                    <button className="w-full text-left px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors">
                      🤖 Get a deeper analysis with Oracle AI
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'carePlan' && (
              <div className="text-gray-400">
                <p>Care plan information will be displayed here.</p>
              </div>
            )}

            {activeTab === 'watchFor' && (
              <div className="text-gray-400">
                <p>Warning signs and symptoms to watch for will be displayed here.</p>
              </div>
            )}
          </div>

          {/* Oracle AI Section */}
          <div className="border-t border-gray-800 p-6 bg-gray-950">
            <div className="max-w-3xl mx-auto">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="font-medium">Oracle AI Ready</h3>
                  <p className="text-sm text-gray-400">Ask follow-up questions about your Quick Scan results</p>
                </div>
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={oracleQuestion}
                  onChange={(e) => setOracleQuestion(e.target.value)}
                  placeholder="Ask about your diagnosis, symptoms, or treatment options..."
                  className="w-full px-4 py-3 pr-12 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                />
                <button className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-purple-400 transition-colors">
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Button */}
          <div className="p-4 border-t border-gray-800">
            <button className="w-full py-3 bg-gray-800 hover:bg-gray-700 rounded-lg font-medium transition-colors">
              Start New Scan
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
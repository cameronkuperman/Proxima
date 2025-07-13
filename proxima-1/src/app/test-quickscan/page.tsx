'use client'

import { useState } from 'react'
import { quickScanClient } from '@/lib/quickscan-client'

export default function TestQuickScan() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const testScenarios = [
    {
      name: 'Headache',
      bodyPart: 'Head',
      formData: {
        symptoms: 'Severe headache with nausea and light sensitivity',
        painType: ['throbbing', 'sharp'],
        painLevel: '8',
        duration: 'hours',
        dailyImpact: ['work', 'sleep'],
        frequency: 'sometimes',
        whatTried: 'ibuprofen and rest in dark room',
        didItHelp: 'helped a little but pain returned',
        associatedSymptoms: 'nausea, light sensitivity, sound sensitivity',
        triggerEvent: 'Started after staring at computer screen for hours'
      }
    },
    {
      name: 'Back Pain',
      bodyPart: 'Abdomen/Lower Back',
      formData: {
        symptoms: 'Lower back pain when bending or lifting',
        painType: ['sharp', 'stabbing'],
        painLevel: '6',
        duration: 'days',
        dailyImpact: ['work', 'exercise'],
        frequency: 'first',
        whatTried: 'heat pad',
        didItHelp: 'temporary relief',
        worseWhen: 'bending forward, lifting',
        betterWhen: 'lying flat',
        triggerEvent: 'Lifted heavy box while moving furniture'
      }
    },
    {
      name: 'Chest Pain',
      bodyPart: 'Chest/Arms',
      formData: {
        symptoms: 'Sharp chest pain when breathing deeply',
        painType: ['sharp'],
        painLevel: '7',
        duration: 'today',
        dailyImpact: ['work', 'sleep', 'exercise'],
        frequency: 'first',
        associatedSymptoms: 'shortness of breath',
        triggerEvent: ''
      }
    }
  ]

  const runTest = async (scenario: typeof testScenarios[0]) => {
    setLoading(true)
    setError(null)
    try {
      const response = await quickScanClient.performQuickScan(
        scenario.bodyPart,
        scenario.formData,
        undefined
      )
      setResult(response)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Test failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <h1 className="text-3xl font-bold text-white mb-8">Quick Scan API Test</h1>
      
      <div className="grid gap-4 mb-8">
        {testScenarios.map((scenario) => (
          <button
            key={scenario.name}
            onClick={() => runTest(scenario)}
            disabled={loading}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg"
          >
            Test {scenario.name} Scenario
          </button>
        ))}
      </div>

      {loading && (
        <div className="text-white">Loading...</div>
      )}

      {error && (
        <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 mb-4">
          <h3 className="text-red-400 font-bold">Error:</h3>
          <p className="text-red-300">{error}</p>
        </div>
      )}

      {result && (
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-2xl font-bold text-white mb-4">Results:</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-blue-400">Scan Info:</h3>
              <p className="text-gray-300">Scan ID: {result.scan_id}</p>
              <p className="text-gray-300">Body Part: {result.body_part}</p>
              <p className="text-gray-300">Confidence: {result.confidence}%</p>
              <p className="text-gray-300">Model: {result.model}</p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-blue-400">Analysis:</h3>
              <div className="bg-gray-900 rounded p-4">
                <p className="text-white font-bold">Primary Condition: {result.analysis.primaryCondition}</p>
                <p className="text-gray-300">Likelihood: {result.analysis.likelihood}</p>
                <p className="text-gray-300">Urgency: {result.analysis.urgency}</p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-blue-400">Symptoms Identified:</h3>
              <ul className="list-disc list-inside text-gray-300">
                {result.analysis.symptoms.map((symptom: string, i: number) => (
                  <li key={i}>{symptom}</li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-blue-400">Recommendations:</h3>
              <ul className="list-disc list-inside text-gray-300">
                {result.analysis.recommendations.map((rec: string, i: number) => (
                  <li key={i}>{rec}</li>
                ))}
              </ul>
            </div>

            <details className="mt-4">
              <summary className="cursor-pointer text-gray-400 hover:text-gray-300">
                View Full Response JSON
              </summary>
              <pre className="mt-2 p-4 bg-gray-950 rounded overflow-x-auto text-xs text-gray-300">
                {JSON.stringify(result, null, 2)}
              </pre>
            </details>
          </div>
        </div>
      )}
    </div>
  )
}
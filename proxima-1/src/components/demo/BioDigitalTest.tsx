'use client'

import React, { useEffect, useState } from 'react'

export function BioDigitalTest() {
  const [logs, setLogs] = useState<string[]>([])
  
  const addLog = (msg: string) => {
    console.log(msg)
    setLogs(prev => [...prev, `[${new Date().toISOString().substr(11, 8)}] ${msg}`])
  }
  
  useEffect(() => {
    // Test 1: Widget endpoint with be parameter
    addLog('Test 1: Widget with be=6JKq')
  }, [])
  
  return (
    <div className="p-8 bg-black text-white min-h-screen">
      <h1 className="text-2xl font-bold mb-4">BioDigital Integration Test</h1>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Test 1: Widget with be parameter */}
        <div className="border border-gray-700 p-4">
          <h2 className="text-lg font-semibold mb-2">Test 1: Widget with be=6JKq</h2>
          <iframe
            src="https://human.biodigital.com/widget/?be=6JKq&dk=3cbb6a7f38981892550f66544f254f8e9dd158ee"
            className="w-full h-96 bg-gray-900"
            onLoad={() => addLog('Widget iframe loaded')}
            onError={() => addLog('Widget iframe error')}
          />
        </div>
        
        {/* Test 2: Viewer with id parameter */}
        <div className="border border-gray-700 p-4">
          <h2 className="text-lg font-semibold mb-2">Test 2: Viewer with id=6JKq</h2>
          <iframe
            src="https://human.biodigital.com/viewer/?id=6JKq&dk=3cbb6a7f38981892550f66544f254f8e9dd158ee"
            className="w-full h-96 bg-gray-900"
            onLoad={() => addLog('Viewer iframe loaded')}
            onError={() => addLog('Viewer iframe error')}
          />
        </div>
      </div>
      
      {/* Test 3: Simple overlay click detection */}
      <div className="border border-gray-700 p-4 mb-4">
        <h2 className="text-lg font-semibold mb-2">Test 3: Click Detection</h2>
        <div className="relative">
          <iframe
            src="https://human.biodigital.com/viewer/?id=6JKq&dk=3cbb6a7f38981892550f66544f254f8e9dd158ee"
            className="w-full h-96 bg-gray-900"
          />
          <div
            className="absolute inset-0 cursor-pointer"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect()
              const x = e.clientX - rect.left
              const y = e.clientY - rect.top
              addLog(`Click detected at: ${x.toFixed(0)}, ${y.toFixed(0)}`)
              alert('Click detected! Check logs.')
            }}
          />
        </div>
      </div>
      
      {/* Logs */}
      <div className="border border-gray-700 p-4">
        <h2 className="text-lg font-semibold mb-2">Logs:</h2>
        <div className="font-mono text-xs space-y-1 max-h-40 overflow-y-auto">
          {logs.map((log, i) => (
            <div key={i} className="text-gray-400">{log}</div>
          ))}
        </div>
      </div>
    </div>
  )
}
'use client'

import React, { useEffect, useState } from 'react'

interface BioDigitalHostedProps {
  gender?: 'male' | 'female';
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function BioDigitalHosted({ gender = 'male' }: BioDigitalHostedProps) {
  const [selectedPart, setSelectedPart] = useState<any>(null)
  const [logs, setLogs] = useState<string[]>([])
  const [currentGender, setCurrentGender] = useState<'male' | 'female'>(gender)
  
  const addLog = (msg: string) => {
    console.log(msg)
    setLogs(prev => [...prev, `[${new Date().toISOString().substr(11, 8)}] ${msg}`])
  }
  
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Security: Only accept messages from our own domain (biodigital-host.html)
      if (event.origin !== window.location.origin) return;
      
      if (event.data.type === 'BIODIGITAL_PICK') {
        addLog(`Received pick event: ${event.data.data.objectName}`)
        setSelectedPart(event.data.data)
      }
    }
    
    window.addEventListener('message', handleMessage)
    addLog('Message listener registered')
    
    return () => {
      window.removeEventListener('message', handleMessage)
    }
  }, [])
  
  return (
    <div className="h-screen flex flex-col bg-black text-white">
      <div className="p-4 border-b border-gray-800">
        <h1 className="text-2xl font-bold">BioDigital Hosted Integration</h1>
        <p className="text-gray-400">Select gender and interact with the 3D model</p>
        <div className="mt-4 flex gap-4">
          <button
            onClick={() => setCurrentGender('male')}
            className={`px-4 py-2 rounded ${currentGender === 'male' ? 'bg-blue-600' : 'bg-gray-700'}`}
          >
            Male Model
          </button>
          <button
            onClick={() => setCurrentGender('female')}
            className={`px-4 py-2 rounded ${currentGender === 'female' ? 'bg-pink-600' : 'bg-gray-700'}`}
          >
            Female Model
          </button>
        </div>
      </div>
      
      {selectedPart && (
        <div className="p-4 bg-green-900/30 border-b border-green-700">
          <h2 className="text-green-400 font-bold mb-2">Selected Body Part:</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Name:</span> {selectedPart.objectName || 'Unknown'}
            </div>
            <div>
              <span className="text-gray-400">ID:</span> {selectedPart.objectId || 'N/A'}
            </div>
            <div>
              <span className="text-gray-400">World Position:</span> {JSON.stringify(selectedPart.worldPos)}
            </div>
            <div>
              <span className="text-gray-400">Screen Position:</span> {JSON.stringify(selectedPart.screenPos)}
            </div>
            <div>
              <span className="text-gray-400">Gender:</span> {selectedPart.gender || currentGender}
            </div>
          </div>
        </div>
      )}
      
      <div className="flex-1 relative">
        <iframe
          key={currentGender}
          src={`/biodigital-${currentGender}.html`}
          className="w-full h-full"
          style={{ border: 'none' }}
        />
      </div>
      
      <div className="p-4 border-t border-gray-800 max-h-48 overflow-y-auto">
        <h3 className="font-bold mb-2">Debug Logs:</h3>
        <div className="text-xs font-mono space-y-1">
          {logs.map((log, i) => (
            <div key={i} className="text-gray-400">{log}</div>
          ))}
        </div>
      </div>
    </div>
  )
}
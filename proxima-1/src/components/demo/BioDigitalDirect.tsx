'use client'

import React, { useEffect, useRef, useState } from 'react'
import Script from 'next/script'

export function BioDigitalDirect() {
  const [isLoaded, setIsLoaded] = useState(false)
  const [selectedPart, setSelectedPart] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    if (isLoaded && window.HumanAPI && containerRef.current) {
      // Create iframe programmatically
      const iframe = document.createElement('iframe')
      iframe.id = 'biodigital-human'
      iframe.src = 'https://human.biodigital.com/widget/?m=production/maleAdult/male_region_skeleton_2&dk=4a7eb63719c66a365c746afeae476870503ba4be'
      iframe.style.width = '100%'
      iframe.style.height = '600px'
      iframe.style.border = 'none'
      
      containerRef.current.innerHTML = ''
      containerRef.current.appendChild(iframe)
      
      // Wait for iframe to load
      iframe.onload = () => {
        console.log('Iframe loaded, initializing HumanAPI...')
        
        setTimeout(() => {
          try {
            // Initialize the Human API
            const human = new window.HumanAPI.Human('biodigital-human')
            
            // Wait for ready event
            human.on('ready', () => {
              console.log('BioDigital Human is ready!')
              
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              // Enable pick mode
              human.pick.on('picked', (event: any) => {
                console.log('PICKED EVENT:', event)
                
                const partName = event.object?.displayName || 
                               event.object?.name || 
                               event.objectId || 
                               'Unknown Part'
                
                setSelectedPart(partName)
                
                // You can also get more info
                console.log('Object:', event.object)
                console.log('Position:', event.worldPos)
                console.log('Screen Position:', event.screenPos)
              })
              
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              // Try other events
              human.on('scene.picked', (event: any) => {
                console.log('SCENE PICKED:', event)
              })
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              
              human.on('object.selected', (event: any) => {
                console.log('OBJECT SELECTED:', event)
              })
              
              // Log available methods
              console.log('Human methods:', Object.keys(human))
              console.log('Pick methods:', Object.keys(human.pick))
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            })
            
            human.on('error', (error: any) => {
              console.error('BioDigital error:', error)
            })
            
          } catch (error) {
            console.error('Failed to initialize Human API:', error)
          }
        }, 2000)
      }
    }
  }, [isLoaded])
  
  return (
    <div className="p-8">
      <Script 
        src="https://developer.biodigital.com/builds/api/2/human-api.min.js"
        onLoad={() => {
          console.log('BioDigital SDK loaded')
          setIsLoaded(true)
        }}
        onError={(e) => {
          console.error('Failed to load SDK:', e)
        }}
      />
      
      <h1 className="text-2xl font-bold mb-4">BioDigital Direct Integration</h1>
      
      {selectedPart && (
        <div className="mb-4 p-4 bg-green-500/20 rounded">
          <p className="text-green-400">Selected: <strong>{selectedPart}</strong></p>
        </div>
      )}
      
      <div ref={containerRef} className="border border-gray-700 rounded">
        <p className="p-8 text-center text-gray-500">Loading BioDigital Human...</p>
      </div>
      
      <div className="mt-4 p-4 bg-gray-800 rounded">
        <h3 className="font-bold mb-2">Console Output:</h3>
        <p className="text-sm text-gray-400">Open browser console to see all events</p>
      </div>
    </div>
  )
}

// Add global type declaration
declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    HumanAPI: any
  }
}
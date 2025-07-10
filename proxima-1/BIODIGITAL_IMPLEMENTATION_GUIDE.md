# BioDigital Human 3D Body Selection - Complete Implementation Guide

## 🎯 Overview

This guide provides a complete implementation for integrating BioDigital Human 3D body selection into your Next.js web application. When users click on body parts in the 3D model, it triggers a targeted symptom form.

## 🔧 Implementation Details

### Model Information
- **Model ID**: `6F0C`
- **API Key**: `4a7eb63719c66a365c746afeae476870503ba4be`
- **Payment ID**: `o_24754ad1`

### Key Features
- ✅ Real-time body part selection detection
- ✅ Form triggering on body part clicks
- ✅ Proper BioDigital Human SDK integration
- ✅ Error handling and debugging
- ✅ Responsive design with proper aspect ratio

## 🚀 Complete Implementation

### 1. React Component Structure

```tsx
'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export function QuickScanDemo({ onComplete }: { onComplete: () => void }) {
  // State management
  const [step, setStep] = useState<'intro' | 'interact' | 'form' | 'analyzing' | 'result'>('intro')
  const [selectedBodyPart, setSelectedBodyPart] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [isModelReady, setIsModelReady] = useState(false)
  const [clickPosition, setClickPosition] = useState({ x: 50, y: 50 })
  
  // BioDigital Human API references
  const humanRef = useRef<any>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [humanApiLoaded, setHumanApiLoaded] = useState(false)
  
  // Form data state
  const [formData, setFormData] = useState({
    symptoms: '',
    painType: [],
    painLevel: '5',
    duration: '',
    // ... other form fields
  })

  // BioDigital configuration with exact model ID 6F0C
  const bioDigitalUrl = `https://human.biodigital.com/viewer/?id=6F0C&ui-anatomy-descriptions=true&ui-anatomy-pronunciations=true&ui-anatomy-labels=false&ui-audio=true&ui-chapter-list=false&ui-fullscreen=false&ui-help=false&ui-info=false&ui-label-list=true&ui-layers=false&ui-skin-layers=false&ui-loader=circle&ui-media-controls=none&ui-menu=false&ui-nav=false&ui-search=false&ui-tools=false&ui-tutorial=false&ui-undo=false&ui-whiteboard=false&initial.none=true&disable-scroll=false&dk=4a7eb63719c66a365c746afeae476870503ba4be&paid=o_24754ad1`

  // ... rest of component implementation
}
```

### 2. BioDigital Human SDK Integration

```tsx
// Load BioDigital Human SDK
useEffect(() => {
  if (typeof window !== 'undefined' && !(window as any).HumanAPI) {
    const script = document.createElement('script')
    script.src = 'https://human-api.biodigital.com/build/1.2.1/human-api-1.2.1.min.js'
    script.onload = () => {
      console.log('✅ BioDigital Human SDK loaded')
      setHumanApiLoaded(true)
    }
    script.onerror = () => {
      console.error('❌ Failed to load BioDigital Human SDK')
    }
    document.head.appendChild(script)
  } else if ((window as any).HumanAPI) {
    setHumanApiLoaded(true)
  }
}, [])
```

### 3. Body Part Selection Logic

```tsx
// Initialize BioDigital Human API and set up pick events
useEffect(() => {
  if (humanApiLoaded && isModelReady && !humanRef.current) {
    // Add delay to ensure BioDigital is fully loaded
    setTimeout(() => {
      try {
        console.log('🚀 Initializing BioDigital Human API...')
        console.log('HumanAPI available:', !!(window as any).HumanAPI)
        
        // Check if iframe exists
        const iframe = document.getElementById('biodigital-iframe')
        console.log('Iframe found:', !!iframe)
        
        if (!(window as any).HumanAPI) {
          console.error('❌ HumanAPI not available')
          return
        }
        
        // Initialize Human API with iframe ID
        const human = new (window as any).HumanAPI.Human('biodigital-iframe')
        humanRef.current = human
        
        // Add ready event listener
        human.on('ready', () => {
          console.log('✅ BioDigital Human is ready!')
          
          // Set up pick event handler
          human.pick.on('picked', (pickData: any) => {
            console.log('🎯 Body part picked:', pickData)
            
            // Extract object information
            const objectName = pickData.object?.displayName || pickData.object?.name || 'Unknown body part'
            const position = pickData.worldPos || { x: 0, y: 0, z: 0 }
            
            console.log('📍 Selected:', objectName, 'at position:', position)
            
            // Set selected body part and show form
            setSelectedBodyPart(objectName)
            setShowForm(true)
            
            // Calculate click position
            setClickPosition({ x: 50, y: 50 })
          })
          
          console.log('✅ Pick events set up successfully')
        })
        
        // Add error event listener
        human.on('error', (error: any) => {
          console.error('❌ BioDigital Human error:', error)
        })
        
        console.log('✅ BioDigital Human API initialized')
        
      } catch (error) {
        console.error('❌ Failed to initialize BioDigital Human API:', error)
      }
    }, 2000) // 2 second delay after model is ready
  }
}, [humanApiLoaded, isModelReady])
```

### 4. Iframe Configuration

```tsx
// Handle iframe load
const handleIframeLoad = () => {
  console.log('🔄 BioDigital iframe loaded')
  
  // Wait 3 seconds for BioDigital to fully load
  setTimeout(() => {
    console.log('⏰ BioDigital model should be ready')
    setIsModelReady(true)
  }, 3000)
}

// Iframe JSX
<iframe
  id="biodigital-iframe"
  ref={iframeRef}
  src={bioDigitalUrl}
  className="w-full h-full"
  style={{ border: 'none', aspectRatio: '4 / 3' }}
  frameBorder="0"
  allowFullScreen={true}
  loading="lazy"
  onLoad={handleIframeLoad}
/>
```

## 🔍 Debugging & Testing

### Console Logs to Look For

1. **SDK Loading**:
   ```
   ✅ BioDigital Human SDK loaded
   ```

2. **API Initialization**:
   ```
   🚀 Initializing BioDigital Human API...
   HumanAPI available: true
   Iframe found: true
   ✅ BioDigital Human API initialized
   ```

3. **Ready State**:
   ```
   ✅ BioDigital Human is ready!
   ✅ Pick events set up successfully
   ```

4. **Body Part Selection**:
   ```
   🎯 Body part picked: [pickData object]
   📍 Selected: [body part name] at position: [coordinates]
   ```

### Common Issues & Solutions

#### Issue 1: SDK Not Loading
**Problem**: `❌ Failed to load BioDigital Human SDK`
**Solution**: Check internet connection and CDN availability

#### Issue 2: API Not Available
**Problem**: `❌ HumanAPI not available`
**Solution**: Ensure SDK loaded before trying to initialize

#### Issue 3: Pick Events Not Working
**Problem**: Clicks not triggering form
**Solution**: 
- Check console for ready state
- Ensure iframe has correct ID
- Verify API key is valid

#### Issue 4: Model Not Loading
**Problem**: Model appears blank or broken
**Solution**: 
- Verify model ID `6F0C` is correct
- Check API key permissions
- Ensure payment ID is valid

## 📋 Configuration Parameters

### Model Parameters
- `id=6F0C` - Specific model identifier
- `dk=4a7eb63719c66a365c746afeae476870503ba4be` - Your API key
- `paid=o_24754ad1` - Payment identifier

### UI Parameters
- `ui-anatomy-descriptions=true` - Show anatomy descriptions
- `ui-anatomy-pronunciations=true` - Show pronunciations
- `ui-anatomy-labels=false` - Hide labels by default
- `ui-audio=true` - Enable audio
- `ui-label-list=true` - Show label list
- `initial.none=true` - No initial selection
- `disable-scroll=false` - Allow scrolling

## 🚀 Quick Start

1. **Copy the implementation** from this guide
2. **Replace your current QuickScanDemo component**
3. **Test in browser console** for debug messages
4. **Click on body parts** to trigger form
5. **Check form appears** with selected body part name

## 💡 Tips for Success

1. **Always check console logs** for debugging
2. **Wait for ready state** before setting up events
3. **Use proper iframe ID** (`biodigital-iframe`)
4. **Test with different body parts** to ensure consistency
5. **Monitor for API errors** and handle appropriately

## 🔧 Troubleshooting Checklist

- [ ] BioDigital Human SDK loaded successfully
- [ ] API key is valid and active
- [ ] Iframe has correct ID (`biodigital-iframe`)
- [ ] Model ID `6F0C` is correct
- [ ] Ready event fired successfully
- [ ] Pick events are set up
- [ ] Console shows no errors
- [ ] Form triggers on body part clicks

## 🎯 Expected Behavior

1. **Page loads** → SDK loads → iframe loads
2. **User clicks body part** → pick event fires → console logs selection
3. **Form appears** with selected body part name
4. **User fills form** → submits → continues to analysis

---

**This implementation should work perfectly with your specific BioDigital model and credentials!** 🚀
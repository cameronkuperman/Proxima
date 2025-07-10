# BioDigital Implementation Documentation

## Executive Summary

This document provides an extremely comprehensive technical analysis of the BioDigital 3D anatomy integration in the Proxima application. The implementation leverages BioDigital's 3D human anatomy viewer to enable users to select body parts and trigger targeted medical symptom forms, ultimately leading to AI-powered diagnostic analysis.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                   USER INTERACTION                                      │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│  Body3DScreen (Tab Controller)                                                         │
│  ├── QuickScan Mode                     ├── DeepDive Mode                             │
│  │   ├── WebView (BioDigital)           │   ├── WebView (BioDigital)                  │
│  │   ├── JavaScript Injection          │   ├── JavaScript Injection                  │
│  │   └── TargetedForm                   │   └── ImmersiveDiagnosticForm               │
│  │       └── SmartAnalysis              │       └── SmartAnalysis                     │
│  │           └── AIResults              │           └── EnhancedDiagnosticChat        │
│  │                                      │               └── AIResults                 │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                   STATE MANAGEMENT                                     │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│  FormStore (Zustand)                                                                   │
│  ├── Form Data Management                                                              │
│  ├── MCP Data Formatting                                                               │
│  └── State Synchronization                                                             │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                   CONFIGURATION                                        │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│  Config.ts                                                                             │
│  ├── BioDigital API Keys (SECURITY ISSUE - Hardcoded)                                 │
│  ├── BioDigital URLs (Quick Scan, Deep Dive, Home Preview)                           │
│  └── Environment Variable Fallbacks                                                   │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

## 1. Configuration and Initialization

### 1.1 BioDigital Configuration (`config.ts`)

**Location**: `/packages/app/lib/config.ts`

**Critical Security Issue**: API keys are hardcoded in the source code:
```typescript
biodigitalApiKey: process.env.EXPO_PUBLIC_BIODIGITAL_API_KEY || '210579dd394dbd5d55f9adb798db38be02ae9ef8',
biodigitalApiSecret: process.env.EXPO_PUBLIC_BIODIGITAL_API_SECRET || '71893570b1d59a01e582c2f822ef745811fc5868',
```

**BioDigital URLs**: Three different configurations for different use cases:
- **Quick Scan URL**: Simplified interface with limited UI components
- **Deep Dive URL**: Full interactive interface with all features enabled
- **Home Preview URL**: Rotating preview mode for home screen

**URL Parameters Analysis**:
- `id=6CBo`: BioDigital model identifier (consistent across all implementations)
- `ui-*` parameters: Control individual UI components visibility
- `initial.none=true`: Prevents automatic body part selection on load
- `disable-scroll=false`: Allows scrolling within the 3D viewer
- `load-rotate=10/20`: Auto-rotation degrees on load
- `uaid=M4iCG`: User access identifier
- `paid=o_159040f0`: Payment/account identifier

### 1.2 Model Loading Strategy

**Model ID**: `6CBo` - This is the BioDigital model identifier used consistently across all implementations. The significance of this specific model ID is not documented in the codebase.

**Loading Approach**:
1. WebView loads BioDigital URL with specific parameters
2. JavaScript injection waits 3 seconds for BioDigital to fully load
3. MutationObserver begins monitoring DOM changes
4. User interaction detection begins

## 2. Component Architecture

### 2.1 Body3DScreen (Main Controller)

**Location**: `/packages/app/features/body3d/screen.tsx`

**Responsibilities**:
- Tab switching between "Quick Scan" and "Deep Dive" modes
- Loading state management with timed transitions
- Bottom information bar with mode-specific instructions
- UI state coordination

**Component States**:
- `activeTab`: Controls which mode is active
- `showLoadingMessage`: Shows loading indicator for 3 seconds
- `showBottomBar`: Displays instructional text, hides after 6 seconds

**Tab Interface**:
```typescript
type TabMode = 'quick scan' | 'deep dive'
```

### 2.2 QuickScan Component

**Location**: `/packages/app/features/body3d/quickscan.tsx`

**Purpose**: Simplified interaction mode for quick symptom analysis

**Key Features**:
- Embedded BioDigital WebView with streamlined UI
- Body part selection detection
- Immediate form triggering on selection
- Support for draggable form positioning

**URL Configuration**: Uses a modified version of the config URL with some customizations:
```typescript
const quickModeUrl = `https://human.biodigital.com/viewer/?id=6CBo&ui-anatomy-descriptions=true&ui-anatomy-pronunciations=true&ui-anatomy-labels=true&ui-audio=false&ui-chapter-list=true&ui-fullscreen=false&ui-help=false&ui-info=true&ui-label-list=true&ui-layers=true&ui-skin-layers=true&ui-loader=circle&ui-media-controls=none&ui-menu=false&ui-nav=false&ui-search=true&ui-tools=true&ui-tutorial=false&ui-undo=true&ui-whiteboard=false&initial.none=true&disable-scroll=false&load-rotate=10&uaid=M4iCG&paid=o_159040f0`
```

### 2.3 DeepDive Component

**Location**: `/packages/app/features/body3d/deepdive.tsx`

**Purpose**: Advanced interaction mode with comprehensive diagnostic features

**Key Features**:
- Full-featured BioDigital interface
- Enhanced form capabilities
- Split-view support for simultaneous 3D viewing and analysis
- Progressive diagnostic workflow

**Workflow**:
1. User selects body part
2. ImmersiveDiagnosticForm appears
3. Form submission triggers SmartAnalysis
4. Analysis enables split-view mode
5. Results displayed alongside 3D model

## 3. Body Part Selection Logic

### 3.1 JavaScript Injection Strategy

**Common Pattern**: Both QuickScan and DeepDive use nearly identical JavaScript injection code with the following strategy:

**Selection Counter Logic**:
```javascript
let selectionCount = 0;
// Only trigger form after first selection (ignore auto-selection)
if (selectionCount > 1) {
    console.log('🎯 TRIGGERING FORM for:', text);
    // Trigger form
} else {
    console.log('🚫 IGNORING first auto-selection:', text);
}
```

**Why This Works**: BioDigital automatically selects a body part when the model loads. The implementation ignores this first selection and only responds to actual user clicks.

### 3.2 DOM Mutation Detection

**MutationObserver Setup**:
```javascript
observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            mutation.addedNodes.forEach(function(node) {
                if (node.nodeType === 1) {
                    // Check for anatomy labels
                    const isAnatomyLabel = node.className && (
                        node.className.includes('label') ||
                        node.className.includes('anatomy') ||
                        node.className.includes('selected') ||
                        node.className.includes('highlight')
                    );
                    
                    // Validate text content
                    const hasAnatomyText = node.textContent && 
                        node.textContent.length > 0 && 
                        node.textContent.length < 100;
                    
                    // Process valid selections
                    if ((isAnatomyLabel || hasAnatomyText) && !isProcessingClick) {
                        // Selection logic here
                    }
                }
            });
        }
    });
});
```

### 3.3 Selection Validation

**Text Filtering Logic**:
```javascript
if (text && 
    text.length > 2 && 
    text.length < 50 &&
    !/^(loading|undefined|null|hide|fade|isolate|show|unknown)$/i.test(text)) {
    // Valid selection
}
```

**Validation Rules**:
- Text length between 2-50 characters
- Excludes system strings like "loading", "undefined", etc.
- Prevents processing of UI state changes

### 3.4 Click Position Tracking

**Coordinate Capture**:
```javascript
document.addEventListener('click', function(event) {
    lastClickPosition = {
        x: event.clientX,
        y: event.clientY
    };
});
```

**Coordinate Conversion**:
```javascript
// Convert WebView coordinates to screen coordinates
const screenX = (data.x / data.screenWidth) * 100 // Convert to percentage
const screenY = (data.y / data.screenHeight) * 100 // Convert to percentage
```

## 4. Form Triggering Logic

### 4.1 Message Passing Architecture

**WebView to React Native Communication**:
```javascript
window.ReactNativeWebView.postMessage(JSON.stringify({
    type: 'BODY_PART_SELECTED',
    selectedText: text,
    className: node.className,
    x: lastClickPosition.x,
    y: lastClickPosition.y,
    screenWidth: window.innerWidth,
    screenHeight: window.innerHeight
}));
```

**React Native Message Handler**:
```typescript
const handleWebViewMessage = (event: any) => {
    try {
        const data = JSON.parse(event.nativeEvent.data)
        
        if (data.type === 'BODY_PART_SELECTED') {
            // Convert coordinates and trigger form
            const screenX = (data.x / data.screenWidth) * 100
            const screenY = (data.y / data.screenHeight) * 100
            
            setClickPosition({ x: screenX, y: screenY })
            setSelectedBodyPart(data.selectedText)
            setShowForm(true)
        }
    } catch (error) {
        console.log('WebView message parsing error:', error)
    }
}
```

### 4.2 Form Positioning Logic

**Dynamic Position Calculation**:
```typescript
const getInitialModalPosition = () => {
    const modalWidth = screenWidth * 0.85
    const modalHeight = showAdvanced ? screenHeight * 0.7 : screenHeight * 0.5
    
    // Convert percentage position to actual pixels
    let x = (position.x / 100) * screenWidth
    let y = (position.y / 100) * screenHeight
    
    // Adjust position to keep modal on screen
    if (x + modalWidth > screenWidth) {
        x = screenWidth - modalWidth - 20
    }
    if (x < 20) {
        x = 20
    }
    
    if (y + modalHeight > screenHeight) {
        y = screenHeight - modalHeight - 40
    }
    if (y < 60) {
        y = 60
    }
    
    return { left: x, top: y, width: modalWidth, height: modalHeight }
}
```

### 4.3 Form Component Selection

**QuickScan**: Triggers `TargetedForm` component
**DeepDive**: Triggers `ImmersiveDiagnosticForm` component

**Form Props**:
```typescript
interface TargetedFormProps {
    visible: boolean
    position: { x: number; y: number }
    onClose: () => void
    mode: 'quick' | 'deep'
    bodyPart?: string
    enableSplitView?: boolean
    webViewComponent?: React.ReactNode
}
```

## 5. Form Components Deep Dive

### 5.1 TargetedForm Component

**Location**: `/packages/app/features/body3d/targetedFormTempBase.tsx`

**Size**: 3000+ lines (VIOLATES PROJECT SIZE LIMITS)

**Key Features**:
- **Draggable Modal**: Users can drag the form around the screen
- **Multi-step Form**: Progressive disclosure of form fields
- **Pain Scale**: 0-10 numerical pain rating
- **Pain Quality Selection**: Multiple choice pain descriptors
- **Duration and Frequency**: Dropdowns for timing information
- **Advanced Section**: Collapsible additional fields

**Pain Quality Options**:
```typescript
const PAIN_QUALITIES = [
    'Sharp', 'Dull', 'Throbbing', 'Burning', 'Shooting', 
    'Stabbing', 'Cramping', 'Aching', 'Tingling', 'Numb'
]
```

**Duration Options**:
```typescript
const DURATION_OPTIONS = [
    'Just started (less than 1 day)',
    'Few days (1-7 days)',
    'About a week (1-2 weeks)', 
    'Few weeks (2-4 weeks)',
    'About a month (1-2 months)',
    'Several months (2-6 months)',
    'More than 6 months'
]
```

### 5.2 Drag and Drop Implementation

**PanResponder Setup**:
```typescript
const createPanResponder = () => {
    return PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (evt, gestureState) => {
            const totalMovement = Math.sqrt(gestureState.dx * gestureState.dx + gestureState.dy * gestureState.dy)
            return totalMovement > 8
        },
        onPanResponderGrant: (evt, gestureState) => {
            setIsDragging(true)
            Keyboard.dismiss()
            // Store initial position
        },
        onPanResponderMove: (evt, gestureState) => {
            // Update position in real-time
            const newPosition = {
                x: dragStartPosition.current.x + gestureState.dx,
                y: dragStartPosition.current.y + gestureState.dy,
            }
            setModalPosition(newPosition)
        },
        onPanResponderRelease: (evt, gestureState) => {
            setIsDragging(false)
            // Finalize position
        }
    })
}
```

### 5.3 Keyboard Handling

**Smart Backdrop Behavior**:
```typescript
const handleBackdropPress = () => {
    const currentlyFocusedInput = RNTextInput.State?.currentlyFocusedInput?.()
    
    if (currentlyFocusedInput) {
        Keyboard.dismiss() // Just hide keyboard, don't close modal
        return
    }
    
    // No focused input - close the form
    onClose()
}
```

## 6. State Management

### 6.1 FormStore (Zustand)

**Location**: `/packages/app/store/formStore.ts`

**Store Structure**:
```typescript
interface FormData {
    // Basic required fields
    symptoms: string
    bodyPart: string
    
    // Advanced optional fields
    painLevel: number
    painQuality: string[]
    duration: string
    frequency: string
    triggers: string
    dailyImpact: string
    pastEpisodes: boolean | null
    pastEpisodesDetail: string
    
    // Extended fields for immersive form
    associatedSymptoms: string[]
    concerns: string
}
```

**Key Actions**:
- Individual field setters for each form field
- `togglePainQuality`: Manages multi-select pain quality
- `toggleAssociatedSymptom`: Manages associated symptoms
- `resetForm`: Clears all form data
- `getFormDataForMCP`: Formats data for AI analysis

### 6.2 MCP Data Formatting

**Purpose**: Prepares form data for AI analysis server

**Key Function**:
```typescript
export const prepareMCPData = (formData: FormData, userProfile: UserProfile) => {
    const cleanValue = (value: any) => {
        if (value === null || value === 'null' || value === 'NA' || value === '') {
            return null
        }
        return value
    }
    
    return {
        user_name: cleanValue(userProfile.name),
        primary_symptoms: cleanValue(formData.symptoms),
        body_part: cleanValue(formData.bodyPart),
        pain_level: cleanValue(formData.painLevel),
        pain_quality: cleanValue(formData.painQuality.join(', ')),
        // ... additional fields
    }
}
```

## 7. AI Analysis Integration

### 7.1 SmartAnalysis Component

**Location**: `/packages/app/features/body3d/smartAnalysis.tsx`

**Analysis Stages**:
```typescript
type AnalysisStage = 'analyzing' | 'chat' | 'results'
```

**Stage Flow**:
1. **Analyzing**: Shows loading animation and progress indicators
2. **Chat**: Interactive diagnostic chat with follow-up questions
3. **Results**: Final diagnostic insights and recommendations

### 7.2 Animation System

**Loading Animations**:
```typescript
// Multiple animated values for loading stage
const fadeAnim = useRef(new Animated.Value(0)).current
const slideAnim = useRef(new Animated.Value(30)).current
const progressAnim = useRef(new Animated.Value(0)).current
const loadingRotation = useRef(new Animated.Value(0)).current
```

**Chat Height Animation**:
```typescript
// Auto-resize chat interface like Claude.ai
const normalHeight = screenHeight * 0.45
const expandedHeight = screenHeight * 0.4
const chatHeightAnim = useRef(new Animated.Value(normalHeight)).current
```

### 7.3 Split-View Support

**Implementation**: SmartAnalysis can display alongside the 3D model for simultaneous interaction

**Props**:
```typescript
interface SmartAnalysisProps {
    visible: boolean
    onClose: () => void
    bodyPart: string
    mode: 'quick' | 'deep'
    initialFormData: any
    enableSplitView?: boolean
    webViewComponent?: React.ReactNode
}
```

## 8. Demo and Onboarding

### 8.1 BioDigital Demo Component

**Location**: `/packages/app/features/auth/components/biodigital-demo.tsx`

**Purpose**: Onboard new users to BioDigital interaction

**Key Features**:
- Simplified selection detection (no auto-selection filtering)
- Mock diagnostic flow
- User education on body part selection
- Transition to full app experience

**Selection Logic Differences**:
- No selection counter (processes all selections)
- Immediate form triggering
- Simplified message structure

## 9. Home Screen Integration

### 9.1 Preview Mode

**Location**: `/packages/app/features/home/screen.tsx`

**Purpose**: Display BioDigital model as part of health dashboard

**Features**:
- Uses `homePreviewUrl` configuration
- Auto-rotation enabled (`load-rotate=20`)
- Read-only interaction (no form triggering)
- Health data visualization overlay

## 10. Security Analysis

### 10.1 Critical Security Issues

**Hardcoded API Keys**:
```typescript
// SECURITY VULNERABILITY
biodigitalApiKey: process.env.EXPO_PUBLIC_BIODIGITAL_API_KEY || '210579dd394dbd5d55f9adb798db38be02ae9ef8',
biodigitalApiSecret: process.env.EXPO_PUBLIC_BIODIGITAL_API_SECRET || '71893570b1d59a01e582c2f822ef745811fc5868',
```

**Console Logging**:
- Multiple components log sensitive user data to console
- Medical symptom information exposed in logs
- User selection data logged without sanitization

**Environment Variables**:
- `.env.local` file tracked in git (should be in `.gitignore`)
- No validation of environment variables in production

### 10.2 Data Privacy Concerns

**Medical Data Exposure**:
- Symptom descriptions logged to console
- Body part selections logged for debugging
- Form data potentially exposed in error messages

**Recommendations**:
1. Move API keys to secure environment variables
2. Remove all console.log statements containing user data
3. Implement proper error handling without data exposure
4. Add `.env.local` to `.gitignore`
5. Implement API key rotation mechanism

## 11. Performance Considerations

### 11.1 WebView Optimization

**Loading Strategy**:
- 3-second delay before JavaScript injection
- MutationObserver for efficient DOM monitoring
- Debounced selection processing (500ms timeout)

**Memory Management**:
- Observer cleanup on component unmount
- Event listener removal
- Animated value cleanup

### 11.2 Component Lifecycle

**Mount/Unmount Behavior**:
- Form state preserved during drag operations
- WebView reinitialization on mode switch
- Proper cleanup of timers and observers

## 12. Testing Strategy

### 12.1 Current Testing Gaps

**Missing Tests**:
- JavaScript injection functionality
- Body part selection accuracy
- Form validation logic
- Cross-platform compatibility
- Error handling scenarios

**Recommended Tests**:
1. **Unit Tests**: Form validation, state management
2. **Integration Tests**: WebView communication, form triggering
3. **E2E Tests**: Complete user flow from selection to analysis
4. **Security Tests**: API key exposure, data sanitization

## 13. Known Issues and Limitations

### 13.1 Code Quality Issues

**File Size Violations**:
- `targetedFormTempBase.tsx`: 3000+ lines (should be <1000)
- `smartAnalysis.tsx`: Large file with multiple responsibilities
- Need for component decomposition

**Duplicate Code**:
- JavaScript injection code duplicated across components
- Similar WebView configurations in multiple files
- Repeated validation logic

### 13.2 Technical Debt

**Hardcoded Values**:
- BioDigital model ID (`6CBo`) significance undocumented
- Magic numbers for timeouts and delays
- URL parameter meanings not explained

**Missing Error Handling**:
- No fallback for BioDigital loading failures
- No offline mode support
- No validation of WebView message format

## 14. Future Enhancements

### 14.1 Recommended Improvements

**Code Organization**:
1. Extract JavaScript injection into separate utility file
2. Create BioDigital service layer for URL management
3. Implement proper error boundaries
4. Add TypeScript interfaces for WebView messages

**Security Enhancements**:
1. Implement secure API key management
2. Add request signing for BioDigital API calls
3. Implement content security policy for WebViews
4. Add audit logging for medical data access

**Performance Optimizations**:
1. Implement WebView caching
2. Add progressive loading for 3D models
3. Optimize JavaScript injection timing
4. Add connection retry logic

### 14.2 Architecture Improvements

**Microservices Approach**:
- Separate BioDigital service
- Dedicated form management service
- Independent AI analysis service
- Centralized configuration management

**State Management**:
- Migrate to more robust state solution
- Implement proper error state handling
- Add offline state synchronization
- Implement form state persistence

## 15. Conclusion

The BioDigital implementation in Proxima represents a sophisticated integration of 3D anatomy visualization with medical diagnostic workflows. The architecture successfully enables users to interact with 3D models and provide targeted symptom information, creating a more intuitive and accurate diagnostic experience.

However, the implementation has several critical areas requiring immediate attention:

1. **Security vulnerabilities** must be addressed immediately
2. **Code organization** needs significant improvement
3. **Testing coverage** is insufficient for medical applications
4. **Performance optimization** is needed for production scale

The core concept and user experience are sound, but the technical implementation requires refactoring to meet enterprise-grade security, performance, and maintainability standards.

---

**Documentation Status**: Complete analysis as of analysis date
**Next Steps**: Address security issues, implement recommended improvements, establish comprehensive testing suite

## Appendix A: File Structure

```
packages/app/
├── lib/
│   └── config.ts                          # BioDigital configuration
├── features/
│   ├── body3d/
│   │   ├── screen.tsx                     # Main tab controller
│   │   ├── quickscan.tsx                  # Quick scan mode
│   │   ├── deepdive.tsx                   # Deep dive mode
│   │   ├── targetedFormTempBase.tsx       # Form component (3000+ lines)
│   │   ├── immersiveDiagnosticForm.tsx    # Enhanced form
│   │   ├── smartAnalysis.tsx              # AI analysis component
│   │   ├── airesults.tsx                  # Results display
│   │   └── enhancedDiagnosticChat.tsx     # Chat interface
│   ├── auth/
│   │   └── components/
│   │       └── biodigital-demo.tsx        # Demo component
│   └── home/
│       └── screen.tsx                     # Home integration
└── store/
    └── formStore.ts                       # State management
```

## Appendix B: BioDigital URL Parameters

| Parameter | Purpose | Values |
|-----------|---------|--------|
| `id` | Model identifier | `6CBo` |
| `ui-anatomy-descriptions` | Show descriptions | `true/false` |
| `ui-anatomy-pronunciations` | Show pronunciations | `true/false` |
| `ui-anatomy-labels` | Show labels | `true/false` |
| `ui-audio` | Enable audio | `true/false` |
| `ui-chapter-list` | Show chapters | `true/false` |
| `ui-fullscreen` | Fullscreen button | `true/false` |
| `ui-help` | Help button | `true/false` |
| `ui-info` | Info panel | `true/false` |
| `ui-label-list` | Label list | `true/false` |
| `ui-layers` | Layer controls | `true/false` |
| `ui-skin-layers` | Skin controls | `true/false` |
| `ui-loader` | Loading style | `circle` |
| `ui-media-controls` | Media controls | `none/timeline` |
| `ui-menu` | Menu button | `true/false` |
| `ui-nav` | Navigation | `true/false` |
| `ui-search` | Search function | `true/false` |
| `ui-tools` | Tool panel | `true/false` |
| `ui-tutorial` | Tutorial | `true/false` |
| `ui-undo` | Undo function | `true/false` |
| `ui-whiteboard` | Whiteboard | `true/false` |
| `initial.none` | No auto-selection | `true/false` |
| `disable-scroll` | Disable scrolling | `true/false` |
| `load-rotate` | Auto-rotation | `0-360` |
| `uaid` | User access ID | `M4iCG` |
| `paid` | Payment ID | `o_159040f0` |


# BioDigital Human Integration Guide

## Overview
This document describes the correct implementation of BioDigital Human 3D anatomy viewer with selection/picking functionality for the Proxima-1 health platform.

## Key Components

### 1. HTML Host Pages
We have three implementations to handle different scenarios:

#### a. `/public/biodigital-viewer.html` (Recommended)
Uses the published viewer URL with all UI customizations and the JavaScript API.

**Key features:**
- Uses the exact published URL from BioDigital's publish tool
- Includes all UI parameter settings
- Full JavaScript API integration
- Handles selection events and forwards them to parent

#### b. `/public/biodigital-widget.html` (Alternative)
Uses the widget endpoint which is documented for API access.

**Key features:**
- Uses widget endpoint with `?m=` parameter
- Minimal UI for cleaner integration
- Same JavaScript API handling

#### c. `/public/biodigital-correct.html` (Legacy)
Original implementation following the getting started guide.

### 2. React Component (`QuickScanDemo.tsx`)
The React component that embeds the HTML host page and receives selection events.

**Key features:**
- Embeds the host HTML via iframe
- Listens for postMessage events
- Updates UI based on selected body parts
- Shows symptom form when body part is clicked

## Implementation Details

### Viewer vs Widget Endpoints

#### Viewer Endpoint (Published Models)
```
https://human.biodigital.com/viewer/?id=<MODEL_ID>&dk=<DEVELOPER_KEY>&paid=<PAID_ID>
```
- Used for published/shared models
- Model ID is passed with `id=` parameter
- Includes UI customization parameters
- May require `paid=` parameter for account models

#### Widget Endpoint (API Development)
```
https://human.biodigital.com/widget/?m=<MODEL_ID>&dk=<DEVELOPER_KEY>
```
- Documented for JavaScript API development
- Model ID is passed with `m=` parameter
- Simpler URL structure
- Better for programmatic control

### SDK URL
```
https://developer.biodigital.com/builds/api/human-api-3.0.0.min.js
```

### Event Handling

#### 1. Scene Pick Events
```javascript
human.on('scene.picked', function(pickEvent) {
    // pickEvent contains:
    // - objectId: ID of the picked object
    // - mode: The pick mode
    // - position: 3D coordinates
    // - canvasPosition: 2D canvas coordinates
});
```

#### 2. Object Selection Events
```javascript
human.on('scene.objectsSelected', function(event) {
    // event is a map of objectId -> boolean
    // true = selected, false = deselected
});
```

#### 3. Getting Object Details
```javascript
human.send('scene.info', objectId, function(info) {
    // info contains detailed object metadata
    // including displayName and description
});
```

### Selection Counter Pattern
To avoid processing auto-selections when the model loads:
```javascript
let pickCounter = 0;

human.on('scene.picked', function(pickEvent) {
    pickCounter++;
    if (pickCounter <= 2) {
        return; // Skip first 2 auto-selections
    }
    // Process real user selection
});
```

### Cross-Origin Communication
The host HTML communicates with the React app via postMessage:
```javascript
// In host HTML:
window.parent.postMessage({
    type: 'BIODIGITAL_PICK',
    data: {
        objectName: objectName,
        objectId: objectId,
        description: description
    }
}, '*');

// In React component:
window.addEventListener('message', (event) => {
    if (event.data.type === 'BIODIGITAL_PICK') {
        // Handle selection
    }
});
```

## Available Models

BioDigital provides various models that can be loaded:
- `6F0C` - Full body anatomy model (currently used)
- `cochlear_implant` - Ear/cochlear implant model
- `production/maleAdult/heart.json` - Heart model
- `production/maleAdult/artery.json` - Artery model

## Credentials

- **Developer Key**: `4a7eb63719c66a365c746afeae476870503ba4be`
- **Developer Secret**: `80a85fae95e37b584000cc0b205214df3c0bbd8d`

## Troubleshooting

### Selection Not Working
1. Ensure you're using the `widget` endpoint, not `viewer`
2. Check that the HumanAPI SDK is loaded correctly
3. Verify the iframe ID matches what's passed to `new HumanAPI()`
4. Make sure to wait for the `human.ready` event before setting up handlers

### CORS Issues
- The host HTML must be served from the same domain as your app
- BioDigital content is loaded in an iframe to avoid CORS restrictions
- Communication happens via postMessage API

### Auto-Selection Issues
- BioDigital may auto-select objects when the model loads
- Use a counter to skip the first 1-2 selections
- Only process selections after user interaction

## Example Usage

```javascript
// Initialize API
var human = new HumanAPI("biodigitalWidget");

// Wait for ready
human.on('human.ready', function() {
    
    // Listen for picks
    human.on('scene.picked', function(pickEvent) {
        
        // Get object details
        human.send('scene.info', pickEvent.objectId, function(info) {
            const objectName = info[pickEvent.objectId].displayName;
            console.log('User selected:', objectName);
        });
    });
});
```

## URL Parameters

### UI Customization Parameters
When using the viewer endpoint, you can control the UI with these parameters:
- `ui-anatomy-descriptions`: Show/hide anatomy descriptions
- `ui-anatomy-labels`: Show/hide anatomy labels on hover
- `ui-tools`: Show/hide tools menu
- `ui-nav`: Show/hide navigation controls
- `ui-fullscreen`: Show/hide fullscreen button
- `ui-search`: Show/hide search functionality
- `ui-layers`: Show/hide layers control
- `ui-all=false`: Hide all UI elements

### Authentication Parameters
- `dk`: Developer key (required)
- `paid`: Publisher account ID (required for published models)

## Best Practices

1. **Always wait for `human.ready`** before setting up event handlers
2. **Use scene.info** to get human-readable names for objects
3. **Handle errors gracefully** - BioDigital API may fail to load
4. **Test thoroughly** - Different body parts may have different data structures
5. **Keep the host HTML simple** - Complex logic should be in React components
6. **Use the viewer endpoint** for published models with specific UI settings
7. **Use the widget endpoint** for cleaner API-focused implementations
8. **Test programmatic picking** with `scene.pick` to debug selection issues

## Future Enhancements

1. **Multiple Selection**: Allow selecting multiple body parts
2. **Highlighting**: Visually highlight selected parts using `scene.selectObjects`
3. **Camera Control**: Focus camera on selected body parts
4. **Annotations**: Add custom annotations to body parts
5. **Time-Series**: Track symptoms on specific body parts over time

## References

- [BioDigital Human API Documentation](https://developer.biodigital.com/docs)
- [Getting Started Guide](https://developer.biodigital.com/docs/getting-started)
- [Scene API Reference](https://developer.biodigital.com/docs/api/scene)
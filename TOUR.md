# Tour Mode

An interactive feature allowing users to record, save, and playback guided tours through interesting areas of the quaternion Julia fractal.

## Overview

Tour Mode enables users to:
1. Record waypoints during exploration of the fractal
2. Save tours to JSON files for later viewing
3. Play back recorded tours with smooth transitions between points
4. Share complex exploration experiences with others

## Available Tours

The application includes several pre-recorded tours:

| File | Name | Points | Description |
|------|------|--------|-------------|
| tour01.json | Tour różowa świnka | 2 | A short tour with smooth color rendering and adaptive ray marching |
| tour02.json | Tour | 7 | Exploration with animated slice parameter |
| tour03.json | Tour | 2 | Basic exploration with color palette 1 |
| tour04.json | Tour | 6 | Detailed exploration with animated slice parameter |

## Recording a Tour

### Opening the Tour Menu
- Press the **T** key to open the tour recording menu
- The menu can be dragged to any position on the screen

### Recording Waypoints
- Click the **"Register Point"** button to save the current view as a waypoint
- The first registered point becomes the starting point of the tour
- Each additional point is added to the tour sequence
- All current parameters are saved with each point (fractal settings, camera position, quality settings, etc.)

### Saving a Tour
- Click the **"Finish Tour"** button to complete recording and save the tour
- Tours are saved as JSON files with automatic timestamp-based naming: `YYYYMMDD_HHMMSS.json`
- After saving, a download dialog will appear to save the file

## Playing Tours

### Starting a Tour
- Tours appear as buttons (T01, T02, etc.) in the preset menu at the top of the screen
- Click any tour button to begin playback
- The application automatically hides interface elements for an unobstructed view

### During Playback
- A status bar at the bottom shows the current tour name and point (e.g., "Tour - Point 2/7")
- The camera smoothly transitions between waypoints
- All fractal parameters, camera settings, and rendering options are applied at each point
- Press **Esc** at any time to stop playback and return to normal mode

### Tour Completion
- After the last point, a "Tour Completed" message appears for a few seconds
- The interface automatically returns to normal mode after completion

## Tour Data Structure

Tours are stored as JSON files with the following structure:

```json
{
  "name": "Tour Name",
  "created": "2025-04-01T22:30:00",
  "defaultTransitionDuration": 5.0,
  "defaultStayDuration": 3.0,
  "points": [
    {
      "fractalParams": {
        "c": [-0.2, 0.6, 0.2, 0.2],
        "sliceValue": 0.0,
        "sliceAmplitude": 0.5,
        "sliceAnimated": true
      },
      "camera": {
        "position": [0, 0, 2],
        "rotation": {
          "pitch": 0,
          "yaw": 0
        },
        "focalLength": 1.5,
        "animationEnabled": true,
        "decelerationEnabled": true
      },
      "renderQuality": {
        "iterations": 100,
        "shadows": true,
        "ao": true,
        "smoothColor": true,
        "specular": true,
        "adaptiveRM": true,
        "colorPalette": 3
      },
      "crossSection": {
        "mode": 0,
        "distance": 3.5
      }
    },
    // Additional points...
  ]
}
```

## Implementation Details

The tour functionality is implemented across three JavaScript modules:

1. **tour.js** - Core module containing shared state and tour loading functions
2. **tourRecording.js** - Functionality for recording tours and tour points
3. **tourPlayback.js** - Functionality for playing tours and handling transitions

## Planned Future Features

In upcoming versions, we plan to add:

1. **Enhanced Tour Recording**:
   - Tour naming during recording
   - Per-point transition timing controls
   - Ability to remove or reorder points

2. **Extended Playback Options**:
   - Pause/resume functionality
   - Speed control for playback
   - Loop mode for continuous playback

3. **Tour Management**:
   - UI for browsing available tours
   - Tour editing capability
   - Tour metadata (author, description, tags)

4. **Sharing Features**:
   - Direct link sharing of tours
   - Embedded tour player for websites

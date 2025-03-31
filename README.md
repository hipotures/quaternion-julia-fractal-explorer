# Quaternion Julia Fractal Explorer

![Quaternion Julia Fractal](https://examples.4d-fractal.eu/preview.jpg)

## Overview

An interactive 3D explorer for quaternion Julia fractals, allowing real-time navigation through stunning four-dimensional fractal structures. This application uses WebGL through Three.js to render complex quaternion fractals with high performance and implements advanced rendering techniques like adaptive ray marching, ambient occlusion, and smooth lighting.

## Features

- **Real-time 3D Rendering**: Explore quaternion Julia sets in a fully interactive 3D environment
- **Smooth Navigation**: Click on any point to smoothly travel to that location
- **Customizable Parameters**: Adjust fractal parameters, camera settings, and rendering quality in real-time
- **Cross-Section Modes**: Explore internal structures using different cross-section visualization techniques
- **Advanced Rendering**: Shadows, ambient occlusion, specular highlights, and adaptive ray marching
- **10 Color Palettes**: Choose from various color schemes or disable coloring
- **Video Recording**: Capture your exploration in WebM format with adjustable quality settings
- **4D Animation**: Animate the 4D slice parameter to observe how the fractal transforms across the fourth dimension

## Technical Details

- Implemented using Three.js and WebGL for high-performance rendering
- Uses quaternion mathematics to generate 4D fractals
- Fragment shader implements ray marching with distance estimation for rendering
- Responsive design adapts to different screen sizes

## Controls Guide

The application features two interface panels:
- Left panel (toggle with 'M' key): Shows all available controls
- Right panel (toggle with 'P' key): Displays current parameter values and system performance

### Navigation Controls
| Control | Action | Stats Panel Value |
|---------|--------|-------------------|
| Mouse click | Smoothly move to clicked point | - |
| Mouse scroll | Move forward/backward | "Velocity" |
| Middle mouse button | Hold to maintain constant velocity | "Velocity" |
| Arrow keys | Rotate camera | "Pitch", "Yaw" |
| Ctrl + Arrows | Faster rotation (5x) | "Pitch", "Yaw" |
| +/- | Zoom in/out (changes field of view) | "Focal length" |
| Space | Pause/resume rendering | Red "PAUSED" overlay |
| A | Toggle camera animations | "Animations: ON/OFF" |
| D | Toggle deceleration | "Deceleration: ON/OFF" |

### Fractal Parameters
| Control | Action | Stats Panel Value |
|---------|--------|-------------------|
| R | Reset fractal & camera | "c" parameter values |
| 0 | Toggle slice animation | "Slice", "Slice anim" |
| < / > | Decrease/increase slice amplitude | "Slice range" |
| 9 | Cycle through cross-section modes | "Cross-section" |
| [ / ] | Adjust cross-section distance | "CS Distance" |

### Rendering Quality
| Control | Action | Stats Panel Value |
|---------|--------|-------------------|
| 1 / 2 | Increase/decrease iteration count | "Iterations" |
| 3 | Toggle soft shadows | "Shadows: ON/OFF" |
| 4 | Toggle ambient occlusion | "AO: ON/OFF" |
| 5 | Toggle smooth coloring | "Smooth color: ON/OFF" |
| 6 | Cycle color palettes | "Color: OFF/1-10" |
| 7 | Toggle specular highlights | "Specular: ON/OFF" |
| 8 | Toggle adaptive ray marching | "Adaptive RM: ON/OFF" |

### Interface & Recording
| Control | Action | Stats Panel Value |
|---------|--------|-------------------|
| M | Show/hide controls menu | - |
| P | Show/hide stats panel | - |
| V | Start/stop video recording | "REC" indicator when active |
| Q | Change recording quality | "Rec quality" |

## Statistics Panel Sections

The right-side stats panel displays the current state of the application in several categories:

### FRACTAL PARAMETERS
- Current quaternion Julia set parameter values (c.x, c.y, c.z, c.w)
- Current 4D slice value and animation state

### CAMERA
- Position (x, y, z) and orientation (pitch, yaw)
- Movement velocity and focal length

### CROSS-SECTION
- Current cross-section mode and distance
- Only active when cross-section mode is enabled (9 key)

### QUALITY SETTINGS
- Iteration count
- Status of various rendering features (shadows, AO, etc.)
- Current color palette

### SYSTEM
- Frames per second (FPS)
- Recording status and quality

## Techniques Used

The application uses several advanced rendering techniques:

1. **Ray Marching**: A rendering technique where rays are incrementally stepped through the scene until they hit a surface
2. **Distance Estimation**: Mathematical formulas that calculate the distance to the fractal surface
3. **Adaptive Ray Marching**: Dynamically adjusts step size based on distance to surface (smaller steps near surfaces for precision, larger steps in empty spaces for performance)
4. **Ambient Occlusion**: Simulates how light is occluded by nearby surfaces, adding realism and depth
5. **Quaternion Mathematics**: 4D extension of complex numbers, enabling the generation of four-dimensional fractals

## Getting Started

Simply open the index.html file in a modern web browser that supports WebGL. No installation required!

### Requirements
- Modern web browser with WebGL support (Chrome, Firefox, Edge, Safari)
- Graphics card with decent 3D performance

## Examples of Exploration

- Try pressing '0' to animate the 4D slice parameter and observe how the fractal transforms
- Use '9' key to enable cross-sections and explore the internal structure
- Toggle different rendering features (keys 3-8) to see their impact on visual quality
- Experiment with different color palettes using the '6' key

## Constant Velocity Movement

The application features a specialized movement control that lets you maintain a constant velocity:

1. **How it works**:
   - Use the mouse wheel to accelerate to your desired speed
   - Hold down the middle mouse button (wheel click)
   - While held, the velocity remains constant with no deceleration
   - Release the middle button to return to normal movement physics with deceleration

2. **Benefits**:
   - Perfect for creating smooth camera paths for recordings
   - Allows precise exploration of complex structures
   - Combines well with camera rotation to create orbital movements
   - Particularly useful for long-distance travel through the fractal

This feature overcomes a common issue in 3D exploration where maintaining a consistent speed is difficult. By locking your velocity while the middle button is held, you can focus on steering rather than constantly adjusting your speed.

## Performance Tips

- If experiencing low frame rates, reduce iterations (press '2')
- Disabling ambient occlusion (key '4') can significantly improve performance
- Enabling adaptive ray marching (key '8') improves performance in complex scenes

## License

This project is released under the MIT License.

## Acknowledgments

- Three.js for the WebGL rendering framework
- The fractal mathematics community for algorithms and inspiration

# UI Architecture Documentation

## Overview

The Quaternion Julia Fractal Explorer features a modern 3-panel UI system built with the Tweakpane library. This document provides detailed information about the UI architecture, module structure, and extension guidelines.

## 3-Panel Layout System

### Panel Configuration

The UI consists of three independent Tweakpane instances positioned at different screen locations:

#### 1. Main Controls Panel (Left Side)
- **Container ID**: `tweakpane-main-container`
- **Position**: `top: 10px, left: 10px`
- **Toggle Key**: `G`
- **Purpose**: Primary control interface for all fractal parameters

**Contents:**
- **Fractal Parameters**: Quaternion values, 4D slice animation, cross-sections
- **Color Effects**: Palettes, dynamic colors, orbit traps, physics-based coloring
- **Rendering Quality**: Iterations, shadows, ambient occlusion, adaptive ray marching
- **Camera Controls**: Focal length, animations, reset functionality
- **Recording & Media**: Video recording, screenshots, quality settings
- **Settings Management**: Import/export, reset, save/load functionality
- **Interface & Navigation**: Panel information and controls

#### 2. Parameters Monitor Panel (Right Side)
- **Container ID**: `tweakpane-parameters-container`
- **Position**: `top: 10px, right: 10px`
- **Purpose**: Real-time system monitoring and parameter display

**Contents:**
- **System Monitor**: Real-time FPS graphs, performance metrics
- **Current Parameters**: Live quaternion values, camera position, slice values
- **System Status**: Application state, recording status, active effects

#### 3. Presets & Tours Panel (Top Center)
- **Container ID**: `tweakpane-presets-container`
- **Position**: `top: 10px, left: 50% (centered)`
- **Default State**: Collapsed
- **Purpose**: Quick access to presets and tour functionality

**Contents:**
- **Quaternion Presets**: Dropdown context menu with Q01-Q13 presets
- **Tour Presets**: Dropdown context menu with T01-T04 tours
- **Tour System**: Recording controls, point registration, playback management

## Module Architecture

### Core Modules

#### `core.js` - Central Coordination
- **Purpose**: UI initialization, state management, pane coordination
- **Key Functions**:
  - `initTweakpane()`: Initializes the 3-panel system
  - `ensureLegacyUIHidden()`: Hides legacy UI on startup
  - `blockScrollOnTweakpaneContainers()`: Prevents scroll interference
- **Exports**: `pane`, `container`, `folders`, `bindingState`

#### `layout.js` - Panel Management
- **Purpose**: Creates and positions the three pane instances
- **Key Functions**:
  - `createMainPane()`: Creates left-side controls panel
  - `createParametersPane()`: Creates right-side monitoring panel
  - `createPresetsPane()`: Creates top-center presets panel
  - `initializePaneLayout()`: Initializes all containers
- **Exports**: Panel instances and container references

#### `monitoring.js` - System Monitoring
- **Purpose**: Real-time performance monitoring and parameter display
- **Key Functions**:
  - `createSystemMonitorFolder()`: Main monitoring interface coordination
  - `createPerformanceMonitorFolder()`: FPS graphs with 60-second history, performance metrics
  - `createParameterMonitorFolder()`: Live quaternion values, camera position, slice parameters
  - `createSystemStatusFolder()`: Recording status, animation state, active effects display
- **Update Frequency**: 100ms intervals for real-time responsiveness
- **Data Sources**: Integrates with fractalState, cameraState, qualitySettings, recording status

### Specialized Control Modules

#### `presets-ui.js` - Preset Management
- **Purpose**: Quaternion and tour preset selection with dropdown menus
- **Key Features**:
  - Context menu dropdowns (300px wide) for space-efficient preset selection
  - Automatic menu reset after selection with 100ms delay
  - Scroll event isolation within menus using `stopPropagation()`
  - Tour system controls: recording, playback, point registration
- **Presets**: Q01-Q13 quaternion configurations with precise parameter values, T01-T04 tour recordings
- **Integration**: Directly modifies fractalState.params and triggers camera animations

#### `recording.js` - Media Controls
- **Purpose**: Video recording and screenshot functionality with quality management
- **Key Features**:
  - Recording quality selection (Normal: 5Mbps, High: 10Mbps, Ultra: 16Mbps)
  - Real-time status monitoring with emoji indicators (🔴 Recording, ⚫ Stopped)
  - Screenshot format options (PNG, JPG, WebP) with quality selection
  - Integration with recorder.js and screenshot.js modules
- **UI Updates**: Automatic refresh of recording status every 100ms during active recording

#### `interface.js` - Panel Controls
- **Purpose**: UI panel visibility toggles and legacy verification system
- **Key Features**:
  - Panel visibility controls with keyboard shortcuts (G key for main panel)
  - Legacy UI verification mode with individual toggles for menu, presets, stats panels
  - Auto-collapse functionality for panel management
  - Integration with ui.js for legacy DOM manipulation
- **Legacy Integration**: Provides verification toggles for comparing old vs new UI systems

#### Settings Module System - Configuration Management

The settings system is distributed across 6 specialized modules:

**`settings.js` - Main UI Controls**
- Creates the Settings Management folder in main panel
- Provides buttons for reset, save, load, export, import operations
- Coordinates with other settings modules for functionality

**`settings-apply.js` - State Application**
- Applies loaded settings to fractal parameters, camera state, quality settings
- Handles state synchronization across application modules
- Ensures UI reflects loaded settings

**`settings-io.js` - File Operations**
- JSON serialization/deserialization of complete application state
- File download/upload handling for settings export/import
- Error handling for malformed settings files

**`settings-reset.js` - Reset Functionality**
- Restores all settings to default values
- Coordinates reset across fractal, camera, quality, and UI modules
- Maintains system stability during reset operations

**`settings-snapshot.js` - State Capture**
- Captures current application state for saving/export
- Creates comprehensive snapshots including all parameters
- Handles state validation and integrity checks

**`settings-storage.js` - Persistence**
- LocalStorage-based settings persistence
- Automatic settings backup and restoration
- Storage quota management and cleanup

## State Management

### bindingState Object

Central state synchronization across all UI panels:

```javascript
bindingState = {
    // Selector states for complex controls
    paletteSelector: { value: 0 },
    clipModeSelector: { value: 0 },
    orbitTrapTypeSelector: { value: 0 },
    physicsColorTypeSelector: { value: 0 },
    
    // Camera and navigation
    focalLength: { value: 1.5 },
    
    // Interface controls
    showLegacyMenu: { value: false },
    showLegacyPresets: { value: false },
    showLegacyStats: { value: false },
    
    // Monitoring values (updated in real-time)
    currentFPS: 60.0,
    cameraVelocity: 0.0,
    appStatus: 'Running',
    recordingStatus: 'Stopped'
}
```

### Event Management

#### Scroll Event Blocking
All Tweakpane containers implement scroll event isolation:

```javascript
container.addEventListener('wheel', (e) => {
    e.stopPropagation();
}, { passive: false });
```

This prevents scroll actions within UI panels from affecting fractal navigation.

#### Context Menu System
Dropdown menus use custom DOM elements with sophisticated event handling:

- Click outside to close
- Hover effects for visual feedback
- Scroll isolation within menu boundaries
- Automatic cleanup and memory management

## Extension Guidelines

### Adding New Control Modules

1. **Create Module File**: Follow naming convention `feature-name.js`
2. **Implement Standard Interface**:
   ```javascript
   export function createFeatureFolder(targetPane = null) {
       const usePane = targetPane || pane;
       // Implementation
   }
   ```
3. **Register in core.js**: Add import and function call
4. **Update Documentation**: Add to this file and CLAUDE.md

### Adding New Panels

1. **Update layout.js**: Add new pane creation function
2. **Position Container**: Define CSS positioning
3. **Register in core.js**: Add to initialization sequence
4. **Update State Management**: Add relevant bindingState properties

### Context Menu Implementation

For space-efficient control lists:

```javascript
function createContextMenu(options, onSelect) {
    const menu = document.createElement('div');
    menu.className = 'preset-context-menu';
    
    // Styling and positioning
    menu.style.cssText = `
        position: absolute;
        background: rgba(40, 40, 45, 0.95);
        // ... styling
    `;
    
    // Scroll isolation
    menu.addEventListener('wheel', (e) => {
        e.stopPropagation();
    }, { passive: false });
    
    // Implementation details...
}
```

## Performance Considerations

### Memory Management
- Event listeners are properly cleaned up
- DOM elements are removed from memory
- State objects are reused rather than recreated

### Rendering Optimization
- UI updates are batched when possible
- Monitoring graphs use efficient update cycles
- Panel visibility toggles prevent unnecessary rendering

### Event Efficiency
- Scroll blocking is implemented efficiently with passive: false only when needed
- Context menus are created on-demand rather than pre-generated
- State synchronization is optimized for minimal overhead

## Troubleshooting

### Common Issues

1. **Panels Not Appearing**: Check if `initializePaneLayout()` completes successfully
2. **Scroll Interference**: Verify scroll event blocking is active on all containers
3. **State Sync Issues**: Ensure bindingState properties are properly initialized
4. **Context Menu Problems**: Check DOM cleanup and event listener management

### Debug Tools

- Console logging in `core.js` shows initialization progress
- `refreshUI()` function for manual state synchronization
- Panel visibility can be tested with browser developer tools

## Future Extensions

### Planned Features
- Customizable panel layouts
- User-defined preset categories
- Advanced monitoring graphs
- Plugin architecture for third-party extensions

### Technical Debt
- Legacy UI removal (currently kept for verification)
- State management centralization
- Performance monitoring improvements
- Automated testing for UI components

This architecture provides a solid foundation for continued development while maintaining clean separation of concerns and professional user experience.
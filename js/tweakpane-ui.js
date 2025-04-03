/**
 * Tweakpane UI Module for the Quaternion Julia Fractal Explorer
 * Main entry point for the UI control panel implementation
 * 
 * This file now acts as a bridge to the modular implementation in the tweakpane-ui/ directory
 * 
 * @module tweakpane-ui
 */

// Import all functionality from the modular implementation
import {
    // Core functionality
    initTweakpane,
    refreshUI,
    toggleTweakpaneVisibility,
    pane,
    folders,
    bindingState,
    
    // Quality settings
    updateQualityUniforms,
    
    // Settings management
    getSettingsSnapshot,
    applySettings,
    resetAllToDefaults,
    saveCurrentSettings,
    loadSavedSettings,
    exportSettingsToFile,
    importSettingsFromFile
} from './tweakpane-ui/index.js';

// Re-export all imported functionality to maintain backward compatibility
export {
    initTweakpane,
    refreshUI,
    toggleTweakpaneVisibility,
    pane,
    folders,
    bindingState,
    updateQualityUniforms,
    getSettingsSnapshot,
    applySettings,
    resetAllToDefaults,
    saveCurrentSettings,
    loadSavedSettings,
    exportSettingsToFile,
    importSettingsFromFile
};

/**
 * This file used to contain all UI implementation, but has been refactored into 
 * multiple smaller modules to improve maintainability and code organization.
 * 
 * The complete implementation can now be found in the tweakpane-ui/ directory:
 * - core.js - Core UI setup and shared functionality
 * - fractal.js - Fractal parameter controls
 * - color.js - Color controls and effects
 * - rendering.js - Rendering quality settings
 * - camera.js - Camera controls
 * - presets-ui.js - Presets management UI 
 * - settings-*.js - Settings management functionality
 */

console.log('Tweakpane UI loaded (modular architecture)');

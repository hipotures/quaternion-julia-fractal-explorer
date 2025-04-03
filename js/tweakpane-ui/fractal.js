/**
 * Tweakpane UI Fractal Parameters Module
 * Contains controls for fractal parameters, slice controls, and cross-section settings
 * 
 * @module tweakpane-ui/fractal
 */

import { 
    fractalState, 
    crossSectionSettings,
    resetFractalParams
} from '../fractal.js';

import { 
    updateFractalParamsUniform,
    updateClipModeUniform,
    updateClipDistanceUniform
} from '../shaders.js';

// Import shared UI elements
import { pane, folders, bindingState } from './core.js';

/**
 * Creates the fractal parameters section with all related controls
 */
export function createFractalParametersFolder() {
    // Create main folder
    folders.fractal = pane.addFolder({
        title: 'Fractal Parameters',
        expanded: true
    });
    
    // Parameter c controls (quaternion components)
    folders.fractal.addInput(fractalState.params, 'x', { 
        min: -1, max: 1, step: 0.01, 
        label: 'c.x'
    }).on('change', () => {
        updateFractalParamsUniform(fractalState.params);
    });
    
    folders.fractal.addInput(fractalState.params, 'y', { 
        min: -1, max: 1, step: 0.01, 
        label: 'c.y'
    }).on('change', () => {
        updateFractalParamsUniform(fractalState.params);
    });
    
    folders.fractal.addInput(fractalState.params, 'z', { 
        min: -1, max: 1, step: 0.01, 
        label: 'c.z'
    }).on('change', () => {
        updateFractalParamsUniform(fractalState.params);
    });
    
    folders.fractal.addInput(fractalState.params, 'w', { 
        min: -1, max: 1, step: 0.01, 
        label: 'c.w'
    }).on('change', () => {
        updateFractalParamsUniform(fractalState.params);
    });
    
    // Random button
    folders.fractal.addButton({
        title: 'Randomize Parameters (R)'
    }).on('click', () => {
        resetFractalParams();
        // Update UI after randomization
        pane.refresh();
    });
    
    // Create sub-sections
    createSliceControlsFolder();
    createCrossSectionFolder();
}

/**
 * Creates the slice controls sub-section
 */
function createSliceControlsFolder() {
    // Slice animation controls
    const sliceFolder = folders.fractal.addFolder({
        title: 'Slice Controls (4D)',
        expanded: true
    });
    
    sliceFolder.addInput(fractalState, 'animateSlice', {
        label: 'Animate Slice (0)'
    }).on('change', () => {
        // No need to call toggleSliceAnimation() as we're directly modifying the state
    });
    
    sliceFolder.addInput(fractalState, 'sliceAmplitude', { 
        min: 0.1, max: 1.0, step: 0.1,
        label: 'Amplitude (< >)'
    }).on('change', () => {
        // No direct handler needed, the value is used in updateSlice()
    });
}

/**
 * Creates the cross-section controls sub-section
 */
function createCrossSectionFolder() {
    // Cross-section controls
    const crossSectionFolder = folders.fractal.addFolder({
        title: 'Cross-Section',
        expanded: true
    });
    
    // Bind a number for clip mode for the UI
    bindingState.clipModeSelector.value = crossSectionSettings.clipMode;
    
    crossSectionFolder.addInput(bindingState.clipModeSelector, 'value', {
        label: 'Mode (9)',
        options: {
            'OFF': 0,
            'Method 1': 1,
            'Method 2': 2,
            'Method 3': 3
        }
    }).on('change', (ev) => {
        crossSectionSettings.clipMode = ev.value;
        updateClipModeUniform(ev.value);
    });
    
    crossSectionFolder.addInput(crossSectionSettings, 'clipDistance', {
        label: 'Distance ([ ])',
        min: 0.2, max: 10.0, step: 0.1
    }).on('change', (ev) => {
        updateClipDistanceUniform(ev.value);
    });
}

/**
 * Tweakpane UI Rendering Quality Module
 * Contains controls for rendering quality settings like iterations, shadows, etc.
 * 
 * @module tweakpane-ui/rendering
 */

import { qualitySettings } from '../fractal.js';
import { CONFIG } from '../config.js';

// Import shared UI elements
import { pane, folders } from './core.js';

/**
 * Creates the rendering quality control section
 */
export function createRenderingFolder() {
    // Create main folder
    folders.rendering = pane.addFolder({
        title: 'Rendering Quality',
        expanded: true
    });
    
    // Iteration control
    folders.rendering.addInput(qualitySettings, 'maxIter', {
        label: 'Iterations (1/2)',
        min: CONFIG.FRACTAL.MIN_ITER, 
        max: CONFIG.FRACTAL.MAX_ITER,
        step: 20
    }).on('change', () => {
        // No direct call needed as we're modifying the state directly
        pane.refresh();
    });
    
    // Feature toggles
    folders.rendering.addInput(qualitySettings, 'enableShadows', {
        label: 'Shadows (3)'
    }).on('change', () => {
        updateQualityUniforms(qualitySettings);
    });
    
    folders.rendering.addInput(qualitySettings, 'enableAO', {
        label: 'Ambient Occlusion (4)'
    }).on('change', () => {
        updateQualityUniforms(qualitySettings);
    });
    
    folders.rendering.addInput(qualitySettings, 'enableSmoothColor', {
        label: 'Smooth Colors (5)'
    }).on('change', () => {
        updateQualityUniforms(qualitySettings);
    });
    
    folders.rendering.addInput(qualitySettings, 'enableSpecular', {
        label: 'Specular (7)'
    }).on('change', () => {
        updateQualityUniforms(qualitySettings);
    });
    
    folders.rendering.addInput(qualitySettings, 'enableAdaptiveSteps', {
        label: 'Adaptive Steps (8)'
    }).on('change', () => {
        updateQualityUniforms(qualitySettings);
        updateAdaptiveStepsUniform(qualitySettings.enableAdaptiveSteps);
    });
}

/**
 * Updates quality uniforms from UI
 */
export function updateQualityUniforms(qualitySettings) {
    // This function calls the shader updateQualityUniforms
    import('../shaders.js').then(module => {
        module.updateQualityUniforms(qualitySettings);
    });
}

/**
 * Updates adaptive steps uniform
 */
function updateAdaptiveStepsUniform(enabled) {
    import('../shaders.js').then(module => {
        if (module.updateAdaptiveStepsUniform) {
            module.updateAdaptiveStepsUniform(enabled);
        }
    });
}

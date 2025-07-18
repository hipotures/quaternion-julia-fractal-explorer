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
export function createRenderingFolder(targetPane = null) {
    const usePane = targetPane || pane;
    
    // Create main folder
    folders.rendering = usePane.addFolder({
        title: 'Rendering Quality',
        expanded: true
    });
    
    // Iteration control
    folders.rendering.addBinding(qualitySettings, 'maxIter', {
        label: 'Iterations (1/2)',
        min: CONFIG.FRACTAL.MIN_ITER, 
        max: CONFIG.FRACTAL.MAX_ITER,
        step: 20
    }).on('change', () => {
        // No direct call needed as we're modifying the state directly
        import('./core.js').then(module => {
            if (module.refreshUI) module.refreshUI();
        });
    });
    
    // Feature toggles
    folders.rendering.addBinding(qualitySettings, 'enableShadows', {
        label: 'Shadows (3)'
    }).on('change', () => {
        updateQualityUniforms(qualitySettings);
    });
    
    folders.rendering.addBinding(qualitySettings, 'enableAO', {
        label: 'Ambient Occlusion (4)'
    }).on('change', () => {
        updateQualityUniforms(qualitySettings);
    });
    
    folders.rendering.addBinding(qualitySettings, 'enableSmoothColor', {
        label: 'Smooth Colors (5)'
    }).on('change', () => {
        updateQualityUniforms(qualitySettings);
    });
    
    folders.rendering.addBinding(qualitySettings, 'enableSpecular', {
        label: 'Specular (7)'
    }).on('change', () => {
        updateQualityUniforms(qualitySettings);
    });
    
    folders.rendering.addBinding(qualitySettings, 'enableAdaptiveSteps', {
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

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

    // Separator before TAA settings
    folders.rendering.addSeparator();

    // TAA Toggle
    // The actual state for TAA is managed within taaResolveMaterial.uniforms.u_enableTAA
    // We need a proxy object or to import taaUniforms here.
    // For simplicity, let's assume we can import and modify taaUniforms directly.
    import('../../js/scene.js').then(sceneModule => {
        if (sceneModule.taaUniforms && sceneModule.taaUniforms.u_enableTAA) {
            folders.rendering.addInput(sceneModule.taaUniforms.u_enableTAA, 'value', {
                label: 'Enable TAA (Temporal Anti-Aliasing)'
            }).on('change', (ev) => {
                console.log("TAA Enabled:", ev.value);
                // No need to call a specific update function, Tweakpane updates the uniform's value directly.
            });

            // Optional: Add TAA blend factor control
            folders.rendering.addInput(sceneModule.taaUniforms.u_taaBlendFactor, 'value', {
                label: 'TAA Blend Factor',
                min: 0.0,
                max: 1.0,
                step: 0.01
            }).on('change', (ev) => {
                // console.log("TAA Blend Factor:", ev.value);
            });
        } else {
            console.warn("TAA uniforms not available for UI binding.");
        }
    }).catch(error => {
        console.error("Error importing scene module for TAA UI:", error);
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

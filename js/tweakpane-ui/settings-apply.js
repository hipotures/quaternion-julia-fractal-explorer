/**
 * Tweakpane UI Settings Apply Module
 * Contains functionality for applying settings to the application
 * 
 * @module tweakpane-ui/settings-apply
 */

import { 
    fractalState, 
    colorSettings,
    colorDynamicsSettings,
    orbitTrapSettings,
    physicsColorSettings,
    crossSectionSettings,
    qualitySettings
} from '../fractal.js';

import { 
    updateFractalParamsUniform,
    updateColorUniforms,
    updateColorDynamicsUniforms,
    updateOrbitTrapUniforms,
    updatePhysicsColorUniforms,
    updateClipModeUniform,
    updateClipDistanceUniform
} from '../shaders.js';

import { cameraState, updateCameraState } from '../camera.js';
import { refreshUI } from './core.js';
import { updateQualityUniforms } from './rendering.js';

/**
 * Applies saved settings to the application
 * @param {Object} settings - The settings object to apply
 */
export function applySettings(settings) {
    if (!settings) return;
    
    try {
        applyFractalParameters(settings.fractalParams);
        applyColorSettings(settings.color);
        applyQualitySettings(settings.quality);
        applyCameraSettings(settings.camera);
        
        // Refresh UI
        refreshUI();
        
        console.log('Settings applied successfully');
    } catch (error) {
        console.error('Error applying settings:', error);
        alert('Failed to apply settings. See console for details.');
    }
}

/**
 * Applies fractal parameters from settings
 * @param {Object} fractalParams - The fractal parameters object
 */
function applyFractalParameters(fractalParams) {
    if (!fractalParams) return;
    
    if (fractalParams.c) {
        fractalState.params.set(
            fractalParams.c.x,
            fractalParams.c.y,
            fractalParams.c.z,
            fractalParams.c.w
        );
        updateFractalParamsUniform(fractalState.params);
    }
    
    if (fractalParams.slice) {
        fractalState.animateSlice = fractalParams.slice.animate;
        fractalState.sliceAmplitude = fractalParams.slice.amplitude;
        // Note: sliceValue will be calculated by animation if enabled
    }
    
    if (fractalParams.crossSection) {
        crossSectionSettings.clipMode = fractalParams.crossSection.mode;
        crossSectionSettings.clipDistance = fractalParams.crossSection.distance;
        updateClipModeUniform(crossSectionSettings.clipMode);
        updateClipDistanceUniform(crossSectionSettings.clipDistance);
    }
}

/**
 * Applies color settings from settings
 * @param {Object} color - The color settings object
 */
function applyColorSettings(color) {
    if (!color) return;
    
    if (color.palette !== undefined) {
        colorSettings.paletteIndex = color.palette;
        colorSettings.colorEnabled = (color.palette !== 0);
        const shaderPaletteIndex = colorSettings.colorEnabled ? colorSettings.paletteIndex - 1 : 0;
        updateColorUniforms({
            colorEnabled: colorSettings.colorEnabled,
            paletteIndex: shaderPaletteIndex
        });
    }
    
    // Apply dynamic color settings
    if (color.dynamics) {
        Object.assign(colorDynamicsSettings, color.dynamics);
        updateColorDynamicsUniforms(colorDynamicsSettings);
    }
    
    // Apply orbit trap settings
    if (color.orbitTrap) {
        Object.assign(orbitTrapSettings, color.orbitTrap);
        updateOrbitTrapUniforms(orbitTrapSettings);
    }
    
    // Apply physics color settings
    if (color.physics) {
        Object.assign(physicsColorSettings, color.physics);
        updatePhysicsColorUniforms(physicsColorSettings);
    }
}

/**
 * Applies quality settings from settings
 * @param {Object} quality - The quality settings object
 */
function applyQualitySettings(quality) {
    if (!quality) return;
    
    Object.assign(qualitySettings, quality);
    updateQualityUniforms(qualitySettings);
}

/**
 * Applies camera settings from settings
 * @param {Object} camera - The camera settings object
 */
function applyCameraSettings(camera) {
    if (!camera) return;
    
    if (camera.focalLength !== undefined) {
        cameraState.focalLength = camera.focalLength;
    }
    if (camera.animationEnabled !== undefined) {
        cameraState.animationEnabled = camera.animationEnabled;
    }
    updateCameraState();
}

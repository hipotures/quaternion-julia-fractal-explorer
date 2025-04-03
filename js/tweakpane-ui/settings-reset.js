/**
 * Tweakpane UI Settings Reset Module
 * Contains functionality for resetting all settings to default values
 * 
 * @module tweakpane-ui/settings-reset
 */

import { 
    fractalState, 
    colorSettings,
    colorDynamicsSettings,
    orbitTrapSettings,
    physicsColorSettings,
    crossSectionSettings,
    resetFractalParams,
    qualitySettings
} from '../fractal.js';

import { 
    updateColorUniforms,
    updateColorDynamicsUniforms,
    updateOrbitTrapUniforms,
    updatePhysicsColorUniforms,
    updateClipModeUniform,
    updateClipDistanceUniform
} from '../shaders.js';

import { cameraState, updateCameraState } from '../camera.js';
import { CONFIG } from '../config.js';
import { refreshUI } from './core.js';
import { updateQualityUniforms } from './rendering.js';

/**
 * Resets all settings to their default values
 */
export function resetAllToDefaults() {
    try {
        if (!confirm("Reset all settings to default values? This will reset fractal parameters, colors, quality settings and camera.")) {
            return;
        }
        
        console.log("Resetting all settings to defaults...");
        
        // Reset different parts of the application
        resetFractalParts();
        resetColorParts();
        resetQualityParts();
        resetCameraParts();
        
        // Update UI to reflect changes
        refreshUI();
        
        console.log("All settings reset to defaults");
    } catch (error) {
        console.error("Error resetting to defaults:", error);
        alert("Failed to reset settings. See console for details.");
    }
}

/**
 * Resets fractal parameters
 */
function resetFractalParts() {
    // Reset fractal parameters (already has a function)
    resetFractalParams();
    
    // Reset cross-section settings
    crossSectionSettings.clipMode = 0;
    crossSectionSettings.clipDistance = CONFIG.FRACTAL.CLIP_DISTANCE;
    updateClipModeUniform(0);
    updateClipDistanceUniform(CONFIG.FRACTAL.CLIP_DISTANCE);
}

/**
 * Resets color settings
 */
function resetColorParts() {
    // Reset color settings
    colorSettings.paletteIndex = 0; // OFF
    colorSettings.colorEnabled = false;
    
    // Reset color dynamics
    colorDynamicsSettings.animationEnabled = false;
    colorDynamicsSettings.saturation = 1.0;
    colorDynamicsSettings.brightness = 1.0;
    colorDynamicsSettings.contrast = 1.0;
    colorDynamicsSettings.phaseShift = 0.0;
    colorDynamicsSettings.animationSpeed = 0.5;
    updateColorDynamicsUniforms(colorDynamicsSettings);
    
    // Reset orbit trap settings
    orbitTrapSettings.enabled = false;
    orbitTrapSettings.type = 0;
    orbitTrapSettings.radius = 1.0;
    orbitTrapSettings.x = 0.0;
    orbitTrapSettings.y = 0.0;
    orbitTrapSettings.intensity = 1.0;
    updateOrbitTrapUniforms(orbitTrapSettings);
    
    // Reset physics color settings
    physicsColorSettings.enabled = false;
    physicsColorSettings.type = 0;
    physicsColorSettings.frequency = 1.0;
    physicsColorSettings.waves = 5.0;
    physicsColorSettings.intensity = 1.0;
    physicsColorSettings.balance = 0.5;
    updatePhysicsColorUniforms(physicsColorSettings);
    
    // Update color uniforms
    updateColorUniforms({
        colorEnabled: false,
        paletteIndex: 0
    });
}

/**
 * Resets quality settings
 */
function resetQualityParts() {
    // Reset quality settings
    qualitySettings.maxIter = CONFIG.FRACTAL.DEFAULT_MAX_ITER;
    qualitySettings.enableShadows = false;
    qualitySettings.enableAO = false;
    qualitySettings.enableSmoothColor = false;
    qualitySettings.enableSpecular = false;
    qualitySettings.enableAdaptiveSteps = false;
    updateQualityUniforms(qualitySettings);
}

/**
 * Resets camera settings
 */
function resetCameraParts() {
    // Reset camera
    cameraState.focalLength = cameraState.defaultFocalLength;
    cameraState.isReturningToStart = true;
    cameraState.moveVelocity = 0;
    cameraState.isMovingForward = false;
    cameraState.animationEnabled = true;
    
    // Set a faster animation duration for reset
    const originalDuration = cameraState.targetDuration;
    cameraState.targetDuration = 0.35; // Faster reset (350ms)
    
    // Return to starting position
    import('../camera.js').then(module => {
        module.startTargetAnimation(cameraState.initialCenter);
        updateCameraState();
        
        // Restore original duration after animation completes
        setTimeout(() => {
            cameraState.targetDuration = originalDuration;
        }, 400); // Slightly longer than animation duration
    });
}

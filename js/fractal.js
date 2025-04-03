/**
 * Fractal state management module. Handles all state related to the quaternion
 * Julia fractal parameters, quality settings, cross sections, and color settings.
 * 
 * @module fractal
 */

import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';
import { 
    uniforms, 
    updateFractalParamsUniform, 
    updateSliceUniform, 
    updateQualityUniforms, 
    updateColorUniforms,
    updateClipModeUniform,
    updateClipDistanceUniform,
    updateAdaptiveStepsUniform
} from './shaders.js';
import { CONFIG } from './config.js';

/**
 * Primary fractal state object containing parameters for the quaternion Julia set
 * @type {Object}
 */
export const fractalState = {
    /** Initial 'c' parameter for the Julia set (Vector4) */
    params: new THREE.Vector4(-0.2, 0.6, 0.2, 0.2), 
    /** Toggle for animating the 4th dimension slice (0 key) */
    animateSlice: true, 
    /** Current value of the 4th dimension slice */
    sliceValue: 0.0, 
    /** Current phase in the sine wave animation (0-2π) */
    slicePhase: 0.0, 
    /** How fast to advance the phase per frame */
    sliceAnimSpeed: CONFIG.FRACTAL.SLICE_ANIM_SPEED, 
    /** Controls the range of slice values (-amplitude to +amplitude) */
    sliceAmplitude: CONFIG.FRACTAL.SLICE_AMPLITUDE
};

/**
 * Quality and visual settings for the fractal rendering
 * @type {Object}
 */
export const qualitySettings = {
    /** Maximum ray marching iterations (1/2 keys) */
    maxIter: CONFIG.FRACTAL.DEFAULT_MAX_ITER, 
    /** Toggle for soft shadows (3 key) */
    enableShadows: false, 
    /** Toggle for Ambient Occlusion (4 key) */
    enableAO: false, 
    /** Toggle for smooth iteration count coloring (5 key) */
    enableSmoothColor: false, 
    /** Toggle for specular highlights (7 key) */
    enableSpecular: false, 
    /** Toggle for adaptive ray marching steps (8 key) */
    enableAdaptiveSteps: false
};

/**
 * Cross-section visualization settings
 * @type {Object}
 */
export const crossSectionSettings = {
    /** 
     * Cross-section mode: 
     * 0: off
     * 1: method 1 (ignore first hit) 
     * 2: method 2 (stop at plane)
     * 3: method 3 (cross-section from back)
     */
    clipMode: 0,
    /** Distance of the clipping plane from camera */
    clipDistance: CONFIG.FRACTAL.CLIP_DISTANCE,
    /** Step size for changing distance */
    clipDistanceStep: CONFIG.FRACTAL.CLIP_DISTANCE_STEP
};

/**
 * Color palette settings
 * @type {Object}
 */
export const colorSettings = {
    /** Master toggle for enabling color palettes */
    colorEnabled: false,
    /** Index of the selected color palette (0 = off, 1-10 = palettes) (6 key) */
    paletteIndex: 0
};

// Expose states globally for debugging and compatibility with legacy code
window.fractalState = fractalState;
window.qualitySettings = qualitySettings;
window.colorSettings = colorSettings;

// --- Fractal Parameter Update Functions ---

/**
 * Resets fractal parameters to random values
 * Sets a new random quaternion parameter c and updates the shader uniform
 */
export function resetFractalParams() {
    fractalState.params.set(
        Math.random() * 0.8 - 0.4,
        Math.random() * 0.8 - 0.4,
        Math.random() * 0.8 - 0.4,
        Math.random() * 0.8 - 0.4
    );
    updateFractalParamsUniform(fractalState.params);
}

/**
 * Toggles the 4D slice animation on/off
 */
export function toggleSliceAnimation() {
    fractalState.animateSlice = !fractalState.animateSlice;
    console.log("Slice animation:", fractalState.animateSlice ? "ON" : "OFF");
}

/**
 * Changes the amplitude of the slice animation
 * @param {number} delta - Amount to increase/decrease amplitude by
 */
export function changeSliceAmplitude(delta) {
    // Limit to max of 1.0 as the fractal disappears beyond -1/1 range
    fractalState.sliceAmplitude = Math.max(0.1, Math.min(fractalState.sliceAmplitude + delta, 1.0));
    console.log("Slice amplitude:", fractalState.sliceAmplitude.toFixed(1));
}

/**
 * Updates the slice value in the animation cycle
 * Called from main animation loop with delta time
 * @param {number} delta - Time delta since last frame
 */
export function updateSlice(delta) {
    // Only update if slice animation is enabled
    if (fractalState.animateSlice) {
        // Advance the phase (in radians) by speed * delta
        fractalState.slicePhase += fractalState.sliceAnimSpeed * delta;
        
        // Keep phase in range [0, 2π] to avoid floating point issues over time
        if (fractalState.slicePhase > Math.PI * 2) {
            fractalState.slicePhase -= Math.PI * 2;
        }
        
        // Calculate slice value based on the current phase and amplitude
        fractalState.sliceValue = Math.sin(fractalState.slicePhase) * fractalState.sliceAmplitude;
        
        // Update the shader uniform
        updateSliceUniform(fractalState.sliceValue);
    }
    // Static otherwise
}

// --- Quality Setting Functions ---

/**
 * Changes the maximum number of iterations for raymarching
 * @param {number} delta - Amount to increase/decrease iterations by
 */
export function changeIterations(delta) {
    qualitySettings.maxIter = Math.max(
        CONFIG.FRACTAL.MIN_ITER, 
        Math.min(qualitySettings.maxIter + delta, CONFIG.FRACTAL.MAX_ITER)
    ); 
    updateQualityUniforms(qualitySettings);
    console.log("Max Iterations:", qualitySettings.maxIter);
}

/**
 * Toggles soft shadows on/off
 */
export function toggleShadows() {
    qualitySettings.enableShadows = !qualitySettings.enableShadows;
    updateQualityUniforms(qualitySettings);
    console.log("Shadows:", qualitySettings.enableShadows ? "ON" : "OFF");
}

/**
 * Toggles Ambient Occlusion on/off
 */
export function toggleAO() {
    qualitySettings.enableAO = !qualitySettings.enableAO;
    updateQualityUniforms(qualitySettings);
    console.log("AO:", qualitySettings.enableAO ? "ON" : "OFF");
}

/**
 * Toggles smooth coloring on/off
 */
export function toggleSmoothColor() {
    qualitySettings.enableSmoothColor = !qualitySettings.enableSmoothColor;
    updateQualityUniforms(qualitySettings);
    console.log("Smooth Color:", qualitySettings.enableSmoothColor ? "ON" : "OFF");
}

/**
 * Toggles specular highlights on/off
 */
export function toggleSpecular() {
    qualitySettings.enableSpecular = !qualitySettings.enableSpecular;
    updateQualityUniforms(qualitySettings);
    console.log("Specular:", qualitySettings.enableSpecular ? "ON" : "OFF");
}

/**
 * Toggles adaptive ray marching steps on/off
 */
export function toggleAdaptiveSteps() {
    qualitySettings.enableAdaptiveSteps = !qualitySettings.enableAdaptiveSteps;
    // Update the adaptive steps uniform directly
    updateAdaptiveStepsUniform(qualitySettings.enableAdaptiveSteps);
    console.log("Adaptive Ray Marching:", qualitySettings.enableAdaptiveSteps ? "ON" : "OFF");
}

// --- Cross Section Functions ---

/**
 * Cycles through cross-section modes: OFF -> Method 1 -> Method 2 -> Method 3 -> OFF
 */
export function cycleClipMode() {
    // Cycle through modes 0-3
    crossSectionSettings.clipMode = (crossSectionSettings.clipMode + 1) % 4;
    
    // Update the uniform directly
    updateClipModeUniform(crossSectionSettings.clipMode);
    
    // Show current mode information
    const modeNames = ["OFF", "METHOD 1", "METHOD 2", "METHOD 3"];
    console.log("Cross Section Mode:", modeNames[crossSectionSettings.clipMode]);
}

/**
 * Forces reset of cross-section mode to OFF
 * Used for debugging and ensuring consistent state
 */
export function forceResetClipMode() {
    crossSectionSettings.clipMode = 0;
    updateClipModeUniform(0);
    console.log("FORCED RESET of cross section mode to OFF");
}

/**
 * Increases the distance of the clipping plane from camera (key: ']')
 */
export function increaseClipDistance() {
    crossSectionSettings.clipDistance += crossSectionSettings.clipDistanceStep;
    updateClipDistanceUniform(crossSectionSettings.clipDistance);
    console.log("Clip Distance:", crossSectionSettings.clipDistance.toFixed(2));
}

/**
 * Decreases the distance of the clipping plane from camera (key: '[')
 */
export function decreaseClipDistance() {
    crossSectionSettings.clipDistance = Math.max(
        0.2, 
        crossSectionSettings.clipDistance - crossSectionSettings.clipDistanceStep
    );
    updateClipDistanceUniform(crossSectionSettings.clipDistance);
    console.log("Clip Distance:", crossSectionSettings.clipDistance.toFixed(2));
}

/**
 * Cycles through color palettes
 * 0 = OFF, 1-10 = different color palettes
 */
export function changePalette() {
    colorSettings.paletteIndex = (colorSettings.paletteIndex + 1) % CONFIG.FRACTAL.MAX_PALETTE_COUNT;
    colorSettings.colorEnabled = (colorSettings.paletteIndex !== 0);
    
    // Pass the correct index to the shader (0-9 for palettes, or irrelevant if disabled)
    const shaderPaletteIndex = colorSettings.colorEnabled ? colorSettings.paletteIndex - 1 : 0;
    updateColorUniforms({
        colorEnabled: colorSettings.colorEnabled,
        paletteIndex: shaderPaletteIndex
    });
    
    console.log("Palette:", colorSettings.paletteIndex === 0 ? "OFF" : colorSettings.paletteIndex);
}

// --- Initialize Shader Uniforms ---

/**
 * Initialize all shader uniforms with default state values
 */
function initializeUniforms() {
    try {
        // Update fractal parameter uniform
        updateFractalParamsUniform(fractalState.params);
        
        // Update quality settings uniforms
        updateQualityUniforms(qualitySettings);
        
        // Update color uniforms
        updateColorUniforms({
            colorEnabled: colorSettings.colorEnabled,
            paletteIndex: 0 // Initial shader index
        });
        
        // Update slice uniform
        updateSliceUniform(fractalState.sliceValue);
        
        // Update cross-section uniforms
        updateClipModeUniform(crossSectionSettings.clipMode);
        updateClipDistanceUniform(crossSectionSettings.clipDistance);
        
        console.log("All shader uniforms initialized successfully");
    } catch (error) {
        console.error("Error initializing shader uniforms:", error);
    }
}

// Initialize uniforms when module loads
initializeUniforms();

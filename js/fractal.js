/**
 * Fractal state management module. Handles all state related to the quaternion
 * Julia fractal parameters, quality settings, cross sections, and color settings.
 * 
 * @module fractal
 */

import * as THREE from './lib/three.module.min.js';
import { 
    uniforms, 
    updateFractalParamsUniform, 
    updateSliceUniform, 
    updateQualityUniforms, 
    updateColorUniforms,
    updateClipModeUniform,
    updateClipDistanceUniform,
    updateAdaptiveStepsUniform,
    updateColorDynamicsUniforms,
    updateOrbitTrapUniforms,
    updatePhysicsColorUniforms
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

/**
 * Dynamic color effect settings for controlling color appearance
 * @type {Object}
 */
export const colorDynamicsSettings = {
    /** Color saturation multiplier (0.0-2.0) */
    saturation: 1.0,
    /** Brightness multiplier (0.0-2.0) */
    brightness: 1.0,
    /** Contrast adjustment (0.0-2.0) */
    contrast: 1.0,
    /** Phase shift for colors in radians (0.0-6.28) */
    phaseShift: 0.0,
    /** Toggle for automatic color animation */
    animationEnabled: false,
    /** Animation speed for color cycling */
    animationSpeed: 0.5
};

/**
 * Orbit trap settings for psychedelic color mapping
 * @type {Object}
 */
export const orbitTrapSettings = {
    /** Toggle for enabling orbit trap coloring */
    enabled: false,
    /** Orbit trap type (0: circle, 1: line, 2: point, 3: cross) */
    type: 0,
    /** Radius/size of the trap */
    radius: 1.0,
    /** X coordinate for point trap */
    x: 0.0,
    /** Y coordinate for point trap */
    y: 0.0,
    /** Z coordinate for point trap */
    z: 0.0,
    /** Intensity of the trap effect (higher = sharper contrast) */
    intensity: 1.0
};

/**
 * Physics-based color effect settings
 * @type {Object}
 */
export const physicsColorSettings = {
    /** Toggle for enabling physics-based coloring */
    enabled: false,
    /** Effect type (0: diffraction, 1: interference, 2: emission spectrum) */
    type: 0,
    /** Frequency of the physical effect pattern */
    frequency: 1.0,
    /** Number of waves/periods in the pattern */
    waves: 5.0,
    /** Intensity of the effect */
    intensity: 1.0,
    /** Balance between physics effect and standard palette (0.0-1.0) */
    balance: 0.5
};

// Expose states globally for debugging and compatibility with legacy code
window.fractalState = fractalState;
window.qualitySettings = qualitySettings;
window.colorSettings = colorSettings;
window.colorDynamicsSettings = colorDynamicsSettings;
window.orbitTrapSettings = orbitTrapSettings;
window.physicsColorSettings = physicsColorSettings;

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

// --- Dynamic Color Control Functions ---

/**
 * Toggles automatic color animation on/off
 */
export function toggleColorAnimation() {
    colorDynamicsSettings.animationEnabled = !colorDynamicsSettings.animationEnabled;
    updateColorDynamicsUniforms(colorDynamicsSettings);
    console.log("Color Animation:", colorDynamicsSettings.animationEnabled ? "ON" : "OFF");
}

/**
 * Changes the color saturation
 * @param {number} delta - Amount to increase/decrease saturation by
 */
export function changeColorSaturation(delta) {
    colorDynamicsSettings.saturation = Math.max(0.0, Math.min(2.0, 
        colorDynamicsSettings.saturation + delta));
    updateColorDynamicsUniforms(colorDynamicsSettings);
    console.log("Color Saturation:", colorDynamicsSettings.saturation.toFixed(2));
}

/**
 * Changes the color brightness
 * @param {number} delta - Amount to increase/decrease brightness by
 */
export function changeColorBrightness(delta) {
    colorDynamicsSettings.brightness = Math.max(0.0, Math.min(2.0, 
        colorDynamicsSettings.brightness + delta));
    updateColorDynamicsUniforms(colorDynamicsSettings);
    console.log("Color Brightness:", colorDynamicsSettings.brightness.toFixed(2));
}

/**
 * Changes the color contrast
 * @param {number} delta - Amount to increase/decrease contrast by
 */
export function changeColorContrast(delta) {
    colorDynamicsSettings.contrast = Math.max(0.0, Math.min(2.0, 
        colorDynamicsSettings.contrast + delta));
    updateColorDynamicsUniforms(colorDynamicsSettings);
    console.log("Color Contrast:", colorDynamicsSettings.contrast.toFixed(2));
}

/**
 * Changes the color phase shift
 * @param {number} delta - Amount to increase/decrease phase shift by (in radians)
 */
export function changeColorPhaseShift(delta) {
    colorDynamicsSettings.phaseShift = (colorDynamicsSettings.phaseShift + delta) % (Math.PI * 2);
    if (colorDynamicsSettings.phaseShift < 0) colorDynamicsSettings.phaseShift += Math.PI * 2;
    
    updateColorDynamicsUniforms(colorDynamicsSettings);
    console.log("Color Phase Shift:", (colorDynamicsSettings.phaseShift / Math.PI).toFixed(2) + "π");
}

/**
 * Changes the color animation speed
 * @param {number} delta - Amount to increase/decrease animation speed by
 */
export function changeColorAnimationSpeed(delta) {
    colorDynamicsSettings.animationSpeed = Math.max(0.05, Math.min(2.0, 
        colorDynamicsSettings.animationSpeed + delta));
    updateColorDynamicsUniforms(colorDynamicsSettings);
    console.log("Color Animation Speed:", colorDynamicsSettings.animationSpeed.toFixed(2));
}

// --- Orbit Trap Functions ---

/**
 * Toggles orbit trap coloring on/off
 */
export function toggleOrbitTrap() {
    orbitTrapSettings.enabled = !orbitTrapSettings.enabled;
    
    // Disable physics-based coloring if orbit trap is enabled (they are exclusive)
    if (orbitTrapSettings.enabled && physicsColorSettings.enabled) {
        physicsColorSettings.enabled = false;
        updatePhysicsColorUniforms(physicsColorSettings);
    }
    
    updateOrbitTrapUniforms(orbitTrapSettings);
    console.log("Orbit Trap:", orbitTrapSettings.enabled ? "ON" : "OFF");
}

/**
 * Cycles through orbit trap types
 * Types: Circle -> Line -> Point -> Cross -> Circle
 */
export function cycleOrbitTrapType() {
    orbitTrapSettings.type = (orbitTrapSettings.type + 1) % 4;
    updateOrbitTrapUniforms(orbitTrapSettings);
    
    const typeNames = ["Circle", "Line", "Point", "Cross"];
    console.log("Orbit Trap Type:", typeNames[orbitTrapSettings.type]);
}

/**
 * Changes the orbit trap radius/size
 * @param {number} delta - Amount to increase/decrease radius by
 */
export function changeOrbitTrapRadius(delta) {
    orbitTrapSettings.radius = Math.max(0.1, orbitTrapSettings.radius + delta);
    updateOrbitTrapUniforms(orbitTrapSettings);
    console.log("Orbit Trap Radius:", orbitTrapSettings.radius.toFixed(2));
}

/**
 * Changes the orbit trap intensity
 * @param {number} delta - Amount to increase/decrease intensity by
 */
export function changeOrbitTrapIntensity(delta) {
    orbitTrapSettings.intensity = Math.max(0.1, Math.min(5.0, orbitTrapSettings.intensity + delta));
    updateOrbitTrapUniforms(orbitTrapSettings);
    console.log("Orbit Trap Intensity:", orbitTrapSettings.intensity.toFixed(2));
}

// --- Physics-Based Color Functions ---

/**
 * Toggles physics-based coloring on/off
 */
export function togglePhysicsColor() {
    physicsColorSettings.enabled = !physicsColorSettings.enabled;
    
    // Disable orbit trap if physics-based coloring is enabled (they are exclusive)
    if (physicsColorSettings.enabled && orbitTrapSettings.enabled) {
        orbitTrapSettings.enabled = false;
        updateOrbitTrapUniforms(orbitTrapSettings);
    }
    
    updatePhysicsColorUniforms(physicsColorSettings);
    console.log("Physics-based Color:", physicsColorSettings.enabled ? "ON" : "OFF");
}

/**
 * Cycles through physics-based color types
 * Types: Diffraction -> Interference -> Emission Spectrum -> Diffraction
 */
export function cyclePhysicsColorType() {
    physicsColorSettings.type = (physicsColorSettings.type + 1) % 3;
    updatePhysicsColorUniforms(physicsColorSettings);
    
    const typeNames = ["Diffraction", "Interference", "Emission Spectrum"];
    console.log("Physics Color Type:", typeNames[physicsColorSettings.type]);
}

/**
 * Changes the physics effect frequency
 * @param {number} delta - Amount to increase/decrease frequency by
 */
export function changePhysicsFrequency(delta) {
    physicsColorSettings.frequency = Math.max(0.1, Math.min(5.0, 
        physicsColorSettings.frequency + delta));
    updatePhysicsColorUniforms(physicsColorSettings);
    console.log("Physics Frequency:", physicsColorSettings.frequency.toFixed(2));
}

/**
 * Changes the number of waves/periods in the physics pattern
 * @param {number} delta - Amount to increase/decrease wave count by
 */
export function changePhysicsWaves(delta) {
    physicsColorSettings.waves = Math.max(1.0, Math.min(20.0, 
        physicsColorSettings.waves + delta));
    updatePhysicsColorUniforms(physicsColorSettings);
    console.log("Physics Waves:", physicsColorSettings.waves.toFixed(1));
}

/**
 * Changes the physics effect intensity
 * @param {number} delta - Amount to increase/decrease intensity by
 */
export function changePhysicsIntensity(delta) {
    physicsColorSettings.intensity = Math.max(0.1, Math.min(2.0, 
        physicsColorSettings.intensity + delta));
    updatePhysicsColorUniforms(physicsColorSettings);
    console.log("Physics Intensity:", physicsColorSettings.intensity.toFixed(2));
}

/**
 * Changes the balance between physics effect and standard palette color
 * @param {number} delta - Amount to increase/decrease balance by
 */
export function changePhysicsBalance(delta) {
    physicsColorSettings.balance = Math.max(0.0, Math.min(1.0, 
        physicsColorSettings.balance + delta));
    updatePhysicsColorUniforms(physicsColorSettings);
    console.log("Physics/Palette Balance:", physicsColorSettings.balance.toFixed(2));
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
        
        // Update color dynamics uniforms
        updateColorDynamicsUniforms(colorDynamicsSettings);
        
        // Update orbit trap uniforms
        updateOrbitTrapUniforms(orbitTrapSettings);
        
        // Update physics-based color uniforms
        updatePhysicsColorUniforms(physicsColorSettings);
        
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

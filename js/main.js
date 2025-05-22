/**
 * Main application entry point for the Quaternion Julia Fractal Explorer.
 * Controls the animation loop, FPS counting, and main application state.
 * 
 * @module main
 */

import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';
import { scene, renderer, handleResize } from './scene.js';
import { camera, setupInitialCamera, updateTargetAnimation, checkReturnToStart, updateCameraMovement } from './camera.js';
import { fractalState, updateSlice, forceResetClipMode } from './fractal.js';
import { initInteractions } from './interactions.js';
import { updateStatsPanel, setPauseVisuals } from './ui.js';
import { updateTimeUniform, uniforms } from './shaders.js';
import { initRecorder } from './recorder.js';
import { updateTourPlayback, isTourPlaying } from './tour.js';
import { initTweakpane, refreshUI } from './tweakpane-ui.js';

/**
 * Global application state variables
 */
// Clock for managing animation timing
const clock = new THREE.Clock();
// ID for the animation frame, used for cancelling when paused
let animationFrameId = null;
// Flag to control animation pausing (Space key)
let renderingPaused = false;
// Flags for stats update forcing (used after recording)
let forceStatsUpdate = false;
let forceStatsUpdateEndTime = 0;

/**
 * FPS counter state variables
 */
let frameCount = 0;
let lastFpsUpdateTime = 0;
// Start with a reasonable default FPS value
let currentFps = 60;
// Update FPS display every second for smoother readings
const FPS_UPDATE_INTERVAL = 1000;

/**
 * Checks if the animation is currently paused
 * @returns {boolean} True if animation is paused, false otherwise
 */
export function isPaused() {
    return renderingPaused;
}

/**
 * Gets the current frames per second value
 * @returns {number} Current FPS value
 */
export function getFps() {
    return currentFps;
}

/**
 * Forces the stats panel to update for a specified period, even when hidden
 * Used primarily after recording to ensure accurate stats are captured
 * 
 * @param {number} seconds - Duration in seconds to force stats updates
 */
export function forceStatsUpdateFor(seconds) {
    forceStatsUpdate = true;
    forceStatsUpdateEndTime = performance.now() + (seconds * 1000);
}

/**
 * Toggles animation pause state
 * Calls either startAnimation or stopAnimation based on current state
 */
export function togglePause() {
    if (renderingPaused) {
        startAnimation();
    } else {
        stopAnimation();
    }
}

/**
 * Starts or resumes the animation loop
 * Restarts the THREE.js clock, updates UI, and triggers the animation frame
 */
function startAnimation() {
    if (!renderingPaused) return; // Already running
    renderingPaused = false;
    clock.start(); // Restart clock to avoid time jump
    setPauseVisuals(false); // Update UI
    animate(); // Restart loop
}

/**
 * Stops the animation loop
 * Cancels the animation frame, stops the clock, and updates UI
 */
function stopAnimation() {
    if (renderingPaused) return; // Already paused
    renderingPaused = true;
    if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
    clock.stop(); // Stop clock
    setPauseVisuals(true); // Update UI
}

/**
 * Main animation loop that drives the entire application
 * Called recursively via requestAnimationFrame while animation is active
 */
function animate() {
    // Stop loop if paused
    if (renderingPaused) return;

    // Request next frame
    animationFrameId = requestAnimationFrame(animate);

    try {
        // Get time delta
        const delta = clock.getDelta();
        const elapsedTime = clock.getElapsedTime(); // Use elapsed time for consistent animation
        
        // FPS calculation
        frameCount++;
        if (elapsedTime - lastFpsUpdateTime >= FPS_UPDATE_INTERVAL / 1000) {
            // Calculate FPS based on frame count and elapsed time since last update
            currentFps = Math.round((frameCount / (elapsedTime - lastFpsUpdateTime)) * 10) / 10;
            
            // Reset counters
            frameCount = 0;
            lastFpsUpdateTime = elapsedTime;
        }
        
        // Update uniforms
        updateTimeUniform(elapsedTime);
        
        // Update application state
        updateSlice(delta);           // Pass delta time to slice animation
        updateTargetAnimation(delta);   // Update smooth camera transitions
        updateCameraMovement(delta);    // Update forward/backward movement
        checkReturnToStart();           // Check if camera needs to return
        
        // Update tour playback if active
        if (isTourPlaying()) {
            updateTourPlayback(delta);  // Update tour animation
        }

        // Update UI
        // Check if we need to update stats even when hidden
        if (forceStatsUpdate) {
            // Check if we should stop forcing updates
            if (performance.now() > forceStatsUpdateEndTime) {
                forceStatsUpdate = false;
            } else {
                // Force call the stats update function directly
                updateStatsPanel(true); // Pass true to indicate forced update
            }
        } else {
            // Regular update
            updateStatsPanel();
        }
        
        // Update Tweakpane UI to keep it in sync with application state
        refreshUI();

        // Render scene
        renderer.render(scene, camera);
    } catch (error) {
        console.error("Error in animation loop:", error);
        // Continue animation despite error to prevent freezing
        // But log the error for debugging
    }
}

/**
 * Validates that the cross-section clip mode settings are properly synchronized
 * between state objects and shader uniforms. Sets mode to OFF if inconsistency detected.
 */
async function validateClipSettings() {
    try {
        const clipMode = uniforms.u_clipMode.value;
        const clipDistance = uniforms.u_clipDistance.value;
        const stateModeMatch = fractalState?.crossSectionSettings?.clipMode === clipMode;
        
        if (!stateModeMatch) {
            console.warn("Cross-section mode mismatch detected, resetting to OFF mode");
            
            forceResetClipMode();
        }
    } catch (error) {
        console.error("Error validating clip settings:", error);
    }
}

/**
 * Initializes the application
 * Sets up camera, event listeners, and starts the animation loop
 */
async function init() {
    try {
        console.log("Initializing Application...");
        setupInitialCamera();       // Set initial camera position and orientation
        initInteractions();         // Add event listeners for keyboard/mouse
        initRecorder();             // Initialize video recording functionality
        window.addEventListener('resize', handleResize); // Add resize listener

        // Initialize Tweakpane UI
        initTweakpane();
        
        // Validate clip settings after potential microtasks or UI updates from Tweakpane
        // initialization, but before the next render. This is more reliable than a fixed timeout.
        requestAnimationFrame(validateClipSettings);

        console.log("Starting Animation Loop...");
        animate();                  // Start the main loop
    } catch (error) {
        console.error("Error during initialization:", error);
        alert("An error occurred during initialization. Please check the console for details.");
    }
}

// Start the application
init().catch(error => {
    console.error("Fatal error during initialization:", error);
});

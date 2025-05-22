/**
 * Main application entry point for the Quaternion Julia Fractal Explorer.
 * Controls the animation loop, FPS counting, and main application state.
 * 
 * @module main
 */

import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';
import { scene, renderer, handleResize } from './scene.js';
import { camera, setupInitialCamera, updateTargetAnimation, checkReturnToStart, updateCameraMovement } from './camera.js';
import { fractalState, updateSlice } from './fractal.js';
import { initInteractions } from './interactions.js';
import { updateStatsPanel, setPauseVisuals } from './ui.js';
import { updateTimeUniform } from './shaders.js';
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
    console.log(`Forcing stats updates for ${seconds} seconds`);
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
    console.log("Animation Resumed");
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
    console.log("Animation Paused");
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

        // Update ambient audio parameters
        // Dynamically import and call to avoid issues if module not fully loaded yet or if audio is disabled
        import('./ambientAudio.js').then(audioModule => {
            if (audioModule.getAudioSettings && audioModule.getAudioSettings().enabled) {
                audioModule.updateAudioParams();
            }
        }).catch(e => console.error("Error updating audio params:", e));

        // Update UI
        // Check if we need to update stats even when hidden
        if (forceStatsUpdate) {
            // Check if we should stop forcing updates
            if (performance.now() > forceStatsUpdateEndTime) {
                forceStatsUpdate = false;
                console.log("Stopped forcing stats updates");
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

        // --- TAA Rendering Steps ---
        const { mainRenderTarget, historyRenderTarget, taaScene, taaUniforms, prevViewProjectionMatrix, fractalMaterial } = await import('./scene.js');
        const { uniforms: fractalUniforms } = await import('./shaders.js');

        // 0. Update TAA-specific uniforms
        const { applyProjectionMatrixJitter, restoreOriginalProjectionMatrix } = await import('./camera.js');
        
        taaUniforms.u_cameraProjectionMatrixInverse.value.copy(camera.projectionMatrixInverse);
        taaUniforms.u_cameraViewMatrixInverse.value.copy(camera.matrixWorld); 
        taaUniforms.u_prevViewProjectionMatrix.value.copy(prevViewProjectionMatrix);

        // Store UNjittered view-projection matrix for next frame's reprojection
        // This should happen BEFORE jittering is applied for the current frame's render.
        // Note: camera.projectionMatrix is updated by applyProjectionMatrixJitter, so calculate this first.
        const unjitteredProjectionMatrix = camera.projectionMatrix.clone(); // Assuming it's not jittered yet or restored
        // If restoreOriginalProjectionMatrix was called last frame, camera.projectionMatrix is clean.
        
        // Calculate prevViewProjectionMatrix based on the clean state from the END of the previous frame.
        // So, this calculation should actually be at the end of the TAA steps.
        // For now, prevViewProjectionMatrix is updated at the end.

        if (taaUniforms.u_enableTAA.value) {
            const haltonX = getHalton(frameCount + 1, 2); // frameCount starts at 0, Halton needs index >= 1
            const haltonY = getHalton(frameCount + 1, 3);
            // Scale jitter to be in range of roughly [-0.5, 0.5] pixels / screen dimension
            const jitterX = (haltonX * 2.0 - 1.0) / window.innerWidth;
            const jitterY = (haltonY * 2.0 - 1.0) / window.innerHeight;
            
            applyProjectionMatrixJitter(jitterX, jitterY);
            // The u_jitterOffset in fractal shader is kept for flexibility, but primary jitter is via matrix.
            // fractalUniforms.u_jitterOffset.value.set(jitterX * window.innerWidth, jitterY * window.innerHeight);
            fractalUniforms.u_jitterOffset.value.set(0.0, 0.0); // Using matrix jitter primarily
        } else {
            restoreOriginalProjectionMatrix(); // Ensure original matrix is used if TAA is off
            fractalUniforms.u_jitterOffset.value.set(0.0, 0.0);
        }

        // Update camera matrices after potential jittering
        camera.updateMatrixWorld(); // Update camera world matrix
        camera.updateProjectionMatrix(); // Recalculate projection matrix if needed (e.g. aspect change, or if jitter modified it)
                                       // This also updates projectionMatrixInverse

        // 1. Render fractal scene to mainRenderTarget
        renderer.setRenderTarget(mainRenderTarget);
        renderer.clear();
        renderer.render(scene, camera); // Renders with jittered projection matrix if TAA enabled

        // Restore original projection matrix immediately after rendering the main scene
        // so that UI elements or other passes are not affected by jitter.
        if (taaUniforms.u_enableTAA.value) {
            restoreOriginalProjectionMatrix();
            camera.updateProjectionMatrix(); // Ensure inverse is also updated back
        }

        // 2. Render TAA resolve pass to screen (or another buffer if more post-processing)
        taaUniforms.u_currentFrameTexture.value = mainRenderTarget.texture;
        // Update other TAA uniforms that might change per frame (e.g. blend factor, though it's static now)
        taaUniforms.u_cameraProjectionMatrixInverse.value.copy(camera.projectionMatrixInverse); // Use non-jittered for reprojection
        taaUniforms.u_cameraViewMatrixInverse.value.copy(camera.matrixWorld);
        
        renderer.setRenderTarget(null); // Render to screen
        renderer.clear();
        renderer.render(taaScene, camera); 

        // 3. Copy mainRenderTarget.texture to historyRenderTarget.texture for next frame
        // Using the utility copy scene/material from scene.js
        const { copyScene, copyMaterial, historyRenderTarget: destHistoryRT, mainRenderTarget: srcMainRT } = await import('./scene.js');
        copyMaterial.uniforms.u_sourceTexture.value = srcMainRT.texture;
        renderer.setRenderTarget(destHistoryRT);
        renderer.clear();
        renderer.render(copyScene, camera); // Render the quad with mainRT texture to historyRT
        
        // Update prevViewProjectionMatrix for the next frame using the UNjittered camera state
        // Ensure camera.projectionMatrix is the UNjittered one here
        prevViewProjectionMatrix.multiplyMatrices(unjitteredProjectionMatrix, camera.matrixWorldInverse);


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
        const clipMode = window.uniforms?.u_clipMode?.value;
        const clipDistance = window.uniforms?.u_clipDistance?.value;
        const stateModeMatch = window.fractalState?.crossSectionSettings?.clipMode === clipMode;
        
        if (!stateModeMatch) {
            console.warn("Cross-section mode mismatch detected, resetting to OFF mode");
            
            // Use static import to avoid dynamic import issues
            const fractalModule = await import('./fractal.js');
            fractalModule.forceResetClipMode();
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
        
        // Validate clip settings after a short delay to ensure uniforms are loaded
        setTimeout(validateClipSettings, 500);

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

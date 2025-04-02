import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';
import { scene, renderer, handleResize } from './scene.js';
import { camera, setupInitialCamera, updateTargetAnimation, checkReturnToStart, updateCameraMovement } from './camera.js';
import { fractalState, updateSlice } from './fractal.js'; // Import fractalState
import { initInteractions } from './interactions.js';
import { updateStatsPanel, setPauseVisuals } from './ui.js';
import { updateTimeUniform } from './shaders.js'; // Import time uniform update
import { initRecorder } from './recorder.js'; // Import recorder initialization
import { updateTourPlayback, isTourPlaying } from './tour.js'; // Import tour functions

// --- Global State ---
let clock = new THREE.Clock(); // THREE.js clock for managing time delta
let animationFrameId = null; // ID returned by requestAnimationFrame, used for cancelling
let renderingPaused = false; // Flag to control the animation loop pause state (Space key)
let forceStatsUpdate = false; // Flag to force stats updates after recording
let forceStatsUpdateEndTime = 0; // Time when to stop force updating

// --- FPS Counter ---
let frameCount = 0;
let lastFpsUpdateTime = 0;
let currentFps = 60; // Start with a reasonable default value
const fpsUpdateInterval = 1000; // Update FPS display every 1000ms (1 second) for smoother readings

// --- Pause/Resume Logic ---
export function isPaused() {
    return renderingPaused;
}

// --- FPS Export ---
export function getFps() {
    return currentFps;
}

// --- Force Stats Update for a period ---
export function forceStatsUpdateFor(seconds) {
    forceStatsUpdate = true;
    forceStatsUpdateEndTime = performance.now() + (seconds * 1000);
    console.log(`Forcing stats updates for ${seconds} seconds`);
}

export function togglePause() {
    if (renderingPaused) {
        startAnimation();
    } else {
        stopAnimation();
    }
}

function startAnimation() {
    if (!renderingPaused) return; // Already running
    renderingPaused = false;
    clock.start(); // Restart clock to avoid time jump
    setPauseVisuals(false); // Update UI
    console.log("Animation Resumed");
    animate(); // Restart loop
}

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

// --- Animation Loop ---
function animate() {
    // Stop loop if paused
    if (renderingPaused) return;

    // Request next frame
    animationFrameId = requestAnimationFrame(animate);

    // Get time delta
    const delta = clock.getDelta();
    const elapsedTime = clock.getElapsedTime(); // Use elapsed time for consistent animation
    
    // FPS calculation
    frameCount++;
    if (elapsedTime - lastFpsUpdateTime >= fpsUpdateInterval / 1000) {
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
            console.log("Stopped forcing stats updates");
        } else {
            // Force call the stats update function directly
            if (window.updateStatsPanel) {
                window.updateStatsPanel(true); // Pass true to indicate forced update
            }
        }
    } else {
        // Regular update
        updateStatsPanel();
    }

    // Render scene
    renderer.render(scene, camera);
}

// --- Debug and Test Functions ---
function debugClipSettings() {
    // For debugging and forcing cross-section mode state
    console.log("===== DEBUG: CLIP SETTINGS =====");
    console.log("Uniform u_clipMode:", window.uniforms.u_clipMode.value);
    console.log("Uniform u_clipDistance:", window.uniforms.u_clipDistance.value);
    console.log("crossSectionSettings.clipMode:", window.fractalState ? window.fractalState.crossSectionSettings?.clipMode : "undefined");
    
    // Force OFF mode (0) - in case there was an error
    import('./fractal.js').then(module => {
        if (module.forceResetClipMode) {
            module.forceResetClipMode();
        }
    });
    
    console.log("===== END DEBUG INFO =====");
}

// --- Initialization ---
function init() {
    console.log("Initializing Application...");
    setupInitialCamera();       // Set initial camera position and orientation
    initInteractions();         // Add event listeners for keyboard/mouse
    initRecorder();             // Initialize video recording functionality
    window.addEventListener('resize', handleResize); // Add resize listener

    // Debugging - added to solve the disappearing fractal problem
    setTimeout(debugClipSettings, 500);  // Make sure the uniforms are loaded

    console.log("Starting Animation Loop...");
    animate();                  // Start the main loop
}

// --- Start Application ---
init();

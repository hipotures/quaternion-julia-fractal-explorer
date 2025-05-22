import { renderer } from './scene.js';
import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';
import { uniforms, getRotationMatrix, updateFractalParamsUniform } from './shaders.js'; // Import uniforms for raycasting estimate
import { CONFIG } from './config.js'; // Import configuration values
import { handleScreenshotKeys } from './screenshot.js'; // Import screenshot functionality
import {
    camera, cameraState, updateOrbitCamera, updateCameraRotation,
    startTargetAnimation, syncPitchYawFromCamera, setupInitialCamera, updateCameraState
} from './camera.js';
import {
    fractalState, qualitySettings, colorSettings, resetFractalParams,
    toggleSliceAnimation, changeIterations, toggleShadows, toggleAO,
    toggleSmoothColor, toggleSpecular, changePalette, changeSliceAmplitude,
    toggleAdaptiveSteps, crossSectionSettings, cycleClipMode,
    increaseClipDistance, decreaseClipDistance,
    // Dynamic color functions
    toggleColorAnimation, changeColorSaturation, changeColorBrightness,
    changeColorContrast, changeColorPhaseShift, changeColorAnimationSpeed,
    // Orbit trap functions
    toggleOrbitTrap, cycleOrbitTrapType, changeOrbitTrapRadius, changeOrbitTrapIntensity,
    // Physics-based color functions
    togglePhysicsColor, cyclePhysicsColorType, changePhysicsFrequency,
    changePhysicsWaves, changePhysicsIntensity, changePhysicsBalance
} from './fractal.js';
// Placeholder imports - these functions will be defined in their respective modules later
import { toggleStats, toggleMenu, toggleTourMenu } from './ui.js';
import { togglePause, isPaused } from './main.js'; // Need isPaused to prevent input during pause
import { toggleRecording, isCurrentlyRecording, cycleQuality } from './recorder.js'; // Import recording functions
import { isTourPlaying, stopTourPlayback } from './tour.js'; // Import tour functions
import { toggleTweakpaneVisibility } from './tweakpane-ui.js'; // Import Tweakpane UI toggle

// --- Interaction State ---
let isCtrlPressed = false;
let isMouseWheelPressed = false; // Track if the mouse wheel is being held down

// --- Helper: Quaternion Multiplication for JavaScript ---
function js_qmul(q1, q2) {
    return new THREE.Vector4(
        q1.x * q2.x - q1.y * q2.y - q1.z * q2.z - q1.w * q2.w,
        q1.x * q2.y + q1.y * q2.x + q1.z * q2.w - q1.w * q2.z,
        q1.x * q2.z + q1.z * q2.x + q1.w * q2.y - q1.y * q2.w,
        q1.x * q2.w + q1.w * q2.x + q1.y * q2.z - q1.z * q2.y
    );
}

// --- Helper: Accurate Distance Estimator for Click Raycasting ---
function accurateQuaternionJuliaDE(posVec3, sliceValue, cVec4, maxIterations) {
    let z = new THREE.Vector4(posVec3.x, posVec3.y, posVec3.z, sliceValue);
    const c = cVec4; // c is already a THREE.Vector4

    let dr = 1.0;
    let r = 0.0;
    const escapeRadius = CONFIG.RAYMARCHING.ESCAPE_RADIUS;
    // Use MIN_STEP_SIZE from CONFIG.RAYMARCHING, default to 1e-6 if not found for safety
    const minValForLog = (CONFIG.RAYMARCHING && CONFIG.RAYMARCHING.MIN_STEP_SIZE) ? CONFIG.RAYMARCHING.MIN_STEP_SIZE : 1e-6;

    for (let i = 0; i < maxIterations; i++) {
        r = z.length();
        if (r > escapeRadius) {
            break;
        }
        
        // Update dr: derivative is 2*|z|, so dr_new = dr_old * 2 * |z|
        // Safeguard dr against becoming zero if r is zero.
        if (r < minValForLog) { // If r is effectively zero
            // If r=0, z=0. Then z*z=0. z_new = c.
            // dr update 2*r*dr would be 0.
            // To prevent dr from becoming zero and staying zero:
            // if dr is already 1.0 (first iteration) and r is effectively 0, dr remains 1.0.
            // This means the first step's derivative magnitude is considered 1.
            if (i === 0 && Math.abs(dr - 1.0) < minValForLog) {
                // dr stays 1.0 if r is tiny on first step
            } else {
                // On subsequent steps if r is small, dr could diminish rapidly.
                // Let's keep it from becoming smaller than minValForLog in magnitude.
                let updated_dr = 2.0 * r * dr;
                if(Math.abs(updated_dr) < minValForLog) {
                    dr = (dr > 0 ? minValForLog : -minValForLog);
                } else {
                    dr = updated_dr;
                }
            }
        } else {
            dr = 2.0 * r * dr;
        }

        z = js_qmul(z, z);
        z.add(c);
    }

    if (r > escapeRadius) {
        if (Math.abs(dr) < minValForLog) {
            dr = (dr >= 0 ? minValForLog : -minValForLog); // Ensure dr is not too small, preserving sign
        }
        return Math.abs(0.5 * Math.log(Math.max(r, minValForLog)) * r / dr);
    }
    
    return 0.0; // Inside the set
}

// --- Event Handlers ---

// --- Key handlers for different functional groups ---

// Handle UI-related keys (stats, menu, tour, tweakpane)
function handleUIKeys(key) {
    switch (key.toLowerCase()) {
        case CONFIG.KEYS.TOGGLE_STATS:
            toggleStats();
            break;
        case CONFIG.KEYS.TOGGLE_MENU:
            toggleMenu();
            break;
        case CONFIG.KEYS.TOGGLE_TOUR:
            toggleTourMenu();
            break;
        case CONFIG.KEYS.TOGGLE_TWEAKPANE:
            toggleTweakpaneVisibility();
            break;
    }
}

// Handle camera navigation keys (arrows, zoom)
function handleNavigationKeys(key, isCtrlModifier) {
    switch (key.toLowerCase()) {
        // Camera Rotation
        case CONFIG.KEYS.ARROW_LEFT:
            cameraState.yaw += isCtrlModifier ? 0.25 : 0.05;
            updateCameraRotation();
            break;
        case CONFIG.KEYS.ARROW_RIGHT:
            cameraState.yaw -= isCtrlModifier ? 0.25 : 0.05;
            updateCameraRotation();
            break;
        case CONFIG.KEYS.ARROW_UP:
            cameraState.pitch += isCtrlModifier ? 0.25 : 0.05;
            // Clamping is handled within updateCameraRotation
            updateCameraRotation();
            break;
        case CONFIG.KEYS.ARROW_DOWN:
            cameraState.pitch -= isCtrlModifier ? 0.25 : 0.05;
            // Clamping is handled within updateCameraRotation
            updateCameraRotation();
            break;
            
        // Camera Zoom (Focal Length)
        case CONFIG.KEYS.PLUS:
        case CONFIG.KEYS.EQUALS: // Handle '=' key often paired with '+'
            cameraState.focalLength = Math.min(24.0, cameraState.focalLength + 0.1);
            updateCameraState(); // Update uniforms
            break;
        case CONFIG.KEYS.MINUS:
            cameraState.focalLength = Math.max(0.1, cameraState.focalLength - 0.1);
            updateCameraState(); // Update uniforms
            break;
    }
}

// Handle quality/rendering settings keys
function handleQualityKeys(key) {
    switch (key.toLowerCase()) {
        case CONFIG.KEYS.INCREASE_ITERATIONS:
            changeIterations(20);
            break;
        case CONFIG.KEYS.DECREASE_ITERATIONS:
            changeIterations(-20);
            break;
        case CONFIG.KEYS.TOGGLE_SHADOWS:
            toggleShadows();
            break;
        case CONFIG.KEYS.TOGGLE_AO:
            toggleAO();
            break;
        case CONFIG.KEYS.TOGGLE_SMOOTH_COLOR:
            toggleSmoothColor();
            break;
        case CONFIG.KEYS.CHANGE_PALETTE:
            changePalette();
            break;
        case CONFIG.KEYS.TOGGLE_SPECULAR:
            toggleSpecular();
            break;
        case CONFIG.KEYS.TOGGLE_ADAPTIVE_STEPS:
            toggleAdaptiveSteps();
            break;
    }
}

// Handle advanced color effects
function handleColorEffectKeys(e) {
    const key = e.key.toLowerCase();
    const shift = e.shiftKey;
    
    // We'll use number keys with Shift for dynamic color controls
    if (shift) {
        switch (key) {
            // Dynamic color effects (Shift + letter keys)
            case 'c':
                toggleColorAnimation();
                break;
            case 's':
                changeColorSaturation(e.ctrlKey ? -0.1 : 0.1);
                break;
            case 'b':
                changeColorBrightness(e.ctrlKey ? -0.1 : 0.1);
                break;
            case 'n':
                changeColorContrast(e.ctrlKey ? -0.1 : 0.1);
                break;
            case 'p':
                changeColorPhaseShift(e.ctrlKey ? -0.1 : 0.1);
                break;
            case 'a':
                changeColorAnimationSpeed(e.ctrlKey ? -0.05 : 0.05);
                break;
                
            // Orbit trap controls (Alt + letter keys)
            case 'o':
                toggleOrbitTrap();
                break;
            case 't':
                cycleOrbitTrapType();
                break;
            case 'r':
                changeOrbitTrapRadius(e.ctrlKey ? -0.1 : 0.1);
                break;
            case 'i':
                changeOrbitTrapIntensity(e.ctrlKey ? -0.1 : 0.1);
                break;
                
            // Physics-based coloring (Shift + number keys)
            case 'f':
                togglePhysicsColor();
                break;
            case 'y':
                cyclePhysicsColorType();
                break;
            case 'q':
                changePhysicsFrequency(e.ctrlKey ? -0.1 : 0.1);
                break;
            case 'w':
                changePhysicsWaves(e.ctrlKey ? -0.5 : 0.5);
                break;
            case 'e':
                changePhysicsIntensity(e.ctrlKey ? -0.1 : 0.1);
                break;
            case 'd':
                changePhysicsBalance(e.ctrlKey ? -0.05 : 0.05);
                break;
        }
    }
}

// Handle cross-section related keys
function handleCrossSectionKeys(key) {
    switch (key.toLowerCase()) {
        case CONFIG.KEYS.CYCLE_CLIP_MODE:
            cycleClipMode();
            break;
        case CONFIG.KEYS.DECREASE_CLIP_DISTANCE:
            if (crossSectionSettings.clipMode > 0) {
                decreaseClipDistance();
            } else {
                console.log("Cross-Section is OFF - enable it with '9' key first");
            }
            break;
        case CONFIG.KEYS.INCREASE_CLIP_DISTANCE:
            if (crossSectionSettings.clipMode > 0) {
                increaseClipDistance();
            } else {
                console.log("Cross-Section is OFF - enable it with '9' key first");
            }
            break;
    }
}

// Handle slice-related keys
function handleSliceKeys(key) {
    switch (key.toLowerCase()) {
        case CONFIG.KEYS.TOGGLE_SLICE_ANIMATION:
            toggleSliceAnimation();
            break;
        case '<':
        case CONFIG.KEYS.DECREASE_SLICE_AMPLITUDE: 
            changeSliceAmplitude(-0.1);
            break;
        case '>':
        case CONFIG.KEYS.INCREASE_SLICE_AMPLITUDE:
            changeSliceAmplitude(0.1);
            break;
    }
}

// Handle system control keys (reset, animation toggles, recording)
function handleSystemKeys(key) {
    switch (key.toLowerCase()) {
        // Reset
        case CONFIG.KEYS.RESET:
            resetFractalParams();
            cameraState.focalLength = cameraState.defaultFocalLength;
            cameraState.isReturningToStart = true;
            startTargetAnimation(cameraState.initialCenter);
            cameraState.moveVelocity = 0;
            cameraState.isMovingForward = false;
            break;
            
        // Animation toggles
        case CONFIG.KEYS.TOGGLE_ANIMATION:
            cameraState.animationEnabled = !cameraState.animationEnabled;
            break;
        // Removed deceleration toggle (D key) - now controlled only by middle mouse button
            
        // Pause / movement
        case CONFIG.KEYS.SPACE:
            cameraState.moveVelocity = 0;
            cameraState.isMovingForward = false;
            togglePause();
            break;
            
        // Recording controls
        case CONFIG.KEYS.TOGGLE_RECORDING:
            toggleRecording();
            break;
        case CONFIG.KEYS.CYCLE_QUALITY:
            cycleQuality();
            break;
    }
}

function handleKeyDown(e) {
    // Check for escape key to stop tour playback (this takes precedence over all other keys)
    if (e.key === CONFIG.KEYS.ESCAPE) {
        if (isTourPlaying()) {
            stopTourPlayback();
            return;
        }
    }
    
    // Ignore inputs if tour is playing (only Escape works during tour)
    if (isTourPlaying()) return;
    
    // Ignore inputs if paused, except for the pause key itself
    if (isPaused() && e.key !== CONFIG.KEYS.SPACE) return;

    if (e.key === CONFIG.KEYS.CONTROL) {
        isCtrlPressed = true;
        return; // Don't process Control key further
    }

    // Handle advanced color effects (Shift + key combinations)
    if (e.shiftKey) {
        handleColorEffectKeys(e);
        return;
    }

    // Delegate to the appropriate handler based on key group
    const key = e.key.toLowerCase();
    
    // Screenshot key
    if (key === CONFIG.SCREENSHOT.KEYS.TAKE_SCREENSHOT) {
        handleScreenshotKeys(e.key);
        return;
    }
    
    // UI controls
    if ([CONFIG.KEYS.TOGGLE_STATS, CONFIG.KEYS.TOGGLE_MENU, CONFIG.KEYS.TOGGLE_TOUR, CONFIG.KEYS.TOGGLE_TWEAKPANE].includes(key)) {
        handleUIKeys(key);
    }
    // Navigation controls
    else if ([CONFIG.KEYS.ARROW_LEFT, CONFIG.KEYS.ARROW_RIGHT, CONFIG.KEYS.ARROW_UP, CONFIG.KEYS.ARROW_DOWN, 
              CONFIG.KEYS.PLUS, CONFIG.KEYS.EQUALS, CONFIG.KEYS.MINUS].includes(key)) {
        handleNavigationKeys(key, isCtrlPressed);
    }
    // Quality controls
    else if ([CONFIG.KEYS.INCREASE_ITERATIONS, CONFIG.KEYS.DECREASE_ITERATIONS, CONFIG.KEYS.TOGGLE_SHADOWS,
              CONFIG.KEYS.TOGGLE_AO, CONFIG.KEYS.TOGGLE_SMOOTH_COLOR, CONFIG.KEYS.CHANGE_PALETTE,
              CONFIG.KEYS.TOGGLE_SPECULAR, CONFIG.KEYS.TOGGLE_ADAPTIVE_STEPS].includes(key)) {
        handleQualityKeys(key);
    }
    // Cross-section controls
    else if ([CONFIG.KEYS.CYCLE_CLIP_MODE, CONFIG.KEYS.DECREASE_CLIP_DISTANCE, CONFIG.KEYS.INCREASE_CLIP_DISTANCE].includes(key)) {
        handleCrossSectionKeys(key);
    }
    // Slice controls
    else if ([CONFIG.KEYS.TOGGLE_SLICE_ANIMATION, '<', '>', CONFIG.KEYS.DECREASE_SLICE_AMPLITUDE, 
              CONFIG.KEYS.INCREASE_SLICE_AMPLITUDE].includes(key)) {
        handleSliceKeys(key);
    }
    // System controls
    else if ([CONFIG.KEYS.RESET, CONFIG.KEYS.TOGGLE_ANIMATION, CONFIG.KEYS.SPACE,
              CONFIG.KEYS.TOGGLE_RECORDING, CONFIG.KEYS.CYCLE_QUALITY].includes(key)) {
        handleSystemKeys(key);
    }
    // Quick access to color effects
    else if (key === 'o') {
        toggleOrbitTrap();
    }
    else if (key === 'f') {
        togglePhysicsColor();
    }
    else if (key === 'c') {
        toggleColorAnimation();
    }
}

function handleKeyUp(e) {
    if (e.key === CONFIG.KEYS.CONTROL) {
        isCtrlPressed = false;
    }
}

function handleMouseClick(event) {
    if (isPaused()) return; // Ignore clicks when paused

    // Prevent click handling if it originated from UI elements
    if (event.target !== renderer.domElement) {
        return;
    }

    // Normalized Device Coordinates
    const x = (event.clientX / window.innerWidth) * 2 - 1;
    const y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Calculate ray direction from camera
    // Use current camera state rotation
    const rotationMatrix = getRotationMatrix(cameraState.rotation);
    const dir = new THREE.Vector3(x, y, -cameraState.focalLength) // Use current focal length
        .applyMatrix3(rotationMatrix)
        .normalize();

    // If already moving via scroll, just change the look direction smoothly
    if (Math.abs(cameraState.moveVelocity) > CONFIG.CAMERA.MIN_VELOCITY_THRESHOLD) {
        const lookDir = dir.clone();
        // Calculate a new target center point in the direction of the click
        const newCenter = new THREE.Vector3().copy(cameraState.position).addScaledVector(lookDir, cameraState.radius);
        startTargetAnimation(newCenter);
    }
    // If stationary, smoothly move the view towards the clicked point
    else {
        const ro = cameraState.position.clone();
        const rd = dir.clone();
        let hitPoint = null;
        let dist = 0.0;
        const steps = CONFIG.RAYMARCHING.STEP_COUNT; // Ray march steps

        const currentSlice = fractalState.sliceValue;
        const currentC = uniforms.u_c.value;
        const clickMaxIterations = 60; 

        for (let i = 0; i < steps; i++) {
            const pos = ro.clone().addScaledVector(rd, dist);
            const d = accurateQuaternionJuliaDE(pos, currentSlice, currentC, clickMaxIterations);

            if (d < CONFIG.RAYMARCHING.HIT_THRESHOLD) { // Threshold for hit
                hitPoint = pos;
                break;
            }
            dist += Math.max(CONFIG.RAYMARCHING.HIT_THRESHOLD, d * CONFIG.RAYMARCHING.STEP_MULTIPLIER); // Step forward (slightly less than DE for safety)
            if (dist > CONFIG.RAYMARCHING.MAX_DISTANCE) break; // Max distance
        }

        // If no hit, target a point along the ray at a reasonable distance
        if (!hitPoint) {
            hitPoint = ro.clone().addScaledVector(rd, Math.min(2.0 * cameraState.radius, 5.0));
        }

        startTargetAnimation(hitPoint); // Start smooth transition
    }
}

function handleMouseWheel(e) {
    if (isPaused()) return;

    if (e.deltaY !== 0) {
        // Calculate change in velocity based on scroll direction and sensitivity
        const deltaVelocity = -e.deltaY * cameraState.velocitySensitivity; // Invert deltaY

        // Smoothly adjust velocity, clamping it
        cameraState.moveVelocity += deltaVelocity;
        cameraState.moveVelocity = Math.max(-cameraState.maxVelocity, Math.min(cameraState.maxVelocity, cameraState.moveVelocity));

        // Determine movement state
        cameraState.isMovingForward = Math.abs(cameraState.moveVelocity) > CONFIG.CAMERA.MIN_VELOCITY_THRESHOLD;

        // Prevent instant direction change if already moving slowly in opposite direction
        // (This logic was slightly different in original, re-evaluating)
        // Let's stick to simple velocity adjustment for now.
    }
}

// Handle middle mouse button press
function handleMouseDown(e) {
    if (e.button === 1) { // Middle mouse button (wheel click)
        isMouseWheelPressed = true;
        
        // Prevent the default behavior (usually scrolling or potential paste)
        e.preventDefault();
        return false;
    }
}

// Handle middle mouse button release
function handleMouseUp(e) {
    if (e.button === 1) { // Middle mouse button (wheel click)
        isMouseWheelPressed = false;
        
        // Prevent the default behavior
        e.preventDefault();
        return false;
    }
}

// --- Initialization ---
export function initInteractions() {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    renderer.domElement.addEventListener('click', handleMouseClick);
    document.addEventListener('wheel', handleMouseWheel); // Attach to document for wider capture
    
    // Add mouse button events for middle mouse button control
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mouseup', handleMouseUp);
    
    console.log("Interaction listeners initialized.");
}

// Export the state for camera.js to use
export function isWheelButtonPressed() {
    return isMouseWheelPressed;
}

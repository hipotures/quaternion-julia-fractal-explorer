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

// --- Helper: Simple Distance Estimator for Click Raycasting ---
// (Adapted from original code, uses current uniforms/state)
function estimateSimpleDistance(pos) {
    // Use current slice value from fractalState
    let z = new THREE.Vector4(pos.x, pos.y, pos.z, fractalState.sliceValue);
    const c = uniforms.u_c.value; // Use current fractal params from uniforms

    let r = 0.0;
    const maxIter = CONFIG.RAYMARCHING.SIMPLE_DISTANCE_MAX_ITER; // Fewer iterations for speed

    for (let i = 0; i < maxIter; i++) {
        r = z.length();
        if (r > CONFIG.RAYMARCHING.ESCAPE_RADIUS) break;

        // Simplified quaternion multiplication (qmul(z, z))
        const zx = z.x, zy = z.y, zz = z.z, zw = z.w;
        const x2 = zx * zx, y2 = zy * zy, z2 = zz * zz, w2 = zw * zw;
        const xy = zx * zy, xz = zx * zz, xw = zx * zw;
        const yz = zy * zz, yw = zy * zw, zw_ = zz * zw;

        z.x = x2 - y2 - z2 - w2 + c.x;
        z.y = 2.0 * xy + c.y; // Simplified - missing cross terms from full qmul
        z.z = 2.0 * xz + c.z; // Simplified
        z.w = 2.0 * xw + c.w; // Simplified
        // Note: The original simple estimate was likely incorrect qmul.
        // A full qmul is:
        // z.x = zx*zx - zy*zy - zz*zz - zw*zw + c.x;
        // z.y = 2.0*zx*zy + 2.0*zz*zw + c.y; // Corrected based on qmul definition
        // z.z = 2.0*zx*zz - 2.0*zy*zw + c.z; // Corrected
        // z.w = 2.0*zx*zw + 2.0*zy*zz + c.w; // Corrected
        // Using the original simplified version for now to match behavior.
    }

    // Return a small distance if likely inside the set, or a fraction of radius otherwise
    return r < CONFIG.RAYMARCHING.ESCAPE_RADIUS ? CONFIG.RAYMARCHING.DEFAULT_STEP_SIZE : 
           Math.abs(CONFIG.RAYMARCHING.SHADOW_FACTOR * Math.log(Math.max(r, CONFIG.RAYMARCHING.MIN_STEP_SIZE)) * r / 1.0); // Simplified DE approximation
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
            console.log("Animations:", cameraState.animationEnabled ? "ON" : "OFF");
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
    // Distraction Free Mode
    else if (key === CONFIG.KEYS.TOGGLE_UI_VISIBILITY) { // Assuming 'u' is defined in CONFIG.KEYS
        import('./ui.js').then(uiModule => {
            uiModule.toggleDistractionFreeMode();
        }).catch(error => console.error("Failed to load ui.js for distraction free mode:", error));
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

        for (let i = 0; i < steps; i++) {
            const pos = ro.clone().addScaledVector(rd, dist);
            const d = estimateSimpleDistance(pos); // Use the helper

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
        console.log("Middle mouse button pressed - constant velocity mode");
        
        // Prevent the default behavior (usually scrolling or potential paste)
        e.preventDefault();
        return false;
    }
}

// Handle middle mouse button release
function handleMouseUp(e) {
    if (e.button === 1) { // Middle mouse button (wheel click)
        isMouseWheelPressed = false;
        console.log("Middle mouse button released - normal acceleration mode");
        
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

import { renderer } from './scene.js';
import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';
import { uniforms, getRotationMatrix, updateFractalParamsUniform } from './shaders.js'; // Import uniforms for raycasting estimate
import {
    camera, cameraState, updateOrbitCamera, updateCameraRotation,
    startTargetAnimation, syncPitchYawFromCamera, setupInitialCamera, updateCameraState
} from './camera.js';
import {
    fractalState, qualitySettings, colorSettings, resetFractalParams,
    toggleSliceAnimation, changeIterations, toggleShadows, toggleAO,
    toggleSmoothColor, toggleSpecular, changePalette, changeSliceAmplitude,
    toggleAdaptiveSteps, crossSectionSettings, cycleClipMode,
    increaseClipDistance, decreaseClipDistance
} from './fractal.js';
// Placeholder imports - these functions will be defined in their respective modules later
import { toggleStats, toggleMenu, toggleTourMenu } from './ui.js';
import { togglePause, isPaused } from './main.js'; // Need isPaused to prevent input during pause
import { toggleRecording, isCurrentlyRecording, cycleQuality } from './recorder.js'; // Import recording functions
import { isTourPlaying, stopTourPlayback } from './tour.js'; // Import tour functions

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
    const maxIter = 20; // Fewer iterations for speed

    for (let i = 0; i < maxIter; i++) {
        r = z.length();
        if (r > 4.0) break;

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
    return r < 4.0 ? 0.02 : Math.abs(0.5 * Math.log(Math.max(r, 1e-6)) * r / 1.0); // Simplified DE approximation
}


// --- Event Handlers ---

function handleKeyDown(e) {
    // Check for escape key to stop tour playback (this takes precedence over all other keys)
    if (e.key === 'Escape') {
        if (isTourPlaying()) {
            stopTourPlayback();
            return;
        }
    }
    
    // Ignore inputs if tour is playing (only Escape works during tour)
    if (isTourPlaying()) return;
    
    // Ignore inputs if paused, except for the pause key itself
    if (isPaused() && e.key !== ' ') return;

    if (e.key === 'Control') {
        isCtrlPressed = true;
        return; // Don't process Control key further
    }

    switch (e.key.toLowerCase()) { // Use toLowerCase for case-insensitivity
        // --- UI ---
        case 'p':
            toggleStats();
            break;
        case 'm':
            toggleMenu();
            break;

        // --- Camera Rotation ---
        case 'arrowleft':
            cameraState.yaw += isCtrlPressed ? 0.25 : 0.05;
            updateCameraRotation();
            break;
        case 'arrowright':
            cameraState.yaw -= isCtrlPressed ? 0.25 : 0.05;
            updateCameraRotation();
            break;
        case 'arrowup':
            cameraState.pitch += isCtrlPressed ? 0.25 : 0.05;
            // Clamping is handled within updateCameraRotation
            updateCameraRotation();
            break;
        case 'arrowdown':
            cameraState.pitch -= isCtrlPressed ? 0.25 : 0.05;
            // Clamping is handled within updateCameraRotation
            updateCameraRotation();
            break;

        // --- Camera Zoom (Focal Length) ---
        case '+':
        case '=': // Handle '=' key often paired with '+'
            cameraState.focalLength = Math.min(24.0, cameraState.focalLength + 0.1);
            updateCameraState(); // Update uniforms
            break;
        case '-':
            cameraState.focalLength = Math.max(0.1, cameraState.focalLength - 0.1);
            updateCameraState(); // Update uniforms
            break;

        // --- Camera Orbital Radius (disabled) ---
        // Z and X keys no longer perform any function
        case 'x':
        case 'z':
            // Functionality removed
            break;

        // --- Reset ---
        case 'r':
            resetFractalParams();
            cameraState.focalLength = cameraState.defaultFocalLength;
            // Trigger return to start animation instead of immediate reset
            cameraState.isReturningToStart = true;
            startTargetAnimation(cameraState.initialCenter);
            cameraState.moveVelocity = 0; // Stop movement
            cameraState.isMovingForward = false;
            break;

        // --- Animation Toggles ---
        case 'a':
            cameraState.animationEnabled = !cameraState.animationEnabled;
            console.log("Animations:", cameraState.animationEnabled ? "ON" : "OFF");
            break;
        case '0':
            // When toggling, make sure to store the current phase/value
            // so animation can continue from exactly the same point
            toggleSliceAnimation();
            // No need to do anything special - the current value will remain in sliceValue
            // and not change when animation is off
            break;

        // --- Quality/Rendering ---
        case '1':
            changeIterations(20);
            break;
        case '2':
            changeIterations(-20);
            break;
        case '3':
            toggleShadows();
            break;
        case '4':
            toggleAO();
            break;
        case '5':
            toggleSmoothColor();
            break;
        case '6':
            changePalette();
            break;
        case '7':
            toggleSpecular();
            break;
        case '8':
            toggleAdaptiveSteps();
            break;
        case '9':
            // Cyklicznie przełączamy tryby: OFF -> METHOD 1 -> METHOD 2 -> OFF
            cycleClipMode();
            break;
        case '[':
            // Only change clip distance if cross section is enabled
            if (crossSectionSettings.clipMode > 0) {
                decreaseClipDistance();
            } else {
                console.log("Cross-Section is OFF - enable it with '9' key first");
            }
            break;
        case ']':
            // Only change clip distance if cross section is enabled
            if (crossSectionSettings.clipMode > 0) {
                increaseClipDistance();
            } else {
                console.log("Cross-Section is OFF - enable it with '9' key first");
            }
            break;
            
        // --- Slice Amplitude Control ---
        case '<':
        case ',': // For keyboards that require shift for < character
            changeSliceAmplitude(-0.1);
            break;
        case '>':
        case '.': // For keyboards that require shift for > character
            changeSliceAmplitude(0.1);
            break;

        // --- Pause / Stop Movement ---
        case ' ':
            // Stop any forward/backward movement immediately
            cameraState.moveVelocity = 0;
            cameraState.isMovingForward = false;
            // Toggle pause state (handled in main.js)
            togglePause();
            break;

        // --- Deceleration Toggle ---
        case 'd':
            cameraState.decelerationEnabled = !cameraState.decelerationEnabled;
            console.log("Deceleration:", cameraState.decelerationEnabled ? "ON" : "OFF");
            break;
            
        // --- Recording Controls ---
        case 'v':
            toggleRecording();
            break;
        case 'q':
            cycleQuality();
            break;
            
        // --- Tour Mode ---
        case 't':
            toggleTourMenu();
            break;
    }
}

function handleKeyUp(e) {
    if (e.key === 'Control') {
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
    if (Math.abs(cameraState.moveVelocity) > 0.0001) {
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
        const steps = 32; // Ray march steps

        for (let i = 0; i < steps; i++) {
            const pos = ro.clone().addScaledVector(rd, dist);
            const d = estimateSimpleDistance(pos); // Use the helper

            if (d < 0.01) { // Threshold for hit
                hitPoint = pos;
                break;
            }
            dist += Math.max(0.01, d * 0.8); // Step forward (slightly less than DE for safety)
            if (dist > 20.0) break; // Max distance
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
        cameraState.isMovingForward = Math.abs(cameraState.moveVelocity) > 0.0001;

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

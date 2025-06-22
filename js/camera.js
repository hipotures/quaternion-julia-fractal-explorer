import * as THREE from './lib/three.module.min.js';
import { uniforms, updateCameraUniforms, getRotationMatrix } from './shaders.js';
import { isWheelButtonPressed } from './interactions.js'; // Import for mouse wheel press detection
import { CONFIG } from './config.js'; // Import configuration values

// --- Camera Object ---
export const camera = new THREE.Camera();
camera.position.set(0, 0, 2); // Initial position

// --- Camera State ---
// Central state object for camera parameters
export const cameraState = {
    // --- Core Camera Properties ---
    position: camera.position.clone(), // Current camera position (Vector3)
    rotation: new THREE.Euler(0, 0, 0, 'YXZ'), // Current camera rotation (Euler angles, YXZ order)
    center: new THREE.Vector3(0, 0, 0), // Point camera is looking at (Vector3)
    pitch: 0, // Vertical rotation angle (radians)
    yaw: 0,   // Horizontal rotation angle (radians)

    // --- Orbital Control Parameters ---
    radius: CONFIG.CAMERA.INITIAL_RADIUS, // Distance from the center point (used for zoom +/-)
    theta: 0.0, // Horizontal angle in spherical coordinates (radians)
    phi: Math.PI * 0.5, // Vertical angle in spherical coordinates (radians)

    // --- Movement Parameters (Forward/Backward via Scroll) ---
    moveSpeed: CONFIG.CAMERA.MOVE_SPEED, // Base speed factor (currently unused, velocity is calculated directly)
    moveVelocity: 0.0, // Current forward/backward velocity (positive = forward, negative = backward)
    isMovingForward: false, // Flag indicating if currently moving via scroll velocity
    maxVelocity: CONFIG.CAMERA.MAX_VELOCITY, // Maximum allowed forward/backward velocity
    acceleration: 0.01, // Acceleration factor when scrolling (currently unused)
    deceleration: CONFIG.CAMERA.DECELERATION, // Deceleration factor applied each frame (higher = faster stop)
    velocitySensitivity: CONFIG.CAMERA.VELOCITY_SENSITIVITY, // Multiplier for scroll wheel delta to adjust velocity

    // --- Smooth Transition Parameters (Click-to-move) ---
    targetCenter: new THREE.Vector3(), // Target look-at point for smooth transition (Vector3)
    isMovingToTarget: false, // Flag indicating if a smooth transition is in progress
    targetProgress: 0, // Progress of the smooth transition animation (0 to 1)
    targetDuration: CONFIG.CAMERA.TARGET_DURATION, // Duration of the smooth transition animation (seconds)
    animationEnabled: true, // Master toggle for smooth camera animations (A key)

    // --- Auto-Return Parameters ---
    initialRadius: CONFIG.CAMERA.INITIAL_RADIUS, // Initial camera distance from origin for reset
    initialCenter: new THREE.Vector3(0, 0, 0), // Initial look-at point for reset (Vector3)
    maxDistance: CONFIG.CAMERA.MAX_DISTANCE, // Maksymalna dozwolona odległość od centrum
    isReturningToStart: false, // Flag indicating if the camera is currently animating back to the start position

    // --- Lens Parameters ---
    focalLength: CONFIG.CAMERA.DEFAULT_FOCAL_LENGTH, // Camera focal length, affects field of view (Z/X keys)
    defaultFocalLength: CONFIG.CAMERA.DEFAULT_FOCAL_LENGTH, // Default focal length used for reset (R key)

    // --- Movement Modifiers ---
    decelerationEnabled: true // We're keeping this property but we're not exposing it in the UI anymore
};

// Expose state globally for debugging/compatibility
window.cameraState = cameraState;

// --- Initialization ---
export function setupInitialCamera() {
    cameraState.position.set(0, 0, cameraState.radius);
    cameraState.center.set(0, 0, 0);
    cameraState.pitch = 0;
    cameraState.yaw = 0;
    cameraState.theta = 0;
    cameraState.phi = Math.PI * 0.5;

    camera.position.copy(cameraState.position);
    camera.lookAt(cameraState.center);
    cameraState.rotation.copy(camera.rotation);

    updateCameraState(); // Update uniforms
}

// --- Update Functions ---

// Updates the actual THREE.js camera and uniforms based on cameraState
export function updateCameraState() {
    camera.position.copy(cameraState.position);
    camera.rotation.copy(cameraState.rotation); // Use the Euler rotation from state
    // camera.lookAt(cameraState.center); // lookAt might interfere with direct rotation control

    // Update uniforms
    const rotMatrix = getRotationMatrix(cameraState.rotation);
    updateCameraUniforms(cameraState.position, rotMatrix);
    uniforms.u_focalLength.value = cameraState.focalLength; // Update focal length uniform
}

// Updates camera position based on orbital parameters (radius, theta, phi)
// Primarily used for zoom (+/- keys) and potentially initial setup/reset
export function updateOrbitCamera() {
    const eps = 0.01;
    cameraState.phi = Math.max(eps, Math.min(Math.PI - eps, cameraState.phi));
    
    // Ograniczenie promienia (odległości) kamery: minimum 0.2, maksimum maxDistance
    cameraState.radius = Math.max(0.2, Math.min(cameraState.maxDistance, cameraState.radius));

    // Spherical to Cartesian
    cameraState.position.x = cameraState.radius * Math.sin(cameraState.phi) * Math.cos(cameraState.theta);
    cameraState.position.y = cameraState.radius * Math.cos(cameraState.phi);
    cameraState.position.z = cameraState.radius * Math.sin(cameraState.phi) * Math.sin(cameraState.theta);

    // Update THREE.js camera to look at the center
    camera.position.copy(cameraState.position);
    camera.lookAt(cameraState.center);
    cameraState.rotation.copy(camera.rotation); // Get the resulting rotation

    // Synchronize pitch/yaw after orbital update
    syncPitchYawFromCamera();

    updateCameraState(); // Update uniforms
}

// Updates camera rotation based on pitch and yaw (first-person control)
export function updateCameraRotation() {
    // Clamp pitch
    cameraState.pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, cameraState.pitch));

    // Use quaternions for smooth rotation
    const quaternion = new THREE.Quaternion();
    const yawQuaternion = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), cameraState.yaw);
    const pitchQuaternion = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), cameraState.pitch);

    // Combine rotations (apply pitch first, then yaw)
    quaternion.multiplyQuaternions(yawQuaternion, pitchQuaternion);

    // Set camera rotation from quaternion
    camera.setRotationFromQuaternion(quaternion);
    cameraState.rotation.copy(camera.rotation); // Update state rotation

    // Calculate new center point based on look direction
    const lookDir = new THREE.Vector3(0, 0, -1).applyQuaternion(quaternion).normalize();
    cameraState.center.copy(cameraState.position).addScaledVector(lookDir, cameraState.radius); // Update state center

    updateCameraState(); // Update uniforms
}


// --- Synchronization ---

// Extracts pitch and yaw angles from the current camera rotation (Quaternion/Euler)
export function extractPitchYawFromCamera() {
    // Ensure the camera's quaternion is up-to-date if using lookAt previously
    // camera.updateMatrixWorld();
    // const quaternion = new THREE.Quaternion().setFromRotationMatrix(camera.matrixWorld);

    // Or directly from Euler if we manage rotation via pitch/yaw
    const euler = cameraState.rotation; // Use the state's rotation

    // Note: The order 'YXZ' means: Yaw around Y, then Pitch around X, then Roll around Z.
    // We are primarily interested in pitch (X) and yaw (Y).
    // Be mindful of gimbal lock issues if roll were involved.
    let pitch = euler.x;
    let yaw = euler.y;

    // Adjust yaw range if necessary (e.g., keep within -PI to PI)
    // yaw = yaw % (2 * Math.PI);

    return { pitch: pitch, yaw: yaw };
}


// Synchronizes cameraState.pitch and cameraState.yaw based on the current camera rotation
// Useful after operations like lookAt or smooth transitions finish
export function syncPitchYawFromCamera() {
    const angles = extractPitchYawFromCamera();
    cameraState.pitch = angles.pitch;
    cameraState.yaw = angles.yaw;
}

// --- Smooth Movement Animation ---
export function startTargetAnimation(targetPos) {
    cameraState.targetCenter.copy(targetPos);
    cameraState.targetProgress = 0;
    cameraState.isMovingToTarget = true;
}

export function updateTargetAnimation(delta) {
    if (!cameraState.isMovingToTarget) return;

    // If animations disabled, jump to target
    if (!cameraState.animationEnabled) {
        cameraState.center.copy(cameraState.targetCenter);
        camera.lookAt(cameraState.center);
        cameraState.rotation.copy(camera.rotation);
        syncPitchYawFromCamera(); // Sync angles
        updateCameraState();
        cameraState.isMovingToTarget = false;
        if (cameraState.isReturningToStart) finishReturnToStart(); // Handle reset completion
        return;
    }

    // Update progress
    cameraState.targetProgress += delta / cameraState.targetDuration;

    let t = cameraState.targetProgress;
    if (t >= 1.0) {
        t = 1.0;
    }

    // Ease-in-out cubic easing
    let easedT = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    // Interpolate center position
    // Need the starting center point for interpolation
    // Let's assume the animation starts from the current cameraState.center
    // If not, we need to store the starting center when the animation begins.
    // For simplicity now, let's lerp directly towards the target.
    // This might not be perfectly smooth if called mid-flight, but works for click-to-move.
    // A better approach would store startCenter at animation start.
    cameraState.center.lerp(cameraState.targetCenter, easedT); // Interpolate the look-at point

    // Update camera to look at the interpolated center
    camera.position.copy(cameraState.position); // Keep current position
    camera.lookAt(cameraState.center);
    cameraState.rotation.copy(camera.rotation); // Get the resulting rotation

    // Update state and uniforms
    updateCameraState();

    // Check if animation finished
    if (t >= 1.0) {
        cameraState.isMovingToTarget = false;
        syncPitchYawFromCamera(); // Final sync of pitch/yaw
        if (cameraState.isReturningToStart) finishReturnToStart(); // Handle reset completion
    }
}

// --- Auto Return Logic ---
export function checkReturnToStart() {
    // Funkcja pozostawiona, ale nie wykonuje automatycznego powrotu
    // Można ją wywołać manualnie, jeśli będzie potrzeba
    return;
}

// Called when the return-to-start animation finishes
function finishReturnToStart() {
    console.log("Finished returning to start.");
    cameraState.isReturningToStart = false;
    // Fully reset camera to initial orbital state after animation
    setupInitialCamera();
}

// --- Forward/Backward Movement ---
export function updateCameraMovement(delta) {
    if (cameraState.moveVelocity !== 0) {
        // Get current look direction from rotation state
        const lookDir = new THREE.Vector3(0, 0, -1).applyEuler(cameraState.rotation).normalize();

        // Sprawdź odległość od centrum
        const distanceFromOrigin = cameraState.position.length();
        
        // Sprawdź, czy kamera próbuje się oddalać czy przybliżać
        const isMovingAway = cameraState.moveVelocity < 0; // Ujemna prędkość to oddalanie się
        
        // Sprawdź, czy kamera jest blisko maksymalnej odległości i próbuje się oddalić
        if (distanceFromOrigin >= cameraState.maxDistance && isMovingAway) {
            // Zatrzymaj ruch oddalający, ale pozwól na naturalną decelerację
            if (cameraState.decelerationEnabled) {
                cameraState.moveVelocity *= (1.0 - cameraState.deceleration); // Łagodne zatrzymanie
            } else {
                cameraState.moveVelocity = 0; // Natychmiastowe zatrzymanie
            }
            
            // Jeśli kamera przekroczyła granicę, delikatnie przyciągnij ją z powrotem
            if (distanceFromOrigin > cameraState.maxDistance) {
                // Oblicz wektor w kierunku centrum
                const pullbackDirection = new THREE.Vector3().copy(cameraState.position).negate().normalize();
                // Delikatnie przyciągnij kamerę z powrotem (bardzo powoli)
                const pullbackFactor = CONFIG.CAMERA.PULLBACK_FACTOR;
                cameraState.position.addScaledVector(pullbackDirection, 
                    pullbackFactor * (distanceFromOrigin - cameraState.maxDistance));
                
                // Dostosuj punkt, na który patrzy kamera, aby zachować kierunek patrzenia
                cameraState.center.copy(cameraState.position).addScaledVector(lookDir, cameraState.radius);
            }
        } else {
            // Normalny ruch kamery, kiedy nie jest na granicy lub się przybliża
            // Calculate displacement based on velocity and delta time
            const displacement = cameraState.moveVelocity; // Velocity already incorporates direction

            // Move camera position and center point
            cameraState.position.addScaledVector(lookDir, displacement);
            cameraState.center.addScaledVector(lookDir, displacement); // Keep looking forward relative to movement
            
            // Check if wheel button is pressed to maintain constant velocity
            if (isWheelButtonPressed()) {
                // No deceleration when wheel button is pressed - maintain constant velocity
            } 
            // Otherwise apply natural deceleration if enabled
            else if (cameraState.decelerationEnabled) {
                cameraState.moveVelocity *= (1.0 - cameraState.deceleration); // Simple exponential decay
            }
        }
        
        // Stop if velocity is very small (regardless of deceleration)
        if (Math.abs(cameraState.moveVelocity) < CONFIG.CAMERA.MIN_VELOCITY_THRESHOLD) {
            cameraState.moveVelocity = 0;
            cameraState.isMovingForward = false;
        }

        // Update THREE.js camera and uniforms
        updateCameraState();
    }
}

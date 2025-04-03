/**
 * Tweakpane UI Camera Controls Module
 * Contains controls for camera settings such as focal length and animations
 * 
 * @module tweakpane-ui/camera
 */

import { cameraState, updateCameraState } from '../camera.js';

// Import shared UI elements
import { pane, folders, bindingState } from './core.js';

/**
 * Creates the camera control section
 */
export function createCameraControlsFolder() {
    // Create main folder
    folders.camera = pane.addFolder({
        title: 'Camera Controls',
        expanded: true
    });
    
    // Initialize focal length binding
    bindingState.focalLength.value = cameraState.focalLength;
    
    // Add controls
    folders.camera.addInput(bindingState.focalLength, 'value', {
        label: 'Focal Length (+/-)',
        min: 0.1, max: 24.0, step: 0.1
    }).on('change', (ev) => {
        cameraState.focalLength = ev.value;
        updateCameraState();
    });
    
    folders.camera.addInput(cameraState, 'animationEnabled', {
        label: 'Animations (A)'
    });
    
    // Add a button to reset camera
    folders.camera.addButton({
        title: 'Reset Camera'
    }).on('click', () => {
        resetCamera();
    });
}

/**
 * Resets the camera to its default state with a fast animation
 */
function resetCamera() {
    cameraState.focalLength = cameraState.defaultFocalLength;
    cameraState.isReturningToStart = true;
    cameraState.moveVelocity = 0;
    cameraState.isMovingForward = false;
    
    // Set a faster animation duration for reset (default is typically 1-2 seconds)
    const originalDuration = cameraState.targetDuration;
    cameraState.targetDuration = 0.35; // Faster reset (350ms)
    
    // Start the animation to return to initial position
    import('../camera.js').then(module => {
        module.startTargetAnimation(cameraState.initialCenter);
        
        // Restore original duration after animation completes
        setTimeout(() => {
            cameraState.targetDuration = originalDuration;
        }, 400); // Slightly longer than animation duration to ensure completion
    });
    
    // Update UI
    bindingState.focalLength.value = cameraState.focalLength;
    pane.refresh();
}

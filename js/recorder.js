import { renderer } from './scene.js';
import { toggleStats, setPauseVisuals } from './ui.js';
import { camera, cameraState } from './camera.js';
import { forceStatsUpdateFor } from './main.js'; // Import for forcing stats updates
import { CONFIG } from './config.js'; // Import configuration values

// --- Recording State ---
let mediaRecorder = null;
let recordedChunks = [];
let isRecording = false;
let recordingStartTime = 0;
let recordingIndicator = null;
let originalCanvasSize = null;
let originalCameraState = null;
let currentQuality = 'NORMAL'; // 'NORMAL', 'HIGH', 'ULTRA'

// --- Initialize Recording UI ---
export function initRecorder() {
    // Create recording indicator element (will appear top right when recording)
    recordingIndicator = document.createElement('div');
    recordingIndicator.id = CONFIG.UI.SELECTORS.RECORDING_INDICATOR;
    recordingIndicator.innerHTML = CONFIG.RECORDER.UI_TEXT.RECORDING_INDICATOR;
    recordingIndicator.style.position = 'absolute';
    recordingIndicator.style.top = '10px';
    recordingIndicator.style.right = '10px';
    recordingIndicator.style.background = 'rgba(255,0,0,0.7)';
    recordingIndicator.style.color = 'white';
    recordingIndicator.style.padding = '5px 10px';
    recordingIndicator.style.borderRadius = '5px';
    recordingIndicator.style.fontWeight = 'bold';
    recordingIndicator.style.zIndex = '1000';
    recordingIndicator.style.display = 'none';
    
    document.body.appendChild(recordingIndicator);
    
    console.log('Recorder initialized. Press V to start/stop recording. Press Q to cycle quality settings (NORMAL→HIGH→ULTRA).');
    console.log('Current recording quality:', currentQuality);
}

// --- Start Recording ---
export function startRecording() {
    if (isRecording || !renderer || !renderer.domElement) return;
    
    try {
        // Save original camera state and canvas properties
        saveOriginalState();
        
        // Try to get the canvas stream at specified FPS
        const stream = renderer.domElement.captureStream(CONFIG.RECORDER.FPS);
        
        // Try to use best quality codec with high bitrate
        let options;
        let bitrate = CONFIG.RECORDER.BITRATES.NORMAL; // Default bitrate
        
        // Adjust bitrate based on quality setting (NO RESOLUTION CHANGES)
        if (currentQuality === 'ULTRA') {
            bitrate = CONFIG.RECORDER.BITRATES.ULTRA;
        } else if (currentQuality === 'HIGH') {
            bitrate = CONFIG.RECORDER.BITRATES.HIGH;
        }
        
        try {
            // Try different codecs in order of preference
            if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
                options = { 
                    mimeType: 'video/webm;codecs=vp9',
                    videoBitsPerSecond: bitrate
                };
            } else if (MediaRecorder.isTypeSupported('video/webm;codecs=h264')) {
                options = { 
                    mimeType: 'video/webm;codecs=h264',
                    videoBitsPerSecond: bitrate 
                };
            } else if (MediaRecorder.isTypeSupported('video/webm')) {
                options = { 
                    mimeType: 'video/webm',
                    videoBitsPerSecond: bitrate 
                };
            } else {
                throw new Error('No supported format found');
            }
            
            mediaRecorder = new MediaRecorder(stream, options);
            console.log(`Using recording format: ${options.mimeType} at ${(bitrate/1000000).toFixed(1)} Mbps`);
        } catch (e) {
            console.warn('High quality encoding not supported, falling back to defaults:', e);
            mediaRecorder = new MediaRecorder(stream);
        }
        
        // Set up event handlers
        mediaRecorder.ondataavailable = handleDataAvailable;
        mediaRecorder.onstop = handleRecordingStopped;
        
        // Clear previous recording data
        recordedChunks = [];
        
        // Start recording with a timeSlice to create multiple chunks
        // This helps with quality by creating more frequent keyframes
        mediaRecorder.start(CONFIG.RECORDER.TIMESLICE_MS);
        isRecording = true;
        recordingStartTime = Date.now();
        
        // Show the recording indicator
        if (recordingIndicator) {
            recordingIndicator.style.display = 'block';
            
            // Add animated blinking effect to the red dot
            let dot = '⚫';
            const blink = setInterval(() => {
                dot = dot === '⚫' ? '⚪' : '⚫';
                recordingIndicator.innerHTML = `REC ${dot} ${getRecordingTime()} (${currentQuality})`;
            }, 500);
            
            // Store the interval ID on the element for cleanup
            recordingIndicator.dataset.blinkInterval = blink;
        }
        
        // Hide stats panel during recording for better performance
        if (document.getElementById('stats')) {
            document.getElementById('stats').dataset.preRecordingState = 
                document.getElementById('stats').style.display;
            toggleStats(false); // Force hide
        }
        
        console.log('Recording started. Press V again to stop.');
    } catch (error) {
        console.error('Error starting recording:', error);
        alert('Failed to start recording. Your browser might not support this feature.');
        
        // Restore original state if error occurs
        restoreOriginalState();
    }
}

// --- Stop Recording ---
export function stopRecording() {
    if (!isRecording || !mediaRecorder) return;
    
    try {
        mediaRecorder.stop();
        isRecording = false;
        
        // Restore original state
        restoreOriginalState();
        
        // Hide recording indicator
        if (recordingIndicator) {
            // Stop the blinking animation
            if (recordingIndicator.dataset.blinkInterval) {
                clearInterval(parseInt(recordingIndicator.dataset.blinkInterval));
                delete recordingIndicator.dataset.blinkInterval;
            }
            recordingIndicator.style.display = 'none';
        }
        
        // Restore stats panel if it was visible before
        const statsElement = document.getElementById('stats');
        if (statsElement && statsElement.dataset.preRecordingState !== undefined) {
            // Restore stats panel visibility
            statsElement.style.display = statsElement.dataset.preRecordingState;
            delete statsElement.dataset.preRecordingState;
            
            // Force stats updates even if panel is hidden
            forceStatsUpdateFor(CONFIG.RECORDER.FORCE_STATS_UPDATE_DURATION);
            
            // Make an immediate update call
            if (window.updateStatsPanel) {
                window.updateStatsPanel(true);
            }
        }
        
        console.log('Recording stopped. Preparing download...');
    } catch (error) {
        console.error('Error stopping recording:', error);
        
        // Make sure to restore original state even if error
        restoreOriginalState();
    }
}

// --- Helper to save original state ---
function saveOriginalState() {
    // Store original canvas size and position 
    const canvas = renderer.domElement;
    originalCanvasSize = {
        width: canvas.width,
        height: canvas.height,
        style: {
            width: canvas.style.width,
            height: canvas.style.height,
            position: canvas.style.position,
            left: canvas.style.left,
            top: canvas.style.top
        }
    };
    
    // Store current camera state to restore later
    originalCameraState = {
        position: camera.position.clone(),
        quaternion: camera.quaternion.clone(),
        matrix: camera.matrix.clone(),
        matrixWorld: camera.matrixWorld.clone(),
        cameraState: {
            pitch: cameraState.pitch,
            yaw: cameraState.yaw,
            radius: cameraState.radius,
            focalLength: cameraState.focalLength,
            rotation: cameraState.rotation ? cameraState.rotation.clone() : null,
            target: cameraState.target ? cameraState.target.clone() : null,
            center: cameraState.center ? cameraState.center.clone() : null,
            position: cameraState.position ? cameraState.position.clone() : null,
        }
    };
}

// --- Helper to restore original state ---
function restoreOriginalState() {
    try {
        // Restore canvas size and style
        if (originalCanvasSize) {
            const canvas = renderer.domElement;
            
            // Restore size
            renderer.setSize(originalCanvasSize.width, originalCanvasSize.height, false);
            
            // Restore style properties
            if (canvas.style.width !== originalCanvasSize.style.width) {
                canvas.style.width = originalCanvasSize.style.width;
            }
            if (canvas.style.height !== originalCanvasSize.style.height) {
                canvas.style.height = originalCanvasSize.style.height;
            }
            if (canvas.style.position !== originalCanvasSize.style.position) {
                canvas.style.position = originalCanvasSize.style.position;
            }
            if (canvas.style.left !== originalCanvasSize.style.left) {
                canvas.style.left = originalCanvasSize.style.left;
            }
            if (canvas.style.top !== originalCanvasSize.style.top) {
                canvas.style.top = originalCanvasSize.style.top;
            }
            
            originalCanvasSize = null;
        }
        
        // Restore camera state
        if (originalCameraState) {
            // Force camera back to original position and rotation
            camera.position.copy(originalCameraState.position);
            camera.quaternion.copy(originalCameraState.quaternion);
            camera.matrix.copy(originalCameraState.matrix);
            camera.matrixWorld.copy(originalCameraState.matrixWorld);
            
            // Update camera (needed to apply changes)
            camera.updateMatrix();
            camera.updateMatrixWorld();
            
            // Restore camera state object properties
            if (originalCameraState.cameraState) {
                const savedState = originalCameraState.cameraState;
                cameraState.pitch = savedState.pitch;
                cameraState.yaw = savedState.yaw;
                cameraState.radius = savedState.radius;
                cameraState.focalLength = savedState.focalLength;
                
                if (savedState.rotation && cameraState.rotation) {
                    cameraState.rotation.copy(savedState.rotation);
                }
                if (savedState.target && cameraState.target) {
                    cameraState.target.copy(savedState.target);
                }
                if (savedState.center && cameraState.center) {
                    cameraState.center.copy(savedState.center);
                }
                if (savedState.position && cameraState.position) {
                    cameraState.position.copy(savedState.position);
                }
            }
            
            originalCameraState = null;
        }
    } catch (error) {
        console.error("Error restoring original state:", error);
    }
}

// --- Toggle Recording State ---
export function toggleRecording() {
    if (isRecording) {
        stopRecording();
    } else {
        startRecording();
    }
    return isRecording;
}

// --- Cycle through recording quality settings ---
export function cycleQuality() {
    if (isRecording) {
        console.warn('Cannot change quality while recording');
        return;
    }
    
    if (currentQuality === 'NORMAL') {
        currentQuality = 'HIGH';
        console.log(`Recording quality set to HIGH (${CONFIG.RECORDER.BITRATES.HIGH/1000000} Mbps bitrate)`);
    } else if (currentQuality === 'HIGH') {
        currentQuality = 'ULTRA';
        console.log(`Recording quality set to ULTRA (${CONFIG.RECORDER.BITRATES.ULTRA/1000000} Mbps bitrate)`);
    } else {
        currentQuality = 'NORMAL';
        console.log(`Recording quality set to NORMAL (${CONFIG.RECORDER.BITRATES.NORMAL/1000000} Mbps bitrate)`);
    }
    
    // Force a refresh of the UI to show the new quality
    if (window.updateStatsPanel) {
        window.updateStatsPanel();
    }
    
    return currentQuality;
}

// --- Get current recording quality for display ---
export function getRecordingQuality() {
    return currentQuality; // Already in uppercase
}

// --- Check Recording State ---
export function isCurrentlyRecording() {
    return isRecording;
}

// --- Update Recording Timer ---
function getRecordingTime() {
    if (!isRecording) return '00:00';
    
    const elapsedSeconds = Math.floor((Date.now() - recordingStartTime) / 1000);
    const minutes = Math.floor(elapsedSeconds / 60).toString().padStart(2, '0');
    const seconds = (elapsedSeconds % 60).toString().padStart(2, '0');
    
    return `${minutes}:${seconds}`;
}

// --- MediaRecorder Event Handlers ---
function handleDataAvailable(event) {
    if (event.data && event.data.size > 0) {
        recordedChunks.push(event.data);
    }
}

function handleRecordingStopped() {
    if (recordedChunks.length === 0) {
        console.warn('No data recorded.');
        return;
    }
    
    // Create blob from the recorded chunks
    const blob = new Blob(recordedChunks, { type: 'video/webm' });
    
    // Create a timestamp for the filename
    const now = new Date();
    const timestamp = `${now.getFullYear()}${(now.getMonth()+1).toString().padStart(2,'0')}${now.getDate().toString().padStart(2,'0')}_${now.getHours().toString().padStart(2,'0')}${now.getMinutes().toString().padStart(2,'0')}`;
    
    // Create download link
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = `quaternion_julia_fractal_${timestamp}_${currentQuality}.webm`;
    
    // Add to document, click and remove
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }, 100);
}

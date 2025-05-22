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
let originalState = {
    canvasSize: null,
    cameraState: null,
    rendererSize: null,
    windowSize: null,
    shaderResolution: null
};
let currentQuality = 'NORMAL'; // 'NORMAL', 'HIGH', 'ULTRA'
export let recorderSettings = { // Export for UI binding
    resolution: 'current', // 'current', '720p', '1080p', '1440p', '4k'
    aspectRatio: 'current', // 'current', '16:9', '9:16', '1:1', '4:3', '3:4'
    currentFPS: CONFIG.RECORDER.FPS, // Store current FPS for recording
};


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
    const canvas = renderer.domElement;
    originalState.canvasSize = {
        width: canvas.width, // actual buffer width
        height: canvas.height, // actual buffer height
        styleWidth: canvas.style.width,
        styleHeight: canvas.style.height,
    };
    originalState.cameraState = {
        aspect: camera.aspect,
        fov: camera.fov, // Assuming PerspectiveCamera, might need adjustment if Orthographic
        focalLength: cameraState.focalLength, // if your camera logic uses this instead of fov directly
    };
    originalState.rendererSize = {
        width: renderer.domElement.width,
        height: renderer.domElement.height,
    };
    originalState.windowSize = {
        width: window.innerWidth,
        height: window.innerHeight,
    };
    // Save current shader resolution uniform
    const { uniforms } = await import('./shaders.js'); // Dynamic import for uniforms
    if (uniforms && uniforms.u_resolution) {
        originalState.shaderResolution = {
            x: uniforms.u_resolution.value.x,
            y: uniforms.u_resolution.value.y
        };
    }
    console.log("Original state saved:", JSON.parse(JSON.stringify(originalState)));
}

// --- Helper to restore original state ---
async function restoreOriginalState() {
    try {
        console.log("Attempting to restore original state:", JSON.parse(JSON.stringify(originalState)));
        if (originalState.rendererSize) {
            // Use window size for renderer to fill screen, or original canvas buffer size if preferred
            renderer.setSize(originalState.windowSize.width, originalState.windowSize.height, false);
        }
        if (originalState.cameraState) {
            camera.aspect = originalState.cameraState.aspect;
            // if (camera.isPerspectiveCamera) camera.fov = originalState.cameraState.fov; // Restore fov if it was changed
            cameraState.focalLength = originalState.cameraState.focalLength; // Restore focal length
            camera.updateProjectionMatrix();
        }
        if (originalState.shaderResolution) {
            const { updateResolutionUniform } = await import('./shaders.js');
            updateResolutionUniform(originalState.shaderResolution.x, originalState.shaderResolution.y);
        }
        
        // Restore canvas style if it was changed (important for layout)
        if (originalState.canvasSize && originalState.canvasSize.styleWidth) {
             renderer.domElement.style.width = originalState.canvasSize.styleWidth;
             renderer.domElement.style.height = originalState.canvasSize.styleHeight;
        }

        // Clear the stored state
        originalState = { canvasSize: null, cameraState: null, rendererSize: null, windowSize: null, shaderResolution: null };
        console.log("Original state restored.");
    } catch (error) {
        console.error("Error restoring original state:", error);
    }
}

// --- Calculate target recording dimensions ---
function getTargetDimensions() {
    let targetWidth = originalState.canvasSize?.width || window.innerWidth;
    let targetHeight = originalState.canvasSize?.height || window.innerHeight;
    let currentAspect = targetWidth / targetHeight;

    // Resolution
    switch (recorderSettings.resolution) {
        case '720p':  targetWidth = 1280; targetHeight = 720; break;
        case '1080p': targetWidth = 1920; targetHeight = 1080; break;
        case '1440p': targetWidth = 2560; targetHeight = 1440; break;
        case '4k':    targetWidth = 3840; targetHeight = 2160; break;
        case 'current': // Use current canvas buffer size as base, then apply aspect ratio
            targetWidth = originalState.rendererSize.width;
            targetHeight = originalState.rendererSize.height;
            break;
    }
    
    // Aspect Ratio - this will override height if resolution is also set (width from resolution, height from aspect)
    // Or, if resolution is 'current', it will adjust based on current canvas dimensions.
    let newAspect = currentAspect;
    switch (recorderSettings.aspectRatio) {
        case '16:9':  newAspect = 16/9; break;
        case '9:16':  newAspect = 9/16; break;
        case '1:1':   newAspect = 1/1;  break;
        case '4:3':   newAspect = 4/3;  break;
        case '3:4':   newAspect = 3/4;  break;
        case 'current': newAspect = currentAspect; break; // Keep current aspect
    }

    if (recorderSettings.resolution !== 'current' && recorderSettings.aspectRatio !== 'current') {
        // If both resolution (which implies an aspect) and a different aspect ratio are chosen,
        // we prioritize the width from the resolution and calculate height based on the new aspect ratio.
        targetHeight = Math.round(targetWidth / newAspect);
    } else if (recorderSettings.resolution === 'current' && recorderSettings.aspectRatio !== 'current') {
        // If using current resolution but changing aspect ratio, adjust one dimension.
        // Let's adjust height based on current width and new aspect ratio.
        targetHeight = Math.round(targetWidth / newAspect);
    } else if (recorderSettings.resolution !== 'current' && recorderSettings.aspectRatio === 'current') {
        // If specific resolution is chosen, its inherent aspect ratio is used.
        // targetWidth and targetHeight are already set.
    }
    // If both are 'current', original dimensions are used.

    // Ensure dimensions are even for some codecs
    targetWidth = targetWidth % 2 === 0 ? targetWidth : targetWidth + 1;
    targetHeight = targetHeight % 2 === 0 ? targetHeight : targetHeight + 1;

    return { width: targetWidth, height: targetHeight };
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

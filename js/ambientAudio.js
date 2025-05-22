/**
 * Procedural Ambient Audio System
 * 
 * Uses Web Audio API to generate ambient sounds that react to fractal parameters.
 * @module ambientAudio
 */

import { fractalState } from './fractal.js';
import { cameraState } from './camera.js';

// --- Audio State & Context ---
let audioContext = null;
let isAudioInitialized = false;
let isAudioPlaying = false;

let mainGainNode = null;

let droneOscillator = null;
let droneGain = null;

let textureOscillator = null;
let textureFilter = null;
let textureGain = null;

const BASE_DRONE_FREQ = 60; // Hz
const DRONE_FREQ_MOD_RANGE = 20; // Hz
const BASE_TEXTURE_FREQ = 120; // Hz (for sawtooth/square before filtering)
const BASE_FILTER_FREQ = 200; // Hz
const FILTER_FREQ_MOD_RANGE = 1000; // Hz

const audioSettings = {
    masterVolume: 0.1, // Default volume (0.0 to 1.0)
    enabled: false,
};

/**
 * Initializes the AudioContext. Must be called after a user interaction.
 */
function initAudioContext() {
    if (audioContext) return true;
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        isAudioInitialized = true;
        console.log("AudioContext initialized.");
        return true;
    } catch (e) {
        console.error("Web Audio API is not supported in this browser.", e);
        return false;
    }
}

/**
 * Creates and configures the audio nodes (oscillators, gain, filters).
 */
function setupAudioNodes() {
    if (!audioContext || !mainGainNode) return;

    // Drone Oscillator
    droneOscillator = audioContext.createOscillator();
    droneOscillator.type = 'sine';
    droneOscillator.frequency.setValueAtTime(BASE_DRONE_FREQ, audioContext.currentTime);
    droneGain = audioContext.createGain();
    droneGain.gain.setValueAtTime(0.3, audioContext.currentTime); // Drone is subtler
    droneOscillator.connect(droneGain).connect(mainGainNode);

    // Texture Oscillator & Filter
    textureOscillator = audioContext.createOscillator();
    textureOscillator.type = 'sawtooth';
    textureOscillator.frequency.setValueAtTime(BASE_TEXTURE_FREQ, audioContext.currentTime);
    
    textureFilter = audioContext.createBiquadFilter();
    textureFilter.type = 'lowpass';
    textureFilter.frequency.setValueAtTime(BASE_FILTER_FREQ, audioContext.currentTime);
    textureFilter.Q.setValueAtTime(1, audioContext.currentTime); // Default Q

    textureGain = audioContext.createGain();
    textureGain.gain.setValueAtTime(0.2, audioContext.currentTime); // Texture is also subtler

    textureOscillator.connect(textureFilter).connect(textureGain).connect(mainGainNode);
    
    console.log("Audio nodes set up.");
}

/**
 * Starts the audio playback.
 */
export function startAudio() {
    if (!isAudioInitialized) {
        if (!initAudioContext()) {
            console.warn("Cannot start audio: AudioContext not initialized.");
            audioSettings.enabled = false; // Ensure UI reflects this
            if (window.refreshTweakpaneAudioSettings) window.refreshTweakpaneAudioSettings();
            return;
        }
    }
    if (isAudioPlaying || !audioContext) return;

    // Create main gain node if it doesn't exist
    if (!mainGainNode) {
        mainGainNode = audioContext.createGain();
        mainGainNode.gain.setValueAtTime(audioSettings.masterVolume, audioContext.currentTime);
        mainGainNode.connect(audioContext.destination);
    }
    
    setupAudioNodes();

    if (droneOscillator) droneOscillator.start();
    if (textureOscillator) textureOscillator.start();
    
    isAudioPlaying = true;
    audioSettings.enabled = true;
    console.log("Ambient audio started.");
}

/**
 * Stops the audio playback.
 */
export function stopAudio() {
    if (!isAudioPlaying || !audioContext) return;

    if (droneOscillator) droneOscillator.stop();
    if (textureOscillator) textureOscillator.stop();
    
    // Disconnect nodes to allow garbage collection (optional, but good practice)
    if (droneGain) droneGain.disconnect();
    if (textureGain) textureGain.disconnect();
    if (textureFilter) textureFilter.disconnect();
    
    droneOscillator = null;
    droneGain = null;
    textureOscillator = null;
    textureFilter = null;
    textureGain = null;
    
    isAudioPlaying = false;
    audioSettings.enabled = false;
    console.log("Ambient audio stopped.");
}

/**
 * Toggles audio playback based on the audioSettings.enabled state.
 * This function is intended to be called by the UI.
 */
export function toggleAudio() {
    // If not initialized and trying to enable, init first.
    if (audioSettings.enabled && !isAudioInitialized) {
        if (!initAudioContext()) {
            audioSettings.enabled = false; // Failed to init, so set back to false
            if (window.refreshTweakpaneAudioSettings) window.refreshTweakpaneAudioSettings();
            return;
        }
    }
    // If AudioContext is suspended (e.g. after page load without interaction), resume it.
    if (audioContext && audioContext.state === 'suspended') {
        audioContext.resume().then(() => {
            console.log("AudioContext resumed successfully.");
            if (audioSettings.enabled) {
                startAudio();
            } else {
                stopAudio();
            }
        }).catch(e => console.error("Error resuming AudioContext:", e));
    } else {
        if (audioSettings.enabled) {
            startAudio();
        } else {
            stopAudio();
        }
    }
}


/**
 * Updates audio parameters based on fractal and camera state.
 * Called in the main animation loop.
 */
export function updateAudioParams() {
    if (!isAudioPlaying || !audioContext) return;

    const currentTime = audioContext.currentTime;

    // Drone modulation
    if (droneOscillator && droneGain) {
        // Modulate frequency by fractalState.params.x
        // Map params.x from [-1, 1] to a frequency range
        const xNorm = (fractalState.params.x + 1) / 2; // Normalize to [0, 1]
        const droneFreq = BASE_DRONE_FREQ + xNorm * DRONE_FREQ_MOD_RANGE - (DRONE_FREQ_MOD_RANGE / 2);
        droneOscillator.frequency.linearRampToValueAtTime(droneFreq, currentTime + 0.1);

        // Modulate gain by fractalState.params.y (subtly)
        const yNorm = (fractalState.params.y + 1) / 2;
        const droneVolume = 0.2 + yNorm * 0.2; // Range [0.2, 0.4]
        droneGain.gain.linearRampToValueAtTime(droneVolume, currentTime + 0.1);
    }

    // Texture modulation
    if (textureFilter && textureGain) {
        // Modulate filter cutoff by cameraState.moveVelocity
        // Normalize velocity (e.g., 0 to maxVelocity) to [0, 1]
        // Assuming cameraState.moveVelocity is in range [-maxVelocity, maxVelocity]
        const velocityNorm = Math.abs(cameraState.moveVelocity) / cameraState.maxVelocity; // Normalized [0, 1]
        const filterFreq = BASE_FILTER_FREQ + velocityNorm * FILTER_FREQ_MOD_RANGE;
        textureFilter.frequency.linearRampToValueAtTime(filterFreq, currentTime + 0.1);

        // Modulate texture gain by velocity (louder when moving)
        const textureVolume = 0.05 + velocityNorm * 0.25; // Range [0.05, 0.3]
        textureGain.gain.linearRampToValueAtTime(textureVolume, currentTime + 0.1);
    }
}

/**
 * Sets the master volume.
 * @param {number} volume - Volume level (0.0 to 1.0).
 */
export function setMasterVolume(volume) {
    audioSettings.masterVolume = Math.max(0, Math.min(1, volume));
    if (mainGainNode && audioContext) {
        mainGainNode.gain.linearRampToValueAtTime(audioSettings.masterVolume, audioContext.currentTime + 0.1);
    }
    console.log(`Master volume set to: ${audioSettings.masterVolume.toFixed(2)}`);
}

/**
 * Gets the current audio settings (for UI binding).
 */
export function getAudioSettings() {
    return audioSettings;
}

console.log("Ambient Audio system initialized (but not active).");

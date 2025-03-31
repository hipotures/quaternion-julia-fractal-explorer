import { cameraState } from './camera.js';
import { fractalState, qualitySettings, colorSettings, crossSectionSettings } from './fractal.js';
import { getRecordingQuality } from './recorder.js';
import { getFps } from './main.js'; // Import FPS function

// --- DOM Elements ---
const statsElement = document.getElementById('stats');
const menuElement = document.getElementById('menu');

// --- State ---
let showStats = true;
let showMenu = true; // Assume menu is visible initially

// --- Update Functions ---

// Updates the content of the statistics panel
export function updateStatsPanel(forceUpdate = false) {
    // Expose globally for other modules to force updates
    window.updateStatsPanel = updateStatsPanel;
    
    // Check if we should allow updates even when stats panel is hidden
    if ((!showStats && !forceUpdate) || !statsElement) return; // Don't update if hidden or not found

    // Check if the user is currently selecting text within the stats panel
    let isSelecting = false;
    if (document.activeElement === statsElement ||
        (window.getSelection && window.getSelection().type === "Range" &&
         statsElement.contains(window.getSelection().anchorNode))) { // More robust check
        isSelecting = true;
    }

    // Only update innerHTML if the user is not actively selecting text inside it
    if (!isSelecting) {
        const speedPercent = Math.abs(cameraState.moveVelocity / cameraState.maxVelocity * 100).toFixed(1);
        const speedDirection = cameraState.moveVelocity > 0.0001 ? 'forward' : cameraState.moveVelocity < -0.0001 ? 'backward' : 'stop';

        statsElement.innerHTML =
            `<div class="stats-category">Fractal Parameters</div>` +
            `<b>Param c:</b> (${fractalState.params.x.toFixed(3)}, ${fractalState.params.y.toFixed(3)}, ${fractalState.params.z.toFixed(3)}, ${fractalState.params.w.toFixed(3)})<br>` +
            `<b>Slice:</b> ${fractalState.sliceValue >= 0 ? '+' : ''}${fractalState.sliceValue.toFixed(3)}${fractalState.animateSlice ? ' (anim)' : ' (stop)'} Range: ${-fractalState.sliceAmplitude.toFixed(1)} to +${fractalState.sliceAmplitude.toFixed(1)}<br>` +
            `<b>Palette:</b> ${colorSettings.paletteIndex === 0 ? 'OFF' : colorSettings.paletteIndex}<br>` +
            
            `<hr class="stats-separator">` +
            
            `<div class="stats-category">Camera</div>` +
            `<b>Position:</b> (${cameraState.position.x.toFixed(3)}, ${cameraState.position.y.toFixed(3)}, ${cameraState.position.z.toFixed(3)})<br>` +
            `<b>Direction:</b> Pitch: ${cameraState.pitch.toFixed(2)}, Yaw: ${cameraState.yaw.toFixed(2)}<br>` +
            `<b>Speed:</b> ${speedPercent}% ${speedDirection}<br>` +
            `<b>Radius:</b> ${cameraState.radius.toFixed(2)}<br>` +
            `<b>Focal L:</b> ${cameraState.focalLength.toFixed(2)}<br>` +
            
            `<hr class="stats-separator">` +
            
            `<div class="stats-category">Cross-Section</div>` +
            `<b>Mode:</b> ${
                crossSectionSettings.clipMode === 0 ? 'OFF' : 
                crossSectionSettings.clipMode === 1 ? 'METHOD 1' : 
                crossSectionSettings.clipMode === 2 ? 'METHOD 2' : 'METHOD 3'
            }<br>` +
            `${crossSectionSettings.clipMode > 0 ? `<b>Distance:</b> ${crossSectionSettings.clipDistance.toFixed(2)}<br>` : ''}` +
            
            `<hr class="stats-separator">` +
            
            `<div class="stats-category">Quality Settings</div>` +
            `<b>Iterations:</b> ${qualitySettings.maxIter}<br>` +
            `<b>Shadows:</b> ${qualitySettings.enableShadows ? 'ON' : 'OFF'}<br>` +
            `<b>AO:</b> ${qualitySettings.enableAO ? 'ON' : 'OFF'}<br>` +
            `<b>Smooth:</b> ${qualitySettings.enableSmoothColor ? 'ON' : 'OFF'}<br>` +
            `<b>Specular:</b> ${qualitySettings.enableSpecular ? 'ON' : 'OFF'}<br>` +
            `<b>Adaptive RM:</b> ${qualitySettings.enableAdaptiveSteps ? 'ON' : 'OFF'}<br>` +
            
            `<hr class="stats-separator">` +
            
            `<div class="stats-category">System</div>` +
            `<b>FPS:</b> ${getFps().toFixed(1)}<br>` +
            `<b>Animations:</b> ${cameraState.animationEnabled ? 'ON' : 'OFF'}<br>` +
            `<b>Deceleration:</b> ${cameraState.decelerationEnabled ? 'ON' : 'OFF'}<br>` +
            `<b>Recording:</b> ${getRecordingQuality() || 'NORMAL'}<br>`;
            
            // No longer needed for debugging
            // console.log("Current recording quality:", getRecordingQuality());
    }
}

// Toggles the visibility of the statistics panel
export function toggleStats(forcedState = null) {
    // If forcedState is provided, use it, otherwise toggle
    if (forcedState !== null) {
        showStats = forcedState;
    } else {
        showStats = !showStats;
    }
    
    if (statsElement) {
        statsElement.style.display = showStats ? 'block' : 'none';
    }
    console.log("Stats Panel:", showStats ? "Visible" : "Hidden");
}

// Toggles the visibility of the menu panel
export function toggleMenu() {
    showMenu = !showMenu;
    if (menuElement) {
        menuElement.style.display = showMenu ? 'block' : 'none';
    }
    console.log("Menu Panel:", showMenu ? "Visible" : "Hidden");
}

// Updates the visual state of the stats panel when paused/resumed
export function setPauseVisuals(paused) {
    if (statsElement) {
        if (paused) {
            statsElement.classList.add('paused');
        } else {
            statsElement.classList.remove('paused');
        }
    }
}

// Initial setup - ensure menu is visible by default if element exists
if (menuElement) {
    menuElement.style.display = 'block';
}
// Initial setup - ensure stats are visible by default if element exists
if (statsElement) {
    statsElement.style.display = 'block';
}

import { cameraState } from './camera.js';
import { fractalState, qualitySettings, colorSettings, crossSectionSettings, resetFractalParams } from './fractal.js';
import { getRecordingQuality } from './recorder.js';
import { getFps } from './main.js'; // Import FPS function
import { updateFractalParamsUniform } from './shaders.js';

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

// --- Quaternion Presets ---
const presetMenu = document.getElementById('preset-menu');
const quaternionPresets = [
    new THREE.Vector4(-1.0, 0.2, 0.0, 0.0),      // Q01
    new THREE.Vector4(-0.291, -0.399, 0.339, 0.437), // Q02
    new THREE.Vector4(-0.2, 0.4, -0.4, -0.4),    // Q03
    new THREE.Vector4(-0.213, -0.041, -0.563, -0.560), // Q04
    new THREE.Vector4(-0.2, 0.6, 0.2, 0.2),      // Q05
    new THREE.Vector4(-0.162, 0.163, 0.560, -0.599), // Q06
    new THREE.Vector4(-0.2, 0.8, 0.0, 0.0),      // Q07
    new THREE.Vector4(-0.445, 0.339, -0.0889, -0.562), // Q08
    new THREE.Vector4(0.185, 0.478, 0.125, -0.392), // Q09
    new THREE.Vector4(-0.450, -0.447, 0.181, 0.306), // Q10
    new THREE.Vector4(-0.218, -0.113, -0.181, -0.496), // Q11
    new THREE.Vector4(-0.137, -0.630, -0.475, -0.046), // Q12
    new THREE.Vector4(-0.125, -0.256, 0.847, 0.0895), // Q13
];

// Function to load a quaternion preset
function loadQuaternionPreset(index) {
    // Ensure valid index (0 to 12)
    if (index < 0 || index >= quaternionPresets.length) return;
    
    // Copy preset to fractal parameters
    fractalState.params.copy(quaternionPresets[index]);
    
    // Update the shader uniform
    updateFractalParamsUniform(fractalState.params);
    
    // Reset camera as in R key operation (but keep our parameters)
    cameraState.focalLength = cameraState.defaultFocalLength;
    cameraState.isReturningToStart = true;
    import('./camera.js').then(module => {
        module.startTargetAnimation(cameraState.initialCenter);
    });
    cameraState.moveVelocity = 0;
    cameraState.isMovingForward = false;
    
    console.log(`Loaded Quaternion Preset Q${(index+1).toString().padStart(2, '0')}: (${fractalState.params.x}, ${fractalState.params.y}, ${fractalState.params.z}, ${fractalState.params.w})`);
}

// Add event listeners to the preset buttons
function initPresetButtons() {
    for (let i = 1; i <= 13; i++) {
        const buttonId = `q${i.toString().padStart(2, '0')}`;
        const button = document.getElementById(buttonId);
        if (button) {
            button.addEventListener('click', () => loadQuaternionPreset(i-1));
        }
    }
}

// Function to update preset menu visibility
function updatePresetMenuVisibility() {
    if (presetMenu) {
        // Show preset menu only if either stats or menu are visible
        presetMenu.style.display = (showStats || showMenu) ? 'flex' : 'none';
    }
}

// Update preset menu visibility when toggling menu or stats
const originalToggleMenu = toggleMenu;
toggleMenu = function() {
    originalToggleMenu();
    updatePresetMenuVisibility();
};

const originalToggleStats = toggleStats;
toggleStats = function(forcedState = null) {
    originalToggleStats(forcedState);
    updatePresetMenuVisibility();
};

// Initial setup - ensure menu is visible by default if element exists
if (menuElement) {
    menuElement.style.display = 'block';
}
// Initial setup - ensure stats are visible by default if element exists
if (statsElement) {
    statsElement.style.display = 'block';
}
// Initialize preset buttons and visibility
initPresetButtons();
updatePresetMenuVisibility();

import { cameraState } from './camera.js';
import { fractalState, qualitySettings, colorSettings, crossSectionSettings, resetFractalParams } from './fractal.js';
import { getRecordingQuality } from './recorder.js';
import { getFps } from './main.js'; // Import FPS function
import { updateFractalParamsUniform } from './shaders.js';
import { CONFIG } from './config.js'; // Import configuration values
import { 
    startTourRecording, registerTourPoint, finishTourRecording, 
    cancelTourRecording, getTourPointCount, isTourRecording 
} from './tour.js';

// --- DOM Elements ---
const statsElement = document.getElementById(CONFIG.UI.SELECTORS.STATS_PANEL);
const menuElement = document.getElementById(CONFIG.UI.SELECTORS.MENU_PANEL);

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
const presetMenu = document.getElementById(CONFIG.UI.SELECTORS.PRESET_MENU);
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
        const shouldBeVisible = (showStats || showMenu);
        presetMenu.style.display = shouldBeVisible ? 'flex' : 'none';
        presetMenu.style.visibility = shouldBeVisible ? 'visible' : 'hidden';
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

// --- UI Elements ---
const tourMenu = document.getElementById(CONFIG.UI.SELECTORS.TOUR_MENU);
const tourPointCountElement = document.getElementById(CONFIG.UI.SELECTORS.TOUR_POINT_COUNT);
const registerPointButton = document.getElementById(CONFIG.UI.SELECTORS.REGISTER_POINT);
const finishTourButton = document.getElementById(CONFIG.UI.SELECTORS.FINISH_TOUR);
const cancelTourButton = document.getElementById(CONFIG.UI.SELECTORS.CANCEL_TOUR);
const tourPresetsElement = document.getElementById(CONFIG.UI.SELECTORS.TOUR_PRESETS);
const tourStatusElement = document.getElementById(CONFIG.UI.SELECTORS.TOUR_STATUS);

// Function to toggle the Tour Menu
export function toggleTourMenu() {
    if (!tourMenu) return false;

    // If not already recording, start a new recording
    if (!isTourRecording()) {
        startTourRecording();
        updateTourPointCount();
        tourMenu.style.display = 'flex';
        console.log("Tour recording started");
        return true;
    } else {
        // If already recording, just toggle the visibility
        const isVisible = tourMenu.style.display === 'flex';
        tourMenu.style.display = isVisible ? 'none' : 'flex';
        console.log("Tour menu visibility:", !isVisible);
        return !isVisible;
    }
}

// ----- UI State Query Functions -----

// Check if the menu is visible
export function isMenuVisible() {
    return showMenu;
}

// Check if the stats panel is visible
export function isStatsVisible() {
    return showStats;
}

// Check if the preset menu is visible
export function isPresetMenuVisible() {
    return presetMenu && presetMenu.style.display === 'flex';
}

// Show or hide the preset menu
export function showPresetMenu(visible) {
    if (presetMenu) {
        presetMenu.style.display = visible ? 'flex' : 'none';
        presetMenu.style.visibility = visible ? 'visible' : 'hidden';
        console.log("PresetMenu visibility changed:", visible ? "visible" : "hidden");
    }
}

// Update the tour point count display
function updateTourPointCount() {
    if (tourPointCountElement) {
        tourPointCountElement.textContent = getTourPointCount().toString();
    }
}

// Register a new tour point
function handleRegisterPoint() {
    const pointCount = registerTourPoint();
    updateTourPointCount();
    console.log(`Registered tour point #${pointCount}`);
}

// Finish and save the tour
function handleFinishTour() {
    const filename = finishTourRecording();
    if (filename) {
        alert(`Tour saved as ${filename}`);
        tourMenu.style.display = 'none';
    } else {
        alert("No points to save. Register at least one point first.");
    }
}

// Cancel the current tour recording
function handleCancelTour() {
    if (confirm(CONFIG.UI.TEXT.TOUR_CANCEL_CONFIRM)) {
        cancelTourRecording();
        tourMenu.style.display = 'none';
    }
}

// Add event listeners to tour menu buttons
function initTourButtons() {
    if (registerPointButton) {
        registerPointButton.addEventListener('click', handleRegisterPoint);
    }
    if (finishTourButton) {
        finishTourButton.addEventListener('click', handleFinishTour);
    }
    if (cancelTourButton) {
        cancelTourButton.addEventListener('click', handleCancelTour);
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
// Add tour preset buttons based on available tour files
async function initTourPresetButtons() {
    if (!tourPresetsElement) return;
    
    // Import loadAvailableTours function dynamically to avoid circular import issues
    const { loadAvailableTours } = await import('./tour.js');
    
    // Load all available tours
    const tours = await loadAvailableTours();
    
    // Clear any existing tour buttons
    tourPresetsElement.innerHTML = '';
    
    // Add a button for each tour
    tours.forEach((tour, index) => {
        const buttonId = `T${(index+1).toString().padStart(2, '0')}`;
        const button = document.createElement('button');
        button.id = buttonId;
        button.textContent = buttonId;
        button.title = tour.name; // Set tooltip to tour name
        button.setAttribute('data-file', tour.fileName);
        
        // Add event listener for tour button click
        button.addEventListener('click', () => {
            // Start tour playback with the selected tour data
            import('./tour.js').then(module => {
                if (module.isTourPlaying()) {
                    console.log("Cannot start tour - another tour is already playing");
                    return;
                }
                
                // Start tour playback
                module.startTourPlayback(tour.data);
            });
        });
        
        tourPresetsElement.appendChild(button);
    });
    
    console.log(`Added ${tours.length} tour preset button(s)`);
}

// Make the tour menu draggable
function makeTourMenuDraggable() {
    if (!tourMenu) return;
    
    let isDragging = false;
    let offsetX, offsetY;
    
    // When the mouse button is pressed on the menu, start the drag process
    tourMenu.addEventListener('mousedown', startDrag);
    
    function startDrag(e) {
        // Only allow dragging from the menu itself or its header
        if (e.target === tourMenu || e.target.tagName === 'H2') {
            isDragging = true;
            
            // Calculate the offset from the mouse position to the menu corner
            const rect = tourMenu.getBoundingClientRect();
            offsetX = e.clientX - rect.left;
            offsetY = e.clientY - rect.top;
            
            // Add the document-level event listeners
            document.addEventListener('mousemove', drag);
            document.addEventListener('mouseup', stopDrag);
            
            // Prevent default behavior and text selection
            e.preventDefault();
        }
    }
    
    function drag(e) {
        if (!isDragging) return;
        
        // Calculate the new position based on mouse coordinates and offset
        const x = e.clientX - offsetX;
        const y = e.clientY - offsetY;
        
        // Update the menu position directly with fixed positioning
        tourMenu.style.left = x + 'px';
        tourMenu.style.top = y + 'px';
        
        // Remove the transform property that centers the menu
        tourMenu.style.transform = 'none';
        
        e.preventDefault();
    }
    
    function stopDrag() {
        isDragging = false;
        
        // Remove the document-level event listeners when done dragging
        document.removeEventListener('mousemove', drag);
        document.removeEventListener('mouseup', stopDrag);
    }
}

// Initialize preset buttons and visibility
initPresetButtons();
updatePresetMenuVisibility();
// Initialize tour menu buttons
initTourButtons();
// Initialize tour preset buttons (returns a promise)
initTourPresetButtons();
// Make tour menu draggable
makeTourMenuDraggable();

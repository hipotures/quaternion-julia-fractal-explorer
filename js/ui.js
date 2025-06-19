/**
 * UI component module for managing all user interface elements
 * Handles the stats panel, menu visibility, preset buttons, and tour UI.
 * 
 * @module ui
 */

import { cameraState, startTargetAnimation } from './camera.js';
import { 
    fractalState, 
    qualitySettings, 
    colorSettings, 
    crossSectionSettings, 
    resetFractalParams 
} from './fractal.js';
import { getRecordingQuality } from './recorder.js';
import { getFps } from './main.js';
import { updateFractalParamsUniform } from './shaders.js';
import { CONFIG } from './config.js';
import { 
    startTourRecording, 
    registerTourPoint, 
    finishTourRecording, 
    cancelTourRecording, 
    getTourPointCount, 
    isTourRecording,
    loadAvailableTours,
    startTourPlayback,
    isTourPlaying
} from './tour.js';

/**
 * DOM Element references for UI components
 */
const statsElement = document.getElementById(CONFIG.UI.SELECTORS.STATS_PANEL);
const menuElement = document.getElementById(CONFIG.UI.SELECTORS.MENU_PANEL);
const presetMenu = document.getElementById(CONFIG.UI.SELECTORS.PRESET_MENU);
const tourMenu = document.getElementById(CONFIG.UI.SELECTORS.TOUR_MENU);
const tourPointCountElement = document.getElementById(CONFIG.UI.SELECTORS.TOUR_POINT_COUNT);
const registerPointButton = document.getElementById(CONFIG.UI.SELECTORS.REGISTER_POINT);
const finishTourButton = document.getElementById(CONFIG.UI.SELECTORS.FINISH_TOUR);
const cancelTourButton = document.getElementById(CONFIG.UI.SELECTORS.CANCEL_TOUR);
const tourPresetsElement = document.getElementById(CONFIG.UI.SELECTORS.TOUR_PRESETS);
const tourStatusElement = document.getElementById(CONFIG.UI.SELECTORS.TOUR_STATUS);

/**
 * UI state variables
 */
let showStats = false; // Stats panel visibility - disabled by default, use Tweakpane instead
let showMenu = false; // Menu visibility - disabled by default, use Tweakpane instead

/**
 * Updates the content of the statistics panel
 * Displays information about fractal parameters, camera, cross-section, quality settings, and system
 * 
 * @param {boolean} forceUpdate - If true, updates the panel even when hidden
 */
export function updateStatsPanel(forceUpdate = false) {
    // Check if we should allow updates even when stats panel is hidden
    if ((!showStats && !forceUpdate) || !statsElement) return;

    try {
        // Check if the user is currently selecting text within the stats panel
        let isSelecting = false;
        if (document.activeElement === statsElement ||
            (window.getSelection && window.getSelection().type === "Range" &&
            statsElement.contains(window.getSelection().anchorNode))) {
            isSelecting = true;
        }

        // Only update innerHTML if the user is not actively selecting text inside it
        if (!isSelecting) {
            const speedPercent = Math.abs(cameraState.moveVelocity / cameraState.maxVelocity * 100).toFixed(1);
            const speedDirection = cameraState.moveVelocity > 0.0001 ? 'forward' : 
                                  cameraState.moveVelocity < -0.0001 ? 'backward' : 'stop';
            const clipModeText = ['OFF', 'METHOD 1', 'METHOD 2', 'METHOD 3'][crossSectionSettings.clipMode];

            statsElement.innerHTML = `
                <div class="stats-category">Fractal Parameters</div>
                <b>Param c:</b> (${fractalState.params.x.toFixed(3)}, ${fractalState.params.y.toFixed(3)}, ${fractalState.params.z.toFixed(3)}, ${fractalState.params.w.toFixed(3)})<br>
                <b>Slice:</b> ${fractalState.sliceValue >= 0 ? '+' : ''}${fractalState.sliceValue.toFixed(3)}${fractalState.animateSlice ? ' (anim)' : ' (stop)'} Range: ${-fractalState.sliceAmplitude.toFixed(1)} to +${fractalState.sliceAmplitude.toFixed(1)}<br>
                <b>Palette:</b> ${colorSettings.paletteIndex === 0 ? 'OFF' : colorSettings.paletteIndex}<br>
                
                <hr class="stats-separator">
                
                <div class="stats-category">Camera</div>
                <b>Position:</b> (${cameraState.position.x.toFixed(3)}, ${cameraState.position.y.toFixed(3)}, ${cameraState.position.z.toFixed(3)})<br>
                <b>Direction:</b> Pitch: ${cameraState.pitch.toFixed(2)}, Yaw: ${cameraState.yaw.toFixed(2)}<br>
                <b>Speed:</b> ${speedPercent}% ${speedDirection}<br>
                <b>Radius:</b> ${cameraState.radius.toFixed(2)}<br>
                <b>Focal L:</b> ${cameraState.focalLength.toFixed(2)}<br>
                
                <hr class="stats-separator">
                
                <div class="stats-category">Cross-Section</div>
                <b>Mode:</b> ${clipModeText}<br>
                ${crossSectionSettings.clipMode > 0 ? 
                    `<b>Distance:</b> ${crossSectionSettings.clipDistance.toFixed(2)}<br>` : 
                    ''}
                
                <hr class="stats-separator">
                
                <div class="stats-category">Quality Settings</div>
                <b>Iterations:</b> ${qualitySettings.maxIter}<br>
                <b>Shadows:</b> ${qualitySettings.enableShadows ? 'ON' : 'OFF'}<br>
                <b>AO:</b> ${qualitySettings.enableAO ? 'ON' : 'OFF'}<br>
                <b>Smooth:</b> ${qualitySettings.enableSmoothColor ? 'ON' : 'OFF'}<br>
                <b>Specular:</b> ${qualitySettings.enableSpecular ? 'ON' : 'OFF'}<br>
                <b>Adaptive RM:</b> ${qualitySettings.enableAdaptiveSteps ? 'ON' : 'OFF'}<br>
                
                <hr class="stats-separator">
                
                <div class="stats-category">System</div>
                <b>FPS:</b> ${getFps().toFixed(1)}<br>
                <b>Animations:</b> ${cameraState.animationEnabled ? 'ON' : 'OFF'}<br>
                <b>Recording:</b> ${getRecordingQuality() || 'NORMAL'}<br>
            `;
        }
    } catch (error) {
        console.error("Error updating stats panel:", error);
    }
}

/**
 * Toggles the visibility of the statistics panel
 * 
 * @param {boolean|null} forcedState - If provided, sets visibility to this state; otherwise toggles
 */
export function toggleStats(forcedState = null) {
    try {
        // If forcedState is provided, use it, otherwise toggle
        if (forcedState !== null) {
            showStats = forcedState;
        } else {
            showStats = !showStats;
        }
        
        if (statsElement) {
            statsElement.style.display = showStats ? 'block' : 'none';
        }
        
        // Update preset menu visibility based on new state
        updatePresetMenuVisibility();
        
        console.log("Stats Panel:", showStats ? "Visible" : "Hidden");
    } catch (error) {
        console.error("Error toggling stats panel:", error);
    }
}

/**
 * Toggles the visibility of the menu panel
 */
export function toggleMenu() {
    try {
        showMenu = !showMenu;
        if (menuElement) {
            menuElement.style.display = showMenu ? 'block' : 'none';
        }
        
        // Update preset menu visibility based on new state
        updatePresetMenuVisibility();
        
        console.log("Menu Panel:", showMenu ? "Visible" : "Hidden");
    } catch (error) {
        console.error("Error toggling menu panel:", error);
    }
}

/**
 * Updates the visual state of the stats panel when animation is paused/resumed
 * 
 * @param {boolean} paused - Whether the animation is paused
 */
export function setPauseVisuals(paused) {
    try {
        if (statsElement) {
            if (paused) {
                statsElement.classList.add('paused');
            } else {
                statsElement.classList.remove('paused');
            }
        }
    } catch (error) {
        console.error("Error setting pause visuals:", error);
    }
}

/**
 * Predefined quaternion parameter presets for interesting Julia set configurations
 */
const quaternionPresets = [
    new THREE.Vector4(-1.0, 0.2, 0.0, 0.0),           // Q01
    new THREE.Vector4(-0.291, -0.399, 0.339, 0.437),  // Q02
    new THREE.Vector4(-0.2, 0.4, -0.4, -0.4),         // Q03
    new THREE.Vector4(-0.213, -0.041, -0.563, -0.560),// Q04
    new THREE.Vector4(-0.2, 0.6, 0.2, 0.2),           // Q05
    new THREE.Vector4(-0.162, 0.163, 0.560, -0.599),  // Q06
    new THREE.Vector4(-0.2, 0.8, 0.0, 0.0),           // Q07
    new THREE.Vector4(-0.445, 0.339, -0.0889, -0.562),// Q08
    new THREE.Vector4(0.185, 0.478, 0.125, -0.392),   // Q09
    new THREE.Vector4(-0.450, -0.447, 0.181, 0.306),  // Q10
    new THREE.Vector4(-0.218, -0.113, -0.181, -0.496),// Q11
    new THREE.Vector4(-0.137, -0.630, -0.475, -0.046),// Q12
    new THREE.Vector4(-0.125, -0.256, 0.847, 0.0895)  // Q13
];

/**
 * Loads a quaternion parameter preset and updates the fractal
 * 
 * @param {number} index - Index of the preset to load (0-12)
 */
function loadQuaternionPreset(index) {
    try {
        // Ensure valid index (0 to 12)
        if (index < 0 || index >= quaternionPresets.length) return;
        
        // Copy preset to fractal parameters
        fractalState.params.copy(quaternionPresets[index]);
        
        // Update the shader uniform
        updateFractalParamsUniform(fractalState.params);
        
        // Reset camera as in R key operation (but keep our parameters)
        cameraState.focalLength = cameraState.defaultFocalLength;
        cameraState.isReturningToStart = true;
        startTargetAnimation(cameraState.initialCenter);
        cameraState.moveVelocity = 0;
        cameraState.isMovingForward = false;
        
        console.log(`Loaded Quaternion Preset Q${(index+1).toString().padStart(2, '0')}: (${fractalState.params.x.toFixed(3)}, ${fractalState.params.y.toFixed(3)}, ${fractalState.params.z.toFixed(3)}, ${fractalState.params.w.toFixed(3)})`);
    } catch (error) {
        console.error("Error loading quaternion preset:", error);
    }
}

/**
 * Initializes event listeners for quaternion preset buttons
 */
function initPresetButtons() {
    try {
        for (let i = 1; i <= 13; i++) {
            const buttonId = `q${i.toString().padStart(2, '0')}`;
            const button = document.getElementById(buttonId);
            if (button) {
                button.addEventListener('click', () => loadQuaternionPreset(i-1));
            }
        }
    } catch (error) {
        console.error("Error initializing preset buttons:", error);
    }
}

/**
 * Updates preset menu visibility based on stats and menu visibility
 */
function updatePresetMenuVisibility() {
    try {
        if (presetMenu) {
            // Show preset menu only if either stats or menu are visible
            const shouldBeVisible = (showStats || showMenu);
            presetMenu.style.display = shouldBeVisible ? 'flex' : 'none';
            presetMenu.style.visibility = shouldBeVisible ? 'visible' : 'hidden';
        }
    } catch (error) {
        console.error("Error updating preset menu visibility:", error);
    }
}

/**
 * Toggles the Tour Menu for recording camera paths
 * 
 * @returns {boolean} New visibility state of the tour menu
 */
export function toggleTourMenu() {
    try {
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
    } catch (error) {
        console.error("Error toggling tour menu:", error);
        return false;
    }
}

// ----- UI State Query Functions -----

/**
 * Checks if the main menu is currently visible
 * 
 * @returns {boolean} True if menu is visible
 */
export function isMenuVisible() {
    return showMenu;
}

/**
 * Checks if the stats panel is currently visible
 * 
 * @returns {boolean} True if stats panel is visible
 */
export function isStatsVisible() {
    return showStats;
}

/**
 * Checks if the preset menu is currently visible
 * 
 * @returns {boolean} True if preset menu is visible
 */
export function isPresetMenuVisible() {
    return presetMenu && presetMenu.style.display === 'flex';
}

/**
 * Shows or hides the preset menu
 * 
 * @param {boolean} visible - Whether the preset menu should be visible
 */
export function showPresetMenu(visible) {
    try {
        if (presetMenu) {
            presetMenu.style.display = visible ? 'flex' : 'none';
            presetMenu.style.visibility = visible ? 'visible' : 'hidden';
            console.log("PresetMenu visibility changed:", visible ? "visible" : "hidden");
        }
    } catch (error) {
        console.error("Error changing preset menu visibility:", error);
    }
}

/**
 * Updates the tour point count in the tour recording UI
 */
function updateTourPointCount() {
    try {
        if (tourPointCountElement) {
            tourPointCountElement.textContent = getTourPointCount().toString();
        }
    } catch (error) {
        console.error("Error updating tour point count:", error);
    }
}

/**
 * Handles registering a new tour point
 * Captures current camera position and settings
 */
function handleRegisterPoint() {
    try {
        const pointCount = registerTourPoint();
        updateTourPointCount();
        console.log(`Registered tour point #${pointCount}`);
    } catch (error) {
        console.error("Error registering tour point:", error);
    }
}

/**
 * Handles finishing and saving the tour
 * Creates a JSON file with all recorded tour points
 */
function handleFinishTour() {
    try {
        const filename = finishTourRecording();
        if (filename) {
            alert(`Tour saved as ${filename}`);
            tourMenu.style.display = 'none';
        } else {
            alert("No points to save. Register at least one point first.");
        }
    } catch (error) {
        console.error("Error finishing tour:", error);
    }
}

/**
 * Handles cancelling the current tour recording
 * Asks for confirmation before discarding recorded points
 */
function handleCancelTour() {
    try {
        if (confirm(CONFIG.UI.TEXT.TOUR_CANCEL_CONFIRM)) {
            cancelTourRecording();
            tourMenu.style.display = 'none';
        }
    } catch (error) {
        console.error("Error cancelling tour:", error);
    }
}

/**
 * Initializes event listeners for tour menu buttons
 */
function initTourButtons() {
    try {
        if (registerPointButton) {
            registerPointButton.addEventListener('click', handleRegisterPoint);
        }
        if (finishTourButton) {
            finishTourButton.addEventListener('click', handleFinishTour);
        }
        if (cancelTourButton) {
            cancelTourButton.addEventListener('click', handleCancelTour);
        }
    } catch (error) {
        console.error("Error initializing tour buttons:", error);
    }
}

// Initialize UI elements

// Initial setup - ensure menu is visible by default
if (menuElement) {
    menuElement.style.display = 'block';
}

// Initial setup - ensure stats are visible by default
if (statsElement) {
    statsElement.style.display = 'block';
}

/**
 * Initializes tour preset buttons based on available tour files
 * Loads tour data from JSON files and creates buttons for each tour
 */
async function initTourPresetButtons() {
    try {
        if (!tourPresetsElement) return;
        
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
                if (isTourPlaying()) {
                    console.log("Cannot start tour - another tour is already playing");
                    return;
                }
                
                // Start tour playback
                startTourPlayback(tour.data);
            });
            
            tourPresetsElement.appendChild(button);
        });
        
        console.log(`Added ${tours.length} tour preset button(s)`);
    } catch (error) {
        console.error("Error initializing tour preset buttons:", error);
    }
}

/**
 * Makes the tour menu draggable with mouse interactions
 * Allows users to reposition the tour menu by dragging its header
 */
function makeTourMenuDraggable() {
    try {
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
    } catch (error) {
        console.error("Error making tour menu draggable:", error);
    }
}

// Initialize UI components
initPresetButtons();
updatePresetMenuVisibility();
initTourButtons();
initTourPresetButtons().catch(error => console.error("Tour preset initialization failed:", error));
makeTourMenuDraggable();

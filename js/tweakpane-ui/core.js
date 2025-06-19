/**
 * Tweakpane UI Core Module
 * Contains the main initialization and global variables for the UI system
 * 
 * @module tweakpane-ui/core
 */

import { CONFIG } from '../config.js';
import { 
    colorSettings, 
    crossSectionSettings, 
    orbitTrapSettings, 
    physicsColorSettings 
} from '../fractal.js';
import { cameraState } from '../camera.js';

// Import section creators from other modules
import { createFractalParametersFolder } from './fractal.js';
import { createColorControlsFolder } from './color.js';
import { createRenderingFolder } from './rendering.js';
import { createCameraControlsFolder } from './camera.js';
import { createPresetsFolder } from './presets-ui.js';
import { createRecordingFolder } from './recording.js';
import { createInterfaceFolder } from './interface.js';
import { createSystemMonitorFolder, initializeMonitoring } from './monitoring.js';
import { createSettingsFolder } from './settings.js';
import { 
    initializePaneLayout, 
    createMainPane,
    createParametersPane, 
    createPresetsPane,
    refreshAllPanes,
    folders as layoutFolders
} from './layout.js';

// Export the panes for backward compatibility
export let pane = null; // Will be set to mainPane
export let container = null; // Will be set to main container

// Reference to folders for organization
export const folders = {};

// State binding objects for inputs that need special handling
export const bindingState = {
    // For handling palette selection which requires special logic
    paletteSelector: {
        value: 0, // Default: OFF
    },
    // For handling clip mode which cycles through options
    clipModeSelector: {
        value: 0, // Default: OFF
    },
    // For orbit trap type selection
    orbitTrapTypeSelector: {
        value: 0, // Default: Circle
    },
    // For physics color type selection
    physicsColorTypeSelector: {
        value: 0, // Default: Diffraction
    },
    // For camera focal length (zoom)
    focalLength: {
        value: 1.5 // Default value
    },
    // Recording controls
    recordingQuality: { value: 0 },
    recordingStatus: 'Stopped',
    screenshotFormat: { value: 0 },
    // Interface controls
    autoCollapse: { value: false },
    showLegacyMenu: { value: false },
    showLegacyPresets: { value: false },
    showLegacyStats: { value: false },
    tourStatus: 'Inactive',
    // Monitoring values
    currentFPS: 60.0,
    cameraVelocity: 0.0,
    appStatus: 'Running',
    animationStatus: 'Active',
    recordingStatusMonitor: 'Stopped',
    activeEffects: 'Basic'
};

/**
 * Creates and initializes the Tweakpane UI layout
 */
export function initTweakpane() {
    // Exit if already initialized
    if (pane) return;
    
    // Load Tweakpane from global scope (CDN)
    if (typeof Tweakpane === 'undefined') {
        console.error('Tweakpane is not loaded. Make sure to include it in your HTML.');
        return;
    }
    
    // Initialize the multi-pane layout
    if (!initializePaneLayout()) {
        return;
    }
    
    // Create the pane instances
    const mainPaneInstance = createMainPane();
    const parametersPaneInstance = createParametersPane();
    const presetsPaneInstance = createPresetsPane();
    
    // Set backward compatibility reference
    pane = mainPaneInstance;
    container = document.getElementById('tweakpane-main-container');
    
    // Create main controls (left side) - podstawowe kontrole bez presets i monitoring
    createFractalParametersFolder(mainPaneInstance);
    createColorControlsFolder(mainPaneInstance);
    createRenderingFolder(mainPaneInstance);
    createCameraControlsFolder(mainPaneInstance);
    createRecordingFolder(mainPaneInstance);
    createSettingsFolder(mainPaneInstance);
    createInterfaceFolder(mainPaneInstance);
    
    // Create parameters monitor (right side) - System Monitor
    createSystemMonitorFolder(parametersPaneInstance);
    
    // Create presets panel (top center, collapsed) - Quaternion & Tour Presets
    createPresetsFolder(presetsPaneInstance);
    
    // Add toggle buttons for all panes (simplified version)
    addSimpleToggleButtons();
    
    // Initialize monitoring system
    initializeMonitoring();
    
    // Ensure legacy UI is hidden by default
    ensureLegacyUIHidden();
    
    // Block scroll events for all Tweakpane containers
    blockScrollOnTweakpaneContainers();
    
    console.log('Multi-pane Tweakpane UI initialized');
}

// Functions removed - now handled by layout.js

/**
 * Adds simple toggle buttons that work with layout.js
 */
function addSimpleToggleButtons() {
    // Import toggle functions from layout.js
    import('./layout.js').then(module => {
        // Main controls toggle (G key functionality)
        document.addEventListener('keydown', (event) => {
            if (event.key.toLowerCase() === 'g') {
                module.togglePaneVisibility('main');
            }
        });
        
        console.log('Pane toggle functionality initialized (G key for main controls)');
    });
}

/**
 * Ensures legacy UI panels are hidden by default
 */
function ensureLegacyUIHidden() {
    // Wait for DOM to be ready
    setTimeout(() => {
        const legacyMenu = document.getElementById('menu');
        const legacyPresets = document.getElementById('preset-menu');
        const legacyStats = document.getElementById('stats');
        
        if (legacyMenu) {
            legacyMenu.style.display = 'none';
        }
        if (legacyPresets) {
            legacyPresets.style.display = 'none';
        }
        if (legacyStats) {
            legacyStats.style.display = 'none';
        }
        
        console.log('Legacy UI panels explicitly hidden');
    }, 100); // Small delay to ensure DOM is ready
}

/**
 * Blocks scroll events on all Tweakpane containers to prevent interference with main app
 */
function blockScrollOnTweakpaneContainers() {
    // Wait for containers to be created
    setTimeout(() => {
        const containers = [
            'tweakpane-main-container',
            'tweakpane-parameters-container', 
            'tweakpane-presets-container'
        ];
        
        containers.forEach(containerId => {
            const container = document.getElementById(containerId);
            if (container) {
                container.addEventListener('wheel', (e) => {
                    e.stopPropagation();
                }, { passive: false });
                
                console.log(`Scroll blocking enabled for ${containerId}`);
            }
        });
    }, 200); // Small delay to ensure containers are created
}

/**
 * Syncs UI controls with current state
 */
export function refreshUI() {
    if (!pane) return;
    
    // Update binding state objects
    bindingState.paletteSelector.value = colorSettings.paletteIndex;
    bindingState.clipModeSelector.value = crossSectionSettings.clipMode;
    bindingState.orbitTrapTypeSelector.value = orbitTrapSettings.type;
    bindingState.physicsColorTypeSelector.value = physicsColorSettings.type;
    bindingState.focalLength.value = cameraState.focalLength;
    
    // Refresh all panes
    refreshAllPanes();
}

/**
 * Toggles the visibility of the Tweakpane UI panel
 * Can be called via keyboard shortcut
 */
export function toggleTweakpaneVisibility() {
    if (!container) return;
    
    const toggleButton = document.getElementById('tweakpane-toggle');
    
    if (container.style.display === 'none') {
        container.style.display = 'block';
        if (toggleButton) toggleButton.style.left = '310px';
        console.log('Tweakpane UI: Visible');
    } else {
        container.style.display = 'none';
        if (toggleButton) toggleButton.style.left = '10px';
        console.log('Tweakpane UI: Hidden');
    }
}

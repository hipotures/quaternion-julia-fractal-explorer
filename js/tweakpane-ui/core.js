/**
 * Tweakpane UI Core Module
 * Contains the main initialization and global variables for the UI system
 * 
 * @module tweakpane-ui/core
 */

import { CONFIG } from '../config.js';

// Import section creators from other modules
import { createFractalParametersFolder } from './fractal.js';
import { createColorControlsFolder } from './color.js';
import { createRenderingFolder } from './rendering.js';
import { createCameraControlsFolder } from './camera.js';
import { createPresetsFolder } from './presets-ui.js';

// The main Tweakpane instance
export let pane = null;

// Container element for the panel
export let container = null;

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
    }
};

/**
 * Creates and initializes the Tweakpane panel
 */
export function initTweakpane() {
    // Exit if already initialized
    if (pane) return;
    
    // Create container if it doesn't exist
    if (!document.getElementById('tweakpane-container')) {
        container = document.createElement('div');
        container.id = 'tweakpane-container';
        document.body.appendChild(container);
        
        // Apply styles
        container.style.position = 'absolute';
        container.style.top = '10px';
        container.style.left = '10px';
        container.style.zIndex = '1000';
        container.style.maxHeight = '95vh';
        container.style.overflow = 'auto';
        container.style.backgroundColor = 'rgba(29, 29, 32, 0.8)';
        container.style.borderRadius = '6px';
    } else {
        container = document.getElementById('tweakpane-container');
    }
    
    // Load Tweakpane from global scope (CDN)
    if (typeof Tweakpane === 'undefined') {
        console.error('Tweakpane is not loaded. Make sure to include it in your HTML.');
        return;
    }
    
    // Create the pane instance
    pane = new Tweakpane.Pane({
        title: 'Fractal Controls',
        expanded: true,
        container: container
    });
    
    // Initialize all folders and controls
    createFractalParametersFolder();
    createColorControlsFolder();
    createRenderingFolder();
    createCameraControlsFolder();
    createPresetsFolder();
    
    // Add button to toggle panel visibility
    addPanelToggleButton();
    
    console.log('Tweakpane UI initialized');
}

/**
 * Adds a button to toggle the entire panel
 */
function addPanelToggleButton() {
    // Create a button element
    const toggleButton = document.createElement('button');
    toggleButton.textContent = '≡'; // Hamburger icon
    toggleButton.title = 'Toggle Controls Panel';
    toggleButton.id = 'tweakpane-toggle';
    
    // Style the button
    Object.assign(toggleButton.style, {
        position: 'absolute',
        top: '10px',
        left: container.style.display === 'none' ? '10px' : '310px', // Adjust based on visibility
        zIndex: '1001',
        width: '30px',
        height: '30px',
        borderRadius: '50%',
        background: 'rgba(40, 40, 45, 0.8)',
        color: 'white',
        border: 'none',
        fontSize: '20px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'left 0.3s ease-in-out'
    });
    
    // Add to document body
    document.body.appendChild(toggleButton);
    
    // Add event listener
    toggleButton.addEventListener('click', () => {
        if (container.style.display === 'none') {
            container.style.display = 'block';
            toggleButton.style.left = '310px';
        } else {
            container.style.display = 'none';
            toggleButton.style.left = '10px';
        }
    });
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
    
    // Refresh all controls
    pane.refresh();
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

// Import required settings for refreshUI
import { 
    colorSettings, 
    crossSectionSettings, 
    orbitTrapSettings, 
    physicsColorSettings 
} from '../fractal.js';
import { cameraState } from '../camera.js';

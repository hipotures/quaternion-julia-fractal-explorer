/**
 * Tweakpane UI Layout Management Module
 * Creates multiple Tweakpane instances positioned at different screen locations
 * 
 * @module tweakpane-ui/layout
 */

import { Pane } from '../lib/tweakpane.min.js';
import { CONFIG } from '../config.js';
import { bindingState } from './core.js';

// Multiple pane instances for different screen positions
export let mainPane = null;        // Left side - main controls
export let parametersPane = null;  // Right side - parameters monitor  
export let presetsPane = null;     // Top center - presets (collapsed by default)

// Container elements
export let mainContainer = null;
export let parametersContainer = null;
export let presetsContainer = null;

// Folders for organization
export const folders = {};

/**
 * Creates the main controls pane (left side)
 */
export function createMainPane() {
    if (mainPane) return mainPane;
    
    // Create container
    if (!document.getElementById('tweakpane-main-container')) {
        mainContainer = document.createElement('div');
        mainContainer.id = 'tweakpane-main-container';
        document.body.appendChild(mainContainer);
        
        // Style main container (left side)
        Object.assign(mainContainer.style, {
            position: 'absolute',
            top: '10px',
            left: '10px',
            zIndex: '1000',
            maxHeight: '95vh',
            overflow: 'auto',
            backgroundColor: 'rgba(29, 29, 32, 0.8)',
            borderRadius: '6px'
        });
    } else {
        mainContainer = document.getElementById('tweakpane-main-container');
    }
    
    // Create the main pane
    mainPane = new Pane({
        title: 'Controls',
        expanded: true,
        container: mainContainer
    });
    
    return mainPane;
}

/**
 * Creates the parameters monitor pane (right side)
 */
export function createParametersPane() {
    if (parametersPane) return parametersPane;
    
    // Create container
    if (!document.getElementById('tweakpane-parameters-container')) {
        parametersContainer = document.createElement('div');
        parametersContainer.id = 'tweakpane-parameters-container';
        document.body.appendChild(parametersContainer);
        
        // Style parameters container (right side)
        Object.assign(parametersContainer.style, {
            position: 'absolute',
            top: '10px',
            right: '10px',
            zIndex: '1000',
            maxHeight: '95vh',
            overflow: 'auto',
            backgroundColor: 'rgba(29, 29, 32, 0.8)',
            borderRadius: '6px'
        });
    } else {
        parametersContainer = document.getElementById('tweakpane-parameters-container');
    }
    
    // Create the parameters pane
    parametersPane = new Pane({
        title: 'Parameters Monitor',
        expanded: true,
        container: parametersContainer
    });
    
    return parametersPane;
}

/**
 * Creates the presets pane (top center, collapsed by default)
 */
export function createPresetsPane() {
    if (presetsPane) return presetsPane;
    
    // Create container
    if (!document.getElementById('tweakpane-presets-container')) {
        presetsContainer = document.createElement('div');
        presetsContainer.id = 'tweakpane-presets-container';
        document.body.appendChild(presetsContainer);
        
        // Style presets container (top center)
        Object.assign(presetsContainer.style, {
            position: 'absolute',
            top: '10px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: '1000',
            maxHeight: '80vh',
            overflow: 'auto',
            backgroundColor: 'rgba(29, 29, 32, 0.8)',
            borderRadius: '6px',
            maxWidth: '400px'
        });
    } else {
        presetsContainer = document.getElementById('tweakpane-presets-container');
    }
    
    // Create the presets pane (collapsed by default)
    presetsPane = new Pane({
        title: 'Presets & Tours',
        expanded: false, // Collapsed by default as requested
        container: presetsContainer
    });
    
    return presetsPane;
}

/**
 * Initialize all pane containers
 */
export function initializePaneLayout() {
    // Tweakpane is now imported as ES6 module
    
    // Create all panes
    createMainPane();
    createParametersPane();
    createPresetsPane();
    
    console.log('Multi-pane layout initialized');
    return true;
}

/**
 * Refreshes all panes
 */
export function refreshAllPanes() {
    if (mainPane) mainPane.refresh();
    if (parametersPane) parametersPane.refresh();
    if (presetsPane) presetsPane.refresh();
}

/**
 * Toggles visibility of a specific pane
 */
export function togglePaneVisibility(paneName) {
    let container = null;
    
    switch (paneName) {
        case 'main':
            container = mainContainer;
            break;
        case 'parameters':
            container = parametersContainer;
            break;
        case 'presets':
            container = presetsContainer;
            break;
    }
    
    if (container) {
        const isVisible = container.style.display !== 'none';
        container.style.display = isVisible ? 'none' : 'block';
    }
}
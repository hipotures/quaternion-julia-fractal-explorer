/**
 * Tweakpane UI Interface Module
 * Contains controls for interface management and panel toggles
 * 
 * @module tweakpane-ui/interface
 */

import { pane, folders, bindingState } from './core.js';

/**
 * Creates the interface controls section
 */
export function createInterfaceFolder(targetPane = null) {
    const usePane = targetPane || pane;
    
    // Create main folder
    folders.interface = usePane.addFolder({
        title: 'Interface & Navigation',
        expanded: true
    });
    
    // Create sub-sections
    createPanelControlsFolder();
}

/**
 * Creates panel visibility controls sub-section
 */
function createPanelControlsFolder() {
    const panelFolder = folders.interface.addFolder({
        title: 'Panel Controls',
        expanded: true
    });
    
    // Panel visibility controls for recording
    panelFolder.addButton({
        title: '📊 Toggle Parameters Monitor (P)'
    }).on('click', () => {
        import('./layout.js').then(module => {
            module.togglePaneVisibility('parameters');
        });
    });
    
    panelFolder.addButton({
        title: '🎛️ Toggle Presets & Tours Panel'
    }).on('click', () => {
        import('./layout.js').then(module => {
            module.togglePaneVisibility('presets');
        });
    });
    
    panelFolder.addButton({
        title: '🙈 Hide All Panels (H)'
    }).on('click', () => {
        import('./layout.js').then(module => {
            module.hideAllPanes();
        });
    });
    
    panelFolder.addButton({
        title: '👁️ Show All Panels (U)'
    }).on('click', () => {
        import('./layout.js').then(module => {
            module.showAllPanes();
        });
    });
    
    // Tweakpane auto-collapse toggle
    bindingState.autoCollapse = { value: false };
    panelFolder.addBinding(bindingState.autoCollapse, 'value', {
        label: 'Auto-collapse panels'
    }).on('change', (ev) => {
        // Implementation for auto-collapse behavior
        if (ev.value) {
            // Collapse all folders except the current one being used
            Object.keys(folders).forEach(key => {
                if (folders[key] && folders[key].expanded !== undefined) {
                    folders[key].expanded = false;
                }
            });
        }
    });
}


// Tour UI functions moved to presets-ui.js

/**
 * Refreshes interface UI elements (call this periodically)
 */
export function refreshInterfaceUI() {
    // Tour UI updates now handled in presets-ui.js
}
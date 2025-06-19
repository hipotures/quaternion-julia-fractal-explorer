/**
 * Tweakpane UI Interface Module
 * Contains controls for interface management and panel toggles
 * 
 * @module tweakpane-ui/interface
 */

import { pane, folders, bindingState } from './core.js';
import { toggleStats, toggleMenu } from '../ui.js';

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
    createLegacyMenuFolder();
}

/**
 * Creates panel visibility controls sub-section
 */
function createPanelControlsFolder() {
    const panelFolder = folders.interface.addFolder({
        title: 'Panel Controls',
        expanded: true
    });
    
    // Stats panel toggle
    panelFolder.addButton({
        title: '📊 Toggle Stats Panel (P)'
    }).on('click', () => {
        toggleStats();
    });
    
    // Legacy menu toggle (for verification)
    panelFolder.addButton({
        title: '📋 Toggle Legacy Menu (M)'
    }).on('click', () => {
        toggleMenu();
    });
    
    // Presets menu toggle
    panelFolder.addButton({
        title: '🎛️ Toggle Presets Menu'
    }).on('click', () => {
        const presetMenuElement = document.getElementById('preset-menu');
        if (presetMenuElement) {
            const isVisible = presetMenuElement.style.display !== 'none';
            presetMenuElement.style.display = isVisible ? 'none' : 'flex';
        }
    });
    
    // Tweakpane auto-collapse toggle
    bindingState.autoCollapse = { value: false };
    panelFolder.addInput(bindingState.autoCollapse, 'value', {
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

// Tour System moved to presets-ui.js

/**
 * Creates legacy menu controls sub-section
 */
function createLegacyMenuFolder() {
    const legacyFolder = folders.interface.addFolder({
        title: 'Legacy UI (Verification)',
        expanded: false // Collapsed by default since it's for verification only
    });
    
    // Legacy menu visibility toggle
    legacyFolder.addInput(bindingState.showLegacyMenu, 'value', {
        label: 'Show Legacy Menu (Left)'
    }).on('change', (ev) => {
        const menuElement = document.getElementById('menu');
        if (menuElement) {
            menuElement.style.display = ev.value ? 'block' : 'none';
        }
    });
    
    // Legacy preset menu toggle
    legacyFolder.addInput(bindingState.showLegacyPresets, 'value', {
        label: 'Show Legacy Presets (Top)'
    }).on('change', (ev) => {
        const presetMenuElement = document.getElementById('preset-menu');
        if (presetMenuElement) {
            presetMenuElement.style.display = ev.value ? 'flex' : 'none';
        }
    });
    
    // Legacy stats panel toggle
    legacyFolder.addInput(bindingState.showLegacyStats, 'value', {
        label: 'Show Legacy Stats (Right)'
    }).on('change', (ev) => {
        const statsElement = document.getElementById('stats');
        if (statsElement) {
            statsElement.style.display = ev.value ? 'block' : 'none';
        }
    });
    
    // Information text
    legacyFolder.addButton({
        title: 'ℹ️ Legacy UI Info'
    }).on('click', () => {
        alert('The legacy UI panels are kept for feature comparison and verification. All functionality has been moved to this modern Tweakpane interface. Use the toggles above to show/hide the old panels for comparison.');
    });
    
    // Show all legacy UI button
    legacyFolder.addButton({
        title: '👁️ Show All Legacy UI'
    }).on('click', () => {
        bindingState.showLegacyMenu.value = true;
        bindingState.showLegacyPresets.value = true;
        bindingState.showLegacyStats.value = true;
        
        // Apply changes
        document.getElementById('menu').style.display = 'block';
        document.getElementById('preset-menu').style.display = 'flex';
        document.getElementById('stats').style.display = 'block';
        
        // Refresh UI to show updated toggles
        import('./core.js').then(module => {
            if (module.refreshUI) module.refreshUI();
        });
    });
    
    // Hide all legacy UI button
    legacyFolder.addButton({
        title: '🙈 Hide All Legacy UI'
    }).on('click', () => {
        bindingState.showLegacyMenu.value = false;
        bindingState.showLegacyPresets.value = false;
        bindingState.showLegacyStats.value = false;
        
        // Apply changes
        document.getElementById('menu').style.display = 'none';
        document.getElementById('preset-menu').style.display = 'none';
        document.getElementById('stats').style.display = 'none';
        
        // Refresh UI to show updated toggles
        import('./core.js').then(module => {
            if (module.refreshUI) module.refreshUI();
        });
    });
}

// Tour UI functions moved to presets-ui.js

/**
 * Refreshes interface UI elements (call this periodically)
 */
export function refreshInterfaceUI() {
    // Tour UI updates now handled in presets-ui.js
}
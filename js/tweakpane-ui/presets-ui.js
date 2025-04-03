/**
 * Tweakpane UI Presets Folder Module
 * Contains UI controls for presets management
 * 
 * @module tweakpane-ui/presets-ui
 */

import { pane, folders } from './core.js';
import { resetAllToDefaults } from './settings-reset.js';
import { saveCurrentSettings, loadSavedSettings } from './settings-storage.js';
import { exportSettingsToFile, importSettingsFromFile } from './settings-io.js';

/**
 * Creates the presets management section in the UI
 */
export function createPresetsFolder() {
    // Create main folder
    folders.presets = pane.addFolder({
        title: 'Presets & Settings',
        expanded: true
    });
    
    // Reset all to default values button
    folders.presets.addButton({
        title: '🔄 Reset All to Defaults'
    }).on('click', () => {
        resetAllToDefaults();
    });
    
    // Save current state
    folders.presets.addButton({
        title: '💾 Save Current Settings'
    }).on('click', () => {
        saveCurrentSettings();
    });
    
    // Load state from localStorage
    folders.presets.addButton({
        title: '📂 Load Saved Settings'
    }).on('click', () => {
        loadSavedSettings();
    });
    
    // Export to file
    folders.presets.addButton({
        title: '📤 Export Settings to File'
    }).on('click', () => {
        exportSettingsToFile();
    });
    
    // Import from file button
    folders.presets.addButton({
        title: '📥 Import Settings from File'
    }).on('click', () => {
        importSettingsFromFile();
    });
}

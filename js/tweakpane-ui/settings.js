/**
 * Tweakpane UI Settings Management Module
 * Contains controls for settings import/export and reset functionality
 * 
 * @module tweakpane-ui/settings
 */

import { pane, folders } from './core.js';
import { resetAllToDefaults } from './settings-reset.js';
import { saveCurrentSettings, loadSavedSettings } from './settings-storage.js';
import { exportSettingsToFile, importSettingsFromFile } from './settings-io.js';

/**
 * Creates the settings management section
 */
export function createSettingsFolder(targetPane = null) {
    const usePane = targetPane || pane;
    
    // Create main folder
    folders.settings = usePane.addFolder({
        title: 'Settings Management',
        expanded: true
    });
    
    // Reset all to default values button
    folders.settings.addButton({
        title: '🔄 Reset All to Defaults'
    }).on('click', () => {
        resetAllToDefaults();
    });
    
    // Save current state
    folders.settings.addButton({
        title: '💾 Save Current Settings'
    }).on('click', () => {
        saveCurrentSettings();
    });
    
    // Load state from localStorage
    folders.settings.addButton({
        title: '📂 Load Saved Settings'
    }).on('click', () => {
        loadSavedSettings();
    });
    
    // Export to file
    folders.settings.addButton({
        title: '📤 Export Settings to File'
    }).on('click', () => {
        exportSettingsToFile();
    });
    
    // Import from file button
    folders.settings.addButton({
        title: '📥 Import Settings from File'
    }).on('click', () => {
        importSettingsFromFile();
    });
}
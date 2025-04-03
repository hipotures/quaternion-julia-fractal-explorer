/**
 * Tweakpane UI Settings I/O Module
 * Contains functionality for importing/exporting settings to/from files
 * 
 * @module tweakpane-ui/settings-io
 */

import { getSettingsSnapshot } from './settings-snapshot.js';
import { applySettings } from './settings-apply.js';

/**
 * Exports the current settings to a JSON file
 */
export function exportSettingsToFile() {
    try {
        // Get settings
        const settings = getSettingsSnapshot();
        
        // Convert to JSON
        const jsonStr = JSON.stringify(settings, null, 2);
        
        // Create data URL
        const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(jsonStr);
        
        // Create download link
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute('href', dataStr);
        downloadAnchorNode.setAttribute('download', 'fractal-settings.json');
        
        // Trigger download
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    } catch (error) {
        console.error('Error exporting settings:', error);
        alert('Failed to export settings. See console for details.');
    }
}

/**
 * Creates a file input element to import settings from a JSON file
 */
export function importSettingsFromFile() {
    // Create file input
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    // Add event listener
    input.onchange = event => {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = e => {
            try {
                const settings = JSON.parse(e.target.result);
                applySettings(settings);
                alert('Settings imported successfully');
            } catch (error) {
                console.error('Error parsing settings file:', error);
                alert('Failed to import settings. Invalid file format.');
            }
        };
        reader.readAsText(file);
    };
    
    // Trigger file selection
    input.click();
}

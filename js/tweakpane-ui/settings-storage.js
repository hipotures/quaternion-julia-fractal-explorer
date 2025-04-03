/**
 * Tweakpane UI Settings Storage Module
 * Contains functionality for saving/loading settings to/from localStorage
 * 
 * @module tweakpane-ui/settings-storage
 */

import { getSettingsSnapshot } from './settings-snapshot.js';
import { applySettings } from './settings-apply.js';
import { refreshUI } from './core.js';

/**
 * Saves current settings to localStorage
 */
export function saveCurrentSettings() {
    try {
        // Get timestamp for preset name
        const timestamp = new Date().toLocaleString().replace(/[/:]/g, '-');
        const presetName = `fractal-preset-${timestamp}`;
        
        // Get settings
        const settings = getSettingsSnapshot();
        
        // Get existing presets
        let presets = JSON.parse(localStorage.getItem('fractalExplorerPresets') || '{}');
        
        // Add new preset
        presets[presetName] = settings;
        
        // Save back to localStorage
        localStorage.setItem('fractalExplorerPresets', JSON.stringify(presets));
        
        alert(`Settings saved as "${presetName}"`);
    } catch (error) {
        console.error('Error saving settings:', error);
        alert('Failed to save settings. See console for details.');
    }
}

/**
 * Shows a dialog to select and load saved settings
 */
export function loadSavedSettings() {
    try {
        // Get all saved presets
        const presets = JSON.parse(localStorage.getItem('fractalExplorerPresets') || '{}');
        const presetNames = Object.keys(presets);
        
        if (presetNames.length === 0) {
            alert('No saved settings found');
            return;
        }
        
        // Create a simple selection dialog
        const dialog = createSettingsDialog(presetNames, presets);
        
        // Add dialog to document
        document.body.appendChild(dialog);
    } catch (error) {
        console.error('Error loading settings:', error);
        alert('Failed to load settings. See console for details.');
    }
}

/**
 * Creates a settings selection dialog
 * @param {string[]} presetNames - Array of preset names
 * @param {Object} presets - Object containing presets data
 * @returns {HTMLElement} The dialog element
 */
function createSettingsDialog(presetNames, presets) {
    const dialog = document.createElement('div');
    dialog.id = 'settings-dialog';
    Object.assign(dialog.style, {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        background: 'rgba(40, 40, 45, 0.95)',
        border: '1px solid #555',
        borderRadius: '8px',
        padding: '20px',
        color: 'white',
        maxWidth: '80%',
        maxHeight: '80vh',
        overflow: 'auto',
        zIndex: '2000'
    });
    
    // Add title
    const title = document.createElement('h2');
    title.textContent = 'Load Saved Settings';
    title.style.marginTop = '0';
    dialog.appendChild(title);
    
    // Add preset list
    const list = createPresetList(presetNames, presets, dialog);
    dialog.appendChild(list);
    
    // Add cancel button
    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'Cancel';
    Object.assign(cancelButton.style, {
        background: '#444',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        padding: '8px 16px',
        marginTop: '15px',
        cursor: 'pointer'
    });
    
    cancelButton.addEventListener('click', () => {
        document.body.removeChild(dialog);
    });
    
    dialog.appendChild(cancelButton);
    
    return dialog;
}

/**
 * Creates the list of presets for the dialog
 * @param {string[]} presetNames - Array of preset names
 * @param {Object} presets - Object containing presets data
 * @param {HTMLElement} dialog - The parent dialog element
 * @returns {HTMLElement} The list element
 */
function createPresetList(presetNames, presets, dialog) {
    const list = document.createElement('ul');
    Object.assign(list.style, {
        listStyle: 'none',
        padding: '0',
        margin: '10px 0'
    });
    
    presetNames.forEach(name => {
        const item = document.createElement('li');
        const button = document.createElement('button');
        button.textContent = name;
        Object.assign(button.style, {
            background: '#333',
            color: 'white',
            border: '1px solid #555',
            borderRadius: '4px',
            padding: '8px 12px',
            margin: '4px 0',
            width: '100%',
            textAlign: 'left',
            cursor: 'pointer'
        });
        
        button.addEventListener('click', () => {
            applySettings(presets[name]);
            document.body.removeChild(dialog);
        });
        
        item.appendChild(button);
        list.appendChild(item);
    });
    
    return list;
}

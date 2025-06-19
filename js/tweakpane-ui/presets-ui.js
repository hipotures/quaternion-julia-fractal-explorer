/**
 * Tweakpane UI Presets Folder Module
 * Contains UI controls for presets management, quaternion presets, and tour presets
 * 
 * @module tweakpane-ui/presets-ui
 */

import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';
import { pane, folders, bindingState } from './core.js';
import { resetAllToDefaults } from './settings-reset.js';
import { saveCurrentSettings, loadSavedSettings } from './settings-storage.js';
import { exportSettingsToFile, importSettingsFromFile } from './settings-io.js';
import { fractalState } from '../fractal.js';
import { cameraState, startTargetAnimation, updateCameraState } from '../camera.js';
import { updateFractalParamsUniform } from '../shaders.js';
import { loadAvailableTours, startTourPlayback } from '../tour.js';
import { 
    startTourRecording,
    registerTourPoint,
    finishTourRecording,
    cancelTourRecording,
    isTourRecording,
    getTourPointCount,
    isTourPlaying,
    stopTourPlayback
} from '../tour.js';
import { toggleTourMenu } from '../ui.js';

/**
 * Predefined quaternion parameter presets from the legacy UI
 */
const quaternionPresets = [
    { name: 'Q01', params: new THREE.Vector4(-1.0, 0.2, 0.0, 0.0) },
    { name: 'Q02', params: new THREE.Vector4(-0.291, -0.399, 0.339, 0.437) },
    { name: 'Q03', params: new THREE.Vector4(-0.2, 0.4, -0.4, -0.4) },
    { name: 'Q04', params: new THREE.Vector4(-0.213, -0.041, -0.563, -0.560) },
    { name: 'Q05', params: new THREE.Vector4(-0.2, 0.6, 0.2, 0.2) },
    { name: 'Q06', params: new THREE.Vector4(-0.162, 0.163, 0.560, -0.599) },
    { name: 'Q07', params: new THREE.Vector4(-0.2, 0.8, 0.0, 0.0) },
    { name: 'Q08', params: new THREE.Vector4(-0.445, 0.339, -0.0889, -0.562) },
    { name: 'Q09', params: new THREE.Vector4(0.185, 0.478, 0.125, -0.392) },
    { name: 'Q10', params: new THREE.Vector4(-0.450, -0.447, 0.181, 0.306) },
    { name: 'Q11', params: new THREE.Vector4(-0.218, -0.113, -0.181, -0.496) },
    { name: 'Q12', params: new THREE.Vector4(-0.137, -0.630, -0.475, -0.046) },
    { name: 'Q13', params: new THREE.Vector4(-0.125, -0.256, 0.847, 0.0895) }
];

/**
 * Creates the presets management section in the UI
 */
export function createPresetsFolder(targetPane = null) {
    const usePane = targetPane || pane;
    
    // Create sub-sections directly in the pane (no wrapper folder needed)
    createQuaternionPresetsFolder(usePane);
    createTourPresetsFolder(usePane);
    createTourControlsFolder(usePane);
}

/**
 * Creates the quaternion presets sub-section
 */
function createQuaternionPresetsFolder(parentPane) {
    const quaternionFolder = parentPane.addFolder({
        title: 'Quaternion Presets',
        expanded: true
    });
    
    // Create button that shows quaternion preset menu
    quaternionFolder.addButton({
        title: '▼ Select Quaternion Preset'
    }).on('click', () => {
        showQuaternionPresetMenu();
    });
}

/**
 * Creates the tour presets sub-section
 */
function createTourPresetsFolder(parentPane) {
    const tourFolder = parentPane.addFolder({
        title: 'Tour Presets',
        expanded: true
    });
    
    // Load available tours and create button
    loadAvailableTours().then(tours => {
        if (tours.length > 0) {
            // Store tours globally for menu access
            window.availableTours = tours;
            
            // Create button that shows tour preset menu
            tourFolder.addButton({
                title: '▼ Select Tour'
            }).on('click', () => {
                showTourPresetMenu(tours);
            });
        } else {
            // Show message when no tours available
            tourFolder.addButton({
                title: 'No tours available'
            }).disabled = true;
        }
    }).catch(error => {
        console.error('Error loading tours for UI:', error);
        tourFolder.addButton({
            title: 'Error loading tours'
        }).disabled = true;
    });
}

/**
 * Creates tour system controls sub-section
 */
function createTourControlsFolder(parentPane) {
    const tourFolder = parentPane.addFolder({
        title: 'Tour System',
        expanded: true
    });
    
    // Tour recording controls
    tourFolder.addButton({
        title: '🎬 Start Tour Recording (T)'
    }).on('click', () => {
        if (!isTourRecording()) {
            startTourRecording();
            console.log('Tour recording started');
            updateTourUI();
        } else {
            toggleTourMenu(); // Open tour menu if already recording
        }
    });
    
    tourFolder.addButton({
        title: '📍 Register Point'
    }).on('click', () => {
        if (isTourRecording()) {
            registerTourPoint();
            updateTourUI();
        } else {
            console.warn('Tour recording is not active');
        }
    });
    
    tourFolder.addButton({
        title: '✅ Finish Tour'
    }).on('click', () => {
        if (isTourRecording()) {
            finishTourRecording();
            updateTourUI();
        } else {
            console.warn('Tour recording is not active');
        }
    });
    
    tourFolder.addButton({
        title: '❌ Cancel Tour'
    }).on('click', () => {
        if (isTourRecording()) {
            const confirmed = confirm('Are you sure you want to cancel tour recording? All recorded points will be lost.');
            if (confirmed) {
                cancelTourRecording();
                updateTourUI();
            }
        } else {
            console.warn('Tour recording is not active');
        }
    });
    
    // Tour playback controls
    tourFolder.addButton({
        title: '⏹️ Stop Tour Playback (Esc)'
    }).on('click', () => {
        if (isTourPlaying()) {
            stopTourPlayback();
        } else {
            console.log('No tour is currently playing');
        }
    });
    
    // Tour status monitor
    tourFolder.addMonitor(bindingState, 'tourStatus', {
        label: 'Tour Status',
        view: 'text'
    });
    
    // Update initial tour status
    updateTourUI();
}

/**
 * Updates tour UI status information
 */
function updateTourUI() {
    if (!bindingState.tourStatus) {
        bindingState.tourStatus = '';
    }
    
    if (isTourRecording()) {
        const pointCount = getTourPointCount();
        bindingState.tourStatus = `🔴 Recording: ${pointCount} points`;
    } else if (isTourPlaying()) {
        bindingState.tourStatus = '▶️ Playing tour';
    } else {
        bindingState.tourStatus = '⚫ Inactive';
    }
}

/**
 * Shows context menu for quaternion presets
 */
function showQuaternionPresetMenu() {
    const menu = document.createElement('div');
    menu.className = 'preset-context-menu';
    menu.style.cssText = `
        position: absolute;
        background: rgba(40, 40, 45, 0.95);
        border: 1px solid #555;
        border-radius: 4px;
        padding: 4px 0;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        min-width: 300px;
        max-height: 300px;
        overflow-y: auto;
    `;
    
    quaternionPresets.forEach((preset, index) => {
        const item = document.createElement('div');
        item.style.cssText = `
            padding: 8px 12px;
            cursor: pointer;
            color: white;
            font-size: 11px;
            border-bottom: 1px solid #333;
        `;
        item.textContent = `${preset.name} (${preset.params.x.toFixed(2)}, ${preset.params.y.toFixed(2)}, ${preset.params.z.toFixed(2)}, ${preset.params.w.toFixed(2)})`;
        
        item.addEventListener('mouseenter', () => {
            item.style.backgroundColor = '#555';
        });
        item.addEventListener('mouseleave', () => {
            item.style.backgroundColor = 'transparent';
        });
        item.addEventListener('click', () => {
            loadQuaternionPreset(index);
            document.body.removeChild(menu);
        });
        
        menu.appendChild(item);
    });
    
    // Position menu in center of screen
    menu.style.left = '50%';
    menu.style.top = '30%';
    menu.style.transform = 'translateX(-50%)';
    
    document.body.appendChild(menu);
    
    // Block scroll events from propagating to main app when mouse is over menu
    menu.addEventListener('wheel', (e) => {
        e.stopPropagation();
    }, { passive: false });
    
    // Close menu when clicking outside
    const closeMenu = (e) => {
        if (!menu.contains(e.target)) {
            document.body.removeChild(menu);
            document.removeEventListener('click', closeMenu);
        }
    };
    setTimeout(() => document.addEventListener('click', closeMenu), 100);
}

/**
 * Shows context menu for tour presets
 */
function showTourPresetMenu(tours) {
    const menu = document.createElement('div');
    menu.className = 'preset-context-menu';
    menu.style.cssText = `
        position: absolute;
        background: rgba(40, 40, 45, 0.95);
        border: 1px solid #555;
        border-radius: 4px;
        padding: 4px 0;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        min-width: 300px;
        max-height: 300px;
        overflow-y: auto;
    `;
    
    tours.forEach((tour, index) => {
        const tourNumber = (index + 1).toString().padStart(2, '0');
        const item = document.createElement('div');
        item.style.cssText = `
            padding: 8px 12px;
            cursor: pointer;
            color: white;
            font-size: 11px;
            border-bottom: 1px solid #333;
        `;
        item.textContent = `T${tourNumber}: ${tour.name} (${tour.pointCount} points)`;
        
        item.addEventListener('mouseenter', () => {
            item.style.backgroundColor = '#555';
        });
        item.addEventListener('mouseleave', () => {
            item.style.backgroundColor = 'transparent';
        });
        item.addEventListener('click', () => {
            startTourPlayback(tour.data);
            document.body.removeChild(menu);
        });
        
        menu.appendChild(item);
    });
    
    // Position menu in center of screen
    menu.style.left = '50%';
    menu.style.top = '30%';
    menu.style.transform = 'translateX(-50%)';
    
    document.body.appendChild(menu);
    
    // Block scroll events from propagating to main app when mouse is over menu
    menu.addEventListener('wheel', (e) => {
        e.stopPropagation();
    }, { passive: false });
    
    // Close menu when clicking outside
    const closeMenu = (e) => {
        if (!menu.contains(e.target)) {
            document.body.removeChild(menu);
            document.removeEventListener('click', closeMenu);
        }
    };
    setTimeout(() => document.addEventListener('click', closeMenu), 100);
}

/**
 * Loads a quaternion parameter preset and updates the fractal
 * @param {number} index - Index of the preset to load (0-12)
 */
function loadQuaternionPreset(index) {
    try {
        if (index < 0 || index >= quaternionPresets.length) return;
        
        const preset = quaternionPresets[index];
        
        // Copy preset to fractal parameters
        fractalState.params.copy(preset.params);
        
        // Update the shader uniform
        updateFractalParamsUniform(fractalState.params);
        
        // Reset camera as in R key operation (but keep our parameters)
        cameraState.focalLength = cameraState.defaultFocalLength;
        cameraState.isReturningToStart = true;
        startTargetAnimation(cameraState.initialCenter);
        cameraState.moveVelocity = 0;
        cameraState.isMovingForward = false;
        
        // Refresh all UI panels to reflect new parameter values
        import('./core.js').then(module => {
            if (module.refreshUI) {
                module.refreshUI();
            }
        });
        
        console.log(`Loaded ${preset.name}: (${preset.params.x.toFixed(3)}, ${preset.params.y.toFixed(3)}, ${preset.params.z.toFixed(3)}, ${preset.params.w.toFixed(3)})`);
    } catch (error) {
        console.error("Error loading quaternion preset:", error);
    }
}

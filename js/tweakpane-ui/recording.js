/**
 * Tweakpane UI Recording Module
 * Contains controls for video recording, screenshots, and media settings
 * 
 * @module tweakpane-ui/recording
 */

import { pane, folders, bindingState } from './core.js';
import { 
    toggleRecording, 
    isCurrentlyRecording, 
    cycleQuality, 
    getRecordingQuality 
} from '../recorder.js';
import { handleScreenshotKeys } from '../screenshot.js';

/**
 * Creates the recording controls section
 */
export function createRecordingFolder(targetPane = null) {
    const usePane = targetPane || pane;
    
    // Create main folder
    folders.recording = usePane.addFolder({
        title: 'Recording & Media',
        expanded: true
    });
    
    // Video recording controls
    createVideoRecordingControls();
    
    // Screenshot controls
    createScreenshotControls();
}

/**
 * Creates video recording sub-section
 */
function createVideoRecordingControls() {
    const videoFolder = folders.recording.addFolder({
        title: 'Video Recording',
        expanded: true
    });
    
    // Recording toggle button
    videoFolder.addButton({
        title: '🎥 Toggle Recording (V)'
    }).on('click', () => {
        toggleRecording();
        // Refresh UI to update recording status
        setTimeout(() => {
            import('./core.js').then(module => {
                if (module.refreshUI) module.refreshUI();
            });
        }, 100);
    });
    
    // Recording quality selector
    bindingState.recordingQuality = {
        value: getRecordingQualityIndex()
    };
    
    videoFolder.addInput(bindingState.recordingQuality, 'value', {
        label: 'Quality (Q)',
        options: {
            'Normal (5 Mbps)': 0,
            'High (10 Mbps)': 1,
            'Ultra (16 Mbps)': 2
        }
    }).on('change', (ev) => {
        // Cycle to the selected quality
        const currentIndex = getRecordingQualityIndex();
        const targetIndex = ev.value;
        
        // Calculate how many times to cycle
        let cyclesToTarget = (targetIndex - currentIndex + 3) % 3;
        for (let i = 0; i < cyclesToTarget; i++) {
            cycleQuality();
        }
    });
    
    // Recording status display
    videoFolder.addMonitor(bindingState, 'recordingStatus', {
        label: 'Status',
        view: 'text'
    });
    
    // Update recording status
    updateRecordingStatus();
}

/**
 * Creates screenshot controls sub-section
 */
function createScreenshotControls() {
    const screenshotFolder = folders.recording.addFolder({
        title: 'Screenshots',
        expanded: true
    });
    
    // Screenshot button
    screenshotFolder.addButton({
        title: '📸 Take Screenshot (S)'
    }).on('click', () => {
        handleScreenshotKeys('s');
    });
    
    // Screenshot format selector (if available in config)
    const formats = getAvailableScreenshotFormats();
    if (formats.length > 1) {
        bindingState.screenshotFormat = {
            value: 0 // Default to first format (usually PNG)
        };
        
        const formatOptions = {};
        formats.forEach((format, index) => {
            formatOptions[format.toUpperCase()] = index;
        });
        
        screenshotFolder.addInput(bindingState.screenshotFormat, 'value', {
            label: 'Format',
            options: formatOptions
        });
    }
}

/**
 * Gets the current recording quality as an index (0, 1, 2)
 */
function getRecordingQualityIndex() {
    const quality = getRecordingQuality();
    switch (quality?.toLowerCase()) {
        case 'normal': return 0;
        case 'high': return 1;
        case 'ultra': return 2;
        default: return 0;
    }
}

/**
 * Updates the recording status display
 */
function updateRecordingStatus() {
    if (!bindingState.recordingStatus) {
        bindingState.recordingStatus = '';
    }
    
    if (isCurrentlyRecording()) {
        bindingState.recordingStatus = '🔴 Recording...';
    } else {
        bindingState.recordingStatus = '⚫ Stopped';
    }
}

/**
 * Gets available screenshot formats from config
 */
function getAvailableScreenshotFormats() {
    try {
        // Import CONFIG to get screenshot formats
        return ['png', 'jpg', 'webp']; // Default formats
    } catch (error) {
        return ['png'];
    }
}

/**
 * Refreshes recording UI elements (call this periodically)
 */
export function refreshRecordingUI() {
    updateRecordingStatus();
    
    // Update quality selector
    if (bindingState.recordingQuality) {
        bindingState.recordingQuality.value = getRecordingQualityIndex();
    }
}
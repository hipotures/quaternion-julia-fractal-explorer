/**
 * Tweakpane UI Recorder Settings Module
 * Contains controls for video recording settings like resolution, aspect ratio, quality, and FPS.
 * @module tweakpane-ui/recorder-ui
 */

import { pane, folders } from './core.js';
import { recorderSettings, cycleQuality, getRecordingQuality, isCurrentlyRecording } from '../recorder.js';
import { CONFIG } from '../config.js';

// Proxy object for Tweakpane to bind to, for quality display
const recorderUiProxy = {
    get currentQuality() {
        return getRecordingQuality();
    },
    set currentQuality(value) {
        // This is read-only in the UI, actual change is via cycleQuality
    }
};

export function createRecorderFolder() {
    if (!pane) {
        console.warn("Tweakpane not initialized. Skipping Recorder UI creation.");
        return;
    }

    folders.recorder = pane.addFolder({
        title: 'Recording Settings',
        expanded: true,
    });

    // Resolution setting
    folders.recorder.addInput(recorderSettings, 'resolution', {
        label: 'Resolution',
        options: {
            'Current Viewport': 'current',
            '720p (HD)': '720p',
            '1080p (Full HD)': '1080p',
            '1440p (QHD)': '1440p',
            '4K (UHD)': '4k',
        },
    }).on('change', (ev) => {
        if (isCurrentlyRecording()) {
            alert("Cannot change resolution while recording is active.");
            // Revert to previous value if possible, or disable control
            // For now, just an alert. Tweakpane should ideally prevent change if input is disabled.
        }
        console.log(`Recording resolution set to: ${ev.value}`);
    });

    // Aspect ratio setting
    folders.recorder.addInput(recorderSettings, 'aspectRatio', {
        label: 'Aspect Ratio',
        options: {
            'Current Viewport': 'current',
            '16:9 (Landscape)': '16:9',
            '9:16 (Portrait)': '9:16',
            '1:1 (Square)': '1:1',
            '4:3 (Classic TV)': '4:3',
            '3:4 (Portrait Classic)': '3:4',
        },
    }).on('change', (ev) => {
        if (isCurrentlyRecording()) {
            alert("Cannot change aspect ratio while recording is active.");
        }
        console.log(`Recording aspect ratio set to: ${ev.value}`);
    });
    
    // FPS setting
    folders.recorder.addInput(recorderSettings, 'currentFPS', {
        label: 'FPS',
        min: 10,
        max: 60, // Max for MediaRecorder, CCapture could do more but is not used
        step: 1,
    }).on('change', (ev) => {
        if (isCurrentlyRecording()) {
            alert("Cannot change FPS while recording is active.");
        }
        console.log(`Recording FPS set to: ${ev.value}`);
        CONFIG.RECORDER.FPS = ev.value; // Update global config if other parts rely on it directly
                                        // Though recorder.js should use recorderSettings.currentFPS
    });


    // Bitrate/Quality Cycle Button and Monitor
    // Button to cycle quality
    folders.recorder.addButton({
        title: 'Cycle Quality (Q)',
    }).on('click', () => {
        if (isCurrentlyRecording()) {
            alert("Cannot change quality while recording is active.");
            return;
        }
        cycleQuality();
        pane.refresh(); // Refresh Tweakpane to update the monitor
    });

    // Monitor for current quality
    folders.recorder.addMonitor(recorderUiProxy, 'currentQuality', {
        label: 'Current Quality',
    });
    
    folders.recorder.addBlade({
        view: 'text',
        value: 'Note: Higher resolutions & quality significantly increase file size and performance impact.',
        parse: (v) => v,
        label: '',
        format: (v) => v,
    });
    
    // Expose a refresh function for quality monitor if needed elsewhere
    window.refreshTweakpaneRecorderSettings = () => {
        if (folders.recorder) {
            const qualityMonitor = folders.recorder.children.find(c => c.label === 'Current Quality');
            if (qualityMonitor) qualityMonitor.refresh();
        }
    };
}

/**
 * Tweakpane UI System Monitoring Module
 * Contains system performance monitoring, FPS display, and status indicators
 * 
 * @module tweakpane-ui/monitoring
 */

import { pane, folders, bindingState } from './core.js';
import { getFps, isPaused } from '../main.js';
import { cameraState } from '../camera.js';
import { 
    fractalState, 
    qualitySettings, 
    colorSettings, 
    crossSectionSettings,
    colorDynamicsSettings,
    orbitTrapSettings,
    physicsColorSettings
} from '../fractal.js';
import { getRecordingQuality, isCurrentlyRecording } from '../recorder.js';

/**
 * Creates the system monitoring section
 */
export function createSystemMonitorFolder(targetPane = null) {
    const usePane = targetPane || pane;
    
    // Create main folder
    folders.monitoring = usePane.addFolder({
        title: 'System Monitor',
        expanded: true
    });
    
    // Create sub-sections
    createPerformanceMonitorFolder(usePane);
    createParameterMonitorFolder(usePane);
    createSystemStatusFolder(usePane);
}

/**
 * Creates performance monitoring sub-section
 */
function createPerformanceMonitorFolder(parentPane) {
    const perfFolder = parentPane.addFolder({
        title: 'Performance',
        expanded: true
    });
    
    // FPS monitor
    bindingState.currentFPS = 60.0;
    perfFolder.addBinding(bindingState, 'currentFPS', {
        readonly: true,
        label: 'FPS',
        view: 'graph',
        min: 0,
        max: 120
    });
    
    // Iteration count monitor
    perfFolder.addBinding(qualitySettings, 'maxIter', {
        readonly: true,
        label: 'Iterations'
    });
    
    // Camera velocity monitor
    perfFolder.addBinding(bindingState, 'cameraVelocity', {
        readonly: true,
        label: 'Camera Velocity',
        view: 'graph',
        min: -0.1,
        max: 0.1
    });
}

/**
 * Creates parameter monitoring sub-section
 */
function createParameterMonitorFolder(parentPane) {
    const paramFolder = parentPane.addFolder({
        title: 'Current Parameters',
        expanded: true
    });
    
    // Fractal parameters (read-only display)
    paramFolder.addBinding(fractalState.params, 'x', {
        readonly: true,
        label: 'c.x'
    });
    
    paramFolder.addBinding(fractalState.params, 'y', {
        readonly: true,
        label: 'c.y'
    });
    
    paramFolder.addBinding(fractalState.params, 'z', {
        readonly: true,
        label: 'c.z'
    });
    
    paramFolder.addBinding(fractalState.params, 'w', {
        readonly: true,
        label: 'c.w'
    });
    
    // Slice information
    paramFolder.addBinding(fractalState, 'sliceValue', {
        readonly: true,
        label: '4D Slice'
    });
    
    // Camera information
    paramFolder.addBinding(cameraState, 'focalLength', {
        readonly: true,
        label: 'Focal Length'
    });
}

/**
 * Creates system status sub-section
 */
function createSystemStatusFolder(parentPane) {
    const statusFolder = parentPane.addFolder({
        title: 'System Status',
        expanded: true
    });
    
    // Application state
    statusFolder.addBinding(bindingState, 'appStatus', {
        readonly: true,
        label: 'App Status',
        view: 'text'
    });
    
    // Animation state
    statusFolder.addBinding(bindingState, 'animationStatus', {
        readonly: true,
        label: 'Animation',
        view: 'text'
    });
    
    // Recording state (using different property name to avoid conflict)
    statusFolder.addBinding(bindingState, 'recordingStatusMonitor', {
        readonly: true,
        label: 'Recording',
        view: 'text'
    });
    
    // Active effects summary
    statusFolder.addBinding(bindingState, 'activeEffects', {
        readonly: true,
        label: 'Active Effects',
        view: 'text'
    });
}

/**
 * Updates all monitoring displays with current values
 */
function updateMonitoringValues() {
    try {
        // Update FPS
        bindingState.currentFPS = getFps();
        
        // Update camera velocity
        bindingState.cameraVelocity = cameraState.moveVelocity || 0;
        
        // Update application status
        if (isPaused()) {
            bindingState.appStatus = 'Paused';
            bindingState.animationStatus = 'Paused';
        } else {
            bindingState.appStatus = 'Running';
            bindingState.animationStatus = cameraState.animationEnabled ? 'Active' : 'Disabled';
        }
        
        // Update recording status
        if (isCurrentlyRecording()) {
            const quality = getRecordingQuality();
            bindingState.recordingStatusMonitor = `Recording (${quality})`;
        } else {
            bindingState.recordingStatusMonitor = 'Stopped';
        }
        
        // Update active effects summary
        const effects = [];
        if (qualitySettings.enableShadows) effects.push('Shadows');
        if (qualitySettings.enableAO) effects.push('AO');
        if (qualitySettings.enableSpecular) effects.push('Specular');
        if (colorSettings.colorEnabled) effects.push('Colors');
        if (colorDynamicsSettings.animationEnabled) effects.push('Color Anim');
        if (orbitTrapSettings.enabled) effects.push('Orbit Trap');
        if (physicsColorSettings.enabled) effects.push('Physics Color');
        if (crossSectionSettings.clipMode > 0) effects.push('Cross-Section');
        
        bindingState.activeEffects = effects.length > 0 ? effects.join(', ') : 'Basic';
        
    } catch (error) {
        console.error('Error updating monitoring values:', error);
    }
}

/**
 * Refreshes monitoring UI elements (call this periodically)
 */
export function refreshMonitoringUI() {
    updateMonitoringValues();
}

/**
 * Initializes monitoring with update interval
 */
export function initializeMonitoring() {
    // Update monitoring values periodically
    setInterval(() => {
        updateMonitoringValues();
    }, 100); // Update every 100ms for smooth graphs
}
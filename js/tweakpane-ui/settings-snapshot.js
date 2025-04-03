/**
 * Tweakpane UI Settings Snapshot Module
 * Contains functionality for creating a snapshot of the current application settings
 * 
 * @module tweakpane-ui/settings-snapshot
 */

import { 
    fractalState, 
    colorSettings,
    colorDynamicsSettings,
    orbitTrapSettings,
    physicsColorSettings,
    crossSectionSettings
} from '../fractal.js';

import { cameraState } from '../camera.js';

/**
 * Creates a snapshot of the current settings
 * @returns {Object} Settings object containing all parameters
 */
export function getSettingsSnapshot() {
    return {
        timestamp: new Date().toISOString(),
        fractalParams: {
            c: {
                x: fractalState.params.x,
                y: fractalState.params.y,
                z: fractalState.params.z,
                w: fractalState.params.w
            },
            slice: {
                animate: fractalState.animateSlice,
                amplitude: fractalState.sliceAmplitude,
                value: fractalState.sliceValue
            },
            crossSection: {
                mode: crossSectionSettings.clipMode,
                distance: crossSectionSettings.clipDistance
            }
        },
        color: {
            palette: colorSettings.paletteIndex,
            dynamics: {
                ...colorDynamicsSettings
            },
            orbitTrap: {
                ...orbitTrapSettings
            },
            physics: {
                ...physicsColorSettings
            }
        },
        quality: {
            ...fractalState.qualitySettings
        },
        camera: {
            focalLength: cameraState.focalLength,
            animationEnabled: cameraState.animationEnabled
        }
    };
}

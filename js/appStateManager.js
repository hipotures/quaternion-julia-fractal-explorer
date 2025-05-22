/**
 * Application State Manager
 * 
 * Handles saving and loading the complete application state, including
 * fractal parameters, camera settings, rendering quality, and color effects.
 * @module appStateManager
 */

// Import necessary state objects and modules
import { fractalState, qualitySettings, colorSettings, crossSectionSettings, colorDynamicsSettings, orbitTrapSettings, physicsColorSettings } from './fractal.js';
import { camera, cameraState, setupInitialCamera } from './camera.js'; // Import camera directly for its properties
import { taaUniforms } from './scene.js'; // For TAA state
import { pane } from './tweakpane-ui/core.js'; // For refreshing UI
import { applySettings } from './tweakpane-ui/settings-apply.js'; // To apply settings consistently

// --- Helper function to get current TAA state ---
function getTAAState() {
    if (taaUniforms && taaUniforms.u_enableTAA && taaUniforms.u_taaBlendFactor) {
        return {
            enabled: taaUniforms.u_enableTAA.value,
            blendFactor: taaUniforms.u_taaBlendFactor.value
        };
    }
    return { enabled: false, blendFactor: 0.9 }; // Default if not found
}

/**
 * Gathers the current application state into a single object.
 * @returns {Object} The application state.
 */
function getCurrentAppState() {
    const appState = {
        version: 1.0, // Versioning for future compatibility
        timestamp: new Date().toISOString(),
        fractal: {
            params: {
                x: fractalState.params.x,
                y: fractalState.params.y,
                z: fractalState.params.z,
                w: fractalState.params.w
            },
            sliceValue: fractalState.sliceValue,
            animateSlice: fractalState.animateSlice,
            sliceAmplitude: fractalState.sliceAmplitude, // Renamed from sliceRange for clarity
        },
        crossSection: {
            clipMode: crossSectionSettings.clipMode,
            clipDistance: crossSectionSettings.clipDistance
        },
        camera: {
            position: {
                x: cameraState.position.x,
                y: cameraState.position.y,
                z: cameraState.position.z
            },
            rotation: { // Store Euler angles for simplicity
                x: cameraState.rotation.x,
                y: cameraState.rotation.y,
                z: cameraState.rotation.z,
                order: cameraState.rotation.order
            },
            center: { // Target or look-at point
                x: cameraState.center.x,
                y: cameraState.center.y,
                z: cameraState.center.z
            },
            focalLength: cameraState.focalLength,
            animationEnabled: cameraState.animationEnabled,
            // Note: velocity is transient, so not saved. 
            // CONFIG.CONTROLS.velocity seems to be a config, not state.
        },
        rendering: {
            maxIter: qualitySettings.maxIter,
            enableShadows: qualitySettings.enableShadows,
            enableAO: qualitySettings.enableAO,
            enableSmoothColor: qualitySettings.enableSmoothColor,
            enableSpecular: qualitySettings.enableSpecular,
            enableAdaptiveSteps: qualitySettings.enableAdaptiveSteps,
        },
        colors: {
            paletteIndex: colorSettings.paletteIndex,
            // Dynamic Color Effects
            dynamics: { ...colorDynamicsSettings },
            // Orbit Trap
            orbitTrap: { ...orbitTrapSettings },
            // Physics-based Colors
            physics: { ...physicsColorSettings }
        },
        taa: getTAAState()
        // UI state (e.g., panel positions, expanded folders) is generally hard to serialize
        // with Tweakpane without direct support from the library. Skipping for now.
    };
    return appState;
}

/**
 * Applies a loaded application state.
 * @param {Object} loadedState - The state object to apply.
 */
function applyAppState(loadedState) {
    if (!loadedState) {
        console.error("No state provided to apply.");
        return false;
    }

    // Use a more robust way to apply settings, leveraging existing functions if possible
    // This ensures that uniforms and other derived states are updated correctly.
    // We can use the `applySettings` function from `settings-apply.js` if it's comprehensive enough
    // or manually set each part.

    // For now, let's create a structure similar to what `applySettings` might expect,
    // or directly update the state objects.

    const settingsToApply = {
        fractalParams: loadedState.fractal?.params,
        sliceValue: loadedState.fractal?.sliceValue,
        animateSlice: loadedState.fractal?.animateSlice,
        sliceAmplitude: loadedState.fractal?.sliceAmplitude,
        
        clipMode: loadedState.crossSection?.clipMode,
        clipDistance: loadedState.crossSection?.clipDistance,
        
        cameraPosition: loadedState.camera?.position,
        cameraRotation: loadedState.camera?.rotation, // Assuming Euler
        cameraCenter: loadedState.camera?.center,
        focalLength: loadedState.camera?.focalLength,
        cameraAnimationEnabled: loadedState.camera?.animationEnabled,

        quality: loadedState.rendering, // Contains maxIter, enableShadows, etc.
        
        colorPalette: loadedState.colors?.paletteIndex,
        colorDynamics: loadedState.colors?.dynamics,
        orbitTrap: loadedState.colors?.orbitTrap,
        physicsColor: loadedState.colors?.physics,

        taa: loadedState.taa
    };
    
    // Use the applySettings function for most things
    // This function needs to be comprehensive.
    // We are calling a simplified version of what `applySettings` would do.
    
    // Fractal
    if (settingsToApply.fractalParams) Object.assign(fractalState.params, settingsToApply.fractalParams);
    if (settingsToApply.sliceValue !== undefined) fractalState.sliceValue = settingsToApply.sliceValue;
    if (settingsToApply.animateSlice !== undefined) fractalState.animateSlice = settingsToApply.animateSlice;
    if (settingsToApply.sliceAmplitude !== undefined) fractalState.sliceAmplitude = settingsToApply.sliceAmplitude;

    // Cross Section
    if (settingsToApply.clipMode !== undefined) crossSectionSettings.clipMode = settingsToApply.clipMode;
    if (settingsToApply.clipDistance !== undefined) crossSectionSettings.clipDistance = settingsToApply.clipDistance;
    
    // Camera - more complex, involves direct manipulation and updates
    if (settingsToApply.cameraPosition) cameraState.position.set(settingsToApply.cameraPosition.x, settingsToApply.cameraPosition.y, settingsToApply.cameraPosition.z);
    if (settingsToApply.cameraRotation) cameraState.rotation.set(settingsToApply.cameraRotation.x, settingsToApply.cameraRotation.y, settingsToApply.cameraRotation.z, settingsToApply.cameraRotation.order || 'YXZ');
    if (settingsToApply.cameraCenter) cameraState.center.set(settingsToApply.cameraCenter.x, settingsToApply.cameraCenter.y, settingsToApply.cameraCenter.z);
    if (settingsToApply.focalLength !== undefined) cameraState.focalLength = settingsToApply.focalLength;
    if (settingsToApply.cameraAnimationEnabled !== undefined) cameraState.animationEnabled = settingsToApply.cameraAnimationEnabled;
    // After setting camera state, ensure the actual camera object and uniforms are updated
    camera.position.copy(cameraState.position);
    camera.rotation.copy(cameraState.rotation);
    // camera.lookAt(cameraState.center); // This might override specific rotation, be careful
    setupInitialCamera(); // This re-initializes some camera aspects and calls updateCameraState
    // Or more granular updates:
    // updateCameraState(); 


    // Rendering Quality
    if (settingsToApply.quality) Object.assign(qualitySettings, settingsToApply.quality);

    // Colors
    if (settingsToApply.colorPalette !== undefined) colorSettings.paletteIndex = settingsToApply.colorPalette;
    if (settingsToApply.colorDynamics) Object.assign(colorDynamicsSettings, settingsToApply.colorDynamics);
    if (settingsToApply.orbitTrap) Object.assign(orbitTrapSettings, settingsToApply.orbitTrap);
    if (settingsToApply.physicsColor) Object.assign(physicsColorSettings, settingsToApply.physicsColor);
    
    // TAA
    if (settingsToApply.taa && taaUniforms && taaUniforms.u_enableTAA) {
        taaUniforms.u_enableTAA.value = settingsToApply.taa.enabled;
        if (taaUniforms.u_taaBlendFactor) {
            taaUniforms.u_taaBlendFactor.value = settingsToApply.taa.blendFactor;
        }
    }

    // After all state objects are updated, refresh Tweakpane to reflect changes
    if (pane) {
        pane.refresh();
    }

    // Manually trigger updates for shader uniforms based on the new state
    // This should ideally be part of a more centralized settings application logic.
    // For now, directly call necessary update functions:
    import('./shaders.js').then(shaderModule => {
        shaderModule.updateFractalParamsUniform(fractalState.params);
        shaderModule.updateSliceUniform(fractalState.sliceValue);
        shaderModule.updateClipModeUniform(crossSectionSettings.clipMode);
        shaderModule.updateClipDistanceUniform(crossSectionSettings.clipDistance);
        shaderModule.updateQualityUniforms(qualitySettings);
        shaderModule.updateColorUniforms({
            colorEnabled: colorSettings.paletteIndex !== 0,
            paletteIndex: colorSettings.paletteIndex > 0 ? colorSettings.paletteIndex -1 : 0
        });
        shaderModule.updateColorDynamicsUniforms(colorDynamicsSettings);
        shaderModule.updateOrbitTrapUniforms(orbitTrapSettings);
        shaderModule.updatePhysicsColorUniforms(physicsColorSettings);
        // Camera uniforms are updated via updateCameraState() / setupInitialCamera()
    }).catch(e => console.error("Error updating shader uniforms after load:", e));
    
    console.log("Application state applied.");
    return true;
}


/**
 * Triggers a download of the current application state as a JSON file.
 */
export function saveAppState() {
    try {
        const appState = getCurrentAppState();
        const jsonString = JSON.stringify(appState, null, 2); // Pretty print JSON
        const blob = new Blob([jsonString], { type: "application/json" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        a.download = `fractal_explorer_state_${timestamp}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        console.log("Application state saved.");
    } catch (error) {
        console.error("Error saving application state:", error);
        alert("Could not save application state. See console for details.");
    }
}

/**
 * Opens a file dialog for the user to select a state file to load.
 */
export function loadAppState() {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json,application/json';

    fileInput.onchange = (event) => {
        const file = event.target.files[0];
        if (!file) {
            console.log("No file selected for loading state.");
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const loadedState = JSON.parse(e.target.result);
                if (applyAppState(loadedState)) {
                    alert("Application state loaded successfully.");
                } else {
                    alert("Failed to apply loaded application state. Check console for errors.");
                }
            } catch (error) {
                console.error("Error parsing or applying state file:", error);
                alert(`Error loading state file: ${error.message}`);
            }
        };
        reader.onerror = (error) => {
            console.error("Error reading state file:", error);
            alert(`Error reading file: ${error.message}`);
        };
        reader.readAsText(file);
    };

    fileInput.click();
}

console.log("App State Manager initialized.");

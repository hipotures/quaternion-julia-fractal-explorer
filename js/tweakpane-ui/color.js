/**
 * Tweakpane UI Color Controls Module
 * Contains controls for color palettes, dynamic colors, orbit trap and physics-based coloring
 * 
 * @module tweakpane-ui/color
 */

import { 
    colorSettings,
    colorDynamicsSettings,
    orbitTrapSettings,
    physicsColorSettings
} from '../fractal.js';

import { 
    updateColorUniforms,
    updateColorDynamicsUniforms,
    updateOrbitTrapUniforms,
    updatePhysicsColorUniforms
} from '../shaders.js';

// Import shared UI elements
import { pane, folders, bindingState } from './core.js';

/**
 * Creates all color control sections and sub-sections
 */
export function createColorControlsFolder(targetPane = null) {
    const usePane = targetPane || pane;
    
    // Create main folder
    folders.color = usePane.addFolder({
        title: 'Color Effects',
        expanded: true
    });
    
    // Create main color palette selector
    createColorPaletteSelector();
    
    // Create sub-sections
    createDynamicColorsFolder();
    createOrbitTrapFolder();
    createPhysicsColorsFolder();
}

/**
 * Creates the main color palette selector
 */
function createColorPaletteSelector() {
    // Initialize UI binding
    bindingState.paletteSelector.value = colorSettings.paletteIndex;
    
    folders.color.addBinding(bindingState.paletteSelector, 'value', {
        label: 'Palette (6)',
        options: {
            'OFF': 0,
            'Rainbow': 1,
            'Blue-yellow': 2,
            'Red-violet': 3,
            'Green-blue': 4,
            'Warm': 5,
            'Polar glow': 6,
            'Cyan-magenta': 7,
            'Desert': 8,
            'Underwater': 9,
            'Metallic': 10
        }
    }).on('change', (ev) => {
        colorSettings.paletteIndex = ev.value;
        colorSettings.colorEnabled = (ev.value !== 0);
        const shaderPaletteIndex = colorSettings.colorEnabled ? colorSettings.paletteIndex - 1 : 0;
        updateColorUniforms({
            colorEnabled: colorSettings.colorEnabled,
            paletteIndex: shaderPaletteIndex
        });
    });
}

/**
 * Creates dynamic color controls sub-section
 */
function createDynamicColorsFolder() {
    const dynamicColors = folders.color.addFolder({
        title: 'Dynamic Colors',
        expanded: true
    });
    
    dynamicColors.addBinding(colorDynamicsSettings, 'animationEnabled', {
        label: 'Animate Colors (C)'
    }).on('change', () => {
        updateColorDynamicsUniforms(colorDynamicsSettings);
    });
    
    dynamicColors.addBinding(colorDynamicsSettings, 'saturation', {
        label: 'Saturation (S)',
        min: 0.0, max: 2.0, step: 0.1
    }).on('change', () => {
        updateColorDynamicsUniforms(colorDynamicsSettings);
    });
    
    dynamicColors.addBinding(colorDynamicsSettings, 'brightness', {
        label: 'Brightness (B)',
        min: 0.0, max: 2.0, step: 0.1
    }).on('change', () => {
        updateColorDynamicsUniforms(colorDynamicsSettings);
    });
    
    dynamicColors.addBinding(colorDynamicsSettings, 'contrast', {
        label: 'Contrast (N)',
        min: 0.0, max: 2.0, step: 0.1
    }).on('change', () => {
        updateColorDynamicsUniforms(colorDynamicsSettings);
    });
    
    dynamicColors.addBinding(colorDynamicsSettings, 'phaseShift', {
        label: 'Phase Shift (P)',
        min: 0.0, max: 6.28, step: 0.1
    }).on('change', () => {
        updateColorDynamicsUniforms(colorDynamicsSettings);
    });
    
    dynamicColors.addBinding(colorDynamicsSettings, 'animationSpeed', {
        label: 'Anim Speed (A)',
        min: 0.05, max: 2.0, step: 0.05
    }).on('change', () => {
        updateColorDynamicsUniforms(colorDynamicsSettings);
    });
}

/**
 * Creates orbit trap controls sub-section
 */
function createOrbitTrapFolder() {
    const orbitTrap = folders.color.addFolder({
        title: 'Orbit Trap Colors (O)',
        expanded: true
    });
    
    orbitTrap.addBinding(orbitTrapSettings, 'enabled', {
        label: 'Enable Orbit Trap'
    }).on('change', () => {
        // Disable physics-based if orbit trap is enabled (they are exclusive)
        if (orbitTrapSettings.enabled && physicsColorSettings.enabled) {
            physicsColorSettings.enabled = false;
            updatePhysicsColorUniforms(physicsColorSettings);
            // Refresh UI to reflect changes
            import('./core.js').then(module => {
                if (module.refreshUI) module.refreshUI();
            });
        }
        updateOrbitTrapUniforms(orbitTrapSettings);
    });
    
    // Initialize binding
    bindingState.orbitTrapTypeSelector.value = orbitTrapSettings.type;
    
    orbitTrap.addBinding(bindingState.orbitTrapTypeSelector, 'value', {
        label: 'Trap Type (T)',
        options: {
            'Circle': 0,
            'Line': 1,
            'Point': 2,
            'Cross': 3
        }
    }).on('change', (ev) => {
        orbitTrapSettings.type = ev.value;
        updateOrbitTrapUniforms(orbitTrapSettings);
    });
    
    orbitTrap.addBinding(orbitTrapSettings, 'radius', {
        label: 'Radius (R)',
        min: 0.1, max: 5.0, step: 0.1
    }).on('change', () => {
        updateOrbitTrapUniforms(orbitTrapSettings);
    });
    
    orbitTrap.addBinding(orbitTrapSettings, 'intensity', {
        label: 'Intensity (I)',
        min: 0.1, max: 5.0, step: 0.1
    }).on('change', () => {
        updateOrbitTrapUniforms(orbitTrapSettings);
    });
}

/**
 * Creates physics-based coloring sub-section
 */
function createPhysicsColorsFolder() {
    const physics = folders.color.addFolder({
        title: 'Physics-based Colors (F)',
        expanded: true
    });
    
    physics.addBinding(physicsColorSettings, 'enabled', {
        label: 'Enable Physics Colors'
    }).on('change', () => {
        // Disable orbit trap if physics is enabled (they are exclusive)
        if (physicsColorSettings.enabled && orbitTrapSettings.enabled) {
            orbitTrapSettings.enabled = false;
            updateOrbitTrapUniforms(orbitTrapSettings);
            // Refresh UI to reflect changes
            import('./core.js').then(module => {
                if (module.refreshUI) module.refreshUI();
            });
        }
        updatePhysicsColorUniforms(physicsColorSettings);
    });
    
    // Initialize binding
    bindingState.physicsColorTypeSelector.value = physicsColorSettings.type;
    
    physics.addBinding(bindingState.physicsColorTypeSelector, 'value', {
        label: 'Effect Type (Y)',
        options: {
            'Diffraction': 0,
            'Interference': 1,
            'Emission': 2
        }
    }).on('change', (ev) => {
        physicsColorSettings.type = ev.value;
        updatePhysicsColorUniforms(physicsColorSettings);
    });
    
    physics.addBinding(physicsColorSettings, 'frequency', {
        label: 'Frequency (Q)',
        min: 0.1, max: 5.0, step: 0.1
    }).on('change', () => {
        updatePhysicsColorUniforms(physicsColorSettings);
    });
    
    physics.addBinding(physicsColorSettings, 'waves', {
        label: 'Waves (W)',
        min: 1.0, max: 20.0, step: 0.5
    }).on('change', () => {
        updatePhysicsColorUniforms(physicsColorSettings);
    });
    
    physics.addBinding(physicsColorSettings, 'intensity', {
        label: 'Intensity (E)',
        min: 0.1, max: 2.0, step: 0.1
    }).on('change', () => {
        updatePhysicsColorUniforms(physicsColorSettings);
    });
    
    physics.addBinding(physicsColorSettings, 'balance', {
        label: 'Balance (D)',
        min: 0.0, max: 1.0, step: 0.05
    }).on('change', () => {
        updatePhysicsColorUniforms(physicsColorSettings);
    });
}

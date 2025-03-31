import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';
import { uniforms, updateFractalParamsUniform, updateSliceUniform, updateQualityUniforms, updateColorUniforms } from './shaders.js';

// --- Fractal State ---
export const fractalState = {
    params: new THREE.Vector4(-0.2, 0.6, 0.2, 0.2), // Initial 'c' parameter for the Julia set (Vector4)
    animateSlice: true, // Toggle for animating the 4th dimension slice (0 key)
    sliceValue: 0.0, // Current value of the 4th dimension slice 
    slicePhase: 0.0, // Current phase in the sine wave animation (0-2π)
    sliceAnimSpeed: 0.15, // How fast to advance the phase per frame (increased 3x from 0.05)
    sliceAmplitude: 0.5, // Controls the range of slice values (-amplitude to +amplitude)
};

// --- Quality Settings ---
export const qualitySettings = {
    maxIter: 100, // Maximum ray marching iterations (1/2 keys)
    enableShadows: false, // Toggle for soft shadows (3 key)
    enableAO: false, // Toggle for Ambient Occlusion (4 key)
    enableSmoothColor: false, // Toggle for smooth iteration count coloring (5 key)
    enableSpecular: false, // Toggle for specular highlights (7 key)
    enableAdaptiveSteps: false, // Toggle for adaptive ray marching steps (8 key)
};

// --- Cross Section Settings ---
export const crossSectionSettings = {
    clipMode: 0, // 0: off, 1: method 1 (ignoruj pierwsze trafienie), 2: method 2 (zatrzymaj na płaszczyźnie), 3: method 3 (przekrój od tyłu)
    clipDistance: 3.5, // Odległość płaszczyzny tnącej od kamery - zwiększona wartość
    clipDistanceStep: 0.2 // Krok zmiany odległości
};

// --- Color Settings ---
export const colorSettings = {
    colorEnabled: false, // Master toggle for enabling color palettes
    paletteIndex: 0, // Index of the selected color palette (0 = off, 1-5 = palettes) (6 key)
};

// Expose states globally for debugging/compatibility
window.fractalState = fractalState;
window.qualitySettings = qualitySettings;
window.colorSettings = colorSettings;

// --- Update Functions ---

// Resets fractal parameters to random values
export function resetFractalParams() {
    fractalState.params.set(
        Math.random() * 0.8 - 0.4,
        Math.random() * 0.8 - 0.4,
        Math.random() * 0.8 - 0.4,
        Math.random() * 0.8 - 0.4
    );
    updateFractalParamsUniform(fractalState.params);
}

// Toggles the slice animation
export function toggleSliceAnimation() {
    fractalState.animateSlice = !fractalState.animateSlice;
    console.log("Slice animation:", fractalState.animateSlice ? "ON" : "OFF");
}

// Change the slice amplitude
export function changeSliceAmplitude(delta) {
    // Limit to max of 1.0 as the fractal disappears beyond -1/1 range
    fractalState.sliceAmplitude = Math.max(0.1, Math.min(fractalState.sliceAmplitude + delta, 1.0));
    console.log("Slice amplitude:", fractalState.sliceAmplitude.toFixed(1));
}

// Updates the slice value (called from main loop)
export function updateSlice(delta) {
    // Only update if slice animation is enabled
    if (fractalState.animateSlice) {
        // Advance the phase (in radians) by speed * delta
        fractalState.slicePhase += fractalState.sliceAnimSpeed * delta;
        
        // Keep phase in range [0, 2π] to avoid floating point issues over time
        if (fractalState.slicePhase > Math.PI * 2) {
            fractalState.slicePhase -= Math.PI * 2;
        }
        
        // Calculate slice value based on the current phase and amplitude
        fractalState.sliceValue = Math.sin(fractalState.slicePhase) * fractalState.sliceAmplitude;
        
        // Update the shader uniform
        updateSliceUniform(fractalState.sliceValue);
    }
    // Static otherwise
}

// Changes the maximum number of iterations
export function changeIterations(delta) {
    qualitySettings.maxIter = Math.max(20, Math.min(qualitySettings.maxIter + delta, 2000)); // Clamp between 20 and 2000
    updateQualityUniforms(qualitySettings);
    console.log("Max Iterations:", qualitySettings.maxIter);
}

// Toggles soft shadows
export function toggleShadows() {
    qualitySettings.enableShadows = !qualitySettings.enableShadows;
    updateQualityUniforms(qualitySettings);
    console.log("Shadows:", qualitySettings.enableShadows ? "ON" : "OFF");
}

// Toggles Ambient Occlusion
export function toggleAO() {
    qualitySettings.enableAO = !qualitySettings.enableAO;
    updateQualityUniforms(qualitySettings);
    console.log("AO:", qualitySettings.enableAO ? "ON" : "OFF");
}

// Toggles smooth coloring
export function toggleSmoothColor() {
    qualitySettings.enableSmoothColor = !qualitySettings.enableSmoothColor;
    updateQualityUniforms(qualitySettings);
    console.log("Smooth Color:", qualitySettings.enableSmoothColor ? "ON" : "OFF");
}

// Toggles specular highlights
export function toggleSpecular() {
    qualitySettings.enableSpecular = !qualitySettings.enableSpecular;
    updateQualityUniforms(qualitySettings);
    console.log("Specular:", qualitySettings.enableSpecular ? "ON" : "OFF");
}

// Toggles adaptive ray marching
export function toggleAdaptiveSteps() {
    qualitySettings.enableAdaptiveSteps = !qualitySettings.enableAdaptiveSteps;
    // Używamy updateAdaptiveStepsUniform zamiast updateQualityUniforms, ponieważ
    // funkcja updateQualityUniforms w shaders.js nie obsługuje jeszcze tej właściwości
    import("./shaders.js").then(module => {
        module.updateAdaptiveStepsUniform(qualitySettings.enableAdaptiveSteps);
    });
    console.log("Adaptive Ray Marching:", qualitySettings.enableAdaptiveSteps ? "ON" : "OFF");
}

// Cykliczna zmiana trybu przekroju: OFF -> Metoda 1 -> Metoda 2 -> Metoda 3 -> OFF
export function cycleClipMode() {
    // Przełącz tryb cyklicznie
    crossSectionSettings.clipMode = (crossSectionSettings.clipMode + 1) % 4;
    
    // Aktualizacja uniformu bezpośrednio z importu
    import("./shaders.js").then(module => {
        module.updateClipModeUniform(crossSectionSettings.clipMode);
    });
    
    // Informacja o aktualnym trybie
    const modeNames = ["OFF", "METHOD 1", "METHOD 2", "METHOD 3"];
    console.log("Cross Section Mode:", modeNames[crossSectionSettings.clipMode]);
    
    // Dziennik stanu uniformów po zmianie
    setTimeout(() => {
        console.log("Current u_clipMode:", window.uniforms.u_clipMode.value);
        console.log("Current clipDistance:", window.uniforms.u_clipDistance.value);
    }, 100); // Mały timeout aby upewnić się, że uniform został zaktualizowany
}

// Funkcja do wymuszenia resetu trybu przekroju (pomocna przy debugowaniu)
export function forceResetClipMode() {
    crossSectionSettings.clipMode = 0;
    import("./shaders.js").then(module => {
        module.updateClipModeUniform(0);
        console.log("FORCED RESET of cross section mode to OFF");
        console.log("Current u_clipMode:", window.uniforms.u_clipMode.value);
    });
}

// Zwiększenie odległości płaszczyzny tnącej (klawisz ']')
export function increaseClipDistance() {
    crossSectionSettings.clipDistance += crossSectionSettings.clipDistanceStep;
    
    import("./shaders.js").then(module => {
        module.updateClipDistanceUniform(crossSectionSettings.clipDistance);
    });
    
    console.log("Clip Distance:", crossSectionSettings.clipDistance.toFixed(2));
}

// Zmniejszenie odległości płaszczyzny tnącej (klawisz '[')
export function decreaseClipDistance() {
    crossSectionSettings.clipDistance = Math.max(0.2, crossSectionSettings.clipDistance - crossSectionSettings.clipDistanceStep);
    
    import("./shaders.js").then(module => {
        module.updateClipDistanceUniform(crossSectionSettings.clipDistance);
    });
    
    console.log("Clip Distance:", crossSectionSettings.clipDistance.toFixed(2));
}

// Cycles through color palettes
export function changePalette() {
    colorSettings.paletteIndex = (colorSettings.paletteIndex + 1) % 11; // 11 states: 0 (off) + 10 palettes
    colorSettings.colorEnabled = (colorSettings.paletteIndex !== 0);
    // Pass the correct index to the shader (0-9 for palettes, or irrelevant if disabled)
    const shaderPaletteIndex = colorSettings.colorEnabled ? colorSettings.paletteIndex - 1 : 0;
    updateColorUniforms({
        colorEnabled: colorSettings.colorEnabled,
        paletteIndex: shaderPaletteIndex
    });
    console.log("Palette:", colorSettings.paletteIndex === 0 ? "OFF" : colorSettings.paletteIndex);
}

// --- Initial Uniform Updates ---
// Call update functions initially to set shader uniforms from default states
updateFractalParamsUniform(fractalState.params);
updateQualityUniforms(qualitySettings);
updateColorUniforms({
    colorEnabled: colorSettings.colorEnabled,
    paletteIndex: 0 // Initial shader index
});
updateSliceUniform(fractalState.sliceValue);

// Inicjalizacja Cross Section uniforms
import("./shaders.js").then(module => {
    module.updateClipModeUniform(crossSectionSettings.clipMode);
    module.updateClipDistanceUniform(crossSectionSettings.clipDistance);
});

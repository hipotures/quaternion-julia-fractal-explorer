import { tourState } from './tour.js';
import { cameraState } from './camera.js';
import { fractalState, qualitySettings, colorSettings, crossSectionSettings } from './fractal.js';
import { CONFIG } from './config.js'; // Import configuration values

// --- Tour Playback Functions ---

// Validate a tour file
export function validateTourData(tourData) {
    // Check if the tour has at least 2 points
    if (!tourData.points || tourData.points.length < 2) {
        console.error("Tour validation failed: Tour must have at least 2 points");
        return false;
    }
    
    // Check if each point has at least the fractal parameters
    for (let i = 0; i < tourData.points.length; i++) {
        const point = tourData.points[i];
        if (!point.fractalParams || !point.fractalParams.c || point.fractalParams.c.length !== 4) {
            console.error(`Tour validation failed: Point ${i+1} is missing valid fractal parameters`);
            return false;
        }
    }
    
    return true;
}

// Load and start playing a tour
export function startTourPlayback(tourData) {
    // Don't start if already playing
    if (tourState.isPlaying) {
        console.log("Cannot start tour - already playing a tour");
        return false;
    }
    
    // Validate the tour data
    if (!validateTourData(tourData)) {
        console.error("Cannot start tour - invalid tour data");
        return false;
    }
    
    // Save the current UI state
    import('./ui.js').then(module => {
        tourState.uiStateBeforePlayback = {
            presetMenuVisible: module.isPresetMenuVisible(),
            statsVisible: module.isStatsVisible(),
            menuVisible: module.isMenuVisible()
        };
        
        // Hide preset menu
        module.showPresetMenu(false);
        
        // Hide main menu if it's visible
        if (tourState.uiStateBeforePlayback.menuVisible) {
            module.toggleMenu(false);
        }
    });
    
    // Show tour status bar and hide preset menu directly through DOM manipulation
    const tourStatusElement = document.getElementById(CONFIG.UI.SELECTORS.TOUR_STATUS);
    
    if (tourStatusElement) {
        tourStatusElement.style.display = 'block';
        tourStatusElement.textContent = `${tourData.name || 'Tour'} - Point 1/${tourData.points.length}`;
    }
    
    // Force hide preset menu immediately - CRITICAL FIX
    const presetMenuElement = document.getElementById(CONFIG.UI.SELECTORS.PRESET_MENU);
    if (presetMenuElement) {
        // Apply both display and visibility to ensure complete hiding
        presetMenuElement.style.display = 'none';
        presetMenuElement.style.visibility = 'hidden';
        console.log("Force hiding preset menu via direct DOM manipulation");
    } else {
        console.warn("Preset menu element not found for direct hiding!");
    }
    
    // Additional attempt to hide with delay to ensure menu will be hidden
    setTimeout(() => {
        const retryElement = document.getElementById(CONFIG.UI.SELECTORS.PRESET_MENU);
        if (retryElement) {
            retryElement.style.display = 'none';
            retryElement.style.visibility = 'hidden';
            console.log("Force hiding preset menu after delay");
        }
    }, CONFIG.TOURS.MENU_HIDE_DELAY); // Using configured delay value
    
    // Initialize playback state
    tourState.isPlaying = true;
    tourState.isTourEnding = false;
    tourState.tourEndingTime = 0;
    tourState.currentTour = tourData;
    tourState.currentPointIndex = 0;
    tourState.nextPointIndex = 1;
    tourState.playbackTime = 0;
    tourState.inTransition = true;
    tourState.transitionProgress = 0;
    
    // Set the transition duration from the tour or use default
    const transitionDuration = tourData.defaultTransitionDuration || tourState.defaultTransitionDuration;
    
    // Apply the first point immediately
    applyTourPoint(tourData.points[0]);
    
    console.log(`Started tour playback: ${tourData.name || 'Unnamed Tour'} (${tourData.points.length} points)`);
    return true;
}

// Pause the current tour playback
export function pauseTourPlayback() {
    if (!tourState.isPlaying) return false;
    
    // Toggle pause state (implement later if needed)
    
    return true;
}

// Stop the current tour playback
export function stopTourPlayback() {
    if (!tourState.isPlaying) return false;
    
    // Reset playback state
    tourState.isPlaying = false;
    tourState.isTourEnding = false;
    tourState.currentTour = null;
    tourState.playbackTime = 0;
    
    // Hide tour status bar
    const tourStatusElement = document.getElementById(CONFIG.UI.SELECTORS.TOUR_STATUS);
    if (tourStatusElement) {
        tourStatusElement.style.display = 'none';
    }
    
    // Direct restoration of preset menu visibility
    const presetMenuElement = document.getElementById(CONFIG.UI.SELECTORS.PRESET_MENU);
    if (presetMenuElement && tourState.uiStateBeforePlayback.presetMenuVisible) {
        presetMenuElement.style.display = 'flex';
        presetMenuElement.style.visibility = 'visible';
        console.log("Force restoring preset menu visibility via direct DOM manipulation");
    }
    
    // Restore UI state
    import('./ui.js').then(module => {
        module.showPresetMenu(tourState.uiStateBeforePlayback.presetMenuVisible);
        if (tourState.uiStateBeforePlayback.statsVisible) {
            module.toggleStats(true);
        }
        if (tourState.uiStateBeforePlayback.menuVisible) {
            module.toggleMenu(true);
        }
    });
    
    console.log("Tour playback stopped");
    return true;
}

// Check if a tour is currently playing
export function isTourPlaying() {
    return tourState.isPlaying;
}

// Update tour playback - call this in the animation frame
export function updateTourPlayback(deltaTime) {
    if (!tourState.isPlaying || !tourState.currentTour) return;
    
    const tour = tourState.currentTour;
    
    // Handle tour ending state
    if (tourState.isTourEnding) {
        tourState.tourEndingTime += deltaTime;
        
        // Update the status message
        const tourStatusElement = document.getElementById(CONFIG.UI.SELECTORS.TOUR_STATUS);
        if (tourStatusElement) {
                tourStatusElement.textContent = `${CONFIG.UI.TEXT.TOUR_COMPLETED}: ${tour.name || 'Tour'}`;
        }
        
        // After the ending message duration, stop the tour playback
        if (tourState.tourEndingTime >= tourState.tourEndingDuration) {
            stopTourPlayback();
            return;
        }
        
        return;
    }
    
    // Update playback time
    tourState.playbackTime += deltaTime;
    
    const currentPoint = tour.points[tourState.currentPointIndex];
    const nextPoint = tour.points[tourState.nextPointIndex];
    
    if (tourState.inTransition) {
        // During transition between points
        const transitionDuration = tour.defaultTransitionDuration || tourState.defaultTransitionDuration || CONFIG.TOURS.DEFAULT_TRANSITION_DURATION;
        tourState.transitionProgress += deltaTime / transitionDuration;
        
        if (tourState.transitionProgress >= 1.0) {
            // Transition complete
            tourState.transitionProgress = 0;
            tourState.inTransition = false;
            tourState.currentPointIndex = tourState.nextPointIndex;
            
            // Update status bar
            const tourStatusElement = document.getElementById(CONFIG.UI.SELECTORS.TOUR_STATUS);
            if (tourStatusElement) {
                const statusText = CONFIG.UI.TEXT.TOUR_POINT_STATUS.replace('{NUM}', `${tourState.currentPointIndex + 1}/${tour.points.length}`);
                tourStatusElement.textContent = `${tour.name || 'Tour'} - ${statusText}`;
            }
            
            // Reset playback time for staying at this point
            tourState.playbackTime = 0;
        } else {
            // Interpolate between currentPoint and nextPoint
            const interpolatedPoint = interpolateTourPoints(currentPoint, nextPoint, tourState.transitionProgress);
            applyTourPoint(interpolatedPoint);
        }
    } else {
        // Staying at the current point
        const stayDuration = tour.defaultStayDuration || tourState.defaultStayDuration || CONFIG.TOURS.DEFAULT_STAY_DURATION;
        
        if (tourState.playbackTime >= stayDuration) {
            // Check if we're at the last point
            if (tourState.currentPointIndex >= tour.points.length - 1) {
                // Enter tour ending state instead of stopping immediately
                tourState.isTourEnding = true;
                tourState.tourEndingTime = 0;
                return;
            }
            
            // Time to move to next point
            tourState.playbackTime = 0;
            tourState.inTransition = true;
            tourState.nextPointIndex = Math.min(tour.points.length - 1, tourState.currentPointIndex + 1);
        }
    }
}

// Module references (cached after first import)
let fractalModule = null;
let shadersModule = null;
let cameraModule = null;

// Pre-load modules to avoid dynamic imports during tour playback
export async function preloadTourModules() {
    // Load core modules needed for tour playback
    if (!fractalModule) fractalModule = await import('./fractal.js');
    if (!shadersModule) shadersModule = await import('./shaders.js');
    if (!cameraModule) cameraModule = await import('./camera.js');
    
    console.log("Tour playback modules preloaded");
    return { fractalModule, shadersModule, cameraModule };
}

// Apply a tour point to the system
async function applyTourPoint(point) {
    // Ensure modules are loaded
    if (!fractalModule || !shadersModule || !cameraModule) {
        await preloadTourModules();
    }
    
    // Apply different aspects of the tour point
    if (point.fractalParams) applyFractalParameters(point.fractalParams);
    if (point.renderQuality) applyRenderQuality(point.renderQuality);
    if (point.crossSection) applyCrossSection(point.crossSection);
    if (point.camera) applyCameraSettings(point.camera);
    
    // Force update stats panel to reflect changes
    if (window.updateStatsPanel) {
        window.updateStatsPanel(true);
    }
}

// Apply fractal parameters from a tour point
function applyFractalParameters(params) {
    if (!fractalModule) return;
    
    // Set quaternion parameters (c value)
    if (params.c && params.c.length === 4) {
        fractalModule.fractalState.params.set(
            params.c[0], params.c[1], params.c[2], params.c[3]
        );
        
        // Update shader uniform
        shadersModule.updateFractalParamsUniform(fractalModule.fractalState.params);
    }
    
    // Set slice parameters
    if (params.sliceValue !== undefined) {
        fractalModule.fractalState.sliceValue = params.sliceValue;
        shadersModule.updateSliceUniform(params.sliceValue);
    }
    
    if (params.sliceAmplitude !== undefined) {
        fractalModule.fractalState.sliceAmplitude = params.sliceAmplitude;
    }
    
    if (params.sliceAnimated !== undefined) {
        fractalModule.fractalState.animateSlice = params.sliceAnimated;
    }
}

// Apply render quality settings from a tour point
function applyRenderQuality(quality) {
    if (!fractalModule || !shadersModule) return;
    
    // Update quality settings in fractal state
    if (quality.iterations !== undefined) {
        fractalModule.qualitySettings.maxIter = quality.iterations;
    }
    
    if (quality.shadows !== undefined) {
        fractalModule.qualitySettings.enableShadows = quality.shadows;
    }
    
    if (quality.ao !== undefined) {
        fractalModule.qualitySettings.enableAO = quality.ao;
    }
    
    if (quality.smoothColor !== undefined) {
        fractalModule.qualitySettings.enableSmoothColor = quality.smoothColor;
    }
    
    if (quality.specular !== undefined) {
        fractalModule.qualitySettings.enableSpecular = quality.specular;
    }
    
    // Apply adaptive ray marching setting
    if (quality.adaptiveRM !== undefined) {
        fractalModule.qualitySettings.enableAdaptiveSteps = quality.adaptiveRM;
        shadersModule.updateAdaptiveStepsUniform(quality.adaptiveRM);
        console.log("Applied Adaptive Ray Marching:", quality.adaptiveRM ? "ON" : "OFF");
    }
    
    // Apply color palette setting
    if (quality.colorPalette !== undefined) {
        // Set the palette index
        fractalModule.colorSettings.paletteIndex = quality.colorPalette;
        // Enable colors if palette index is not 0
        fractalModule.colorSettings.colorEnabled = (quality.colorPalette !== 0);
        
        // Update shader uniforms with proper values
        // Shader expects index 0-9 for palettes (UI uses 0-10 where 0 means "off")
        const shaderPaletteIndex = fractalModule.colorSettings.colorEnabled ? 
            quality.colorPalette - 1 : 0;
        
        shadersModule.updateColorUniforms({
            colorEnabled: fractalModule.colorSettings.colorEnabled,
            paletteIndex: shaderPaletteIndex
        });
        
        console.log("Applied color palette:", quality.colorPalette === 0 ? "OFF" : quality.colorPalette);
    }
    
    // Update all quality uniforms to ensure consistency
    shadersModule.updateQualityUniforms(fractalModule.qualitySettings);
}

// Apply cross-section settings from a tour point
function applyCrossSection(crossSection) {
    if (!fractalModule || !shadersModule) return;
    
    if (crossSection.mode !== undefined) {
        fractalModule.crossSectionSettings.clipMode = crossSection.mode;
        shadersModule.updateClipModeUniform(crossSection.mode);
        console.log("Applied Cross-Section Mode:", crossSection.mode);
    }
    
    if (crossSection.distance !== undefined) {
        fractalModule.crossSectionSettings.clipDistance = crossSection.distance;
        shadersModule.updateClipDistanceUniform(crossSection.distance);
        console.log("Applied Cross-Section Distance:", crossSection.distance.toFixed(2));
    }
}

// Apply camera settings from a tour point
function applyCameraSettings(camera) {
    if (!cameraModule) return;
    
    // Set camera position
    if (camera.position && camera.position.length === 3) {
        cameraModule.cameraState.position.set(
            camera.position[0],
            camera.position[1],
            camera.position[2]
        );
    }
    
    // Set camera rotation
    if (camera.rotation) {
        if (camera.rotation.pitch !== undefined) {
            cameraModule.cameraState.pitch = camera.rotation.pitch;
        }
        
        if (camera.rotation.yaw !== undefined) {
            cameraModule.cameraState.yaw = camera.rotation.yaw;
        }
        
        // Update camera rotation based on pitch and yaw
        cameraModule.updateCameraRotation();
    }
    
    // Set focal length
    if (camera.focalLength !== undefined) {
        cameraModule.cameraState.focalLength = camera.focalLength;
        shadersModule.updateFocalLengthUniform(camera.focalLength);
    }
    
    // Apply camera animation settings
    if (camera.animationEnabled !== undefined) {
        cameraModule.cameraState.animationEnabled = camera.animationEnabled;
    }
    
    if (camera.decelerationEnabled !== undefined) {
        cameraModule.cameraState.decelerationEnabled = camera.decelerationEnabled;
    }
    
    // Update camera state and uniforms
    cameraModule.updateCameraState();
}

// Interpolate between two tour points
function interpolateTourPoints(pointA, pointB, t) {
    // Use smoothstep easing for a more natural transition
    // t = t * t * (3 - 2 * t); // Smoothstep
    t = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; // Smoother easing
    
    const result = {
        fractalParams: {
            c: interpolateArray(pointA.fractalParams.c, pointB.fractalParams.c, t)
        },
        camera: {
            position: interpolateArray(pointA.camera.position, pointB.camera.position, t),
            rotation: {}
        }
    };
    
    // Interpolate other fractal parameters
    if (pointA.fractalParams.sliceValue !== undefined && pointB.fractalParams.sliceValue !== undefined) {
        result.fractalParams.sliceValue = lerp(pointA.fractalParams.sliceValue, pointB.fractalParams.sliceValue, t);
    }
    
    if (pointA.fractalParams.sliceAmplitude !== undefined && pointB.fractalParams.sliceAmplitude !== undefined) {
        result.fractalParams.sliceAmplitude = lerp(pointA.fractalParams.sliceAmplitude, pointB.fractalParams.sliceAmplitude, t);
    }
    
    // For slice animation, use the end point value rather than interpolating
    if (pointB.fractalParams.sliceAnimated !== undefined) {
        result.fractalParams.sliceAnimated = pointB.fractalParams.sliceAnimated;
    }
    
    // Interpolate camera rotation (special care for angle wrapping)
    if (pointA.camera.rotation && pointB.camera.rotation) {
        if (pointA.camera.rotation.pitch !== undefined && pointB.camera.rotation.pitch !== undefined) {
            result.camera.rotation.pitch = lerpAngle(pointA.camera.rotation.pitch, pointB.camera.rotation.pitch, t);
        }
        
        if (pointA.camera.rotation.yaw !== undefined && pointB.camera.rotation.yaw !== undefined) {
            result.camera.rotation.yaw = lerpAngle(pointA.camera.rotation.yaw, pointB.camera.rotation.yaw, t);
        }
    }
    
    // Interpolate focal length
    if (pointA.camera.focalLength !== undefined && pointB.camera.focalLength !== undefined) {
        result.camera.focalLength = lerp(pointA.camera.focalLength, pointB.camera.focalLength, t);
    }
    
    // For quality and rendering settings, use the end point values rather than interpolating
    if (pointB.renderQuality) {
        result.renderQuality = {...pointB.renderQuality};
    }
    
    if (pointB.crossSection) {
        result.crossSection = {...pointB.crossSection};
    }
    
    return result;
}

// Helper: Linear interpolation of two numbers
function lerp(a, b, t) {
    return a + (b - a) * t;
}

// Helper: Angular interpolation (handles wrapping)
function lerpAngle(a, b, t) {
    // Ensure angles are within -PI to PI range
    while (a > Math.PI) a -= 2 * Math.PI;
    while (a < -Math.PI) a += 2 * Math.PI;
    while (b > Math.PI) b -= 2 * Math.PI;
    while (b < -Math.PI) b += 2 * Math.PI;
    
    // Find the shortest path
    let delta = b - a;
    if (delta > Math.PI) delta -= 2 * Math.PI;
    if (delta < -Math.PI) delta += 2 * Math.PI;
    
    return a + delta * t;
}

// Helper: Interpolate arrays of numbers
function interpolateArray(arrA, arrB, t) {
    if (!arrA || !arrB || arrA.length !== arrB.length) {
        return arrB || arrA || [];
    }
    
    return arrA.map((val, i) => lerp(val, arrB[i], t));
}

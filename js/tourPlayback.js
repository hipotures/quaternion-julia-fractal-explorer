import { tourState } from './tour.js';
import { cameraState } from './camera.js';
import { fractalState, qualitySettings, colorSettings, crossSectionSettings } from './fractal.js';

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
    const tourStatusElement = document.getElementById('tour-status');
    const presetMenuElement = document.getElementById('preset-menu');
    
    if (tourStatusElement) {
        tourStatusElement.style.display = 'block';
        tourStatusElement.textContent = `${tourData.name || 'Tour'} - Point 1/${tourData.points.length}`;
    }
    
    // Force hide preset menu immediately through direct DOM manipulation
    // This ensures it's hidden without waiting for the UI module to load
    if (presetMenuElement) {
        presetMenuElement.style.display = 'none';
        presetMenuElement.style.visibility = 'hidden'; // Additional hiding property
        console.log("Force hiding preset menu via direct DOM manipulation");
    } else {
        console.warn("Preset menu element not found for direct hiding!");
        // Try again after a short delay to ensure the DOM is ready
        setTimeout(() => {
            const retryElement = document.getElementById('preset-menu');
            if (retryElement) {
                retryElement.style.display = 'none';
                retryElement.style.visibility = 'hidden';
                console.log("Force hiding preset menu after delay");
            }
        }, 50);
    }
    
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
    const tourStatusElement = document.getElementById('tour-status');
    if (tourStatusElement) {
        tourStatusElement.style.display = 'none';
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
        const tourStatusElement = document.getElementById('tour-status');
        if (tourStatusElement) {
            tourStatusElement.textContent = `Tour Completed: ${tour.name || 'Tour'}`;
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
        const transitionDuration = tour.defaultTransitionDuration || tourState.defaultTransitionDuration;
        tourState.transitionProgress += deltaTime / transitionDuration;
        
        if (tourState.transitionProgress >= 1.0) {
            // Transition complete
            tourState.transitionProgress = 0;
            tourState.inTransition = false;
            tourState.currentPointIndex = tourState.nextPointIndex;
            
            // Update status bar
            const tourStatusElement = document.getElementById('tour-status');
            if (tourStatusElement) {
                tourStatusElement.textContent = `${tour.name || 'Tour'} - Point ${tourState.currentPointIndex + 1}/${tour.points.length}`;
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
        const stayDuration = tour.defaultStayDuration || tourState.defaultStayDuration;
        
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

// Apply a tour point to the system
function applyTourPoint(point) {
    // Apply fractal parameters
    import('./fractal.js').then(module => {
        // Set fractal parameters
        if (point.fractalParams) {
            if (point.fractalParams.c && point.fractalParams.c.length === 4) {
                module.fractalState.params.set(
                    point.fractalParams.c[0],
                    point.fractalParams.c[1],
                    point.fractalParams.c[2],
                    point.fractalParams.c[3]
                );
                
                // Update the shader uniform
                import('./shaders.js').then(shadersModule => {
                    shadersModule.updateFractalParamsUniform(module.fractalState.params);
                });
            }
            
            // Set slice parameters if provided
            if (point.fractalParams.sliceValue !== undefined) {
                module.fractalState.sliceValue = point.fractalParams.sliceValue;
            }
            
            if (point.fractalParams.sliceAmplitude !== undefined) {
                module.fractalState.sliceAmplitude = point.fractalParams.sliceAmplitude;
            }
            
            if (point.fractalParams.sliceAnimated !== undefined) {
                module.fractalState.animateSlice = point.fractalParams.sliceAnimated;
            }
        }
        
        // Apply quality settings
        if (point.renderQuality) {
            if (point.renderQuality.iterations !== undefined) {
                module.qualitySettings.maxIter = point.renderQuality.iterations;
            }
            
            if (point.renderQuality.shadows !== undefined) {
                module.qualitySettings.enableShadows = point.renderQuality.shadows;
            }
            
            if (point.renderQuality.ao !== undefined) {
                module.qualitySettings.enableAO = point.renderQuality.ao;
            }
            
            if (point.renderQuality.smoothColor !== undefined) {
                module.qualitySettings.enableSmoothColor = point.renderQuality.smoothColor;
            }
            
            if (point.renderQuality.specular !== undefined) {
                module.qualitySettings.enableSpecular = point.renderQuality.specular;
            }
            
            if (point.renderQuality.adaptiveRM !== undefined) {
                module.qualitySettings.enableAdaptiveSteps = point.renderQuality.adaptiveRM;
                
                // Adaptive RM requires a special uniform update, not covered by updateQualityUniforms
                import('./shaders.js').then(shadersModule => {
                    shadersModule.updateAdaptiveStepsUniform(point.renderQuality.adaptiveRM);
                    console.log("Applied Adaptive Ray Marching:", point.renderQuality.adaptiveRM ? "ON" : "OFF");
                });
            }
            
            if (point.renderQuality.colorPalette !== undefined) {
                // Set the palette index
                module.colorSettings.paletteIndex = point.renderQuality.colorPalette;
                // Enable colors if palette index is not 0
                module.colorSettings.colorEnabled = (point.renderQuality.colorPalette !== 0);
                
                // Update the shader uniforms with proper values
                // Shader expects index 0-9 for palettes (UI uses 0-10 where 0 means "off")
                const shaderPaletteIndex = module.colorSettings.colorEnabled ? 
                    point.renderQuality.colorPalette - 1 : 0;
                
                import('./shaders.js').then(shadersModule => {
                    shadersModule.updateColorUniforms({
                        colorEnabled: module.colorSettings.colorEnabled,
                        paletteIndex: shaderPaletteIndex
                    });
                });
                
                console.log("Applied color palette:", point.renderQuality.colorPalette === 0 ? 
                    "OFF" : point.renderQuality.colorPalette);
            }
        }
        
        // Apply cross-section settings
        if (point.crossSection) {
            if (point.crossSection.mode !== undefined) {
                module.crossSectionSettings.clipMode = point.crossSection.mode;
                
                // Update clip mode uniform directly
                import('./shaders.js').then(shadersModule => {
                    shadersModule.updateClipModeUniform(point.crossSection.mode);
                    console.log("Applied Cross-Section Mode:", point.crossSection.mode);
                });
            }
            
            if (point.crossSection.distance !== undefined) {
                module.crossSectionSettings.clipDistance = point.crossSection.distance;
                
                // Update clip distance uniform directly
                import('./shaders.js').then(shadersModule => {
                    shadersModule.updateClipDistanceUniform(point.crossSection.distance);
                    console.log("Applied Cross-Section Distance:", point.crossSection.distance.toFixed(2));
                });
            }
        }
    });
    
    // Apply camera parameters
    import('./camera.js').then(module => {
        if (point.camera) {
            // Set camera position
            if (point.camera.position && point.camera.position.length === 3) {
                module.cameraState.position.set(
                    point.camera.position[0],
                    point.camera.position[1],
                    point.camera.position[2]
                );
            }
            
            // Set camera rotation
            if (point.camera.rotation) {
                if (point.camera.rotation.pitch !== undefined) {
                    module.cameraState.pitch = point.camera.rotation.pitch;
                }
                
                if (point.camera.rotation.yaw !== undefined) {
                    module.cameraState.yaw = point.camera.rotation.yaw;
                }
                
                // Update camera rotation based on pitch and yaw
                module.updateCameraRotation();
            }
            
            // Set focal length
            if (point.camera.focalLength !== undefined) {
                module.cameraState.focalLength = point.camera.focalLength;
            }
            
            // Apply camera animation settings if provided
            if (point.camera.animationEnabled !== undefined) {
                module.cameraState.animationEnabled = point.camera.animationEnabled;
            }
            
            if (point.camera.decelerationEnabled !== undefined) {
                module.cameraState.decelerationEnabled = point.camera.decelerationEnabled;
            }
            
            // Update camera state and uniforms
            module.updateCameraState();
        }
    });
    
    // Force update stats panel to reflect changes
    if (window.updateStatsPanel) {
        window.updateStatsPanel(true);
    }
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

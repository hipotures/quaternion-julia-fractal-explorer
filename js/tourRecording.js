import { tourState } from './tour.js';
import { cameraState } from './camera.js';
import { fractalState, qualitySettings, colorSettings, crossSectionSettings } from './fractal.js';

// --- Recording Functions ---

// Capture the current state as a tour point
export function registerTourPoint() {
    // Create a point object with all current parameters
    const point = {
        fractalParams: {
            c: [
                fractalState.params.x,
                fractalState.params.y,
                fractalState.params.z,
                fractalState.params.w
            ],
            sliceValue: fractalState.sliceValue,
            sliceAmplitude: fractalState.sliceAmplitude,
            sliceAnimated: fractalState.animateSlice
        },
        camera: {
            position: [
                cameraState.position.x,
                cameraState.position.y,
                cameraState.position.z
            ],
            rotation: {
                pitch: cameraState.pitch,
                yaw: cameraState.yaw
            },
            focalLength: cameraState.focalLength,
            // Add camera animation settings
            animationEnabled: cameraState.animationEnabled,
            decelerationEnabled: cameraState.decelerationEnabled
        },
        renderQuality: {
            iterations: qualitySettings.maxIter,
            shadows: qualitySettings.enableShadows,
            ao: qualitySettings.enableAO,
            smoothColor: qualitySettings.enableSmoothColor,
            specular: qualitySettings.enableSpecular,
            adaptiveRM: qualitySettings.enableAdaptiveSteps,
            colorPalette: colorSettings.paletteIndex
        },
        crossSection: {
            mode: crossSectionSettings.clipMode,
            distance: crossSectionSettings.clipDistance
        }
    };

    // Add point to the tour
    tourState.points.push(point);
    tourState.currentPointCount++;

    console.log(`Tour point #${tourState.currentPointCount} registered`);
    return tourState.currentPointCount;
}

// Start a new tour recording session
export function startTourRecording() {
    // Clear any existing points
    tourState.points = [];
    tourState.currentPointCount = 0;
    tourState.isRecording = true;
    
    console.log("Tour recording started");
    return true;
}

// Finish and save the current tour recording
export function finishTourRecording() {
    if (!tourState.isRecording || tourState.points.length === 0) {
        console.log("No tour to finish - start recording first");
        return false;
    }

    // Create the tour object with metadata
    const tour = {
        name: "Tour",
        created: new Date().toISOString(),
        defaultTransitionDuration: tourState.defaultTransitionDuration,
        defaultStayDuration: tourState.defaultStayDuration,
        points: tourState.points
    };

    // Generate filename with timestamp
    const now = new Date();
    const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
    const filename = `${timestamp}.json`;

    // Convert to JSON
    const jsonContent = JSON.stringify(tour, null, 2);
    
    // Create download link
    const downloadLink = document.createElement('a');
    downloadLink.href = 'data:application/json;charset=utf-8,' + encodeURIComponent(jsonContent);
    downloadLink.download = filename;
    
    // Append to document, trigger click, and remove
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    
    // Reset recording state
    tourState.isRecording = false;
    
    console.log(`Tour saved to ${filename} with ${tourState.points.length} points`);
    return filename;
}

// Cancel the current tour recording without saving
export function cancelTourRecording() {
    tourState.points = [];
    tourState.currentPointCount = 0;
    tourState.isRecording = false;
    
    console.log("Tour recording canceled");
    return true;
}

// Check if a tour is currently being recorded
export function isTourRecording() {
    return tourState.isRecording;
}

// Get the current number of recorded points
export function getTourPointCount() {
    return tourState.currentPointCount;
}

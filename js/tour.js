import { cameraState } from './camera.js';
import { fractalState, qualitySettings, colorSettings, crossSectionSettings } from './fractal.js';

// --- Tour State ---
export const tourState = {
    // Recording state
    isRecording: false,      // Flag indicating if we're currently recording a tour
    points: [],              // Array of recorded points
    currentPointCount: 0,    // Number of points recorded in current tour
    
    // Playback state
    isPlaying: false,        // Flag indicating if a tour is currently playing
    currentTour: null,       // The currently loaded tour data
    currentPointIndex: 0,    // Index of the current point in playback
    nextPointIndex: 0,       // Index of the next point to transition to
    playbackTime: 0,         // Current time in the playback sequence
    inTransition: false,     // Whether currently transitioning between points
    transitionProgress: 0,   // Progress (0-1) of current transition
    isTourEnding: false,     // Flag indicating if we're showing the tour ending message
    tourEndingTime: 0,       // Timer for the tour ending message display
    
    // Timing parameters
    defaultTransitionDuration: 5.0,  // Default time to transition between points (in seconds)
    defaultStayDuration: 3.0,        // Default time to stay at each point (in seconds)
    tourEndingDuration: 3.0,         // Duration to show "Tour Completed" message (in seconds)
    
    // Available tours
    availableTours: [],      // List of available tour files
    
    // UI state before playback (to restore after tour ends)
    uiStateBeforePlayback: {
        presetMenuVisible: true,
        statsVisible: true,
        menuVisible: true
    }
};

// Expose state globally for debugging/compatibility
window.tourState = tourState;

// --- Tour Loading Functions ---

// Load all available tours from the 'tours' directory
export async function loadAvailableTours() {
    try {
        tourState.availableTours = [];
        let index = 1;
        let hasMore = true;
        
        // Dynamically try loading tour files with incrementing numbers
        // until we encounter the first missing file
        while (hasMore) {
            const fileName = `tour${index.toString().padStart(2, '0')}.json`;
            try {
                const response = await fetch(`tours/${fileName}`);
                if (response.ok) {
                    // Successfully loaded this tour file
                    const tourData = await response.json();
                    
                    // Import validateTourData from tourPlayback.js to validate the tour data
                    const { validateTourData } = await import('./tourPlayback.js');
                    
                    // Validate tour data
                    if (validateTourData(tourData)) {
                        tourState.availableTours.push({
                            fileName: fileName,
                            name: tourData.name || 'Unnamed Tour',
                            created: tourData.created,
                            pointCount: tourData.points?.length || 0,
                            data: tourData
                        });
                        
                        console.log(`Loaded tour: ${tourData.name} (${fileName})`);
                    } else {
                        console.warn(`Skipped invalid tour file: ${fileName}`);
                    }
                    
                    // Try the next file
                    index++;
                } else {
                    // Stop when we get a 404 or other error
                    console.log(`No more tour files found after ${index-1}`);
                    hasMore = false;
                }
            } catch (e) {
                console.error(`Error loading tour file ${fileName}:`, e);
                hasMore = false;
            }
        }
        
        console.log(`Loaded ${tourState.availableTours.length} tour(s)`);
        return tourState.availableTours;
    } catch (e) {
        console.error("Error loading tours:", e);
        return [];
    }
}

// Get available tours (returns array of tour metadata)
export function getAvailableTours() {
    return tourState.availableTours;
}

// --- Re-export functions from tourRecording.js and tourPlayback.js ---

// Export recording functions from tourRecording.js
export { 
    registerTourPoint,
    startTourRecording,
    finishTourRecording,
    cancelTourRecording,
    isTourRecording,
    getTourPointCount
} from './tourRecording.js';

// Export playback functions from tourPlayback.js
export {
    validateTourData,
    startTourPlayback,
    pauseTourPlayback,
    stopTourPlayback,
    isTourPlaying,
    updateTourPlayback
} from './tourPlayback.js';

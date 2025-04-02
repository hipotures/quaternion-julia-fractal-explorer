import { renderer, scene } from './scene.js';
import { fractalState, qualitySettings, colorSettings, crossSectionSettings } from './fractal.js';
import { camera, cameraState } from './camera.js';
import { CONFIG } from './config.js';

// Function to get fractal state (similar to registerTourPoint from tourRecording.js)
export function getFractalState() {
    return {
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
        },
        timestamp: new Date().toISOString(),
        application: "Quaternion Julia Fractals Viewer"
    };
}

// Function for proper scaling while maintaining aspect ratio
function rescaleImage(canvas, maxWidth, maxHeight) {
    const originalWidth = canvas.width;
    const originalHeight = canvas.height;
    
    // If scaling is disabled or there are no constraints, return original dimensions
    if (!CONFIG.SCREENSHOT.RESCALING.ENABLED || !maxWidth || !maxHeight) {
        return {
            width: originalWidth,
            height: originalHeight,
            canvas: canvas
        };
    }
    
    // Calculate scaling factors
    const widthRatio = maxWidth / originalWidth;
    const heightRatio = maxHeight / originalHeight;
    
    // Choose the smaller factor (more restrictive)
    const ratio = Math.min(widthRatio, heightRatio);
    
    // Calculate new dimensions
    const newWidth = Math.floor(originalWidth * ratio);
    const newHeight = Math.floor(originalHeight * ratio);
    
    // Create a new canvas with appropriate size
    const scaledCanvas = document.createElement('canvas');
    scaledCanvas.width = newWidth;
    scaledCanvas.height = newHeight;
    
    // Scale the image
    const ctx = scaledCanvas.getContext('2d');
    ctx.drawImage(canvas, 0, 0, newWidth, newHeight);
    
    return {
        width: newWidth,
        height: newHeight,
        canvas: scaledCanvas
    };
}

// Function to manage UI elements during screenshot
let originalUIState = null;

function hideUIForScreenshot() {
    const menuPanel = document.getElementById(CONFIG.UI.SELECTORS.MENU_PANEL);
    const statsPanel = document.getElementById(CONFIG.UI.SELECTORS.STATS_PANEL);
    const presetMenu = document.getElementById(CONFIG.UI.SELECTORS.PRESET_MENU);
    const tourMenu = document.getElementById(CONFIG.UI.SELECTORS.TOUR_MENU);
    const tourStatus = document.getElementById(CONFIG.UI.SELECTORS.TOUR_STATUS);
    const recordingIndicator = document.getElementById(CONFIG.UI.SELECTORS.RECORDING_INDICATOR);
    
    // Save current UI state
    originalUIState = {
        menuPanel: menuPanel ? menuPanel.style.display : null,
        statsPanel: statsPanel ? statsPanel.style.display : null,
        presetMenu: presetMenu ? presetMenu.style.display : null,
        tourMenu: tourMenu ? tourMenu.style.display : null,
        tourStatus: tourStatus ? tourStatus.style.display : null,
        recordingIndicator: recordingIndicator ? recordingIndicator.style.display : null
    };
    
    // Hide all UI elements
    if (menuPanel) menuPanel.style.display = 'none';
    if (statsPanel) statsPanel.style.display = 'none';
    if (presetMenu) presetMenu.style.display = 'none';
    if (tourMenu) tourMenu.style.display = 'none';
    if (tourStatus) tourStatus.style.display = 'none';
    if (recordingIndicator) recordingIndicator.style.display = 'none';
}

function restoreUIAfterScreenshot() {
    if (!originalUIState) return;
    
    const menuPanel = document.getElementById(CONFIG.UI.SELECTORS.MENU_PANEL);
    const statsPanel = document.getElementById(CONFIG.UI.SELECTORS.STATS_PANEL);
    const presetMenu = document.getElementById(CONFIG.UI.SELECTORS.PRESET_MENU);
    const tourMenu = document.getElementById(CONFIG.UI.SELECTORS.TOUR_MENU);
    const tourStatus = document.getElementById(CONFIG.UI.SELECTORS.TOUR_STATUS);
    const recordingIndicator = document.getElementById(CONFIG.UI.SELECTORS.RECORDING_INDICATOR);
    
    // Restore original UI state
    if (menuPanel && originalUIState.menuPanel) menuPanel.style.display = originalUIState.menuPanel;
    if (statsPanel && originalUIState.statsPanel) statsPanel.style.display = originalUIState.statsPanel;
    if (presetMenu && originalUIState.presetMenu) presetMenu.style.display = originalUIState.presetMenu;
    if (tourMenu && originalUIState.tourMenu) tourMenu.style.display = originalUIState.tourMenu;
    if (tourStatus && originalUIState.tourStatus) tourStatus.style.display = originalUIState.tourStatus;
    if (recordingIndicator && originalUIState.recordingIndicator) recordingIndicator.style.display = originalUIState.recordingIndicator;
    
    originalUIState = null;
}

// Save fractal state to JSON file
async function saveFractalState(baseFilename) {
    if (!CONFIG.SCREENSHOT.SAVE_STATE) return;
    
    try {
        // Get fractal state
        const state = getFractalState();
        
        // Convert to JSON
        const jsonContent = JSON.stringify(state, null, 2);
        
        // Create file for download
        const jsonFilename = `${baseFilename}.json`;
        const blob = new Blob([jsonContent], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        // Download file
        const link = document.createElement('a');
        link.href = url;
        link.download = jsonFilename;
        document.body.appendChild(link);
        link.click();
        
        // Cleanup
        setTimeout(() => {
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }, 100);
        
        console.log(`Fractal state saved: ${jsonFilename}`);
    } catch (error) {
        console.error("Error saving fractal state:", error);
    }
}

// Function to take a screenshot of the entire visible area (with UI)
async function takeFullPageScreenshot() {
    try {
        // We'll use a simpler approach - we'll just let the browser render the UI
        // This works because for Shift+S, we don't hide the UI elements
        
        // First, prepare canvas for the fractal
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        // Create a new canvas for drawing
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = width;
        tempCanvas.height = height;
        const ctx = tempCanvas.getContext('2d');
        
        // Draw the WebGL canvas (fractal) first
        ctx.drawImage(renderer.domElement, 0, 0);
        
        // Get the main UI containers
        const menuPanel = document.getElementById(CONFIG.UI.SELECTORS.MENU_PANEL);
        const statsPanel = document.getElementById(CONFIG.UI.SELECTORS.STATS_PANEL);
        const presetMenu = document.getElementById(CONFIG.UI.SELECTORS.PRESET_MENU);
        const tourMenu = document.getElementById(CONFIG.UI.SELECTORS.TOUR_MENU);
        
        // Simple alternative that's more reliable than the DOM-to-canvas approach
        // Just manually draw the key UI components with their text
        
        // Draw the menu panel with proper styling
        if (menuPanel && getComputedStyle(menuPanel).display !== 'none') {
            const rect = menuPanel.getBoundingClientRect();
            const style = getComputedStyle(menuPanel);
            
            // Background
            ctx.fillStyle = style.backgroundColor || 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(rect.left, rect.top, rect.width, rect.height);
            
            // Border
            if (style.borderWidth && parseInt(style.borderWidth) > 0) {
                ctx.strokeStyle = style.borderColor || '#333';
                ctx.lineWidth = parseInt(style.borderWidth) || 1;
                ctx.strokeRect(rect.left, rect.top, rect.width, rect.height);
            }
            
            // Find main sections inside menu
            const sections = menuPanel.querySelectorAll('.menu-section, h2, h3');
            for (const section of sections) {
                const sectionRect = section.getBoundingClientRect();
                const sectionStyle = getComputedStyle(section);
                
                // Section header
                if (section.tagName === 'H2' || section.tagName === 'H3') {
                    ctx.font = `${sectionStyle.fontWeight} ${sectionStyle.fontSize} ${sectionStyle.fontFamily}`;
                    ctx.fillStyle = sectionStyle.color || '#fff';
                    ctx.fillText(section.textContent, sectionRect.left + 5, sectionRect.top + parseInt(sectionStyle.fontSize));
                }
            }
        }
        
        // Draw stats panel
        if (statsPanel && getComputedStyle(statsPanel).display !== 'none') {
            const rect = statsPanel.getBoundingClientRect();
            const style = getComputedStyle(statsPanel);
            
            // Background
            ctx.fillStyle = style.backgroundColor || 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(rect.left, rect.top, rect.width, rect.height);
            
            // Try to preserve key info
            ctx.font = '12px Arial';
            ctx.fillStyle = '#fff';
            ctx.fillText('Fractal Stats', rect.left + 10, rect.top + 20);
        }
        
        // Draw preset menu
        if (presetMenu && getComputedStyle(presetMenu).display !== 'none') {
            const rect = presetMenu.getBoundingClientRect();
            
            // Background
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(rect.left, rect.top, rect.width, rect.height);
            
            // Add buttons (this is simplified)
            const buttons = presetMenu.querySelectorAll('button');
            let y = rect.top + 20;
            for (const button of buttons) {
                const buttonRect = button.getBoundingClientRect();
                ctx.fillStyle = '#444';
                ctx.fillRect(buttonRect.left, buttonRect.top, buttonRect.width, buttonRect.height);
                
                ctx.font = '12px Arial';
                ctx.fillStyle = '#fff';
                ctx.fillText(button.textContent, buttonRect.left + 5, buttonRect.top + 15);
            }
        }
        
        return tempCanvas;
    } catch (error) {
        console.error("Error in full page screenshot:", error);
        throw error;
    }
}

// Main function for taking a screenshot
export async function takeScreenshot(includeUI = false) {
    if (!renderer || !renderer.domElement) {
        console.error("Canvas not available");
        return false;
    }
    
    try {
        // Save current preserveDrawingBuffer setting
        const originalPreserveDrawingBuffer = renderer.preserveDrawingBuffer;
        
        // Enable preserveDrawingBuffer to allow proper WebGL screenshots
        renderer.preserveDrawingBuffer = true;
        
        // Force scene redraw before screenshot
        if (scene) {
            renderer.render(scene, camera);
        }
        
        let screenshotData;
        
        if (includeUI) {
            try {
                // Attempt to capture full screen with UI
                screenshotData = await takeFullPageScreenshot();
            } catch (error) {
                console.error("Full page screenshot failed, falling back to canvas only:", error);
                // Fallback to regular canvas screenshot
                includeUI = false;
            }
        }
        
        if (!includeUI) {
            // Hide UI before screenshot
            hideUIForScreenshot();
            
            // Give time for page to redraw without UI
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Force scene redraw again before screenshot
            if (scene) {
                renderer.render(scene, camera);
            }
            
            // Canvas dimensions
            const canvas = renderer.domElement;
            
            // Create new 2D Canvas to copy WebGL canvas content
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = canvas.width;
            tempCanvas.height = canvas.height;
            const ctx = tempCanvas.getContext('2d');
            
            // Copy WebGL canvas content to 2D canvas
            ctx.drawImage(canvas, 0, 0);
            
            screenshotData = tempCanvas;
        }
        
        // Take screenshot (potentially scaled)
        if (CONFIG.SCREENSHOT.RESCALING.ENABLED) {
            const scaled = rescaleImage(
                screenshotData, 
                CONFIG.SCREENSHOT.RESCALING.MAX_WIDTH, 
                CONFIG.SCREENSHOT.RESCALING.MAX_HEIGHT
            );
            screenshotData = scaled.canvas;
        }
        
        // Find format based on configuration
        const formatConfig = CONFIG.SCREENSHOT.FORMATS.find(
            f => f.id === CONFIG.SCREENSHOT.DEFAULT_FORMAT
        ) || CONFIG.SCREENSHOT.FORMATS[0];
        
        // Conversion options for formats with compression
        const options = formatConfig.quality ? { quality: formatConfig.quality } : undefined;
        
        // Get image data (using 2D canvas, which always works correctly with toDataURL)
        const dataURL = screenshotData.toDataURL(formatConfig.mime, options);
        
        // Restore original preserveDrawingBuffer setting
        renderer.preserveDrawingBuffer = originalPreserveDrawingBuffer;
        
        // Generate filename with timestamp
        const now = new Date();
        const timestamp = `${now.getFullYear()}${(now.getMonth()+1).toString().padStart(2,'0')}${now.getDate().toString().padStart(2,'0')}_${now.getHours().toString().padStart(2,'0')}${now.getMinutes().toString().padStart(2,'0')}${now.getSeconds().toString().padStart(2,'0')}`;
        const baseFilename = `qjf_${timestamp}`;
        const filename = `${baseFilename}.${formatConfig.extension}`;
        
        // Create download link
        const link = document.createElement('a');
        link.href = dataURL;
        link.download = filename;
        link.style.display = 'none';
        document.body.appendChild(link);
        
        // Click link to download
        link.click();
        
        // Save fractal state to JSON file
        await saveFractalState(baseFilename);
        
        // Cleanup
        setTimeout(() => {
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);
        }, 100);
        
        console.log(`Screenshot saved: ${filename}`);
        return true;
    } catch (error) {
        console.error("Error taking screenshot:", error);
        return false;
    } finally {
        // Always restore UI if it was hidden
        if (!includeUI) {
            restoreUIAfterScreenshot();
        }
    }
}

// Helper function for handling screenshot keys
export function handleScreenshotKeys(key, isShiftPressed) {
    if (key.toLowerCase() === CONFIG.SCREENSHOT.KEYS.TAKE_SCREENSHOT) {
        // Capital S with shift - with UI, lowercase s - without UI
        const includeUI = isShiftPressed;
        console.log(`Taking screenshot ${includeUI ? 'with' : 'without'} UI...`);
        takeScreenshot(includeUI);
    }
}

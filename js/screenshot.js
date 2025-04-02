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

// Function to try to capture UI elements using more sophisticated methods
async function takeFullPageScreenshot() {
    try {
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        // Create a canvas with the size of the viewport
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = width;
        tempCanvas.height = height;
        const ctx = tempCanvas.getContext('2d');
        
        // First draw the WebGL canvas (fractal)
        ctx.drawImage(renderer.domElement, 0, 0);
        
        // Try to capture the entire HTML document
        // Get every visible element and try to render it on canvas
        const elementsToCapture = document.querySelectorAll('div, span, button, p, h1, h2, h3, h4, h5, h6');
        
        Array.from(elementsToCapture)
            .filter(el => {
                // Only consider visible elements
                const style = window.getComputedStyle(el);
                const rect = el.getBoundingClientRect();
                return style.display !== 'none' && 
                       style.visibility !== 'hidden' && 
                       style.opacity !== '0' &&
                       rect.width > 0 && 
                       rect.height > 0;
            })
            .sort((a, b) => {
                // Sort by z-index to draw layers correctly
                const styleA = window.getComputedStyle(a);
                const styleB = window.getComputedStyle(b);
                return (parseInt(styleA.zIndex) || 0) - (parseInt(styleB.zIndex) || 0);
            })
            .forEach(el => {
                try {
                    const rect = el.getBoundingClientRect();
                    const style = window.getComputedStyle(el);
                    
                    // Draw background if present and not transparent
                    if (style.backgroundColor && style.backgroundColor !== 'rgba(0, 0, 0, 0)') {
                        ctx.fillStyle = style.backgroundColor;
                        ctx.fillRect(rect.left, rect.top, rect.width, rect.height);
                    }
                    
                    // Draw borders if present
                    if (parseInt(style.borderWidth) > 0) {
                        ctx.strokeStyle = style.borderColor;
                        ctx.lineWidth = parseInt(style.borderWidth);
                        ctx.strokeRect(rect.left, rect.top, rect.width, rect.height);
                    }
                    
                    // Add text content if present
                    if (el.textContent && el.textContent.trim() !== '') {
                        ctx.fillStyle = style.color;
                        ctx.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
                        ctx.textBaseline = 'top';
                        
                        // Calculate text position with padding
                        const paddingLeft = parseInt(style.paddingLeft) || 0;
                        const paddingTop = parseInt(style.paddingTop) || 0;
                        const x = rect.left + paddingLeft;
                        const y = rect.top + paddingTop;
                        
                        // Get text lines
                        const words = el.textContent.split(' ');
                        let line = '';
                        let lineY = y;
                        const lineHeight = parseInt(style.lineHeight) || parseInt(style.fontSize) * 1.2;
                        
                        // Handle multi-line text
                        for (let n = 0; n < words.length; n++) {
                            const testLine = line + words[n] + ' ';
                            const metrics = ctx.measureText(testLine);
                            if (x + metrics.width > rect.right && n > 0) {
                                ctx.fillText(line, x, lineY);
                                line = words[n] + ' ';
                                lineY += lineHeight;
                            } else {
                                line = testLine;
                            }
                        }
                        ctx.fillText(line, x, lineY);
                    }
                    
                    // Try to capture images within elements
                    const images = el.querySelectorAll('img');
                    images.forEach(img => {
                        if (img.complete && img.naturalWidth > 0) {
                            const imgRect = img.getBoundingClientRect();
                            ctx.drawImage(img, imgRect.left, imgRect.top, imgRect.width, imgRect.height);
                        }
                    });
                    
                } catch (err) {
                    console.warn("Error capturing element:", err);
                }
            });
        
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

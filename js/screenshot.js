import { renderer, scene } from './scene.js';
import { fractalState, qualitySettings, colorSettings, crossSectionSettings } from './fractal.js';
import { camera, cameraState } from './camera.js';
import { CONFIG } from './config.js';

// Funkcja pozyskująca stan fraktala (podobna do registerTourPoint z tourRecording.js)
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

// Funkcja do prawidłowego skalowania z zachowaniem proporcji
function rescaleImage(canvas, maxWidth, maxHeight) {
    const originalWidth = canvas.width;
    const originalHeight = canvas.height;
    
    // Jeśli skalowanie jest wyłączone lub nie ma ograniczeń, zwróć oryginalne wymiary
    if (!CONFIG.SCREENSHOT.RESCALING.ENABLED || !maxWidth || !maxHeight) {
        return {
            width: originalWidth,
            height: originalHeight,
            canvas: canvas
        };
    }
    
    // Oblicz współczynniki skalowania
    const widthRatio = maxWidth / originalWidth;
    const heightRatio = maxHeight / originalHeight;
    
    // Wybierz mniejszy współczynnik (bardziej ograniczający)
    const ratio = Math.min(widthRatio, heightRatio);
    
    // Oblicz nowe wymiary
    const newWidth = Math.floor(originalWidth * ratio);
    const newHeight = Math.floor(originalHeight * ratio);
    
    // Utwórz nowy canvas o odpowiednim rozmiarze
    const scaledCanvas = document.createElement('canvas');
    scaledCanvas.width = newWidth;
    scaledCanvas.height = newHeight;
    
    // Przeskaluj obraz
    const ctx = scaledCanvas.getContext('2d');
    ctx.drawImage(canvas, 0, 0, newWidth, newHeight);
    
    return {
        width: newWidth,
        height: newHeight,
        canvas: scaledCanvas
    };
}

// Funkcja do zarządzania elementami UI podczas zrzutu ekranu
let originalUIState = null;

function hideUIForScreenshot() {
    const menuPanel = document.getElementById(CONFIG.UI.SELECTORS.MENU_PANEL);
    const statsPanel = document.getElementById(CONFIG.UI.SELECTORS.STATS_PANEL);
    const presetMenu = document.getElementById(CONFIG.UI.SELECTORS.PRESET_MENU);
    const tourMenu = document.getElementById(CONFIG.UI.SELECTORS.TOUR_MENU);
    const tourStatus = document.getElementById(CONFIG.UI.SELECTORS.TOUR_STATUS);
    const recordingIndicator = document.getElementById(CONFIG.UI.SELECTORS.RECORDING_INDICATOR);
    
    // Zapisz aktualny stan UI
    originalUIState = {
        menuPanel: menuPanel ? menuPanel.style.display : null,
        statsPanel: statsPanel ? statsPanel.style.display : null,
        presetMenu: presetMenu ? presetMenu.style.display : null,
        tourMenu: tourMenu ? tourMenu.style.display : null,
        tourStatus: tourStatus ? tourStatus.style.display : null,
        recordingIndicator: recordingIndicator ? recordingIndicator.style.display : null
    };
    
    // Ukryj wszystkie elementy UI
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
    
    // Przywróć oryginalny stan UI
    if (menuPanel && originalUIState.menuPanel) menuPanel.style.display = originalUIState.menuPanel;
    if (statsPanel && originalUIState.statsPanel) statsPanel.style.display = originalUIState.statsPanel;
    if (presetMenu && originalUIState.presetMenu) presetMenu.style.display = originalUIState.presetMenu;
    if (tourMenu && originalUIState.tourMenu) tourMenu.style.display = originalUIState.tourMenu;
    if (tourStatus && originalUIState.tourStatus) tourStatus.style.display = originalUIState.tourStatus;
    if (recordingIndicator && originalUIState.recordingIndicator) recordingIndicator.style.display = originalUIState.recordingIndicator;
    
    originalUIState = null;
}

// Zapisz stan fraktala do pliku JSON
async function saveFractalState(baseFilename) {
    if (!CONFIG.SCREENSHOT.SAVE_STATE) return;
    
    try {
        // Pobierz stan fraktala
        const state = getFractalState();
        
        // Konwertuj do JSON
        const jsonContent = JSON.stringify(state, null, 2);
        
        // Utwórz plik do pobrania
        const jsonFilename = `${baseFilename}.json`;
        const blob = new Blob([jsonContent], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        // Pobierz plik
        const link = document.createElement('a');
        link.href = url;
        link.download = jsonFilename;
        document.body.appendChild(link);
        link.click();
        
        // Posprzątaj
        setTimeout(() => {
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }, 100);
        
        console.log(`Fractal state saved: ${jsonFilename}`);
    } catch (error) {
        console.error("Error saving fractal state:", error);
    }
}

// Funkcja do zrzutu całego widocznego obszaru (z UI)
async function takeFullPageScreenshot() {
    try {
        // Użyjemy html2canvas do zrzutu całej strony
        // Najpierw przygotujmy canvas dla fraktala
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        // Utwórz nowy canvas do rysowania
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = width;
        tempCanvas.height = height;
        const ctx = tempCanvas.getContext('2d');
        
        // Narysuj WebGL canvas (fraktal)
        ctx.drawImage(renderer.domElement, 0, 0);
        
        // Pobieramy wszystkie elementy UI
        const elements = document.querySelectorAll('div, span, button, p');
        
        // Filtrujemy do tych, które są widoczne i dodajemy je do canvasa
        for (const el of elements) {
            if (el.offsetParent === null) continue; // Element jest ukryty
            
            const rect = el.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) continue;
            
            // Tworzymy "zrzut" elementu jako canvas
            // W rzeczywistości rysujemy odpowiednie kolory tła i obramowania
            ctx.save();
            ctx.fillStyle = getComputedStyle(el).backgroundColor;
            if (ctx.fillStyle !== 'rgba(0, 0, 0, 0)') {
                ctx.fillRect(rect.left, rect.top, rect.width, rect.height);
            }
            
            // Jeśli element ma tekst, dodajemy go
            if (el.innerText) {
                const style = getComputedStyle(el);
                ctx.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
                ctx.fillStyle = style.color;
                ctx.fillText(el.innerText, rect.left + 5, rect.top + parseInt(style.fontSize));
            }
            
            // Rysujemy obramowanie, jeśli istnieje
            const borderWidth = parseInt(getComputedStyle(el).borderWidth);
            if (borderWidth > 0) {
                ctx.strokeStyle = getComputedStyle(el).borderColor;
                ctx.lineWidth = borderWidth;
                ctx.strokeRect(rect.left, rect.top, rect.width, rect.height);
            }
            
            ctx.restore();
        }
        
        return tempCanvas;
    } catch (error) {
        console.error("Error in full page screenshot:", error);
        throw error;
    }
}

// Główna funkcja wykonująca zrzut ekranu
export async function takeScreenshot(includeUI = false) {
    if (!renderer || !renderer.domElement) {
        console.error("Canvas not available");
        return false;
    }
    
    try {
        // Zapisz obecne ustawienie preserveDrawingBuffer
        const originalPreserveDrawingBuffer = renderer.preserveDrawingBuffer;
        
        // Włącz preserveDrawingBuffer aby umożliwić poprawne zrzuty ekranu WebGL
        renderer.preserveDrawingBuffer = true;
        
        // Wymuś przerysowanie sceny przed zrzutem ekranu
        if (scene) {
            renderer.render(scene, camera);
        }
        
        let screenshotData;
        
        if (includeUI) {
            try {
                // Próba zrzutu całego ekranu z UI
                screenshotData = await takeFullPageScreenshot();
            } catch (error) {
                console.error("Full page screenshot failed, falling back to canvas only:", error);
                // Fallback do zwykłego zrzutu canvas
                includeUI = false;
            }
        }
        
        if (!includeUI) {
            // Ukryj UI przed zrzutem
            hideUIForScreenshot();
            
            // Daj czas na przerysowanie strony bez UI
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Wymuś ponowne przerysowanie sceny przed zrzutem ekranu
            if (scene) {
                renderer.render(scene, camera);
            }
            
            // Wymiary canvas
            const canvas = renderer.domElement;
            
            // Utwórz nowy Canvas 2D aby skopiować zawartość WebGL canvas
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = canvas.width;
            tempCanvas.height = canvas.height;
            const ctx = tempCanvas.getContext('2d');
            
            // Kopiuj zawartość canvas WebGL do canvas 2D
            ctx.drawImage(canvas, 0, 0);
            
            screenshotData = tempCanvas;
        }
        
        // Wykonaj zrzut ekranu (ewentualnie przeskalowany)
        if (CONFIG.SCREENSHOT.RESCALING.ENABLED) {
            const scaled = rescaleImage(
                screenshotData, 
                CONFIG.SCREENSHOT.RESCALING.MAX_WIDTH, 
                CONFIG.SCREENSHOT.RESCALING.MAX_HEIGHT
            );
            screenshotData = scaled.canvas;
        }
        
        // Znajdź format na podstawie konfiguracji
        const formatConfig = CONFIG.SCREENSHOT.FORMATS.find(
            f => f.id === CONFIG.SCREENSHOT.DEFAULT_FORMAT
        ) || CONFIG.SCREENSHOT.FORMATS[0];
        
        // Opcje konwersji dla formatów z możliwością kompresji
        const options = formatConfig.quality ? { quality: formatConfig.quality } : undefined;
        
        // Pozyskaj dane obrazu (używając canvas 2D, który zawsze działa poprawnie z toDataURL)
        const dataURL = screenshotData.toDataURL(formatConfig.mime, options);
        
        // Przywróć oryginalne ustawienie preserveDrawingBuffer
        renderer.preserveDrawingBuffer = originalPreserveDrawingBuffer;
        
        // Generuj nazwę pliku z timestampem
        const now = new Date();
        const timestamp = `${now.getFullYear()}${(now.getMonth()+1).toString().padStart(2,'0')}${now.getDate().toString().padStart(2,'0')}_${now.getHours().toString().padStart(2,'0')}${now.getMinutes().toString().padStart(2,'0')}${now.getSeconds().toString().padStart(2,'0')}`;
        const baseFilename = `qjf_${timestamp}`;
        const filename = `${baseFilename}.${formatConfig.extension}`;
        
        // Utwórz link do pobrania
        const link = document.createElement('a');
        link.href = dataURL;
        link.download = filename;
        link.style.display = 'none';
        document.body.appendChild(link);
        
        // Kliknij link, aby pobrać
        link.click();
        
        // Zapisz stan fraktala do pliku JSON
        await saveFractalState(baseFilename);
        
        // Posprzątaj
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
        // Zawsze przywróć UI, jeśli było ukryte
        if (!includeUI) {
            restoreUIAfterScreenshot();
        }
    }
}

// Funkcja pomocnicza do obsługi klawiszy screenshot
export function handleScreenshotKeys(key, isShiftPressed) {
    if (key.toLowerCase() === CONFIG.SCREENSHOT.KEYS.TAKE_SCREENSHOT) {
        // Duża litera S z shiftem - z UI, mała s - bez UI
        const includeUI = isShiftPressed;
        console.log(`Taking screenshot ${includeUI ? 'with' : 'without'} UI...`);
        takeScreenshot(includeUI);
    }
}

/**
 * Tweakpane UI Presets Folder Module
 * Contains UI controls for presets management
 * 
 * @module tweakpane-ui/presets-ui
 */

import { pane, folders } from './core.js';
import { resetAllToDefaults } from './settings-reset.js';
import { saveCurrentSettings, loadSavedSettings } from './settings-storage.js';
import { exportSettingsToFile, importSettingsFromFile } from './settings-io.js';

/**
 * Creates the presets management section in the UI
 */
export function createPresetsFolder() {
    // Create main folder
    folders.presets = pane.addFolder({
        title: 'Presets & Settings',
        expanded: true
    });
    
    // Reset all to default values button
    folders.presets.addButton({
        title: '🔄 Reset All to Defaults'
    }).on('click', () => {
        resetAllToDefaults();
    });
    
    // Save current state
    folders.presets.addButton({
        title: '💾 Save Current Settings'
    }).on('click', () => {
        saveCurrentSettings();
    });
    
    // Load state from localStorage
    folders.presets.addButton({
        title: '📂 Load Saved Settings'
    }).on('click', () => {
        loadSavedSettings();
    });
    
    // Export to file
    folders.presets.addButton({
        title: '📤 Export Settings to File'
    }).on('click', () => {
        exportSettingsToFile();
    });
    
    // Import from file button
    folders.presets.addButton({
        title: '📥 Import Settings from File'
    }).on('click', () => {
        importSettingsFromFile();
    });

    // --- Tour Management Separator ---
    folders.presets.addSeparator();

    // Export last recorded tour
    folders.presets.addButton({
        title: '📤 Export Last Recorded Tour'
    }).on('click', () => {
        // Dynamically import and call finishTourRecording
        import('../../js/tourRecording.js').then(tourRecordingModule => {
            if (tourRecordingModule.getTourPointCount() > 0) {
                tourRecordingModule.finishTourRecording();
            } else {
                alert("No tour points recorded yet. Please record a tour before exporting.");
                console.warn("Export Tour: No points recorded.");
            }
        }).catch(error => {
            console.error("Failed to load tourRecording.js for export:", error);
            alert("Error exporting tour. Check console for details.");
        });
    });

    // Import tour from file button
    folders.presets.addButton({
        title: '📥 Import Tour from File'
    }).on('click', () => {
        // Create a file input element
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.json'; // Accept only JSON files

        fileInput.onchange = async (event) => {
            const file = event.target.files[0];
            if (!file) {
                console.log("No file selected for tour import.");
                return;
            }

            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const tourData = JSON.parse(e.target.result);
                    
                    // Dynamically import modules needed for validation and adding tour
                    const tourPlaybackModule = await import('../../js/tourPlayback.js');
                    const tourModule = await import('../../js/tour.js');

                    if (tourPlaybackModule.validateTourData(tourData)) {
                        // Generate a unique name for the imported tour
                        const importName = `Imported Tour ${tourModule.tourState.availableTours.length + 1} (${file.name.replace('.json', '')})`;
                        
                        // Add to available tours
                        tourModule.tourState.availableTours.push({
                            fileName: file.name, // Store original filename
                            name: tourData.name || importName,
                            created: tourData.created || new Date().toISOString(),
                            pointCount: tourData.points?.length || 0,
                            data: tourData // Store the actual tour data
                        });
                        
                        alert(`Tour "${tourData.name || importName}" imported successfully with ${tourData.points.length} points.`);
                        console.log(`Tour imported: ${tourData.name || importName}`);
                        
                        // Refresh the list of available tour buttons in the UI
                        import('../../js/ui.js').then(uiModule => {
                            if (uiModule.initTourPresetButtons) {
                                uiModule.initTourPresetButtons();
                                console.log("Tour presets UI refreshed after import.");
                            } else {
                                console.warn("initTourPresetButtons function not found in ui.js for UI refresh.");
                            }
                        }).catch(error => {
                            console.error("Failed to load ui.js for refreshing tour presets:", error);
                        });
                        
                    } else {
                        alert("Invalid tour file. Please check the file format and content.");
                        console.error("Import Tour: Validation failed for file:", file.name);
                    }
                } catch (error) {
                    alert(`Error parsing tour file: ${error.message}`);
                    console.error("Error parsing tour file:", error);
                }
            };
            reader.onerror = (error) => {
                alert(`Error reading file: ${error.message}`);
                console.error("Error reading tour file:", error);
            };
            reader.readAsText(file);
        };

        // Trigger the file input click
        fileInput.click();
    });

    // --- Tutorial Separator ---
    folders.presets.addSeparator();

    // Start Introduction Tutorial button
    folders.presets.addButton({
        title: '🎓 Start Introduction Tutorial'
    }).on('click', () => {
        import('../../js/tutorial.js')
            .then(tutorialModule => {
                tutorialModule.startTutorial("introduction");
            })
            .catch(error => {
                console.error("Failed to load or start tutorial:", error);
                alert("Could not start the tutorial. See console for details.");
            });
    });

    // --- Application State Management Separator ---
    folders.presets.addSeparator();

    // Save Full Application State button
    folders.presets.addButton({
        title: '💾 Save Full App State'
    }).on('click', () => {
        import('../../js/appStateManager.js')
            .then(manager => manager.saveAppState())
            .catch(error => {
                console.error("Failed to load App State Manager for saving:", error);
                alert("Could not save application state. See console for details.");
            });
    });

    // Load Full Application State button
    folders.presets.addButton({
        title: '📂 Load Full App State'
    }).on('click', () => {
        import('../../js/appStateManager.js')
            .then(manager => manager.loadAppState())
            .catch(error => {
                console.error("Failed to load App State Manager for loading:", error);
                alert("Could not load application state. See console for details.");
            });
    });

    // --- Screenshot Sharing Separator ---
    folders.presets.addSeparator();

    // Share on X (Twitter) button
    folders.presets.addButton({
        title: '🐦 Share on X (Twitter)'
    }).on('click', () => {
        import('../../js/screenshot.js')
            .then(screenshotModule => {
                // Check if the function exists to be safe
                if (screenshotModule.shareCurrentViewOnX) {
                    screenshotModule.shareCurrentViewOnX();
                } else {
                    console.error("shareCurrentViewOnX function not found in screenshot.js");
                    alert("Share on X function is not available.");
                }
            })
            .catch(error => {
                console.error("Failed to load screenshot.js for sharing:", error);
                alert("Could not initiate sharing. See console for details.");
            });
    });
}

/**
 * Tweakpane UI Audio Settings Module
 * Contains controls for ambient audio system.
 * @module tweakpane-ui/audio-ui
 */

import { pane, folders } from './core.js';
import { getAudioSettings, toggleAudio, setMasterVolume } from '../ambientAudio.js';

export function createAudioControlsFolder() {
    if (!pane) {
        console.warn("Tweakpane not initialized. Skipping Audio UI creation.");
        return;
    }

    folders.audio = pane.addFolder({
        title: 'Audio Settings',
        expanded: true,
    });

    const audioSettings = getAudioSettings();

    // Enable/Disable Audio button
    // Tweakpane's addInput for boolean creates a checkbox.
    // We'll use this and then call toggleAudio which handles the internal state.
    folders.audio.addInput(audioSettings, 'enabled', {
        label: 'Enable Ambient Audio'
    }).on('change', (ev) => {
        // The audioSettings.enabled is already changed by Tweakpane binding.
        // Call toggleAudio to handle the actual start/stop logic based on the new state.
        toggleAudio();
        // We might need to refresh Tweakpane if toggleAudio changes the 'enabled' state back on error.
        // A function like 'refreshAudioUISettings' could be exposed from this module if needed.
        // For now, let's assume direct state modification is fine for the UI checkbox.
    });
    
    // Master Volume slider
    folders.audio.addInput(audioSettings, 'masterVolume', {
        label: 'Master Volume',
        min: 0.0,
        max: 1.0,
        step: 0.01,
    }).on('change', (ev) => {
        setMasterVolume(ev.value);
    });

    // Expose a refresh function for the 'enabled' checkbox if needed
    // This can be called by ambientAudio.js if initialization fails, to uncheck the box.
    window.refreshTweakpaneAudioSettings = () => {
        if (folders.audio) {
            // Tweakpane automatically updates bound values, but if the underlying
            // audioSettings.enabled was changed by logic in ambientAudio.js (e.g. on init failure),
            // we need to tell Tweakpane to re-read it.
            const audioEnabledControl = folders.audio.children.find(c => c.label === 'Enable Ambient Audio');
            if (audioEnabledControl) {
                // audioEnabledControl.binding.read(); // This would be ideal if Tweakpane API allows it directly
                // Or, more simply, just refresh the whole pane or folder if a specific control refresh is not easy.
                pane.refresh();
            }
        }
    };
}

/**
 * Interactive Tutorial System
 * 
 * Manages the definition, state, and display of interactive tutorials.
 * @module tutorial
 */

import { pane } from './tweakpane-ui/core.js'; // For accessing Tweakpane elements if needed

// --- Tutorial State ---
const tutorialState = {
    isActive: false,
    currentTutorial: null,
    currentStepIndex: 0,
    tutorials: {} // Store all defined tutorials here
};

// --- DOM Elements ---
let tutorialContainer = null;
let tutorialTextElement = null;
let tutorialNextButton = null;
let tutorialCloseButton = null;
let highlightedElement = null;

const HIGHLIGHT_CLASS = 'tutorial-highlight';

/**
 * Creates the DOM elements for the tutorial display.
 */
function createTutorialDOM() {
    if (tutorialContainer) return; // Already created

    tutorialContainer = document.createElement('div');
    tutorialContainer.id = 'tutorial-container';
    tutorialContainer.style.display = 'none'; // Hidden by default
    // Basic styling - can be expanded in CSS
    tutorialContainer.style.position = 'fixed';
    tutorialContainer.style.bottom = '20px';
    tutorialContainer.style.left = '20px';
    tutorialContainer.style.backgroundColor = 'rgba(0,0,0,0.8)';
    tutorialContainer.style.color = 'white';
    tutorialContainer.style.padding = '15px';
    tutorialContainer.style.borderRadius = '8px';
    tutorialContainer.style.maxWidth = '300px';
    tutorialContainer.style.zIndex = '10000'; // Ensure it's on top

    tutorialTextElement = document.createElement('p');
    tutorialTextElement.id = 'tutorial-text';

    tutorialNextButton = document.createElement('button');
    tutorialNextButton.id = 'tutorial-next';
    tutorialNextButton.textContent = 'Next';
    tutorialNextButton.style.marginRight = '10px';
    tutorialNextButton.addEventListener('click', nextStep);

    tutorialCloseButton = document.createElement('button');
    tutorialCloseButton.id = 'tutorial-close';
    tutorialCloseButton.textContent = 'Close Tutorial';
    tutorialCloseButton.addEventListener('click', endTutorial);

    tutorialContainer.appendChild(tutorialTextElement);
    tutorialContainer.appendChild(tutorialNextButton);
    tutorialContainer.appendChild(tutorialCloseButton);
    document.body.appendChild(tutorialContainer);

    // Add CSS for highlighting
    const styleSheet = document.createElement("style");
    styleSheet.type = "text/css";
    styleSheet.innerText = `
        .${HIGHLIGHT_CLASS} {
            outline: 2px solid #00ffdd !important;
            box-shadow: 0 0 15px #00ffdd !important;
            transition: outline 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
        }
    `;
    document.head.appendChild(styleSheet);
}

/**
 * Defines a new tutorial.
 * @param {string} name - The unique name/ID of the tutorial.
 * @param {Array<Object>} steps - An array of step objects.
 *                                Each step: { text: string, element?: string (selector), condition?: Function }
 */
export function defineTutorial(name, steps) {
    tutorialState.tutorials[name] = steps;
    console.log(`Tutorial defined: ${name} with ${steps.length} steps.`);
}

/**
 * Starts a tutorial.
 * @param {string} name - The name of the tutorial to start.
 */
export function startTutorial(name) {
    if (!tutorialState.tutorials[name]) {
        console.error(`Tutorial "${name}" not found.`);
        return;
    }
    if (tutorialState.isActive) {
        console.warn("Another tutorial is already active. End it first.");
        return;
    }

    createTutorialDOM(); // Ensure DOM is ready

    tutorialState.isActive = true;
    tutorialState.currentTutorial = tutorialState.tutorials[name];
    tutorialState.currentStepIndex = 0;
    tutorialContainer.style.display = 'block';
    console.log(`Tutorial started: ${name}`);
    displayCurrentStep();
}

/**
 * Ends the current tutorial.
 */
export function endTutorial() {
    if (!tutorialState.isActive) return;

    clearHighlight();
    tutorialState.isActive = false;
    tutorialState.currentTutorial = null;
    tutorialState.currentStepIndex = 0;
    if (tutorialContainer) {
        tutorialContainer.style.display = 'none';
    }
    console.log("Tutorial ended.");
}

/**
 * Displays the current step of the tutorial.
 */
function displayCurrentStep() {
    if (!tutorialState.isActive || !tutorialState.currentTutorial) return;

    const step = tutorialState.currentTutorial[tutorialState.currentStepIndex];
    if (!step) {
        console.log("Tutorial step not found, ending tutorial.");
        endTutorial();
        return;
    }

    tutorialTextElement.innerHTML = step.text; // Use innerHTML to allow basic formatting like <br>
    clearHighlight();

    if (step.elementSelector) {
        try {
            const targetElement = document.querySelector(step.elementSelector);
            if (targetElement) {
                highlightElement(targetElement);
                // Optionally, position tutorial container near the element
                // positionTutorialContainer(targetElement); 
            } else {
                console.warn(`Element to highlight not found: ${step.elementSelector}`);
            }
        } catch (e) {
            console.error(`Invalid selector for highlighting: ${step.elementSelector}`, e);
        }
    } else {
        // Reset position if no element is highlighted or position near center/default
        tutorialContainer.style.left = '20px';
        tutorialContainer.style.right = 'auto';
        tutorialContainer.style.top = 'auto';
        tutorialContainer.style.bottom = '20px';
        tutorialContainer.style.transform = 'none';
    }
    
    // Update button states
    if (tutorialState.currentStepIndex === tutorialState.currentTutorial.length - 1) {
        tutorialNextButton.textContent = 'Finish';
    } else {
        tutorialNextButton.textContent = 'Next';
    }

    // Handle condition for next step (if any)
    if (step.conditionType === 'auto') {
        // Automatically proceed if condition is met (e.g. after an animation)
        // This needs more sophisticated handling, for now, it's manual.
    }
}

/**
 * Positions the tutorial container near a target element.
 * (Basic implementation, can be improved)
 * @param {HTMLElement} targetElement 
 */
function positionTutorialContainer(targetElement) {
    const rect = targetElement.getBoundingClientRect();
    tutorialContainer.style.left = `${rect.left + window.scrollX}px`;
    tutorialContainer.style.top = `${rect.bottom + window.scrollY + 10}px`; // 10px below the element
    tutorialContainer.style.bottom = 'auto'; // Reset fixed positioning
    tutorialContainer.style.right = 'auto';
    tutorialContainer.style.transform = 'none';
}


/**
 * Moves to the next step in the tutorial or finishes it.
 */
function nextStep() {
    if (!tutorialState.isActive) return;

    const currentStep = tutorialState.currentTutorial[tutorialState.currentStepIndex];
    
    // Check custom condition if exists
    if (typeof currentStep.onNext === 'function') {
        if (!currentStep.onNext()) { // If onNext returns false, don't proceed
            return;
        }
    }

    if (tutorialState.currentStepIndex < tutorialState.currentTutorial.length - 1) {
        tutorialState.currentStepIndex++;
        displayCurrentStep();
    } else {
        endTutorial();
    }
}

/**
 * Highlights a given DOM element.
 * @param {HTMLElement} element - The element to highlight.
 */
function highlightElement(element) {
    if (highlightedElement) {
        clearHighlight();
    }
    element.classList.add(HIGHLIGHT_CLASS);
    highlightedElement = element;
    // Scroll element into view if it's not visible
    // element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
}

/**
 * Removes highlighting from the currently highlighted element.
 */
function clearHighlight() {
    if (highlightedElement) {
        highlightedElement.classList.remove(HIGHLIGHT_CLASS);
        highlightedElement = null;
    }
}

/**
 * Gets the current state of the tutorial system.
 * @returns {Object} The tutorial state.
 */
export function getTutorialState() {
    return { ...tutorialState };
}

// --- Initialize ---
// Create DOM elements when the script loads or on first tutorial start.
// document.addEventListener('DOMContentLoaded', createTutorialDOM); // Or call it lazily

// Example Tutorial Definition (can be moved to another file)
// defineTutorial("introduction", [
//     { text: "Welcome to the Fractal Explorer! This tutorial will guide you through the basics." },
//     { text: "This is the Tweakpane UI. You can control various settings here.", elementSelector: ".tp-dfwv" },
//     // ... more steps
// ]);

// --- Tutorial Definitions ---

// Helper to find Tweakpane elements (example)
// Note: These selectors might be fragile and need adjustment based on Tweakpane's version/structure.
// A more robust way might involve custom data attributes or working with Tweakpane's API if available.
function getTweakpaneInputSelector(paneTitle, inputLabel) {
    // This is a placeholder. Finding the exact Tweakpane element programmatically can be complex.
    // We might need to iterate through Tweakpane's internal structure or rely on generated class names.
    // For now, we'll use simpler, potentially less reliable selectors or manually inspect element IDs/classes.
    
    // Example: Find a folder by title, then an input within it.
    // This is highly dependent on Tweakpane's DOM structure.
    // Let's assume for now that the Tweakpane pane has an ID or a known wrapper.
    // const paneWrapper = document.querySelector('.tp-dfwv'); // Default Tweakpane wrapper
    // if (!paneWrapper) return null;

    // This is a very simplified example. Direct targeting of Tweakpane elements by label is not straightforward.
    // It's often better to target the container of the control if possible.
    // For specific inputs, Tweakpane often has a structure like:
    // div (control container)
    //   div (label) -> contains the text label
    //   div (value input area)
    // We'll try to target the main Tweakpane container or specific known folders.
    return `.tp-dfwv`; // Default to the whole pane for now
}


defineTutorial("introduction", [
    {
        text: "Witaj w Eksploratorze Kwaternionowych Fraktali Julii!<br><br>Ten krótki tutorial pokaże Ci podstawy nawigacji i interakcji."
    },
    {
        text: "<b>Poruszanie Kamerą:</b><br>" +
              "- <b>Obracanie:</b> Kliknij i przeciągnij lewym przyciskiem myszy, aby obracać kamerą.<br>" +
              "- <b>Zoom:</b> Użyj kółka myszy, aby przybliżać i oddalać.<br>" +
              "- <b>Przesuwanie (alternatywa dla zoomu):</b> Przytrzymaj kółko myszy i poruszaj myszą góra/dół.<br>" +
              "<i>Spróbuj teraz poruszać kamerą.</i>",
        // No specific element to highlight for general camera movement, but we could highlight the view itself.
        // elementSelector: "canvas" // Or the renderer's DOM element
    },
    {
        text: "<b>Parametry Fraktala:</b><br>" +
              "Panel po prawej stronie ('Fractal Parameters') pozwala zmieniać parametry fraktala 'c'.<br>" +
              "Zmiana tych wartości (x, y, z, w) modyfikuje kształt fraktala.<br>" +
              "<i>Spróbuj zmienić jedną z wartości suwakiem.</i><br><br>" +
              "Możesz też animować 'slice' (przekrój w 4D) klawiszem '0' (zero) lub używając suwaka 'Slice Value'.",
        elementSelector: ".tp-dfwv" // Highlight the whole Tweakpane panel
    },
    {
        text: "<b>Jakość Renderowania:</b><br>" +
              "W panelu 'Rendering Quality' możesz dostosować jakość obrazu.<br>" +
              "- <b>Iterations:</b> Zwiększa szczegółowość (klawisze 1/2).<br>" +
              "- <b>Shadows, AO, etc.:</b> Włączają dodatkowe efekty (klawisze 3, 4, 7).<br>" +
              "<i>Spróbuj włączyć/wyłączyć cienie (Shadows).</i>",
        elementSelector: ".tp-dfwv" // Highlight the whole Tweakpane panel
    },
    {
        text: "<b>Menu Główne i Presety:</b><br>" +
              "- Klawisz '<b>M</b>' przełącza widoczność głównego menu Tweakpane.<br>" +
              "- Klawisz '<b>P</b>' przełącza widoczność menu presetów fraktali (Q01-Q13) i tras.<br>" +
              "<i>Spróbuj teraz ukryć i pokazać menu.</i>"
        // No specific element to highlight, as it's about keyboard shortcuts.
    },
    {
        text: "To już wszystko! Zachęcamy do dalszej eksploracji i odkrywania niesamowitych kształtów.<br><br>" +
              "Pamiętaj, że klawisz '<b>H</b>' wyświetla pomoc z listą wszystkich skrótów klawiszowych."
    }
]);


console.log("Tutorial system initialized.");

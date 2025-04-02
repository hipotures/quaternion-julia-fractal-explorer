/**
 * Central configuration object for the Quaternion Julia Fractals application
 * Contains all constant values grouped thematically, which were previously hardcoded throughout the application.
 */

export const CONFIG = {
    // Camera parameters and movement
    CAMERA: {
        INITIAL_RADIUS: 2.0,           // Initial camera distance from scene center
        MAX_DISTANCE: 2.4,             // Maximum allowed distance from center
        DEFAULT_FOCAL_LENGTH: 1.5,     // Default focal length (affects field of view)
        MOVE_SPEED: 0.005,             // Base speed coefficient (currently unused)
        MAX_VELOCITY: 0.05,            // Maximum allowed forward/backward velocity
        DECELERATION: 0.005,           // Deceleration coefficient (higher = faster stop)
        VELOCITY_SENSITIVITY: 0.000003, // Multiplier for mouse wheel delta to adjust velocity
        TARGET_DURATION: 1.0,          // Duration of smooth transition animation (in seconds)
        PULLBACK_FACTOR: 0.001,        // Camera pull-back coefficient
        MIN_VELOCITY_THRESHOLD: 0.0001 // Minimum velocity threshold to stop movement
    },
    
    // Fractal parameters and rendering
    FRACTAL: {
        DEFAULT_MAX_ITER: 100,         // Default maximum number of raymarching iterations
        ITER_STEP: 20,                 // Iteration count change step (keys 1/2)
        MIN_ITER: 20,                  // Minimum allowed iteration count
        MAX_ITER: 2000,                // Maximum allowed iteration count
        SLICE_ANIM_SPEED: 0.15,        // 4D slice animation speed
        SLICE_AMPLITUDE: 0.5,          // Slice animation amplitude (range from -amplitude to +amplitude)
        CLIP_DISTANCE: 3.5,            // Distance of clipping plane from camera
        CLIP_DISTANCE_STEP: 0.2,       // Clipping distance change step
        MAX_PALETTE_COUNT: 11          // Number of available color palettes (0 = off, 1-10 = palettes)
    },
    
    // Raymarching algorithm parameters
    RAYMARCHING: {
        SIMPLE_DISTANCE_MAX_ITER: 20,  // Iteration count for simplified distance estimator
        ESCAPE_RADIUS: 4.0,            // Escape radius for DE (Distance Estimator) function
        DEFAULT_STEP_SIZE: 0.02,       // Default step size for close distances
        STEP_MULTIPLIER: 0.8,          // Safety step multiplier (0.8 = 80% of DE)
        STEP_COUNT: 32,                // Number of raycasting steps for mouse click
        HIT_THRESHOLD: 0.01,           // Hit threshold for raycasting
        MAX_DISTANCE: 20.0,            // Maximum raycasting distance
        MIN_STEP_SIZE: 1e-6,           // Minimum step size in DE
        SHADOW_FACTOR: 0.5,            // Shadow factor in rendering
        SHADOW_POWER: 32.0,            // Power exponent for shadow calculations
        AO_STRENGTH: 0.5,              // Ambient Occlusion strength
        MAX_MARCH_STEPS: 256,          // Maximum number of raymarching steps in shader
        MAX_MARCH_DISTANCE: 150.0      // Maximum raymarching distance in shader
    },
    
    // Recording parameters
    RECORDER: {
        FPS: 60,                       // Frames per second for recording
        TIMESLICE_MS: 1000,            // Time (ms) between recording fragments (creates more frequent keyframes)
        FORCE_STATS_UPDATE_DURATION: 5, // Time (s) to force stats updates after recording
        BITRATES: {
            NORMAL: 5000000,           // 5 Mbps - normal quality
            HIGH: 10000000,            // 10 Mbps - high quality 
            ULTRA: 16000000            // 16 Mbps - ultra quality
        },
        UI_TEXT: {
            RECORDING_INDICATOR: 'REC ⚫' // Recording indicator text
        }
    },
    
    // Tour parameters
    TOURS: {
        DEFAULT_TRANSITION_DURATION: 5.0, // Default transition time between points (seconds)
        DEFAULT_STAY_DURATION: 3.0,     // Default time to stay at each point (seconds)
        TOUR_ENDING_DURATION: 3.0,      // Duration to display tour completion message
        PATH: 'tours/',                 // Path to tour files
        FILE_PATTERN: 'tour{NUM}.json', // Tour filename pattern
        MENU_HIDE_DELAY: 100,           // Delay in ms for hiding menu elements
        SAFE_STEP: 0.002,               // Safe step size when continuing after a hit
        CROSS_SECTION_THRESHOLD: 0.01   // Threshold for cross-section rendering
    },
    
    // UI selectors and texts
    UI: {
        SELECTORS: {
            STATS_PANEL: 'stats',
            MENU_PANEL: 'menu',
            PRESET_MENU: 'preset-menu',
            TOUR_MENU: 'tour-menu',
            TOUR_POINT_COUNT: 'tour-point-count',
            REGISTER_POINT: 'register-point',
            FINISH_TOUR: 'finish-tour',
            CANCEL_TOUR: 'cancel-tour',
            TOUR_PRESETS: 'tour-presets',
            TOUR_STATUS: 'tour-status',
            RECORDING_INDICATOR: 'recording-indicator'
        },
        TEXT: {
            RECORDING_INDICATOR: 'REC ⚫',
            TOUR_POINT_STATUS: 'Tour - Point {NUM}',
            TOUR_COMPLETED: 'Tour Completed',
            TOUR_CANCEL_CONFIRM: 'Are you sure you want to cancel tour recording? All recorded points will be lost.'
        },
        PRESET_BUTTONS: {
            Q01: 'q01',
            Q02: 'q02', 
            Q03: 'q03',
            Q04: 'q04',
            Q05: 'q05',
            Q06: 'q06',
            Q07: 'q07',
            Q08: 'q08',
            Q09: 'q09',
            Q10: 'q10'
        }
    },
    
    // Control keys
    KEYS: {
        CONTROL: 'Control',
        ARROW_LEFT: 'arrowleft',
        ARROW_RIGHT: 'arrowright',
        ARROW_UP: 'arrowup',
        ARROW_DOWN: 'arrowdown',
        SPACE: ' ',
        PLUS: '+',
        MINUS: '-',
        EQUALS: '=',
        ESCAPE: 'Escape',
        // Functional
        TOGGLE_STATS: 'p',
        TOGGLE_MENU: 'm',
        TOGGLE_TOUR: 't',
        TOGGLE_RECORDING: 'v',
        CYCLE_QUALITY: 'q',
        RESET: 'r',
        TOGGLE_ANIMATION: 'a',
        TOGGLE_SLICE_ANIMATION: '0',
        TOGGLE_DECELERATION: 'd',
        // Rendering quality
        INCREASE_ITERATIONS: '1',
        DECREASE_ITERATIONS: '2',
        TOGGLE_SHADOWS: '3',
        TOGGLE_AO: '4',
        TOGGLE_SMOOTH_COLOR: '5',
        CHANGE_PALETTE: '6',
        TOGGLE_SPECULAR: '7',
        TOGGLE_ADAPTIVE_STEPS: '8',
        CYCLE_CLIP_MODE: '9',
        DECREASE_CLIP_DISTANCE: '[',
        INCREASE_CLIP_DISTANCE: ']',
        DECREASE_SLICE_AMPLITUDE: ',',
        INCREASE_SLICE_AMPLITUDE: '.'
    },
    
    // Rendering and shader parameters
    SHADER: {
        LIGHT_POSITION: {
            X: 10.0,
            Y: 10.0,
            Z: 10.0
        },
        AMBIENT_FACTOR: 0.2,           // Ambient light coefficient
        DIFFUSE_FACTOR: 0.8,           // Diffuse light coefficient
        SPECULAR_FACTOR: 0.5,           // Specular reflection coefficient
        MAX_AO_ITERATIONS: 5,          // Number of ambient occlusion iterations
        AO_STEP_DISTANCE: 0.02,        // Ambient occlusion step distance
        AO_FACTOR: 0.2,                // Ambient occlusion strength factor
        EPSILON: 0.001,                // Epsilon value for normal calculations and others
        HIT_THRESHOLD: 0.0001          // Distance threshold for surface hit detection
    },
    
    // Screenshot parameters
    SCREENSHOT: {
        FORMATS: [
            { id: 'png', extension: 'png', mime: 'image/png' },
            { id: 'jpg', extension: 'jpg', mime: 'image/jpeg', quality: 0.9 },
            { id: 'webp', extension: 'webp', mime: 'image/webp', quality: 0.9 },
            { id: 'bmp', extension: 'bmp', mime: 'image/bmp' },
            { id: 'avif', extension: 'avif', mime: 'image/avif', quality: 0.8 },
            { id: 'tiff', extension: 'tiff', mime: 'image/tiff' }
        ],
        DEFAULT_FORMAT: 'png',
        RESCALING: {
            ENABLED: false,
            MAX_WIDTH: null,
            MAX_HEIGHT: null
        },
        SAVE_STATE: true,              // Whether to save fractal state as a JSON file
        KEYS: {
            TAKE_SCREENSHOT: 's',
            TAKE_SCREENSHOT_WITH_UI: 'S'
        }
    }
};

// Default export for convenience
export default CONFIG;

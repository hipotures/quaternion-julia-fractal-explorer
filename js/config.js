/**
 * Centralny obiekt konfiguracyjny dla aplikacji Quaternion Julia Fractals
 * Zawiera wszystkie stałe wartości pogrupowane tematycznie, które wcześniej były wpisane na stałe w kodzie.
 */

export const CONFIG = {
    // Parametry kamery i jej ruchu
    CAMERA: {
        INITIAL_RADIUS: 2.0,           // Początkowa odległość kamery od środka sceny
        MAX_DISTANCE: 2.4,             // Maksymalna dozwolona odległość od centrum
        DEFAULT_FOCAL_LENGTH: 1.5,     // Domyślna długość ogniskowa (wpływa na pole widzenia)
        MOVE_SPEED: 0.005,             // Bazowy współczynnik prędkości (obecnie nieużywany)
        MAX_VELOCITY: 0.05,            // Maksymalna dozwolona prędkość przód/tył
        DECELERATION: 0.005,           // Współczynnik hamowania (wyższy = szybsze zatrzymanie)
        VELOCITY_SENSITIVITY: 0.000003, // Mnożnik dla delta kółka myszy do dostosowania prędkości
        TARGET_DURATION: 1.0,          // Czas trwania animacji płynnego przejścia (w sekundach)
        PULLBACK_FACTOR: 0.001,        // Współczynnik przyciągania z powrotem kamery
        MIN_VELOCITY_THRESHOLD: 0.0001 // Próg prędkości minimalnej do zatrzymania ruchu
    },
    
    // Parametry fraktali i ich renderowania
    FRACTAL: {
        DEFAULT_MAX_ITER: 100,         // Domyślna maksymalna liczba iteracji raymarching
        ITER_STEP: 20,                 // Krok zmiany liczby iteracji (klawisze 1/2)
        MIN_ITER: 20,                  // Minimalna dozwolona liczba iteracji
        MAX_ITER: 2000,                // Maksymalna dozwolona liczba iteracji
        SLICE_ANIM_SPEED: 0.15,        // Szybkość animacji przekroju 4D
        SLICE_AMPLITUDE: 0.5,          // Amplituda animacji przekroju (zakres od -amplitude do +amplitude)
        CLIP_DISTANCE: 3.5,            // Odległość płaszczyzny tnącej od kamery
        CLIP_DISTANCE_STEP: 0.2,       // Krok zmiany odległości tnącej
        MAX_PALETTE_COUNT: 11          // Liczba dostępnych palet kolorów (0 = wyłączone, 1-10 = palety)
    },
    
    // Parametry algorytmu raymarching
    RAYMARCHING: {
        SIMPLE_DISTANCE_MAX_ITER: 20,  // Liczba iteracji dla uproszczonego estimatora odległości
        ESCAPE_RADIUS: 4.0,            // Promień ucieczki dla funkcji DE (Distance Estimator)
        DEFAULT_STEP_SIZE: 0.02,       // Domyślny rozmiar kroku przy bliskich odległościach
        STEP_MULTIPLIER: 0.8,          // Mnożnik dla kroku bezpieczeństwa (0.8 = 80% DE)
        STEP_COUNT: 32,                // Liczba kroków raycasting dla kliknięcia myszy
        HIT_THRESHOLD: 0.01,           // Próg trafienia dla raycasting
        MAX_DISTANCE: 20.0,            // Maksymalna odległość raycasting
        MIN_STEP_SIZE: 1e-6,           // Minimalny rozmiar kroku w DE
        SHADOW_FACTOR: 0.5,            // Współczynnik cienia w renderingu
        SHADOW_POWER: 32.0,            // Wykładnik potęgowy dla obliczania cieni
        AO_STRENGTH: 0.5,              // Siła okluzji otoczenia (Ambient Occlusion)
        MAX_MARCH_STEPS: 256,          // Maksymalna liczba kroków raymarching w shaderze
        MAX_MARCH_DISTANCE: 150.0      // Maksymalna odległość raymarching w shaderze
    },
    
    // Parametry nagrywania
    RECORDER: {
        FPS: 60,                       // Liczba klatek na sekundę dla nagrywania
        TIMESLICE_MS: 1000,            // Czas (ms) między fragmentami nagrania (tworzy częstsze keyframes)
        FORCE_STATS_UPDATE_DURATION: 5, // Czas (s) wymuszania aktualizacji statystyk po nagrywaniu
        BITRATES: {
            NORMAL: 5000000,           // 5 Mbps - normalna jakość
            HIGH: 10000000,            // 10 Mbps - wysoka jakość
            ULTRA: 16000000            // 16 Mbps - ultra jakość
        },
        UI_TEXT: {
            RECORDING_INDICATOR: 'REC ⚫' // Tekst wskaźnika nagrywania
        }
    },
    
    // Parametry tour (wycieczek)
    TOURS: {
        DEFAULT_TRANSITION_DURATION: 5.0, // Domyślny czas przejścia między punktami (sekundy)
        DEFAULT_STAY_DURATION: 3.0,     // Domyślny czas pozostania w punkcie (sekundy)
        TOUR_ENDING_DURATION: 3.0,      // Czas wyświetlania komunikatu o zakończeniu wycieczki
        PATH: 'tours/',                 // Ścieżka do plików wycieczek
        FILE_PATTERN: 'tour{NUM}.json'  // Format nazwy pliku wycieczki
    },
    
    // Selektory i teksty UI
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
    
    // Klawisze sterujące
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
        // Funkcjonalne
        TOGGLE_STATS: 'p',
        TOGGLE_MENU: 'm',
        TOGGLE_TOUR: 't',
        TOGGLE_RECORDING: 'v',
        CYCLE_QUALITY: 'q',
        RESET: 'r',
        TOGGLE_ANIMATION: 'a',
        TOGGLE_SLICE_ANIMATION: '0',
        TOGGLE_DECELERATION: 'd',
        // Jakość renderowania
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
    
    // Parametry renderu i shadera
    SHADER: {
        LIGHT_POSITION: {
            X: 10.0,
            Y: 10.0,
            Z: 10.0
        },
        AMBIENT_FACTOR: 0.2,           // Współczynnik światła otoczenia (ambient)
        DIFFUSE_FACTOR: 0.8,           // Współczynnik światła rozproszonego (diffuse)
        SPECULAR_FACTOR: 0.5,          // Współczynnik odbicia (specular)
        MAX_AO_ITERATIONS: 5,          // Liczba iteracji dla ambient occlusion
        AO_STEP_DISTANCE: 0.02,        // Odległość kroku dla ambient occlusion
        AO_FACTOR: 0.2,                // Współczynnik mocy ambient occlusion
        EPSILON: 0.001                 // Wartość epsilon dla obliczeń normalnych i innych
    }
};

// Eksport domyślny dla wygody
export default CONFIG;

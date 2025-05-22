import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';
import { uniforms, vertexShader, fragmentShader, updateResolutionUniform } from './shaders.js';
import { camera, cameraState } from './camera.js'; // Import cameraState for MVP matrix

// --- Scene Setup ---
export const scene = new THREE.Scene();
export const taaScene = new THREE.Scene(); // Scene for TAA resolve pass

// --- Renderer Setup ---
export const renderer = new THREE.WebGLRenderer({ antialias: false }); // antialias: false for TAA
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// --- Render Targets for TAA ---
const bufferOptions = {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    format: THREE.RGBAFormat,
    type: THREE.FloatType, // Use FloatType for precision with history and velocity
    stencilBuffer: false,
    depthBuffer: true // Needed for depth texture
};

export let mainRenderTarget = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight, bufferOptions);
// Ensure mainRenderTarget has a depth texture
mainRenderTarget.depthTexture = new THREE.DepthTexture(window.innerWidth, window.innerHeight);
mainRenderTarget.depthTexture.format = THREE.DepthFormat;
mainRenderTarget.depthTexture.type = THREE.UnsignedShortType;


export let historyRenderTarget = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight, bufferOptions);
// Velocity buffer might not be explicitly needed if calculated and used in one pass,
// but let's define it for now for clarity or future separate velocity pass.
// For now, velocity will be calculated in the TAA resolve shader using depth.
// export let velocityRenderTarget = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight, bufferOptions);


// --- Fullscreen Quad for Fractal Rendering ---
const fractalGeometry = new THREE.PlaneBufferGeometry(2, 2);
// Main fractal material will be updated with TAA uniforms later in shaders.js
export const fractalMaterial = new THREE.ShaderMaterial({
    uniforms: uniforms,
    vertexShader,
    fragmentShader
});
const fractalQuad = new THREE.Mesh(fractalGeometry, fractalMaterial);
scene.add(fractalQuad);

// --- Fullscreen Quad for TAA Resolve Pass ---
// This shader will take the current frame and history frame, then apply TAA
const taaResolveMaterial = new THREE.ShaderMaterial({
    uniforms: {
        u_currentFrameTexture: { value: mainRenderTarget.texture },
        u_historyTexture: { value: historyRenderTarget.texture },
        u_depthTexture: { value: mainRenderTarget.depthTexture }, // Current frame's depth
        u_resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
        u_cameraProjectionMatrixInverse: { value: new THREE.Matrix4() }, // Current projection inverse
        u_cameraViewMatrixInverse: { value: new THREE.Matrix4() },       // Current view inverse
        u_prevViewProjectionMatrix: { value: new THREE.Matrix4() },      // Previous combined view-projection
        u_taaBlendFactor: { value: 0.9 }, // How much of history to blend
        u_enableTAA: { value: false } // Toggle for TAA
    },
    vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform sampler2D u_currentFrameTexture;
        uniform sampler2D u_historyTexture;
        uniform sampler2D u_depthTexture;
        uniform vec2 u_resolution;
        uniform mat4 u_cameraProjectionMatrixInverse;
        uniform mat4 u_cameraViewMatrixInverse; // Not needed if depth is view depth
        uniform mat4 u_prevViewProjectionMatrix;
        uniform float u_taaBlendFactor;
        uniform bool u_enableTAA;

        varying vec2 vUv;

        // Function to reconstruct view-space position from depth
        vec3 getViewPosition(vec2 screenUV, float depth) {
            // Transform UV to Normalized Device Coordinates (NDC)
            vec2 ndc = screenUV * 2.0 - 1.0;
            // Create a 4D vector with depth in NDC space (depth is usually 0-1, map to -1 to 1 if needed by proj matrix)
            // WebGL depth is 0 to 1. Projection matrix expects -1 to 1 for Z.
            // So, transform depth: ndc.z = depth * 2.0 - 1.0;
            vec4 clipSpacePos = vec4(ndc.x, ndc.y, depth * 2.0 - 1.0, 1.0);
            // Transform to view space
            vec4 viewSpacePos = u_cameraProjectionMatrixInverse * clipSpacePos;
            // Perspective divide
            return viewSpacePos.xyz / viewSpacePos.w;
        }
        
        // Function to reconstruct world-space position from depth
        vec3 getWorldPosition(vec2 screenUV, float depth) {
            vec3 viewPos = getViewPosition(screenUV, depth);
            vec4 worldPos = u_cameraViewMatrixInverse * vec4(viewPos, 1.0);
            return worldPos.xyz;
        }


        void main() {
            vec3 currentFrameColor = texture2D(u_currentFrameTexture, vUv).rgb;

            if (!u_enableTAA) {
                gl_FragColor = vec4(currentFrameColor, 1.0);
                return;
            }

            float depth = texture2D(u_depthTexture, vUv).r;

            if (depth >= 1.0) { // Sky or far plane, no reprojection
                gl_FragColor = vec4(currentFrameColor, 1.0);
                return;
            }

            // Reconstruct current world position
            // vec3 worldPos = getViewPosition(vUv, depth); // If u_prevViewProjectionMatrix takes viewPos
            // For consistency, let's use world positions
            vec3 worldPos = getWorldPosition(vUv, depth);

            // Project current world position to previous frame's clip space
            vec4 prevClipPos = u_prevViewProjectionMatrix * vec4(worldPos, 1.0);

            // Perspective divide and transform to UV space
            vec2 prevScreenUv = (prevClipPos.xy / prevClipPos.w) * 0.5 + 0.5;

            // Sample history texture
            vec3 historyColor = texture2D(u_historyTexture, prevScreenUv).rgb;
            
            // Clamp UVs to avoid sampling outside history texture (basic clamping)
            if (prevScreenUv.x < 0.0 || prevScreenUv.x > 1.0 || prevScreenUv.y < 0.0 || prevScreenUv.y > 1.0) {
                 historyColor = currentFrameColor; // Or some other strategy
            }

            // Neighborhood clamping (simplified version)
            // Calculate AABB (Axis-Aligned Bounding Box) of colors in a 3x3 neighborhood of currentFrameColor
            vec3 minColor = currentFrameColor;
            vec3 maxColor = currentFrameColor;
            float texelSizeX = 1.0 / u_resolution.x;
            float texelSizeY = 1.0 / u_resolution.y;

            for (int x = -1; x <= 1; x++) {
                for (int y = -1; y <= 1; y++) {
                    if (x == 0 && y == 0) continue;
                    vec3 neighborColor = texture2D(u_currentFrameTexture, vUv + vec2(float(x) * texelSizeX, float(y) * texelSizeY)).rgb;
                    minColor = min(minColor, neighborColor);
                    maxColor = max(maxColor, neighborColor);
                }
            }

            // Clamp history color to the AABB
            historyColor = clamp(historyColor, minColor, maxColor);
            
            // Blend current frame with (potentially clamped) history
            vec3 finalColor = mix(currentFrameColor, historyColor, u_taaBlendFactor);
            
            gl_FragColor = vec4(finalColor, 1.0);
        }
    `
});
const taaQuad = new THREE.Mesh(new THREE.PlaneBufferGeometry(2, 2), taaResolveMaterial);
taaScene.add(taaQuad);

// Uniforms for TAA that need to be updated from JS
export const taaUniforms = taaResolveMaterial.uniforms;

// Previous view-projection matrix for TAA
export let prevViewProjectionMatrix = new THREE.Matrix4();

// --- Utility for copying render target ---
export const copyScene = new THREE.Scene();
export const copyMaterial = new THREE.ShaderMaterial({
    uniforms: { u_sourceTexture: { value: null } },
    vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform sampler2D u_sourceTexture;
        varying vec2 vUv;
        void main() {
            gl_FragColor = texture2D(u_sourceTexture, vUv);
        }
    `,
    depthTest: false,
    depthWrite: false
});
const copyQuadMesh = new THREE.Mesh(new THREE.PlaneBufferGeometry(2, 2), copyMaterial);
copyScene.add(copyQuadMesh);


// --- Resize Handling ---
export function handleResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    renderer.setSize(width, height);
    mainRenderTarget.setSize(width, height);
    historyRenderTarget.setSize(width, height);
    // if (velocityRenderTarget) velocityRenderTarget.setSize(width, height);

    // Update resolution uniforms for both fractal and TAA shaders
    uniforms.u_resolution.value.set(width, height);
    taaUniforms.u_resolution.value.set(width, height);
    
    // Camera aspect ratio update is handled by camera.js or main loop
    // camera.aspect = width / height;
    // camera.updateProjectionMatrix();
}

// Initial setup for resolution uniform (already in shaders.js, but TAA needs it too)
taaUniforms.u_resolution.value.set(window.innerWidth, window.innerHeight);
// updateResolutionUniform(window.innerWidth, window.innerHeight); // This updates fractalMaterial's uniform

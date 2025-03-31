import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';
import { uniforms, vertexShader, fragmentShader, updateResolutionUniform } from './shaders.js';
import { camera } from './camera.js'; // Only need the camera object for the renderer

// --- Scene Setup ---
export const scene = new THREE.Scene();

// --- Renderer Setup ---
export const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// --- Fullscreen Quad ---
const geometry = new THREE.PlaneBufferGeometry(2, 2);
const material = new THREE.ShaderMaterial({
    uniforms: uniforms, // Use centrally managed uniforms
    vertexShader,
    fragmentShader
});
const quad = new THREE.Mesh(geometry, material);
scene.add(quad);

// --- Resize Handling ---
export function handleResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    renderer.setSize(width, height);
    // Camera aspect ratio update is handled implicitly by the shader's use of u_resolution
    // No need to update camera.aspect or camera.updateProjectionMatrix() for a shader-based fullscreen quad.
    updateResolutionUniform(width, height); // Update the shader uniform directly
}

// Initial setup for resolution uniform
updateResolutionUniform(window.innerWidth, window.innerHeight);

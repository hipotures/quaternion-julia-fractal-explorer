import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';

// Helper function to get rotation matrix (used in uniforms)
export function getRotationMatrix(euler) {
  const m = new THREE.Matrix4();
  m.makeRotationFromEuler(euler);
  const m3 = new THREE.Matrix3();
  m3.setFromMatrix4(m);
  return m3;
}

// Uniforms - Central management
export const uniforms = {
  u_time:             { value: 0.0 },
  u_resolution:       { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
  u_c:                { value: new THREE.Vector4(-0.2, 0.6, 0.2, 0.2) }, // Initial fractal params
  u_slice:            { value: 0.0 },
  u_camPos:           { value: new THREE.Vector3() }, // Will be updated by camera.js
  u_camRot:           { value: new THREE.Matrix3() }, // Will be updated by camera.js
  u_colorEnabled:     { value: false }, // Initial value
  u_focalLength:      { value: 1.5 },   // Initial value

  u_maxIter:          { value: 100 },     // Initial value
  u_enableShadows:    { value: false },   // Initial value
  u_enableAO:         { value: false },   // Initial value
  u_enableSmoothColor:{ value: false },   // Initial value
  u_enableSpecular:   { value: false },   // Initial value
  u_paletteIndex:     { value: 0 },       // Initial value
  u_adaptiveSteps:    { value: false },   // Initial value for adaptive ray marching
  u_clipMode:         { value: 0 },       // Cross section mode (0: off, 1: method 1, 2: method 2)
  u_clipDistance:     { value: 3.5 },     // Distance of clipping plane from camera
  
  // Dynamic color effects
  u_colorSaturation:  { value: 1.0 },     // Color saturation adjustment (0.0-2.0)
  u_colorBrightness:  { value: 1.0 },     // Brightness adjustment (0.0-2.0)
  u_colorContrast:    { value: 1.0 },     // Contrast adjustment (0.0-2.0)
  u_colorPhaseShift:  { value: 0.0 },     // Color phase shift (0.0-6.28)
  u_colorAnimEnabled: { value: false },   // Enable automatic color animation
  u_colorAnimSpeed:   { value: 0.5 },     // Color animation speed
  
  // Orbit trap settings
  u_orbitTrapEnabled: { value: false },   // Enable orbit trap coloring
  u_orbitTrapType:    { value: 0 },       // Trap type (0: circle, 1: line, 2: point, 3: cross)
  u_orbitTrapParams:  { value: new THREE.Vector4(1.0, 0.0, 0.0, 1.0) }, // Trap parameters
  
  // Physics-based coloring
  u_physicsBasedColor:{ value: false },   // Enable physics-based coloring
  u_physicsColorType: { value: 0 },       // Type (0: diffraction, 1: interference, 2: spectrum)
  u_physicsParams:    { value: new THREE.Vector4(1.0, 5.0, 1.0, 0.5) } // Physics parameters
};

// Expose uniforms globally for potential debugging or compatibility needs
window.uniforms = uniforms;

// Functions to update specific uniform groups
export function updateCameraUniforms(camPos, camRotMatrix) {
  uniforms.u_camPos.value.copy(camPos);
  uniforms.u_camRot.value.copy(camRotMatrix); // Expecting Matrix3
}

export function updateFractalParamsUniform(paramsVec4) {
  uniforms.u_c.value.copy(paramsVec4);
}

export function updateResolutionUniform(width, height) {
  uniforms.u_resolution.value.set(width, height);
}

export function updateTimeUniform(time) {
    uniforms.u_time.value = time;
}

export function updateSliceUniform(sliceValue) {
    uniforms.u_slice.value = sliceValue;
}

export function updateFocalLengthUniform(focalLength) {
    uniforms.u_focalLength.value = focalLength;
}

export function updateQualityUniforms(qualitySettings) {
    uniforms.u_maxIter.value = qualitySettings.maxIter;
    uniforms.u_enableShadows.value = qualitySettings.enableShadows;
    uniforms.u_enableAO.value = qualitySettings.enableAO;
    uniforms.u_enableSmoothColor.value = qualitySettings.enableSmoothColor;
    uniforms.u_enableSpecular.value = qualitySettings.enableSpecular;
    uniforms.u_adaptiveSteps.value = qualitySettings.enableAdaptiveSteps;
}

export function updateColorUniforms(colorSettings) {
    uniforms.u_colorEnabled.value = colorSettings.colorEnabled;
    uniforms.u_paletteIndex.value = colorSettings.paletteIndex;
}

/**
 * Updates the dynamic color parameters uniforms
 * @param {Object} dynamicsSettings - Object containing dynamic color parameters
 */
export function updateColorDynamicsUniforms(dynamicsSettings) {
    uniforms.u_colorSaturation.value = dynamicsSettings.saturation;
    uniforms.u_colorBrightness.value = dynamicsSettings.brightness;
    uniforms.u_colorContrast.value = dynamicsSettings.contrast;
    uniforms.u_colorPhaseShift.value = dynamicsSettings.phaseShift;
    uniforms.u_colorAnimEnabled.value = dynamicsSettings.animationEnabled;
    uniforms.u_colorAnimSpeed.value = dynamicsSettings.animationSpeed;
}

/**
 * Updates the orbit trap parameters uniforms
 * @param {Object} trapSettings - Object containing orbit trap parameters
 */
export function updateOrbitTrapUniforms(trapSettings) {
    uniforms.u_orbitTrapEnabled.value = trapSettings.enabled;
    uniforms.u_orbitTrapType.value = trapSettings.type;
    
    const params = new THREE.Vector4(
        trapSettings.radius,
        trapSettings.x,
        trapSettings.y,
        trapSettings.intensity
    );
    uniforms.u_orbitTrapParams.value.copy(params);
}

/**
 * Updates the physics-based coloring parameters uniforms
 * @param {Object} physicsSettings - Object containing physics-based coloring parameters
 */
export function updatePhysicsColorUniforms(physicsSettings) {
    uniforms.u_physicsBasedColor.value = physicsSettings.enabled;
    uniforms.u_physicsColorType.value = physicsSettings.type;
    
    const params = new THREE.Vector4(
        physicsSettings.frequency,
        physicsSettings.waves,
        physicsSettings.intensity,
        physicsSettings.balance
    );
    uniforms.u_physicsParams.value.copy(params);
}

export function updateAdaptiveStepsUniform(enabled) {
    uniforms.u_adaptiveSteps.value = enabled;
}

export function updateClipModeUniform(mode) {
    uniforms.u_clipMode.value = mode;
}

export function updateClipDistanceUniform(distance) {
    uniforms.u_clipDistance.value = distance;
}


// Shader Code
export const vertexShader = `
  varying vec2 vUv;
  void main(){
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

export const fragmentShader = `
  #define MAX_MARCH 256
  #define MAX_DIST  150.0
  #define HIT_THRESHOLD 0.0001
  #define SAFE_STEP 0.002
  #define CROSS_SECTION_THRESHOLD 0.01

  uniform vec2  u_resolution;
  uniform float u_time;
  uniform vec4  u_c;
  uniform float u_slice;
  uniform vec3  u_camPos;
  uniform mat3  u_camRot;
  uniform bool  u_colorEnabled;
  uniform float u_focalLength;

  uniform float u_maxIter;
  uniform bool  u_enableShadows;
  uniform bool  u_enableAO;
  uniform bool  u_enableSmoothColor;
  uniform bool  u_enableSpecular;
  uniform int   u_paletteIndex;
  uniform bool  u_adaptiveSteps;
  uniform int   u_clipMode;      // Cross section mode (0: off, 1: method 1, 2: method 2)
  uniform float u_clipDistance;  // Distance of clipping plane from camera
  
  // Dynamic color uniforms
  uniform float u_colorSaturation;
  uniform float u_colorBrightness;
  uniform float u_colorContrast;
  uniform float u_colorPhaseShift;
  uniform bool  u_colorAnimEnabled;
  uniform float u_colorAnimSpeed;
  
  // Orbit trap uniforms
  uniform bool  u_orbitTrapEnabled;
  uniform int   u_orbitTrapType;
  uniform vec4  u_orbitTrapParams;
  
  // Physics-based coloring uniforms
  uniform bool  u_physicsBasedColor;
  uniform int   u_physicsColorType;
  uniform vec4  u_physicsParams;

  varying vec2 vUv;

  // Quaternion multiplication
  vec4 qmul(vec4 a, vec4 b) {
    return vec4(
      a.x*b.x - a.y*b.y - a.z*b.z - a.w*b.w,
      a.x*b.y + a.y*b.x + a.z*b.w - a.w*b.z,
      a.x*b.z + a.z*b.x + a.w*b.y - a.y*b.w,
      a.x*b.w + a.w*b.x + a.y*b.z - a.z*b.y
    );
  }

  // Distance Estimator
  float quaternionJuliaDE(vec3 pos) {
      vec4 z = vec4(pos, u_slice);
      vec4 c = u_c;
      float dr = 1.0;
      float r = 0.0;
      for (int i = 0; i < 512; i++){
          if(float(i) >= u_maxIter) break;
          r = length(z);
          if (r > 4.0) break;
          dr = 2.0 * r * dr;
          z = qmul(z, z) + c;
      }
      return abs(0.5 * log(max(r, 1e-6)) * r / dr);
  }

  // Iteration count
  float getIterationCount(vec3 pos) {
      vec4 z = vec4(pos, u_slice);
      vec4 c = u_c;
      for (int i = 0; i < 512; i++){
          if(float(i) >= u_maxIter) break;
          float r = length(z);
          if(r > 4.0){
              return float(i);
          }
          z = qmul(z, z) + c;
      }
      return u_maxIter;
  }

  // Smooth iteration
  float getIterationSmooth(vec3 pos) {
      vec4 z = vec4(pos, u_slice);
      vec4 c = u_c;
      for (int i=0; i<512; i++){
          if(float(i) >= u_maxIter) break;
          float r = length(z);
          if(r>4.0){
              float f = float(i) - log2(log2(r)) + 4.0;
              return f;
          }
          z = qmul(z,z) + c;
      }
      return u_maxIter;
  }

  // Helper function to calculate step size based on distance and adaptivity settings
  float calculateStepSize(float distance) {
      if (!u_adaptiveSteps)
          return distance; // Standard step without adaptivity
          
      // Adaptive step size calculation
      float stepFactor;
      if (distance < 0.01) {
          // Very close to surface - use small step for precision
          stepFactor = 0.5;
      } else if (distance > 0.5) {
          // Far from surface - use much larger step for performance
          stepFactor = 2.0;
      } else {
          // Mid-range - more aggressive transition
          stepFactor = 1.0 + (distance - 0.01) * 1.8; // Linear from 1.0 to ~2.0
      }
      
      return distance * stepFactor;
  }

  // Standard ray marching mode (no clipping)
  float rayMarchStandard(vec3 ro, vec3 rd) {
      float t = 0.0;
      
      for (int i = 0; i < MAX_MARCH; i++) {
          vec3 pos = ro + rd * t;
          float d = quaternionJuliaDE(pos);
          
          // Simple hit condition
          if (d < HIT_THRESHOLD)
              return t;
          
          // Calculate and apply step
          t += calculateStepSize(d);
          
          if (t > MAX_DIST)
              break;
      }
      
      return t;
  }
  
  // Cross-section mode 1: Ignore first hit
  float rayMarchClipMode1(vec3 ro, vec3 rd) {
      float t = 0.0;
      
      for (int i = 0; i < MAX_MARCH; i++) {
          vec3 pos = ro + rd * t;
          float d = quaternionJuliaDE(pos);
          
          // Hit condition with special handling
          if (d < HIT_THRESHOLD) {
              // Mode 1 ignores the first hit and continues
              t += SAFE_STEP;
              continue;
          }
          
          // Calculate and apply step
          t += calculateStepSize(d);
          
          if (t > MAX_DIST)
              break;
      }
      
      return t;
  }
  
  // Cross-section mode 2: Only render at specific distance
  float rayMarchClipMode2(vec3 ro, vec3 rd) {
      float t = 0.0;
      
      for (int i = 0; i < MAX_MARCH; i++) {
          vec3 pos = ro + rd * t;
          float d = quaternionJuliaDE(pos);
          
          // Hit condition with special handling
          if (d < HIT_THRESHOLD) {
              // Mode 2 only renders points close to the cross-section distance
              float distToPlane = abs(t - u_clipDistance);
              if (distToPlane < CROSS_SECTION_THRESHOLD) {
                  return t; // Only render points in cross-section
              } else {
                  t += SAFE_STEP;
                  continue;
              }
          }
          
          // Calculate and apply step
          t += calculateStepSize(d);
          
          if (t > MAX_DIST)
              break;
      }
      
      return t;
  }
  
  // Cross-section mode 3: Ignore hits beyond cross-section plane
  float rayMarchClipMode3(vec3 ro, vec3 rd) {
      float t = 0.0;
      
      for (int i = 0; i < MAX_MARCH; i++) {
          vec3 pos = ro + rd * t;
          float d = quaternionJuliaDE(pos);
          
          // Hit condition with special handling
          if (d < HIT_THRESHOLD) {
              // Mode 3 ignores hits beyond the cross-section distance
              if (t > u_clipDistance) {
                  t += SAFE_STEP;
                  continue;
              }
              
              // Otherwise render as normal
              return t;
          }
          
          // Calculate and apply step
          t += calculateStepSize(d);
          
          if (t > MAX_DIST)
              break;
      }
      
      return t;
  }

  // Main ray marching function - delegates to specialized implementations
  float rayMarch(vec3 ro, vec3 rd) {
      // Delegate to the appropriate ray marching implementation based on clip mode
      if (u_clipMode == 0) {
          return rayMarchStandard(ro, rd);
      } else if (u_clipMode == 1) {
          return rayMarchClipMode1(ro, rd);
      } else if (u_clipMode == 2) {
          return rayMarchClipMode2(ro, rd);
      } else if (u_clipMode == 3) {
          return rayMarchClipMode3(ro, rd);
      } else {
          // Fallback to standard implementation for any unknown clip modes
          return rayMarchStandard(ro, rd);
      }
  }

  // Normal (finite differences)
  vec3 getNormal(vec3 p) {
      float eps = 0.001;
      float dx = quaternionJuliaDE(p + vec3(eps, 0.0, 0.0)) - quaternionJuliaDE(p - vec3(eps, 0.0, 0.0));
      float dy = quaternionJuliaDE(p + vec3(0.0, eps, 0.0)) - quaternionJuliaDE(p - vec3(0.0, eps, 0.0));
      float dz = quaternionJuliaDE(p + vec3(0.0, 0.0, eps)) - quaternionJuliaDE(p - vec3(0.0, 0.0, eps));
      return normalize(vec3(dx, dy, dz));
  }

  // Soft shadows
  float calcShadow(vec3 ro, vec3 rd) {
      float t = 0.02;
      float res = 1.0;
      for(int i=0; i<32; i++){
          vec3 p = ro + rd*t;
          float d = quaternionJuliaDE(p);
          if(d < HIT_THRESHOLD * 5.0) return 0.0;
          res = min(res, 10.0*d/t);
          t += d;
          if(t > 20.0) break;
      }
      return clamp(res, 0.0, 1.0);
  }

  // Ambient Occlusion (reduced strength)
  float calcAO(vec3 pos, vec3 nor) {
      float occ = 0.0;
      for(int i=0; i<5; i++){
          float dist = 0.02 + 0.12*float(i);
          vec3 pt = pos + nor * dist;
          float d = quaternionJuliaDE(pt);
          if(d < dist) {
              occ += 1.0;
          }
      }
      // AO in range 0..1, but additionally reducing the effect
      float rawAO = 1.0 - occ*0.2;
      float aoStrength = 0.5;  // <= key: AO at half strength
      return 1.0 - aoStrength*(1.0 - rawAO);
  }

  // Specular
  float calcSpecular(vec3 rd, vec3 lightDir, vec3 normal) {
      vec3 h = normalize(lightDir - rd);
      float spec = pow(clamp(dot(normal, h), 0.0, 1.0), 32.0);
      return spec;
  }

    // --- Color Palette System ---
  // Helper functions for creating color palettes

  // Creates a sinusoidal wave pattern with phase shifts
  vec3 sinePalette(float t, float freq, vec3 phase, vec3 amp, vec3 offset) {
    return vec3(
      offset.r + amp.r * sin(freq * t + phase.r),
      offset.g + amp.g * sin(freq * t + phase.g),
      offset.b + amp.b * sin(freq * t + phase.b)
    );
  }

  // Individual palette definitions - each has a descriptive comment
  // and uses the most appropriate technique for its color scheme
  
  // Palette 1: Rainbow - Full spectrum color cycle with 120° phase shifts
  vec3 palette1(float t) {
    return sinePalette(
      t, 6.28, // frequency = 2π for full cycle
      vec3(0.0, 2.09, 4.19), // 2π/3 phase shifts (120°)
      vec3(0.5, 0.5, 0.5),   // amplitude
      vec3(0.5, 0.5, 0.5)    // offset
    );
  }
  
  // Palette 2: Blue-yellow - Complementary blue/yellow gradient
  vec3 palette2(float t) {
    return vec3(
      sin(3.14*t),  // Red: sine wave
      t*t,          // Green: quadratic curve
      1.0 - t       // Blue: linear falloff
    );
  }
  
  // Palette 3: Red-violet - Rich warm tones with violet undertones
  vec3 palette3(float t) {
    return vec3(
      0.8 + 0.2*sin(3.14*t),       // Red: high with subtle variation
      0.2*t*t,                     // Green: quadratic (low)
      0.6 - 0.3*cos(3.14*t*2.0)    // Blue: mid-range with variation
    );
  }
  
  // Palette 4: Green-blue - Aquatic/forest tones
  vec3 palette4(float t) {
    return vec3(
      0.2*sin(3.14*t*2.0),      // Red: low with variation
      0.5 + 0.5*sin(6.28*t),    // Green: full range cycle
      0.5 + 0.3*sin(9.42*t)     // Blue: fast cycling with high bias
    );
  }
  
  // Palette 5: Warm (orange-red) - Fire-like warmth
  vec3 palette5(float t) {
    return vec3(
      0.8 + 0.2*sin(t),       // Red: high with subtle variation
      0.4 + 0.3*sin(t*2.0),   // Green: mid with faster variation
      0.1 + 0.1*sin(t*3.0)    // Blue: low with fastest variation
    );
  }
  
  // Palette 6: Polar glow - Aurora borealis effect
  vec3 palette6(float t) {
    return vec3(
      0.1 + 0.4*sin(t*3.14),       // Red: low
      0.3 + 0.6*sin(t*3.14+1.0),   // Green: dominant with phase shift
      0.7 + 0.3*sin(t*3.14+2.0)    // Blue: high with phase shift
    );
  }
  
  // Palette 7: Cyan-magenta - Retro tech look
  vec3 palette7(float t) {
    float s = t*2.0;  // Faster cycling
    return vec3(
      0.5 - 0.5*cos(s),        // Red: cosine wave
      0.5 - 0.5*cos(s+2.0),    // Green: phase-shifted
      0.5 - 0.5*cos(s+4.0)     // Blue: phase-shifted
    );
  }
  
  // Palette 8: Desert - Earthy tones with sand and clay
  vec3 palette8(float t) {
    return vec3(
      0.5 + 0.5*pow(t, 0.4),   // Red: dominant (sand)
      0.3 + 0.3*pow(t, 1.2),   // Green: mid-range
      0.2 + 0.1*pow(t, 2.5)    // Blue: subtle
    );
  }
  
  // Palette 9: Underwater - Deep ocean blues and teals
  vec3 palette9(float t) {
    return vec3(
      0.1 + 0.15*sin(t*4.0),         // Red: minimal
      0.3 + 0.3*sin(t*2.0 + 1.5),    // Green: medium with phase shift
      0.5 + 0.5*sin(t + 1.0)         // Blue: dominant with slow variation
    );
  }
  
  // Palette 10: Metallic - Shimmering metal effect
  vec3 palette10(float t) {
    float v = 0.6 + 0.4*sin(t*15.0);  // High-frequency shimmer
    return vec3(
      v * (0.3 + 0.3*sin(t*4.0)),           // Red with shimmer
      v * (0.3 + 0.3*sin(t*4.0 + 2.0)),     // Green with shimmer and phase
      v * (0.3 + 0.3*sin(t*4.0 + 4.0))      // Blue with shimmer and phase
    );
  }

  // Main palette selection function - uses switch statement for clarity
  vec3 getPalette(float t, int idx) {
    switch(idx) {
      case 0: return palette1(t);  // Rainbow
      case 1: return palette2(t);  // Blue-yellow
      case 2: return palette3(t);  // Red-violet
      case 3: return palette4(t);  // Green-blue
      case 4: return palette5(t);  // Warm (orange-red)
      case 5: return palette6(t);  // Polar glow
      case 6: return palette7(t);  // Cyan-magenta
      case 7: return palette8(t);  // Desert
      case 8: return palette9(t);  // Underwater
      default: return palette10(t); // Metallic
    }
  }

    // Function to calculate orbit trap value
  float calcOrbitTrap(vec3 pos) {
    vec4 z = vec4(pos, u_slice);
    vec4 c = u_c;
    float minDistance = 1000.0;  // Large initial value
    
    for (int i=0; i<30; i++) {  // Fewer iterations than main loop for performance
      // Circle trap (distance from origin)
      if (u_orbitTrapType == 0) {
        float dist = length(z.xyz) - u_orbitTrapParams.x;
        minDistance = min(minDistance, abs(dist));
      }
      // Line trap (distance from an axis)
      else if (u_orbitTrapType == 1) {
        float dist = length(z.xy) - u_orbitTrapParams.x;  // Distance from Z axis
        minDistance = min(minDistance, abs(dist));
      }
      // Point trap (distance from a specified point)
      else if (u_orbitTrapType == 2) {
        vec3 point = vec3(u_orbitTrapParams.xyz);
        float dist = length(z.xyz - point);
        minDistance = min(minDistance, dist);
      }
      // Cross trap (minimum distance from any axis)
      else if (u_orbitTrapType == 3) {
        float distX = abs(z.x);
        float distY = abs(z.y);
        float distZ = abs(z.z);
        minDistance = min(minDistance, min(min(distX, distY), distZ));
      }
      
      // Next iteration
      z = qmul(z, z) + c;
      
      // Exit condition
      if (length(z) > 4.0) break;
    }
    
    // Transform distance to coloring value (0-1)
    return 1.0 - clamp(minDistance * u_orbitTrapParams.w, 0.0, 1.0);
  }
  
  // RGB to HSL conversion
  vec3 rgb2hsl(vec3 color) {
    float maxVal = max(max(color.r, color.g), color.b);
    float minVal = min(min(color.r, color.g), color.b);
    float delta = maxVal - minVal;
    
    float h = 0.0;
    float s = 0.0;
    float l = (maxVal + minVal) / 2.0;
    
    if (delta > 0.0) {
      s = l < 0.5 ? delta / (maxVal + minVal) : delta / (2.0 - maxVal - minVal);
      
      if (color.r == maxVal) {
        h = (color.g - color.b) / delta + (color.g < color.b ? 6.0 : 0.0);
      } else if (color.g == maxVal) {
        h = (color.b - color.r) / delta + 2.0;
      } else {
        h = (color.r - color.g) / delta + 4.0;
      }
      h /= 6.0;
    }
    
    return vec3(h, s, l);
  }
  
  // Helper for HSL to RGB conversion
  float hue2rgb(float p, float q, float t) {
    if (t < 0.0) t += 1.0;
    if (t > 1.0) t -= 1.0;
    if (t < 1.0/6.0) return p + (q - p) * 6.0 * t;
    if (t < 1.0/2.0) return q;
    if (t < 2.0/3.0) return p + (q - p) * (2.0/3.0 - t) * 6.0;
    return p;
  }
  
  // HSL to RGB conversion
  vec3 hsl2rgb(vec3 hsl) {
    float h = hsl.x;
    float s = hsl.y;
    float l = hsl.z;
    
    vec3 rgb;
    
    if (s == 0.0) {
      rgb = vec3(l); // Grayscale
    } else {
      float q = l < 0.5 ? l * (1.0 + s) : l + s - l * s;
      float p = 2.0 * l - q;
      
      rgb.r = hue2rgb(p, q, h + 1.0/3.0);
      rgb.g = hue2rgb(p, q, h);
      rgb.b = hue2rgb(p, q, h - 1.0/3.0);
    }
    
    return rgb;
  }
  
  // Apply dynamic color adjustments to a base color
  vec3 applyColorDynamics(vec3 color, float time) {
    // Apply phase shift, potentially animated
    float phaseShift = u_colorPhaseShift;
    if (u_colorAnimEnabled) {
      phaseShift += time * u_colorAnimSpeed;
    }
    
    // Convert to HSL for better adjustments
    vec3 hsl = rgb2hsl(color);
    
    // Apply hue shift (phase shift affects hue)
    hsl.x = fract(hsl.x + phaseShift / (2.0 * 3.14159265));
    
    // Apply saturation
    hsl.y = clamp(hsl.y * u_colorSaturation, 0.0, 1.0);
    
    // Apply brightness and contrast (to luminance)
    // First apply contrast (relative to 0.5)
    hsl.z = 0.5 + (hsl.z - 0.5) * u_colorContrast;
    
    // Then apply brightness
    hsl.z = hsl.z * u_colorBrightness;
    
    // Clamp luminance
    hsl.z = clamp(hsl.z, 0.0, 1.0);
    
    // Convert back to RGB
    return hsl2rgb(hsl);
  }
  
  // Generate physics-based color
  vec3 getPhysicsBasedColor(float t, vec3 pos, vec3 normal) {
    // Parameters
    float frequency = u_physicsParams.x;   // Effect frequency
    float waves = u_physicsParams.y;       // Number of waves/periods
    float intensity = u_physicsParams.z;   // Effect intensity
    float balance = u_physicsParams.w;     // Balance between effect and base color
    
    // Diffraction - rainbow effects
    if (u_physicsColorType == 0) {
      // Simulate diffraction - splitting light into spectrum colors
      float angle = dot(normal, vec3(0.0, 1.0, 0.0)) * 0.5 + 0.5;
      vec3 rainbow = sinePalette(
        t * frequency + angle * waves,
        6.28, 
        vec3(0.0, 2.09, 4.19),  // 2π/3 phase shifts (120°)
        vec3(intensity),
        vec3(0.5)
      );
      return rainbow;
    }
    // Interference - oil-on-water effect
    else if (u_physicsColorType == 1) {
      // Simulate interference patterns like oil film
      float d1 = length(pos.xy) * frequency;
      float d2 = length(pos.yz) * frequency;
      
      vec3 color1 = sinePalette(d1, waves, vec3(0.0, 1.0, 2.0), vec3(0.5), vec3(0.5));
      vec3 color2 = sinePalette(d2, waves, vec3(0.0, 1.0, 2.0), vec3(0.5), vec3(0.5));
      
      return mix(color1, color2, 0.5) * intensity;
    }
    // Emission spectrum - spectral lines
    else if (u_physicsColorType == 2) {
      // Simulate emission spectrum - sharp color lines
      float val = fract(t * frequency * waves) * 10.0;
      float lineIntensity = 1.0 - min(1.0, val); // Sharp lines
      
      // Different spectral lines for different "elements"
      vec3 line1 = vec3(1.0, 0.2, 0.2) * step(0.9, lineIntensity); // Red line
      vec3 line2 = vec3(0.2, 1.0, 0.2) * step(0.8, lineIntensity); // Green line
      vec3 line3 = vec3(0.2, 0.2, 1.0) * step(0.7, lineIntensity); // Blue line
      vec3 line4 = vec3(1.0, 1.0, 0.2) * step(0.6, lineIntensity); // Yellow line
      
      return (line1 + line2 + line3 + line4) * intensity;
    }
    
    // Default - return standard color
    return vec3(1.0);
  }

  void main(){
      vec2 uv = (gl_FragCoord.xy / u_resolution.xy) * 2.0 - 1.0;
      uv.x *= u_resolution.x / u_resolution.y;

      vec3 ro = u_camPos;
      vec3 rd = normalize(u_camRot * vec3(uv, -u_focalLength));

      float t = rayMarch(ro, rd);
      if(t > MAX_DIST - 0.1) {
          gl_FragColor = vec4(0.0,0.0,0.0,1.0);
          return;
      }
      vec3 pos = ro + rd * t;
      vec3 normal = getNormal(pos);

      // Simple light
      vec3 lightPos = vec3(10.0, 10.0, 10.0);
      vec3 lightDir = normalize(lightPos - pos);
      float diff = clamp(dot(normal, lightDir), 0.0, 1.0);

      // Shadows
      float shadowVal = 1.0;
      if(u_enableShadows){
        shadowVal = calcShadow(pos + normal*0.001, lightDir);
      }

      // AO
      float aoVal = 1.0;
      if(u_enableAO){
        aoVal = calcAO(pos, normal);
      }

      // Iterations
      float iCount = (u_enableSmoothColor)
        ? getIterationSmooth(pos)
        : getIterationCount(pos);
      float iterNorm = iCount / u_maxIter;

      // Fractal coloring with advanced effects
      vec3 fractColor = vec3(1.0);
      if(u_colorEnabled) {
        if (u_physicsBasedColor) {
          // Physics-based coloring
          vec3 physicsColor = getPhysicsBasedColor(iterNorm, pos, normal);
          
          // Option to mix with standard palette color
          if (u_physicsParams.w < 1.0) {
            vec3 paletteColor = getPalette(iterNorm, u_paletteIndex);
            fractColor = mix(paletteColor, physicsColor, u_physicsParams.w);
          } else {
            fractColor = physicsColor;
          }
        } 
        else if (u_orbitTrapEnabled) {
          // Orbit trap coloring
          float trapValue = calcOrbitTrap(pos);
          fractColor = getPalette(trapValue, u_paletteIndex);
        } 
        else {
          // Standard iteration-based coloring
          fractColor = getPalette(iterNorm, u_paletteIndex);
        }
        
        // Apply dynamic color adjustments
        fractColor = applyColorDynamics(fractColor, u_time);
      }

      // Diffuse
      vec3 col = fractColor * (0.2 + 0.8 * diff * shadowVal);

      // Specular
      if(u_enableSpecular){
        float spec = calcSpecular(rd, lightDir, normal) * shadowVal;
        col += vec3(1.0) * spec * 0.5;
      }

      // AO (partially)
      col *= aoVal;

      gl_FragColor = vec4(col, 1.0);
  }
`;

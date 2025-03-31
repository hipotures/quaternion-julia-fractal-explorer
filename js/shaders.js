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

  u_maxIter:          { value: 100 },   // Initial value
  u_enableShadows:    { value: false },  // Initial value
  u_enableAO:         { value: false },  // Initial value
  u_enableSmoothColor:{ value: false },  // Initial value
  u_enableSpecular:   { value: false },  // Initial value
  u_paletteIndex:     { value: 0 },      // Initial value
  u_adaptiveSteps:    { value: false },   // Initial value for adaptive ray marching
  u_clipMode:         { value: 0 },       // Cross section mode (0: off, 1: method 1, 2: method 2)
  u_clipDistance:     { value: 3.5 }      // Distance of clipping plane from camera - zwiększona wartość
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

  // Completely simplified ray marching implementation
  float rayMarch(vec3 ro, vec3 rd) {
      // For standard mode we use the simplest possible implementation
      if (u_clipMode == 0) {
          float t = 0.0;
          for (int i = 0; i < MAX_MARCH; i++) {
              vec3 pos = ro + rd * t;
              float d = quaternionJuliaDE(pos);
              
              // Simple hit condition
              if (d < 0.0001) {
                  return t;
              }
              
              // Standard step
              if (u_adaptiveSteps) {
                  float stepFactor = 1.0;
                  if (d < 0.01) stepFactor = 0.5;
                  else if (d > 0.5) stepFactor = 2.0;
                  else stepFactor = 1.0 + (d - 0.01) * 1.8;
                  t += d * stepFactor;
              } else {
                  t += d;
              }
              
              if (t > MAX_DIST) break;
          }
          return t;
      } 
      // For other modes we use special implementations 
      else {
          float t = 0.0;
          for (int i = 0; i < MAX_MARCH; i++) {
              vec3 pos = ro + rd * t;
              float d = quaternionJuliaDE(pos);
              
              // Hit condition
              if (d < 0.0001) {
                  // Mode 1 - Ignore first hit
                  if (u_clipMode == 1) {
                      t += 0.002;
                      continue;
                  }
                  
                  // Mode 2 - Only render cross-section at specific distance
                  if (u_clipMode == 2) {
                      float distToPlane = abs(t - u_clipDistance);
                      if (distToPlane < 0.01) {
                          return t; // Only render points in cross-section
                      } else {
                          t += 0.002;
                          continue;
                      }
                  }
                  
                  // Mode 3 - Ignore hits beyond cross-section plane
                  if (u_clipMode == 3 && t > u_clipDistance) {
                      t += 0.002;
                      continue;
                  }
                  
                  // All other cases - render surface
                  return t;
              }
              
              // Adaptive step (if enabled)
              if (u_adaptiveSteps) {
                  // Adaptive factor - more aggressive implementation
                  // Near surface - much smaller steps (increases precision)
                  // Far from surface - much larger steps (increases performance)
                  float stepFactor;
                  if (d < 0.01) {
                      // Very close to surface - use small step for precision
                      stepFactor = 0.5;
                  } else if (d > 0.5) {
                      // Far from surface - use much larger step for performance
                      stepFactor = 2.0;
                  } else {
                      // Mid-range - more aggressive transition
                      stepFactor = 1.0 + (d - 0.01) * 1.8; // Linear from 1.0 to ~2.0
                  }
                  t += d * stepFactor;
              } else {
                  // Standard Ray Marching
                  t += d;
              }
              
              if (t > MAX_DIST) break;
          }
          return t;
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
          if(d < 0.0005) return 0.0;
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

  // Color palettes (10 different ones)
  vec3 palette1(float t){ // Rainbow
    return vec3(
      0.5 + 0.5*sin(6.28*t),
      0.5 + 0.5*sin(6.28*(t+0.33)),
      0.5 + 0.5*sin(6.28*(t+0.66))
    );
  }
  vec3 palette2(float t){ // Blue-yellow
    return vec3(
      sin(3.14*t),
      t*t,
      1.0 - t
    );
  }
  vec3 palette3(float t){ // Red-violet
    return vec3(
      0.8 + 0.2*sin(3.14*t),
      0.2*t*t,
      0.6 - 0.3*cos(3.14*t*2.0)
    );
  }
  vec3 palette4(float t){ // Green-blue
    return vec3(
      0.2*sin(3.14*t*2.0),
      0.5 + 0.5*sin(6.28*t),
      0.5 + 0.3*sin(9.42*t)
    );
  }
  vec3 palette5(float t){ // Warm (orange-red)
    return vec3(
      0.8 + 0.2*sin(t),
      0.4 + 0.3*sin(t*2.0),
      0.1 + 0.1*sin(t*3.0)
    );
  }
  vec3 palette6(float t){ // Polar glow
    return vec3(
      0.1 + 0.4*sin(t*3.14),
      0.3 + 0.6*sin(t*3.14+1.0),
      0.7 + 0.3*sin(t*3.14+2.0)
    );
  }
  vec3 palette7(float t){ // Cyan-magenta
    float s = t*2.0;
    return vec3(
      0.5 - 0.5*cos(s),
      0.5 - 0.5*cos(s+2.0),
      0.5 - 0.5*cos(s+4.0)
    );
  }
  vec3 palette8(float t){ // Desert
    return vec3(
      0.5 + 0.5*pow(t, 0.4),
      0.3 + 0.3*pow(t, 1.2),
      0.2 + 0.1*pow(t, 2.5)
    );
  }
  vec3 palette9(float t){ // Underwater
    return vec3(
      0.1 + 0.15*sin(t*4.0),
      0.3 + 0.3*sin(t*2.0 + 1.5),
      0.5 + 0.5*sin(t + 1.0)
    );
  }
  vec3 palette10(float t){ // Metallic
    float v = 0.6 + 0.4*sin(t*15.0);
    return vec3(
      v * (0.3 + 0.3*sin(t*4.0)),
      v * (0.3 + 0.3*sin(t*4.0 + 2.0)),
      v * (0.3 + 0.3*sin(t*4.0 + 4.0))
    );
  }

  vec3 getPalette(float t, int idx){
    if(idx == 0) return palette1(t);
    else if(idx == 1) return palette2(t);
    else if(idx == 2) return palette3(t);
    else if(idx == 3) return palette4(t);
    else if(idx == 4) return palette5(t);
    else if(idx == 5) return palette6(t);
    else if(idx == 6) return palette7(t);
    else if(idx == 7) return palette8(t);
    else if(idx == 8) return palette9(t);
    else return palette10(t);
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

      vec3 fractColor = vec3(1.0);
      if(u_colorEnabled){
        fractColor = getPalette(iterNorm, u_paletteIndex);
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

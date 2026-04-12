/* ═══════════════════════════════════════════════════════════
   Atmosphere Fresnel Shader
   Creates the glowing halo around the 3D Earth sphere.
   Applied to a slightly larger sphere behind the Earth.
   ═══════════════════════════════════════════════════════════ */

export const atmosphereVertexShader = `
  varying vec3 vNormal;
  varying vec3 vPosition;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

export const atmosphereFragmentShader = `
  uniform vec3 uColor;
  uniform float uIntensity;
  uniform float uPower;
  varying vec3 vNormal;
  varying vec3 vPosition;

  void main() {
    // Fresnel effect — stronger glow at edges
    vec3 viewDir = normalize(-vPosition);
    float fresnel = 1.0 - dot(viewDir, vNormal);
    fresnel = pow(fresnel, uPower) * uIntensity;

    gl_FragColor = vec4(uColor, fresnel * 0.8);
  }
`

/* ═══════════════════════════════════════════════════════════
   Glow Shader — used for city point lights and node glows
   ═══════════════════════════════════════════════════════════ */

export const glowVertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

export const glowFragmentShader = `
  uniform vec3 uColor;
  uniform float uOpacity;
  varying vec2 vUv;

  void main() {
    float dist = distance(vUv, vec2(0.5));
    float glow = 1.0 - smoothstep(0.0, 0.5, dist);
    glow = pow(glow, 2.0);
    gl_FragColor = vec4(uColor, glow * uOpacity);
  }
`

/* ═══════════════════════════════════════════════════════════
   Particle Shader — for animated dots traveling along arcs
   ═══════════════════════════════════════════════════════════ */

export const particleVertexShader = `
  attribute float aSize;
  attribute float aAlpha;
  varying float vAlpha;

  void main() {
    vAlpha = aAlpha;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * (300.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`

export const particleFragmentShader = `
  uniform vec3 uColor;
  varying float vAlpha;

  void main() {
    // Circular soft particle
    float dist = length(gl_PointCoord - vec2(0.5));
    if (dist > 0.5) discard;
    float alpha = 1.0 - smoothstep(0.2, 0.5, dist);
    gl_FragColor = vec4(uColor, alpha * vAlpha);
  }
`

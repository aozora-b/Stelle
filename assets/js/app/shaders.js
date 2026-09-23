const CyberpunkShaders = {
  createHoloMaterial(baseTexture, glowColorHex = 0x00f0ff) {
    const color = new THREE.Color(glowColorHex);
    const vertexShader = `
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vPosition;
      void main() {
        vUv = uv;
        vNormal = normalize(normalMatrix * normal);
        vPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;
    const fragmentShader = `
      uniform sampler2D map;
      uniform vec3 glowColor;
      uniform float time;
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vPosition;
      void main() {
        // Sample texture
        vec4 texColor = texture2D(map, vUv);
        // Animated horizontal holographic scanlines
        float scanline = sin(vUv.y * 120.0 - time * 6.0) * 0.08 + 0.92;
        // Subtle vertical sweeping light bar
        float sweep = smoothstep(0.0, 0.15, sin(vUv.y * 2.0 - time * 1.5)) * 0.15;
        // Edge Fresnel glow
        vec3 viewDir = vec3(0.0, 0.0, 1.0);
        float fresnel = pow(1.0 - abs(dot(vNormal, viewDir)), 2.0) * 0.35;
        vec3 finalColor = texColor.rgb * scanline + glowColor * (sweep + fresnel);
        float finalAlpha = texColor.a * 0.92;
        gl_FragColor = vec4(finalColor, finalAlpha);
      }
    `;
    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        map: { value: baseTexture },
        glowColor: { value: color },
        time: { value: 0.0 }
      },
      transparent: true,
      side: THREE.DoubleSide
    });
    return material;
  }
};
window.CyberpunkShaders = CyberpunkShaders;
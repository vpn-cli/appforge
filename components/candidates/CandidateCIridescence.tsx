"use client";

import { useEffect, useRef } from "react";
import { Renderer, Program, Mesh, Triangle } from "ogl";

type Props = {
  isDark?: boolean;
  isPaused?: boolean;
};

const vertexShader = /* glsl */ `
  attribute vec2 uv;
  attribute vec2 position;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  precision highp float;
  uniform float uTime;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform vec3 uBaseColor;
  uniform vec2 uResolution;
  varying vec2 vUv;

  // Simplex noise / fluid wave function
  vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
  float snoise(vec2 v){
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
             -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy) );
    vec2 x0 = v -   i + dot(i, C.xx);
    vec2 i1;
    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod(i, 289.0);
    vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
    + i.x + vec3(0.0, i1.x, 1.0 ));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
    m = m*m ;
    m = m*m ;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  void main() {
    vec2 uv = vUv;
    float aspect = uResolution.x / uResolution.y;
    vec2 p = vec2(uv.x * aspect, uv.y);

    // Multi-octave wave distortion
    float n1 = snoise(p * 1.8 + vec2(uTime * 0.12, uTime * 0.08));
    float n2 = snoise(p * 3.5 - vec2(uTime * 0.15, n1 * 0.4));
    float pattern = smoothstep(-0.4, 0.8, n1 * 0.6 + n2 * 0.4);

    // Iridescent silk sheen
    vec3 col = mix(uBaseColor, uColorA, pattern);
    col = mix(col, uColorB, smoothstep(0.2, 0.9, n2));

    gl_FragColor = vec4(col, 1.0);
  }
`;

export function CandidateCIridescence({ isDark = false, isPaused = false }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let renderer: Renderer | null = null;
    let animId = 0;

    try {
      renderer = new Renderer({
        dpr: Math.min(window.devicePixelRatio || 1, 1.5),
        alpha: true,
        antialias: false,
        powerPreference: "low-power",
      });
    } catch {
      return;
    }

    const gl = renderer.gl;
    container.appendChild(gl.canvas);
    gl.canvas.style.width = "100%";
    gl.canvas.style.height = "100%";
    gl.canvas.style.display = "block";

    const geometry = new Triangle(gl);

    // Color tokens
    const colorA = isDark ? [0.31, 0.27, 0.90] : [0.55, 0.60, 0.95];
    const colorB = isDark ? [0.12, 0.11, 0.30] : [0.78, 0.82, 0.98];
    const baseColor = isDark ? [0.035, 0.035, 0.043] : [0.97, 0.975, 0.99];

    const program = new Program(gl, {
      vertex: vertexShader,
      fragment: fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uColorA: { value: colorA },
        uColorB: { value: colorB },
        uBaseColor: { value: baseColor },
        uResolution: { value: [container.offsetWidth || 1, container.offsetHeight || 1] },
      },
    });

    const mesh = new Mesh(gl, { geometry, program });

    const resize = () => {
      if (!renderer || !container) return;
      const width = container.offsetWidth;
      const height = container.offsetHeight;
      renderer.setSize(width, height);
      program.uniforms.uResolution.value = [width, height];
    };
    window.addEventListener("resize", resize);
    resize();

    let lastTime = performance.now();
    let totalTime = 0;

    const update = (now: number) => {
      if (!isPaused && renderer) {
        const delta = (now - lastTime) * 0.001;
        lastTime = now;
        totalTime += Math.min(delta, 0.1);
        program.uniforms.uTime.value = totalTime;
        renderer.render({ scene: mesh });
      }
      animId = requestAnimationFrame(update);
    };

    animId = requestAnimationFrame(update);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
      if (renderer?.gl.canvas.parentElement) {
        renderer.gl.canvas.parentElement.removeChild(renderer.gl.canvas);
      }
    };
  }, [isDark, isPaused]);

  return <div ref={containerRef} className="w-full h-full absolute inset-0 pointer-events-none" />;
}

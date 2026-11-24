"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { readMeshPaletteTokens } from "@/lib/shader-tokens";

const VERTEX_SHADER_SOURCE = `
attribute vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER_SOURCE = `
precision mediump float;
uniform vec2 r;
uniform float t;
uniform vec3 c0;
uniform vec3 c1;
uniform vec3 c2;
uniform vec3 c3;

float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
  return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
float fb(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*n(p);p*=2.02;a*=.5;}return v;}

void main(){
  vec2 uv=gl_FragCoord.xy/r;
  vec2 p=uv;
  p.x*=r.x/r.y;
  vec2 q=vec2(fb(p*1.4+t*.06),fb(p*1.4+vec2(5.2,1.3)-t*.05));
  float k=fb(p*1.1+q*1.9+t*.04);
  vec3 col=mix(c0,c1,smoothstep(.25,.65,k));
  col=mix(col,c2,smoothstep(.5,.85,q.x)*.85);
  col=mix(col,c3,smoothstep(.45,.9,q.y)*.6);
  gl_FragColor=vec4(col,1.);
}
`;

// Full-screen triangle covering NDC [-1, 1] in 1 draw call
const TRIANGLE_VERTICES = new Float32Array([
  -1, -1,
   3, -1,
  -1,  3,
]);

type Props = {
  themeKey?: string;
  isPaused?: boolean;
  prefersReducedMotion?: boolean;
  onFallback?: () => void;
  className?: string;
};

export function NativeMeshShader({
  themeKey,
  isPaused = false,
  prefersReducedMotion = false,
  onFallback,
  className = "",
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isReady, setIsReady] = useState(false);

  // References to keep WebGL state across renders
  const glRef = useRef<WebGLRenderingContext | WebGL2RenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const uniformLocsRef = useRef<{
    r: WebGLUniformLocation | null;
    t: WebGLUniformLocation | null;
    c0: WebGLUniformLocation | null;
    c1: WebGLUniformLocation | null;
    c2: WebGLUniformLocation | null;
    c3: WebGLUniformLocation | null;
  } | null>(null);

  const animFrameRef = useRef<number | null>(null);
  const pollFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);
  const lastPauseStartRef = useRef<number | null>(null);

  // Update palette uniforms without recompile
  const applyPalette = useCallback(() => {
    const gl = glRef.current;
    const locs = uniformLocsRef.current;
    if (!gl || !locs) return;

    const isDark = document.documentElement.classList.contains("dark");
    const { c0, c1, c2, c3 } = readMeshPaletteTokens(isDark);

    gl.uniform3f(locs.c0, c0[0], c0[1], c0[2]);
    gl.uniform3f(locs.c1, c1[0], c1[1], c1[2]);
    gl.uniform3f(locs.c2, c2[0], c2[1], c2[2]);
    gl.uniform3f(locs.c3, c3[0], c3[1], c3[2]);
  }, []);

  // Main compilation and WebGL lifecycle
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Guardrail: Context loss listener
    const handleContextLost = (e: Event) => {
      e.preventDefault();
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (pollFrameRef.current) cancelAnimationFrame(pollFrameRef.current);
      onFallback?.();
    };
    canvas.addEventListener("webglcontextlost", handleContextLost);

    const gl =
      canvas.getContext("webgl2", {
        powerPreference: "high-performance",
        antialias: false,
        depth: false,
        stencil: false,
        preserveDrawingBuffer: false,
      }) ||
      canvas.getContext("webgl", {
        powerPreference: "high-performance",
        antialias: false,
        depth: false,
        stencil: false,
        preserveDrawingBuffer: false,
      });

    if (!gl) {
      onFallback?.();
      return () => {
        canvas.removeEventListener("webglcontextlost", handleContextLost);
      };
    }

    glRef.current = gl;

    let destroyed = false;

    // Async compile using KHR_parallel_shader_compile if available
    const ext = gl.getExtension("KHR_parallel_shader_compile");

    const compileShader = (type: number, source: string): WebGLShader | null => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      return shader;
    };

    const vs = compileShader(gl.VERTEX_SHADER, VERTEX_SHADER_SOURCE);
    const fs = compileShader(gl.FRAGMENT_SHADER, FRAGMENT_SHADER_SOURCE);

    if (!vs || !fs) {
      onFallback?.();
      return () => {
        canvas.removeEventListener("webglcontextlost", handleContextLost);
      };
    }

    const prog = gl.createProgram();
    if (!prog) {
      onFallback?.();
      return () => {
        canvas.removeEventListener("webglcontextlost", handleContextLost);
      };
    }

    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);

    // Setup geometry buffer (full screen triangle)
    const vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, TRIANGLE_VERTICES, gl.STATIC_DRAW);

    const onProgramLinked = () => {
      if (destroyed) return;
      gl.useProgram(prog);

      const posLoc = gl.getAttribLocation(prog, "position");
      gl.enableVertexAttribArray(posLoc);
      gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

      const locs = {
        r: gl.getUniformLocation(prog, "r"),
        t: gl.getUniformLocation(prog, "t"),
        c0: gl.getUniformLocation(prog, "c0"),
        c1: gl.getUniformLocation(prog, "c1"),
        c2: gl.getUniformLocation(prog, "c2"),
        c3: gl.getUniformLocation(prog, "c3"),
      };

      uniformLocsRef.current = locs;
      programRef.current = prog;

      applyPalette();
      setIsReady(true);
    };

    if (ext) {
      // Async poll via KHR_parallel_shader_compile without blocking main thread
      const poll = () => {
        if (destroyed) return;
        const complete = gl.getProgramParameter(prog, ext.COMPLETION_STATUS_KHR);
        if (complete) {
          if (gl.getProgramParameter(prog, gl.LINK_STATUS)) {
            onProgramLinked();
          } else {
            console.error("[NativeMeshShader] link failed:", gl.getProgramInfoLog(prog));
            onFallback?.();
          }
        } else {
          pollFrameRef.current = requestAnimationFrame(poll);
        }
      };
      pollFrameRef.current = requestAnimationFrame(poll);
    } else {
      // Fallback without extension: compile only after hydration & idle (load + 1s)
      const scheduleIdleCompile = () => {
        setTimeout(() => {
          if (typeof window.requestIdleCallback === "function") {
            window.requestIdleCallback(() => {
              if (destroyed) return;
              if (gl.getProgramParameter(prog, gl.LINK_STATUS)) {
                onProgramLinked();
              } else {
                onFallback?.();
              }
            });
          } else {
            if (destroyed) return;
            if (gl.getProgramParameter(prog, gl.LINK_STATUS)) {
              onProgramLinked();
            } else {
              onFallback?.();
            }
          }
        }, 1000);
      };

      if (document.readyState === "complete") {
        scheduleIdleCompile();
      } else {
        window.addEventListener("load", scheduleIdleCompile, { once: true });
      }
    }

    return () => {
      destroyed = true;
      canvas.removeEventListener("webglcontextlost", handleContextLost);
      if (pollFrameRef.current) cancelAnimationFrame(pollFrameRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (prog) {
        gl.deleteProgram(prog);
      }
      if (vs) gl.deleteShader(vs);
      if (fs) gl.deleteShader(fs);
      if (vbo) gl.deleteBuffer(vbo);
    };
  }, [applyPalette, onFallback]);

  // Handle theme changes: update uniforms without recompilation
  useEffect(() => {
    applyPalette();

    const mo = new MutationObserver(() => applyPalette());
    mo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-theme"],
    });

    return () => mo.disconnect();
  }, [themeKey, applyPalette]);

  // Handle pause / resume timing
  useEffect(() => {
    if (isPaused) {
      lastPauseStartRef.current = performance.now();
    } else if (lastPauseStartRef.current !== null) {
      pausedTimeRef.current += performance.now() - lastPauseStartRef.current;
      lastPauseStartRef.current = null;
    }
  }, [isPaused]);

  // Render loop
  useEffect(() => {
    if (!isReady) return;
    const canvas = canvasRef.current;
    const gl = glRef.current;
    const locs = uniformLocsRef.current;
    if (!canvas || !gl || !locs) return;

    let cancelled = false;

    const render = () => {
      if (cancelled) return;

      // Handle pause or off-screen
      if (isPaused) {
        animFrameRef.current = requestAnimationFrame(render);
        return;
      }

      // DPR cap 1.5
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const rect = canvas.getBoundingClientRect();
      const displayWidth = Math.max(1, Math.round(rect.width * dpr));
      const displayHeight = Math.max(1, Math.round(rect.height * dpr));

      if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
        canvas.width = displayWidth;
        canvas.height = displayHeight;
        gl.viewport(0, 0, displayWidth, displayHeight);
        gl.uniform2f(locs.r, displayWidth, displayHeight);
      }

      // Calculate elapsed animation time in seconds
      const now = performance.now();
      if (startTimeRef.current === 0) {
        startTimeRef.current = now;
      }
      const elapsed = (now - startTimeRef.current - pausedTimeRef.current) / 1000;
      const t = prefersReducedMotion ? 0.0 : elapsed;

      gl.uniform1f(locs.t, t);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      // Reduced motion: draw one static frame and stop
      if (!prefersReducedMotion) {
        animFrameRef.current = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      cancelled = true;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isReady, isPaused, prefersReducedMotion]);

  return (
    <div
      className={`w-full h-full relative transition-opacity duration-400 ease-out ${
        isReady ? "opacity-100" : "opacity-0"
      } ${className}`}
      data-testid="native-mesh-shader"
    >
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
}

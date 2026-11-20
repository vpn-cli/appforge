/**
 * WebGL Shader Warmup Utility
 *
 * Pre-compiles Paper Shaders MeshGradient GLSL programs during browser idle time.
 * ANGLE and GPU driver store the compiled binary in their process-level shader cache,
 * allowing subsequent synchronous ShaderMount compilation to leverage the pre-warmed cache,
 * preventing main-thread input delay spikes during user interaction.
 */

import { meshGradientFragmentShader } from "@paper-design/shaders";

const VERTEX_SHADER_SOURCE = `#version 300 es
in vec2 a_position;
out vec2 v_objectUV;
void main() {
  v_objectUV = (a_position + 1.0) * 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

let hasWarmCompiled = false;

export function warmCompileMeshShader(): boolean {
  if (typeof window === "undefined" || hasWarmCompiled) return true;
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    const gl = canvas.getContext("webgl2", {
      powerPreference: "high-performance",
      antialias: false,
      depth: false,
      stencil: false,
      preserveDrawingBuffer: false,
    });
    if (!gl) return false;

    let vSrc = VERTEX_SHADER_SOURCE;
    let fSrc = meshGradientFragmentShader;

    const format = gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.MEDIUM_FLOAT);
    const precision = format ? format.precision : null;
    if (precision && precision < 23) {
      vSrc = vSrc.replace(/precision\s+(lowp|mediump)\s+float;/g, "precision highp float;");
      fSrc = fSrc
        .replace(/precision\s+(lowp|mediump)\s+float/g, "precision highp float")
        .replace(/\b(uniform|varying|attribute)\s+(lowp|mediump)\s+(\w+)/g, "$1 highp $3");
    }

    const vs = gl.createShader(gl.VERTEX_SHADER);
    if (!vs) return false;
    gl.shaderSource(vs, vSrc);
    gl.compileShader(vs);

    const fs = gl.createShader(gl.FRAGMENT_SHADER);
    if (!fs) return false;
    gl.shaderSource(fs, fSrc);
    gl.compileShader(fs);

    const prog = gl.createProgram();
    if (!prog) return false;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);

    gl.detachShader(prog, vs);
    gl.detachShader(prog, fs);
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    gl.deleteProgram(prog);
    gl.getExtension("WEBGL_lose_context")?.loseContext();

    hasWarmCompiled = true;
    return true;
  } catch {
    return false;
  }
}

import { useEffect, useRef } from "react";
import { useMotionValueEvent, type MotionValue } from "motion/react";
import {
  isDocumentVisible,
  observeDocumentVisibility,
  observeElementVisibility,
  shouldAnimate,
} from "@/lib/animation-runtime";

type VoxelArcaneLogoProps = {
  progress: MotionValue<number>;
  className?: string;
  mode?: "portal" | "loader";
  interactive?: boolean;
};

const VERTEX_SHADER = `#version 300 es
precision highp float;
layout(location = 0) in vec3 aPosition;
layout(location = 1) in vec3 aNormal;
layout(location = 2) in vec3 aOffset;
layout(location = 3) in float aSeed;

uniform float uProgress;
uniform float uTime;
uniform float uAspect;
uniform float uIntro;
uniform float uTiltX;
uniform float uTiltY;

out vec3 vNormal;
out float vSeed;
out float vDepth;

vec3 rotateX(vec3 p, float a) {
  float c = cos(a), s = sin(a);
  return vec3(p.x, p.y * c - p.z * s, p.y * s + p.z * c);
}

vec3 rotateY(vec3 p, float a) {
  float c = cos(a), s = sin(a);
  return vec3(p.x * c + p.z * s, p.y, -p.x * s + p.z * c);
}

float hash(float n) {
  return fract(sin(n * 12.9898 + 78.233) * 43758.5453);
}

void main() {
  float id = float(gl_InstanceID);
  float h1 = hash(id + 11.0);
  float h2 = hash(id + 37.0);
  float h3 = hash(id + 71.0);

  float introScatter = (1.0 - smoothstep(0.02, 0.62, uProgress)) * uIntro;
  float portalFracture = smoothstep(0.16, 0.58, uProgress) * (1.0 - smoothstep(0.78, 1.0, uProgress)) * (1.0 - uIntro);
  float settlePulse = sin(clamp(uProgress, 0.0, 1.0) * 3.14159265) * 0.035 * uIntro;

  vec2 radial = normalize(aOffset.xy + vec2(0.0001));
  vec3 randomDir = normalize(vec3(h1 * 2.0 - 1.0, h2 * 2.0 - 1.0, h3 * 2.0 - 1.0));
  vec3 center = aOffset;
  center += randomDir * introScatter * (1.35 + h1 * 1.9);
  center.xy += radial * portalFracture * (0.34 + h2 * 0.72);
  center.z += (h3 - 0.5) * portalFracture * 2.1;
  center.xy += vec2(
    sin(uTime * (0.8 + h1) + id * 0.13),
    cos(uTime * (0.7 + h2) + id * 0.11)
  ) * portalFracture * 0.045;

  float cube = 0.050 + aSeed * 0.010 + settlePulse;
  vec3 local = aPosition * cube;
  vec3 p = center + local;

  float autoY = sin(uTime * 0.28) * 0.075;
  float autoX = cos(uTime * 0.23) * 0.035;
  p = rotateY(p, uTiltY + autoY);
  p = rotateX(p, uTiltX + autoX);

  vec3 n = rotateY(aNormal, uTiltY + autoY);
  n = rotateX(n, uTiltX + autoX);
  vNormal = n;
  vSeed = aSeed;
  vDepth = p.z;

  float viewZ = p.z - 4.65;
  float f = 2.58;
  float A = -1.002002;
  float B = -0.2002002;
  gl_Position = vec4(p.x * f / max(uAspect, 0.1), p.y * f, A * viewZ + B, -viewZ);
}
`;

const FRAGMENT_SHADER = `#version 300 es
precision highp float;
in vec3 vNormal;
in float vSeed;
in float vDepth;
uniform vec3 uBase;
uniform vec3 uAccent;
out vec4 outColor;

void main() {
  vec3 n = normalize(vNormal);
  vec3 lightA = normalize(vec3(-0.45, 0.72, 0.58));
  vec3 lightB = normalize(vec3(0.72, -0.25, 0.44));
  float diffuse = max(dot(n, lightA), 0.0) * 0.78 + max(dot(n, lightB), 0.0) * 0.24;
  float rim = pow(1.0 - max(n.z, 0.0), 2.2) * 0.24;
  vec3 halfDir = normalize(lightA + vec3(0.0, 0.0, 1.0));
  float specular = pow(max(dot(n, halfDir), 0.0), 24.0) * 0.72;
  float accentMix = smoothstep(0.90, 0.985, vSeed);
  vec3 base = mix(uBase, uAccent, accentMix);
  float depthShade = 0.88 + clamp(vDepth * 0.07, -0.08, 0.08);
  vec3 color = base * (0.42 + diffuse) * depthShade + vec3(specular + rim);
  outColor = vec4(color, 1.0);
}
`;

const CUBE_POSITIONS = new Float32Array([
  -1, -1, 1, 1, -1, 1, 1, 1, 1, -1, 1, 1,
  1, -1, -1, -1, -1, -1, -1, 1, -1, 1, 1, -1,
  -1, 1, 1, 1, 1, 1, 1, 1, -1, -1, 1, -1,
  -1, -1, -1, 1, -1, -1, 1, -1, 1, -1, -1, 1,
  1, -1, 1, 1, -1, -1, 1, 1, -1, 1, 1, 1,
  -1, -1, -1, -1, -1, 1, -1, 1, 1, -1, 1, -1,
]);

const CUBE_NORMALS = new Float32Array([
  0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1,
  0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1,
  0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0,
  0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0,
  1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,
  -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0,
]);

const CUBE_INDICES = new Uint16Array([
  0, 1, 2, 0, 2, 3,
  4, 5, 6, 4, 6, 7,
  8, 9, 10, 8, 10, 11,
  12, 13, 14, 12, 14, 15,
  16, 17, 18, 16, 18, 19,
  20, 21, 22, 20, 22, 23,
]);

function compileShader(gl: WebGL2RenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createProgram(gl: WebGL2RenderingContext) {
  const vertex = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
  const fragment = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
  if (!vertex || !fragment) return null;
  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    return null;
  }
  return program;
}

/** True 3D voxel mark: SVG alpha sampling → instanced WebGL2 cubes → perspective + lighting. */
export function VoxelArcaneLogo({
  progress,
  className = "",
  mode = "portal",
  interactive = true,
}: VoxelArcaneLogoProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const progressRef = useRef(0);

  useMotionValueEvent(progress, "change", (value) => {
    progressRef.current = value;
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl2", { alpha: true, antialias: true, powerPreference: "high-performance" });
    if (!gl) return;
    const program = createProgram(gl);
    if (!program) return;

    const vao = gl.createVertexArray();
    const positionBuffer = gl.createBuffer();
    const normalBuffer = gl.createBuffer();
    const indexBuffer = gl.createBuffer();
    const offsetBuffer = gl.createBuffer();
    const seedBuffer = gl.createBuffer();
    if (!vao || !positionBuffer || !normalBuffer || !indexBuffer || !offsetBuffer || !seedBuffer) return;

    gl.bindVertexArray(vao);

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, CUBE_POSITIONS, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, CUBE_NORMALS, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, CUBE_INDICES, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, offsetBuffer);
    gl.enableVertexAttribArray(2);
    gl.vertexAttribPointer(2, 3, gl.FLOAT, false, 0, 0);
    gl.vertexAttribDivisor(2, 1);

    gl.bindBuffer(gl.ARRAY_BUFFER, seedBuffer);
    gl.enableVertexAttribArray(3);
    gl.vertexAttribPointer(3, 1, gl.FLOAT, false, 0, 0);
    gl.vertexAttribDivisor(3, 1);

    gl.bindVertexArray(null);

    const uProgress = gl.getUniformLocation(program, "uProgress");
    const uTime = gl.getUniformLocation(program, "uTime");
    const uAspect = gl.getUniformLocation(program, "uAspect");
    const uIntro = gl.getUniformLocation(program, "uIntro");
    const uTiltX = gl.getUniformLocation(program, "uTiltX");
    const uTiltY = gl.getUniformLocation(program, "uTiltY");
    const uBase = gl.getUniformLocation(program, "uBase");
    const uAccent = gl.getUniformLocation(program, "uAccent");

    let raf = 0;
    let running = false;
    let pageVisible = isDocumentVisible();
    let inViewport = true;
    let width = 1;
    let height = 1;
    let instanceCount = 0;
    let tiltX = 0;
    let tiltY = 0;
    let targetTiltX = 0;
    let targetTiltY = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
    };

    const buildInstances = (image: HTMLImageElement) => {
      const sampleWidth = 360;
      const sampleHeight = Math.round(sampleWidth * (1153 / 1600));
      const offscreen = document.createElement("canvas");
      offscreen.width = sampleWidth;
      offscreen.height = sampleHeight;
      const ctx = offscreen.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;
      ctx.clearRect(0, 0, sampleWidth, sampleHeight);
      ctx.drawImage(image, 0, 0, sampleWidth, sampleHeight);
      const data = ctx.getImageData(0, 0, sampleWidth, sampleHeight).data;
      const step = 7;
      const offsets: number[] = [];
      const seeds: number[] = [];
      let id = 0;

      for (let y = 0; y < sampleHeight; y += step) {
        for (let x = 0; x < sampleWidth; x += step) {
          const alpha = data[(y * sampleWidth + x) * 4 + 3] ?? 0;
          if (alpha < 112) continue;
          const nx = (x / sampleWidth - 0.5) * 2.95;
          const ny = (0.5 - y / sampleHeight) * 2.12;
          const seed = ((Math.sin(id * 91.17 + x * 0.37 + y * 0.13) * 43758.5453) % 1 + 1) % 1;
          offsets.push(nx, ny, 0);
          seeds.push(seed);
          id += 1;
        }
      }

      instanceCount = seeds.length;
      gl.bindBuffer(gl.ARRAY_BUFFER, offsetBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(offsets), gl.STATIC_DRAW);
      gl.bindBuffer(gl.ARRAY_BUFFER, seedBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(seeds), gl.STATIC_DRAW);
    };

    const loadLogo = () => {
      const dark = document.documentElement.classList.contains("dark");
      const image = new Image();
      image.decoding = "async";
      image.src = dark ? "/arcane-logo-white.svg" : "/arcane-logo-black.svg";
      image.onload = () => buildInstances(image);
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!interactive || mode === "loader") return;
      targetTiltY = (event.clientX / Math.max(window.innerWidth, 1) - 0.5) * 0.34;
      targetTiltX = (0.5 - event.clientY / Math.max(window.innerHeight, 1)) * 0.2;
    };

    const draw = (timeMs: number) => {
      if (!running) return;
      raf = requestAnimationFrame(draw);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      if (instanceCount === 0) return;

      tiltX += (targetTiltX - tiltX) * 0.055;
      tiltY += (targetTiltY - tiltY) * 0.055;
      const dark = document.documentElement.classList.contains("dark");

      gl.enable(gl.DEPTH_TEST);
      gl.enable(gl.CULL_FACE);
      gl.cullFace(gl.BACK);
      gl.useProgram(program);
      gl.bindVertexArray(vao);
      gl.uniform1f(uProgress, Math.max(0, Math.min(1, progressRef.current)));
      gl.uniform1f(uTime, timeMs * 0.001);
      gl.uniform1f(uAspect, width / Math.max(height, 1));
      gl.uniform1f(uIntro, mode === "loader" ? 1 : 0);
      gl.uniform1f(uTiltX, tiltX);
      gl.uniform1f(uTiltY, tiltY);
      if (dark) {
        gl.uniform3f(uBase, 0.72, 0.76, 0.68);
        gl.uniform3f(uAccent, 0.66, 1.0, 0.34);
      } else {
        gl.uniform3f(uBase, 0.12, 0.13, 0.11);
        gl.uniform3f(uAccent, 0.28, 0.54, 0.08);
      }
      gl.drawElementsInstanced(gl.TRIANGLES, CUBE_INDICES.length, gl.UNSIGNED_SHORT, 0, instanceCount);
      gl.bindVertexArray(null);
    };

    const start = () => {
      if (running || !shouldAnimate(pageVisible, inViewport)) return;
      running = true;
      raf = requestAnimationFrame(draw);
    };

    const stop = () => {
      if (!running) return;
      running = false;
      cancelAnimationFrame(raf);
    };

    const sync = () => {
      if (shouldAnimate(pageVisible, inViewport)) start();
      else stop();
    };

    resize();
    loadLogo();
    const disconnectViewport = observeElementVisibility(
      canvas,
      (visible) => {
        inViewport = visible;
        sync();
      },
      { rootMargin: "420px 0px" },
    );
    const disconnectDocument = observeDocumentVisibility((visible) => {
      pageVisible = visible;
      sync();
    });
    const themeObserver = new MutationObserver(loadLogo);
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    start();

    return () => {
      stop();
      disconnectViewport();
      disconnectDocument();
      themeObserver.disconnect();
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointerMove);
      gl.deleteProgram(program);
      gl.deleteVertexArray(vao);
      gl.deleteBuffer(positionBuffer);
      gl.deleteBuffer(normalBuffer);
      gl.deleteBuffer(indexBuffer);
      gl.deleteBuffer(offsetBuffer);
      gl.deleteBuffer(seedBuffer);
    };
  }, [interactive, mode]);

  return <canvas ref={canvasRef} className={className} role="img" aria-label="Arcane Labs 3D voxel logo" />;
}

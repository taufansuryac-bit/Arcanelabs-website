import { useEffect, useRef } from "react";
import type { MotionValue } from "motion/react";
import {
  isDocumentVisible,
  observeDocumentVisibility,
  observeElementVisibility,
  shouldAnimate,
} from "@/lib/animation-runtime";

const RES = 104;
const DEPTH = 7;
const GAP = 0.54;
const VOXEL_SIZE = GAP * 0.9;

type VoxelChaosLogoSceneProps = {
  mode?: "loader" | "portal";
  progress?: MotionValue<number>;
  className?: string;
  durationMs?: number;
  onComplete?: () => void;
  interactive?: boolean;
};

type VoxelData = {
  base: Float32Array;
  seed: Float32Array;
  rand: Float32Array;
  count: number;
};

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
const smooth = (value: number) => {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
};

function seeded(value: number) {
  const n = Math.sin(value * 127.1 + 311.7) * 43758.5453;
  return n - Math.floor(n);
}

function compileShader(gl: WebGL2RenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("Unable to create voxel shader");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`Voxel shader compile failed: ${log ?? "unknown"}`);
  }
  return shader;
}

function createProgram(gl: WebGL2RenderingContext, vertex: string, fragment: string) {
  const program = gl.createProgram();
  if (!program) throw new Error("Unable to create voxel program");
  const vs = compileShader(gl, gl.VERTEX_SHADER, vertex);
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, fragment);
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error(`Voxel program link failed: ${log ?? "unknown"}`);
  }
  return program;
}

const VERTEX_SHADER = `#version 300 es
precision highp float;
layout(location=0) in vec3 aPosition;
layout(location=1) in vec3 aNormal;
layout(location=2) in vec3 iBase;
layout(location=3) in vec3 iSeed;
layout(location=4) in float iRand;

uniform float uTime;
uniform float uChaos;
uniform float uScale;
uniform float uAspect;
uniform float uOpacity;
uniform float uPointerInfluence;
uniform vec2 uPointer;

out vec3 vNormal;
out float vRand;
out float vOpacity;
out float vViewDepth;

mat3 rotX(float a){
  float c=cos(a), s=sin(a);
  return mat3(1.,0.,0., 0.,c,-s, 0.,s,c);
}
mat3 rotY(float a){
  float c=cos(a), s=sin(a);
  return mat3(c,0.,s, 0.,1.,0., -s,0.,c);
}
mat3 rotZ(float a){
  float c=cos(a), s=sin(a);
  return mat3(c,-s,0., s,c,0., 0.,0.,1.);
}

void main(){
  float d = distance(iBase.xy, uPointer);
  float influence = exp(-(d * d) / (2.0 * 6.0 * 6.0));
  float localChaos = mix(1.0, influence, uPointerInfluence);
  float c = clamp(uChaos * localChaos, 0.0, 1.35);
  float c2 = c * c;

  vec2 radial2 = iBase.xy;
  float radialLen = max(length(radial2), 0.001);
  vec3 radial = vec3(radial2 / radialLen, 0.0);
  float wobble = sin(uTime * 2.0 + iRand * 30.0);
  float push = c2 * 4.5;
  float scatter = c2 * 18.0;

  vec3 world = iBase;
  world += radial * push;
  world += iSeed * scatter;
  world.z += wobble * 2.5 * c;

  float phase = iRand * 62.8;
  world += vec3(
    sin(uTime * 0.6 + phase),
    cos(uTime * 0.5 + phase * 1.3),
    sin(uTime * 0.4 + phase * 0.7)
  ) * 0.08 * (1.0 - min(c, 1.0));

  mat3 cubeRot = rotX(iSeed.x * c * 5.5 + uTime * 0.03 * c)
              * rotY(iSeed.y * c * 5.5 + uTime * 0.04 * c)
              * rotZ(iSeed.z * c * 5.5 + uTime * 0.12 * c);
  vec3 local = cubeRot * (aPosition * ${VOXEL_SIZE.toFixed(4)} * (1.0 - min(c, 1.0) * 0.22));
  world += local;

  float idleYaw = sin(uTime * 0.32) * 0.055 * (1.0 - min(c, 1.0) * 0.35);
  float idlePitch = cos(uTime * 0.27) * 0.032 * (1.0 - min(c, 1.0) * 0.35);
  mat3 sceneRot = rotY(idleYaw) * rotX(idlePitch);
  world = sceneRot * world;

  float cameraZ = 90.0;
  float viewZ = max(24.0, cameraZ - world.z);
  float perspective = 70.0 / viewZ;
  vec2 clip = vec2(
    world.x * uScale * perspective / max(0.65, uAspect),
    world.y * uScale * perspective
  );

  gl_Position = vec4(clip, clamp((world.z + 38.0) / 130.0, -0.95, 0.95), 1.0);
  vNormal = normalize(sceneRot * cubeRot * aNormal);
  vRand = iRand;
  vOpacity = uOpacity;
  vViewDepth = perspective;
}
`;

const FRAGMENT_SHADER = `#version 300 es
precision highp float;
in vec3 vNormal;
in float vRand;
in float vOpacity;
in float vViewDepth;
uniform float uDark;
out vec4 outColor;

void main(){
  vec3 n = normalize(vNormal);
  vec3 lightDir = normalize(vec3(0.55, 0.78, 0.92));
  float diffuse = max(dot(n, lightDir), 0.0);
  float rim = pow(1.0 - max(abs(n.z), 0.0), 2.0);
  float spec = pow(max(dot(reflect(-lightDir, n), vec3(0.0,0.0,1.0)), 0.0), 18.0);

  vec3 darkBase = vec3(0.70, 0.74, 0.67);
  vec3 lightBase = vec3(0.16, 0.17, 0.15);
  vec3 base = mix(lightBase, darkBase, uDark);
  vec3 neonDark = vec3(0.58, 0.95, 0.20);
  vec3 neonLight = vec3(0.30, 0.58, 0.07);
  vec3 neon = mix(neonLight, neonDark, uDark);
  float accent = step(0.925, vRand);
  vec3 material = mix(base, neon, accent);
  float shade = 0.48 + diffuse * 0.58 + rim * 0.12 + spec * 0.36;
  material *= shade;
  material += neon * accent * spec * 0.18;
  outColor = vec4(material, vOpacity);
}
`;

const CUBE_POSITIONS = new Float32Array([
  -0.5,-0.5, 0.5,  0.5,-0.5, 0.5,  0.5, 0.5, 0.5, -0.5, 0.5, 0.5,
   0.5,-0.5,-0.5, -0.5,-0.5,-0.5, -0.5, 0.5,-0.5,  0.5, 0.5,-0.5,
  -0.5,-0.5,-0.5, -0.5,-0.5, 0.5, -0.5, 0.5, 0.5, -0.5, 0.5,-0.5,
   0.5,-0.5, 0.5,  0.5,-0.5,-0.5,  0.5, 0.5,-0.5,  0.5, 0.5, 0.5,
  -0.5, 0.5, 0.5,  0.5, 0.5, 0.5,  0.5, 0.5,-0.5, -0.5, 0.5,-0.5,
  -0.5,-0.5,-0.5,  0.5,-0.5,-0.5,  0.5,-0.5, 0.5, -0.5,-0.5, 0.5,
]);

const CUBE_NORMALS = new Float32Array([
   0,0,1, 0,0,1, 0,0,1, 0,0,1,
   0,0,-1, 0,0,-1, 0,0,-1, 0,0,-1,
  -1,0,0, -1,0,0, -1,0,0, -1,0,0,
   1,0,0, 1,0,0, 1,0,0, 1,0,0,
   0,1,0, 0,1,0, 0,1,0, 0,1,0,
   0,-1,0, 0,-1,0, 0,-1,0, 0,-1,0,
]);

const CUBE_INDICES = new Uint16Array([
  0,1,2, 0,2,3,
  4,5,6, 4,6,7,
  8,9,10, 8,10,11,
  12,13,14, 12,14,15,
  16,17,18, 16,18,19,
  20,21,22, 20,22,23,
]);

function buildVoxels(image: HTMLImageElement): VoxelData {
  const sampleWidth = RES;
  const sampleHeight = Math.max(1, Math.round(RES * (1153 / 1600)));
  const canvas = document.createElement("canvas");
  canvas.width = sampleWidth;
  canvas.height = sampleHeight;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return { base: new Float32Array(), seed: new Float32Array(), rand: new Float32Array(), count: 0 };
  ctx.clearRect(0, 0, sampleWidth, sampleHeight);
  ctx.drawImage(image, 0, 0, sampleWidth, sampleHeight);
  const data = ctx.getImageData(0, 0, sampleWidth, sampleHeight).data;
  const bases: number[] = [];
  const seeds: number[] = [];
  const randoms: number[] = [];
  let voxelIndex = 0;

  for (let y = 0; y < sampleHeight; y++) {
    for (let x = 0; x < sampleWidth; x++) {
      const i = (y * sampleWidth + x) * 4;
      const alpha = (data[i + 3] ?? 0) / 255;
      if (alpha < 0.52) continue;
      const px = (x - sampleWidth / 2 + 0.5) * GAP;
      const py = (sampleHeight / 2 - y - 0.5) * GAP;
      for (let z = 0; z < DEPTH; z++) {
        const pz = (z - (DEPTH - 1) / 2) * GAP;
        const r1 = seeded(voxelIndex * 3.17 + 1.1);
        const r2 = seeded(voxelIndex * 5.31 + 7.2);
        const r3 = seeded(voxelIndex * 9.73 + 13.4);
        bases.push(px, py, pz);
        seeds.push(r1 * 2 - 1, r2 * 2 - 1, r3 * 2 - 1);
        randoms.push(seeded(voxelIndex * 11.91 + 23.7));
        voxelIndex += 1;
      }
    }
  }

  return {
    base: new Float32Array(bases),
    seed: new Float32Array(seeds),
    rand: new Float32Array(randoms),
    count: randoms.length,
  };
}

export function VoxelChaosLogoScene({
  mode = "portal",
  progress,
  className = "",
  durationMs = 1900,
  onComplete,
  interactive = false,
}: VoxelChaosLogoSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const progressRef = useRef(0);
  const completeRef = useRef(false);

  useEffect(() => {
    if (!progress) return;
    progressRef.current = progress.get();
    return progress.on("change", (value) => {
      progressRef.current = value;
    });
  }, [progress]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl2", {
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    if (!gl) return;

    let raf = 0;
    let running = false;
    let pageVisible = isDocumentVisible();
    let inViewport = true;
    let width = 1;
    let height = 1;
    let startedAt = 0;
    let data: VoxelData | null = null;
    let pointerX = 999;
    let pointerY = 999;
    let image: HTMLImageElement | null = null;

    const program = createProgram(gl, VERTEX_SHADER, FRAGMENT_SHADER);
    const vao = gl.createVertexArray();
    const positionBuffer = gl.createBuffer();
    const normalBuffer = gl.createBuffer();
    const indexBuffer = gl.createBuffer();
    const baseBuffer = gl.createBuffer();
    const seedBuffer = gl.createBuffer();
    const randBuffer = gl.createBuffer();
    if (!vao || !positionBuffer || !normalBuffer || !indexBuffer || !baseBuffer || !seedBuffer || !randBuffer) {
      return;
    }

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

    gl.bindBuffer(gl.ARRAY_BUFFER, baseBuffer);
    gl.enableVertexAttribArray(2);
    gl.vertexAttribPointer(2, 3, gl.FLOAT, false, 0, 0);
    gl.vertexAttribDivisor(2, 1);

    gl.bindBuffer(gl.ARRAY_BUFFER, seedBuffer);
    gl.enableVertexAttribArray(3);
    gl.vertexAttribPointer(3, 3, gl.FLOAT, false, 0, 0);
    gl.vertexAttribDivisor(3, 1);

    gl.bindBuffer(gl.ARRAY_BUFFER, randBuffer);
    gl.enableVertexAttribArray(4);
    gl.vertexAttribPointer(4, 1, gl.FLOAT, false, 0, 0);
    gl.vertexAttribDivisor(4, 1);

    gl.bindVertexArray(null);

    const uniforms = {
      time: gl.getUniformLocation(program, "uTime"),
      chaos: gl.getUniformLocation(program, "uChaos"),
      scale: gl.getUniformLocation(program, "uScale"),
      aspect: gl.getUniformLocation(program, "uAspect"),
      opacity: gl.getUniformLocation(program, "uOpacity"),
      pointerInfluence: gl.getUniformLocation(program, "uPointerInfluence"),
      pointer: gl.getUniformLocation(program, "uPointer"),
      dark: gl.getUniformLocation(program, "uDark"),
    };

    const uploadInstances = (next: VoxelData) => {
      data = next;
      gl.bindBuffer(gl.ARRAY_BUFFER, baseBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, next.base, gl.STATIC_DRAW);
      gl.bindBuffer(gl.ARRAY_BUFFER, seedBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, next.seed, gl.STATIC_DRAW);
      gl.bindBuffer(gl.ARRAY_BUFFER, randBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, next.rand, gl.STATIC_DRAW);
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      gl.viewport(0, 0, canvas.width, canvas.height);
    };

    const getState = (timeMs: number) => {
      if (mode === "loader") {
        if (!startedAt) startedAt = timeMs;
        const p = clamp01((timeMs - startedAt) / durationMs);
        const settle = smooth(p / 0.68);
        const chaos = (1 - settle) * 1.26;
        const exit = smooth((p - 0.84) / 0.16);
        const opacity = 1 - exit;
        const scale = 0.0505 * (0.92 + settle * 0.08 + exit * 0.08);
        if (p >= 1 && !completeRef.current) {
          completeRef.current = true;
          queueMicrotask(() => onComplete?.());
        }
        return { chaos, opacity, scale };
      }

      const p = clamp01(progressRef.current);
      const fractureIn = smooth((p - 0.14) / 0.18);
      const fractureOut = smooth((p - 0.76) / 0.18);
      const chaos = Math.max(0, fractureIn * (1 - fractureOut)) * 1.08;
      const middleFade = smooth((p - 0.28) / 0.16) * (1 - smooth((p - 0.78) / 0.12));
      const opacity = 1 - middleFade * 0.96;
      const scale = 0.055 + smooth(p / 0.26) * 0.004;
      return { chaos, opacity, scale };
    };

    const draw = (timeMs: number) => {
      if (!running) return;
      raf = requestAnimationFrame(draw);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      if (!data || data.count === 0) return;

      const state = getState(timeMs);
      const dark = document.documentElement.classList.contains("dark");
      gl.enable(gl.DEPTH_TEST);
      gl.enable(gl.CULL_FACE);
      gl.cullFace(gl.BACK);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.useProgram(program);
      gl.uniform1f(uniforms.time, timeMs * 0.001);
      gl.uniform1f(uniforms.chaos, state.chaos);
      gl.uniform1f(uniforms.scale, state.scale);
      gl.uniform1f(uniforms.aspect, width / height);
      gl.uniform1f(uniforms.opacity, state.opacity);
      gl.uniform1f(uniforms.pointerInfluence, interactive ? 1 : 0);
      gl.uniform2f(uniforms.pointer, pointerX, pointerY);
      gl.uniform1f(uniforms.dark, dark ? 1 : 0);
      gl.bindVertexArray(vao);
      gl.drawElementsInstanced(gl.TRIANGLES, CUBE_INDICES.length, gl.UNSIGNED_SHORT, 0, data.count);
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

    const onPointerMove = (event: PointerEvent) => {
      if (!interactive) return;
      const rect = canvas.getBoundingClientRect();
      const nx = (event.clientX - rect.left) / Math.max(1, rect.width);
      const ny = (event.clientY - rect.top) / Math.max(1, rect.height);
      pointerX = (nx - 0.5) * RES * GAP;
      pointerY = (0.5 - ny) * RES * GAP * (1153 / 1600);
    };

    resize();
    const disconnectViewport = observeElementVisibility(
      canvas,
      (visible) => {
        inViewport = visible;
        sync();
      },
      { rootMargin: mode === "portal" ? "420px 0px" : "0px" },
    );
    const disconnectDocument = observeDocumentVisibility((visible) => {
      pageVisible = visible;
      sync();
    });

    const source = new Image();
    source.decoding = "async";
    source.src = "/arcane-logo-black.svg";
    source.onload = () => uploadInstances(buildVoxels(source));
    image = source;

    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    start();

    return () => {
      stop();
      disconnectViewport();
      disconnectDocument();
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointerMove);
      image = null;
      gl.deleteBuffer(positionBuffer);
      gl.deleteBuffer(normalBuffer);
      gl.deleteBuffer(indexBuffer);
      gl.deleteBuffer(baseBuffer);
      gl.deleteBuffer(seedBuffer);
      gl.deleteBuffer(randBuffer);
      gl.deleteVertexArray(vao);
      gl.deleteProgram(program);
    };
  }, [durationMs, interactive, mode, onComplete]);

  return <canvas ref={canvasRef} className={className} role="img" aria-label="Arcane Labs voxel logo" />;
}

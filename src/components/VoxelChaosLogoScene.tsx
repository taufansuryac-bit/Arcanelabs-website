import { OrbitControls } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import type { MotionValue } from "motion/react";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import {
  isDocumentVisible,
  observeDocumentVisibility,
  observeElementVisibility,
  shouldAnimate,
} from "@/lib/animation-runtime";
import {
  VOXEL_DEPTH,
  VOXEL_GAP,
  VOXEL_RESOLUTION,
  VOXEL_SIZE,
  getPortalVisualState,
  getResponsiveCameraDistance,
} from "@/lib/voxel-scene-model";

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

type SceneState = {
  globalChaos: number;
  opacity: number;
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

function useVoxels(url: string) {
  const [voxels, setVoxels] = useState<VoxelData | null>(null);

  useEffect(() => {
    let cancelled = false;
    const image = new Image();
    image.decoding = "async";
    image.src = url;
    image.onload = () => {
      const width = VOXEL_RESOLUTION;
      const height = Math.max(1, Math.round(VOXEL_RESOLUTION * (1153 / 1600)));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context) return;

      context.clearRect(0, 0, width, height);
      context.drawImage(image, 0, 0, width, height);
      const pixels = context.getImageData(0, 0, width, height).data;
      const bases: number[] = [];
      const seeds: number[] = [];
      const randoms: number[] = [];
      let voxelIndex = 0;

      for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
          const pixelIndex = (y * width + x) * 4;
          const alpha = (pixels[pixelIndex + 3] ?? 0) / 255;
          if (alpha < 0.52) continue;

          const px = (x - width / 2 + 0.5) * VOXEL_GAP;
          const py = (height / 2 - y - 0.5) * VOXEL_GAP;
          for (let z = 0; z < VOXEL_DEPTH; z += 1) {
            const pz = (z - (VOXEL_DEPTH - 1) / 2) * VOXEL_GAP;
            bases.push(px, py, pz);
            seeds.push(
              seeded(voxelIndex * 3.17 + 1.1) * 2 - 1,
              seeded(voxelIndex * 5.31 + 7.2) * 2 - 1,
              seeded(voxelIndex * 9.73 + 13.4) * 2 - 1,
            );
            randoms.push(seeded(voxelIndex * 11.91 + 23.7));
            voxelIndex += 1;
          }
        }
      }

      if (!cancelled) {
        setVoxels({
          base: new Float32Array(bases),
          seed: new Float32Array(seeds),
          rand: new Float32Array(randoms),
          count: randoms.length,
        });
      }
    };

    return () => {
      cancelled = true;
      image.onload = null;
    };
  }, [url]);

  return voxels;
}

function SceneController({
  ready,
  mode,
  durationMs,
  progressRef,
  sceneState,
  completeRef,
  onCompleteRef,
}: {
  ready: boolean;
  mode: "loader" | "portal";
  durationMs: number;
  progressRef: React.MutableRefObject<number>;
  sceneState: React.MutableRefObject<SceneState>;
  completeRef: React.MutableRefObject<boolean>;
  onCompleteRef: React.MutableRefObject<(() => void) | undefined>;
}) {
  const elapsedMs = useRef(0);

  useFrame((_, delta) => {
    if (!ready) return;

    if (mode === "loader") {
      elapsedMs.current += Math.min(delta, 0.05) * 1000;
      const p = clamp01(elapsedMs.current / durationMs);
      const settle = smooth(p / 0.42);
      const exit = smooth((p - 0.86) / 0.14);
      sceneState.current.globalChaos = (1 - settle) * 1.28;
      sceneState.current.opacity = 1 - exit;

      if (p >= 1 && !completeRef.current) {
        completeRef.current = true;
        queueMicrotask(() => onCompleteRef.current?.());
      }
      return;
    }

    const p = clamp01(progressRef.current);
    const visual = getPortalVisualState(p);
    const middleFade = smooth((p - 0.38) / 0.18) * (1 - smooth((p - 0.8) / 0.1));
    sceneState.current.globalChaos = visual.chaos;
    sceneState.current.opacity = 1 - middleFade * 0.96;
  });

  return null;
}

const VERTEX_SHADER = `
precision highp float;
attribute vec3 aSeed;
attribute float aRand;
uniform float uTime;
uniform float uGlobalChaos;
uniform float uLocalChaos;
uniform vec2 uPointer;
varying vec3 vNormal;
varying float vRand;

mat3 rotX(float a) {
  float c = cos(a), s = sin(a);
  return mat3(1., 0., 0., 0., c, -s, 0., s, c);
}
mat3 rotY(float a) {
  float c = cos(a), s = sin(a);
  return mat3(c, 0., s, 0., 1., 0., -s, 0., c);
}
mat3 rotZ(float a) {
  float c = cos(a), s = sin(a);
  return mat3(c, -s, 0., s, c, 0., 0., 0., 1.);
}

void main() {
  vec3 base = instanceMatrix[3].xyz;
  vec2 pointerDelta = base.xy - uPointer;
  float distanceToPointer = length(pointerDelta);
  float influence = exp(-(distanceToPointer * distanceToPointer) / (2.0 * 6.0 * 6.0));
  float localChaos = influence * uLocalChaos;
  float chaos = clamp(max(uGlobalChaos, localChaos), 0.0, 1.35);
  float chaosSquared = chaos * chaos;
  vec2 radial = distanceToPointer > 0.001 ? pointerDelta / distanceToPointer : vec2(0.0);
  float push = chaosSquared * 4.5;
  float scatterDistance = mix(2.0, 18.0, step(0.01, uGlobalChaos));
  float scatter = chaosSquared * scatterDistance;
  float wobble = sin(uTime * 2.0 + aRand * 30.0);

  vec3 world = base;
  world.xy += radial * push;
  world += aSeed * scatter;
  world.z += aSeed.z * scatter * 0.6 + wobble * 2.5 * chaos;

  mat3 cubeRotation = rotX(aSeed.x * (chaos * 6.0 + uTime * 0.08 * chaos))
                    * rotY(aSeed.y * (chaos * 6.0 + uTime * 0.08 * chaos))
                    * rotZ(aSeed.z * chaos * 6.0 + uTime * 0.4 * chaos);
  vec3 localPosition = cubeRotation * (position * (1.0 - min(chaos, 1.0) * 0.3));
  vec3 transformed = world + localPosition;

  vNormal = normalize(normalMatrix * cubeRotation * normal);
  vRand = aRand;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
}
`;

const FRAGMENT_SHADER = `
precision highp float;
uniform float uDark;
uniform float uOpacity;
varying vec3 vNormal;
varying float vRand;

void main() {
  vec3 normalDirection = normalize(vNormal);
  vec3 lightDirection = normalize(vec3(0.55, 0.78, 0.92));
  float diffuse = max(dot(normalDirection, lightDirection), 0.0);
  float rim = pow(1.0 - max(abs(normalDirection.z), 0.0), 2.0);
  float specular = pow(max(dot(reflect(-lightDirection, normalDirection), vec3(0.0, 0.0, 1.0)), 0.0), 18.0);
  vec3 base = mix(vec3(0.055, 0.062, 0.052), vec3(0.90, 0.92, 0.89), uDark);
  vec3 accent = mix(vec3(0.29, 0.52, 0.08), vec3(0.62, 0.93, 0.24), uDark);
  float isAccent = step(0.935, vRand);
  vec3 materialColor = mix(base, accent, isAccent);
  float shade = 0.58 + diffuse * 0.48 + rim * 0.1 + specular * 0.2;
  gl_FragColor = vec4(materialColor * shade, uOpacity);
}
`;

function ResponsiveCamera() {
  const { camera, size } = useThree();

  useLayoutEffect(() => {
    if (!(camera instanceof THREE.PerspectiveCamera)) return;
    const distance = getResponsiveCameraDistance(size.width, size.height, camera.fov, 1.18);
    const direction =
      camera.position.lengthSq() > 0
        ? camera.position.clone().normalize()
        : new THREE.Vector3(0, 0, 1);
    camera.position.copy(direction.multiplyScalar(distance));
    camera.far = Math.max(600, distance * 4);
    camera.updateProjectionMatrix();
  }, [camera, size.height, size.width]);

  return null;
}

function VoxelShaderMesh({
  voxels,
  hoverChaos,
  hovering,
  sceneState,
  dark,
}: {
  voxels: VoxelData;
  hoverChaos: React.MutableRefObject<number>;
  hovering: React.MutableRefObject<boolean>;
  sceneState: React.MutableRefObject<SceneState>;
  dark: boolean;
}) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const material = useRef<THREE.ShaderMaterial>(null);
  const pointer = useRef(new THREE.Vector2(999, 999));
  const pointerHit = useMemo(() => new THREE.Vector3(), []);
  const ray = useMemo(() => new THREE.Raycaster(), []);
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), []);
  const elapsed = useRef(0);
  const { camera } = useThree();

  const geometry = useMemo(() => {
    const next = new THREE.BoxGeometry(VOXEL_SIZE, VOXEL_SIZE, VOXEL_SIZE);
    next.setAttribute("aSeed", new THREE.InstancedBufferAttribute(voxels.seed, 3));
    next.setAttribute("aRand", new THREE.InstancedBufferAttribute(voxels.rand, 1));
    return next;
  }, [voxels]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uGlobalChaos: { value: 0 },
      uLocalChaos: { value: 0 },
      uPointer: { value: new THREE.Vector2(999, 999) },
      uDark: { value: 0 },
      uOpacity: { value: 1 },
    }),
    [],
  );

  useEffect(() => {
    const current = mesh.current;
    if (!current) return;
    const matrix = new THREE.Matrix4();
    for (let index = 0; index < voxels.count; index += 1) {
      const offset = index * 3;
      matrix.makeTranslation(
        voxels.base[offset] ?? 0,
        voxels.base[offset + 1] ?? 0,
        voxels.base[offset + 2] ?? 0,
      );
      current.setMatrixAt(index, matrix);
    }
    current.instanceMatrix.setUsage(THREE.StaticDrawUsage);
    current.instanceMatrix.needsUpdate = true;
  }, [voxels]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame((state, delta) => {
    const currentMaterial = material.current;
    if (!currentMaterial) return;

    elapsed.current += Math.min(delta, 0.05);
    const damping = 1 - Math.exp(-3 * delta);
    hoverChaos.current += ((hovering.current ? 1 : 0) - hoverChaos.current) * damping;

    if (hovering.current || hoverChaos.current > 0.001) {
      ray.setFromCamera(state.pointer, camera);
      if (ray.ray.intersectPlane(plane, pointerHit))
        pointer.current.set(pointerHit.x, pointerHit.y);
    } else {
      pointer.current.set(999, 999);
    }

    currentMaterial.uniforms["uTime"]!.value = elapsed.current;
    currentMaterial.uniforms["uGlobalChaos"]!.value = sceneState.current.globalChaos;
    currentMaterial.uniforms["uLocalChaos"]!.value = hoverChaos.current;
    currentMaterial.uniforms["uPointer"]!.value.copy(pointer.current);
    currentMaterial.uniforms["uDark"]!.value = dark ? 1 : 0;
    currentMaterial.uniforms["uOpacity"]!.value = sceneState.current.opacity;
  });

  return (
    <instancedMesh ref={mesh} args={[geometry, undefined, voxels.count]} frustumCulled={false}>
      <shaderMaterial
        ref={material}
        uniforms={uniforms}
        vertexShader={VERTEX_SHADER}
        fragmentShader={FRAGMENT_SHADER}
        transparent
        depthTest
        depthWrite
      />
    </instancedMesh>
  );
}

function ResponsiveControls({
  mode,
  interactive,
}: {
  mode: "loader" | "portal";
  interactive: boolean;
}) {
  const { size } = useThree();
  const fittedDistance = getResponsiveCameraDistance(size.width, size.height, 40, 1.18);

  return (
    <OrbitControls
      enablePan={false}
      enableRotate={interactive}
      enableZoom={interactive && mode === "loader"}
      autoRotate={mode === "loader"}
      autoRotateSpeed={mode === "loader" ? 1.1 : 0.65}
      enableDamping
      dampingFactor={0.065}
      minDistance={fittedDistance * 0.78}
      maxDistance={fittedDistance * 2.4}
      minPolarAngle={0}
      maxPolarAngle={Math.PI}
    />
  );
}

export function VoxelChaosLogoScene({
  mode = "portal",
  progress,
  className = "",
  durationMs = 1900,
  onComplete,
  interactive = true,
}: VoxelChaosLogoSceneProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const progressRef = useRef(0);
  const completeRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  const hoverChaos = useRef(0);
  const hovering = useRef(false);
  const sceneState = useRef<SceneState>({ globalChaos: mode === "loader" ? 1.28 : 0, opacity: 1 });
  const [active, setActive] = useState(true);
  const [dark, setDark] = useState(false);
  const voxels = useVoxels("/arcane-logo-black.svg");

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (!progress) return;
    progressRef.current = progress.get();
    return progress.on("change", (value) => {
      progressRef.current = value;
    });
  }, [progress]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let pageVisible = isDocumentVisible();
    let inViewport = true;
    const sync = () => setActive(shouldAnimate(pageVisible, inViewport));
    const disconnectViewport = observeElementVisibility(
      container,
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
    return () => {
      disconnectViewport();
      disconnectDocument();
    };
  }, [mode]);

  useEffect(() => {
    const syncTheme = () => setDark(document.documentElement.classList.contains("dark"));
    syncTheme();
    const observer = new MutationObserver(syncTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className={className}
      role="img"
      aria-label="Interactive Arcane Labs 3D voxel logo. Drag to rotate and move the cursor for chaos."
      style={{ touchAction: mode === "loader" ? "none" : "pan-y" }}
      onPointerEnter={() => {
        if (interactive) hovering.current = true;
      }}
      onPointerLeave={() => {
        hovering.current = false;
      }}
      onPointerDown={() => {
        if (interactive) hoverChaos.current = Math.min(hoverChaos.current, 0.15);
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 80], fov: 40, near: 0.1, far: 600 }}
        dpr={[1, 1.5]}
        frameloop={active ? "always" : "never"}
        gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
      >
        <ResponsiveCamera />
        <SceneController
          ready={Boolean(voxels)}
          mode={mode}
          durationMs={durationMs}
          progressRef={progressRef}
          sceneState={sceneState}
          completeRef={completeRef}
          onCompleteRef={onCompleteRef}
        />
        {voxels && (
          <VoxelShaderMesh
            voxels={voxels}
            hoverChaos={hoverChaos}
            hovering={hovering}
            sceneState={sceneState}
            dark={dark}
          />
        )}
        <ResponsiveControls mode={mode} interactive={interactive} />
      </Canvas>
    </div>
  );
}

import { OrbitControls } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import type { MotionValue } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
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
} from "@/lib/voxel-scene-model";

type VoxelChaosLogoSceneProps = {
  mode?: "loader" | "portal";
  progress?: MotionValue<number>;
  className?: string;
  durationMs?: number;
  onComplete?: () => void;
  /** Called when WebGL context cannot be acquired, so parent can show a CSS fallback. */
  onError?: () => void;
  interactive?: boolean;
};

type Voxel = {
  base: THREE.Vector3;
  seed: THREE.Vector3;
  rand: number;
  size: number;
};

type VoxelData = {
  voxels: Voxel[];
  measuredWidth: number;
  measuredHeight: number;
  measuredRadius: number;
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

function recenterVoxelGeometry(voxels: Voxel[]): VoxelData {
  const boundsMin = new THREE.Vector3(Infinity, Infinity, Infinity);
  const boundsMax = new THREE.Vector3(-Infinity, -Infinity, -Infinity);

  for (const voxel of voxels) {
    boundsMin.min(voxel.base);
    boundsMax.max(voxel.base);
  }

  const center = boundsMin.clone().add(boundsMax).multiplyScalar(0.5);
  let measuredRadius = 0;
  for (const voxel of voxels) {
    voxel.base.sub(center);
    measuredRadius = Math.max(measuredRadius, voxel.base.length());
  }

  return {
    voxels,
    measuredWidth: boundsMax.x - boundsMin.x + VOXEL_SIZE,
    measuredHeight: boundsMax.y - boundsMin.y + VOXEL_SIZE,
    measuredRadius: measuredRadius + VOXEL_SIZE * 0.5,
  };
}

function useVoxels(url: string) {
  const [data, setData] = useState<VoxelData | null>(null);

  useEffect(() => {
    let cancelled = false;
    const image = new Image();
    image.decoding = "async";
    image.src = url;
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = VOXEL_RESOLUTION;
      canvas.height = VOXEL_RESOLUTION;
      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context) return;

      context.clearRect(0, 0, VOXEL_RESOLUTION, VOXEL_RESOLUTION);
      const sourceAspect = image.naturalWidth / Math.max(1, image.naturalHeight);
      let drawWidth = VOXEL_RESOLUTION;
      let drawHeight = VOXEL_RESOLUTION;
      if (sourceAspect >= 1) drawHeight = VOXEL_RESOLUTION / sourceAspect;
      else drawWidth = VOXEL_RESOLUTION * sourceAspect;
      const drawOffsetX = (VOXEL_RESOLUTION - drawWidth) / 2;
      const drawOffsetY = (VOXEL_RESOLUTION - drawHeight) / 2;
      context.drawImage(image, drawOffsetX, drawOffsetY, drawWidth, drawHeight);

      const pixels = context.getImageData(0, 0, VOXEL_RESOLUTION, VOXEL_RESOLUTION).data;
      const voxels: Voxel[] = [];
      let voxelIndex = 0;

      for (let y = 0; y < VOXEL_RESOLUTION; y += 1) {
        for (let x = 0; x < VOXEL_RESOLUTION; x += 1) {
          const pixelIndex = (y * VOXEL_RESOLUTION + x) * 4;
          const alpha = (pixels[pixelIndex + 3] ?? 0) / 255;
          const luminance =
            (0.299 * (pixels[pixelIndex] ?? 0) +
              0.587 * (pixels[pixelIndex + 1] ?? 0) +
              0.114 * (pixels[pixelIndex + 2] ?? 0)) /
            255;
          const ink = alpha * (1 - luminance);
          if (ink < 0.5) continue;

          const px = (x - VOXEL_RESOLUTION / 2 + 0.5) * VOXEL_GAP;
          const py = (VOXEL_RESOLUTION / 2 - y - 0.5) * VOXEL_GAP;
          for (let z = 0; z < VOXEL_DEPTH; z += 1) {
            const pz = (z - (VOXEL_DEPTH - 1) / 2) * VOXEL_GAP;
            voxels.push({
              base: new THREE.Vector3(px, py, pz),
              seed: new THREE.Vector3(
                seeded(voxelIndex * 3.17 + 1.1) * 2 - 1,
                seeded(voxelIndex * 5.31 + 7.2) * 2 - 1,
                seeded(voxelIndex * 9.73 + 13.4) * 2 - 1,
              ),
              rand: seeded(voxelIndex * 11.91 + 23.7),
              size: VOXEL_SIZE,
            });
            voxelIndex += 1;
          }
        }
      }

      if (!cancelled && voxels.length > 0) setData(recenterVoxelGeometry(voxels));
    };

    return () => {
      cancelled = true;
      image.onload = null;
    };
  }, [url]);

  return data;
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
      const settle = smooth(p / 0.5);
      const exit = smooth((p - 0.88) / 0.12);
      sceneState.current.globalChaos = (1 - settle) * 1.08;
      sceneState.current.opacity = 1 - exit;
      if (p >= 1 && !completeRef.current) {
        completeRef.current = true;
        queueMicrotask(() => onCompleteRef.current?.());
      }
      return;
    }

    const visual = getPortalVisualState(clamp01(progressRef.current));
    sceneState.current.globalChaos = visual.chaos;
    sceneState.current.opacity = 1;
  });

  return null;
}

function VoxelMesh({
  data,
  hoverChaos,
  hovering,
  sceneState,
}: {
  data: VoxelData;
  hoverChaos: React.MutableRefObject<number>;
  hovering: React.MutableRefObject<boolean>;
  sceneState: React.MutableRefObject<SceneState>;
}) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const material = useRef<THREE.MeshStandardMaterial>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const pointer = useRef(new THREE.Vector3(999, 999, 0));
  const pointerHit = useMemo(() => new THREE.Vector3(), []);
  const ray = useMemo(() => new THREE.Raycaster(), []);
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), []);
  const { camera } = useThree();

  useFrame((state, delta) => {
    const current = mesh.current;
    if (!current) return;

    const damping = 1 - Math.exp(-3 * delta);
    hoverChaos.current += ((hovering.current ? 1 : 0) - hoverChaos.current) * damping;
    if (hovering.current || hoverChaos.current > 0.001) {
      ray.setFromCamera(state.pointer, camera);
      if (ray.ray.intersectPlane(plane, pointerHit)) pointer.current.copy(pointerHit);
    } else {
      pointer.current.set(999, 999, 0);
    }

    const globalChaos = sceneState.current.globalChaos;
    const time = state.clock.elapsedTime;
    for (let index = 0; index < data.voxels.length; index += 1) {
      const voxel = data.voxels[index];
      if (!voxel) continue;

      const dx = voxel.base.x - pointer.current.x;
      const dy = voxel.base.y - pointer.current.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const influence = Math.exp(-(distance * distance) / (2 * 6 * 6));
      const localChaos = influence * hoverChaos.current;
      const chaos = Math.max(globalChaos, localChaos);
      const push = localChaos * localChaos * 4.5;
      const localScatter = localChaos * localChaos * 2;
      const globalScatter = globalChaos * globalChaos * 15;
      const wobble = Math.sin(time * 2 + voxel.rand * 30);

      dummy.position.set(
        voxel.base.x +
          (dx / (distance || 1)) * push +
          voxel.seed.x * (localScatter + globalScatter),
        voxel.base.y +
          (dy / (distance || 1)) * push +
          voxel.seed.y * (localScatter + globalScatter),
        voxel.base.z +
          voxel.seed.z * (localScatter * 1.6 + globalScatter * 0.8) +
          wobble * 2.5 * chaos,
      );
      dummy.rotation.set(
        voxel.seed.x * (chaos * 6 + time * 0.08 * chaos),
        voxel.seed.y * (chaos * 6 + time * 0.08 * chaos),
        voxel.seed.z * chaos * 6 + time * 0.4 * chaos,
      );
      dummy.scale.setScalar(voxel.size * (1 - Math.min(chaos, 1) * 0.35));
      dummy.updateMatrix();
      current.setMatrixAt(index, dummy.matrix);
    }

    current.instanceMatrix.needsUpdate = true;
    if (material.current) material.current.opacity = sceneState.current.opacity;
  });

  return (
    <instancedMesh
      ref={mesh}
      args={[undefined, undefined, data.voxels.length]}
      frustumCulled={false}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial
        ref={material}
        color="#f4f4f5"
        metalness={0.35}
        roughness={0.25}
        emissive="#9aa0ff"
        emissiveIntensity={0.08}
        transparent
      />
    </instancedMesh>
  );
}

function ResponsiveCamera({ data }: { data: VoxelData }) {
  const { camera, size } = useThree();

  useEffect(() => {
    if (!(camera instanceof THREE.PerspectiveCamera)) return;
    const aspect = Math.max(0.1, size.width / Math.max(1, size.height));
    const verticalFov = THREE.MathUtils.degToRad(camera.fov);
    const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * aspect);
    const verticalDistance = data.measuredHeight / (2 * Math.tan(verticalFov / 2));
    const horizontalDistance = data.measuredWidth / (2 * Math.tan(horizontalFov / 2));
    const radiusDistance = data.measuredRadius / Math.sin(Math.min(verticalFov, horizontalFov) / 2);
    const distance = Math.max(verticalDistance, horizontalDistance, radiusDistance) * 1.08;
    camera.position.set(0, 0, distance);
    camera.near = Math.max(0.1, distance / 200);
    camera.far = Math.max(600, distance * 4);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }, [camera, data, size.height, size.width]);

  return null;
}

function ResponsiveControls({
  mode,
  interactive,
  measuredRadius,
}: {
  mode: "loader" | "portal";
  interactive: boolean;
  measuredRadius: number;
}) {
  return (
    <OrbitControls
      enablePan={false}
      enableRotate={interactive}
      enableZoom={interactive && mode === "loader"}
      autoRotate
      autoRotateSpeed={mode === "loader" ? 0.8 : 0.5}
      enableDamping
      dampingFactor={0.065}
      minDistance={Math.max(24, measuredRadius * 1.35)}
      maxDistance={Math.max(160, measuredRadius * 5)}
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
  onError,
  interactive = true,
}: VoxelChaosLogoSceneProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const progressRef = useRef(0);
  const completeRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  const onErrorRef = useRef(onError);
  const hoverChaos = useRef(0);
  const hovering = useRef(false);
  const sceneState = useRef<SceneState>({ globalChaos: mode === "loader" ? 1.08 : 0, opacity: 1 });
  const [active, setActive] = useState(true);
  const data = useVoxels("/arcane-logo-black.svg");

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

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

  return (
    <div
      ref={containerRef}
      className={className}
      role="img"
      aria-label="Interactive Arcane Labs 3D voxel logo"
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
        camera={{ position: [0, 0, 90], fov: 45, near: 0.1, far: 600 }}
        dpr={[1, 1.5]}
        frameloop={active ? "always" : "never"}
        gl={{ alpha: true, antialias: false, powerPreference: "high-performance" }}
        onCreated={({ gl }) => {
          gl.domElement.addEventListener("webglcontextlost", () => onErrorRef.current?.(), {
            once: true,
          });
        }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[30, 40, 50]} intensity={2.2} />
        <directionalLight position={[-40, -20, -30]} intensity={0.8} color="#6b7cff" />
        <SceneController
          ready={Boolean(data)}
          mode={mode}
          durationMs={durationMs}
          progressRef={progressRef}
          sceneState={sceneState}
          completeRef={completeRef}
          onCompleteRef={onCompleteRef}
        />
        {data && (
          <>
            <ResponsiveCamera data={data} />
            <VoxelMesh
              data={data}
              hoverChaos={hoverChaos}
              hovering={hovering}
              sceneState={sceneState}
            />
            <ResponsiveControls
              mode={mode}
              interactive={interactive}
              measuredRadius={data.measuredRadius}
            />
          </>
        )}
      </Canvas>
    </div>
  );
}

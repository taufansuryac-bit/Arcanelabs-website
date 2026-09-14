import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { VOXEL_DEPTH, VOXEL_GAP, VOXEL_RESOLUTION, VOXEL_SIZE } from "@/lib/voxel-scene-model";

type MagneticLoaderSceneProps = {
  durationMs?: number;
  className?: string;
  onComplete?: () => void;
  onError?: () => void;
};

type Voxel = {
  base: THREE.Vector3;
  seed: THREE.Vector3;
  rand: number;
  size: number;
  phase: number;
};

type VoxelData = {
  voxels: Voxel[];
  measuredWidth: number;
  measuredHeight: number;
  measuredRadius: number;
};

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
const smoother = (value: number) => {
  const t = clamp01(value);
  return t * t * t * (t * (t * 6 - 15) + 10);
};

function seeded(value: number) {
  const n = Math.sin(value * 127.1 + 311.7) * 43758.5453;
  return n - Math.floor(n);
}

function recenterVoxelGeometry(voxels: Voxel[]): VoxelData {
  const min = new THREE.Vector3(Infinity, Infinity, Infinity);
  const max = new THREE.Vector3(-Infinity, -Infinity, -Infinity);

  for (const voxel of voxels) {
    min.min(voxel.base);
    max.max(voxel.base);
  }

  const center = min.clone().add(max).multiplyScalar(0.5);
  let measuredRadius = 0;
  for (const voxel of voxels) {
    voxel.base.sub(center);
    measuredRadius = Math.max(measuredRadius, voxel.base.length());
  }

  return {
    voxels,
    measuredWidth: max.x - min.x + VOXEL_SIZE,
    measuredHeight: max.y - min.y + VOXEL_SIZE,
    measuredRadius: measuredRadius + VOXEL_SIZE * 0.5,
  };
}

function useLogoVoxels(url: string, onErrorRef: React.MutableRefObject<(() => void) | undefined>) {
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
      if (!context) {
        onErrorRef.current?.();
        return;
      }

      context.clearRect(0, 0, VOXEL_RESOLUTION, VOXEL_RESOLUTION);
      const sourceAspect = image.naturalWidth / Math.max(1, image.naturalHeight);
      let drawWidth = VOXEL_RESOLUTION;
      let drawHeight = VOXEL_RESOLUTION;
      if (sourceAspect >= 1) drawHeight = VOXEL_RESOLUTION / sourceAspect;
      else drawWidth = VOXEL_RESOLUTION * sourceAspect;
      const offsetX = (VOXEL_RESOLUTION - drawWidth) / 2;
      const offsetY = (VOXEL_RESOLUTION - drawHeight) / 2;
      context.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);

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
              phase: seeded(voxelIndex * 17.13 + 5.2) * Math.PI * 2,
            });
            voxelIndex += 1;
          }
        }
      }

      if (!cancelled && voxels.length > 0) setData(recenterVoxelGeometry(voxels));
    };

    image.onerror = () => {
      if (!cancelled) onErrorRef.current?.();
    };

    return () => {
      cancelled = true;
      image.onload = null;
      image.onerror = null;
    };
  }, [onErrorRef, url]);

  return data;
}

function fitCamera(
  camera: THREE.PerspectiveCamera,
  width: number,
  height: number,
  data: VoxelData,
) {
  const aspect = Math.max(0.1, width / Math.max(1, height));
  const verticalFov = THREE.MathUtils.degToRad(camera.fov);
  const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * aspect);
  const verticalDistance = data.measuredHeight / (2 * Math.tan(verticalFov / 2));
  const horizontalDistance = data.measuredWidth / (2 * Math.tan(horizontalFov / 2));
  const radiusDistance = data.measuredRadius / Math.sin(Math.min(verticalFov, horizontalFov) / 2);
  return Math.max(verticalDistance, horizontalDistance, radiusDistance) * 1.1;
}

function MagneticAssembly({
  data,
  durationMs,
  hovering,
  onCompleteRef,
}: {
  data: VoxelData;
  durationMs: number;
  hovering: React.MutableRefObject<boolean>;
  onCompleteRef: React.MutableRefObject<(() => void) | undefined>;
}) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const material = useRef<THREE.MeshStandardMaterial>(null);
  const elapsedMs = useRef(0);
  const completeRef = useRef(false);
  const hoverEnergy = useRef(0);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const ray = useMemo(() => new THREE.Raycaster(), []);
  const interactionPlane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), []);
  const pointerHit = useMemo(() => new THREE.Vector3(999, 999, 0), []);
  const { camera, size } = useThree();

  useEffect(() => {
    if (!(camera instanceof THREE.PerspectiveCamera)) return;
    const distance = fitCamera(camera, size.width, size.height, data);
    camera.position.set(0, 0, distance);
    camera.near = Math.max(0.1, distance / 220);
    camera.far = Math.max(600, distance * 5);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }, [camera, data, size.height, size.width]);

  useFrame((state, delta) => {
    const current = mesh.current;
    if (!current) return;

    elapsedMs.current += Math.min(delta, 0.05) * 1000;
    const p = clamp01(elapsedMs.current / durationMs);

    const assembly = smoother(p / 0.62);
    const chaos = Math.pow(1 - assembly, 1.2);
    const snapWindow = clamp01((p - 0.5) / 0.27);
    const snapEnvelope = Math.sin(Math.PI * snapWindow);
    const magneticPulse = snapEnvelope * Math.sin(snapWindow * Math.PI * 3.0);
    const livingEnergy = smoother((p - 0.64) / 0.16);
    const impactWindow = clamp01((p - 0.57) / 0.18);
    const impactEnergy = Math.pow(Math.sin(Math.PI * impactWindow), 2);

    const hoverResponse = 1 - Math.exp(-Math.min(delta, 0.05) * 8.4);
    hoverEnergy.current += ((hovering.current ? 1 : 0) - hoverEnergy.current) * hoverResponse;

    if (hovering.current || hoverEnergy.current > 0.001) {
      ray.setFromCamera(state.pointer, camera);
      if (!ray.ray.intersectPlane(interactionPlane, pointerHit)) {
        pointerHit.set(999, 999, 0);
      }
    } else {
      pointerHit.set(999, 999, 0);
    }

    const time = state.clock.elapsedTime;
    for (let index = 0; index < data.voxels.length; index += 1) {
      const voxel = data.voxels[index];
      if (!voxel) continue;

      const dx = voxel.base.x - pointerHit.x;
      const dy = voxel.base.y - pointerHit.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const pointerInfluence =
        Math.exp(-(distance * distance) / (2 * 5.7 * 5.7)) * hoverEnergy.current * livingEnergy;
      const pointerPush = pointerInfluence * pointerInfluence * 6.8;
      const inverseDistance = 1 / Math.max(distance, 0.001);

      const scatter = chaos * chaos * (11 + voxel.rand * 8.5);
      const spiralAngle = voxel.phase + time * (0.65 + voxel.rand * 0.4);
      const spiralRadius = chaos * (1.2 + voxel.rand * 4.2);
      const spiralX = Math.cos(spiralAngle) * spiralRadius;
      const spiralY = Math.sin(spiralAngle) * spiralRadius * 0.78;

      const radialScale = 1 + magneticPulse * 0.055;
      const microOrbit = voxel.rand > 0.88 ? livingEnergy : 0;
      const microX = Math.cos(time * (0.72 + voxel.rand * 0.5) + voxel.phase) * 0.16 * microOrbit;
      const microY = Math.sin(time * (0.66 + voxel.rand * 0.45) + voxel.phase) * 0.13 * microOrbit;
      const microZ = Math.sin(time * 0.9 + voxel.phase) * 0.2 * microOrbit;

      dummy.position.set(
        voxel.base.x * radialScale +
          voxel.seed.x * scatter +
          spiralX +
          dx * inverseDistance * pointerPush +
          voxel.seed.x * pointerInfluence * 2.4 +
          microX,
        voxel.base.y * radialScale +
          voxel.seed.y * scatter +
          spiralY +
          dy * inverseDistance * pointerPush +
          voxel.seed.y * pointerInfluence * 2.4 +
          microY,
        voxel.base.z +
          voxel.seed.z * scatter * 0.75 +
          voxel.seed.z * pointerInfluence * 3.1 +
          microZ,
      );

      const rotationEnergy = chaos * 5.6 + pointerInfluence * 4.8 + microOrbit * 0.08;
      dummy.rotation.set(
        voxel.seed.x * rotationEnergy,
        voxel.seed.y * rotationEnergy,
        voxel.seed.z * rotationEnergy + magneticPulse * 0.08,
      );

      const chaosScale = 1 - chaos * 0.22;
      const impactScale = 1 + impactEnergy * 0.055;
      const pointerScale = 1 - pointerInfluence * 0.16;
      dummy.scale.setScalar(voxel.size * chaosScale * impactScale * pointerScale);
      dummy.updateMatrix();
      current.setMatrixAt(index, dummy.matrix);
    }

    current.instanceMatrix.needsUpdate = true;
    if (material.current) {
      material.current.emissiveIntensity = 0.07 + impactEnergy * 0.38 + hoverEnergy.current * 0.06;
    }

    if (p >= 1 && !completeRef.current) {
      completeRef.current = true;
      queueMicrotask(() => onCompleteRef.current?.());
    }
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
        metalness={0.3}
        roughness={0.3}
        emissive="#8f98ff"
        emissiveIntensity={0.07}
      />
    </instancedMesh>
  );
}

export function MagneticLoaderScene({
  durationMs = 3200,
  className = "",
  onComplete,
  onError,
}: MagneticLoaderSceneProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const hovering = useRef(false);
  const onCompleteRef = useRef(onComplete);
  const onErrorRef = useRef(onError);
  const data = useLogoVoxels("/arcane-logo-black.svg", onErrorRef);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  return (
    <div
      ref={containerRef}
      className={className}
      role="img"
      aria-label="Arcane Labs magnetic voxel assembly"
      style={{ touchAction: "none" }}
      onPointerEnter={() => {
        hovering.current = true;
      }}
      onPointerLeave={() => {
        hovering.current = false;
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 90], fov: 45, near: 0.1, far: 600 }}
        dpr={[1, 1.5]}
        frameloop="always"
        gl={{ alpha: true, antialias: false, powerPreference: "high-performance" }}
        onCreated={({ gl }) => {
          gl.domElement.addEventListener("webglcontextlost", () => onErrorRef.current?.(), {
            once: true,
          });
        }}
      >
        <ambientLight intensity={0.55} />
        <directionalLight position={[30, 40, 50]} intensity={2.35} />
        <directionalLight position={[-36, -18, -28]} intensity={0.75} color="#6b7cff" />
        {data && (
          <MagneticAssembly
            data={data}
            durationMs={durationMs}
            hovering={hovering}
            onCompleteRef={onCompleteRef}
          />
        )}
      </Canvas>
    </div>
  );
}

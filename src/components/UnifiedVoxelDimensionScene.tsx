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
import { VOXEL_DEPTH, VOXEL_GAP, VOXEL_RESOLUTION, VOXEL_SIZE } from "@/lib/voxel-scene-model";

type UnifiedVoxelDimensionSceneProps = {
  progress: MotionValue<number>;
  className?: string;
};

type Voxel = {
  base: THREE.Vector3;
  field: THREE.Vector3;
  seed: THREE.Vector3;
  rand: number;
  size: number;
  orbitPhase: number;
  orbitRadius: number;
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
const phase = (progress: number, start: number, end: number) => smoother((progress - start) / (end - start));

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

function buildFieldTarget(index: number) {
  const angle = seeded(index * 4.17 + 9.3) * Math.PI * 2;
  const radiusSeed = seeded(index * 7.91 + 17.4);
  const radius = 7 + Math.pow(radiusSeed, 0.72) * 62;
  const verticalCompression = 0.72 + seeded(index * 2.31 + 41.7) * 0.2;
  const z = -145 + seeded(index * 12.77 + 73.2) * 175;
  return new THREE.Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius * verticalCompression, z);
}

function useLogoVoxels(url: string) {
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
            const rand = seeded(voxelIndex * 11.91 + 23.7);
            voxels.push({
              base: new THREE.Vector3(px, py, pz),
              field: buildFieldTarget(voxelIndex),
              seed: new THREE.Vector3(
                seeded(voxelIndex * 3.17 + 1.1) * 2 - 1,
                seeded(voxelIndex * 5.31 + 7.2) * 2 - 1,
                seeded(voxelIndex * 9.73 + 13.4) * 2 - 1,
              ),
              rand,
              size: VOXEL_SIZE,
              orbitPhase: seeded(voxelIndex * 17.13 + 5.2) * Math.PI * 2,
              orbitRadius: rand < 0.03 ? 0.55 + seeded(voxelIndex * 19.7 + 2.8) * 0.9 : 0,
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

function computeFitDistance(camera: THREE.PerspectiveCamera, width: number, height: number, data: VoxelData) {
  const aspect = Math.max(0.1, width / Math.max(1, height));
  const verticalFov = THREE.MathUtils.degToRad(camera.fov);
  const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * aspect);
  const verticalDistance = data.measuredHeight / (2 * Math.tan(verticalFov / 2));
  const horizontalDistance = data.measuredWidth / (2 * Math.tan(horizontalFov / 2));
  const radiusDistance = data.measuredRadius / Math.sin(Math.min(verticalFov, horizontalFov) / 2);
  return Math.max(verticalDistance, horizontalDistance, radiusDistance) * 1.08;
}

function UnifiedScene({ data, targetProgress }: { data: VoxelData; targetProgress: React.MutableRefObject<number> }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const actualProgress = useRef(targetProgress.current);
  const { camera, size } = useThree();
  const fitDistance = useRef(90);
  const origin = useMemo(() => new THREE.Vector3(0, 0, 0), []);

  useEffect(() => {
    if (!(camera instanceof THREE.PerspectiveCamera)) return;
    fitDistance.current = computeFitDistance(camera, size.width, size.height, data);
    camera.near = Math.max(0.1, fitDistance.current / 240);
    camera.far = Math.max(700, fitDistance.current * 6);
    camera.updateProjectionMatrix();
  }, [camera, data, size.height, size.width]);

  useFrame((state, delta) => {
    const current = mesh.current;
    if (!current || !(camera instanceof THREE.PerspectiveCamera)) return;

    const response = 1 - Math.exp(-Math.min(delta, 0.05) * 4.6);
    actualProgress.current += (targetProgress.current - actualProgress.current) * response;
    const p = clamp01(actualProgress.current);

    const approach = phase(p, 0.02, 0.28);
    const fracture = phase(p, 0.2, 0.46);
    const travel = phase(p, 0.42, 0.74);
    const reassemble = phase(p, 0.74, 0.96);
    const settle = phase(p, 0.94, 1);
    const fieldAmount = fracture * (1 - reassemble);

    const fit = fitDistance.current;
    const approachZ = THREE.MathUtils.lerp(fit * 1.08, fit * 0.7, approach);
    const travelZ = THREE.MathUtils.lerp(approachZ, fit * 0.54, travel * (1 - reassemble));
    const cameraZ = THREE.MathUtils.lerp(travelZ, fit * 0.96, reassemble);
    const cameraDrift = fieldAmount * 0.7;
    camera.position.set(
      Math.sin(state.clock.elapsedTime * 0.22) * cameraDrift,
      Math.cos(state.clock.elapsedTime * 0.19) * cameraDrift * 0.55,
      cameraZ,
    );
    camera.lookAt(origin);

    const time = state.clock.elapsedTime;
    const travelDistance = travel * 125;
    for (let index = 0; index < data.voxels.length; index += 1) {
      const voxel = data.voxels[index];
      if (!voxel) continue;

      const orbit = voxel.orbitRadius * (1 - fracture);
      const orbitAngle = time * (0.32 + voxel.rand * 0.22) + voxel.orbitPhase;
      const orbitX = Math.cos(orbitAngle) * orbit;
      const orbitY = Math.sin(orbitAngle) * orbit * 0.72;
      const orbitZ = Math.sin(orbitAngle * 0.63) * orbit * 0.45;

      const swirl = travel * 0.42 + voxel.rand * 0.16;
      const cosSwirl = Math.cos(swirl);
      const sinSwirl = Math.sin(swirl);
      const fieldX = voxel.field.x * cosSwirl - voxel.field.y * sinSwirl;
      const fieldY = voxel.field.x * sinSwirl + voxel.field.y * cosSwirl;
      const fieldZ = voxel.field.z + travelDistance * (0.72 + voxel.rand * 0.5);

      const unstableX = voxel.base.x + orbitX + voxel.seed.x * fracture * 0.8;
      const unstableY = voxel.base.y + orbitY + voxel.seed.y * fracture * 0.8;
      const unstableZ = voxel.base.z + orbitZ + voxel.seed.z * fracture * 1.15;

      const dimensionalX = THREE.MathUtils.lerp(unstableX, fieldX, fieldAmount);
      const dimensionalY = THREE.MathUtils.lerp(unstableY, fieldY, fieldAmount);
      const dimensionalZ = THREE.MathUtils.lerp(unstableZ, fieldZ, fieldAmount);

      const x = THREE.MathUtils.lerp(dimensionalX, voxel.base.x, reassemble);
      const y = THREE.MathUtils.lerp(dimensionalY, voxel.base.y, reassemble);
      const z = THREE.MathUtils.lerp(dimensionalZ, voxel.base.z, reassemble);

      dummy.position.set(x, y, z);
      const spin = fieldAmount * (1.2 + voxel.rand * 3.6);
      dummy.rotation.set(
        voxel.seed.x * spin,
        voxel.seed.y * spin + travel * voxel.seed.z * 1.2,
        voxel.seed.z * spin,
      );

      const nearCamera = z > cameraZ - 2.2;
      const dimensionalScale = 0.82 + voxel.rand * 0.24;
      const scale = THREE.MathUtils.lerp(voxel.size, voxel.size * dimensionalScale, fieldAmount);
      const finalScale = THREE.MathUtils.lerp(scale, voxel.size, settle);
      dummy.scale.setScalar(nearCamera ? 0.001 : finalScale);
      dummy.updateMatrix();
      current.setMatrixAt(index, dummy.matrix);
    }

    current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, data.voxels.length]} frustumCulled={false}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial
        color="#f4f4f5"
        metalness={0.35}
        roughness={0.25}
        emissive="#9aa0ff"
        emissiveIntensity={0.08}
      />
    </instancedMesh>
  );
}

export function UnifiedVoxelDimensionScene({ progress, className = "" }: UnifiedVoxelDimensionSceneProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const targetProgress = useRef(progress.get());
  const [active, setActive] = useState(true);
  const data = useLogoVoxels("/arcane-logo-black.svg");

  useEffect(() => {
    targetProgress.current = progress.get();
    return progress.on("change", (value) => {
      targetProgress.current = value;
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
      { rootMargin: "520px 0px" },
    );
    const disconnectDocument = observeDocumentVisibility((visible) => {
      pageVisible = visible;
      sync();
    });
    return () => {
      disconnectViewport();
      disconnectDocument();
    };
  }, []);

  return (
    <div ref={containerRef} className={className} aria-label="Arcane Labs unified voxel dimension">
      <Canvas
        camera={{ position: [0, 0, 90], fov: 45, near: 0.1, far: 700 }}
        dpr={[1, 1.75]}
        frameloop={active ? "always" : "never"}
        gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[30, 40, 50]} intensity={2.2} />
        <directionalLight position={[-40, -20, -30]} intensity={0.8} color="#6b7cff" />
        {data && <UnifiedScene data={data} targetProgress={targetProgress} />}
      </Canvas>
    </div>
  );
}

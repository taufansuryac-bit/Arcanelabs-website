import { Text } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import type { MotionValue } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { hasSeenLoader } from "@/lib/utils";
import {
  isDocumentVisible,
  observeDocumentVisibility,
  observeElementVisibility,
  observeReducedMotion,
  prefersReducedMotion,
  shouldAnimate,
} from "@/lib/animation-runtime";
import { VOXEL_DEPTH, VOXEL_GAP, VOXEL_RESOLUTION, VOXEL_SIZE } from "@/lib/voxel-scene-model";
import { WebGLCrashBoundary } from "./WebGLCrashBoundary";

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

type DimensionPhrase = {
  text: string;
  kicker: string;
  start: number;
  end: number;
  depthFrom: number;
  depthTo: number;
  fontSize: number;
  maxWidth: number;
};

export const DIMENSION_PHRASES: DimensionPhrase[] = [
  {
    text: "WE BUILD WEBSITES",
    kicker: "ARCANE LABS // DIGITAL EXPERIENCES",
    start: 0.18,
    end: 0.34,
    depthFrom: -26,
    depthTo: -8,
    fontSize: 4.25,
    maxWidth: 50,
  },
  {
    text: "WE CRAFT APPS",
    kicker: "PRODUCTS // SYSTEMS // INTERFACES",
    start: 0.42,
    end: 0.58,
    depthFrom: -30,
    depthTo: -7,
    fontSize: 4.35,
    maxWidth: 48,
  },
  {
    text: "STEP INTO THE DIGITAL DIMENSION",
    kicker: "CODE // MOTION // INTERACTION",
    start: 0.66,
    end: 0.82,
    depthFrom: -36,
    depthTo: -6,
    fontSize: 3.55,
    maxWidth: 46,
  },
];

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
const smoother = (value: number) => {
  const t = clamp01(value);
  return t * t * t * (t * (t * 6 - 15) + 10);
};
const phase = (progress: number, start: number, end: number) =>
  smoother((progress - start) / (end - start));

function phraseEnvelope(progress: number, phrase: DimensionPhrase) {
  const local = clamp01((progress - phrase.start) / (phrase.end - phrase.start));
  const fadeIn = smoother(clamp01(local / 0.18));
  const fadeOut = smoother(clamp01((local - 0.72) / 0.28));
  return fadeIn * (1 - fadeOut);
}

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
  return new THREE.Vector3(
    Math.cos(angle) * radius,
    Math.sin(angle) * radius * verticalCompression,
    z,
  );
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
              orbitRadius: rand < 0.08 ? 0.6 + seeded(voxelIndex * 19.7 + 2.8) * 1.25 : 0,
            });
            voxelIndex += 1;
          }
        }
      }

      if (!cancelled && voxels.length > 0) {
        setData(recenterVoxelGeometry(voxels));
      }
    };

    return () => {
      cancelled = true;
      image.onload = null;
    };
  }, [url]);

  return data;
}

function computeFitDistance(
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
  return Math.max(verticalDistance, horizontalDistance, radiusDistance) * 1.08;
}

/** Filter devtools data-* props that break R3F's property-path parser. */
function SafeText(props: React.ComponentProps<typeof Text>) {
  const cleanProps = { ...props } as Record<string, unknown>;
  for (const key of Object.keys(cleanProps)) {
    if (key.startsWith("data-")) delete cleanProps[key];
  }
  return <Text {...(cleanProps as unknown as React.ComponentProps<typeof Text>)} />;
}

type TroikaTextMesh = THREE.Mesh & { fillOpacity?: number };

function DimensionalPhrase({
  phrase,
  sceneProgress,
  dark,
}: {
  phrase: DimensionPhrase;
  sceneProgress: React.MutableRefObject<number>;
  dark: boolean;
}) {
  const group = useRef<THREE.Group>(null);
  const mainText = useRef<TroikaTextMesh | null>(null);
  const kickerText = useRef<TroikaTextMesh | null>(null);
  const accentMaterial = useRef<THREE.MeshBasicMaterial>(null);

  useFrame((state) => {
    const groupObject = group.current;
    const mainObject = mainText.current;
    const kickerObject = kickerText.current;
    if (!groupObject || !mainObject || !kickerObject) return;

    const phraseWindow = clamp01(
      (sceneProgress.current - phrase.start) / (phrase.end - phrase.start),
    );
    const phraseOpacity = phraseEnvelope(sceneProgress.current, phrase);
    const travel = smoother(clamp01(phraseWindow / 0.78));
    const phraseDepth = THREE.MathUtils.lerp(phrase.depthFrom, phrase.depthTo, travel);
    const phraseScale = THREE.MathUtils.lerp(0.93, 1, travel);
    const pointerX = state.pointer.x * 0.38 * phraseOpacity;
    const pointerY = state.pointer.y * 0.2 * phraseOpacity;

    groupObject.visible = phraseOpacity > 0.002;
    groupObject.position.set(
      pointerX,
      THREE.MathUtils.lerp(0.2, -0.08, travel) + pointerY,
      phraseDepth,
    );
    groupObject.rotation.x = -state.pointer.y * 0.006 * phraseOpacity;
    groupObject.rotation.y = state.pointer.x * 0.009 * phraseOpacity;
    groupObject.scale.setScalar(phraseScale);

    mainObject.fillOpacity = phraseOpacity;
    kickerObject.fillOpacity = phraseOpacity * 0.68;
    if (accentMaterial.current) accentMaterial.current.opacity = phraseOpacity * 0.48;
  });

  const primary = dark ? "#f2f4f7" : "#111418";

  return (
    <group ref={group}>
      <SafeText
        ref={mainText}
        color={primary}
        fontSize={phrase.fontSize}
        letterSpacing={0.025}
        maxWidth={phrase.maxWidth}
        textAlign="center"
        anchorX="center"
        anchorY="middle"
        renderOrder={20}
        fillOpacity={0}
        onSync={(mesh) => {
          const material = mesh.material as THREE.Material;
          material.depthTest = false;
          material.depthWrite = false;
        }}
      >
        {phrase.text}
      </SafeText>
      <SafeText
        ref={kickerText}
        color="#b7e36d"
        fontSize={0.68}
        letterSpacing={0.22}
        maxWidth={34}
        textAlign="center"
        anchorX="center"
        anchorY="middle"
        position={[0, 3.4, 0.15]}
        renderOrder={21}
        fillOpacity={0}
        onSync={(mesh) => {
          const material = mesh.material as THREE.Material;
          material.depthTest = false;
          material.depthWrite = false;
        }}
      >
        {phrase.kicker}
      </SafeText>
      <mesh position={[0, -3.25, 0.1]} renderOrder={19}>
        <planeGeometry args={[6.6, 0.045]} />
        <meshBasicMaterial ref={accentMaterial} color="#b7e36d" transparent opacity={0} />
      </mesh>
    </group>
  );
}

function DimensionalPhrases({
  sceneProgress,
  dark,
}: {
  sceneProgress: React.MutableRefObject<number>;
  dark: boolean;
}) {
  return (
    <>
      {DIMENSION_PHRASES.map((phrase) => (
        <DimensionalPhrase
          key={phrase.text}
          phrase={phrase}
          sceneProgress={sceneProgress}
          dark={dark}
        />
      ))}
    </>
  );
}

function UnifiedScene({
  data,
  targetProgress,
  sceneProgress,
  pointerInside,
  dark,
}: {
  data: VoxelData;
  targetProgress: React.MutableRefObject<number>;
  sceneProgress: React.MutableRefObject<number>;
  pointerInside: React.MutableRefObject<boolean>;
  dark: boolean;
}) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const pointerHit = useMemo(() => new THREE.Vector3(999, 999, 0), []);
  const ray = useMemo(() => new THREE.Raycaster(), []);
  const interactionPlane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), []);
  const logoTiltX = useRef(0);
  const logoTiltY = useRef(0);
  const cameraParallaxX = useRef(0);
  const cameraParallaxY = useRef(0);
  const cameraLookX = useRef(0);
  const cameraLookY = useRef(0);
  const cameraRoll = useRef(0);
  const pointerPresence = useRef(0);
  const { camera, size } = useThree();
  const fitDistance = useRef(90);
  const origin = useMemo(() => new THREE.Vector3(0, 0, 0), []);
  const lookTarget = useMemo(() => new THREE.Vector3(0, 0, 0), []);

  useEffect(() => {
    if (!(camera instanceof THREE.PerspectiveCamera)) return;
    fitDistance.current = computeFitDistance(camera, size.width, size.height, data);
    camera.near = Math.max(0.1, fitDistance.current / 240);
    camera.far = Math.max(700, fitDistance.current * 6);
    camera.updateProjectionMatrix();
  }, [camera, data, size.height, size.width]);

  useFrame((state, delta) => {
    const current = mesh.current;
    const material = materialRef.current;
    if (!current || !material || !(camera instanceof THREE.PerspectiveCamera)) return;

    const response = 1 - Math.exp(-Math.min(delta, 0.05) * 4.8);
    sceneProgress.current += (targetProgress.current - sceneProgress.current) * response;
    const p = clamp01(sceneProgress.current);

    const approach = phase(p, 0.02, 0.2);
    const fracture = phase(p, 0.14, 0.28);
    const travel = phase(p, 0.22, 0.84);
    const exitDissolve = phase(p, 0.84, 1);
    const fieldAmount = fracture;
    const particleTextWindow = Math.max(
      ...DIMENSION_PHRASES.map((phrase) => phraseEnvelope(p, phrase)),
    );

    const sessionOneZoom = phase(p, 0.18, 0.23) * (1 - phase(p, 0.31, 0.35));
    const sessionTwoZoom = phase(p, 0.42, 0.47) * (1 - phase(p, 0.55, 0.59));
    const finalDrive = phase(p, 0.66, 1);
    const sessionZoom = Math.max(
      sessionOneZoom * 0.035,
      sessionTwoZoom * 0.055,
      finalDrive * 0.085,
    );

    const stableInteraction = 1 - phase(p, 0.1, 0.28);
    const fieldInteraction = phase(p, 0.18, 0.3) * (1 - phase(p, 0.74, 0.86));
    const interactionBlend = clamp01(stableInteraction + fieldInteraction * 0.28);
    const pointerFracture = interactionBlend * (pointerInside.current ? 1 : 0);

    ray.setFromCamera(state.pointer, camera);
    if (
      pointerInside.current &&
      interactionBlend > 0.001 &&
      ray.ray.intersectPlane(interactionPlane, pointerHit)
    ) {
      // Continuously refresh the pointer hit while the logo or field is interactive.
    } else {
      pointerHit.set(999, 999, 0);
    }

    const pointerResponse = 1 - Math.exp(-Math.min(delta, 0.05) * 5.4);
    const tiltTargetX = -state.pointer.y * 0.045 * interactionBlend;
    const tiltTargetY = state.pointer.x * 0.07 * interactionBlend;
    logoTiltX.current += (tiltTargetX - logoTiltX.current) * pointerResponse;
    logoTiltY.current += (tiltTargetY - logoTiltY.current) * pointerResponse;
    current.rotation.x = logoTiltX.current;
    current.rotation.y = logoTiltY.current;

    const cameraResponse = 1 - Math.exp(-Math.min(delta, 0.05) * 4.2);
    const pointerMagnitude = pointerInside.current
      ? clamp01(Math.hypot(state.pointer.x, state.pointer.y) * 0.72 + 0.08)
      : 0;
    pointerPresence.current += (pointerMagnitude - pointerPresence.current) * cameraResponse;

    const cameraTargetX = state.pointer.x * 2.0 * fieldInteraction;
    const cameraTargetY = state.pointer.y * 1.3 * fieldInteraction;
    const lookTargetX = state.pointer.x * 2.4 * fieldInteraction;
    const lookTargetY = state.pointer.y * 1.6 * fieldInteraction;
    const rollTarget = -state.pointer.x * 0.004 * fieldInteraction;
    cameraParallaxX.current += (cameraTargetX - cameraParallaxX.current) * cameraResponse;
    cameraParallaxY.current += (cameraTargetY - cameraParallaxY.current) * cameraResponse;
    cameraLookX.current += (lookTargetX - cameraLookX.current) * cameraResponse;
    cameraLookY.current += (lookTargetY - cameraLookY.current) * cameraResponse;
    cameraRoll.current += (rollTarget - cameraRoll.current) * cameraResponse;

    const fit = fitDistance.current;
    const approachZ = THREE.MathUtils.lerp(fit * 1.08, fit * 0.72, approach);
    const travelZ = THREE.MathUtils.lerp(approachZ, fit * 0.5, travel);
    const tunnelZ = travelZ - fit * sessionZoom;
    const cameraZ = tunnelZ - fit * 0.16 * exitDissolve;
    const ambientDrift =
      fieldAmount * 0.38 * (1 - pointerPresence.current * 0.9) * (1 - exitDissolve);
    camera.position.set(
      cameraParallaxX.current + Math.sin(state.clock.elapsedTime * 0.22) * ambientDrift,
      cameraParallaxY.current + Math.cos(state.clock.elapsedTime * 0.19) * ambientDrift * 0.55,
      cameraZ + state.pointer.y * 0.18 * fieldInteraction,
    );
    lookTarget.set(
      cameraLookX.current + Math.sin(state.clock.elapsedTime * 0.17) * ambientDrift * 0.2,
      cameraLookY.current + Math.cos(state.clock.elapsedTime * 0.15) * ambientDrift * 0.12,
      -11 * fieldInteraction - exitDissolve * 20,
    );
    camera.lookAt(fieldInteraction > 0.001 || exitDissolve > 0.001 ? lookTarget : origin);
    camera.rotation.z += cameraRoll.current;

    material.opacity = 1 - exitDissolve;

    const time = state.clock.elapsedTime;
    const travelDistance = travel * 135 + exitDissolve * 82;
    const themeScale = dark ? 1 : 0.92;

    for (let index = 0; index < data.voxels.length; index += 1) {
      const voxel = data.voxels[index];
      if (!voxel) continue;

      const looseOrbit =
        voxel.orbitRadius *
        (0.72 + fracture * 1.15) *
        (1 - fieldAmount * 0.82) *
        Math.max(interactionBlend, 0.22);
      const orbitAngle = time * (0.34 + voxel.rand * 0.28) + voxel.orbitPhase;
      const orbitX = Math.cos(orbitAngle) * looseOrbit;
      const orbitY = Math.sin(orbitAngle) * looseOrbit * 0.72;
      const orbitZ = Math.sin(orbitAngle * 0.63) * looseOrbit * 0.46;

      const pointerDx = voxel.base.x - pointerHit.x;
      const pointerDy = voxel.base.y - pointerHit.y;
      const distance = Math.sqrt(pointerDx * pointerDx + pointerDy * pointerDy);
      const localInfluence = Math.exp(-(distance * distance) / (2 * 5.2 * 5.2)) * pointerFracture;
      const localPush = localInfluence * localInfluence * 5.8;
      const localScatter = Math.pow(localInfluence, 1.35) * 2.4;
      const inverseDistance = 1 / Math.max(distance, 0.001);
      const localX = pointerDx * inverseDistance * localPush + voxel.seed.x * localScatter;
      const localY = pointerDy * inverseDistance * localPush + voxel.seed.y * localScatter;
      const localZ = voxel.seed.z * localScatter * 1.65 + localInfluence;

      const swirl = travel * 0.46 + voxel.rand * 0.18 + exitDissolve * 0.2;
      const cosSwirl = Math.cos(swirl);
      const sinSwirl = Math.sin(swirl);
      const fieldX = voxel.field.x * cosSwirl - voxel.field.y * sinSwirl;
      const fieldY = voxel.field.x * sinSwirl + voxel.field.y * cosSwirl;
      const fieldZ = voxel.field.z + travelDistance * (0.72 + voxel.rand * 0.5);

      const textClearance = particleTextWindow * fieldAmount;
      const clearanceX = Math.max(0, 1 - Math.abs(fieldX) / 38);
      const clearanceY = Math.max(0, 1 - Math.abs(fieldY) / 12.5);
      const clearance = smoother(clearanceX * clearanceY) * textClearance;
      const clearanceDirectionX = fieldX === 0 ? Math.sign(voxel.seed.x || 1) : Math.sign(fieldX);
      const clearanceDirectionY = fieldY === 0 ? Math.sign(voxel.seed.y || 1) : Math.sign(fieldY);
      const clearedFieldX = fieldX + clearanceDirectionX * clearance * 7.5;
      const clearedFieldY = fieldY + clearanceDirectionY * clearance * 17;
      const clearedFieldZ = fieldZ - clearance * 8;

      const unstableX = voxel.base.x + orbitX + localX + voxel.seed.x * fracture * 0.8;
      const unstableY = voxel.base.y + orbitY + localY + voxel.seed.y * fracture * 0.8;
      const unstableZ = voxel.base.z + orbitZ + localZ + voxel.seed.z * fracture * 1.15;

      const x = THREE.MathUtils.lerp(unstableX, clearedFieldX, fieldAmount);
      const y = THREE.MathUtils.lerp(unstableY, clearedFieldY, fieldAmount);
      const z = THREE.MathUtils.lerp(unstableZ, clearedFieldZ, fieldAmount);

      dummy.position.set(x, y, z);
      const spin = fieldAmount * (1.15 + voxel.rand * 3.4) + localInfluence * 3;
      dummy.rotation.set(
        voxel.seed.x * spin,
        voxel.seed.y * spin + travel * voxel.seed.z * 1.15,
        voxel.seed.z * spin,
      );

      const dimensionalScale = 0.82 + voxel.rand * 0.24;
      const scale = THREE.MathUtils.lerp(voxel.size, voxel.size * dimensionalScale, fieldAmount);
      const fracturedScale = scale * (1 - localInfluence * 0.16);
      const readabilityScale = 1 - clearance * 0.9;
      const exitScale = 1 - exitDissolve * 0.22;
      const cameraClearance = cameraZ - z;
      const cameraVisibility = smoother((cameraClearance - 0.45) / 4.5);
      dummy.scale.setScalar(
        fracturedScale * themeScale * readabilityScale * exitScale * cameraVisibility,
      );
      dummy.updateMatrix();
      current.setMatrixAt(index, dummy.matrix);
    }

    current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={mesh}
      args={[undefined, undefined, data.voxels.length]}
      frustumCulled={false}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial
        ref={materialRef}
        color={dark ? "#f4f4f5" : "#2b3035"}
        metalness={dark ? 0.35 : 0.18}
        roughness={dark ? 0.25 : 0.42}
        emissive={dark ? "#9aa0ff" : "#080a0c"}
        emissiveIntensity={dark ? 0.08 : 0.02}
        transparent
        opacity={1}
      />
    </instancedMesh>
  );
}

export function UnifiedVoxelDimensionScene({
  progress,
  className = "",
}: UnifiedVoxelDimensionSceneProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const targetProgress = useRef(progress.get());
  const sceneProgress = useRef(progress.get());
  const pointerInside = useRef(false);
  const [active, setActive] = useState(false);
  const [appReady, setAppReady] = useState(hasSeenLoader);
  const [hasMounted, setHasMounted] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [dark, setDark] = useState(false);

  const data = useLogoVoxels("/arcane-logo-black.svg");

  useEffect(() => {
    targetProgress.current = progress.get();
    return progress.on("change", (value) => {
      targetProgress.current = value;
    });
  }, [progress]);

  useEffect(() => {
    setReducedMotion(prefersReducedMotion());
    return observeReducedMotion(setReducedMotion);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const syncTheme = () => setDark(root.classList.contains("dark"));
    syncTheme();
    const observer = new MutationObserver(syncTheme);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let pageVisible = isDocumentVisible();
    let inViewport = false;
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
      disconnectDocument();
      disconnectViewport();
    };
  }, []);

  useEffect(() => {
    if (appReady) return;
    const handleReady = () => setAppReady(true);
    window.addEventListener("arcane-app-ready", handleReady);
    return () => window.removeEventListener("arcane-app-ready", handleReady);
  }, [appReady]);

  useEffect(() => {
    if (!appReady) return undefined;
    const timer = window.setTimeout(() => setHasMounted(true), 120);
    return () => window.clearTimeout(timer);
  }, [appReady]);

  return (
    <div
      ref={containerRef}
      className={className}
      aria-label="Arcane Labs voxel tunnel dimension"
      onPointerEnter={() => {
        pointerInside.current = true;
      }}
      onPointerLeave={() => {
        pointerInside.current = false;
      }}
    >
      {hasMounted && (
        <WebGLCrashBoundary>
          <Canvas
            camera={{ position: [0, 0, 90], fov: 45, near: 0.1, far: 700 }}
            dpr={[1, 1.5]}
            frameloop={active && !reducedMotion ? "always" : "never"}
            eventSource={containerRef.current!}
            eventPrefix="client"
            gl={{ alpha: true, antialias: false, powerPreference: "high-performance" }}
          >
            <ambientLight intensity={dark ? 0.55 : 1.25} />
            <hemisphereLight args={["#ffffff", dark ? "#17171b" : "#7f858a", dark ? 0.5 : 1.1]} />
            <directionalLight position={[30, 40, 50]} intensity={dark ? 2.2 : 3.1} />
            <directionalLight
              position={[-40, -18, -24]}
              intensity={dark ? 0.8 : 1.1}
              color={dark ? "#6b7cff" : "#ffffff"}
            />
            {data && (
              <UnifiedScene
                data={data}
                targetProgress={targetProgress}
                sceneProgress={sceneProgress}
                pointerInside={pointerInside}
                dark={dark}
              />
            )}
            <DimensionalPhrases sceneProgress={sceneProgress} dark={dark} />
          </Canvas>
        </WebGLCrashBoundary>
      )}
    </div>
  );
}
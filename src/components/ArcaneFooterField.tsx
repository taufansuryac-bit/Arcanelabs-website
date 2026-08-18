import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import {
  isDocumentVisible,
  observeDocumentVisibility,
  observeElementVisibility,
  shouldAnimate,
} from "@/lib/animation-runtime";

const RESIDUE_COUNT = 420;

function seeded(value: number) {
  const n = Math.sin(value * 127.1 + 311.7) * 43758.5453;
  return n - Math.floor(n);
}

function useDarkMode() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const sync = () => setDark(root.classList.contains("dark"));
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  return dark;
}

function Terrain({ dark }: { dark: boolean }) {
  const material = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uLow: { value: new THREE.Color(dark ? "#b9d9d4" : "#52615e") },
      uHigh: { value: new THREE.Color(dark ? "#f4f4f5" : "#151719") },
    }),
    [],
  );

  useEffect(() => {
    uniforms.uLow.value.set(dark ? "#b9d9d4" : "#52615e");
    uniforms.uHigh.value.set(dark ? "#f4f4f5" : "#151719");
  }, [dark, uniforms]);

  useFrame((state) => {
    uniforms.uTime.value = state.clock.elapsedTime;
  });

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -5.2, -62]}>
      <planeGeometry args={[220, 240, 180, 180]} />
      <shaderMaterial
        ref={material}
        uniforms={uniforms}
        wireframe
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        vertexShader={/* glsl */ `
          uniform float uTime;
          varying float vDepth;
          varying float vHeight;

          float terrainWave(vec2 p) {
            float h = 0.0;
            h += sin(p.x * 0.13 + uTime * 0.28) * 0.9;
            h += sin(p.y * 0.10 + uTime * 0.20) * 0.7;
            h += sin((p.x + p.y) * 0.07 - uTime * 0.15) * 0.42;
            h += sin((p.x - p.y) * 0.05 + uTime * 0.11) * 0.30;
            h -= pow(abs(sin(p.x * 0.055 + uTime * 0.09) * sin(p.y * 0.045 - uTime * 0.075)), 0.72) * 1.05;
            return h;
          }

          void main() {
            vec3 pos = position;
            float breathe = 0.93 + 0.10 * sin(uTime * 0.28);
            float h = terrainWave(pos.xy) * breathe;
            pos.z += h * 0.58;
            vec4 mv = modelViewMatrix * vec4(pos, 1.0);
            vDepth = -mv.z;
            vHeight = h;
            gl_Position = projectionMatrix * mv;
          }
        `}
        fragmentShader={/* glsl */ `
          uniform vec3 uLow;
          uniform vec3 uHigh;
          varying float vDepth;
          varying float vHeight;

          void main() {
            float crest = smoothstep(-0.45, 1.35, vHeight);
            vec3 color = mix(uLow, uHigh, crest);
            float depthFade = 1.0 - smoothstep(48.0, 170.0, vDepth);
            float horizonFade = 0.42 + crest * 0.52;
            gl_FragColor = vec4(color, depthFade * horizonFade);
          }
        `}
      />
    </mesh>
  );
}

type Residue = {
  x: number;
  y: number;
  z: number;
  size: number;
  speed: number;
  phase: number;
  spin: number;
  accent: boolean;
};

function ResidueVoxels({ dark }: { dark: boolean }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const mainColor = useMemo(() => new THREE.Color(), []);
  const accentColor = useMemo(() => new THREE.Color("#9cff45"), []);
  const residues = useMemo<Residue[]>(() => {
    return Array.from({ length: RESIDUE_COUNT }, (_, index) => {
      const depth = seeded(index * 7.71 + 8.2);
      return {
        x: (seeded(index * 3.17 + 1.1) - 0.5) * 150,
        y: 3 + seeded(index * 5.31 + 4.7) * 62,
        z: -195 + depth * 205,
        size: 0.16 + Math.pow(seeded(index * 11.3 + 2.4), 1.7) * 0.64,
        speed: 0.5 + seeded(index * 13.9 + 6.8) * 1.15,
        phase: seeded(index * 17.4 + 7.1) * Math.PI * 2,
        spin: 0.25 + seeded(index * 19.1 + 3.2) * 0.8,
        accent: seeded(index * 23.7 + 9.4) < 0.022,
      };
    });
  }, []);

  useEffect(() => {
    const current = mesh.current;
    if (!current) return;
    mainColor.set(dark ? "#f4f4f5" : "#2b2f31");
    residues.forEach((residue, index) => {
      current.setColorAt(index, residue.accent ? accentColor : mainColor);
    });
    if (current.instanceColor) current.instanceColor.needsUpdate = true;
  }, [accentColor, dark, mainColor, residues]);

  useFrame((state) => {
    const current = mesh.current;
    if (!current) return;
    const time = state.clock.elapsedTime;

    residues.forEach((residue, index) => {
      const travelSpan = 210;
      const z = ((residue.z + time * residue.speed * 3.4 + 205) % travelSpan) - 200;
      const depthRatio = THREE.MathUtils.clamp((z + 200) / travelSpan, 0, 1);
      const orbit = residue.phase + time * 0.08 * residue.spin;
      const drift = 0.4 + depthRatio * 1.3;
      const x = residue.x + Math.cos(orbit) * drift;
      const y = residue.y + Math.sin(orbit * 1.31) * drift * 0.72;

      dummy.position.set(x, y, z);
      dummy.rotation.set(
        orbit * 0.35,
        orbit * 0.62 + residue.phase,
        orbit * 0.21,
      );
      dummy.scale.setScalar(residue.size);
      dummy.updateMatrix();
      current.setMatrixAt(index, dummy.matrix);
    });

    current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={mesh}
      args={[undefined, undefined, residues.length]}
      frustumCulled={false}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial
        vertexColors
        color="#f4f4f5"
        metalness={0.35}
        roughness={0.25}
        emissive="#9aa0ff"
        emissiveIntensity={dark ? 0.055 : 0.015}
      />
    </instancedMesh>
  );
}

function CameraRig() {
  const smooth = useRef({ x: 0, y: 0 });
  const lookTarget = useMemo(() => new THREE.Vector3(), []);

  useFrame((state, delta) => {
    const response = 1 - Math.exp(-Math.min(delta, 0.05) * 4.8);
    smooth.current.x += (state.pointer.x - smooth.current.x) * response;
    smooth.current.y += (state.pointer.y - smooth.current.y) * response;

    state.camera.position.x = smooth.current.x * 2.7;
    state.camera.position.y = 8.8 - smooth.current.y * 1.7;
    state.camera.position.z = 26;
    state.camera.rotation.z = -smooth.current.x * 0.018;
    lookTarget.set(
      smooth.current.x * 5.2,
      4.6 - smooth.current.y * 2.1,
      -62,
    );
    state.camera.lookAt(lookTarget);
  });

  return null;
}

export function ArcaneFooterField() {
  const containerRef = useRef<HTMLElement | null>(null);
  const [active, setActive] = useState(false);
  const dark = useDarkMode();

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
      { rootMargin: "420px 0px" },
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

  const background = dark ? "#050506" : "#f5f5f0";

  return (
    <section
      ref={containerRef}
      aria-label="Arcane field epilogue"
      className="relative z-10 h-[68vh] min-h-[480px] overflow-hidden border-t border-border bg-background md:h-[84vh] md:min-h-[620px]"
    >
      <Canvas
        camera={{ position: [0, 8.8, 26], fov: 48, near: 0.1, far: 420 }}
        dpr={[1, 1.6]}
        frameloop={active ? "always" : "never"}
        gl={{
          alpha: false,
          antialias: true,
          powerPreference: "high-performance",
        }}
      >
        <color attach="background" args={[background]} />
        <ambientLight intensity={dark ? 0.55 : 0.72} />
        <directionalLight position={[28, 36, 42]} intensity={dark ? 2 : 1.45} />
        <directionalLight
          position={[-34, -12, -24]}
          intensity={dark ? 0.68 : 0.32}
          color="#7786ff"
        />
        <Terrain dark={dark} />
        <ResidueVoxels dark={dark} />
        <CameraRig />
      </Canvas>

      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-center justify-between px-5 py-5 md:px-8">
        <span className="label-mono">ARCANE FIELD / JOURNEY COMPLETE</span>
        <span className="label-mono">RESIDUAL VOXELS / ACTIVE</span>
      </div>
    </section>
  );
}

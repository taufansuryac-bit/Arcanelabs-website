import { Canvas, useFrame } from "@react-three/fiber";
import { motion } from "motion/react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import * as THREE from "three";
import {
  isDocumentVisible,
  observeDocumentVisibility,
  observeElementVisibility,
  shouldAnimate,
} from "@/lib/animation-runtime";

const RESIDUE_COUNT = 520;

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
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uLow: { value: new THREE.Color(dark ? "#bfc6c8" : "#34383a") },
      uHigh: { value: new THREE.Color(dark ? "#ffffff" : "#08090a") },
    }),
    [],
  );

  useEffect(() => {
    uniforms.uLow.value.set(dark ? "#bfc6c8" : "#34383a");
    uniforms.uHigh.value.set(dark ? "#ffffff" : "#08090a");
  }, [dark, uniforms]);

  useFrame((state) => {
    uniforms.uTime.value = state.clock.elapsedTime;
  });

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -4.7, -62]}>
      <planeGeometry args={[220, 240, 156, 156]} />
      <shaderMaterial
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
            float broad = 0.0;
            broad += sin(p.x * 0.045 + uTime * 0.32) * 2.15;
            broad += sin(p.y * 0.038 - uTime * 0.25) * 1.75;
            broad += sin((p.x + p.y) * 0.031 + uTime * 0.19) * 1.15;

            float detail = 0.0;
            detail += sin((p.x + p.y) * 0.082 - uTime * 0.20) * 0.58;
            detail += sin((p.x - p.y) * 0.067 + uTime * 0.14) * 0.42;

            float trough = pow(
              abs(sin(p.x * 0.041 + uTime * 0.07) * sin(p.y * 0.037 - uTime * 0.06)),
              0.72
            ) * 0.72;

            return broad + detail - trough;
          }

          void main() {
            vec3 pos = position;
            float breathe = 0.94 + 0.09 * sin(uTime * 0.24);
            float h = terrainWave(pos.xy) * breathe;
            pos.z += h * 1.18;
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
            float crest = smoothstep(-1.5, 2.6, vHeight);
            vec3 color = mix(uLow, uHigh, crest);
            float depthFade = 1.0 - smoothstep(54.0, 172.0, vDepth);
            float horizonFade = 0.46 + crest * 0.54;
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
};

function ResidueVoxels({ dark }: { dark: boolean }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const mainColor = useMemo(() => new THREE.Color(), []);
  const residues = useMemo<Residue[]>(() => {
    return Array.from({ length: RESIDUE_COUNT }, (_, index) => {
      const depth = seeded(index * 7.71 + 8.2);
      return {
        x: (seeded(index * 3.17 + 1.1) - 0.5) * 150,
        y: 3 + seeded(index * 5.31 + 4.7) * 62,
        z: -198 + depth * 208,
        size: 0.13 + Math.pow(seeded(index * 11.3 + 2.4), 1.65) * 0.58,
        speed: 0.42 + seeded(index * 13.9 + 6.8) * 1.05,
        phase: seeded(index * 17.4 + 7.1) * Math.PI * 2,
        spin: 0.25 + seeded(index * 19.1 + 3.2) * 0.8,
      };
    });
  }, []);

  useEffect(() => {
    const current = mesh.current;
    if (!current) return;
    mainColor.set(dark ? "#ffffff" : "#17191a");
    residues.forEach((_, index) => current.setColorAt(index, mainColor));
    if (current.instanceColor) current.instanceColor.needsUpdate = true;
  }, [dark, mainColor, residues]);

  useFrame((state) => {
    const current = mesh.current;
    if (!current) return;
    const time = state.clock.elapsedTime;

    residues.forEach((residue, index) => {
      const travelSpan = 214;
      const z = ((residue.z + time * residue.speed * 3.15 + 208) % travelSpan) - 202;
      const depthRatio = THREE.MathUtils.clamp((z + 202) / travelSpan, 0, 1);
      const orbit = residue.phase + time * 0.085 * residue.spin;
      const drift = 0.38 + depthRatio * 1.35;
      const x = residue.x + Math.cos(orbit) * drift;
      const y = residue.y + Math.sin(orbit * 1.31) * drift * 0.78;

      dummy.position.set(x, y, z);
      dummy.rotation.set(orbit * 0.35, orbit * 0.62 + residue.phase, orbit * 0.21);
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
        color="#ffffff"
        metalness={0.34}
        roughness={0.3}
        emissive="#ffffff"
        emissiveIntensity={dark ? 0.018 : 0.005}
      />
    </instancedMesh>
  );
}

function CameraRig() {
  const smooth = useRef({ x: 0, y: 0 });
  const lookTarget = useMemo(() => new THREE.Vector3(), []);

  useFrame((state, delta) => {
    const time = state.clock.elapsedTime;
    const response = 1 - Math.exp(-Math.min(delta, 0.05) * 4.6);
    smooth.current.x += (state.pointer.x - smooth.current.x) * response;
    smooth.current.y += (state.pointer.y - smooth.current.y) * response;

    const ambientX = Math.sin(time * 0.14) * 0.48;
    const ambientY = Math.sin(time * 0.11 + 1.3) * 0.24;
    const ambientLook = Math.sin(time * 0.09 + 0.6) * 0.75;

    state.camera.position.x = smooth.current.x * 2.6 + ambientX;
    state.camera.position.y = 8.15 - smooth.current.y * 1.55 + ambientY;
    state.camera.position.z = 26;
    state.camera.rotation.z = -smooth.current.x * 0.018 + Math.sin(time * 0.08) * 0.004;
    lookTarget.set(
      smooth.current.x * 5.2 + ambientLook,
      3.9 - smooth.current.y * 2.0 + ambientY,
      -62,
    );
    state.camera.lookAt(lookTarget);
  });

  return null;
}

type FloatingInfoProps = {
  children: ReactNode;
  className: string;
  phase: number;
  active: boolean;
};

function FloatingInfo({ children, className, phase, active }: FloatingInfoProps) {
  return (
    <motion.div
      className={`absolute z-20 ${className}`}
      animate={
        active
          ? {
              x: [0, 4 + phase * 0.7, -2 - phase * 0.3, 0],
              y: [0, -8 - phase * 1.4, 3 + phase * 0.5, 0],
            }
          : { x: 0, y: 0 }
      }
      transition={{
        duration: 7.8 + phase * 1.25,
        repeat: Infinity,
        ease: "easeInOut",
        delay: phase * 0.32,
      }}
    >
      {children}
    </motion.div>
  );
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

  const background = dark ? "#030304" : "#f3f3ee";

  return (
    <section
      ref={containerRef}
      aria-label="Arcane field footer epilogue"
      className="relative h-[82vh] min-h-[620px] overflow-hidden border-t border-border bg-background md:h-[96vh] md:min-h-[720px]"
    >
      <Canvas
        camera={{ position: [0, 8.15, 26], fov: 48, near: 0.1, far: 420 }}
        dpr={[1, 1.6]}
        frameloop={active ? "always" : "never"}
        gl={{
          alpha: false,
          antialias: true,
          powerPreference: "high-performance",
        }}
      >
        <color attach="background" args={[background]} />
        <ambientLight intensity={dark ? 0.76 : 0.82} />
        <directionalLight position={[28, 36, 42]} intensity={dark ? 2.25 : 1.55} color="#ffffff" />
        <directionalLight position={[-34, -12, -24]} intensity={dark ? 0.5 : 0.28} color="#ffffff" />
        <Terrain dark={dark} />
        <ResidueVoxels dark={dark} />
        <CameraRig />
      </Canvas>

      <FloatingInfo
        active={active}
        phase={0}
        className="inset-x-0 top-[9%] px-5 text-center md:px-8"
      >
        <p className="label-mono text-foreground/90">ARCANE LABS / END OF JOURNEY</p>
        <p className="mt-2 text-xs tracking-[0.16em] text-foreground/55">FIELD STABILIZED / RESIDUAL VOXELS ACTIVE</p>
      </FloatingInfo>

      <FloatingInfo active={active} phase={1} className="left-[6%] top-[34%] max-w-[18rem]">
        <p className="label-mono mb-2 text-foreground/70">■ CONTACT</p>
        <a
          href="mailto:hello@arcanelabs.mov"
          className="text-sm tracking-[0.08em] text-foreground underline-offset-4 hover:underline md:text-base"
        >
          hello@arcanelabs.mov
        </a>
        <p className="mt-2 text-xs tracking-[0.12em] text-foreground/60">INSTAGRAM / WORLDWIDE</p>
      </FloatingInfo>

      <FloatingInfo active={active} phase={2} className="right-[6%] top-[31%] text-right">
        <p className="label-mono mb-2 text-foreground/70">■ INDEX</p>
        <div className="flex flex-col gap-1 text-xs tracking-[0.18em] text-foreground/80 md:text-sm">
          <a href="#works" className="hover:text-foreground">WORKS</a>
          <a href="#faq" className="hover:text-foreground">FAQ</a>
          <a href="#top" className="hover:text-foreground">TOP</a>
        </div>
      </FloatingInfo>

      <FloatingInfo active={active} phase={3} className="bottom-[12%] left-[6%]">
        <p className="label-mono mb-2 text-foreground/70">■ CREATED BY</p>
        <p className="text-sm tracking-[0.1em] text-foreground md:text-base">ARCANE LABS</p>
        <p className="mt-2 text-xs tracking-[0.12em] text-foreground/55">DESIGN / CODE / MOTION</p>
      </FloatingInfo>

      <FloatingInfo active={active} phase={4} className="bottom-[12%] right-[6%] text-right">
        <p className="label-mono mb-2 text-foreground/70">■ LEGALS</p>
        <p className="text-xs tracking-[0.1em] text-foreground/75 md:text-sm">
          © {new Date().getFullYear()} ARCANE LABS
        </p>
        <p className="mt-2 text-xs tracking-[0.12em] text-foreground/55">IMPRINT / PRIVACY</p>
      </FloatingInfo>

      <FloatingInfo active={active} phase={2.5} className="inset-x-0 bottom-[3.5%] text-center">
        <a
          href="#top"
          className="pointer-events-auto label-mono text-foreground/80 transition-opacity hover:text-foreground"
        >
          :/ BACK TO TOP
        </a>
      </FloatingInfo>
    </section>
  );
}

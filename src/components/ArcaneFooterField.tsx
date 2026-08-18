import { Canvas, useFrame } from "@react-three/fiber";
import { motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { AsciiWordmark } from "./AsciiWordmark";
import {
  isDocumentVisible,
  observeDocumentVisibility,
  observeElementVisibility,
  shouldAnimate,
} from "@/lib/animation-runtime";

const RESIDUE_COUNT = 560;
const FOOTER_TICKER =
  "[c] ARCANE LABS CREATED BY TAUFAN SURC 2026 — THE BEGININNG OF DEVELOPER ERA — ";

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
      uLow: { value: new THREE.Color(dark ? "#d7dddd" : "#414748") },
      uHigh: { value: new THREE.Color(dark ? "#ffffff" : "#090a0b") },
    }),
    [],
  );

  useEffect(() => {
    uniforms.uLow.value.set(dark ? "#d7dddd" : "#414748");
    uniforms.uHigh.value.set(dark ? "#ffffff" : "#090a0b");
  }, [dark, uniforms]);

  useFrame((state) => {
    uniforms.uTime.value = state.clock.elapsedTime;
  });

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -4.8, -62]}>
      <planeGeometry args={[224, 244, 164, 164]} />
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
            float ocean = 0.0;
            ocean += sin(p.x * 0.038 + uTime * 0.34) * 2.75;
            ocean += sin(p.y * 0.032 - uTime * 0.27) * 2.20;
            ocean += sin((p.x + p.y) * 0.025 + uTime * 0.21) * 1.55;
            ocean += sin((p.x - p.y) * 0.022 - uTime * 0.16) * 0.95;

            float ripples = 0.0;
            ripples += sin((p.x + p.y) * 0.078 - uTime * 0.23) * 0.62;
            ripples += sin((p.x - p.y) * 0.064 + uTime * 0.17) * 0.48;

            float trough = pow(
              abs(sin(p.x * 0.036 + uTime * 0.065) * sin(p.y * 0.034 - uTime * 0.055)),
              0.72
            ) * 0.62;

            return ocean + ripples - trough;
          }

          void main() {
            vec3 pos = position;
            float breathe = 0.98 + 0.18 * sin(uTime * 0.22);
            float h = terrainWave(pos.xy) * breathe;
            pos.z += h * 1.24;
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
            float crest = smoothstep(-1.8, 3.0, vHeight);
            vec3 color = mix(uLow, uHigh, crest);
            float depthFade = 1.0 - smoothstep(54.0, 176.0, vDepth);
            float horizonFade = 0.48 + crest * 0.52;
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
  const residues = useMemo<Residue[]>(() => {
    return Array.from({ length: RESIDUE_COUNT }, (_, index) => {
      const depth = seeded(index * 7.71 + 8.2);
      return {
        x: (seeded(index * 3.17 + 1.1) - 0.5) * 152,
        y: 2 + seeded(index * 5.31 + 4.7) * 66,
        z: -202 + depth * 214,
        size: 0.12 + Math.pow(seeded(index * 11.3 + 2.4), 1.62) * 0.62,
        speed: 0.42 + seeded(index * 13.9 + 6.8) * 1.08,
        phase: seeded(index * 17.4 + 7.1) * Math.PI * 2,
        spin: 0.25 + seeded(index * 19.1 + 3.2) * 0.82,
      };
    });
  }, []);

  useFrame((state) => {
    const current = mesh.current;
    if (!current) return;
    const time = state.clock.elapsedTime;

    residues.forEach((residue, index) => {
      const travelSpan = 220;
      const z = ((residue.z + time * residue.speed * 3.2 + 214) % travelSpan) - 208;
      const depthRatio = THREE.MathUtils.clamp((z + 208) / travelSpan, 0, 1);
      const orbit = residue.phase + time * 0.09 * residue.spin;
      const drift = 0.42 + depthRatio * 1.45;
      const x = residue.x + Math.cos(orbit) * drift;
      const y = residue.y + Math.sin(orbit * 1.31) * drift * 0.82;

      dummy.position.set(x, y, z);
      dummy.rotation.set(orbit * 0.38, orbit * 0.68 + residue.phase, orbit * 0.24);
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
        color={dark ? "#ffffff" : "#17191a"}
        metalness={dark ? 0.08 : 0.14}
        roughness={0.46}
        emissive={dark ? "#ffffff" : "#000000"}
        emissiveIntensity={dark ? 0.48 : 0}
        toneMapped={false}
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

    const ambientX = Math.sin(time * 0.14) * 0.52;
    const ambientY = Math.sin(time * 0.11 + 1.3) * 0.28;
    const ambientLook = Math.sin(time * 0.09 + 0.6) * 0.8;

    state.camera.position.x = smooth.current.x * 2.75 + ambientX;
    state.camera.position.y = 8.0 - smooth.current.y * 1.6 + ambientY;
    state.camera.position.z = 26;
    state.camera.rotation.z = -smooth.current.x * 0.018 + Math.sin(time * 0.08) * 0.004;
    lookTarget.set(
      smooth.current.x * 5.4 + ambientLook,
      3.8 - smooth.current.y * 2.05 + ambientY,
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
      { rootMargin: "460px 0px" },
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

  const background = dark ? "#020203" : "#f3f3ee";
  const primaryText = dark ? "text-[#f4f3ed]" : "text-[#101214]";
  const secondaryText = dark ? "text-[#a3aaad]" : "text-[#59615e]";
  const accentText = dark ? "text-[#9cff45]" : "text-[#315f1f]";
  const textGlow = dark
    ? "drop-shadow-[0_2px_5px_rgba(0,0,0,0.98)]"
    : "drop-shadow-[0_1px_4px_rgba(255,255,255,0.95)]";
  const accentGlow = dark
    ? "drop-shadow-[0_0_7px_rgba(156,255,69,0.3)]"
    : "drop-shadow-[0_1px_3px_rgba(255,255,255,0.9)]";

  return (
    <section
      ref={containerRef}
      aria-label="Arcane field footer epilogue"
      className="relative h-[100svh] min-h-[760px] overflow-hidden border-t border-border bg-background"
    >
      <Canvas
        camera={{ position: [0, 8.0, 26], fov: 48, near: 0.1, far: 430 }}
        dpr={[1, 1.6]}
        frameloop={active ? "always" : "never"}
        gl={{ alpha: false, antialias: true, powerPreference: "high-performance" }}
      >
        <color attach="background" args={[background]} />
        <ambientLight intensity={dark ? 1.7 : 1.0} />
        <hemisphereLight
          args={[
            "#ffffff",
            dark ? "#111113" : "#9da1a0",
            dark ? 1.35 : 0.72,
          ]}
        />
        <directionalLight
          position={[28, 36, 42]}
          intensity={dark ? 2.45 : 1.45}
          color="#ffffff"
        />
        <directionalLight
          position={[-34, 8, 6]}
          intensity={dark ? 1.15 : 0.45}
          color="#ffffff"
        />
        <Terrain dark={dark} />
        <ResidueVoxels dark={dark} />
        <CameraRig />
      </Canvas>

      <motion.div
        data-footer-content
        className="absolute inset-x-[4%] top-[13%] z-20 flex flex-col items-center md:inset-x-[6%] md:top-[12%]"
        animate={active ? { y: [0, -3, 2, 0] } : { y: 0 }}
        transition={{ duration: 11.5, repeat: Infinity, ease: "easeInOut" }}
      >
        <div
          data-footer-logo
          className={`pointer-events-auto h-[31vh] min-h-[220px] w-full max-w-[1500px] md:h-[37vh] ${textGlow}`}
        >
          <AsciiWordmark text="ARCANE LABS" cell={8} chaosStrength={1.65} />
        </div>

        <div
          className={`mt-2 w-full max-w-[1320px] text-center md:mt-4 ${textGlow}`}
          aria-label="Arcane Labs footer navigation and contact"
        >
          <div className="grid grid-cols-2 gap-x-5 gap-y-5 md:grid-cols-6 md:gap-4">
            <div>
              <p className={`label-mono mb-2 ${accentText} ${accentGlow}`}>■ CONTACT</p>
              <a
                href="mailto:hello@arcanelabs.mov"
                className={`text-xs tracking-[0.08em] hover:opacity-70 md:text-sm ${primaryText}`}
              >
                hello@arcanelabs.mov
              </a>
            </div>

            <div>
              <p className={`label-mono mb-2 ${accentText} ${accentGlow}`}>■ WORKS</p>
              <a href="#works" className={`text-xs tracking-[0.12em] hover:opacity-70 md:text-sm ${primaryText}`}>
                SELECTED WORK
              </a>
            </div>

            <div>
              <p className={`label-mono mb-2 ${accentText} ${accentGlow}`}>■ STUDIO</p>
              <a href="#top" className={`text-xs tracking-[0.12em] hover:opacity-70 md:text-sm ${primaryText}`}>
                ARCANE LABS
              </a>
            </div>

            <div>
              <p className={`label-mono mb-2 ${accentText} ${accentGlow}`}>■ FAQ</p>
              <a href="#faq" className={`text-xs tracking-[0.12em] hover:opacity-70 md:text-sm ${primaryText}`}>
                QUESTIONS
              </a>
            </div>

            <div>
              <p className={`label-mono mb-2 ${accentText} ${accentGlow}`}>■ CREATED BY</p>
              <p className={`text-xs tracking-[0.1em] md:text-sm ${primaryText}`}>TAUFAN SURC</p>
              <p className={`mt-1 text-[10px] tracking-[0.12em] ${secondaryText}`}>DESIGN / CODE / MOTION</p>
            </div>

            <div>
              <p className={`label-mono mb-2 ${accentText} ${accentGlow}`}>■ LEGALS</p>
              <p className={`text-xs tracking-[0.1em] md:text-sm ${primaryText}`}>© 2026 ARCANE LABS</p>
              <p className={`mt-1 text-[10px] tracking-[0.12em] ${secondaryText}`}>PRIVACY / IMPRINT</p>
            </div>
          </div>

          <a
            href="#top"
            className={`mt-5 inline-block label-mono transition-opacity hover:opacity-65 ${secondaryText}`}
          >
            :/ BACK TO TOP
          </a>
        </div>
      </motion.div>

      <div
        data-footer-ticker
        className={`absolute inset-x-0 bottom-[2%] z-30 overflow-hidden border-y border-current/10 py-2 ${textGlow}`}
      >
        <div className="flex w-max marquee-track">
          {[0, 1, 2].map((key) => (
            <span
              key={key}
              className={`whitespace-nowrap px-4 font-mono text-[9px] uppercase tracking-[0.2em] md:text-[11px] ${secondaryText}`}
            >
              {FOOTER_TICKER}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

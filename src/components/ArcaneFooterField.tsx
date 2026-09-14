import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { hasSeenLoader } from "@/lib/utils";
import { AsciiWordmark } from "./AsciiWordmark";
import {
  isDocumentVisible,
  observeDocumentVisibility,
  observeElementVisibility,
  observeReducedMotion,
  prefersReducedMotion,
  shouldAnimate,
} from "@/lib/animation-runtime";

const RESIDUE_COUNT = 560;
const FOOTER_TICKER =
  "[c] ARCANE LABS CREATED BY TAUFAN SURC 2026 — THE BEGININNG OF DEVELOPER ERA ";

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

function Terrain({ dark: _dark }: { dark: boolean }) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(() => ({ uTime: { value: 0 } }), []);

  useFrame((state) => {
    const mat = materialRef.current;
    if (mat?.uniforms?.["uTime"]) {
      mat.uniforms["uTime"].value = state.clock.elapsedTime * 0.5;
    }
  });

  return (
    <mesh position={[0, -6.2, -62]}>
      <planeGeometry args={[256, 256, 256, 256]} />
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.NormalBlending}
        vertexShader={
          /* glsl */ `
          uniform float uTime;
          varying vec3 vPosition;

          mat4 rotateMatrixX(float radian) {
            return mat4(
              1.0, 0.0, 0.0, 0.0,
              0.0, cos(radian), -sin(radian), 0.0,
              0.0, sin(radian), cos(radian), 0.0,
              0.0, 0.0, 0.0, 1.0
            );
          }

          vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
          vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
          vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
          vec4 taylorInvSqrt(vec4 r) {
            return 1.79284291400159 - 0.85373472095314 * r;
          }
          vec3 fade(vec3 t) { return t * t * t * (t * (t * 6.0 - 15.0) + 10.0); }

          float cnoise(vec3 P) {
            vec3 Pi0 = floor(P);
            vec3 Pi1 = Pi0 + vec3(1.0);
            Pi0 = mod289(Pi0);
            Pi1 = mod289(Pi1);
            vec3 Pf0 = fract(P);
            vec3 Pf1 = Pf0 - vec3(1.0);
            vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
            vec4 iy = vec4(Pi0.yy, Pi1.yy);
            vec4 iz0 = Pi0.zzzz;
            vec4 iz1 = Pi1.zzzz;

            vec4 ixy = permute(permute(ix) + iy);
            vec4 ixy0 = permute(ixy + iz0);
            vec4 ixy1 = permute(ixy + iz1);

            vec4 gx0 = ixy0 * (1.0 / 7.0);
            vec4 gy0 = fract(floor(gx0) * (1.0 / 7.0)) - 0.5;
            gx0 = fract(gx0);
            vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
            vec4 sz0 = step(gz0, vec4(0.0));
            gx0 -= sz0 * (step(0.0, gx0) - 0.5);
            gy0 -= sz0 * (step(0.0, gy0) - 0.5);

            vec4 gx1 = ixy1 * (1.0 / 7.0);
            vec4 gy1 = fract(floor(gx1) * (1.0 / 7.0)) - 0.5;
            gx1 = fract(gx1);
            vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
            vec4 sz1 = step(gz1, vec4(0.0));
            gx1 -= sz1 * (step(0.0, gx1) - 0.5);
            gy1 -= sz1 * (step(0.0, gy1) - 0.5);

            vec3 g000 = vec3(gx0.x, gy0.x, gz0.x);
            vec3 g100 = vec3(gx0.y, gy0.y, gz0.y);
            vec3 g010 = vec3(gx0.z, gy0.z, gz0.z);
            vec3 g110 = vec3(gx0.w, gy0.w, gz0.w);
            vec3 g001 = vec3(gx1.x, gy1.x, gz1.x);
            vec3 g101 = vec3(gx1.y, gy1.y, gz1.y);
            vec3 g011 = vec3(gx1.z, gy1.z, gz1.z);
            vec3 g111 = vec3(gx1.w, gy1.w, gz1.w);

            vec4 norm0 = taylorInvSqrt(
              vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110))
            );
            g000 *= norm0.x;
            g010 *= norm0.y;
            g100 *= norm0.z;
            g110 *= norm0.w;
            vec4 norm1 = taylorInvSqrt(
              vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111))
            );
            g001 *= norm1.x;
            g011 *= norm1.y;
            g101 *= norm1.z;
            g111 *= norm1.w;

            float n000 = dot(g000, Pf0);
            float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
            float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
            float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
            float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
            float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
            float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
            float n111 = dot(g111, Pf1);

            vec3 fade_xyz = fade(Pf0);
            vec4 n_z = mix(
              vec4(n000, n100, n010, n110),
              vec4(n001, n101, n011, n111),
              fade_xyz.z
            );
            vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
            float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x);
            return 2.2 * n_xyz;
          }

          void main() {
            vec3 updatePosition = (rotateMatrixX(radians(90.0)) * vec4(position, 1.0)).xyz;
            float sin1 = sin(radians(updatePosition.x / 128.0 * 90.0));
            vec3 noisePosition = updatePosition + vec3(0.0, 0.0, uTime * -30.0);
            float noise1 = cnoise(noisePosition * 0.08);
            float noise2 = cnoise(noisePosition * 0.06);
            float noise3 = cnoise(noisePosition * 0.4);
            vec3 lastPosition = updatePosition + vec3(
              0.0,
              noise1 * sin1 * 8.0
                + noise2 * sin1 * 8.0
                + noise3 * (abs(sin1) * 2.0 + 0.5)
                + pow(sin1, 2.0) * 40.0,
              0.0
            );

            vPosition = lastPosition;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(lastPosition, 1.0);
          }
        `
        }
        fragmentShader={
          /* glsl */ `
          precision highp float;
          varying vec3 vPosition;

          void main() {
            float opacity = (96.0 - length(vPosition)) / 256.0 * 0.6;
            vec3 color = vec3(0.6);
            gl_FragColor = vec4(color, opacity);
          }
        `
        }
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
    <instancedMesh ref={mesh} args={[undefined, undefined, residues.length]} frustumCulled={false}>
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
  const cameraOffset = useRef({ x: 0, y: 0 });
  const roll = useRef(0);
  const lookTarget = useMemo(() => new THREE.Vector3(), []);

  useFrame((state, delta) => {
    const time = state.clock.elapsedTime;
    const pointerResponse = 1 - Math.exp(-Math.min(delta, 0.05) * 7.2);
    const cameraTargetX = state.pointer.x * 4.6;
    const cameraTargetY = state.pointer.y * 2.8;
    cameraOffset.current.x += (cameraTargetX - cameraOffset.current.x) * pointerResponse;
    cameraOffset.current.y += (cameraTargetY - cameraOffset.current.y) * pointerResponse;

    const pointerMagnitude = Math.min(1, Math.hypot(state.pointer.x, state.pointer.y));
    const idleWeight = 1 - pointerMagnitude;
    const ambientX = Math.sin(time * 0.14) * 0.22 * idleWeight;
    const ambientY = Math.sin(time * 0.11 + 1.3) * 0.14 * idleWeight;
    const ambientLook = Math.sin(time * 0.09 + 0.6) * 0.32 * idleWeight;

    state.camera.position.x = cameraOffset.current.x + ambientX;
    state.camera.position.y = 8.0 + cameraOffset.current.y + ambientY;
    state.camera.position.z = 26;

    lookTarget.set(
      cameraOffset.current.x * 1.55 + ambientLook,
      3.8 + cameraOffset.current.y * 1.35 + ambientY,
      -62,
    );
    state.camera.lookAt(lookTarget);

    const rollTarget = -state.pointer.x * 0.012 + Math.sin(time * 0.08) * 0.002 * idleWeight;
    roll.current += (rollTarget - roll.current) * pointerResponse;
    state.camera.rotateZ(roll.current);
  });

  return null;
}

export function ArcaneFooterField() {
  const containerRef = useRef<HTMLElement | null>(null);
  const [active, setActive] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [appReady, setAppReady] = useState(hasSeenLoader);
  const [hasMounted, setHasMounted] = useState(false);
  const dark = useDarkMode();

  useEffect(() => {
    setReducedMotion(prefersReducedMotion());
    return observeReducedMotion(setReducedMotion);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let pageVisible = isDocumentVisible();
    let inViewport = false;
    const sync = () => {
      setActive(pageVisible && inViewport);
    };
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

  useEffect(() => {
    if (appReady) return;
    const handleReady = () => setAppReady(true);
    window.addEventListener("arcane-app-ready", handleReady);
    return () => window.removeEventListener("arcane-app-ready", handleReady);
  }, [appReady]);

  useEffect(() => {
    if (appReady && active) {
      const timer = setTimeout(() => setHasMounted(true), 800);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [appReady, active]);

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
      className="relative h-[100svh] min-h-[760px] overflow-hidden bg-transparent"
    >
      <div
        data-footer-scene
        className="absolute inset-0 [mask-image:linear-gradient(to_bottom,transparent_0%,black_18%,black_100%)] [-webkit-mask-image:linear-gradient(to_bottom,transparent_0%,black_18%,black_100%)]"
      >
        {hasMounted && (
          <Canvas
            eventSource={containerRef}
            eventPrefix="client"
            camera={{ position: [0, 8.0, 26], fov: 48, near: 0.1, far: 430 }}
            dpr={[1, 1.6]}
            frameloop={active && !reducedMotion ? "always" : "never"}
            gl={{ alpha: false, antialias: true, powerPreference: "high-performance" }}
          >
            <color attach="background" args={[background]} />
            <ambientLight intensity={dark ? 1.7 : 1.0} />
            <hemisphereLight args={["#ffffff", dark ? "#111113" : "#9da1a0", dark ? 1.35 : 0.72]} />
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
        )}
      </div>

      <motion.div
        data-footer-content
        className="absolute inset-x-[6%] bottom-[12%] z-20 flex flex-col items-center justify-end md:inset-x-[8%] md:bottom-[10%]"
        animate={active ? { y: [0, -3, 2, 0] } : { y: 0 }}
        transition={{ duration: 11.5, repeat: Infinity, ease: "easeInOut" }}
      >
        <div
          data-footer-logo
          className={`pointer-events-auto h-[35vh] min-h-[180px] w-full max-w-[1500px] mb-6 md:h-[45vh] md:mb-10 ${textGlow}`}
        >
          <AsciiWordmark text="ARCANE LABS" cell={8} chaosStrength={1.65} />
        </div>

        <div
          data-footer-nav
          className={`w-full max-w-[1320px] text-left ${textGlow}`}
          aria-label="Arcane Labs footer navigation and contact"
        >
          <div className="grid grid-cols-1 gap-y-10 border-t border-current/20 pt-8 sm:grid-cols-2 md:grid-cols-[1.4fr_1fr_1fr_1fr] md:gap-x-12 md:gap-y-0 md:pt-10">
            <div>
              <p className={`label-mono mb-3 ${accentText} ${accentGlow}`}>■ CONTACT</p>
              <a
                href="mailto:hello@arcanelabs.mov"
                className={`block text-xs tracking-[0.08em] hover:opacity-70 md:text-sm ${primaryText}`}
              >
                hello@arcanelabs.mov
              </a>
              <p className={`mt-2 text-[10px] tracking-[0.12em] md:text-xs ${secondaryText}`}>
                WORLDWIDE DIGITAL STUDIO
              </p>
              <p className={`mt-1 text-[10px] tracking-[0.12em] md:text-xs ${secondaryText}`}>
                DESIGN / CODE / MOTION
              </p>
            </div>

            <div>
              <p className={`label-mono mb-3 ${accentText} ${accentGlow}`}>■ INDEX</p>
              <div className={`space-y-2 text-xs tracking-[0.12em] md:text-sm ${primaryText}`}>
                <a href="#works" className="block hover:opacity-70">
                  WORKS
                </a>
                <a href="#top" className="block hover:opacity-70">
                  STUDIO
                </a>
                <a href="#faq" className="block hover:opacity-70">
                  FAQ
                </a>
                <a href="#contact" className="block hover:opacity-70">
                  CONTACT
                </a>
              </div>
            </div>

            <div>
              <p className={`label-mono mb-3 ${accentText} ${accentGlow}`}>■ STUDIO</p>
              <div className={`space-y-2 text-xs tracking-[0.12em] md:text-sm ${primaryText}`}>
                <span className="block">ARCANE LABS</span>
                <span className="block">DEVELOPER STUDIO</span>
                <span className="block">AI / WEB / MOTION</span>
              </div>
            </div>

            <div>
              <p className={`label-mono mb-3 ${accentText} ${accentGlow}`}>■ LEGALS</p>
              <div className={`space-y-2 text-xs tracking-[0.12em] md:text-sm ${primaryText}`}>
                <span className="block">© 2026 ARCANE LABS</span>
                <span className="block">CREATED BY TAUFAN SURC</span>
                <span className={`block ${secondaryText}`}>PRIVACY / IMPRINT</span>
                <a href="#top" className="block hover:opacity-70">
                  :/ BACK TO TOP
                </a>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <div
        data-footer-ticker
        className={`absolute inset-x-0 bottom-[2%] z-30 overflow-hidden border-y border-white/10 bg-black/40 py-2 backdrop-blur-[1px] ${textGlow}`}
      >
        <div className="flex w-max marquee-track">
          {[0, 1, 2, 3].map((key) => (
            <div
              key={key}
              className={`flex items-center px-4 font-mono text-[10px] uppercase tracking-[0.2em] md:px-8 md:text-xs ${
                key % 2 === 0 ? accentText : primaryText
              }`}
            >
              {FOOTER_TICKER.repeat(2)}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

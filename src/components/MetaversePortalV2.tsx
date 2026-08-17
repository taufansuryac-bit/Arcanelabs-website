import { useEffect, useRef } from "react";
import {
  motion,
  useMotionValueEvent,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";
import {
  isDocumentVisible,
  observeDocumentVisibility,
  observeElementVisibility,
  shouldAnimate,
} from "@/lib/animation-runtime";
import { VoxelArcaneLogo } from "./VoxelArcaneLogo";

const DEBRIS = 1120;

const PHRASES = [
  { text: "ENTER THE ARCANE FIELD", range: [0.27, 0.34, 0.41, 0.47] },
  { text: "PIXELS BECOME SPACE", range: [0.43, 0.5, 0.58, 0.64] },
  { text: "BUILD BEYOND THE FRAME", range: [0.6, 0.67, 0.76, 0.82] },
] as const;

function seeded(value: number) {
  const n = Math.sin(value * 127.1 + 311.7) * 43758.5453;
  return n - Math.floor(n);
}

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

function VoxelStormField({ progress }: { progress: MotionValue<number> }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const progressRef = useRef(0);

  useMotionValueEvent(progress, "change", (value) => {
    progressRef.current = value;
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let raf = 0;
    let running = false;
    let pageVisible = isDocumentVisible();
    let inViewport = true;
    let width = 1;
    let height = 1;

    const debris = Array.from({ length: DEBRIS }, (_, index) => ({
      x: (seeded(index + 11) * 2 - 1) * (0.42 + seeded(index + 101) * 1.4),
      y: (seeded(index + 37) * 2 - 1) * (0.38 + seeded(index + 149) * 1.15),
      z: seeded(index + 73),
      seed: seeded(index + 211),
      accent: seeded(index + 289) > 0.84,
      vertical: seeded(index + 347) > 0.72,
    }));

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = (timeMs: number) => {
      if (!running) return;
      raf = requestAnimationFrame(draw);
      ctx.clearRect(0, 0, width, height);

      const p = clamp01(progressRef.current);
      const time = timeMs * 0.001;
      const dark = document.documentElement.classList.contains("dark");
      const ink = dark ? "244,244,238" : "20,20,18";
      const green = dark ? "181,255,88" : "72,126,22";
      const breach = clamp01((p - 0.12) / 0.6);
      const collapse = clamp01((p - 0.84) / 0.16);
      const world = Math.sin(Math.PI * clamp01((p - 0.06) / 0.92));
      if (world < 0.006) return;

      const shockA = Math.sin(Math.PI * clamp01((p - 0.2) / 0.24));
      const shockB = Math.sin(Math.PI * clamp01((p - 0.48) / 0.2));
      const shockwave = Math.max(0, shockA) + Math.max(0, shockB) * 0.82;
      const turbulence = Math.sin(Math.PI * clamp01((p - 0.28) / 0.52));
      const cameraKick = shockwave * shockwave;
      const cx =
        width / 2 +
        Math.sin(time * 4.7 + p * 33) * width * (0.002 + cameraKick * 0.011) +
        Math.sin(time * 0.37) * width * 0.004;
      const cy =
        height / 2 +
        Math.cos(time * 5.2 + p * 29) * height * (0.002 + cameraKick * 0.009) +
        Math.cos(time * 0.31) * height * 0.004;

      const speed = 0.11 + breach * 0.72 + shockwave * 0.62;
      for (const item of debris) {
        const travel =
          (item.z + time * speed * (0.38 + item.seed * 0.92) + p * (2.5 + breach * 4.8)) % 1;
        const depth = travel * travel;
        const perspective = 0.025 + depth * (1.28 + shockwave * 0.7);
        const wobble = Math.sin(time * (1.1 + item.seed * 2.2) + item.seed * 31) * turbulence;
        const blast = shockwave * depth * (28 + item.seed * 92);
        const x =
          cx +
          item.x * width * 0.5 * perspective +
          wobble * 34 * depth +
          Math.sign(item.x || 1) * blast;
        const y =
          cy +
          item.y * height * 0.52 * perspective +
          Math.cos(time * 1.6 + item.seed * 19) * turbulence * 24 * depth +
          Math.sign(item.y || 1) * blast * 0.65;
        if (x < -180 || x > width + 180 || y < -180 || y > height + 180) continue;

        const size = 1.5 + depth * (4.5 + item.seed * 11);
        const stretch = 1 + depth * (2.2 + breach * 7.5 + shockwave * 10.5);
        const alpha =
          Math.min(0.94, world * (0.08 + depth * 0.92)) *
          (1 - collapse * 0.88) *
          (0.72 + item.seed * 0.28);
        ctx.fillStyle = item.accent
          ? `rgba(${green},${alpha.toFixed(3)})`
          : `rgba(${ink},${(alpha * 0.78).toFixed(3)})`;

        if (item.vertical) {
          ctx.fillRect(
            Math.round(x / 2) * 2,
            Math.round(y / 2) * 2,
            Math.max(2, Math.round(size)),
            Math.max(2, Math.round(size * stretch)),
          );
        } else {
          ctx.fillRect(
            Math.round(x / 2) * 2,
            Math.round(y / 2) * 2,
            Math.max(2, Math.round(size * stretch)),
            Math.max(2, Math.round(size)),
          );
        }
      }

      const rupture = Math.sin(Math.PI * clamp01((p - 0.34) / 0.43));
      if (rupture > 0.08) {
        const slices = 8 + Math.round(rupture * 10);
        for (let slice = 0; slice < slices; slice += 1) {
          const seed = seeded(slice + Math.floor(time * 8) * 0.37);
          const horizontal = slice % 3 !== 0;
          const alpha = rupture * (0.025 + seeded(slice + 80) * 0.07);
          ctx.fillStyle = `rgba(${slice % 4 === 0 ? green : ink},${alpha.toFixed(3)})`;
          if (horizontal) {
            const sw = width * (0.04 + seed * 0.34) * rupture;
            ctx.fillRect(
              seeded(slice + 91) * Math.max(1, width - sw),
              (0.08 + seeded(slice + 43) * 0.84) * height,
              sw,
              2 + (slice % 4) * 2,
            );
          } else {
            const sh = height * (0.04 + seed * 0.24) * rupture;
            ctx.fillRect(
              (0.08 + seeded(slice + 53) * 0.84) * width,
              seeded(slice + 17) * Math.max(1, height - sh),
              2 + (slice % 3) * 2,
              sh,
            );
          }
        }
      }

      if (shockwave > 0.1) {
        const flash = Math.min(0.12, shockwave * 0.06);
        const gradient = ctx.createRadialGradient(
          cx,
          cy,
          0,
          cx,
          cy,
          Math.max(width, height) * 0.44,
        );
        gradient.addColorStop(0, `rgba(${green},${flash.toFixed(3)})`);
        gradient.addColorStop(0.22, `rgba(${ink},${(flash * 0.36).toFixed(3)})`);
        gradient.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
      }
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

    resize();
    const disconnectViewport = observeElementVisibility(
      canvas,
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

    window.addEventListener("resize", resize);
    start();
    return () => {
      stop();
      disconnectViewport();
      disconnectDocument();
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden />;
}

function PortalPhrase({
  progress,
  phrase,
}: {
  progress: MotionValue<number>;
  phrase: (typeof PHRASES)[number];
}) {
  const [a, b, c, d] = phrase.range;
  const opacity = useTransform(progress, [a, b, c, d], [0, 1, 1, 0]);
  const y = useTransform(progress, [a, b, c, d], [120, 0, 0, -170]);
  const scale = useTransform(progress, [a, b, c, d], [0.42, 1, 1.08, 4.2]);
  const rotateZ = useTransform(progress, [a, b, c, d], [-4, 0, 0, 3]);
  const blur = useTransform(
    progress,
    [a, b, c, d],
    ["blur(22px)", "blur(0px)", "blur(0px)", "blur(24px)"],
  );

  return (
    <motion.p
      style={{ opacity, y, scale, rotateZ, filter: blur }}
      className="pointer-events-none absolute z-30 max-w-[92vw] text-center font-display text-4xl uppercase leading-[0.84] tracking-[-0.065em] text-foreground md:text-8xl lg:text-9xl"
    >
      {phrase.text}
    </motion.p>
  );
}

/** Portal V2.1 — real 3D voxel mark → violent pixel storm → reassembly, without wireframe rails. */
export function MetaversePortalV2() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end end"] });
  const p = useSpring(scrollYProgress, { stiffness: 92, damping: 22, mass: 0.46 });

  const logoProgress = useTransform(p, [0, 0.2, 0.5, 0.8, 1], [0, 0.24, 0.72, 0.94, 1]);
  const logoOpacity = useTransform(p, [0, 0.14, 0.32, 0.72, 0.88, 1], [1, 1, 0.1, 0.035, 1, 1]);
  const logoScale = useTransform(
    p,
    [0, 0.18, 0.34, 0.58, 0.78, 0.9, 1],
    [1.05, 1.28, 3.9, 3.2, 2.4, 1.22, 1],
  );
  const logoRotate = useTransform(p, [0, 0.32, 0.58, 0.82, 1], [0, 2.5, -4.5, 2.2, 0]);
  const environmentOpacity = useTransform(p, [0, 0.08, 0.18, 0.88, 1], [0, 0.3, 1, 1, 0]);
  const finalOpacity = useTransform(p, [0.86, 0.94, 1], [0, 1, 1]);
  const finalY = useTransform(p, [0.86, 1], [46, 0]);

  return (
    <section ref={sectionRef} className="relative z-10 h-[680vh] border-t border-border">
      <div className="sticky top-0 flex h-screen items-center justify-center overflow-hidden bg-background">
        <motion.div style={{ opacity: environmentOpacity }} className="absolute inset-0">
          <VoxelStormField progress={p} />
        </motion.div>

        <motion.div
          style={{ opacity: logoOpacity, scale: logoScale, rotate: logoRotate }}
          className="absolute z-20 h-[70vh] w-[94vw] max-w-[1280px]"
        >
          <VoxelArcaneLogo progress={logoProgress} className="h-full w-full" />
        </motion.div>

        {PHRASES.map((phrase) => (
          <PortalPhrase key={phrase.text} progress={p} phrase={phrase} />
        ))}

        <motion.div
          style={{ opacity: finalOpacity, y: finalY }}
          className="absolute bottom-8 left-0 right-0 z-40 flex items-end justify-between px-5 md:px-8"
        >
          <p className="font-mono text-[9px] uppercase tracking-[0.28em] text-muted-foreground">
            Arcane Labs / Field stabilized
          </p>
          <p className="font-display text-2xl uppercase tracking-[-0.05em] md:text-5xl">
            Arcane Labs
          </p>
        </motion.div>
      </div>
    </section>
  );
}

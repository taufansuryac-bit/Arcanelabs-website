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
import { PORTAL_SCALE_INPUT, PORTAL_SCALE_OUTPUT } from "@/lib/voxel-scene-model";
import { VoxelChaosLogoScene } from "./VoxelChaosLogoScene";

const PARTICLE_COUNT = 1120;

const PHRASES = [
  { text: "ENTER THE ARCANE FIELD", range: [0.28, 0.35, 0.43, 0.49] },
  { text: "PIXELS BECOME SPACE", range: [0.46, 0.53, 0.61, 0.67] },
  { text: "BUILD BEYOND THE FRAME", range: [0.64, 0.71, 0.79, 0.84] },
] as const;

function seeded(value: number) {
  const n = Math.sin(value * 127.1 + 311.7) * 43758.5453;
  return n - Math.floor(n);
}

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

function SquareDepthField({ progress }: { progress: MotionValue<number> }) {
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

    const particles = Array.from({ length: PARTICLE_COUNT }, (_, index) => ({
      x: seeded(index + 11) * 2 - 1,
      y: seeded(index + 37) * 2 - 1,
      z: seeded(index + 73),
      seed: seeded(index + 127),
      accent: seeded(index + 241) > 0.9,
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
      const ink = dark ? "236,239,231" : "26,28,24";
      const green = dark ? "170,243,84" : "72,123,26";
      const fieldIn = clamp01((p - 0.12) / 0.18);
      const fieldOut = clamp01((p - 0.84) / 0.14);
      const field = fieldIn * (1 - fieldOut);
      if (field < 0.01) return;

      const cx = width * 0.5 + Math.sin(time * 0.28) * width * 0.003;
      const cy = height * 0.5 + Math.cos(time * 0.24) * height * 0.003;
      const speed = 0.035 + field * 0.085;

      for (const particle of particles) {
        const travel = (particle.z + time * speed * (0.72 + particle.seed * 0.42) + p * 1.8) % 1;
        const depth = travel * travel;
        const perspective = 0.035 + depth * 1.32;
        const driftX = Math.sin(time * 0.42 + particle.seed * 31) * (1 - depth) * 2.2;
        const driftY = Math.cos(time * 0.37 + particle.seed * 19) * (1 - depth) * 1.8;
        const x = cx + particle.x * width * 0.48 * perspective + driftX;
        const y = cy + particle.y * height * 0.5 * perspective + driftY;
        if (x < -12 || x > width + 12 || y < -12 || y > height + 12) continue;

        const particleSize = Math.min(5.4, 0.8 + depth * (2.4 + particle.seed * 2.8));
        const alpha = Math.min(0.9, field * (0.08 + depth * 0.82) * (0.76 + particle.seed * 0.24));
        ctx.fillStyle = particle.accent
          ? `rgba(${green},${alpha.toFixed(3)})`
          : `rgba(${ink},${(alpha * 0.86).toFixed(3)})`;
        const snappedX = Math.round(x);
        const snappedY = Math.round(y);
        const size = Math.max(1, Math.round(particleSize));
        ctx.fillRect(snappedX, snappedY, size, size);
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
      { rootMargin: "420px 0px" },
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
  const y = useTransform(progress, [a, b, c, d], [34, 0, 0, -38]);
  const scale = useTransform(progress, [a, b, c, d], [0.92, 1, 1.02, 1.16]);
  const blur = useTransform(
    progress,
    [a, b, c, d],
    ["blur(10px)", "blur(0px)", "blur(0px)", "blur(12px)"],
  );

  return (
    <motion.p
      style={{ opacity, y, scale, filter: blur }}
      className="pointer-events-none absolute z-30 max-w-[84vw] text-center font-display text-3xl uppercase leading-[0.9] tracking-[-0.055em] text-foreground md:text-6xl lg:text-7xl"
    >
      {phrase.text}
    </motion.p>
  );
}

/** V2.2: clean dimensional particle field — small square particles, no light trails. */
export function MetaversePortalV2() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end end"] });
  const p = useSpring(scrollYProgress, { stiffness: 110, damping: 26, mass: 0.35 });

  const environmentOpacity = useTransform(p, [0, 0.08, 0.18, 0.86, 1], [0, 0.2, 1, 1, 0]);
  const logoOpacity = useTransform(p, [0, 0.28, 0.5, 0.76, 0.9, 1], [1, 1, 0.08, 0.08, 1, 1]);
  const logoScale = useTransform(p, PORTAL_SCALE_INPUT, PORTAL_SCALE_OUTPUT);
  const finalOpacity = useTransform(p, [0.88, 0.95, 1], [0, 1, 1]);
  const finalY = useTransform(p, [0.88, 1], [22, 0]);

  return (
    <section ref={sectionRef} className="relative z-10 h-[620vh] border-t border-border">
      <div className="sticky top-0 flex h-screen items-center justify-center overflow-hidden bg-background">
        <motion.div style={{ opacity: environmentOpacity }} className="absolute inset-0">
          <SquareDepthField progress={p} />
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(circle at 50% 50%, color-mix(in oklab,var(--neon) 5%,transparent), transparent 32%, color-mix(in oklab,var(--background) 92%,transparent) 88%)",
            }}
          />
        </motion.div>

        <motion.div
          style={{ opacity: logoOpacity, scale: logoScale }}
          className="absolute inset-0 z-20"
        >
          <VoxelChaosLogoScene mode="portal" progress={p} interactive className="h-full w-full" />
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

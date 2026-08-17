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

const DEBRIS = 620;
const nestedFrames = 28;

const PHRASES = [
  { text: "ENTER THE ARCANE FIELD", range: [0.3, 0.38, 0.46, 0.52] },
  { text: "PIXELS BECOME SPACE", range: [0.46, 0.53, 0.61, 0.67] },
  { text: "BUILD BEYOND THE FRAME", range: [0.62, 0.69, 0.77, 0.83] },
] as const;

function seeded(value: number) {
  const n = Math.sin(value * 127.1 + 311.7) * 43758.5453;
  return n - Math.floor(n);
}

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

function RectilinearField({ progress }: { progress: MotionValue<number> }) {
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
    let width = 0;
    let height = 0;

    const debris = Array.from({ length: DEBRIS }, (_, index) => {
      const sx = seeded(index + 11);
      const sy = seeded(index + 37);
      const sz = seeded(index + 73);
      return {
        x: (sx * 2 - 1) * (0.48 + seeded(index + 101) * 1.25),
        y: (sy * 2 - 1) * (0.42 + seeded(index + 149) * 0.95),
        z: sz,
        seed: seeded(index + 211),
        green: seeded(index + 289) > 0.82,
      };
    });

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const drawFrameCorners = (
      cx: number,
      cy: number,
      frameWidth: number,
      frameHeight: number,
      corner: number,
    ) => {
      const left = cx - frameWidth / 2;
      const right = cx + frameWidth / 2;
      const top = cy - frameHeight / 2;
      const bottom = cy + frameHeight / 2;
      ctx.beginPath();
      ctx.moveTo(left, top + corner);
      ctx.lineTo(left, top);
      ctx.lineTo(left + corner, top);
      ctx.moveTo(right - corner, top);
      ctx.lineTo(right, top);
      ctx.lineTo(right, top + corner);
      ctx.moveTo(right, bottom - corner);
      ctx.lineTo(right, bottom);
      ctx.lineTo(right - corner, bottom);
      ctx.moveTo(left + corner, bottom);
      ctx.lineTo(left, bottom);
      ctx.lineTo(left, bottom - corner);
      ctx.stroke();
    };

    const draw = (timeMs: number) => {
      if (!running) return;
      raf = requestAnimationFrame(draw);
      ctx.clearRect(0, 0, width, height);

      const p = clamp01(progressRef.current);
      const time = timeMs * 0.001;
      const dark = document.documentElement.classList.contains("dark");
      const ink = dark ? "245,245,240" : "16,16,16";
      const green = dark ? "185,255,92" : "76,124,25";
      const cx = width / 2 + Math.sin(time * 0.38) * width * 0.006;
      const cy = height / 2 + Math.cos(time * 0.31) * height * 0.005;
      const breach = clamp01((p - 0.22) / 0.52);
      const collapse = clamp01((p - 0.82) / 0.18);
      const world = Math.sin(Math.PI * clamp01((p - 0.12) / 0.82));
      if (world < 0.01) return;

      // Perspective rails: a rectilinear spatial field, deliberately not radial rings.
      ctx.lineWidth = 1;
      for (let i = -8; i <= 8; i += 1) {
        const x = cx + i * (width / 15);
        ctx.strokeStyle = `rgba(${green},${(world * 0.055).toFixed(3)})`;
        ctx.beginPath();
        ctx.moveTo(cx + (x - cx) * 0.035, cy - height * 0.025);
        ctx.lineTo(x, i % 2 === 0 ? 0 : height);
        ctx.stroke();
      }
      for (let i = -5; i <= 5; i += 1) {
        const y = cy + i * (height / 9);
        ctx.strokeStyle = `rgba(${ink},${(world * 0.038).toFixed(3)})`;
        ctx.beginPath();
        ctx.moveTo(cx - width * 0.035, cy + (y - cy) * 0.035);
        ctx.lineTo(i % 2 === 0 ? 0 : width, y);
        ctx.stroke();
      }

      // Nested rectangular depth gates. Each frame advances toward the camera.
      for (let frame = 0; frame < nestedFrames; frame += 1) {
        const travel = (frame / nestedFrames + time * 0.055 + p * 2.45) % 1;
        const depth = travel * travel;
        const frameWidth = 36 + depth * width * 1.42;
        const frameHeight = 22 + depth * height * 1.34;
        const alpha = (1 - travel) * world * (0.1 + depth * 0.38);
        const snap = 4;
        const fw = Math.round(frameWidth / snap) * snap;
        const fh = Math.round(frameHeight / snap) * snap;
        ctx.strokeStyle =
          frame % 5 === 0
            ? `rgba(${green},${alpha.toFixed(3)})`
            : `rgba(${ink},${(alpha * 0.72).toFixed(3)})`;
        ctx.lineWidth = frame % 5 === 0 ? 1.6 : 1;
        const corner = Math.max(8, Math.min(70, fw * 0.08));
        drawFrameCorners(cx, cy, fw, fh, corner);
      }

      // Central dimensional tear: stacked apertures create a square breach through the mark.
      if (breach > 0.03 && collapse < 0.98) {
        for (let layer = 0; layer < 7; layer += 1) {
          const lp = clamp01(breach * 1.35 - layer * 0.075);
          if (lp <= 0) continue;
          const apertureWidth = 28 + lp * lp * width * (0.16 + layer * 0.028);
          const apertureHeight = 18 + lp * lp * height * (0.14 + layer * 0.024);
          ctx.strokeStyle =
            layer % 2 === 0
              ? `rgba(${green},${(0.18 + lp * 0.28).toFixed(3)})`
              : `rgba(${ink},${(0.09 + lp * 0.18).toFixed(3)})`;
          ctx.lineWidth = 1 + lp;
          ctx.strokeRect(
            Math.round(cx - apertureWidth / 2),
            Math.round(cy - apertureHeight / 2),
            Math.round(apertureWidth),
            Math.round(apertureHeight),
          );
        }
      }

      // Voxel/debris world: perspective-projected rectangular blocks and data streaks.
      const speed = 0.11 + breach * 0.38;
      for (const item of debris) {
        const travel = (item.z + time * speed * (0.55 + item.seed) + p * 2.9) % 1;
        const depth = travel * travel;
        const perspective = 0.08 + depth * 1.28;
        const x = cx + item.x * width * 0.48 * perspective;
        const y = cy + item.y * height * 0.52 * perspective;
        if (x < -80 || x > width + 80 || y < -80 || y > height + 80) continue;

        const size = 2 + depth * (4 + item.seed * 8);
        const stretch = 1 + depth * breach * (3 + item.seed * 7);
        const alpha = Math.min(0.92, world * (0.1 + depth * 0.85)) * (1 - collapse * 0.82);
        ctx.fillStyle = item.green
          ? `rgba(${green},${alpha.toFixed(3)})`
          : `rgba(${ink},${(alpha * 0.78).toFixed(3)})`;
        ctx.fillRect(
          Math.round(x / 2) * 2,
          Math.round(y / 2) * 2,
          Math.max(2, Math.round(size * stretch)),
          Math.max(2, Math.round(size)),
        );
      }

      // Spatial slicing: rare horizontal data ruptures near peak dimensional travel.
      const sliceStrength = Math.sin(Math.PI * clamp01((p - 0.38) / 0.42));
      if (sliceStrength > 0.08) {
        for (let slice = 0; slice < 5; slice += 1) {
          const sy = ((seeded(slice + Math.floor(time * 3)) * 0.78 + 0.11) * height) | 0;
          const sw = width * (0.08 + seeded(slice + 49) * 0.28) * sliceStrength;
          const sx = seeded(slice + 91) * Math.max(1, width - sw);
          ctx.fillStyle = `rgba(${slice % 2 === 0 ? green : ink},${(sliceStrength * 0.055).toFixed(3)})`;
          ctx.fillRect(sx, sy, sw, 2 + (slice % 3) * 2);
        }
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

function PortalPhrase({ progress, phrase }: { progress: MotionValue<number>; phrase: (typeof PHRASES)[number] }) {
  const [a, b, c, d] = phrase.range;
  const opacity = useTransform(progress, [a, b, c, d], [0, 1, 1, 0]);
  const y = useTransform(progress, [a, b, c, d], [42, 0, 0, -46]);
  const scale = useTransform(progress, [a, d], [0.86, 1.12]);
  const blur = useTransform(progress, [a, b, c, d], ["blur(16px)", "blur(0px)", "blur(0px)", "blur(18px)"]);

  return (
    <motion.p
      style={{ opacity, y, scale, filter: blur }}
      className="pointer-events-none absolute z-30 max-w-[82vw] text-center font-display text-3xl uppercase leading-[0.88] tracking-[-0.055em] text-foreground md:text-7xl lg:text-8xl"
    >
      {phrase.text}
    </motion.p>
  );
}

/** Portal V2 — logo gateway → voxel fracture → rectilinear pixel metaverse → reassembly. */
export function MetaversePortalV2() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end end"] });
  const p = useSpring(scrollYProgress, { stiffness: 74, damping: 26, mass: 0.52 });

  const logoProgress = useTransform(p, [0, 0.24, 0.54, 0.82, 1], [0, 0.18, 0.68, 0.9, 1]);
  const logoOpacity = useTransform(p, [0, 0.18, 0.38, 0.68, 0.86, 1], [1, 1, 0.08, 0.05, 1, 1]);
  const logoScale = useTransform(p, [0, 0.22, 0.4, 0.76, 0.9, 1], [0.88, 1.06, 2.6, 2.2, 1.05, 0.92]);
  const logoRotate = useTransform(p, [0, 0.42, 0.78, 1], [0, 3.5, -2.5, 0]);
  const environmentOpacity = useTransform(p, [0, 0.1, 0.22, 0.86, 1], [0, 0.3, 1, 1, 0]);
  const finalOpacity = useTransform(p, [0.86, 0.94, 1], [0, 1, 1]);
  const finalY = useTransform(p, [0.86, 1], [30, 0]);

  return (
    <section ref={sectionRef} className="relative z-10 h-[680vh] border-t border-border">
      <div className="sticky top-0 flex h-screen items-center justify-center overflow-hidden bg-background [perspective:1000px]">
        <motion.div style={{ opacity: environmentOpacity }} className="absolute inset-0">
          <RectilinearField progress={p} />
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(circle at 50% 50%, color-mix(in oklab,var(--neon) 10%,transparent), transparent 28%, color-mix(in oklab,var(--background) 88%,transparent) 86%)",
            }}
          />
        </motion.div>

        <motion.div
          style={{ opacity: logoOpacity, scale: logoScale, rotate: logoRotate }}
          className="absolute z-20 h-[46vh] w-[68vw] max-w-[780px]"
        >
          <VoxelArcaneLogo progress={logoProgress} className="h-full w-full" />
        </motion.div>

        {PHRASES.map((phrase) => (
          <PortalPhrase key={phrase.text} progress={p} phrase={phrase} />
        ))}

        <motion.div
          style={{ opacity: finalOpacity, y: finalY }}
          className="absolute bottom-8 left-0 right-0 z-40 flex items-center justify-between px-5 md:px-8"
        >
          <span className="label-mono">ARCANE LABS // DIMENSION SYNC</span>
          <span className="label-mono">FIELD 04 / ONLINE</span>
        </motion.div>
      </div>
    </section>
  );
}

import { useEffect, useRef } from "react";
import {
  motion,
  useMotionValueEvent,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";
import { PixelLogo } from "./PixelLogo";
import { ScrambleText } from "./ScrambleText";

const PHRASES = [
  { at: [0.2, 0.28, 0.4, 0.46], text: "FROM FIRST FRAME" },
  { at: [0.4, 0.48, 0.58, 0.64], text: "THROUGH THE MACHINE" },
  { at: [0.58, 0.66, 0.74, 0.8], text: "INTO SOMETHING ARCANE" },
];

/**
 * Pixel hyperspace: streaking pixel blocks, a wireframe tunnel of pixel rings
 * and neon debris, all driven by the section's scroll progress.
 */
function PixelWarp({ p }: { p: MotionValue<number> }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const prog = useRef(0);

  useMotionValueEvent(p, "change", (v) => {
    prog.current = v;
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let w = 0;
    let h = 0;

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = r.width;
      h = r.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const N = 460;
    const stars = Array.from({ length: N }, (_, i) => {
      const s = Math.sin(i * 127.1) * 43758.5453;
      const a = Math.sin(i * 311.7) * 43758.5453;
      const n = Math.sin(i * 74.7) * 43758.5453;
      return {
        angle: (a - Math.floor(a)) * Math.PI * 2,
        seed: s - Math.floor(s),
        neon: n - Math.floor(n) > 0.82,
      };
    });

    const draw = (t: number) => {
      raf = requestAnimationFrame(draw);
      ctx.clearRect(0, 0, w, h);

      const v = Math.max(0, Math.min(1, prog.current));
      const intensity = Math.sin(Math.PI * v);
      if (intensity < 0.02) return;

      const time = t * 0.001;
      const dark = document.documentElement.classList.contains("dark");
      const ink = dark ? "255,255,255" : "20,20,20";
      const flashInk = dark ? "255,255,255" : "0,0,0";
      const shake = intensity * 14;
      const cx = w / 2 + Math.sin(time * 23) * shake * 0.35;
      const cy = h / 2 + Math.cos(time * 19) * shake * 0.35;
      const maxR = Math.hypot(w / 2, h / 2);
      const cell = 5;
      const speed = 0.18 + intensity * 1.1;

      // ── pixel tunnel rings ────────────────────────────────
      ctx.lineWidth = 1;
      for (let k = 0; k < 14; k++) {
        const q = ((k / 14 + time * speed * 0.5) % 1) ** 2.2;
        const r = q * maxR * 1.5;
        if (r < 8) continue;
        const alpha = (1 - q) * intensity * 0.5;
        const sides = 28;
        ctx.beginPath();
        for (let i = 0; i <= sides; i++) {
          const a = (i / sides) * Math.PI * 2 + time * 0.15;
          const px = Math.round((cx + Math.cos(a) * r) / cell) * cell;
          const py = Math.round((cy + Math.sin(a) * r * 0.7) / cell) * cell;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.strokeStyle = `rgba(180,255,120,${(alpha * 0.5).toFixed(3)})`;
        ctx.stroke();
      }

      // ── streaking pixel blocks ────────────────────────────
      for (const s of stars) {
        const travel = (s.seed + time * (0.16 + s.seed * 0.35) * (0.6 + intensity) + v * 2.1) % 1;
        const r = travel * travel * maxR * 1.35;
        const x = cx + Math.cos(s.angle) * r;
        const y = cy + Math.sin(s.angle) * r * 0.72;
        const len = Math.max(cell, cell * travel * (6 + intensity * 14));
        const alpha = Math.min(1, travel * 1.7) * intensity;
        ctx.save();
        ctx.translate(Math.round(x / cell) * cell, Math.round(y / cell) * cell);
        ctx.rotate(s.angle);
        ctx.fillStyle = s.neon
          ? `rgba(178,255,89,${(alpha * 0.9).toFixed(3)})`
          : `rgba(${ink},${(alpha * 0.85).toFixed(3)})`;
        ctx.fillRect(0, 0, Math.round(len), cell);
        ctx.restore();
      }

      // ── scanline sweep + strobe flash ─────────────────────
      const sweepY = ((time * 0.35) % 1) * h;
      ctx.fillStyle = `rgba(178,255,89,${(0.07 * intensity).toFixed(3)})`;
      ctx.fillRect(0, sweepY, w, 3);

      const flash = Math.max(0, Math.sin(time * 6.3) - 0.965) * 12 * intensity;
      if (flash > 0) {
        ctx.fillStyle = `rgba(${flashInk},${Math.min(0.22, flash).toFixed(3)})`;
        ctx.fillRect(0, 0, w, h);
      }
    };

    raf = requestAnimationFrame(draw);
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden />;
}

function Phrase({ p, phrase }: { p: MotionValue<number>; phrase: (typeof PHRASES)[number] }) {
  const [a, b, c, d] = phrase.at as [number, number, number, number];
  const opacity = useTransform(p, [a, b, c, d], [0, 1, 1, 0]);
  const scale = useTransform(p, [a, d], [0.7, 1.9]);
  const z = useTransform(p, [a, d], [-420, 320]);
  const blur = useTransform(p, [a, b, c, d], ["blur(22px)", "blur(0px)", "blur(0px)", "blur(26px)"]);
  const skew = useTransform(p, [a, b, d], [-9, 0, 7]);

  return (
    <motion.p
      style={{ opacity, scale, z, filter: blur, skewX: skew }}
      className="absolute px-6 text-center font-display text-3xl uppercase leading-[0.95] text-foreground drop-shadow-[0_0_28px_var(--neon)] md:text-7xl"
    >
      {phrase.text}
    </motion.p>
  );
}

/**
 * Pre-footer scroll journey: the mark rushes past the camera, the viewer falls
 * through a pixel dimension with shifting statements, and the mark reassembles.
 */
export function MetaversePortal() {
  const ref = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const p = useSpring(scrollYProgress, { stiffness: 80, damping: 24, mass: 0.4 });

  // outbound logo: sits centred, then rushes past the camera
  const outScale = useTransform(p, [0, 0.06, 0.24], [1, 1.15, 46]);
  const outOpacity = useTransform(p, [0, 0.08, 0.22], [1, 1, 0]);
  const outBlur = useTransform(p, [0, 0.14, 0.24], ["blur(0px)", "blur(3px)", "blur(28px)"]);
  const outRotate = useTransform(p, [0, 0.24], [0, 42]);

  // inbound logo: reassembles at the end of the journey
  const inScale = useTransform(p, [0.82, 0.95, 1], [26, 1.06, 1]);
  const inOpacity = useTransform(p, [0.8, 0.9, 1], [0, 1, 1]);
  const inBlur = useTransform(p, [0.82, 0.95], ["blur(24px)", "blur(0px)"]);
  const inRotate = useTransform(p, [0.82, 1], [-30, 0]);

  const vignette = useTransform(p, [0, 0.25, 0.75, 1], [0, 0.85, 0.85, 0]);
  const chroma = useTransform(p, [0, 0.3, 0.7, 1], [0, 0.5, 0.5, 0]);
  const gridScale = useTransform(p, [0, 0.5, 1], [1, 2.6, 1]);
  const gridOpacity = useTransform(p, [0, 0.2, 0.8, 1], [0, 0.5, 0.5, 0]);

  return (
    <section ref={ref} className="relative z-10 line-top h-[640vh]">
      <div className="sticky top-0 flex h-screen items-center justify-center overflow-hidden [perspective:900px]">
        {/* rushing pixel grid floor/ceiling */}
        <motion.div
          aria-hidden
          style={{ scale: gridScale, opacity: gridOpacity }}
          className="bg-grid pointer-events-none absolute inset-[-40%]"
        />

        <PixelWarp p={p} />

        {/* neon chroma bloom from the centre */}
        <motion.div
          aria-hidden
          style={{ opacity: chroma }}
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,color-mix(in_oklab,var(--neon)_28%,transparent)_0%,transparent_45%)] mix-blend-screen"
        />

        <motion.div
          aria-hidden
          style={{ opacity: vignette }}
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_28%,var(--background)_92%)]"
        />

        <motion.div
          style={{ scale: outScale, opacity: outOpacity, filter: outBlur, rotate: outRotate }}
          className="absolute"
        >
          <PixelLogo className="h-44 w-44 md:h-72 md:w-72" />
        </motion.div>

        {PHRASES.map((phrase) => (
          <Phrase key={phrase.text} p={p} phrase={phrase} />
        ))}

        <motion.div
          style={{ scale: inScale, opacity: inOpacity, filter: inBlur, rotate: inRotate }}
          className="absolute flex flex-col items-center gap-6"
        >
          <PixelLogo className="h-44 w-44 md:h-72 md:w-72" />
          <ScrambleText text="ARCANE LABS" className="label-mono text-foreground" />
        </motion.div>
      </div>
    </section>
  );
}

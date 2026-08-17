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

/** Pixel-square hyperspace, driven by the section's scroll progress. */
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

    const N = 220;
    const stars = Array.from({ length: N }, (_, i) => {
      const s = Math.sin(i * 127.1) * 43758.5453;
      const a = Math.sin(i * 311.7) * 43758.5453;
      return {
        angle: (a - Math.floor(a)) * Math.PI * 2,
        seed: s - Math.floor(s),
      };
    });

    const draw = (t: number) => {
      raf = requestAnimationFrame(draw);
      ctx.clearRect(0, 0, w, h);

      // intensity ramps up mid-journey, calms at both ends
      const v = prog.current;
      const intensity = Math.max(0, Math.min(1, Math.sin(Math.PI * Math.min(1, Math.max(0, v)))));
      if (intensity < 0.02) return;

      const cx = w / 2;
      const cy = h / 2;
      const time = t * 0.001;
      const maxR = Math.hypot(cx, cy);
      const cell = 5;

      for (const s of stars) {
        const travel = (s.seed + time * (0.14 + s.seed * 0.3) + v * 1.6) % 1;
        const r = travel * travel * maxR;
        const x = cx + Math.cos(s.angle) * r;
        const y = cy + Math.sin(s.angle) * r * 0.72;
        const size = Math.max(cell, cell * travel * 4);
        const alpha = Math.min(1, travel * 1.6) * intensity * 0.85;
        ctx.fillStyle = `rgba(255,255,255,${alpha.toFixed(3)})`;
        ctx.fillRect(
          Math.round(x / cell) * cell,
          Math.round(y / cell) * cell,
          Math.round(size),
          cell,
        );
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
  const scale = useTransform(p, [a, d], [0.86, 1.35]);
  const blur = useTransform(p, [a, b, c, d], ["blur(12px)", "blur(0px)", "blur(0px)", "blur(16px)"]);

  return (
    <motion.p
      style={{ opacity, scale, filter: blur }}
      className="absolute px-6 text-center font-display text-3xl uppercase leading-[0.95] md:text-7xl"
    >
      {phrase.text}
    </motion.p>
  );
}

/**
 * Pre-footer scroll journey: the mark zooms out of the screen, the viewer
 * travels through a pixel warp with shifting statements, and the mark
 * reassembles on the other side.
 */
export function MetaversePortal() {
  const ref = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const p = useSpring(scrollYProgress, { stiffness: 80, damping: 24, mass: 0.4 });

  // outbound logo: sits centred, then rushes past the camera
  const outScale = useTransform(p, [0, 0.06, 0.24], [1, 1.1, 26]);
  const outOpacity = useTransform(p, [0, 0.08, 0.22], [1, 1, 0]);
  const outBlur = useTransform(p, [0, 0.14, 0.24], ["blur(0px)", "blur(2px)", "blur(20px)"]);

  // inbound logo: reassembles at the end of the journey
  const inScale = useTransform(p, [0.82, 0.95, 1], [18, 1.06, 1]);
  const inOpacity = useTransform(p, [0.8, 0.9, 1], [0, 1, 1]);
  const inBlur = useTransform(p, [0.82, 0.95], ["blur(18px)", "blur(0px)"]);

  const vignette = useTransform(p, [0, 0.25, 0.75, 1], [0, 0.55, 0.55, 0]);

  return (
    <section ref={ref} className="relative z-10 line-top h-[560vh]">
      <div className="sticky top-0 flex h-screen items-center justify-center overflow-hidden">
        <PixelWarp p={p} />

        <motion.div
          aria-hidden
          style={{ opacity: vignette }}
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_35%,var(--background)_95%)]"
        />

        <motion.div
          style={{ scale: outScale, opacity: outOpacity, filter: outBlur }}
          className="absolute text-foreground"
        >
          <PixelLogo className="h-24 w-24 md:h-32 md:w-32" />
        </motion.div>

        {PHRASES.map((phrase) => (
          <Phrase key={phrase.text} p={p} phrase={phrase} />
        ))}

        <motion.div
          style={{ scale: inScale, opacity: inOpacity, filter: inBlur }}
          className="absolute flex flex-col items-center gap-6 text-foreground"
        >
          <PixelLogo className="h-24 w-24 md:h-32 md:w-32" />
          <ScrambleText text="ARCANE LABS" className="label-mono text-foreground" />
        </motion.div>
      </div>
    </section>
  );
}

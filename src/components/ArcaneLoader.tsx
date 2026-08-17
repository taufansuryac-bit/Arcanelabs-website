import { useEffect, useState } from "react";
import { motion, useMotionValue } from "motion/react";
import { VoxelArcaneLogo } from "./VoxelArcaneLogo";

type ArcaneLoaderProps = {
  onComplete: () => void;
};

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
const smooth = (value: number) => {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
};

/** Clean voxel loader: scattered cubes assemble, hold, then dissolve into the page. */
export function ArcaneLoader({ onComplete }: ArcaneLoaderProps) {
  const [visible, setVisible] = useState(true);
  const progress = useMotionValue(0);
  const opacity = useMotionValue(1);
  const scale = useMotionValue(0.92);
  const labelOpacity = useMotionValue(0);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (sessionStorage.getItem("arcane-loader-seen") === "1") {
      setVisible(false);
      onComplete();
      return;
    }

    const previousOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    let raf = 0;
    let startedAt = 0;
    let cancelled = false;

    const finish = () => {
      if (cancelled) return;
      sessionStorage.setItem("arcane-loader-seen", "1");
      document.documentElement.style.overflow = previousOverflow;
      setVisible(false);
      onComplete();
    };

    const tick = (now: number) => {
      if (cancelled) return;
      if (!startedAt) startedAt = now;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const total = reduced ? 720 : 2350;
      const p = clamp01((now - startedAt) / total);

      const assemble = smooth(p / 0.68);
      const exit = smooth((p - 0.82) / 0.18);
      const breathe = Math.sin(Math.PI * clamp01((p - 0.54) / 0.3));

      progress.set(assemble * (1 - exit * 0.08));
      opacity.set(1 - exit);
      scale.set(0.92 + assemble * 0.12 + breathe * 0.015 + exit * 0.1);
      labelOpacity.set(smooth((p - 0.16) / 0.22) * (1 - exit));

      if (p < 1) raf = requestAnimationFrame(tick);
      else finish();
    };

    raf = requestAnimationFrame(tick);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      document.documentElement.style.overflow = previousOverflow;
    };
  }, [labelOpacity, onComplete, opacity, progress, scale]);

  if (!visible) return null;

  return (
    <motion.div
      style={{ opacity }}
      className="fixed inset-0 z-[100] overflow-hidden bg-background"
      aria-label="Loading Arcane Labs"
    >
      <div className="absolute inset-0 bg-grid opacity-35" aria-hidden />
      <motion.div
        style={{ scale }}
        className="absolute left-1/2 top-1/2 h-[72vh] w-[92vw] max-w-[1100px] -translate-x-1/2 -translate-y-1/2"
      >
        <VoxelArcaneLogo
          progress={progress}
          mode="loader"
          interactive={false}
          className="h-full w-full"
        />
      </motion.div>

      <motion.div
        style={{ opacity: labelOpacity }}
        className="pointer-events-none absolute bottom-6 left-6 font-mono text-[9px] uppercase tracking-[0.32em] text-muted-foreground"
      >
        Arcane Labs / Voxel field online
      </motion.div>
    </motion.div>
  );
}

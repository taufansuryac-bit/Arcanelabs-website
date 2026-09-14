import { useCallback, useEffect, useRef, useState } from "react";
import { VoxelChaosLogoScene } from "./VoxelChaosLogoScene";

type ArcaneLoaderProps = {
  onComplete: () => void;
};

/** V2.2 loader: voxel-chaos-logo scatter -> convergence -> clean crossfade into the site. */
export function ArcaneLoader({ onComplete }: ArcaneLoaderProps) {
  const [visible, setVisible] = useState(true);
  const [exiting, setExiting] = useState(false);
  const completedRef = useRef(false);
  const exitTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem("arcane-loader-seen") === "1") {
      completedRef.current = true;
      setVisible(false);
      onComplete();
      return;
    }

    const previousOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = previousOverflow;
      if (exitTimerRef.current !== null) window.clearTimeout(exitTimerRef.current);
    };
  }, [onComplete]);

  const finish = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    sessionStorage.setItem("arcane-loader-seen", "1");
    document.documentElement.style.overflow = "";
    onComplete();
    setExiting(true);
    exitTimerRef.current = window.setTimeout(() => {
      setVisible(false);
      window.dispatchEvent(new Event("arcane-app-ready"));
    }, 420);
  }, [onComplete]);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] overflow-hidden bg-background transition-opacity duration-[420ms] ease-out ${
        exiting ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
      aria-label="Loading Arcane Labs"
    >
      <div className="absolute inset-0 bg-grid opacity-25" aria-hidden />
      <div className="absolute inset-0">
        <VoxelChaosLogoScene
          mode="loader"
          durationMs={3200}
          onComplete={finish}
          interactive
          className="h-full w-full"
        />
      </div>
      <div className="pointer-events-none absolute bottom-6 left-6 font-mono text-[9px] uppercase tracking-[0.32em] text-muted-foreground/55">
        Arcane Labs / assembling field
      </div>
    </div>
  );
}

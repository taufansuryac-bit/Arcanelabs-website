import { useCallback, useEffect, useRef, useState } from "react";
import { VoxelChaosLogoScene } from "./VoxelChaosLogoScene";

type ArcaneLoaderProps = {
  onComplete: () => void;
};

/** Maximum time (ms) before the watchdog force-completes the loader.
 *  Covers WebGL context-loss, slow machines, and asset fetch failures. */
const WATCHDOG_MS = 5_000;

/** V2.3 loader: watchdog-guarded voxel-chaos-logo scatter → convergence → crossfade. */
export function ArcaneLoader({ onComplete }: ArcaneLoaderProps) {
  const [visible, setVisible] = useState(true);
  const [exiting, setExiting] = useState(false);
  /** True when WebGL init failed and we should skip the 3-D scene entirely. */
  const [webglFailed, setWebglFailed] = useState(false);
  const completedRef = useRef(false);
  const exitTimerRef = useRef<number | null>(null);
  const watchdogRef = useRef<number | null>(null);

  /** Shared completion path — idempotent. */
  const finish = useCallback(
    (reason?: string) => {
      if (completedRef.current) return;
      completedRef.current = true;
      if (watchdogRef.current !== null) {
        window.clearTimeout(watchdogRef.current);
        watchdogRef.current = null;
      }
      if (reason) {
        console.warn(`[ArcaneLoader] finished via: ${reason}`);
      }
      sessionStorage.setItem("arcane-loader-seen", "1");
      document.documentElement.style.overflow = "";
      onComplete();
      setExiting(true);
      exitTimerRef.current = window.setTimeout(() => {
        setVisible(false);
        window.dispatchEvent(new Event("arcane-app-ready"));
      }, 420);
    },
    [onComplete],
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    /* Skip loader on return visits for snappier repeat navigation. */
    if (sessionStorage.getItem("arcane-loader-seen") === "1") {
      completedRef.current = true;
      setVisible(false);
      onComplete();
      return;
    }

    const previousOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";

    /* Watchdog: if the 3-D scene never fires onComplete (e.g. WebGL crash,
       slow network, zero-size canvas), we force the site visible after WATCHDOG_MS. */
    watchdogRef.current = window.setTimeout(() => {
      console.warn("[ArcaneLoader] watchdog fired — forcing site visible");
      finish("watchdog");
    }, WATCHDOG_MS);

    return () => {
      document.documentElement.style.overflow = previousOverflow;
      if (exitTimerRef.current !== null) window.clearTimeout(exitTimerRef.current);
      if (watchdogRef.current !== null) window.clearTimeout(watchdogRef.current);
    };
  }, [onComplete, finish]);

  /** Called by VoxelChaosLogoScene when WebGL context cannot be acquired. */
  const handleWebGLFail = useCallback(() => {
    setWebglFailed(true);
    // Give user a brief "flash" of the fallback then dismiss.
    window.setTimeout(() => finish("webgl-fallback"), 800);
  }, [finish]);

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
        {webglFailed ? (
          /* Minimal CSS-only fallback — zero WebGL dependency. */
          <div className="flex h-full w-full items-center justify-center">
            <span
              className="font-mono text-lg font-bold tracking-[0.25em] text-foreground/80"
              style={{ animation: "pulse 1s ease-in-out infinite" }}
            >
              ARCANE LABS
            </span>
          </div>
        ) : (
          <VoxelChaosLogoScene
            mode="loader"
            durationMs={3200}
            onComplete={() => finish("scene-complete")}
            onError={handleWebGLFail}
            interactive
            className="h-full w-full"
          />
        )}
      </div>
      <div className="pointer-events-none absolute bottom-6 left-6 font-mono text-[9px] uppercase tracking-[0.32em] text-muted-foreground/55">
        Arcane Labs / assembling field
      </div>
    </div>
  );
}

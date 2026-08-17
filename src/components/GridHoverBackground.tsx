import { useEffect, useRef } from "react";
import { isDocumentVisible, observeDocumentVisibility } from "@/lib/animation-runtime";

const CELL = 14;
const TRAIL_LENGTH = 24;
const TRAIL_LIFETIME = 620;

type TrailCell = {
  gx: number;
  gy: number;
  born: number;
};

/** One-cell cursor snake: a bright head with a thin fading grid trail. */
export function GridHoverBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let raf = 0;
    let running = false;
    let pageVisible = isDocumentVisible();
    let width = 0;
    let height = 0;
    let lastCell: { gx: number; gy: number } | null = null;
    const trail: TrailCell[] = [];

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const pushCell = (gx: number, gy: number, now: number) => {
      const previous = trail[trail.length - 1];
      if (previous?.gx === gx && previous.gy === gy) {
        previous.born = now;
        return;
      }
      trail.push({ gx, gy, born: now });
      while (trail.length > TRAIL_LENGTH) trail.shift();
    };

    const onMove = (event: PointerEvent) => {
      const gx = Math.floor(event.clientX / CELL);
      const gy = Math.floor(event.clientY / CELL);
      const now = performance.now();

      if (!lastCell) {
        pushCell(gx, gy, now);
        lastCell = { gx, gy };
        return;
      }

      const dx = gx - lastCell.gx;
      const dy = gy - lastCell.gy;
      const steps = Math.max(Math.abs(dx), Math.abs(dy));
      for (let step = 1; step <= steps; step += 1) {
        const t = step / Math.max(1, steps);
        pushCell(
          Math.round(lastCell.gx + dx * t),
          Math.round(lastCell.gy + dy * t),
          now - (steps - step) * 6,
        );
      }
      lastCell = { gx, gy };
    };

    const onLeave = () => {
      lastCell = null;
    };

    const draw = (now: number) => {
      if (!running) return;
      ctx.clearRect(0, 0, width, height);
      const dark = document.documentElement.classList.contains("dark");

      while (trail.length > 0 && now - trail[0]!.born > TRAIL_LIFETIME) trail.shift();

      for (let index = 0; index < trail.length; index += 1) {
        const cell = trail[index]!;
        const age = Math.max(0, 1 - (now - cell.born) / TRAIL_LIFETIME);
        const order = (index + 1) / Math.max(1, trail.length);
        const strength = age * (0.18 + order * 0.82);
        if (strength <= 0.01) continue;

        const isHead = index === trail.length - 1;
        const inset = isHead ? 2 : 3.25;
        const size = CELL - inset * 2;
        const x = cell.gx * CELL + inset;
        const y = cell.gy * CELL + inset;
        const alpha = Math.min(0.96, strength * (isHead ? 1 : 0.62));

        ctx.fillStyle = dark
          ? `oklch(0.88 0.26 135 / ${alpha.toFixed(3)})`
          : `oklch(0.58 0.22 135 / ${(alpha * 0.9).toFixed(3)})`;
        ctx.fillRect(x, y, size, size);

        if (isHead) {
          ctx.fillStyle = dark ? "rgba(244,255,232,.72)" : "rgba(255,255,255,.48)";
          ctx.fillRect(x + 1, y + 1, Math.max(1, size - 2), 1);
        }
      }

      raf = requestAnimationFrame(draw);
    };

    const start = () => {
      if (running || !pageVisible) return;
      running = true;
      raf = requestAnimationFrame(draw);
    };

    const stop = () => {
      if (!running) return;
      running = false;
      cancelAnimationFrame(raf);
    };

    resize();
    const disconnectDocument = observeDocumentVisibility((visible) => {
      pageVisible = visible;
      if (pageVisible) start();
      else stop();
    });

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerleave", onLeave);
    window.addEventListener("resize", resize);
    start();

    return () => {
      stop();
      disconnectDocument();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-0" aria-hidden>
      <div className="absolute inset-0 bg-grid opacity-70" />
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      <div className="absolute inset-0 bg-vignette" />
    </div>
  );
}

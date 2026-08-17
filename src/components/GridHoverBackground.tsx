import { useEffect, useRef } from "react";
import { isDocumentVisible, observeDocumentVisibility } from "@/lib/animation-runtime";

const CELL = 18;
const DECAY = 0.91;
const WAKE_RADIUS = 5.5;

/**
 * Full-screen grid hover field inspired by the supplied Framer reference.
 * The base dot matrix stays CSS-driven; Canvas only renders illuminated cells.
 */
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
    let cols = 0;
    let rows = 0;
    let heat = new Float32Array(0);
    const pointer = { x: -9999, y: -9999, px: -9999, py: -9999, active: false };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.ceil(width / CELL) + 1;
      rows = Math.ceil(height / CELL) + 1;
      heat = new Float32Array(cols * rows);
    };

    const excite = (x: number, y: number, velocityBoost: number) => {
      const cx = Math.floor(x / CELL);
      const cy = Math.floor(y / CELL);
      const span = Math.ceil(WAKE_RADIUS);
      for (let gy = cy - span; gy <= cy + span; gy += 1) {
        if (gy < 0 || gy >= rows) continue;
        for (let gx = cx - span; gx <= cx + span; gx += 1) {
          if (gx < 0 || gx >= cols) continue;
          const dx = gx + 0.5 - x / CELL;
          const dy = gy + 0.5 - y / CELL;
          const d = Math.hypot(dx, dy);
          if (d > WAKE_RADIUS) continue;
          const falloff = 1 - d / WAKE_RADIUS;
          const shaped = falloff * falloff * (0.72 + velocityBoost * 0.28);
          const index = gy * cols + gx;
          heat[index] = Math.max(heat[index] ?? 0, Math.min(1, shaped));
        }
      }
    };

    const onMove = (event: PointerEvent) => {
      const dx = event.clientX - pointer.px;
      const dy = event.clientY - pointer.py;
      const speed = pointer.active ? Math.min(1, Math.hypot(dx, dy) / 54) : 0;
      pointer.px = pointer.x = event.clientX;
      pointer.py = pointer.y = event.clientY;
      pointer.active = true;
      excite(pointer.x, pointer.y, speed);
    };

    const onLeave = () => {
      pointer.active = false;
    };

    const draw = () => {
      if (!running) return;
      ctx.clearRect(0, 0, width, height);
      const dark = document.documentElement.classList.contains("dark");

      for (let i = 0; i < heat.length; i += 1) {
        let value = heat[i] ?? 0;
        if (value < 0.008) {
          heat[i] = 0;
          continue;
        }

        heat[i] *= DECAY;
        value = heat[i] ?? 0;
        const gx = i % cols;
        const gy = Math.floor(i / cols);
        const x = gx * CELL;
        const y = gy * CELL;
        const inset = 2 + (1 - value) * 2.5;
        const size = Math.max(2, CELL - inset * 2);

        const alpha = Math.min(0.9, 0.08 + value * 0.78);
        ctx.fillStyle = dark
          ? `oklch(0.88 0.26 135 / ${alpha.toFixed(3)})`
          : `oklch(0.62 0.22 135 / ${(alpha * 0.88).toFixed(3)})`;
        ctx.fillRect(x + inset, y + inset, size, size);

        if (value > 0.56) {
          ctx.fillStyle = dark
            ? `rgba(238,255,226,${((value - 0.56) * 0.5).toFixed(3)})`
            : `rgba(255,255,255,${((value - 0.56) * 0.28).toFixed(3)})`;
          ctx.fillRect(x + inset + 1, y + inset + 1, Math.max(1, size - 3), 1);
        }
      }

      if (running) raf = requestAnimationFrame(draw);
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
      <div className="absolute inset-0 bg-grid opacity-80" />
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      <div className="absolute inset-0 bg-vignette" />
    </div>
  );
}

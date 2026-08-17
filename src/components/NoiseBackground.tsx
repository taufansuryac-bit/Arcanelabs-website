import { useEffect, useRef } from "react";

const CELL = 14;

/**
 * Fixed full-screen backdrop: dot grid, film grain, and a neon-green pixel
 * field that lights up around the cursor.
 */
export function NoiseBackground() {
  const grainRef = useRef<HTMLCanvasElement | null>(null);
  const neonRef = useRef<HTMLCanvasElement | null>(null);

  // ── film grain ──────────────────────────────────────────────
  useEffect(() => {
    const canvas = grainRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let w = 0;
    let h = 0;

    const resize = () => {
      w = canvas.width = Math.floor(window.innerWidth / 2);
      h = canvas.height = Math.floor(window.innerHeight / 2);
    };

    let last = 0;
    const draw = (t: number) => {
      raf = requestAnimationFrame(draw);
      if (t - last < 50) return;
      last = t;
      const img = ctx.createImageData(w, h);
      const d = img.data;
      for (let i = 0; i < d.length; i += 4) {
        const v = Math.random() * 255;
        d[i] = v;
        d[i + 1] = v;
        d[i + 2] = v;
        d[i + 3] = v > 246 ? 10 : 0;
      }
      ctx.putImageData(img, 0, 0);
    };

    resize();
    raf = requestAnimationFrame(draw);
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  // ── neon pixel hover field ──────────────────────────────────
  useEffect(() => {
    const canvas = neonRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let w = 0;
    let h = 0;
    let cols = 0;
    let rows = 0;
    let heat = new Float32Array(0);
    const mouse = { x: -9999, y: -9999, active: false };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.ceil(w / CELL) + 1;
      rows = Math.ceil(h / CELL) + 1;
      heat = new Float32Array(cols * rows);
    };
    resize();

    const onMove = (e: PointerEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.active = true;
    };
    const onLeave = () => {
      mouse.active = false;
    };

    const radius = 78;

    const draw = () => {
      raf = requestAnimationFrame(draw);
      ctx.clearRect(0, 0, w, h);

      if (mouse.active) {
        const cx = Math.floor(mouse.x / CELL);
        const cy = Math.floor(mouse.y / CELL);
        const span = Math.ceil(radius / CELL);
        for (let y = cy - span; y <= cy + span; y++) {
          if (y < 0 || y >= rows) continue;
          for (let x = cx - span; x <= cx + span; x++) {
            if (x < 0 || x >= cols) continue;
            const dx = x * CELL + CELL / 2 - mouse.x;
            const dy = y * CELL + CELL / 2 - mouse.y;
            const d = Math.hypot(dx, dy);
            if (d > radius) continue;
            const f = 1 - d / radius;
            const jitter = 0.55 + Math.random() * 0.45;
            const i = y * cols + x;
            heat[i] = Math.max(heat[i] ?? 0, f * f * jitter);
          }
        }
      }

      for (let i = 0; i < heat.length; i++) {
        const v = heat[i] ?? 0;
        if (v < 0.02) continue;
        heat[i] = v * 0.9;
        const x = (i % cols) * CELL;
        const y = Math.floor(i / cols) * CELL;
        ctx.fillStyle = `oklch(0.88 0.26 135 / ${(v * 0.85).toFixed(3)})`;
        ctx.fillRect(x + 1, y + 1, CELL - 3, CELL - 3);
      }
    };

    raf = requestAnimationFrame(draw);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerleave", onLeave);
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-0">
      <div className="absolute inset-0 bg-grid" />
      <canvas ref={neonRef} className="absolute inset-0 h-full w-full" />
      <canvas ref={grainRef} className="absolute inset-0 h-full w-full opacity-60" />
      <div className="absolute inset-0 bg-vignette" />
    </div>
  );
}

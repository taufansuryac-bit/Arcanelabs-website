import { useEffect, useRef } from "react";
import {
  isDocumentVisible,
  observeDocumentVisibility,
  observeElementVisibility,
  shouldAnimate,
} from "@/lib/animation-runtime";

/** ramp from faint to dense, tuned to look like the reference glyph field */
const CHARS = " ...--::=++**33FFTTRR%%K@@##44";

type Props = {
  text: string;
  className?: string;
  /** approximate cell width in px */
  cell?: number;
  /** how strongly the cursor distorts the field */
  chaosStrength?: number;
};

/** stable pseudo-random in [0,1) for a cell — no per-frame jitter */
function hash(x: number, y: number) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

/**
 * Renders a word as an animated ASCII glyph field on a canvas.
 * The field breathes slowly; the cursor melts the glyphs around it.
 */
export function AsciiWordmark({ text, className, cell = 8, chaosStrength = 1.3 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouse = useRef({ x: -9999, y: -9999, target: 0, active: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const off = document.createElement("canvas");
    const octx = off.getContext("2d", { willReadFrequently: true });
    if (!octx) return;

    let raf = 0;
    let running = false;
    let pageVisible = isDocumentVisible();
    let inViewport = true;
    let cols = 0;
    let rows = 0;
    let data: Uint8ClampedArray | null = null;
    let dpr = 1;
    let cw = 0;
    let ch = 0;
    let cellW = 0;
    let cellH = 0;

    const build = () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width < 2 || rect.height < 2) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      cw = rect.width;
      ch = rect.height;
      canvas.width = Math.round(cw * dpr);
      canvas.height = Math.round(ch * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      cellW = cell;
      cellH = cell * 1.55;
      cols = Math.max(24, Math.floor(cw / cellW));
      rows = Math.max(8, Math.floor(ch / cellH));

      const ss = 3;
      off.width = cols * ss;
      off.height = rows * ss;
      octx.setTransform(1, 0, 0, 1, 0, 0);
      octx.fillStyle = "#000";
      octx.fillRect(0, 0, off.width, off.height);

      let size = off.height * 0.62;
      octx.textAlign = "center";
      octx.textBaseline = "middle";
      for (let i = 0; i < 60; i++) {
        octx.font = `900 ${size}px "Archivo Black", "Helvetica Neue", Arial, sans-serif`;
        if (octx.measureText(text).width <= off.width * 0.92) break;
        size *= 0.94;
      }
      octx.fillStyle = "#fff";
      octx.fillText(text, off.width / 2, off.height / 2);

      const src = octx.getImageData(0, 0, off.width, off.height).data;
      const out = new Uint8ClampedArray(cols * rows);
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          let sum = 0;
          for (let j = 0; j < ss; j++) {
            for (let i = 0; i < ss; i++) {
              const sx = x * ss + i;
              const sy = y * ss + j;
              sum += src[(sy * off.width + sx) * 4] ?? 0;
            }
          }
          out[y * cols + x] = sum / (ss * ss);
        }
      }
      data = out;
    };

    const sample = (x: number, y: number) => {
      if (!data) return 0;
      const xi = Math.round(x);
      const yi = Math.round(y);
      if (xi < 0 || yi < 0 || xi >= cols || yi >= rows) return 0;
      return (data[yi * cols + xi] ?? 0) / 255;
    };

    const draw = (t: number) => {
      if (!running) return;

      if (data) {
        const time = t * 0.001;
        const m = mouse.current;
        m.active += (m.target - m.active) * 0.08;

        const ink = document.documentElement.classList.contains("dark")
          ? "255,255,255"
          : "18,18,18";

        const gw = cw / cols;
        const gh = ch / rows;

        ctx.clearRect(0, 0, cw, ch);
        ctx.font = `${Math.round(gh * 0.92)}px "JetBrains Mono", ui-monospace, monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        const radius = Math.max(96, Math.min(cw, ch) * 0.25);

        for (let y = 0; y < rows; y++) {
          for (let x = 0; x < cols; x++) {
            const px = (x + 0.5) * gw;
            const py = (y + 0.5) * gh;

            const dx = px - m.x;
            const dy = py - m.y;
            const d = Math.sqrt(dx * dx + dy * dy) / radius;
            const k = d >= 1 ? 0 : 1 - d;
            const f = k * k * k * (3 - 2 * k);
            const chaos = m.active * Math.max(0, Math.min(1, f)) * chaosStrength;

            const n = hash(x, y);
            const wob = chaos * 3.8;
            const sx =
              x +
              Math.sin(time * 2.1 + y * 0.42 + n * 6.28) * wob +
              (dx / radius) * chaos * 2.65;
            const sy =
              y +
              Math.cos(time * 1.7 + x * 0.33 + n * 6.28) * wob * 0.48 +
              (dy / radius) * chaos * 1.45;

            const lum = sample(sx, sy);
            const shimmer = 0.72 + 0.28 * Math.sin(time * 1.1 + n * 12.5 + x * 0.12 - y * 0.18);
            let v = lum * shimmer + chaos * 0.32 * n;

            if (lum < 0.04) {
              if (n > 0.994) v = 0.14 + 0.1 * Math.sin(time * 2 + n * 30);
              else v = 0;
            }
            if (v < 0.05) continue;

            const idx = Math.min(CHARS.length - 1, Math.floor(v * CHARS.length));
            const chr = CHARS[idx];
            if (!chr || chr === " ") continue;

            ctx.fillStyle = `rgba(${ink},${Math.min(1, 0.28 + v * 0.8).toFixed(3)})`;
            ctx.fillText(chr, px, py);
          }
        }
      }

      if (running) raf = requestAnimationFrame(draw);
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

    const syncRunningState = () => {
      if (shouldAnimate(pageVisible, inViewport)) start();
      else stop();
    };

    const onResize = () => build();
    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      m0.x = e.clientX - r.left;
      m0.y = e.clientY - r.top;
      m0.target = 1;
    };
    const m0 = mouse.current;
    const onLeave = () => {
      m0.target = 0;
    };

    build();
    if (typeof document !== "undefined" && document.fonts) {
      document.fonts.ready.then(build).catch(() => {});
    }

    const disconnectViewport = observeElementVisibility(
      canvas,
      (visible) => {
        inViewport = visible;
        syncRunningState();
      },
      { rootMargin: "160px 0px" },
    );
    const disconnectDocument = observeDocumentVisibility((visible) => {
      pageVisible = visible;
      syncRunningState();
    });

    start();
    window.addEventListener("resize", onResize);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerleave", onLeave);

    return () => {
      stop();
      disconnectViewport();
      disconnectDocument();
      window.removeEventListener("resize", onResize);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerleave", onLeave);
    };
  }, [text, cell, chaosStrength]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      role="img"
      aria-label={text}
      style={{ display: "block", width: "100%", height: "100%" }}
    />
  );
}

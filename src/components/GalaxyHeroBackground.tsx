import { useEffect, useRef } from "react";
import {
  isDocumentVisible,
  observeDocumentVisibility,
  observeElementVisibility,
  observeReducedMotion,
  prefersReducedMotion,
  shouldAnimate,
} from "@/lib/animation-runtime";

type Star = {
  x: number;
  y: number;
  z: number;
  px: number;
  py: number;
  hue: number;
  size: number;
  twinklePhase: number;
  twinkleSpeed: number;
};

const STAR_COUNT = 320;
const NEBULA_LAYERS = 5;

/**
 * Full-canvas galaxy background for the hero section.
 * Features:
 * - Parallax star field with depth (z-axis)
 * - Pixel-snapped rendering for the "futuristic pixel" aesthetic
 * - Nebula colour washes in deep purple / indigo / electric-blue
 * - Twinkling & drift animation
 * - Fully paused when prefers-reduced-motion or off-screen
 */
export function GalaxyHeroBackground({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let running = false;
    let pageVisible = isDocumentVisible();
    let inViewport = true;
    let reducedMotion = prefersReducedMotion();
    let w = 0;
    let h = 0;

    // ── Stars ──────────────────────────────────────────────────────────────
    const stars: Star[] = Array.from({ length: STAR_COUNT }, (_, i) => ({
      x: Math.random(),
      y: Math.random(),
      z: Math.random(), // 0=far, 1=near
      px: 0,
      py: 0,
      hue: [230, 260, 280, 200, 180][i % 5]!, // indigo/violet/cyan palette
      size: 1 + Math.random() * 1.5,
      twinklePhase: Math.random() * Math.PI * 2,
      twinkleSpeed: 0.4 + Math.random() * 1.2,
    }));

    // ── Nebula seed positions (relative to canvas) ─────────────────────────
    const nebulae = Array.from({ length: NEBULA_LAYERS }, (_, i) => ({
      xr: 0.15 + (i / NEBULA_LAYERS) * 0.7,
      yr: 0.2 + ((i * 0.37) % 0.6),
      hue: [250, 270, 220, 290, 200][i % 5]!,
      sat: 70 + i * 4,
      radius: 0.22 + Math.random() * 0.18,
      alpha: 0.04 + Math.random() * 0.05,
    }));

    // ── Resize ─────────────────────────────────────────────────────────────
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = rect.width;
      h = rect.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    // ── Draw ───────────────────────────────────────────────────────────────
    const draw = (ts: number) => {
      if (!running) return;
      const t = ts * 0.001;

      ctx.clearRect(0, 0, w, h);

      // Deep space base gradient
      const bg = ctx.createLinearGradient(0, 0, w * 0.4, h);
      bg.addColorStop(0, "oklch(0.06 0.02 264)");
      bg.addColorStop(0.45, "oklch(0.04 0.015 270)");
      bg.addColorStop(1, "oklch(0.06 0.01 250)");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      // Nebula layers
      for (const neb of nebulae) {
        const cx = neb.xr * w;
        const cy = neb.yr * h;
        const r = neb.radius * Math.max(w, h);
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        const alpha = neb.alpha + 0.012 * Math.sin(t * 0.3 + neb.hue);
        grad.addColorStop(0, `hsla(${neb.hue}, ${neb.sat}%, 55%, ${alpha.toFixed(3)})`);
        grad.addColorStop(
          0.45,
          `hsla(${neb.hue + 20}, ${neb.sat - 10}%, 40%, ${(alpha * 0.4).toFixed(3)})`,
        );
        grad.addColorStop(1, "transparent");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
      }

      // Horizontal scan-line veil (pixel/futuristic CRT feel)
      for (let sy = 0; sy < h; sy += 4) {
        ctx.fillStyle = "rgba(0,0,0,0.08)";
        ctx.fillRect(0, sy, w, 1);
      }

      // Stars — pixel-snapped, depth-parallaxed, twinkling
      for (const star of stars) {
        // slow drift
        star.x += (star.z * 0.000_06 + 0.000_02) * (reducedMotion ? 0 : 1);
        if (star.x > 1) star.x -= 1;

        const px = Math.round(star.x * w);
        const py = Math.round(star.y * h);
        star.px = px;
        star.py = py;

        const twinkle = reducedMotion
          ? 0.85
          : 0.55 + 0.45 * Math.sin(t * star.twinkleSpeed + star.twinklePhase);
        const nearness = 0.3 + star.z * 0.7;
        const alpha = twinkle * nearness;
        const size = Math.max(1, Math.floor(star.size * (0.6 + star.z * 0.6)));

        ctx.fillStyle = `hsla(${star.hue}, 90%, ${70 + star.z * 25}%, ${alpha.toFixed(3)})`;
        ctx.fillRect(px, py, size, size);

        // Bright near-stars get a small cross-pixel glow
        if (star.z > 0.78 && alpha > 0.7) {
          ctx.fillStyle = `hsla(${star.hue}, 95%, 95%, ${(alpha * 0.25).toFixed(3)})`;
          ctx.fillRect(px - 1, py, 1, size);
          ctx.fillRect(px + size, py, 1, size);
          ctx.fillRect(px, py - 1, size, 1);
          ctx.fillRect(px, py + size, size, 1);
        }
      }

      // Subtle electric-blue horizon glow at the bottom
      const horizGrad = ctx.createLinearGradient(0, h * 0.7, 0, h);
      horizGrad.addColorStop(0, "transparent");
      horizGrad.addColorStop(1, "oklch(0.35 0.14 220 / 0.18)");
      ctx.fillStyle = horizGrad;
      ctx.fillRect(0, h * 0.7, w, h * 0.3);

      raf = requestAnimationFrame(draw);
    };

    // ── Lifecycle ──────────────────────────────────────────────────────────
    const start = () => {
      if (running || !shouldAnimate(pageVisible, inViewport, reducedMotion)) return;
      running = true;
      raf = requestAnimationFrame(draw);
    };

    const stop = () => {
      if (!running) return;
      running = false;
      cancelAnimationFrame(raf);
    };

    const sync = () => {
      if (shouldAnimate(pageVisible, inViewport, reducedMotion)) start();
      else stop();
    };

    resize();
    window.addEventListener("resize", resize);

    const dcVP = observeElementVisibility(
      canvas,
      (v) => {
        inViewport = v;
        sync();
      },
      { rootMargin: "200px" },
    );
    const dcDoc = observeDocumentVisibility((v) => {
      pageVisible = v;
      sync();
    });
    const dcRM = observeReducedMotion((reduced) => {
      reducedMotion = reduced;
      sync();
      // Draw a single static frame so stars remain visible
      if (reduced) {
        running = true;
        requestAnimationFrame((ts) => {
          draw(ts);
          running = false;
        });
      }
    });

    start();

    return () => {
      stop();
      window.removeEventListener("resize", resize);
      dcVP();
      dcDoc();
      dcRM();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      aria-hidden
      style={{ display: "block", width: "100%", height: "100%", imageRendering: "pixelated" }}
    />
  );
}

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
const STAR_HUES = [195, 205, 215, 225, 210] as const;

/**
 * Transparent star field for the hero section.
 * The canvas deliberately has no local colour wash so the hero remains
 * visually continuous with the black site background below it.
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

    const stars: Star[] = Array.from({ length: STAR_COUNT }, (_, i) => ({
      x: Math.random(),
      y: Math.random(),
      z: Math.random(),
      px: 0,
      py: 0,
      hue: STAR_HUES[i % STAR_HUES.length]!,
      size: 1 + Math.random() * 1.5,
      twinklePhase: Math.random() * Math.PI * 2,
      twinkleSpeed: 0.4 + Math.random() * 1.2,
    }));

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = rect.width;
      h = rect.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = (ts: number) => {
      if (!running) return;
      const t = ts * 0.001;

      // Keep the canvas transparent. The section's bg-background is the only base colour.
      ctx.clearRect(0, 0, w, h);

      for (const star of stars) {
        star.x += (star.z * 0.000_06 + 0.000_02) * (reducedMotion ? 0 : 1);
        if (star.x > 1) star.x -= 1;

        const px = Math.round(star.x * w);
        const py = Math.round(star.y * h);
        star.px = px;
        star.py = py;

        const twinkle = reducedMotion
          ? 0.82
          : 0.52 + 0.42 * Math.sin(t * star.twinkleSpeed + star.twinklePhase);
        const nearness = 0.26 + star.z * 0.68;
        const alpha = twinkle * nearness;
        const size = Math.max(1, Math.floor(star.size * (0.6 + star.z * 0.6)));
        const lightness = 76 + star.z * 18;
        const saturation = 18 + star.z * 24;

        ctx.fillStyle = `hsla(${star.hue}, ${saturation}%, ${lightness}%, ${alpha.toFixed(3)})`;
        ctx.fillRect(px, py, size, size);

        if (star.z > 0.8 && alpha > 0.68) {
          ctx.fillStyle = `rgba(235, 248, 255, ${(alpha * 0.24).toFixed(3)})`;
          ctx.fillRect(px - 1, py, 1, size);
          ctx.fillRect(px + size, py, 1, size);
          ctx.fillRect(px, py - 1, size, 1);
          ctx.fillRect(px, py + size, size, 1);
        }
      }

      raf = requestAnimationFrame(draw);
    };

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
      (visible) => {
        inViewport = visible;
        sync();
      },
      { rootMargin: "200px" },
    );
    const dcDoc = observeDocumentVisibility((visible) => {
      pageVisible = visible;
      sync();
    });
    const dcRM = observeReducedMotion((reduced) => {
      reducedMotion = reduced;
      sync();
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

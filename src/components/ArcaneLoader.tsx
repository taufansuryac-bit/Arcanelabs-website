import { useEffect, useRef, useState } from "react";

type ArcaneLoaderProps = {
  onComplete: () => void;
};

type LoaderPixel = {
  tx: number;
  ty: number;
  sx: number;
  sy: number;
  size: number;
  seed: number;
};

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
const smooth = (value: number) => {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
};

function seeded(index: number) {
  const n = Math.sin(index * 127.1 + 311.7) * 43758.5453;
  return n - Math.floor(n);
}

/** Initial-entry loader: pixels assemble into the Arcane mark, lock, then breach outward. */
export function ArcaneLoader({ onComplete }: ArcaneLoaderProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (sessionStorage.getItem("arcane-loader-seen") === "1") {
      setVisible(false);
      onComplete();
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const previousOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";

    let raf = 0;
    let cancelled = false;
    let width = 0;
    let height = 0;
    let dpr = 1;
    let particles: LoaderPixel[] = [];
    let sourceImage: HTMLImageElement | null = null;
    let startedAt = 0;
    let fallbackTimer = 0;

    const finish = () => {
      if (cancelled) return;
      sessionStorage.setItem("arcane-loader-seen", "1");
      document.documentElement.style.overflow = previousOverflow;
      setVisible(false);
      onComplete();
    };

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const buildParticles = (image: HTMLImageElement) => {
      const offscreen = document.createElement("canvas");
      const octx = offscreen.getContext("2d", { willReadFrequently: true });
      if (!octx) return;

      const sampleWidth = Math.min(640, Math.max(340, width * 0.44));
      const sampleHeight = sampleWidth * (1153 / 1600);
      offscreen.width = Math.round(sampleWidth);
      offscreen.height = Math.round(sampleHeight);
      octx.clearRect(0, 0, offscreen.width, offscreen.height);
      octx.drawImage(image, 0, 0, offscreen.width, offscreen.height);
      const pixels = octx.getImageData(0, 0, offscreen.width, offscreen.height).data;
      const step = width < 720 ? 10 : 8;
      const ox = (width - offscreen.width) / 2;
      const oy = (height - offscreen.height) / 2;
      const next: LoaderPixel[] = [];

      let index = 0;
      for (let y = 0; y < offscreen.height; y += step) {
        for (let x = 0; x < offscreen.width; x += step) {
          const alpha = pixels[(y * offscreen.width + x) * 4 + 3] ?? 0;
          if (alpha < 80) continue;
          const seed = seeded(index + x * 0.37 + y * 0.13);
          const angle = seed * Math.PI * 2;
          const radius = Math.max(width, height) * (0.45 + seeded(index + 91) * 0.45);
          next.push({
            tx: ox + x,
            ty: oy + y,
            sx: width / 2 + Math.cos(angle) * radius,
            sy: height / 2 + Math.sin(angle) * radius,
            size: 2.4 + seeded(index + 41) * 3.2,
            seed,
          });
          index += 1;
        }
      }
      particles = next;
    };

    const draw = (now: number) => {
      if (cancelled) return;
      if (!startedAt) startedAt = now;
      const elapsed = now - startedAt;
      const total = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 620 : 1460;
      const p = clamp01(elapsed / total);
      const assemble = smooth(p / 0.58);
      const solid = smooth((p - 0.42) / 0.22);
      const breach = smooth((p - 0.76) / 0.24);

      ctx.clearRect(0, 0, width, height);
      const dark = document.documentElement.classList.contains("dark");
      ctx.fillStyle = dark ? "#050505" : "#f4f4ef";
      ctx.fillRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2;
      for (const pixel of particles) {
        const targetX = pixel.sx + (pixel.tx - pixel.sx) * assemble;
        const targetY = pixel.sy + (pixel.ty - pixel.sy) * assemble;
        const vx = pixel.tx - centerX;
        const vy = pixel.ty - centerY;
        const mag = Math.max(1, Math.hypot(vx, vy));
        const boost = 130 + pixel.seed * 420;
        const x = targetX + (vx / mag) * boost * breach;
        const y = targetY + (vy / mag) * boost * breach;
        const alpha = (0.16 + assemble * 0.84) * (1 - breach);
        const size = pixel.size * (0.72 + assemble * 0.45 + breach * 0.8);

        ctx.fillStyle = dark
          ? `rgba(210,255,164,${alpha.toFixed(3)})`
          : `rgba(67,102,26,${(alpha * 0.94).toFixed(3)})`;
        ctx.fillRect(x, y, size, size);
      }

      if (sourceImage && solid > 0.02) {
        const drawWidth = Math.min(640, Math.max(340, width * 0.44));
        const drawHeight = drawWidth * (1153 / 1600);
        ctx.save();
        ctx.globalAlpha = solid * (1 - breach);
        ctx.shadowBlur = 32 * solid;
        ctx.shadowColor = dark ? "rgba(178,255,89,.24)" : "rgba(75,105,32,.12)";
        ctx.drawImage(
          sourceImage,
          (width - drawWidth) / 2,
          (height - drawHeight) / 2,
          drawWidth,
          drawHeight,
        );
        ctx.restore();
      }

      if (p < 1) raf = requestAnimationFrame(draw);
      else finish();
    };

    resize();
    const dark = document.documentElement.classList.contains("dark");
    const image = new Image();
    image.decoding = "async";
    image.src = dark ? "/arcane-logo-white.svg" : "/arcane-logo-black.svg";
    image.onload = () => {
      sourceImage = image;
      buildParticles(image);
      raf = requestAnimationFrame(draw);
    };
    image.onerror = () => {
      fallbackTimer = window.setTimeout(finish, 380);
    };

    window.addEventListener("resize", resize);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      window.clearTimeout(fallbackTimer);
      document.documentElement.style.overflow = previousOverflow;
      window.removeEventListener("resize", resize);
    };
  }, [onComplete]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-background" aria-label="Loading Arcane Labs">
      <canvas ref={canvasRef} className="h-full w-full" />
      <div className="pointer-events-none absolute bottom-6 left-6 font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
        Arcane Labs / Initializing
      </div>
    </div>
  );
}

import { useEffect, useRef } from "react";
import { useMotionValueEvent, type MotionValue } from "motion/react";
import {
  isDocumentVisible,
  observeDocumentVisibility,
  observeElementVisibility,
  shouldAnimate,
} from "@/lib/animation-runtime";

type VoxelArcaneLogoProps = {
  progress: MotionValue<number>;
  className?: string;
};

type Voxel = {
  x: number;
  y: number;
  seed: number;
  size: number;
};

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
const smooth = (value: number) => {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
};

function seeded(value: number) {
  const n = Math.sin(value * 127.1 + 311.7) * 43758.5453;
  return n - Math.floor(n);
}

/** Arcane mark rebuilt as deterministic pseudo-3D voxels controlled by scroll progress. */
export function VoxelArcaneLogo({ progress, className = "" }: VoxelArcaneLogoProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const progressRef = useRef(0);

  useMotionValueEvent(progress, "change", (value) => {
    progressRef.current = value;
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let raf = 0;
    let running = false;
    let pageVisible = isDocumentVisible();
    let inViewport = true;
    let width = 0;
    let height = 0;
    let voxels: Voxel[] = [];
    let dark = document.documentElement.classList.contains("dark");
    let image: HTMLImageElement | null = null;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const build = (source: HTMLImageElement) => {
      const offscreen = document.createElement("canvas");
      const octx = offscreen.getContext("2d", { willReadFrequently: true });
      if (!octx) return;

      const sampleWidth = 420;
      const sampleHeight = Math.round(sampleWidth * (1153 / 1600));
      offscreen.width = sampleWidth;
      offscreen.height = sampleHeight;
      octx.clearRect(0, 0, sampleWidth, sampleHeight);
      octx.drawImage(source, 0, 0, sampleWidth, sampleHeight);
      const data = octx.getImageData(0, 0, sampleWidth, sampleHeight).data;
      const step = 7;
      const next: Voxel[] = [];
      let index = 0;

      for (let y = 0; y < sampleHeight; y += step) {
        for (let x = 0; x < sampleWidth; x += step) {
          const alpha = data[(y * sampleWidth + x) * 4 + 3] ?? 0;
          if (alpha < 70) continue;
          const seed = seeded(index + x * 0.17 + y * 0.09);
          next.push({ x, y, seed, size: 3.4 + seeded(index + 77) * 2.2 });
          index += 1;
        }
      }
      voxels = next;
    };

    const loadLogo = () => {
      dark = document.documentElement.classList.contains("dark");
      const source = new Image();
      source.decoding = "async";
      source.src = dark ? "/arcane-logo-white.svg" : "/arcane-logo-black.svg";
      source.onload = () => {
        image = source;
        build(source);
      };
      image = source;
    };

    const draw = (timeMs: number) => {
      if (!running) return;
      raf = requestAnimationFrame(draw);
      ctx.clearRect(0, 0, width, height);
      if (!image || voxels.length === 0) return;

      const time = timeMs * 0.001;
      const p = clamp01(progressRef.current);
      const fracture = smooth((p - 0.2) / 0.34);
      const collapse = smooth((p - 0.76) / 0.22);
      const separation = fracture * (1 - collapse);
      const alpha = 0.88 + collapse * 0.12;
      const scale = Math.min(width / 500, height / 390) * (0.9 + p * 0.06);
      const sampleWidth = 420;
      const sampleHeight = Math.round(sampleWidth * (1153 / 1600));
      const originX = width / 2 - (sampleWidth * scale) / 2;
      const originY = height / 2 - (sampleHeight * scale) / 2;
      const centerX = sampleWidth / 2;
      const centerY = sampleHeight / 2;

      for (let index = 0; index < voxels.length; index += 1) {
        const voxel = voxels[index]!;
        const nx = (voxel.x - centerX) / centerX;
        const ny = (voxel.y - centerY) / centerY;
        const radial = Math.hypot(nx, ny) || 0.01;
        const directionX = nx / radial;
        const directionY = ny / radial;
        const jitter = Math.sin(time * (1.2 + voxel.seed) + voxel.seed * 25) * 4;
        const push = separation * (22 + voxel.seed * 92);
        const twist = separation * Math.sin(voxel.seed * 19 + time * 0.8) * 26;
        const x =
          originX + voxel.x * scale + directionX * push + directionY * twist + jitter * separation;
        const y =
          originY +
          voxel.y * scale +
          directionY * push -
          directionX * twist +
          jitter * separation * 0.45;
        const size = Math.max(2, voxel.size * scale * (0.82 + separation * 0.38));
        const depth = 1.2 + separation * (2.5 + voxel.seed * 5.5);
        const green = voxel.seed > 0.84 && separation > 0.08;

        ctx.globalAlpha = alpha * (0.86 + voxel.seed * 0.14);
        ctx.fillStyle = green
          ? dark
            ? "oklch(0.88 0.26 135)"
            : "oklch(0.58 0.22 135)"
          : dark
            ? "rgba(248,248,244,.96)"
            : "rgba(12,12,12,.96)";
        ctx.fillRect(x, y, size, size);

        ctx.fillStyle = dark ? "rgba(86,98,80,.72)" : "rgba(0,0,0,.23)";
        ctx.beginPath();
        ctx.moveTo(x + size, y);
        ctx.lineTo(x + size + depth, y - depth);
        ctx.lineTo(x + size + depth, y + size - depth);
        ctx.lineTo(x + size, y + size);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = dark ? "rgba(255,255,255,.28)" : "rgba(255,255,255,.42)";
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + depth, y - depth);
        ctx.lineTo(x + size + depth, y - depth);
        ctx.lineTo(x + size, y);
        ctx.closePath();
        ctx.fill();
      }
      ctx.globalAlpha = 1;
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

    const sync = () => {
      if (shouldAnimate(pageVisible, inViewport)) start();
      else stop();
    };

    resize();
    loadLogo();
    const disconnectViewport = observeElementVisibility(
      canvas,
      (visible) => {
        inViewport = visible;
        sync();
      },
      { rootMargin: "360px 0px" },
    );
    const disconnectDocument = observeDocumentVisibility((visible) => {
      pageVisible = visible;
      sync();
    });
    const themeObserver = new MutationObserver(() => loadLogo());
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    window.addEventListener("resize", resize);
    start();

    return () => {
      stop();
      disconnectViewport();
      disconnectDocument();
      themeObserver.disconnect();
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className={className} role="img" aria-label="Arcane Labs" />;
}

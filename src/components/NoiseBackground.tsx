import { useEffect, useRef } from "react";

/** Fixed full-screen film-grain + dot-grid backdrop. */
export function NoiseBackground() {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
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
      // throttle the grain to ~20fps so it reads as film, not strobing
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

  return (
    <div className="pointer-events-none fixed inset-0 z-0">
      <div className="absolute inset-0 bg-grid" />
      <canvas ref={ref} className="absolute inset-0 h-full w-full opacity-60" />
      <div className="absolute inset-0 bg-vignette" />
    </div>
  );
}

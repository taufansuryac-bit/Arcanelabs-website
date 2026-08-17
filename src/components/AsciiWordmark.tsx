import { useEffect, useRef } from "react";

const CHARS = " .:-=+*i13FTR%K@#$34XН".replace("Н", "");

type Props = {
  text: string;
  className?: string;
  /** approximate cell size in px */
  cell?: number;
};

/**
 * Renders a word as an animated ASCII glyph field on a canvas.
 * Mouse proximity injects "chaos" into the glyph sampling.
 */
export function AsciiWordmark({ text, className, cell = 7 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouse = useRef({ x: -9999, y: -9999, active: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const off = document.createElement("canvas");
    const octx = off.getContext("2d", { willReadFrequently: true });
    if (!octx) return;

    let raf = 0;
    let cols = 0;
    let rows = 0;
    let data: Uint8ClampedArray | null = null;
    let dpr = 1;
    let cw = 0;
    let ch = 0;

    const build = () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width < 2 || rect.height < 2) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      cw = rect.width;
      ch = rect.height;
      canvas.width = Math.floor(cw * dpr);
      canvas.height = Math.floor(ch * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      cols = Math.max(20, Math.floor(cw / cell));
      rows = Math.max(6, Math.floor(ch / (cell * 1.55)));

      off.width = cols;
      off.height = rows;
      octx.setTransform(1, 0, 0, 1, 0, 0);
      octx.fillStyle = "#000";
      octx.fillRect(0, 0, cols, rows);

      // fit the text inside the sampling grid
      let size = rows * 1.4;
      octx.textAlign = "center";
      octx.textBaseline = "middle";
      for (let i = 0; i < 40; i++) {
        octx.font = `900 ${size}px "Archivo Black", "Helvetica Neue", Arial, sans-serif`;
        const w = octx.measureText(text).width;
        if (w <= cols * 0.94) break;
        size *= 0.92;
      }
      octx.fillStyle = "#fff";
      octx.fillText(text, cols / 2, rows / 2 + size * 0.03);
      data = octx.getImageData(0, 0, cols, rows).data;
    };

    const draw = (t: number) => {
      raf = requestAnimationFrame(draw);
      if (!data) return;
      const time = t * 0.001;
      const cwCell = cw / cols;
      const chCell = ch / rows;

      ctx.clearRect(0, 0, cw, ch);
      ctx.font = `${Math.max(7, cwCell * 1.35)}px "JetBrains Mono", ui-monospace, monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      const mx = mouse.current.x;
      const my = mouse.current.y;
      const radius = Math.min(cw, ch) * 0.55;

      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const px = (x + 0.5) * cwCell;
          const py = (y + 0.5) * chCell;

          const dx = px - mx;
          const dy = py - my;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const chaos = mouse.current.active * Math.max(0, 1 - dist / radius);

          // sample source with chaos-driven displacement
          const wob = chaos * 6;
          const sx = Math.round(
            x + Math.sin(time * 3 + y * 0.6) * wob + (Math.random() - 0.5) * chaos * 5,
          );
          const sy = Math.round(
            y + Math.cos(time * 2.4 + x * 0.5) * wob * 0.4 + (Math.random() - 0.5) * chaos * 3,
          );
          if (sx < 0 || sy < 0 || sx >= cols || sy >= rows) continue;

          const lum = (data[(sy * cols + sx) * 4] ?? 0) / 255;
          const flicker = (Math.sin(time * 1.7 + x * 0.35 + y * 0.7) + 1) * 0.5;
          let v = lum * (0.55 + flicker * 0.45) + chaos * 0.35 * Math.random();
          // faint ambient dust outside the letterforms
          if (lum < 0.05 && Math.random() > 0.995) v = 0.12;
          if (v < 0.06) continue;

          const idx = Math.min(CHARS.length - 1, Math.floor(v * CHARS.length));
          const chr = CHARS[idx];
          if (!chr || chr === " ") continue;

          ctx.fillStyle = `rgba(255,255,255,${Math.min(1, 0.25 + v * 0.85)})`;
          ctx.fillText(chr, px, py);
        }
      }
    };

    const onResize = () => build();
    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      mouse.current.x = e.clientX - r.left;
      mouse.current.y = e.clientY - r.top;
      mouse.current.active = 1;
    };
    const onLeave = () => {
      mouse.current.active = 0;
      mouse.current.x = -9999;
      mouse.current.y = -9999;
    };

    build();
    raf = requestAnimationFrame(draw);
    window.addEventListener("resize", onResize);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerleave", onLeave);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerleave", onLeave);
    };
  }, [text, cell]);

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

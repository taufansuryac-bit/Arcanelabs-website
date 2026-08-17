import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  delay?: number;
  /** pixel block size in px */
  block?: number;
};

/**
 * Scroll reveal with a dithered pixel wipe: the content is covered by a grid of
 * background blocks that dissolve away in a random-but-stable order.
 */
export function PixelReveal({ children, className = "", delay = 0, block = 26 }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [shown, setShown] = useState(false);
  const [grid, setGrid] = useState({ cols: 0, rows: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const measure = () => {
      const r = el.getBoundingClientRect();
      setGrid({
        cols: Math.max(1, Math.ceil(r.width / block)),
        rows: Math.max(1, Math.ceil(r.height / block)),
      });
    };
    measure();

    const ro = new ResizeObserver(measure);
    ro.observe(el);

    let timer = 0;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            timer = window.setTimeout(() => setShown(true), delay);
            io.disconnect();
            break;
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);

    return () => {
      window.clearTimeout(timer);
      io.disconnect();
      ro.disconnect();
    };
  }, [delay, block]);

  const cells = useMemo(() => {
    const total = grid.cols * grid.rows;
    if (!total) return [] as number[];
    return Array.from({ length: total }, (_, i) => {
      const x = i % grid.cols;
      const y = Math.floor(i / grid.cols);
      const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
      const rand = s - Math.floor(s);
      // diagonal sweep + randomness => dithered dissolve
      const sweep = (x / grid.cols) * 0.55 + (y / grid.rows) * 0.25;
      return Math.min(1, sweep * 0.7 + rand * 0.45) * 520;
    });
  }, [grid]);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <div
        className="transition-opacity duration-500 ease-out"
        style={{ opacity: shown ? 1 : 0 }}
      >
        {children}
      </div>

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden"
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${grid.cols}, 1fr)`,
          gridTemplateRows: `repeat(${grid.rows}, 1fr)`,
        }}
      >
        {cells.map((d, i) => (
          <span
            key={i}
            style={{
              backgroundColor: "var(--background)",
              opacity: shown ? 0 : 1,
              transition: `opacity 260ms steps(2, end) ${shown ? d : 0}ms`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

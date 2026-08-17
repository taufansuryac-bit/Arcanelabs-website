import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";

type SectionPixelRevealProps = {
  children: ReactNode;
  className?: string;
  threshold?: number;
};

/** One-shot entrance for major screens: blur/offset resolves behind a disposable pixel veil. */
export function SectionPixelReveal({
  children,
  className = "",
  threshold = 0.12,
}: SectionPixelRevealProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [shown, setShown] = useState(false);
  const [completed, setCompleted] = useState(false);

  const cells = useMemo(
    () =>
      Array.from({ length: 96 }, (_, index) => {
        const x = index % 12;
        const y = Math.floor(index / 12);
        const hash = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
        const random = hash - Math.floor(hash);
        const sweep = x / 12 + y / 16;
        return Math.round((random * 0.45 + sweep * 0.55) * 420);
      }),
    [],
  );

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShown(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin: "0px 0px -8% 0px" },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [threshold]);

  useEffect(() => {
    if (!shown || completed) return;
    const timer = window.setTimeout(() => setCompleted(true), 820);
    return () => window.clearTimeout(timer);
  }, [shown, completed]);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <div
        className="transition-[opacity,transform,filter] duration-700 ease-out will-change-[opacity,transform,filter]"
        style={{
          opacity: shown ? 1 : 0,
          transform: shown ? "translate3d(0,0,0)" : "translate3d(0,28px,0)",
          filter: shown ? "blur(0px)" : "blur(9px)",
        }}
      >
        {children}
      </div>

      {!completed && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-20 grid grid-cols-12 grid-rows-8 overflow-hidden"
        >
          {cells.map((delay, index) => (
            <span
              key={index}
              className="bg-background"
              style={{
                opacity: shown ? 0 : 1,
                transform: shown ? "scale(.76)" : "scale(1.04)",
                transition: `opacity 240ms steps(2,end) ${delay}ms, transform 360ms cubic-bezier(.2,.8,.2,1) ${delay}ms`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

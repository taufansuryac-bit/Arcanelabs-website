import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

const PROJECTS = [
  {
    title: "PROJECT 01",
    meta: "Brand / Web",
    image:
      "https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&w=1400&q=88",
  },
  {
    title: "PROJECT 02",
    meta: "Product / UI",
    image:
      "https://images.unsplash.com/photo-1559028012-481c04fa702d?auto=format&fit=crop&w=1400&q=88",
  },
  {
    title: "PROJECT 03",
    meta: "Creative Dev",
    image:
      "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=1400&q=88",
  },
  {
    title: "PROJECT 04",
    meta: "Identity",
    image:
      "https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?auto=format&fit=crop&w=1400&q=88",
  },
  {
    title: "PROJECT 05",
    meta: "Motion",
    image:
      "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1400&q=88",
  },
  {
    title: "PROJECT 06",
    meta: "Interface",
    image:
      "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=1400&q=88",
  },
  {
    title: "PROJECT 07",
    meta: "Experimental",
    image:
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1400&q=88",
  },
  {
    title: "PROJECT 08",
    meta: "System",
    image:
      "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1400&q=88",
  },
] as const;

/** Arcane project wheel — 16:9 screenshot cards with pixel-system framing. */
export function ProjectScrapbookOrbit() {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const rotationRef = useRef(0);
  const velocityRef = useRef(0.014);
  const draggingRef = useRef(false);
  const lastXRef = useRef(0);
  const lastTimeRef = useRef(0);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    let raf = 0;
    let last = performance.now();
    let visible = true;

    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry?.isIntersecting ?? true;
      },
      { rootMargin: "240px 0px" },
    );
    observer.observe(stage);

    const frame = (now: number) => {
      const dt = Math.min(32, now - last);
      last = now;
      if (visible && !draggingRef.current) {
        rotationRef.current += velocityRef.current * dt;
        velocityRef.current += (0.014 - velocityRef.current) * 0.012 * dt;
      }
      stage.style.transform = `rotateX(-4deg) rotateY(${rotationRef.current}deg)`;
      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, []);

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    draggingRef.current = true;
    setDragging(true);
    lastXRef.current = event.clientX;
    lastTimeRef.current = performance.now();
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    const now = performance.now();
    const dx = event.clientX - lastXRef.current;
    const dt = Math.max(1, now - lastTimeRef.current);
    rotationRef.current += dx * 0.17;
    velocityRef.current = (dx / dt) * 0.25;
    lastXRef.current = event.clientX;
    lastTimeRef.current = now;
  };

  const release = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    setDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  return (
    <section className="relative z-10 min-h-[112svh] overflow-hidden border-y border-border bg-background text-foreground">
      <div className="absolute inset-0 bg-grid opacity-45" aria-hidden />
      <div className="pointer-events-none absolute inset-0 bg-vignette" aria-hidden />

      <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-5 py-5 md:px-8">
        <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-muted-foreground">
          Project orbit / drag to rotate
        </p>
        <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-muted-foreground">05</p>
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-[10vh] z-10 text-center">
        <p className="font-display text-[clamp(3rem,8.5vw,8.5rem)] uppercase leading-none tracking-[-0.07em] text-foreground/[0.06]">
          Project Orbit
        </p>
      </div>

      <div
        className={`relative z-10 flex min-h-[112svh] touch-none select-none items-center justify-center ${
          dragging ? "cursor-grabbing" : "cursor-grab"
        }`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={release}
        onPointerCancel={release}
      >
        <div className="relative h-[70vh] w-full [perspective:1450px] md:h-[76vh]">
          <div
            ref={stageRef}
            className="absolute left-1/2 top-1/2 h-0 w-0"
            style={{ transformStyle: "preserve-3d", willChange: "transform" }}
          >
            {PROJECTS.map((project, index) => {
              const angle = (index / PROJECTS.length) * 360;
              return (
                <article
                  key={project.title}
                  className="group absolute left-1/2 top-1/2 w-[280px] overflow-hidden border border-border bg-card [aspect-ratio:16/9] md:w-[430px]"
                  style={{
                    transform: `translate(-50%, -50%) rotateY(${angle}deg) translateZ(clamp(330px, 46vw, 680px))`,
                    backfaceVisibility: "hidden",
                    boxShadow: "8px 8px 0 color-mix(in oklab,var(--foreground) 7%,transparent)",
                  }}
                >
                  <img
                    src={project.image}
                    alt={`${project.title} placeholder screenshot`}
                    loading="lazy"
                    draggable={false}
                    className="absolute inset-0 h-full w-full object-cover grayscale-[0.18] contrast-[1.05] transition duration-500 group-hover:scale-[1.025] group-hover:grayscale-0"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-grid opacity-20 mix-blend-overlay" />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/90 via-background/5 to-transparent" />

                  <span className="absolute left-2 top-2 h-2 w-2 bg-neon" aria-hidden />
                  <span className="absolute right-2 top-2 h-2 w-2 border border-foreground/55" aria-hidden />
                  <span className="absolute bottom-2 left-2 h-2 w-2 border border-foreground/55" aria-hidden />
                  <span className="absolute bottom-2 right-2 h-2 w-2 bg-foreground/75" aria-hidden />

                  <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-4">
                    <div>
                      <p className="font-display text-xl uppercase leading-none tracking-[-0.04em] text-foreground md:text-2xl">
                        {project.title}
                      </p>
                      <p className="mt-1 font-mono text-[8px] uppercase tracking-[0.18em] text-muted-foreground">
                        {project.meta}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="block font-mono text-[8px] uppercase tracking-[0.18em] text-muted-foreground">
                        Screenshot slot
                      </span>
                      <span className="font-mono text-[9px] text-foreground/65">0{index + 1}</span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-6 z-20 flex justify-center">
        <span className="font-mono text-[8px] uppercase tracking-[0.28em] text-muted-foreground">
          Auto rotation / inertia / pixel frame / 3D perspective
        </span>
      </div>
    </section>
  );
}

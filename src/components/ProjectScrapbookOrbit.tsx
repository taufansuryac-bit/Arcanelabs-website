import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";

const PROJECTS = [
  {
    title: "PROJECT 01",
    meta: "Brand / Web",
    year: "2026",
    image:
      "https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&w=1600&q=88",
  },
  {
    title: "PROJECT 02",
    meta: "Product / UI",
    year: "2026",
    image:
      "https://images.unsplash.com/photo-1559028012-481c04fa702d?auto=format&fit=crop&w=1600&q=88",
  },
  {
    title: "PROJECT 03",
    meta: "Creative Dev",
    year: "2026",
    image:
      "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=1600&q=88",
  },
  {
    title: "PROJECT 04",
    meta: "Identity",
    year: "2026",
    image:
      "https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?auto=format&fit=crop&w=1600&q=88",
  },
  {
    title: "PROJECT 05",
    meta: "Motion",
    year: "2026",
    image:
      "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1600&q=88",
  },
  {
    title: "PROJECT 06",
    meta: "Interface",
    year: "2026",
    image:
      "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=1600&q=88",
  },
  {
    title: "PROJECT 07",
    meta: "Experimental",
    year: "2025",
    image:
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1600&q=88",
  },
  {
    title: "PROJECT 08",
    meta: "System",
    year: "2025",
    image:
      "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1600&q=88",
  },
] as const;

const STEP = 360 / PROJECTS.length;

/**
 * Enchanted project carousel — adapted from the standalone CircularCarousel repo.
 * Keeps the Arcane project data and 16:9 pixel framing while replacing the old wheel
 * with a calmer auto-spinning 3D ring, drag inertia and click-to-expand behavior.
 */
export function ProjectScrapbookOrbit() {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const rotationRef = useRef(0);
  const velocityRef = useRef(0.005);
  const visibleRef = useRef(true);
  const draggingRef = useRef(false);
  const movedRef = useRef(false);
  const pointerStartRef = useRef({ x: 0, rotation: 0, time: 0 });
  const [selected, setSelected] = useState<number | null>(null);
  const [hovering, setHovering] = useState(false);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        visibleRef.current = entry?.isIntersecting ?? true;
      },
      { rootMargin: "280px 0px" },
    );
    observer.observe(stage);

    let raf = 0;
    let last = performance.now();
    const frame = (now: number) => {
      const dt = Math.min(34, now - last);
      last = now;

      if (
        visibleRef.current &&
        !document.hidden &&
        !draggingRef.current &&
        selected === null &&
        !hovering
      ) {
        rotationRef.current += dt * 0.0052;
        velocityRef.current += (0.0052 - velocityRef.current) * Math.min(1, dt * 0.018);
      } else if (!draggingRef.current && selected === null) {
        rotationRef.current += velocityRef.current * dt;
        velocityRef.current *= Math.pow(0.94, dt / 16.67);
      }

      stage.style.transform = `translate(-50%, -50%) translateZ(-680px) rotateX(-7deg) rotateY(${rotationRef.current}deg)`;
      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, [hovering, selected]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelected(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    draggingRef.current = true;
    movedRef.current = false;
    setDragging(true);
    pointerStartRef.current = {
      x: event.clientX,
      rotation: rotationRef.current,
      time: performance.now(),
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    const dx = event.clientX - pointerStartRef.current.x;
    if (Math.abs(dx) > 5) movedRef.current = true;
    rotationRef.current = pointerStartRef.current.rotation + dx * 0.2;

    const elapsed = Math.max(16, performance.now() - pointerStartRef.current.time);
    velocityRef.current = (dx / elapsed) * 0.16;
  };

  const releasePointer = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    setDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const selectedProject = selected === null ? null : PROJECTS[selected];
  const stageStyle = {
    transformStyle: "preserve-3d",
    willChange: "transform",
    "--carousel-radius": "clamp(330px, 44vw, 650px)",
  } as CSSProperties;

  return (
    <section className="relative z-10 min-h-[100svh] overflow-hidden border-y border-border bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-35" aria-hidden />
      <div className="pointer-events-none absolute inset-0 bg-vignette opacity-80" aria-hidden />
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        aria-hidden
        style={{
          background:
            "radial-gradient(55% 44% at 50% 48%, color-mix(in oklab,var(--foreground) 8%,transparent), transparent 72%)",
        }}
      />

      <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-5 py-5 md:px-8">
        <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-muted-foreground">
          Project archive / drag to spin · click to expand
        </p>
        <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-muted-foreground">05</p>
      </div>

      <div
        className={`relative z-10 flex min-h-[100svh] touch-none select-none items-center justify-center ${
          dragging ? "cursor-grabbing" : "cursor-grab"
        }`}
        style={{ perspective: "1450px", perspectiveOrigin: "50% 50%" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={releasePointer}
        onPointerCancel={releasePointer}
        onPointerLeave={(event) => {
          releasePointer(event);
          setHovering(false);
        }}
      >
        <div ref={stageRef} className="absolute left-1/2 top-1/2 h-0 w-0" style={stageStyle}>
          {PROJECTS.map((project, index) => {
            const isSelected = selected === index;
            return (
              <button
                key={project.title}
                type="button"
                data-pixel-card
                onMouseEnter={() => setHovering(true)}
                onMouseLeave={() => setHovering(false)}
                onClick={() => {
                  if (movedRef.current) return;
                  setSelected(isSelected ? null : index);
                }}
                className="group absolute left-1/2 top-1/2 aspect-video w-[clamp(250px,31vw,440px)] overflow-hidden border border-border bg-card text-left outline-none transition-[opacity,filter] duration-500 hover:brightness-110 focus-visible:ring-1 focus-visible:ring-neon"
                style={{
                  transform: `translate(-50%, -50%) rotateY(${index * STEP}deg) translateZ(var(--carousel-radius))`,
                  backfaceVisibility: "hidden",
                  opacity: selected !== null && !isSelected ? 0.16 : 1,
                  boxShadow: "8px 8px 0 color-mix(in oklab,var(--foreground) 6%,transparent)",
                }}
                aria-label={`${project.title} — ${project.meta}`}
              >
                <img
                  src={project.image}
                  alt={`${project.title} project preview`}
                  loading="lazy"
                  draggable={false}
                  className="absolute inset-0 h-full w-full object-cover grayscale-[0.1] contrast-[1.06] transition duration-700 group-hover:scale-[1.03] group-hover:grayscale-0"
                />
                <div className="pointer-events-none absolute inset-0 bg-grid opacity-20 mix-blend-overlay" />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/95 via-background/5 to-transparent" />

                <span className="absolute left-2 top-2 h-2 w-2 bg-neon" aria-hidden />
                <span className="absolute right-2 top-2 h-2 w-2 border border-foreground/55" aria-hidden />
                <span className="absolute bottom-2 left-2 h-2 w-2 border border-foreground/55" aria-hidden />
                <span className="absolute bottom-2 right-2 h-2 w-2 bg-foreground/75" aria-hidden />

                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-4">
                  <div>
                    <p className="font-display text-xl uppercase leading-none tracking-[-0.04em] text-foreground md:text-2xl">
                      {project.title}
                    </p>
                    <p className="mt-1 font-mono text-[8px] uppercase tracking-[0.18em] text-muted-foreground md:text-[9px]">
                      {project.meta}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="block font-mono text-[8px] uppercase tracking-[0.18em] text-muted-foreground">
                      {project.year}
                    </span>
                    <span className="font-mono text-[9px] text-foreground/65">/0{index + 1}/</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-6 z-20 flex justify-center px-5 text-center">
        <span className="font-mono text-[8px] uppercase tracking-[0.25em] text-muted-foreground">
          Auto rotation / drag inertia / 3D circular depth / pixel project cards
        </span>
      </div>

      {selectedProject && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-background/78 px-5 backdrop-blur-xl"
          onClick={() => setSelected(null)}
          role="presentation"
        >
          <div
            className="w-full max-w-[980px] border border-border bg-background p-3 shadow-2xl md:p-5"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="relative aspect-video overflow-hidden border border-border bg-card">
              <img
                src={selectedProject.image}
                alt={`${selectedProject.title} expanded project preview`}
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="pointer-events-none absolute inset-0 bg-grid opacity-15 mix-blend-overlay" />
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-6 bg-gradient-to-t from-background via-background/70 to-transparent p-5 pt-20 md:p-7 md:pt-28">
                <div>
                  <p className="font-display text-3xl uppercase tracking-[-0.05em] text-foreground md:text-5xl">
                    {selectedProject.title}
                  </p>
                  <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground md:text-xs">
                    {selectedProject.meta}
                  </p>
                </div>
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  {selectedProject.year}
                </span>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-muted-foreground">
                Selected project / pixel archive
              </span>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="border border-border px-4 py-2 font-mono text-[9px] uppercase tracking-[0.22em] text-foreground transition-colors hover:border-neon hover:text-neon"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

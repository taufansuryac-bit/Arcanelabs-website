import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

const PROJECTS = [
  {
    title: "PROJECT 01",
    meta: "Brand / Web",
    image:
      "https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&w=1200&q=88",
  },
  {
    title: "PROJECT 02",
    meta: "Product / UI",
    image:
      "https://images.unsplash.com/photo-1559028012-481c04fa702d?auto=format&fit=crop&w=1200&q=88",
  },
  {
    title: "PROJECT 03",
    meta: "Creative Dev",
    image:
      "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=1200&q=88",
  },
  {
    title: "PROJECT 04",
    meta: "Identity",
    image:
      "https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?auto=format&fit=crop&w=1200&q=88",
  },
  {
    title: "PROJECT 05",
    meta: "Motion",
    image:
      "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=88",
  },
  {
    title: "PROJECT 06",
    meta: "Interface",
    image:
      "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=1200&q=88",
  },
  {
    title: "PROJECT 07",
    meta: "Experimental",
    image:
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=88",
  },
  {
    title: "PROJECT 08",
    meta: "System",
    image:
      "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=88",
  },
] as const;

/** Original Arcane implementation inspired by a fairground/project wheel, not copied Framer source. */
export function ProjectScrapbookOrbit() {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const rotationRef = useRef(0);
  const velocityRef = useRef(0.018);
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
        velocityRef.current += (0.018 - velocityRef.current) * 0.012 * dt;
      }
      stage.style.transform = `rotateX(-5deg) rotateY(${rotationRef.current}deg)`;
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
    rotationRef.current += dx * 0.18;
    velocityRef.current = (dx / dt) * 0.28;
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
    <section className="relative z-10 min-h-[112svh] overflow-hidden border-y border-white/10 bg-[#0a1937] text-[#f5efdf]">
      <div className="absolute inset-x-0 top-0 flex items-center justify-between px-5 py-5 md:px-8">
        <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-[#f5efdf]/65">
          Project orbit / drag to rotate
        </p>
        <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-[#f5efdf]/65">05</p>
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-[12vh] text-center">
        <p className="font-display text-[clamp(3rem,9vw,9rem)] uppercase leading-none tracking-[-0.07em] text-[#f5efdf]/10">
          Project Orbit
        </p>
      </div>

      <div
        className={`relative flex min-h-[112svh] touch-none select-none items-center justify-center ${
          dragging ? "cursor-grabbing" : "cursor-grab"
        }`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={release}
        onPointerCancel={release}
      >
        <div className="relative h-[72vh] w-full [perspective:1300px] md:h-[78vh]">
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
                  className="absolute left-1/2 top-1/2 w-[210px] overflow-hidden border-[8px] border-[#efe6cf] bg-[#efe6cf] text-[#111] shadow-[0_24px_70px_rgba(0,0,0,.32)] md:w-[300px]"
                  style={{
                    transform: `translate(-50%, -50%) rotateY(${angle}deg) translateZ(clamp(270px, 38vw, 560px))`,
                    backfaceVisibility: "hidden",
                  }}
                >
                  <div className="relative aspect-[4/5] overflow-hidden bg-[#111]">
                    <img
                      src={project.image}
                      alt={`${project.title} placeholder screenshot`}
                      loading="lazy"
                      draggable={false}
                      className="h-full w-full object-cover saturate-[.82] contrast-[1.04]"
                    />
                    <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent_55%,rgba(0,0,0,.42))]" />
                    <span className="absolute bottom-3 left-3 font-mono text-[8px] uppercase tracking-[0.2em] text-white/80">
                      Replace with project screenshot
                    </span>
                  </div>
                  <div className="flex items-end justify-between gap-4 px-3 py-3">
                    <div>
                      <p className="font-display text-xl uppercase leading-none tracking-[-0.04em]">
                        {project.title}
                      </p>
                      <p className="mt-1 font-mono text-[8px] uppercase tracking-[0.18em] text-black/55">
                        {project.meta}
                      </p>
                    </div>
                    <span className="font-mono text-[9px] text-black/45">0{index + 1}</span>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-6 flex justify-center">
        <span className="font-mono text-[8px] uppercase tracking-[0.28em] text-[#f5efdf]/45">
          Auto rotation / inertia / 3D perspective
        </span>
      </div>
    </section>
  );
}

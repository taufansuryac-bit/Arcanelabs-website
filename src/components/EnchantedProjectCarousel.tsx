import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type CardItem =
  | {
      kind: "image";
      id: number;
      srcIndex: number;
      title: string;
      caption: string;
    }
  | {
      kind: "quote";
      id: number;
      quote: string;
      name: string;
      role: string;
      tone: "dark" | "light";
    };

const GALLERY = [
  "https://images.unsplash.com/photo-1520975916090-3105956dac38?auto=format&fit=crop&w=1200&q=88",
  "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1200&q=88",
  "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1200&q=88",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=1200&q=88",
] as const;

const ITEMS: CardItem[] = [
  { kind: "image", id: 0, srcIndex: 0, title: "PROJECT 01", caption: "Brand / Web" },
  {
    kind: "quote",
    id: 1,
    quote: "Every frame lands. It feels like a physical object spinning in front of you.",
    name: "Arcane Labs",
    role: "Creative Direction",
    tone: "light",
  },
  { kind: "image", id: 2, srcIndex: 3, title: "PROJECT 02", caption: "Product / UI" },
  {
    kind: "quote",
    id: 3,
    quote: "Digital systems should feel tactile, intentional and alive — never like a static template.",
    name: "Arcane Labs",
    role: "Visual Engineering",
    tone: "dark",
  },
  { kind: "image", id: 4, srcIndex: 2, title: "PROJECT 03", caption: "Creative Dev" },
  {
    kind: "quote",
    id: 5,
    quote: "We build the motion language and the interface as one continuous system.",
    name: "Arcane Labs",
    role: "Motion / Code",
    tone: "light",
  },
  { kind: "image", id: 6, srcIndex: 1, title: "PROJECT 04", caption: "Identity" },
  {
    kind: "quote",
    id: 7,
    quote: "The interaction is part of the identity. Every transition has to earn its place.",
    name: "Arcane Labs",
    role: "Interaction Design",
    tone: "dark",
  },
  { kind: "image", id: 8, srcIndex: 3, title: "PROJECT 05", caption: "Motion" },
  {
    kind: "quote",
    id: 9,
    quote: "A project is finished when the technology disappears and only the experience remains.",
    name: "Arcane Labs",
    role: "Development",
    tone: "light",
  },
  { kind: "image", id: 10, srcIndex: 2, title: "PROJECT 06", caption: "Experimental" },
  {
    kind: "quote",
    id: 11,
    quote: "New tools matter only when they let us create a visual language we could not build before.",
    name: "Arcane Labs",
    role: "Research / AI",
    tone: "dark",
  },
];

const RADIUS = 620;
const STEP = 360 / ITEMS.length;
const AUTO_SPEED = 0.005;

export function EnchantedProjectCarousel() {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const angleRef = useRef(0);
  const velocityRef = useRef(AUTO_SPEED);
  const visibleRef = useRef(true);
  const dragRef = useRef({ active: false, x: 0, start: 0, moved: false, time: 0 });
  const [selected, setSelected] = useState<number | null>(null);
  const [hovering, setHovering] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [photo, setPhoto] = useState<Record<number, number>>({});

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        visibleRef.current = entry?.isIntersecting ?? true;
      },
      { rootMargin: "260px 0px" },
    );
    observer.observe(stage);

    let raf = 0;
    let last = performance.now();
    const frame = (now: number) => {
      const dt = Math.min(34, now - last);
      last = now;

      if (visibleRef.current && !document.hidden && !dragRef.current.active && selected === null && !hovering) {
        angleRef.current += dt * AUTO_SPEED;
        velocityRef.current += (AUTO_SPEED - velocityRef.current) * Math.min(1, dt * 0.018);
      } else if (!dragRef.current.active && selected === null) {
        angleRef.current += velocityRef.current * dt;
        velocityRef.current *= Math.pow(0.94, dt / 16.67);
      }

      stage.style.transform = `translate(-50%, -50%) translateZ(-700px) rotateX(-8deg) rotateY(${angleRef.current}deg)`;
      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, [hovering, selected]);

  useEffect(() => {
    const imageIds = ITEMS.filter((item) => item.kind === "image").map((item) => item.id);
    const timer = window.setInterval(() => {
      const picked = imageIds[Math.floor(Math.random() * imageIds.length)] ?? 0;
      setPhoto((previous) => {
        const item = ITEMS.find((entry) => entry.id === picked);
        if (!item || item.kind !== "image") return previous;
        const current = previous[picked] ?? item.srcIndex;
        return { ...previous, [picked]: (current + 1) % GALLERY.length };
      });
    }, 2600);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelected(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const onPointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    dragRef.current = {
      active: true,
      x: event.clientX,
      start: angleRef.current,
      moved: false,
      time: performance.now(),
    };
    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  }, []);

  const onPointerMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current.active) return;
    const dx = event.clientX - dragRef.current.x;
    if (Math.abs(dx) > 4) dragRef.current.moved = true;
    angleRef.current = dragRef.current.start + dx * 0.25;
    const elapsed = Math.max(16, performance.now() - dragRef.current.time);
    velocityRef.current = (dx / elapsed) * 0.12;
  }, []);

  const releasePointer = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current.active) return;
    dragRef.current.active = false;
    setDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }, []);

  const selectedItem = useMemo(
    () => (selected === null ? null : ITEMS.find((item) => item.id === selected) ?? null),
    [selected],
  );

  return (
    <section className="relative isolate z-10 overflow-hidden border-y border-border bg-background text-foreground">
      <style>{`
        @keyframes enchanted-pixel-in {
          0% { opacity: 0; filter: blur(10px) contrast(220%) saturate(150%); transform: scale(1.06); }
          60% { opacity: 1; filter: blur(3px) contrast(150%) saturate(120%); }
          100% { opacity: 1; filter: none; transform: scale(1); }
        }
        @keyframes enchanted-pixel-out {
          0% { opacity: 1; filter: none; }
          100% { opacity: 0; filter: blur(12px) contrast(240%) saturate(170%); }
        }
        @keyframes enchanted-card-pop {
          0% { opacity: 0; transform: translateZ(-400px) scale(.55); }
          100% { opacity: 1; transform: translateZ(0) scale(1); }
        }
        .stage-glow {
          background:
            radial-gradient(60% 45% at 50% 42%, color-mix(in oklab, var(--neon) 14%, transparent), transparent 70%),
            radial-gradient(90% 70% at 50% 100%, color-mix(in oklab, var(--foreground) 7%, transparent), transparent 75%);
        }
        .ring-card { transform-style: preserve-3d; transition: filter 400ms ease, opacity 500ms ease; }
        .ring-card:hover { filter: brightness(1.12); }
        .pixel-in { image-rendering: pixelated; animation: enchanted-pixel-in 900ms steps(7,end) both; z-index: 1; }
        .pixel-out { image-rendering: pixelated; animation: enchanted-pixel-out 900ms steps(7,end) both; z-index: 0; }
        .card-pop { animation: enchanted-card-pop 620ms cubic-bezier(.22,1,.36,1) both; }
      `}</style>

      <div className="stage-glow pointer-events-none absolute inset-0 -z-10" aria-hidden />
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-30" aria-hidden />

      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center justify-between px-5 py-5 md:px-8">
        <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-muted-foreground">
          Project archive / drag to spin · click to expand
        </p>
        <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-muted-foreground">02</p>
      </div>

      <div
        className={`relative h-[72vh] min-h-[500px] w-full touch-none select-none ${dragging ? "cursor-grabbing" : "cursor-grab"}`}
        style={{ perspective: "1400px", perspectiveOrigin: "50% 50%" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={releasePointer}
        onPointerCancel={releasePointer}
        onPointerLeave={(event) => {
          releasePointer(event);
          setHovering(false);
        }}
      >
        <div
          ref={stageRef}
          className="absolute left-1/2 top-1/2 h-0 w-0"
          style={{ transformStyle: "preserve-3d", willChange: "transform" }}
        >
          {ITEMS.map((item, index) => {
            const isSelected = selected === item.id;
            return (
              <button
                key={item.id}
                type="button"
                className="ring-card absolute left-1/2 top-1/2 h-[180px] w-[280px] rounded-2xl text-left outline-none focus-visible:ring-1 focus-visible:ring-neon"
                style={{
                  transform: `translate(-50%, -50%) rotateY(${index * STEP}deg) translateZ(${RADIUS}px)`,
                  backfaceVisibility: "hidden",
                  opacity: selected !== null && !isSelected ? 0.18 : 1,
                }}
                onMouseEnter={() => setHovering(true)}
                onMouseLeave={() => setHovering(false)}
                onClick={() => {
                  if (dragRef.current.moved) return;
                  setSelected(isSelected ? null : item.id);
                }}
                aria-label={item.kind === "image" ? item.title : item.name}
              >
                <CardFace
                  item={item}
                  hidden={isSelected}
                  photoIndex={item.kind === "image" ? photo[item.id] : undefined}
                />
              </button>
            );
          })}
        </div>
      </div>

      {selectedItem && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-background/75 px-6 backdrop-blur-xl"
          onClick={() => setSelected(null)}
        >
          <div className="card-pop w-full max-w-[680px]" onClick={(event) => event.stopPropagation()}>
            <div className="aspect-[340/220] w-full">
              <CardFace
                item={selectedItem}
                expanded
                photoIndex={selectedItem.kind === "image" ? photo[selectedItem.id] : undefined}
              />
            </div>
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="mx-auto mt-6 block rounded-full border border-border px-5 py-2 font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground transition-colors hover:text-foreground"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function CardFace({
  item,
  hidden,
  expanded,
  photoIndex,
}: {
  item: CardItem;
  hidden?: boolean;
  expanded?: boolean;
  photoIndex?: number;
}) {
  const base =
    "relative flex h-full w-full flex-col overflow-hidden rounded-2xl border border-border/60 shadow-[0_30px_60px_-20px_rgba(0,0,0,.72)] transition-opacity duration-300";

  if (item.kind === "image") {
    const activeIndex = photoIndex ?? item.srcIndex;
    return (
      <div className={base} style={{ opacity: hidden ? 0 : 1 }}>
        <div className="relative h-full w-full bg-card">
          {GALLERY.map((src, galleryIndex) => (
            <img
              key={src}
              src={src}
              alt={item.title}
              loading="lazy"
              width={768}
              height={512}
              className={`absolute inset-0 h-full w-full object-cover ${galleryIndex === activeIndex ? "pixel-in" : "pixel-out"}`}
            />
          ))}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-4 text-white">
          <span className={`font-display uppercase tracking-tight ${expanded ? "text-4xl" : "text-xl"}`}>
            {item.title}
          </span>
          <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/65">
            {item.caption}
          </span>
        </div>
      </div>
    );
  }

  const light = item.tone === "light";
  return (
    <div
      className={`${base} justify-between ${light ? "bg-[#ece9df] text-[#171717]" : "bg-[#101113] text-[#f2f2ef]"}`}
      style={{ opacity: hidden ? 0 : 1 }}
    >
      <div className={expanded ? "p-8" : "p-5"}>
        <span className="text-neon">&ldquo;</span>
        <p className={`mt-2 leading-relaxed ${expanded ? "text-lg" : "text-[11px] leading-[1.6]"}`}>
          {item.quote}
        </p>
      </div>
      <div className={`flex items-center gap-3 ${expanded ? "p-8 pt-0" : "p-5 pt-0"}`}>
        <div className="h-8 w-8 rounded-full bg-neon/20 ring-1 ring-neon/40" />
        <div>
          <p className={expanded ? "text-sm font-semibold" : "text-[11px] font-semibold"}>{item.name}</p>
          <p className={`font-mono text-[9px] uppercase tracking-[0.16em] ${light ? "text-black/50" : "text-white/45"}`}>
            {item.role}
          </p>
        </div>
      </div>
    </div>
  );
}

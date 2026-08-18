import { useCallback, useEffect, useRef, useState } from "react";

const gallery = [
  "https://raw.githubusercontent.com/taufansuryac-bit/enchanted-carousel/main/src/assets/card-1.jpg",
  "https://raw.githubusercontent.com/taufansuryac-bit/enchanted-carousel/main/src/assets/card-2.jpg",
  "https://raw.githubusercontent.com/taufansuryac-bit/enchanted-carousel/main/src/assets/card-3.jpg",
  "https://raw.githubusercontent.com/taufansuryac-bit/enchanted-carousel/main/src/assets/card-4.jpg",
] as const;

type CardItem =
  | { kind: "image"; id: number; srcIndex: number; title: string; caption: string }
  | {
      kind: "quote";
      id: number;
      quote: string;
      name: string;
      role: string;
      tone: "dark" | "light";
    };

const items: CardItem[] = [
  { kind: "image", id: 0, srcIndex: 0, title: "PASSION", caption: "Editorial / 01" },
  {
    kind: "quote",
    id: 1,
    quote:
      "This incredible tool has been a true game-changer for our business, helping us scale operations and automate our most complex workflows effortlessly.",
    name: "James Walker",
    role: "UI/UX Designer",
    tone: "dark",
  },
  { kind: "image", id: 2, srcIndex: 1, title: "NIGHT MODE", caption: "Portrait / 02" },
  {
    kind: "quote",
    id: 3,
    quote:
      "Everything got lighter. The team ships twice as fast and the interface still feels calm and deliberate.",
    name: "Lucas Thompson",
    role: "SEO Specialist",
    tone: "light",
  },
  { kind: "image", id: 4, srcIndex: 2, title: "RED STROKE", caption: "Art Direction / 03" },
  {
    kind: "quote",
    id: 5,
    quote:
      "Data control without the noise. We finally trust what we see, and so do our clients.",
    name: "Amelia Ross",
    role: "Product Lead",
    tone: "dark",
  },
  { kind: "image", id: 6, srcIndex: 3, title: "STREET", caption: "Lookbook / 04" },
  {
    kind: "quote",
    id: 7,
    quote:
      "The motion, the detail, the restraint — it reads like a studio piece rather than a template.",
    name: "Noah Bennett",
    role: "Creative Director",
    tone: "light",
  },
  { kind: "image", id: 8, srcIndex: 1, title: "SILHOUETTE", caption: "Series / 05" },
  {
    kind: "quote",
    id: 9,
    quote:
      "We use AI to control data. We specialize in this format and it finally feels effortless.",
    name: "Isla Foreman",
    role: "Data Lead",
    tone: "dark",
  },
  { kind: "image", id: 10, srcIndex: 3, title: "CONTRAST", caption: "Studio / 06" },
  {
    kind: "quote",
    id: 11,
    quote: "Every frame lands. It feels like a physical object spinning in front of you.",
    name: "Mia Carter",
    role: "Art Buyer",
    tone: "light",
  },
];

const RADIUS = 620;
const STEP = 360 / items.length;

export function EnchantedProjectCarousel() {
  const [angle, setAngle] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [hovering, setHovering] = useState(false);
  const [photo, setPhoto] = useState<Record<number, number>>({});
  const drag = useRef<{ active: boolean; x: number; start: number; moved: boolean }>({
    active: false,
    x: 0,
    start: 0,
    moved: false,
  });
  const raf = useRef<number | null>(null);

  const paused = selected !== null || hovering || drag.current.active;

  useEffect(() => {
    let last = performance.now();
    const tick = (now: number) => {
      const dt = now - last;
      last = now;
      if (!paused) setAngle((a) => a + dt * 0.005);
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [paused]);

  useEffect(() => {
    const imageIds = items.filter((i) => i.kind === "image").map((i) => i.id);
    const id = window.setInterval(() => {
      const pick = imageIds[Math.floor(Math.random() * imageIds.length)] ?? 0;
      setPhoto((p) => {
        const item = items.find((i) => i.id === pick) as Extract<CardItem, { kind: "image" }>;
        const current = p[pick] ?? item.srcIndex;
        return { ...p, [pick]: (current + 1) % gallery.length };
      });
    }, 2600);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSelected(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      drag.current = { active: true, x: e.clientX, start: angle, moved: false };
      (e.target as Element).setPointerCapture?.(e.pointerId);
    },
    [angle],
  );

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!drag.current.active) return;
    const dx = e.clientX - drag.current.x;
    if (Math.abs(dx) > 4) drag.current.moved = true;
    setAngle(drag.current.start + dx * 0.25);
  }, []);

  const onPointerUp = useCallback(() => {
    drag.current.active = false;
  }, []);

  const selectedItem = selected === null ? null : items.find((i) => i.id === selected)!;

  return (
    <div className="relative isolate w-full overflow-hidden">
      <style>{`
        .enchanted-stage-glow {
          background:
            radial-gradient(60% 45% at 50% 42%, rgba(111, 18, 18, .18), transparent 70%),
            radial-gradient(90% 70% at 50% 100%, rgba(24, 27, 33, .68), transparent 75%);
        }
        .enchanted-ring-card {
          transform-style: preserve-3d;
          transition: filter 400ms ease;
        }
        .enchanted-ring-card:hover { filter: brightness(1.12); }
        @keyframes enchanted-pixel-in {
          0% { opacity: 0; filter: blur(10px) contrast(220%) saturate(160%); transform: scale(1.06); }
          60% { opacity: 1; filter: blur(3px) contrast(150%) saturate(120%); }
          100% { opacity: 1; filter: none; transform: scale(1); }
        }
        @keyframes enchanted-pixel-out {
          0% { opacity: 1; filter: none; }
          100% { opacity: 0; filter: blur(12px) contrast(240%) saturate(180%); }
        }
        .pixel-in { image-rendering: pixelated; animation: enchanted-pixel-in 900ms steps(7,end) both; z-index: 1; }
        .pixel-out { image-rendering: pixelated; animation: enchanted-pixel-out 900ms steps(7,end) both; z-index: 0; }
        @keyframes enchanted-card-pop {
          0% { opacity: 0; transform: translateZ(-400px) scale(.55); }
          100% { opacity: 1; transform: translateZ(0) scale(1); }
        }
        .card-pop { animation: enchanted-card-pop 620ms cubic-bezier(.22,1,.36,1) both; }
      `}</style>

      <div className="enchanted-stage-glow pointer-events-none absolute inset-0 -z-10" />

      <div
        className="relative h-[70vh] min-h-[460px] w-full cursor-grab select-none active:cursor-grabbing"
        style={{ perspective: "1400px", perspectiveOrigin: "50% 50%" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={() => {
          onPointerUp();
          setHovering(false);
        }}
      >
        <div
          className="absolute left-1/2 top-1/2"
          style={{
            transformStyle: "preserve-3d",
            transform: `translate(-50%, -50%) translateZ(-700px) rotateX(-8deg) rotateY(${angle}deg)`,
          }}
        >
          {items.map((item, i) => {
            const isSelected = selected === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onMouseEnter={() => setHovering(true)}
                onMouseLeave={() => setHovering(false)}
                onClick={() => {
                  if (drag.current.moved) return;
                  setSelected(isSelected ? null : item.id);
                }}
                className="enchanted-ring-card absolute left-1/2 top-1/2 h-[180px] w-[280px] -translate-x-1/2 -translate-y-1/2 rounded-2xl text-left outline-none"
                style={{
                  transform: `rotateY(${i * STEP}deg) translateZ(${RADIUS}px)`,
                  opacity: selected !== null && !isSelected ? 0.18 : 1,
                  transition: "opacity 600ms ease",
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 px-6 backdrop-blur-xl"
          onClick={() => setSelected(null)}
        >
          <div
            className="card-pop w-full max-w-[680px]"
            onClick={(e) => e.stopPropagation()}
            style={{ perspective: "1200px" }}
          >
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
              className="mx-auto mt-6 block rounded-full border border-border px-5 py-2 text-xs uppercase tracking-[0.25em] text-muted-foreground transition-colors hover:text-foreground"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
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
  photoIndex?: number | undefined;
}) {
  const base =
    "relative flex h-full w-full flex-col overflow-hidden rounded-2xl border border-border/60 shadow-[0_30px_60px_-20px_rgba(0,0,0,.75)] transition-opacity duration-300";

  if (item.kind === "image") {
    const index = photoIndex ?? item.srcIndex;
    return (
      <div className={base} style={{ opacity: hidden ? 0 : 1 }}>
        <div className="relative h-full w-full">
          {gallery.map((src, gi) => (
            <img
              key={src}
              src={src}
              alt={item.title}
              loading="lazy"
              width={768}
              height={512}
              className={`absolute inset-0 h-full w-full object-cover ${
                gi === index ? "pixel-in" : "pixel-out"
              }`}
            />
          ))}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-background/85 via-transparent to-transparent" />
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-4">
          <span
            className={`font-display uppercase tracking-tight text-neon ${
              expanded ? "text-4xl" : "text-xl"
            }`}
          >
            {item.title}
          </span>
          <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            {item.caption}
          </span>
        </div>
      </div>
    );
  }

  const dark = item.tone === "dark";
  return (
    <div
      className={`${base} justify-between ${
        dark ? "bg-[#101113] text-[#f3f3f1]" : "bg-[#eee8dc] text-[#181818]"
      }`}
      style={{ opacity: hidden ? 0 : 1 }}
    >
      <div className={expanded ? "p-8" : "p-5"}>
        <span className="text-neon">&ldquo;</span>
        <p className={`mt-2 leading-relaxed ${expanded ? "text-lg" : "text-[11px] leading-[1.6]"}`}>
          {item.quote}
        </p>
      </div>
      <div className={`flex items-center gap-3 ${expanded ? "p-8 pt-0" : "p-5 pt-0"}`}>
        <div className="h-8 w-8 rounded-full bg-neon/20" />
        <div>
          <p className={expanded ? "text-sm font-semibold" : "text-[11px] font-semibold"}>
            {item.name}
          </p>
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            {item.role}
          </p>
        </div>
      </div>
    </div>
  );
}

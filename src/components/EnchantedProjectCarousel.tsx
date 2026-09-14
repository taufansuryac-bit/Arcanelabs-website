import { useCallback, useEffect, useRef, useState } from "react";
import {
  isDocumentVisible,
  observeDocumentVisibility,
  observeElementVisibility,
  observeReducedMotion,
  prefersReducedMotion,
  shouldAnimate,
} from "@/lib/animation-runtime";

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
    quote: "Data control without the noise. We finally trust what we see, and so do our clients.",
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

const STEP = 360 / items.length;

export function EnchantedProjectCarousel() {
  const [angle, setAngle] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [hovering, setHovering] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [photo, setPhoto] = useState<Record<number, number>>({});
  const [active, setActive] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(prefersReducedMotion);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const drag = useRef<{ active: boolean; x: number; start: number; moved: boolean }>({
    active: false,
    x: 0,
    start: 0,
    moved: false,
  });
  const raf = useRef<number | null>(null);

  const paused = selected !== null || hovering || dragging;

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    let pageVisible = isDocumentVisible();
    let inViewport = true;
    let reduced = prefersReducedMotion();

    const sync = () => setActive(shouldAnimate(pageVisible, inViewport, reduced));
    const disconnectViewport = observeElementVisibility(
      stage,
      (visible) => {
        inViewport = visible;
        sync();
      },
      { rootMargin: "240px" },
    );
    const disconnectDocument = observeDocumentVisibility((visible) => {
      pageVisible = visible;
      sync();
    });
    const disconnectReducedMotion = observeReducedMotion((nextReduced) => {
      reduced = nextReduced;
      setReducedMotion(nextReduced);
      sync();
    });

    setReducedMotion(reduced);
    sync();

    return () => {
      disconnectViewport();
      disconnectDocument();
      disconnectReducedMotion();
    };
  }, []);

  useEffect(() => {
    if (!active || reducedMotion || paused) return;

    let last = performance.now();
    const tick = (now: number) => {
      const dt = now - last;
      last = now;
      setAngle((current) => current + dt * 0.004);
      raf.current = requestAnimationFrame(tick);
    };

    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current !== null) {
        cancelAnimationFrame(raf.current);
        raf.current = null;
      }
    };
  }, [active, paused, reducedMotion]);

  useEffect(() => {
    if (!active || reducedMotion) return;

    const imageIds = items.filter((item) => item.kind === "image").map((item) => item.id);
    const id = window.setInterval(() => {
      const pick = imageIds[Math.floor(Math.random() * imageIds.length)] ?? 0;
      setPhoto((currentPhotos) => {
        const item = items.find((candidate) => candidate.id === pick) as Extract<
          CardItem,
          { kind: "image" }
        >;
        const current = currentPhotos[pick] ?? item.srcIndex;
        return { ...currentPhotos, [pick]: (current + 1) % gallery.length };
      });
    }, 2600);

    return () => window.clearInterval(id);
  }, [active, reducedMotion]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setSelected(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (selected === null) return;

    const root = document.documentElement;
    const previousOverflow = root.style.overflow;
    root.style.overflow = "hidden";

    return () => {
      root.style.overflow = previousOverflow;
    };
  }, [selected]);

  const onPointerDown = useCallback(
    (event: React.PointerEvent) => {
      drag.current = { active: true, x: event.clientX, start: angle, moved: false };
      setDragging(true);
      (event.currentTarget as Element).setPointerCapture?.(event.pointerId);
    },
    [angle],
  );

  const onPointerMove = useCallback((event: React.PointerEvent) => {
    if (!drag.current.active) return;
    const dx = event.clientX - drag.current.x;
    if (Math.abs(dx) > 4) drag.current.moved = true;
    setAngle(drag.current.start + dx * 0.25);
  }, []);

  const onPointerUp = useCallback(() => {
    drag.current.active = false;
    setDragging(false);
  }, []);

  const selectedItem = selected === null ? null : items.find((item) => item.id === selected)!;

  return (
    <div className="relative isolate w-full overflow-hidden bg-transparent">
      <style>{`
        .enchanted-carousel-stage {
          --carousel-card-w: clamp(170px, 54vw, 220px);
          --carousel-card-h: clamp(110px, 35vw, 145px);
          --carousel-radius: clamp(260px, 78vw, 330px);
          --carousel-camera-z: clamp(-560px, -130vw, -450px);
          --carousel-perspective: 900px;
          --carousel-tilt: -2deg;
        }
        @media (min-width: 768px) {
          .enchanted-carousel-stage {
            --carousel-card-w: clamp(380px, 22vw, 430px);
            --carousel-card-h: clamp(238px, 14vw, 270px);
            --carousel-radius: clamp(800px, 52vw, 1050px);
            --carousel-camera-z: clamp(-980px, -48vw, -820px);
            --carousel-perspective: clamp(1900px, 110vw, 2300px);
            --carousel-tilt: -2deg;
          }
        }
        .enchanted-ring-stage {
          transform-style: preserve-3d;
          will-change: transform;
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
        @media (prefers-reduced-motion: reduce) {
          .enchanted-ring-card,
          .pixel-in,
          .pixel-out,
          .card-pop {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>

      <div
        ref={stageRef}
        className="enchanted-carousel-stage relative h-[68svh] min-h-[430px] max-h-[600px] w-full touch-pan-y cursor-grab select-none active:cursor-grabbing md:h-[56svh] md:min-h-[480px] md:max-h-[620px]"
        style={{
          perspective: "var(--carousel-perspective)",
          perspectiveOrigin: "50% 50%",
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onPointerLeave={() => {
          onPointerUp();
          setHovering(false);
        }}
      >
        <div
          className="enchanted-ring-stage absolute left-1/2 top-1/2 md:top-[46%]"
          style={{
            transform: `translate(-50%, -50%) translateZ(var(--carousel-camera-z)) rotateX(var(--carousel-tilt)) rotateY(${angle}deg)`,
          }}
        >
          {items.map((item, index) => {
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
                className="enchanted-ring-card absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-2xl text-left outline-none"
                style={{
                  width: "var(--carousel-card-w)",
                  height: "var(--carousel-card-h)",
                  transform: `rotateY(${index * STEP}deg) translateZ(var(--carousel-radius))`,
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
          role="dialog"
          aria-modal="true"
          aria-label="Project preview"
          className="fixed inset-0 z-50 flex items-center justify-center overscroll-contain bg-background/80 px-5 py-6 backdrop-blur-xl"
          onClick={() => setSelected(null)}
        >
          <div
            className="card-pop w-full max-w-[680px]"
            onClick={(event) => event.stopPropagation()}
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
          {gallery.map((src, galleryIndex) => (
            <img
              key={src}
              src={src}
              alt={item.title}
              loading="lazy"
              width={768}
              height={512}
              className={`absolute inset-0 h-full w-full object-cover ${
                galleryIndex === index ? "pixel-in" : "pixel-out"
              }`}
            />
          ))}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-background/85 via-transparent to-transparent" />
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-3 md:p-4">
          <span
            className={`font-display uppercase tracking-tight text-neon ${
              expanded ? "text-3xl md:text-4xl" : "text-lg md:text-xl"
            }`}
          >
            {item.title}
          </span>
          <span className="text-[8px] uppercase tracking-[0.18em] text-muted-foreground md:text-[10px] md:tracking-[0.2em]">
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
      <div className={expanded ? "p-6 md:p-8" : "p-4 md:p-5"}>
        <span className="text-neon">&ldquo;</span>
        <p
          className={`mt-2 leading-relaxed ${
            expanded
              ? "text-base md:text-lg"
              : "text-[9px] leading-[1.5] md:text-[11px] md:leading-[1.6]"
          }`}
        >
          {item.quote}
        </p>
      </div>
      <div
        className={`flex items-center gap-3 ${
          expanded ? "p-6 pt-0 md:p-8 md:pt-0" : "p-4 pt-0 md:p-5 md:pt-0"
        }`}
      >
        <div className="h-7 w-7 rounded-full bg-neon/20 md:h-8 md:w-8" />
        <div>
          <p
            className={
              expanded ? "text-sm font-semibold" : "text-[9px] font-semibold md:text-[11px]"
            }
          >
            {item.name}
          </p>
          <p className="text-[8px] uppercase tracking-[0.16em] text-muted-foreground md:text-[10px] md:tracking-[0.18em]">
            {item.role}
          </p>
        </div>
      </div>
    </div>
  );
}

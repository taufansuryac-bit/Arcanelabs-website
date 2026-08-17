import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";

type CapabilityId = "branding" | "uiux" | "development" | "motion";

type Card = {
  image: string;
  label: string;
  left: string;
  top: string;
  width: string;
  rotate: number;
};

type Capability = {
  id: CapabilityId;
  title: string;
  eyebrow: string;
  cards: Card[];
};

const CAPABILITIES: Capability[] = [
  {
    id: "branding",
    title: "BRANDING",
    eyebrow: "Identity / Graphic Systems",
    cards: [
      {
        image:
          "https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&w=900&q=82",
        label: "Brand Systems",
        left: "4%",
        top: "19%",
        width: "15rem",
        rotate: -4,
      },
      {
        image:
          "https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?auto=format&fit=crop&w=900&q=82",
        label: "Campaign Identity",
        left: "68%",
        top: "12%",
        width: "12rem",
        rotate: 3,
      },
      {
        image:
          "https://images.unsplash.com/photo-1547891654-e66ed7ebb968?auto=format&fit=crop&w=900&q=82",
        label: "Art Direction",
        left: "10%",
        top: "64%",
        width: "17rem",
        rotate: 2,
      },
      {
        image:
          "https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&w=900&q=82",
        label: "Logo / Graphic",
        left: "78%",
        top: "55%",
        width: "14rem",
        rotate: -3,
      },
    ],
  },
  {
    id: "uiux",
    title: "UI/UX",
    eyebrow: "Web & App Design / UX Research",
    cards: [
      {
        image:
          "https://images.unsplash.com/photo-1559028012-481c04fa702d?auto=format&fit=crop&w=900&q=82",
        label: "Product Interface",
        left: "9%",
        top: "15%",
        width: "14rem",
        rotate: -2,
      },
      {
        image:
          "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=900&q=82",
        label: "UX Research",
        left: "72%",
        top: "23%",
        width: "15rem",
        rotate: 4,
      },
      {
        image:
          "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=900&q=82",
        label: "Mobile Systems",
        left: "3%",
        top: "60%",
        width: "12rem",
        rotate: 3,
      },
      {
        image:
          "https://images.unsplash.com/photo-1558655146-9f40138edfeb?auto=format&fit=crop&w=900&q=82",
        label: "Prototype",
        left: "66%",
        top: "69%",
        width: "17rem",
        rotate: -3,
      },
    ],
  },
  {
    id: "development",
    title: "WEB DEVELOPMENT",
    eyebrow: "Frontend / Creative Development",
    cards: [
      {
        image:
          "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=900&q=82",
        label: "Frontend Systems",
        left: "4%",
        top: "22%",
        width: "15rem",
        rotate: 2,
      },
      {
        image:
          "https://images.unsplash.com/photo-1547658719-da2b51169166?auto=format&fit=crop&w=900&q=82",
        label: "Immersive Web",
        left: "70%",
        top: "16%",
        width: "18rem",
        rotate: -2,
      },
      {
        image:
          "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=900&q=82",
        label: "Creative Technology",
        left: "10%",
        top: "67%",
        width: "13rem",
        rotate: -4,
      },
      {
        image:
          "https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?auto=format&fit=crop&w=900&q=82",
        label: "Performance",
        left: "76%",
        top: "64%",
        width: "13rem",
        rotate: 3,
      },
    ],
  },
  {
    id: "motion",
    title: "MOTION / INTERACTION",
    eyebrow: "Motion Design / Interactive Systems",
    cards: [
      {
        image:
          "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=900&q=82",
        label: "Motion Systems",
        left: "7%",
        top: "17%",
        width: "14rem",
        rotate: -3,
      },
      {
        image:
          "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=900&q=82",
        label: "Interactive",
        left: "74%",
        top: "24%",
        width: "16rem",
        rotate: 3,
      },
      {
        image:
          "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=900&q=82",
        label: "Realtime Visuals",
        left: "10%",
        top: "68%",
        width: "16rem",
        rotate: 2,
      },
      {
        image:
          "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=82",
        label: "Transitions",
        left: "67%",
        top: "70%",
        width: "14rem",
        rotate: -4,
      },
    ],
  },
];

const DEFAULT_CAPABILITY = CAPABILITIES[0]!;

function PixelCard({ card, index }: { card: Card; index: number }) {
  return (
    <motion.figure
      initial={{ opacity: 0, scale: 0.76, y: 34 + index * 6, filter: "blur(18px)" }}
      animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
      exit={{ opacity: 0, scale: 1.08, y: -24 - index * 5, filter: "blur(16px)" }}
      transition={{
        opacity: { duration: 0.28 },
        filter: { duration: 0.38 },
        scale: { type: "spring", stiffness: 110, damping: 20, mass: 0.6 },
        y: { type: "spring", stiffness: 95, damping: 22, mass: 0.7 },
        delay: index * 0.035,
      }}
      className="group absolute overflow-hidden border border-border bg-card shadow-[0_18px_50px_rgba(0,0,0,.18)]"
      style={{
        left: card.left,
        top: card.top,
        width: card.width,
        rotate: card.rotate,
      }}
    >
      <div className="relative aspect-[1.45/1] overflow-hidden">
        <motion.img
          src={card.image}
          alt={card.label}
          loading="lazy"
          className="h-full w-full object-cover saturate-[.82] contrast-[1.04]"
          initial={{ scale: 1.12 }}
          animate={{ scale: 1 }}
          exit={{ scale: 1.08 }}
          transition={{ duration: 0.72, ease: [0.16, 1, 0.3, 1] }}
        />
        <div className="pixel-veil absolute inset-0 opacity-35" aria-hidden />
        <div
          className="pointer-events-none absolute inset-0 opacity-0 mix-blend-screen transition-opacity duration-300 group-hover:opacity-100"
          style={{
            background:
              "linear-gradient(135deg, transparent 20%, color-mix(in oklab,var(--neon) 22%,transparent) 48%, transparent 72%)",
          }}
        />
      </div>
      <figcaption className="flex items-center justify-between border-t border-border bg-background/90 px-3 py-2 backdrop-blur-sm">
        <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-foreground/80">
          {card.label}
        </span>
        <span className="h-1.5 w-1.5 bg-neon" aria-hidden />
      </figcaption>
    </motion.figure>
  );
}

/** Our Identity V2 — capability stack drives a floating project constellation. */
export function IdentityConstellation() {
  const [activeId, setActiveId] = useState<CapabilityId>("branding");
  const active = useMemo<Capability>(
    () => CAPABILITIES.find((capability) => capability.id === activeId) ?? DEFAULT_CAPABILITY,
    [activeId],
  );

  return (
    <section
      id="studio"
      className="relative z-10 min-h-[100svh] overflow-hidden border-t border-border px-5 py-20 md:px-8 md:py-24"
    >
      <div className="relative z-30 flex items-baseline justify-between">
        <h2 className="font-display text-2xl uppercase tracking-tight md:text-4xl">Our Identity</h2>
        <span className="label-mono">02</span>
      </div>

      <div className="relative mx-auto mt-12 min-h-[72svh] max-w-[118rem] md:mt-6">
        <div className="pointer-events-none absolute inset-0 hidden md:block" aria-hidden>
          <AnimatePresence mode="sync">
            <motion.div
              key={active.id}
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22 }}
            >
              {active.cards.map((card, index) => (
                <PixelCard key={`${active.id}-${card.label}`} card={card} index={index} />
              ))}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="relative z-20 flex min-h-[58svh] flex-col items-center justify-center md:min-h-[72svh]">
          <motion.p
            key={active.eyebrow}
            initial={{ opacity: 0, y: 8, filter: "blur(7px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            className="mb-5 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground md:mb-3"
          >
            {active.eyebrow}
          </motion.p>

          <div className="flex w-full max-w-5xl flex-col items-center">
            {CAPABILITIES.map((capability) => {
              const selected = active.id === capability.id;
              return (
                <button
                  key={capability.id}
                  type="button"
                  onPointerEnter={() => setActiveId(capability.id)}
                  onFocus={() => setActiveId(capability.id)}
                  onClick={() => setActiveId(capability.id)}
                  aria-pressed={selected}
                  className="relative block w-full py-0.5 text-center font-display uppercase leading-[0.84] tracking-[-0.06em] outline-none transition-[color,opacity,transform] duration-300 focus-visible:ring-1 focus-visible:ring-neon"
                  style={{
                    fontSize: "clamp(3rem, 6.2vw, 7.5rem)",
                    color: selected
                      ? "var(--foreground)"
                      : "color-mix(in oklab, var(--foreground) 16%, transparent)",
                    opacity: selected ? 1 : 0.9,
                    transform: selected ? "scale(1.015)" : "scale(1)",
                  }}
                >
                  {capability.title}
                </button>
              );
            })}
          </div>
        </div>

        <div className="relative z-20 grid grid-cols-2 gap-3 md:hidden">
          <AnimatePresence mode="sync">
            {active.cards.map((card, index) => (
              <motion.figure
                key={`${active.id}-${card.label}`}
                initial={{ opacity: 0, y: 20, filter: "blur(12px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -14, filter: "blur(10px)" }}
                transition={{ delay: index * 0.04, duration: 0.38 }}
                className="overflow-hidden border border-border bg-card"
              >
                <img src={card.image} alt={card.label} className="aspect-[4/3] w-full object-cover" />
                <figcaption className="px-2 py-2 font-mono text-[8px] uppercase tracking-[0.16em] text-muted-foreground">
                  {card.label}
                </figcaption>
              </motion.figure>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

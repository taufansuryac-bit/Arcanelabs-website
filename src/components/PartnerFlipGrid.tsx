import { motion, useInView, useReducedMotion } from "motion/react";
import { useMemo, useRef } from "react";

const partners = [
  { name: "SAMSUNG", mark: "SAMSUNG" },
  { name: "EA × FC BAYERN", mark: "EA × FCB" },
  { name: "McDONALD'S", mark: "McD" },
  { name: "HUF", mark: "HUF" },
  { name: "NINA CHUBA", mark: "NINA CHUBA" },
  { name: "ARCANE LAB", mark: "ARCANE" },
  { name: "FUTURE STARS", mark: "FUTURE / STARS" },
  { name: "NIGHTOGRAPHY", mark: "NIGHT / GRAPHY" },
] as const;

const particleOffsets = [
  [-34, -24],
  [-18, 28],
  [4, -34],
  [30, 18],
  [38, -8],
  [-40, 8],
] as const;

export function PartnerFlipGrid() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const inView = useInView(sectionRef, { once: true, amount: 0.22 });
  const prefersReducedMotion = useReducedMotion();
  const year = useMemo(() => new Date().getFullYear(), []);

  return (
    <section
      ref={sectionRef}
      aria-labelledby="partners-heading"
      className="relative z-10 border-y border-border bg-background px-5 py-14 md:px-8 md:py-20"
    >
      <div className="mb-10 grid grid-cols-[1fr_auto_1fr_auto] items-center gap-4 md:mb-14">
        <h2 id="partners-heading" className="label-mono text-foreground">
          (Partners)
        </h2>
        <span className="h-2 w-2 rounded-full bg-foreground" aria-hidden />
        <span className="label-mono justify-self-center text-foreground">2011-{String(year).slice(-2)}©</span>
        <span className="h-2 w-2 rounded-full bg-foreground" aria-hidden />
      </div>

      <div className="grid grid-cols-2 gap-1 md:grid-cols-4">
        {partners.map((partner, index) => (
          <div key={partner.name} className="relative [perspective:1200px]">
            <motion.div
              initial={prefersReducedMotion ? false : { rotateY: -88, opacity: 0.45 }}
              animate={inView ? { rotateY: 0, opacity: 1 } : undefined}
              whileHover={prefersReducedMotion ? undefined : { rotateY: 8 }}
              transition={{
                duration: prefersReducedMotion ? 0 : 0.72,
                delay: prefersReducedMotion ? 0 : index * 0.065,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="group relative flex min-h-32 items-center justify-center overflow-hidden border border-border/70 bg-card px-4 md:min-h-40 [transform-style:preserve-3d]"
            >
              <span className="sr-only">{partner.name}</span>
              <span
                aria-hidden
                className="font-display text-center text-[clamp(1rem,2.1vw,1.9rem)] uppercase tracking-[-0.04em] text-foreground transition-transform duration-500 group-hover:scale-[1.04]"
              >
                {partner.mark}
              </span>

              {!prefersReducedMotion &&
                particleOffsets.map(([x, y], particleIndex) => (
                  <motion.span
                    // Pixel particles burst from the card edge as the flip resolves.
                    key={`${partner.name}-particle-${particleIndex}`}
                    aria-hidden
                    className="pointer-events-none absolute left-1/2 top-1/2 h-1.5 w-1.5 bg-foreground"
                    initial={{ x: 0, y: 0, opacity: 0, scale: 0.3 }}
                    animate={
                      inView
                        ? {
                            x,
                            y,
                            opacity: [0, 0.75, 0],
                            scale: [0.3, 1, 0.4],
                          }
                        : undefined
                    }
                    transition={{
                      duration: 0.58,
                      delay: index * 0.065 + 0.28 + particleIndex * 0.018,
                      ease: "easeOut",
                    }}
                  />
                ))}
            </motion.div>
          </div>
        ))}
      </div>
    </section>
  );
}

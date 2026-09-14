import { motion, useInView, useReducedMotion } from "motion/react";
import { useRef } from "react";

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

const flipTimes: number[] = [0, 0.16, 0.28, 0.54, 0.68, 1];
const particleTimes: number[] = [0, 0.22, 0.28, 0.34, 0.62, 0.68, 0.74, 1];

export function PartnerFlipGrid() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const inView = useInView(sectionRef, { once: false, amount: 0.12 });
  const prefersReducedMotion = useReducedMotion();

  return (
    <section
      ref={sectionRef}
      aria-label="Partners"
      className="relative z-20 bg-background px-5 py-8 md:px-8 md:py-12"
    >
      <div className="grid grid-cols-2 gap-px border border-foreground/10 bg-foreground/10 md:grid-cols-4">
        {partners.map((partner, index) => {
          const backPartner = partners[(index + 4) % partners.length] ?? partner;
          const direction = index % 2 === 0 ? 180 : -180;
          const cycleDelay = index * 0.38;
          const shouldFlip = inView && !prefersReducedMotion;

          return (
            <div
              key={partner.name}
              className="relative bg-background [perspective:1400px]"
            >
              <motion.div
                initial={false}
                animate={
                  shouldFlip
                    ? {
                        rotateY: [0, 0, direction, direction, direction * 2, direction * 2],
                      }
                    : { rotateY: 0 }
                }
                transition={{
                  duration: shouldFlip ? 7.4 : 0,
                  times: flipTimes,
                  delay: shouldFlip ? cycleDelay : 0,
                  repeat: shouldFlip ? Number.POSITIVE_INFINITY : 0,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="relative min-h-32 bg-foreground/[0.02] px-4 md:min-h-40 [transform-style:preserve-3d]"
              >
                <div className="absolute inset-0 flex items-center justify-center bg-background/95 [backface-visibility:hidden]">
                  <span className="sr-only">{partner.name}</span>
                  <span
                    aria-hidden
                    className="font-display text-center text-[clamp(1rem,2.1vw,1.9rem)] uppercase tracking-[-0.04em] text-foreground"
                  >
                    {partner.mark}
                  </span>
                </div>

                <div className="absolute inset-0 flex items-center justify-center bg-background/95 [backface-visibility:hidden] [transform:rotateY(180deg)]">
                  <span className="sr-only">{backPartner.name}</span>
                  <span
                    aria-hidden
                    className="font-display text-center text-[clamp(1rem,2.1vw,1.9rem)] uppercase tracking-[-0.04em] text-foreground"
                  >
                    {backPartner.mark}
                  </span>
                </div>

                {!prefersReducedMotion &&
                  particleOffsets.map(([x, y], particleIndex) => (
                    <motion.span
                      key={`${partner.name}-particle-${particleIndex}`}
                      aria-hidden
                      className="pointer-events-none absolute left-1/2 top-1/2 h-1.5 w-1.5 bg-foreground/70"
                      initial={{ x: 0, y: 0, opacity: 0, scale: 0.35 }}
                      animate={
                        inView
                          ? {
                              x: [0, 0, x, x, 0, x, x, 0],
                              y: [0, 0, y, y, 0, y, y, 0],
                              opacity: [0, 0, 0.7, 0, 0, 0.6, 0, 0],
                              scale: [0.35, 0.35, 1, 0.45, 0.35, 0.9, 0.4, 0.35],
                            }
                          : { x: 0, y: 0, opacity: 0, scale: 0.35 }
                      }
                      transition={{
                        duration: inView ? 7.4 : 0,
                        times: particleTimes,
                        delay: inView ? cycleDelay + particleIndex * 0.014 : 0,
                        repeat: inView ? Number.POSITIVE_INFINITY : 0,
                        ease: "easeOut",
                      }}
                    />
                  ))}
              </motion.div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

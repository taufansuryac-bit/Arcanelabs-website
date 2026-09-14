import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
} from "motion/react";
import { useMemo, useRef, useState } from "react";

const statements = [
  "BUILT DIFFERENT",
  "CRAFT WITH PURPOSE",
  "CODE WITH INTENT",
  "CREATE THE UNCONVENTIONAL",
  "BUILT DIFFERENT",
] as const;

const LEFT_TO_RIGHT = {
  initial: { left: -180, opacity: 0 },
  active: { left: 28, opacity: 0.9 },
  exit: { left: `calc(100% + 96px)`, opacity: 0 },
};

const RIGHT_TO_LEFT = {
  initial: { left: 180, opacity: 0 },
  active: { left: -28, opacity: 0.72 },
  exit: { left: `calc(-100% - 96px)`, opacity: 0 },
};

const floodRows = [
  { direction: LEFT_TO_RIGHT, source: "-{1,}+++-{1,}", repeat: 18, top: "19%" },
  { direction: RIGHT_TO_LEFT, source: " ##{1,} ", repeat: 15, top: "30%" },
  { direction: LEFT_TO_RIGHT, source: "--+++---+", repeat: 20, top: "41%" },
  { direction: RIGHT_TO_LEFT, source: " ##{1,} ", repeat: 17, top: "59%" },
  { direction: LEFT_TO_RIGHT, source: "-{1,}+++-{1,}", repeat: 16, top: "70%" },
  { direction: RIGHT_TO_LEFT, source: "## -- ++", repeat: 18, top: "81%" },
] as const;

function expandFlood(source: string, repeat: number) {
  const expanded = source
    .replaceAll("-{1,}", "-----")
    .replaceAll("##{1,}", "########");

  return Array.from(
    { length: repeat },
    (_, index) => `${expanded}${index % 3 === 0 ? " + " : "   "}`,
  ).join("");
}

export function VisionTextSequence() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const prefersReducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  const rows = useMemo(
    () => floodRows.map((row) => ({ ...row, text: expandFlood(row.source, row.repeat) })),
    [],
  );
  const activeStatement = statements[activeIndex] ?? statements[0];

  useMotionValueEvent(scrollYProgress, "change", (progress) => {
    const next = Math.min(statements.length - 1, Math.floor(progress * statements.length));
    setActiveIndex((current) => (current === next ? current : next));
  });

  return (
    <section
      ref={sectionRef}
      aria-label="Our Vision"
      className="relative z-10 h-[330vh] border-y border-border bg-[#232428] text-white"
    >
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div className="absolute left-[16%] top-0 h-full w-px bg-white/10" />
          <div className="absolute left-0 top-[15%] h-px w-full bg-white/10" />
          <div className="absolute left-[16%] top-[15%] h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/80" />
        </div>

        <div className="absolute inset-x-0 top-7 z-20 text-center md:top-9">
          <span className="text-[11px] font-semibold tracking-tight text-white/90">
            (Our Vision)
          </span>
        </div>

        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          {rows.map((row, rowIndex) => (
            <motion.div
              key={`${rowIndex}-${activeIndex}`}
              className="absolute w-max whitespace-pre font-mono text-[10px] leading-none tracking-[0.16em] text-white/35 md:text-[11px]"
              style={{ top: row.top }}
              initial={prefersReducedMotion ? false : row.direction.initial}
              animate={prefersReducedMotion ? { opacity: 0.3 } : row.direction.active}
              exit={prefersReducedMotion ? {} : row.direction.exit}
              transition={{
                duration: prefersReducedMotion ? 0 : 1.05 + rowIndex * 0.08,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              {row.text}
            </motion.div>
          ))}
        </div>

        <div className="relative z-10 flex h-full items-center justify-center px-5 md:px-12">
          <div className="relative flex h-40 w-full max-w-6xl items-center justify-center md:h-56">
            <AnimatePresence initial={false} mode="sync">
              <motion.p
                key={`${activeIndex}-${activeStatement}`}
                initial={prefersReducedMotion ? false : { opacity: 0, y: 18, filter: "blur(8px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={
                  prefersReducedMotion ? {} : { opacity: 0, y: -14, filter: "blur(6px)" }
                }
                transition={{
                  duration: prefersReducedMotion ? 0 : 0.46,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="absolute inset-0 flex items-center justify-center text-center font-sans text-[clamp(2.5rem,7vw,7.5rem)] font-normal leading-[0.95] tracking-[-0.055em]"
              >
                {activeStatement}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-7 z-20 text-center md:bottom-9">
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/55">
            F / 00{activeIndex + 1} &nbsp; (Scroll for more)
          </span>
        </div>
      </div>
    </section>
  );
}

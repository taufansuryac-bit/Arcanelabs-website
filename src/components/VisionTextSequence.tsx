import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
} from "motion/react";
import { useRef, useState } from "react";

const statements = [
  "BUILT DIFFERENT",
  "CRAFT WITH PURPOSE",
  "CODE WITH INTENT",
  "CREATE THE UNCONVENTIONAL",
  "BUILT DIFFERENT",
] as const;

export function VisionTextSequence() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const prefersReducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

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

        <div className="absolute inset-x-0 top-7 text-center md:top-9">
          <span className="text-[11px] font-semibold tracking-tight text-white/90">(Our Vision)</span>
        </div>

        <div className="flex h-full items-center justify-center px-5 md:px-12">
          <div className="relative flex h-40 w-full max-w-6xl items-center justify-center md:h-56">
            <AnimatePresence initial={false} mode="sync">
              <motion.p
                key={`${activeIndex}-${statements[activeIndex]}`}
                initial={prefersReducedMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={prefersReducedMotion ? undefined : { opacity: 0 }}
                transition={{ duration: prefersReducedMotion ? 0 : 0.42, ease: "easeInOut" }}
                className="absolute inset-0 flex items-center justify-center text-center font-sans text-[clamp(2.5rem,7vw,7.5rem)] font-normal leading-[0.95] tracking-[-0.055em]"
              >
                {statements[activeIndex]}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-7 text-center md:bottom-9">
          <span className="text-[10px] text-white/55">(Scroll for more)</span>
        </div>
      </div>
    </section>
  );
}

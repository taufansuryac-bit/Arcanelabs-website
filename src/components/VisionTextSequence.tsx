import { useMotionValueEvent, useReducedMotion, useScroll } from "motion/react";
import { useRef, useState } from "react";
import { KineticFabric } from "@/components/ui/kinetic-particle-fabric";

const statements = [
  "CUSTOM APPS",
  "WEB SYSTEMS",
  "FINANCE DATA",
  "PRODUCT DATA",
  "AI WORKFLOWS",
  "BUSINESS TOOLS",
] as const;

const GLITCH_GLYPHS = [
  "#",
  "%",
  "@",
  "/",
  "=",
  "■",
  "□",
  "▓",
  "▒",
  "░",
  "*",
  "<",
  ">",
  "+",
] as const;

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

function morphStatement(from: string, to: string, progress: number, tick: number) {
  const amount = clamp01(progress);
  const length = Math.max(from.length, to.length);
  if (amount <= 0.015) return from;
  if (amount >= 0.985) return to;

  return Array.from({ length }, (_, index) => {
    const start = (index / Math.max(1, length)) * 0.46;
    const local = clamp01((amount - start) / 0.44);
    const fromChar = from[index] ?? " ";
    const toChar = to[index] ?? " ";

    if (local < 0.24) return fromChar;
    if (local > 0.76) return toChar;
    if (fromChar === " " && toChar === " ") return " ";

    const glyphIndex = (index * 7 + tick * 3 + Math.floor(local * 19)) % GLITCH_GLYPHS.length;
    return GLITCH_GLYPHS[glyphIndex] ?? "#";
  }).join("");
}

export function VisionTextSequence() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const prefersReducedMotion = useReducedMotion();
  const [displayText, setDisplayText] = useState<string>(statements[0]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [morphProgress, setMorphProgress] = useState(0);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  useMotionValueEvent(scrollYProgress, "change", (progress) => {
    if (prefersReducedMotion) {
      setDisplayText(statements[0]);
      setActiveIndex(0);
      setMorphProgress(0);
      return;
    }

    const scaled = clamp01(progress) * (statements.length - 1);
    const index = Math.min(statements.length - 1, Math.floor(scaled));
    const nextIndex = Math.min(statements.length - 1, index + 1);
    const localProgress = nextIndex === index ? 1 : scaled - index;
    const from = statements[index] ?? statements[0];
    const to = statements[nextIndex] ?? from;
    const tick = Math.floor(progress * 96);

    setActiveIndex(index);
    setMorphProgress(localProgress);
    setDisplayText(morphStatement(from, to, localProgress, tick));
  });

  return (
    <section
      ref={sectionRef}
      aria-label="Our Vision"
      className="relative z-10 h-[380vh] overflow-visible bg-[#232428] text-white md:h-[420vh]"
    >
      <div className="sticky top-0 h-[100svh] overflow-hidden bg-[#232428]">
        <KineticFabric className="absolute inset-0 z-0 opacity-75" />
        <div className="pointer-events-none absolute inset-0 z-[1] bg-[#232428]/45" aria-hidden />

        <div className="pointer-events-none absolute inset-0 z-[2]" aria-hidden>
          <div className="absolute left-[16%] top-0 h-full w-px bg-white/10" />
          <div className="absolute left-0 top-[15%] h-px w-full bg-white/10" />
          <div className="absolute left-[16%] top-[15%] h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/80" />
        </div>

        <div className="pointer-events-none absolute inset-x-0 top-7 z-20 text-center md:top-9">
          <span className="text-[11px] font-semibold tracking-tight text-white/90">
            (Our Vision)
          </span>
        </div>

        <div className="pointer-events-none relative z-10 flex h-full items-center justify-center px-5 md:px-12">
          <div className="relative flex w-full max-w-[1500px] flex-col items-center justify-center">
            <p
              aria-hidden
              className="max-w-full whitespace-pre text-center font-sans text-[clamp(3.1rem,8.6vw,9.8rem)] font-normal leading-[0.9] tracking-[-0.065em] text-white"
            >
              {displayText}
            </p>
            <span className="sr-only" aria-live="polite">
              {statements[activeIndex]}
            </span>

            <div
              aria-hidden
              className="mt-7 flex h-2 w-[min(72vw,760px)] items-center justify-center gap-[3px] overflow-hidden md:mt-10"
            >
              {Array.from({ length: 42 }, (_, index) => {
                const threshold = index / 42;
                const visible = morphProgress >= threshold;
                return (
                  <span
                    key={index}
                    className="h-[5px] w-[5px] shrink-0 bg-[#b7e36d] transition-opacity duration-75"
                    style={{ opacity: visible ? Math.max(0.12, 1 - threshold * 0.82) : 0.04 }}
                  />
                );
              })}
            </div>
          </div>
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-7 z-20 text-center md:bottom-9">
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/55">
            F / 00{Math.min(activeIndex + 1, statements.length)} &nbsp; (Scroll for more)
          </span>
        </div>
      </div>
    </section>
  );
}

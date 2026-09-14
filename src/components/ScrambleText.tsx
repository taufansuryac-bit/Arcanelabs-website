import { useCallback, useEffect, useRef, useState } from "react";

const GLYPHS = "▚▞#%&$@8Ξ▓░/\\<>_-=+*3FTR4Kʁ▛";

type Props = {
  text: string;
  className?: string;
  /** run the scramble once on mount */
  auto?: boolean;
  speed?: number;
};

/** Chaotic glyph scramble on hover — used for the wordmark and nav links. */
export function ScrambleText({ text, className, auto = false, speed = 28 }: Props) {
  const [output, setOutput] = useState(text);
  const frame = useRef(0);
  const timer = useRef<number | null>(null);

  const stop = useCallback(() => {
    if (timer.current !== null) {
      window.clearInterval(timer.current);
      timer.current = null;
    }
  }, []);

  const run = useCallback(() => {
    // Skip scramble animation if user prefers reduced motion.
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setOutput(text);
      return;
    }
    stop();
    frame.current = 0;
    timer.current = window.setInterval(() => {
      const f = frame.current;
      let done = 0;
      const next = text
        .split("")
        .map((ch, i) => {
          if (ch === " ") return " ";
          const settle = i * 1.6 + 6;
          if (f > settle) {
            done += 1;
            return ch;
          }
          return GLYPHS[Math.floor(Math.random() * GLYPHS.length)] ?? ch;
        })
        .join("");
      setOutput(next);
      frame.current += 1;
      if (done === text.replace(/ /g, "").length) stop();
    }, speed);
  }, [text, speed, stop]);

  useEffect(() => {
    if (auto) run();
    return stop;
  }, [auto, run, stop]);

  return (
    <span className={className} onPointerEnter={run} onFocus={run} tabIndex={-1} aria-label={text}>
      {output}
    </span>
  );
}

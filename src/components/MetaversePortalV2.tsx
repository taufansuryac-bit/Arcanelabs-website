import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import "../pixel-fonts.css";
import { ParticleDimensionScene } from "./ParticleDimensionScene";

export function MetaversePortalV2() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  const phraseOneOpacity = useTransform(scrollYProgress, [0.16, 0.2, 0.3, 0.34], [0, 1, 1, 0]);
  const phraseTwoOpacity = useTransform(scrollYProgress, [0.38, 0.42, 0.54, 0.58], [0, 1, 1, 0]);
  const phraseThreeOpacity = useTransform(
    scrollYProgress,
    [0.62, 0.66, 0.79, 0.84],
    [0, 1, 1, 0],
  );
  const portalOpacity = useTransform(scrollYProgress, [0.9, 0.97, 1], [1, 0.62, 0]);

  return (
    <section
      ref={sectionRef}
      className="relative z-10 -mb-[100svh] h-[220vh] border-t border-border md:-mb-[100vh] md:h-[560vh]"
    >
      <motion.div
        style={{ opacity: portalOpacity }}
        className="sticky top-0 h-[100svh] overflow-hidden bg-background md:h-screen"
      >
        <ParticleDimensionScene
          progress={scrollYProgress}
          className="absolute inset-0 h-full w-full"
        />

        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center px-5 md:px-8">
          <motion.div
            style={{ opacity: phraseOneOpacity }}
            className="absolute flex w-full max-w-[1120px] flex-col items-center text-center"
          >
            <p className="mb-4 font-mono text-[9px] uppercase tracking-[0.34em] text-[#7ca644] md:text-[11px]">
              ARCANE LABS // DIGITAL EXPERIENCES
            </p>
            <h2 className="font-display text-[clamp(2.4rem,6vw,5.4rem)] uppercase leading-[0.94] tracking-[-0.045em] text-foreground drop-shadow-[0_2px_10px_rgba(255,255,255,0.45)] dark:drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]">
              WE BUILD WEBSITES
            </h2>
            <span className="mt-5 h-px w-20 bg-[#9fc65e]/55" />
          </motion.div>

          <motion.div
            style={{ opacity: phraseTwoOpacity }}
            className="absolute flex w-full max-w-[1040px] flex-col items-center text-center"
          >
            <p className="mb-4 font-mono text-[9px] uppercase tracking-[0.34em] text-[#7ca644] md:text-[11px]">
              PRODUCTS // SYSTEMS // INTERFACES
            </p>
            <h2 className="font-display text-[clamp(2.5rem,5.8vw,5.2rem)] uppercase leading-[0.94] tracking-[-0.045em] text-foreground drop-shadow-[0_2px_10px_rgba(255,255,255,0.45)] dark:drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]">
              WE CRAFT APPS
            </h2>
            <span className="mt-5 h-px w-20 bg-[#9fc65e]/55" />
          </motion.div>

          <motion.div
            style={{ opacity: phraseThreeOpacity }}
            className="absolute flex w-full max-w-[980px] flex-col items-center text-center"
          >
            <p className="mb-4 font-mono text-[9px] uppercase tracking-[0.34em] text-[#7ca644] md:text-[11px]">
              CODE // MOTION // INTERACTION
            </p>
            <h2 className="max-w-[18ch] font-display text-[clamp(2rem,4.9vw,4.6rem)] uppercase leading-[0.94] tracking-[-0.045em] text-foreground drop-shadow-[0_2px_10px_rgba(255,255,255,0.45)] dark:drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]">
              STEP INTO THE DIGITAL DIMENSION
            </h2>
            <span className="mt-5 h-px w-20 bg-[#9fc65e]/55" />
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}

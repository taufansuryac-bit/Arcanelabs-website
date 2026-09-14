import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import "../pixel-fonts.css";
import { UnifiedVoxelDimensionScene } from "./UnifiedVoxelDimensionScene";

/**
 * V3 portal: one continuous 3D system.
 * The Arcane mark fractures into a dimensional tunnel, passes three branded depth beats,
 * then dissolves forward into the overlapping footer field instead of rebuilding the mark.
 */
export function MetaversePortalV2() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });
  const portalOpacity = useTransform(scrollYProgress, [0.82, 0.94, 1], [1, 0.48, 0]);

  return (
    <section
      ref={sectionRef}
      className="relative z-10 -mb-[12vh] h-[240vh] border-t border-border md:-mb-[16vh] md:h-[700vh]"
    >
      <motion.div
        style={{ opacity: portalOpacity }}
        className="sticky top-0 h-[100svh] overflow-hidden bg-background md:h-screen"
      >
        <UnifiedVoxelDimensionScene
          progress={scrollYProgress}
          className="absolute inset-0 h-full w-full"
        />
      </motion.div>
    </section>
  );
}

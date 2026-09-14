import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import "../pixel-fonts.css";
import { UnifiedVoxelDimensionScene } from "./UnifiedVoxelDimensionScene";

/**
 * V3 portal: one continuous 3D system.
 * The Arcane mark fractures into a dimensional tunnel, passes three branded depth beats,
 * then drives straight through into the overlapping footer field.
 */
export function MetaversePortalV2() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });
  const portalOpacity = useTransform(scrollYProgress, [0.9, 0.965, 0.995, 1], [1, 0.82, 0.32, 0]);

  return (
    <section
      ref={sectionRef}
      className="relative z-20 -mb-[64vh] h-[180vh] border-t border-border [overflow-anchor:none] md:-mb-[68vh] md:h-[320vh]"
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

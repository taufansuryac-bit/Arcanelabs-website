import { useScroll } from "motion/react";
import { useRef } from "react";
import "../pixel-fonts.css";
import { UnifiedVoxelDimensionScene } from "./UnifiedVoxelDimensionScene";

/**
 * V3 portal: one continuous 3D system.
 * The exact voxels that form the Arcane mark become the dimensional field,
 * travel through depth, then magnetically rebuild the mark at the end.
 */
export function MetaversePortalV2() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  return (
    <section
      ref={sectionRef}
      className="relative z-10 h-[240vh] border-t border-border md:h-[700vh]"
    >
      <div className="sticky top-0 h-[100svh] overflow-hidden bg-background md:h-screen">
        <UnifiedVoxelDimensionScene
          progress={scrollYProgress}
          className="absolute inset-0 h-full w-full"
        />
      </div>
    </section>
  );
}

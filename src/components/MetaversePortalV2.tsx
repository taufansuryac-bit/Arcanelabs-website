import { useScroll } from "motion/react";
import { useRef } from "react";
import { UnifiedVoxelDimensionScene } from "./UnifiedVoxelDimensionScene";

/**
 * V3 portal: one continuous 3D system.
 * The exact voxels that form the Arcane mark become the dimensional field,
 * travel through depth, then magnetically rebuild the mark at the end.
 */
export function MetaversePortalV2() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end end"] });

  return (
    <section ref={sectionRef} className="relative z-10 h-[700vh] border-t border-border">
      <div className="sticky top-0 h-screen overflow-hidden bg-background">
        <UnifiedVoxelDimensionScene progress={scrollYProgress} className="absolute inset-0 h-full w-full" />
      </div>
    </section>
  );
}

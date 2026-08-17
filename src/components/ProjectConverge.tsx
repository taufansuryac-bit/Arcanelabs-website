import { useRef } from "react";
import { motion, useScroll, useSpring, useTransform, type MotionValue } from "motion/react";

/** Placeholder imagery — swap these URLs for the real project stills later. */
const projects = [
  {
    title: "Future Stars",
    client: "EA x FC Bayern",
    year: "2026",
    image:
      "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=900&q=70",
    from: { x: -78, y: -46, r: -14 },
  },
  {
    title: "Nightography",
    client: "Samsung",
    year: "2026",
    image:
      "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=900&q=70",
    from: { x: 82, y: -52, r: 12 },
  },
  {
    title: "Käsy",
    client: "McDonald's",
    year: "2026",
    image:
      "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=900&q=70",
    from: { x: -88, y: 38, r: 10 },
  },
  {
    title: "Mirage",
    client: "Arcane Lab",
    year: "2026",
    image:
      "https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&w=900&q=70",
    from: { x: 90, y: 44, r: -11 },
  },
  {
    title: "Overtime",
    client: "Arcane Lab",
    year: "2025",
    image:
      "https://images.unsplash.com/photo-1518709268805-4e9042af2176?auto=format&fit=crop&w=900&q=70",
    from: { x: -12, y: -74, r: 7 },
  },
  {
    title: "HUF x Bonkers",
    client: "HUF",
    year: "2025",
    image:
      "https://images.unsplash.com/photo-1470229722913-7ea0d1e0e5b6?auto=format&fit=crop&w=900&q=70",
    from: { x: 16, y: 76, r: -8 },
  },
];

function Card({
  p,
  index,
  data,
}: {
  p: MotionValue<number>;
  index: number;
  data: (typeof projects)[number];
}) {
  // staggered arrival: each card gets its own window of the scroll range
  const start = 0.04 + index * 0.11;
  const end = start + 0.42;
  const t = useTransform(p, [start, end], [0, 1], { clamp: true });

  const x = useTransform(t, [0, 1], [`${data.from.x}vw`, "0vw"]);
  const y = useTransform(t, [0, 1], [`${data.from.y}vh`, `${(index - 2.5) * 2.2}vh`]);
  const rotate = useTransform(t, [0, 1], [data.from.r * 2.4, data.from.r * 0.35]);
  const scale = useTransform(t, [0, 1], [0.55, 1]);
  const opacity = useTransform(t, [0, 0.18, 1], [0, 1, 1]);
  const blur = useTransform(t, [0, 1], ["blur(14px)", "blur(0px)"]);

  return (
    <motion.figure
      style={{ x, y, rotate, scale, opacity, filter: blur, zIndex: index }}
      className="absolute w-[62vw] max-w-[420px] border border-border bg-background md:w-[26vw]"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={data.image}
          alt={`${data.title} — ${data.client}`}
          loading="lazy"
          className="h-full w-full object-cover opacity-100 contrast-110 grayscale"
        />
        <div className="pixel-veil pointer-events-none absolute inset-0" />
      </div>
      <figcaption className="flex items-baseline justify-between gap-3 border-t border-border px-3 py-2">
        <span className="font-display text-xs uppercase tracking-wide md:text-sm">
          {data.title}
        </span>
        <span className="label-mono">{data.year}</span>
      </figcaption>
    </motion.figure>
  );
}

/**
 * Scroll-driven gallery: six project cards fly in one by one from the edges
 * and gather in the centre of the viewport.
 */
export function ProjectConverge() {
  const ref = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });
  const p = useSpring(scrollYProgress, { stiffness: 90, damping: 26, mass: 0.4 });

  const labelOpacity = useTransform(p, [0, 0.12, 0.85, 1], [1, 0.35, 0.35, 1]);

  return (
    <section ref={ref} id="projects" className="relative z-10 line-top h-[420vh]">
      <div className="sticky top-0 flex h-screen items-center justify-center overflow-hidden">
        <motion.div
          style={{ opacity: labelOpacity }}
          className="pointer-events-none absolute inset-x-0 top-28 flex items-baseline justify-between px-5 md:px-8"
        >
          <h2 className="font-display text-2xl uppercase tracking-tight md:text-4xl">Projects</h2>
          <span className="label-mono">05</span>
        </motion.div>

        <div className="relative flex h-full w-full items-center justify-center">
          {projects.map((data, i) => (
            <Card key={data.title} p={p} index={i} data={data} />
          ))}
        </div>

        <span className="label-mono pointer-events-none absolute bottom-8 left-1/2 -translate-x-1/2">
          Keep scrolling ↓
        </span>
      </div>
    </section>
  );
}

import { useRef } from "react";
import { motion, useScroll, useSpring, useTransform } from "motion/react";

/** Placeholder imagery — swap these URLs for the real project stills later. */
const projects = [
  {
    title: "Future Stars",
    client: "EA x FC Bayern",
    year: "2026",
    image:
      "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1000&q=75",
  },
  {
    title: "Nightography",
    client: "Samsung",
    year: "2026",
    image:
      "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1000&q=75",
  },
  {
    title: "Käsy",
    client: "McDonald's",
    year: "2026",
    image:
      "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1000&q=75",
  },
  {
    title: "Mirage",
    client: "Arcane Lab",
    year: "2026",
    image:
      "https://images.unsplash.com/photo-1533107862482-0e6974b06ec4?auto=format&fit=crop&w=1000&q=75",
  },
  {
    title: "Overtime",
    client: "Arcane Lab",
    year: "2025",
    image:
      "https://images.unsplash.com/photo-1526481280693-3bfa7568e0f3?auto=format&fit=crop&w=1000&q=75",
  },
  {
    title: "HUF x Bonkers",
    client: "HUF",
    year: "2025",
    image:
      "https://images.unsplash.com/photo-1516575334481-f85287c2c82d?auto=format&fit=crop&w=1000&q=75",
  },
];

/** One card: appears with a pixel-parallax lift as it scrolls into view. */
function ProjectCard({ data, index }: { data: (typeof projects)[number]; index: number }) {
  const ref = useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const p = useSpring(scrollYProgress, { stiffness: 110, damping: 28, mass: 0.4 });

  const col = index % 3;
  const depth = [1, 0.55, 1.35][col] ?? 1;

  const y = useTransform(p, [0, 0.45, 1], [120 * depth, 0, -70 * depth]);
  const opacity = useTransform(p, [0, 0.18, 0.4, 1], [0, 0.35, 1, 1]);
  const scale = useTransform(p, [0, 0.45], [0.9, 1]);
  const blur = useTransform(p, [0, 0.42], ["blur(14px)", "blur(0px)"]);
  const imgY = useTransform(p, [0, 1], ["-8%", "8%"]);

  return (
    <motion.figure
      ref={ref}
      style={{ y, opacity, scale, filter: blur }}
      className="group border border-border bg-card"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <motion.img
          src={data.image}
          alt={`${data.title} — ${data.client}`}
          loading="lazy"
          style={{ y: imgY }}
          className="h-[116%] w-full object-cover saturate-[1.15] transition-transform duration-700 group-hover:scale-[1.04]"
        />
        <div className="pixel-veil pointer-events-none absolute inset-0 opacity-70 transition-opacity duration-500 group-hover:opacity-30" />
        <span className="label-mono absolute left-3 top-3 bg-background/80 px-2 py-1 !text-[10px]">
          /0{index + 1}/
        </span>
      </div>
      <figcaption className="flex items-baseline justify-between gap-3 border-t border-border px-4 py-3">
        <span className="font-display text-sm uppercase tracking-wide md:text-base">
          {data.title}
        </span>
        <span className="label-mono">{data.year}</span>
      </figcaption>
    </motion.figure>
  );
}

/** Projects grid: 3 × 2 cards, each arriving with its own parallax. */
export function ProjectConverge() {
  return (
    <section id="projects" className="relative z-10 line-top px-5 pt-24 pb-0 md:px-8 md:pt-32 md:pb-0">
      <div className="mb-14 flex items-baseline justify-between">
        <h2 className="font-display text-2xl uppercase tracking-tight md:text-4xl">Projects</h2>
        <span className="label-mono">05</span>
      </div>

      <div className="grid gap-6 md:grid-cols-3 md:gap-8">
        {projects.map((data, i) => (
          <ProjectCard key={data.title} data={data} index={i} />
        ))}
      </div>

      <div className="mt-14 flex justify-center">
        <a
          href="#works"
          className="group relative overflow-hidden border border-border px-8 py-4 font-mono text-[11px] uppercase tracking-[0.28em]"
        >
          <span className="relative z-10 transition-colors group-hover:text-background">
            Lihat semua project
          </span>
          <span className="absolute inset-0 -translate-y-full bg-foreground transition-transform duration-300 [transition-timing-function:steps(6,end)] group-hover:translate-y-0" />
        </a>
      </div>
    </section>
  );
}

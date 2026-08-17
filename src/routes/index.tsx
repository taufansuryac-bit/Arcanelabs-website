import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AsciiWordmark } from "@/components/AsciiWordmark";
import { ScrambleText } from "@/components/ScrambleText";
import { NoiseBackground } from "@/components/NoiseBackground";
import { PixelReveal } from "@/components/PixelReveal";
import { PixelFaq } from "@/components/PixelFaq";
import { ProjectConverge } from "@/components/ProjectConverge";
import { MetaversePortal } from "@/components/MetaversePortal";

export const Route = createFileRoute("/")({
  component: Index,
});

const works = [
  { title: "Future Stars", client: "EA x FC Bayern", type: "Commercial", year: "2026" },
  { title: "Nightography", client: "Samsung", type: "Commercial", year: "2026" },
  { title: "Käsy", client: "McDonald's", type: "Commercial", year: "2026" },
  { title: "Mirage", client: "Arcane Lab", type: "Fashion Film", year: "2026" },
  { title: "Wenn das Liebe ist", client: "Nina Chuba", type: "Music Video", year: "2026" },
  { title: "Overtime", client: "Arcane Lab", type: "Experimental", year: "2025" },
  { title: "HUF x Bonkers", client: "HUF", type: "Commercial", year: "2025" },
];

const expertise = [
  {
    id: "(01)",
    title: "Creative Direction",
    items: [
      "Concept Development",
      "Creative Consulting & Oversight",
      "Talent Curation",
      "Visual Direction",
    ],
  },
  {
    id: "(02)",
    title: "Production",
    items: [
      "International Production Network",
      "Cross-Border Production",
      "Scalable Production Frameworks",
      "Risk & Legal Oversight",
      "End-to-End Production Management",
    ],
  },
  {
    id: "(03)",
    title: "Post",
    items: [
      "Editorial & Offline",
      "Color & Online",
      "VFX & Compositing",
      "AI-Enhanced Post Workflows",
      "Mastering & Delivery",
    ],
  },
  {
    id: "(04)",
    title: "Hybrid Approach",
    items: [
      "Full AI & Hybrid Production Models",
      "Continuous AI Workflow Optimization",
      "AI Integration Strategy",
      "AI & Rights Advisory",
    ],
  },
];

function Index() {
  const [activeWork, setActiveWork] = useState(0);

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <NoiseBackground />

      {/* Header */}
      <header className="fixed inset-x-0 top-0 z-50 flex items-center justify-between px-5 py-5 mix-blend-difference md:px-8">
        <a href="#top" className="group">
          <ScrambleText
            text="ARCANE LABS"
            auto
            className="font-mono text-xs tracking-[0.32em] text-foreground md:text-sm"
          />
        </a>
        <nav className="flex items-center gap-5 md:gap-9">
          {["Works", "Studio", "Contact"].map((item) => (
            <a key={item} href={`#${item.toLowerCase()}`}>
              <ScrambleText
                text={item.toUpperCase()}
                className="font-mono text-[11px] tracking-[0.22em] text-foreground/70 transition-colors hover:text-foreground"
              />
            </a>
          ))}
        </nav>
      </header>

      {/* Hero */}
      <section
        id="top"
        className="relative z-10 flex min-h-screen flex-col justify-between px-5 pb-8 pt-24 md:px-8"
      >
        <div className="flex items-start justify-between">
          <p className="label-mono max-w-[10rem] leading-relaxed">
            Film production.
            <br />
            Reimagined.
          </p>
          <p className="label-mono text-right">Berlin — Worldwide</p>
        </div>

        <div className="flicker-in h-[38vh] w-full md:h-[46vh]">
          <AsciiWordmark text="ARCANE LABS" cell={7} />
        </div>

        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <PixelReveal>
            <p className="max-w-xl text-sm leading-relaxed text-muted-foreground md:text-base">
              Arcane Labs is a hybrid production company fusing high-end commercial work with a
              drive to explore the unconventional.
            </p>
          </PixelReveal>
          <span className="label-mono">Scroll ↓</span>
        </div>
      </section>

      {/* Selected works */}
      <section id="works" className="relative z-10 line-top px-5 py-20 md:px-8 md:py-28">
        <div className="mb-12 flex items-baseline justify-between">
          <PixelReveal>
            <h2 className="font-display text-2xl uppercase tracking-tight md:text-4xl">
              Selected works
            </h2>
          </PixelReveal>
          <span className="label-mono">01</span>
        </div>

        <div className="grid gap-10 md:grid-cols-[1.1fr_0.9fr]">
          <ul className="line-top">
            {works.map((w, i) => (
              <li key={w.title}>
                <button
                  type="button"
                  onPointerEnter={() => setActiveWork(i)}
                  onFocus={() => setActiveWork(i)}
                  className="group flex w-full items-baseline justify-between border-b border-border py-5 text-left"
                >
                  <span className="flex items-baseline gap-4">
                    <span className="label-mono">/0{i + 1}/</span>
                    <ScrambleText
                      text={w.title}
                      className={`font-display text-xl uppercase transition-opacity md:text-3xl ${
                        activeWork === i ? "opacity-100" : "opacity-45"
                      }`}
                    />
                  </span>
                  <span className="label-mono hidden md:inline">{w.year}</span>
                </button>
              </li>
            ))}
          </ul>

          <PixelReveal className="md:sticky md:top-28 md:self-start">
            <div className="border border-border p-6">
              <div className="mb-6 h-52 w-full overflow-hidden md:h-64">
                <AsciiWordmark
                  key={works[activeWork]?.title}
                  text={(works[activeWork]?.title ?? "").toUpperCase().slice(0, 12)}
                  cell={6}
                />
              </div>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between gap-6">
                  <dt className="label-mono">Clients</dt>
                  <dd className="text-right">{works[activeWork]?.client}</dd>
                </div>
                <div className="flex justify-between gap-6">
                  <dt className="label-mono">Type</dt>
                  <dd className="text-right">{works[activeWork]?.type}</dd>
                </div>
                <div className="flex justify-between gap-6">
                  <dt className="label-mono">Date</dt>
                  <dd className="text-right">{works[activeWork]?.year}</dd>
                </div>
              </dl>
            </div>
          </PixelReveal>
        </div>
      </section>

      {/* Identity */}
      <section id="studio" className="relative z-10 line-top px-5 py-20 md:px-8 md:py-28">
        <div className="mb-12 flex items-baseline justify-between">
          <PixelReveal>
            <h2 className="font-display text-2xl uppercase tracking-tight md:text-4xl">
              Our identity
            </h2>
          </PixelReveal>
          <span className="label-mono">02</span>
        </div>

        <PixelReveal>
          <p className="font-display text-4xl uppercase leading-[0.95] md:text-7xl">
            Camera
            <span className="text-muted-foreground"> or </span>
            Code?
          </p>
        </PixelReveal>

        <div className="mt-14 grid gap-10 md:grid-cols-3">
          {[
            ["A hybrid film", "Shot on set, finished in the machine."],
            ["Production", "One team from first frame to master."],
            ["Visual Engineering", "Pipelines built like software, not habit."],
          ].map(([title, copy], i) => (
            <PixelReveal key={title} delay={i * 120}>
              <div className="line-top pt-5">
                <h3 className="mb-2 text-sm uppercase tracking-[0.18em]">{title}</h3>
                <p className="text-sm text-muted-foreground">{copy}</p>
              </div>
            </PixelReveal>
          ))}
        </div>
      </section>

      {/* Expertise */}
      <section className="relative z-10 line-top px-5 py-20 md:px-8 md:py-28">
        <div className="mb-12 flex items-baseline justify-between">
          <PixelReveal>
            <h2 className="font-display text-2xl uppercase tracking-tight md:text-4xl">
              From vision to screen
            </h2>
          </PixelReveal>
          <span className="label-mono">03</span>
        </div>

        <PixelReveal>
          <p className="mb-16 font-display text-3xl uppercase leading-[1.05] md:text-6xl">
            We shoot. We produce. We finish. Commercials made from passion.
          </p>
        </PixelReveal>

        <div className="grid gap-px bg-border md:grid-cols-4">
          {expertise.map((block, i) => (
            <PixelReveal key={block.id} delay={i * 90}>
              <div className="h-full bg-background p-6">
                <div className="mb-5 flex items-baseline justify-between">
                  <h3 className="text-sm uppercase tracking-[0.18em]">{block.title}</h3>
                  <span className="label-mono">{block.id}</span>
                </div>
                <ul className="space-y-2">
                  {block.items.map((item) => (
                    <li key={item} className="text-sm text-muted-foreground">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </PixelReveal>
          ))}
        </div>
      </section>

      {/* Projects converging */}
      <ProjectConverge />

      {/* FAQ */}
      <section id="faq" className="relative z-10 line-top px-5 py-20 md:px-8 md:py-28">
        <div className="mb-12 flex items-baseline justify-between">
          <PixelReveal>
            <h2 className="font-display text-2xl uppercase tracking-tight md:text-4xl">
              Frequently asked
            </h2>
          </PixelReveal>
          <span className="label-mono">04</span>
        </div>
        <PixelReveal>
          <PixelFaq />
        </PixelReveal>
      </section>

      {/* Pixel journey into the footer */}
      <MetaversePortal />

      {/* Footer */}
      <footer id="contact" className="relative z-10 line-top overflow-hidden pt-16">
        <div className="flex w-max marquee-track">
          {[0, 1].map((k) => (
            <span
              key={k}
              className="whitespace-nowrap px-6 font-display text-5xl uppercase text-foreground/15 md:text-8xl"
            >
              Arcane Labs — Let&apos;s build something arcane —&nbsp;
            </span>
          ))}
        </div>

        {/* Big ASCII sign-off, like the reference outro */}
        <div className="mt-10 h-[34vh] w-full md:h-[46vh]">
          <AsciiWordmark text="ARCANE LABS" cell={8} />
        </div>

        <div className="grid gap-8 px-5 pb-12 md:grid-cols-4 md:px-8">
          <div>
            <p className="label-mono mb-2">■ Arcane Labs GmbH</p>
            <p className="text-sm text-muted-foreground">
              Chausseestrasse 12
              <br />
              10115 Berlin
            </p>
          </div>
          <div>
            <p className="label-mono mb-2">■ Get in touch</p>
            <a
              href="mailto:hello@arcanelabs.mov"
              className="text-sm underline-offset-4 hover:underline"
            >
              hello@arcanelabs.mov
            </a>
            <p className="mt-1 text-sm text-muted-foreground">Instagram</p>
          </div>
          <div>
            <p className="label-mono mb-2">■ Index</p>
            <ul className="space-y-1">
              {[
                ["Works", "#works"],
                ["Studio", "#studio"],
                ["FAQ", "#faq"],
              ].map(([label, href]) => (
                <li key={label}>
                  <a href={href}>
                    <ScrambleText
                      text={String(label).toUpperCase()}
                      className="text-[11px] tracking-[0.22em] text-muted-foreground hover:text-foreground"
                    />
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div className="md:text-right">
            <p className="label-mono mb-2">■ Legals</p>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} — Imprint / Privacy
            </p>
          </div>
        </div>

        <a
          href="#top"
          className="line-top block bg-secondary/40 py-3 text-center transition-colors hover:bg-secondary"
        >
          <ScrambleText text=":/ BACK TO TOP" className="label-mono text-foreground" />
        </a>
      </footer>

    </div>
  );
}

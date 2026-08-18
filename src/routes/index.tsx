import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import { ArcaneFooterField } from "@/components/ArcaneFooterField";
import { ArcaneLoader } from "@/components/ArcaneLoader";
import { AsciiWordmark } from "@/components/AsciiWordmark";
import { IdentityConstellation } from "@/components/IdentityConstellation";
import { InteractiveTicker } from "@/components/InteractiveTicker";
import { MetaversePortalV2 } from "@/components/MetaversePortalV2";
import { NoiseBackground } from "@/components/NoiseBackground";
import { PixelFaq } from "@/components/PixelFaq";
import { PixelReveal } from "@/components/PixelReveal";
import { ProjectConverge } from "@/components/ProjectConverge";
import { ProjectScrapbookOrbit } from "@/components/ProjectScrapbookOrbit";
import { ScrambleText } from "@/components/ScrambleText";
import { SectionPixelReveal } from "@/components/SectionPixelReveal";
import { ThemeToggle } from "@/components/ThemeToggle";

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
  const [ready, setReady] = useState(false);
  const handleLoaderComplete = useCallback(() => setReady(true), []);

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <ArcaneLoader onComplete={handleLoaderComplete} />
      <NoiseBackground />

      <div
        className={`relative z-10 transition-opacity duration-700 ${ready ? "opacity-100" : "opacity-0"}`}
      >
        <header className="fixed inset-x-0 top-0 z-50 flex items-center justify-between px-5 py-5 text-foreground md:px-8">
          <a href="#top" className="group">
            <ScrambleText
              text="ARCANE LABS"
              auto
              className="font-mono text-xs tracking-[0.32em] text-foreground md:text-sm"
            />
          </a>
          <nav className="flex items-center gap-5 md:gap-9">
            <ThemeToggle />
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

        <SectionPixelReveal>
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
                {works.map((work, index) => (
                  <li key={work.title}>
                    <button
                      type="button"
                      onPointerEnter={() => setActiveWork(index)}
                      onFocus={() => setActiveWork(index)}
                      className="group flex w-full items-baseline justify-between border-b border-border py-5 text-left"
                    >
                      <span className="flex items-baseline gap-4">
                        <span className="label-mono">/0{index + 1}/</span>
                        <ScrambleText
                          text={work.title}
                          className={`font-display text-xl uppercase transition-opacity md:text-3xl ${
                            activeWork === index ? "opacity-100" : "opacity-45"
                          }`}
                        />
                      </span>
                      <span className="label-mono hidden md:inline">{work.year}</span>
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
        </SectionPixelReveal>

        <SectionPixelReveal threshold={0.05}>
          <InteractiveTicker />
        </SectionPixelReveal>

        <ProjectScrapbookOrbit />

        <SectionPixelReveal threshold={0.06}>
          <IdentityConstellation />
        </SectionPixelReveal>

        <SectionPixelReveal>
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
              {expertise.map((block, index) => (
                <PixelReveal key={block.id} delay={index * 90}>
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
        </SectionPixelReveal>

        <SectionPixelReveal threshold={0.05}>
          <ProjectConverge />
        </SectionPixelReveal>

        <SectionPixelReveal>
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
        </SectionPixelReveal>

        <MetaversePortalV2 />

        <footer id="contact" className="relative z-20 -mt-[12vh] overflow-visible">
          <ArcaneFooterField />
        </footer>
      </div>
    </div>
  );
}

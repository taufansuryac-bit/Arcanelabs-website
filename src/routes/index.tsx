import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { ArcaneFooterField } from "@/components/ArcaneFooterField";
import { ArcaneLoader } from "@/components/ArcaneLoader";
import { AsciiWordmark } from "@/components/AsciiWordmark";
import { EnchantedProjectCarousel } from "@/components/EnchantedProjectCarousel";
import { GalaxyHeroBackground } from "@/components/GalaxyHeroBackground";
import { IdentityConstellation } from "@/components/IdentityConstellation";
import { InteractiveTicker } from "@/components/InteractiveTicker";
import { MetaversePortalV2 } from "@/components/MetaversePortalV2";
import { NoiseBackground } from "@/components/NoiseBackground";
import { PartnerFlipGrid } from "@/components/PartnerFlipGrid";
import { PixelFaq } from "@/components/PixelFaq";
import { PixelReveal } from "@/components/PixelReveal";
import { ProjectConverge } from "@/components/ProjectConverge";
import { ScrambleText } from "@/components/ScrambleText";
import { SectionPixelReveal } from "@/components/SectionPixelReveal";
import { ThemeToggle } from "@/components/ThemeToggle";
import { VisionTextSequence } from "@/components/VisionTextSequence";

export const Route = createFileRoute("/")({
  component: Index,
});

const works = [
  { title: "Finance Intelligence", client: "Business Operations", type: "Finance Analytics", year: "2026" },
  { title: "Product Intelligence", client: "Product Teams", type: "Product Analytics", year: "2026" },
  { title: "Operations Hub", client: "Internal Operations", type: "Business Application", year: "2026" },
  { title: "Commerce Console", client: "E-commerce", type: "Web Application", year: "2026" },
  { title: "AI Workflow", client: "Business Process", type: "AI Automation", year: "2026" },
  { title: "Custom CRM", client: "Customer Operations", type: "Application", year: "2026" },
  { title: "Decision Dashboard", client: "Management", type: "Business Intelligence", year: "2026" },
];

const expertise = [
  {
    id: "(01)",
    title: "Application Development",
    items: [
      "Custom Business Applications",
      "Internal Tools & Dashboards",
      "Workflow Systems",
      "API & Service Integration",
    ],
  },
  {
    id: "(02)",
    title: "Web Engineering",
    items: [
      "Business & Company Websites",
      "Product Platforms",
      "Responsive Frontends",
      "Performance & Technical SEO",
    ],
  },
  {
    id: "(03)",
    title: "Business Intelligence",
    items: [
      "Finance Analytics",
      "Product Analytics",
      "Data Visualization",
      "Decision Dashboards",
      "Operational Reporting",
    ],
  },
  {
    id: "(04)",
    title: "AI & Automation",
    items: [
      "AI-Assisted Workflows",
      "Process Automation",
      "Data Extraction & Processing",
      "AI Integration Strategy",
    ],
  },
];

const navigationItems = ["Works", "Studio", "Contact"] as const;

function Index() {
  const [activeWork, setActiveWork] = useState(0);
  const [ready, setReady] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const handleLoaderComplete = useCallback(() => setReady(true), []);

  useEffect(() => {
    if (!mobileMenuOpen) return;

    const root = document.documentElement;
    const previousOverflow = root.style.overflow;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileMenuOpen(false);
    };

    root.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      root.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [mobileMenuOpen]);

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <ArcaneLoader onComplete={handleLoaderComplete} />
      <NoiseBackground />

      <div
        className={`relative z-10 transition-opacity duration-700 ${ready ? "opacity-100" : "opacity-0"}`}
      >
        <header className="fixed inset-x-0 top-0 z-50 flex items-center justify-between border-b border-transparent bg-transparent px-5 py-4 text-foreground backdrop-blur-none md:border-none md:px-8 md:py-5">
          <a href="#top" className="group" onClick={() => setMobileMenuOpen(false)}>
            <ScrambleText
              text="ARCANE LABS"
              auto
              className="font-mono text-xs tracking-[0.32em] text-foreground md:text-sm"
            />
          </a>

          <nav className="hidden items-center gap-9 md:flex">
            <ThemeToggle />
            {navigationItems.map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`}>
                <ScrambleText
                  text={item.toUpperCase()}
                  className="font-mono text-[11px] tracking-[0.22em] text-foreground/70 transition-colors hover:text-foreground"
                />
              </a>
            ))}
          </nav>

          <button
            type="button"
            className="relative flex h-10 w-10 items-center justify-center border border-border bg-transparent md:hidden"
            aria-label={mobileMenuOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation"
            onClick={() => setMobileMenuOpen((open) => !open)}
          >
            <span className="sr-only">{mobileMenuOpen ? "Close" : "Open"} menu</span>
            <span className="relative block h-3.5 w-4" aria-hidden>
              <span
                className={`absolute left-0 top-0 h-px w-4 bg-current transition-transform duration-300 ${
                  mobileMenuOpen ? "translate-y-[6px] rotate-45" : ""
                }`}
              />
              <span
                className={`absolute left-0 bottom-0 h-px w-4 bg-current transition-transform duration-300 ${
                  mobileMenuOpen ? "-translate-y-[7px] -rotate-45" : ""
                }`}
              />
            </span>
          </button>
        </header>

        {mobileMenuOpen && (
          <div
            id="mobile-navigation"
            className="fixed inset-0 z-40 flex flex-col bg-background px-5 pb-8 pt-28 md:hidden"
          >
            <div className="mb-10 flex items-center justify-between border-b border-border pb-5">
              <span className="label-mono">Navigation</span>
              <ThemeToggle />
            </div>
            <nav className="flex flex-1 flex-col justify-center">
              {navigationItems.map((item, index) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-baseline justify-between border-b border-border py-5"
                >
                  <span className="font-display text-[clamp(2.5rem,14vw,4.5rem)] uppercase leading-none tracking-[-0.05em]">
                    {item}
                  </span>
                  <span className="label-mono">0{index + 1}</span>
                </a>
              ))}
            </nav>
            <div className="flex items-end justify-between pt-8 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              <span>Bandung — Indonesia</span>
              <span>Arcane Labs / 2026</span>
            </div>
          </div>
        )}

        <section
          id="top"
          className="relative z-10 flex min-h-[100svh] flex-col justify-between overflow-hidden px-5 pb-7 pt-24 md:min-h-screen md:px-8 md:pb-8"
        >
          <div className="pointer-events-none absolute inset-0 z-0 [mask-image:radial-gradient(ellipse_90%_80%_at_50%_50%,black_28%,transparent_100%)] [-webkit-mask-image:radial-gradient(ellipse_90%_80%_at_50%_50%,black_28%,transparent_100%)]">
            <GalaxyHeroBackground className="h-full w-full" />
          </div>

          <div className="relative z-[2] flex items-start justify-between gap-6">
            <h1 className="label-mono max-w-[9rem] leading-relaxed text-foreground/70 md:max-w-[10rem]">
              <span className="sr-only">Arcane Labs — </span>
              Digital systems.
              <br aria-hidden="true" />
              Built for business.
            </h1>
            <p className="label-mono max-w-[8rem] text-right text-foreground/70 md:max-w-none">
              Bandung — Indonesia
            </p>
          </div>

          <div className="flicker-in relative z-[2] h-[28svh] w-full md:h-[46vh]">
            <AsciiWordmark text="ARCANE LABS" cell={7} />
          </div>

          <div className="relative z-[2] flex items-end justify-between gap-6 md:items-end">
            <PixelReveal>
              <p className="max-w-[19rem] text-[13px] leading-relaxed text-foreground/60 md:max-w-xl md:text-base">
                Arcane Labs is a Bandung-based developer studio building applications, websites,
                finance analytics, product analytics, and custom digital systems for real business
                needs.
              </p>
            </PixelReveal>
            <span className="label-mono shrink-0 text-foreground/50">Scroll ↓</span>
          </div>
        </section>

        <PartnerFlipGrid />

        <SectionPixelReveal>
          <section id="works" className="relative z-10 line-top px-5 py-16 md:px-8 md:py-28">
            <div className="mb-8 flex items-baseline justify-between md:mb-12">
              <PixelReveal>
                <h2 className="font-display text-2xl uppercase tracking-tight md:text-4xl">
                  Selected systems
                </h2>
              </PixelReveal>
              <span className="label-mono">01</span>
            </div>

            <div className="grid gap-7 md:grid-cols-[1.1fr_0.9fr] md:gap-10">
              <ul className="line-top">
                {works.map((work, index) => (
                  <li key={work.title}>
                    <button
                      type="button"
                      onPointerEnter={() => setActiveWork(index)}
                      onFocus={() => setActiveWork(index)}
                      onClick={() => setActiveWork(index)}
                      aria-pressed={activeWork === index}
                      className="group flex w-full items-center justify-between border-b border-border py-4 text-left md:items-baseline md:py-5"
                    >
                      <span className="flex min-w-0 items-baseline gap-3 md:gap-4">
                        <span className="label-mono shrink-0">/0{index + 1}/</span>
                        <ScrambleText
                          text={work.title}
                          className={`truncate font-display text-base uppercase leading-tight transition-opacity md:text-3xl ${
                            activeWork === index ? "opacity-100" : "opacity-45"
                          }`}
                        />
                      </span>
                      <span className="label-mono ml-3 shrink-0 !text-[9px] md:!text-[10px]">
                        {work.year}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>

              <PixelReveal className="md:sticky md:top-28 md:self-start">
                <div className="border border-border p-4 md:p-6">
                  <div className="mb-5 h-40 w-full overflow-hidden md:mb-6 md:h-64">
                    <AsciiWordmark
                      key={works[activeWork]?.title}
                      text={(works[activeWork]?.title ?? "").toUpperCase().slice(0, 12)}
                      cell={6}
                    />
                  </div>
                  <dl className="space-y-3 text-xs md:text-sm">
                    <div className="flex justify-between gap-6">
                      <dt className="label-mono">Use case</dt>
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

        <SectionPixelReveal threshold={0.06}>
          <IdentityConstellation />
        </SectionPixelReveal>

        <SectionPixelReveal>
          <section className="relative z-10 line-top px-5 py-16 md:px-8 md:py-28">
            <div className="mb-10 flex items-baseline justify-between md:mb-12">
              <PixelReveal>
                <h2 className="font-display text-2xl uppercase tracking-tight md:text-4xl">
                  From problem to system
                </h2>
              </PixelReveal>
              <span className="label-mono">03</span>
            </div>

            <PixelReveal>
              <p className="mb-12 font-display text-[2rem] uppercase leading-[1.02] md:mb-16 md:text-6xl">
                We design. We build. We analyze. Digital systems made for real business decisions.
              </p>
            </PixelReveal>

            <div className="grid gap-px bg-border md:grid-cols-4">
              {expertise.map((block, index) => (
                <PixelReveal key={block.id} delay={index * 90}>
                  <div className="h-full bg-background p-5 md:p-6">
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

        <VisionTextSequence />

        <SectionPixelReveal threshold={0.05}>
          <ProjectConverge />
        </SectionPixelReveal>

        <EnchantedProjectCarousel />
        <SectionPixelReveal threshold={0.05}>
          <InteractiveTicker />
        </SectionPixelReveal>

        <SectionPixelReveal>
          <section id="faq" className="relative z-10 line-top px-5 py-16 md:px-8 md:py-28">
            <div className="mb-10 flex items-baseline justify-between md:mb-12">
              <PixelReveal>
                <h2 className="font-display text-2xl uppercase tracking-tight md:text-4xl">
                  Frequently asked
                </h2>
              </PixelReveal>
              <span className="label-mono">05</span>
            </div>
            <PixelReveal>
              <PixelFaq />
            </PixelReveal>
          </section>
        </SectionPixelReveal>

        <MetaversePortalV2 />

        <style>{`
          @media (max-width: 767px) {
            .mobile-footer-shell > section {
              height: auto !important;
              min-height: 900px !important;
            }
            .mobile-footer-shell [data-footer-content] {
              position: relative !important;
              inset: auto !important;
              min-height: 900px;
              justify-content: flex-end;
              padding: 10rem 1.25rem 6rem;
            }
            .mobile-footer-shell [data-footer-logo] {
              height: 26svh !important;
              min-height: 150px !important;
              margin-bottom: 2rem !important;
            }
            .mobile-footer-shell [data-footer-nav] > div {
              grid-template-columns: repeat(2, minmax(0, 1fr));
              column-gap: 1.25rem;
              row-gap: 2.5rem;
            }
            .mobile-footer-shell [data-footer-ticker] {
              bottom: 0 !important;
            }
          }
        `}</style>
        <footer
          id="contact"
          className="mobile-footer-shell relative z-10 -mt-[44vh] overflow-visible md:-mt-[40vh]"
        >
          <ArcaneFooterField />
        </footer>
      </div>
    </div>
  );
}

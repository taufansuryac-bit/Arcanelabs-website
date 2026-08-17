import "@/redesign-v2.css";

const ITEMS = ["BRANDING", "UI/UX", "WEB DEVELOPMENT", "MOTION", "CREATIVE TECHNOLOGY"] as const;

export function InteractiveTicker() {
  return (
    <section className="relative z-10 overflow-hidden border-y border-border py-4 md:py-5">
      <div className="ticker-v2 group flex w-max select-none" tabIndex={0}>
        {[0, 1].map((copy) => (
          <div key={copy} className="ticker-v2-track flex shrink-0 items-center">
            {ITEMS.map((item) => (
              <span
                key={`${copy}-${item}`}
                className="ticker-v2-item flex items-center whitespace-nowrap px-4 font-display text-2xl uppercase tracking-[-0.04em] text-foreground/30 transition-[color,opacity,transform] duration-300 hover:scale-[1.03] hover:text-foreground md:px-7 md:text-5xl"
              >
                {item}
                <span
                  className="ml-8 inline-block h-2 w-2 bg-neon opacity-70 md:ml-14"
                  aria-hidden
                />
              </span>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}

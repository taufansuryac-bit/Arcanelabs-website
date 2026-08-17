import { useState } from "react";

const faqs = [
  {
    q: "What kind of projects do you take on?",
    a: "Commercials, brand films, music videos and experimental formats. If it moves and it needs a point of view, we are interested.",
  },
  {
    q: "Do you work internationally?",
    a: "Yes. We produce out of Berlin with a vetted crew network across Europe, the US and Asia, including full cross-border legal and rights handling.",
  },
  {
    q: "How does the hybrid AI workflow work?",
    a: "We treat generative tooling as another department. Plates are shot, generated or blended, then finished in a conventional online pipeline so delivery stays broadcast safe.",
  },
  {
    q: "What is a typical timeline?",
    a: "Two to six weeks from brief to master for most commercial work. Fast-turnaround social builds can land in days.",
  },
  {
    q: "How do we start?",
    a: "Send a brief, a deck or even a reference reel to hello@arcanelabs.mov. You get a treatment direction and a rough budget band within 48 hours.",
  },
];

export function PixelFaq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <ul className="line-top">
      {faqs.map((f, i) => {
        const isOpen = open === i;
        return (
          <li key={f.q} className="border-b border-border">
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : i)}
              aria-expanded={isOpen}
              className="group flex w-full items-center justify-between gap-6 py-5 text-left"
            >
              <span className="flex items-baseline gap-4">
                <span className="label-mono">/{String(i + 1).padStart(2, "0")}/</span>
                <span className="text-sm uppercase tracking-[0.12em] transition-opacity group-hover:opacity-60 md:text-base">
                  {f.q}
                </span>
              </span>
              <span
                className="label-mono shrink-0 transition-transform duration-300"
                style={{ transform: isOpen ? "rotate(45deg)" : "none" }}
              >
                +
              </span>
            </button>
            <div
              className="grid transition-all duration-500 ease-out"
              style={{ gridTemplateRows: isOpen ? "1fr" : "0fr", opacity: isOpen ? 1 : 0 }}
            >
              <div className="overflow-hidden">
                <p className="max-w-2xl pb-6 text-sm leading-relaxed text-muted-foreground">
                  {f.a}
                </p>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

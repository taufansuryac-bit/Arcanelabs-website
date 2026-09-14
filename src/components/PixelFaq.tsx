import { useState } from "react";

const faqs = [
  {
    q: "What can Arcane Labs build?",
    a: "We build applications, websites, internal tools, finance and product analytics dashboards, business systems, and AI-assisted automation around a real operational need.",
  },
  {
    q: "Where is Arcane Labs based?",
    a: "Arcane Labs is based in Bandung, Indonesia. We can work remotely with teams anywhere while keeping product communication and delivery structured online.",
  },
  {
    q: "Can you work with our existing systems and data?",
    a: "Yes. A project can connect to existing APIs, databases, spreadsheets, marketplace exports, analytics sources, or other business services when the access and data model support it.",
  },
  {
    q: "How does a project usually start?",
    a: "We first map the business problem, users, current workflow, required data, and success criteria. From there we define the smallest useful system before expanding the scope.",
  },
  {
    q: "How do we contact you?",
    a: "Send the problem you want to solve, the current workflow, and any useful references to hello@arcanelabs.mov. We can use that as the starting point for scope and technical direction.",
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

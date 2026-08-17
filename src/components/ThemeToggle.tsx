import { useEffect, useState } from "react";

type Mode = "dark" | "light";

/** Pixelate light/dark switch. Persists the choice in localStorage. */
export function ThemeToggle() {
  const [mode, setMode] = useState<Mode>("dark");

  useEffect(() => {
    const saved = (localStorage.getItem("al-theme") as Mode | null) ?? "dark";
    setMode(saved);
    document.documentElement.classList.toggle("dark", saved === "dark");
  }, []);

  const toggle = () => {
    const next: Mode = mode === "dark" ? "light" : "dark";
    setMode(next);
    localStorage.setItem("al-theme", next);
    document.documentElement.classList.toggle("dark", next === "dark");
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle pixel light / dark mode"
      className="group flex items-center gap-2 border border-border px-2 py-1"
    >
      <span className="grid grid-cols-2 gap-px">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={`h-1.5 w-1.5 transition-colors ${
              (mode === "dark" ? i % 3 === 0 : i % 3 !== 0)
                ? "bg-foreground"
                : "bg-foreground/25 group-hover:bg-neon"
            }`}
          />
        ))}
      </span>
      <span className="label-mono !text-[10px] text-foreground/70">
        {mode === "dark" ? "DARK" : "LIGHT"}
      </span>
    </button>
  );
}

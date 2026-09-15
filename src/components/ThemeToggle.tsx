import { useEffect, useState } from "react";

type Mode = "dark" | "light";

type ThemeToggleProps = {
  forceContrast?: boolean;
};

const THEME_KEY = "al-theme-v2";

/** Pixelate light/dark switch. Dark is the default; a v2 choice persists afterwards. */
export function ThemeToggle({ forceContrast = false }: ThemeToggleProps) {
  const [mode, setMode] = useState<Mode>("dark");

  useEffect(() => {
    const saved = (localStorage.getItem(THEME_KEY) as Mode | null) ?? "dark";
    setMode(saved);
    document.documentElement.classList.toggle("dark", saved === "dark");
  }, []);

  const toggle = () => {
    const next: Mode = mode === "dark" ? "light" : "dark";
    setMode(next);
    localStorage.setItem(THEME_KEY, next);
    document.documentElement.classList.toggle("dark", next === "dark");
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle pixel light / dark mode"
      className={`group flex items-center gap-2 border px-2 py-1 backdrop-blur-[2px] transition-colors ${
        forceContrast
          ? "border-white/20 bg-black/65 text-white"
          : "border-border bg-background/70 text-foreground"
      }`}
    >
      <span className="grid grid-cols-2 gap-px">
        {[0, 1, 2, 3].map((i) => {
          const lit = mode === "dark" ? i % 3 === 0 : i % 3 !== 0;
          return (
            <span
              key={i}
              className={`h-1.5 w-1.5 transition-colors ${
                forceContrast
                  ? lit
                    ? "bg-white"
                    : "bg-white/25 group-hover:bg-neon"
                  : lit
                    ? "bg-foreground"
                    : "bg-foreground/25 group-hover:bg-neon"
              }`}
            />
          );
        })}
      </span>
      <span
        className={`label-mono !text-[10px] ${
          forceContrast ? "text-white/75" : "text-foreground/70"
        }`}
      >
        {mode === "dark" ? "DARK" : "LIGHT"}
      </span>
    </button>
  );
}

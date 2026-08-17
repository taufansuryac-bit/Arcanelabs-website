/**
 * Arcane Labs mark. First-party SVGs derived from the supplied black/white
 * master artwork. Light mode uses the black mark; dark mode uses the white mark.
 */
export function PixelLogo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-block ${className}`}>
      <img
        src="/arcane-logo-black.svg"
        alt="Arcane Labs"
        className="h-full w-full object-contain dark:hidden"
        draggable={false}
      />
      <img
        src="/arcane-logo-white.svg"
        alt="Arcane Labs"
        className="hidden h-full w-full object-contain dark:block"
        draggable={false}
      />
    </span>
  );
}

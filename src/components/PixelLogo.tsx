import logoLight from "@/assets/logo-light.png.asset.json";
import logoDark from "@/assets/logo-dark.png.asset.json";

/**
 * Arcane Labs mark. Two versions ship: the black mark for light mode and the
 * white mark for dark mode, swapped with the `dark` class variant.
 */
export function PixelLogo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-block ${className}`}>
      <img
        src={logoDark.url}
        alt="Arcane Labs"
        className="h-full w-full object-contain dark:hidden"
      />
      <img
        src={logoLight.url}
        alt="Arcane Labs"
        className="hidden h-full w-full object-contain dark:block"
      />
    </span>
  );
}

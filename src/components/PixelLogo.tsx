/**
 * Placeholder pixel mark — swap for the real Arcane Labs logo when it lands.
 * Drawn as a 7x7 pixel grid so it stays crisp at any scale.
 */
const GRID = [
  "0011100",
  "0110110",
  "1100011",
  "1111111",
  "1100011",
  "1100011",
  "1100011",
];

export function PixelLogo({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 7 7"
      shapeRendering="crispEdges"
      className={className}
      role="img"
      aria-label="Arcane Labs mark"
    >
      {GRID.map((row, y) =>
        row.split("").map((c, x) =>
          c === "1" ? (
            <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill="currentColor" />
          ) : null,
        ),
      )}
    </svg>
  );
}

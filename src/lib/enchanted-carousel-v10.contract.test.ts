import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const routeSource = await readFile(new URL("../routes/index.tsx", import.meta.url), "utf8");
const carouselSource = await readFile(
  new URL("../components/EnchantedProjectCarousel.tsx", import.meta.url),
  "utf8",
);

test("carousel lives inside the Projects section, below the project list", () => {
  const worksStart = routeSource.indexOf('id="works"');
  const worksEnd = routeSource.indexOf("</section>", worksStart);
  const carousel = routeSource.indexOf("<EnchantedProjectCarousel", worksStart);

  assert.ok(worksStart >= 0);
  assert.ok(worksEnd > worksStart);
  assert.ok(carousel > worksStart);
  assert.ok(carousel < worksEnd);
});

test("V10 uses the exact Lovable ring transform composition", () => {
  assert.match(carouselSource, /const RADIUS = 620/);
  assert.match(carouselSource, /const STEP = 360 \/ items\.length/);
  assert.match(carouselSource, /perspective:\s*["']1400px["']/);
  assert.match(carouselSource, /translate\(-50%, -50%\) translateZ\(-700px\) rotateX\(-8deg\) rotateY\(\$\{angle\}deg\)/);
  assert.match(carouselSource, /-translate-x-1\/2 -translate-y-1\/2 rounded-2xl/);
  assert.match(carouselSource, /transform:\s*`rotateY\(\$\{i \* STEP\}deg\) translateZ\(\$\{RADIUS\}px\)`/);
  assert.doesNotMatch(carouselSource, /backfaceVisibility/);
});

test("V10 restores the complete 12-card mixed ring and original interactions", () => {
  assert.match(carouselSource, /PASSION/);
  assert.match(carouselSource, /NIGHT MODE/);
  assert.match(carouselSource, /RED STROKE/);
  assert.match(carouselSource, /STREET/);
  assert.match(carouselSource, /SILHOUETTE/);
  assert.match(carouselSource, /CONTRAST/);
  assert.match(carouselSource, /Mia Carter/);
  assert.match(carouselSource, /James Walker/);
  assert.match(carouselSource, /requestAnimationFrame/);
  assert.match(carouselSource, /onPointerDown/);
  assert.match(carouselSource, /onPointerMove/);
  assert.match(carouselSource, /setSelected/);
  assert.match(carouselSource, /pixel-in/);
  assert.match(carouselSource, /pixel-out/);
});

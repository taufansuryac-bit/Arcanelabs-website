import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const routeSource = await readFile(new URL("../routes/index.tsx", import.meta.url), "utf8");
const carouselSource = await readFile(
  new URL("../components/EnchantedProjectCarousel.tsx", import.meta.url),
  "utf8",
);

test("enchanted carousel sits immediately after Selected Works", () => {
  const worksSection = routeSource.indexOf('id="works"');
  const projectsSectionEnd = routeSource.indexOf("</SectionPixelReveal>", worksSection);
  const carousel = routeSource.indexOf("<EnchantedProjectCarousel", projectsSectionEnd);
  const ticker = routeSource.indexOf("<InteractiveTicker", projectsSectionEnd);

  assert.ok(worksSection >= 0);
  assert.ok(projectsSectionEnd > worksSection);
  assert.ok(carousel > projectsSectionEnd);
  assert.ok(ticker > carousel);
  assert.doesNotMatch(routeSource, /ProjectScrapbookOrbit/);
});

test("carousel matches the new enchanted-carousel geometry instead of the old orbit", () => {
  assert.match(carouselSource, /const RADIUS = 620/);
  assert.match(carouselSource, /const STEP = 360 \/ ITEMS\.length/);
  assert.match(carouselSource, /perspective:\s*["']1400px["']/);
  assert.match(carouselSource, /translateZ\(-700px\)/);
  assert.match(carouselSource, /rotateX\(-8deg\)/);
  assert.match(carouselSource, /h-\[180px\]/);
  assert.match(carouselSource, /w-\[280px\]/);
  assert.match(carouselSource, /rounded-2xl/);
  assert.match(carouselSource, /preserve-3d/);
});

test("carousel uses the mixed image and quote composition from the new design", () => {
  assert.match(carouselSource, /kind:\s*["']image["']/);
  assert.match(carouselSource, /kind:\s*["']quote["']/);
  assert.match(carouselSource, /PROJECT 01/);
  assert.match(carouselSource, /PROJECT 06/);
  assert.match(carouselSource, /Every frame lands/);
  assert.match(carouselSource, /pixel-in/);
  assert.match(carouselSource, /pixel-out/);
  assert.match(carouselSource, /stage-glow/);
  assert.match(carouselSource, /card-pop/);
});

test("interaction remains 3D, draggable, auto-rotating and expandable", () => {
  assert.match(carouselSource, /requestAnimationFrame/);
  assert.match(carouselSource, /onPointerDown/);
  assert.match(carouselSource, /onPointerMove/);
  assert.match(carouselSource, /setSelected/);
  assert.match(carouselSource, /Escape/);
});

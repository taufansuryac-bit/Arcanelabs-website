import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const routeSource = await readFile(new URL("../routes/index.tsx", import.meta.url), "utf8");
const carouselSource = await readFile(
  new URL("../components/EnchantedProjectCarousel.tsx", import.meta.url),
  "utf8",
);

test("legacy ProjectScrapbookOrbit is no longer routed", () => {
  assert.doesNotMatch(routeSource, /ProjectScrapbookOrbit/);
  assert.match(routeSource, /EnchantedProjectCarousel/);
});

test("enchanted carousel remains a true 3D circular interaction", () => {
  assert.match(carouselSource, /perspective:\s*["']1400px["']/);
  assert.match(carouselSource, /rotateY\(/);
  assert.match(carouselSource, /translateZ\(/);
  assert.match(carouselSource, /requestAnimationFrame/);
  assert.match(carouselSource, /onPointerDown/);
  assert.match(carouselSource, /onPointerMove/);
  assert.match(carouselSource, /setSelected/);
  assert.doesNotMatch(carouselSource, /backfaceVisibility/);
});

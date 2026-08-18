import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const carouselSource = await readFile(
  new URL("../components/EnchantedProjectCarousel.tsx", import.meta.url),
  "utf8",
);
const projectsSource = await readFile(
  new URL("../components/ProjectConverge.tsx", import.meta.url),
  "utf8",
);

test("V11 carousel uses only the global website background", () => {
  assert.doesNotMatch(carouselSource, /enchanted-stage-glow/);
  assert.doesNotMatch(carouselSource, /radial-gradient\(/);
  assert.match(carouselSource, /bg-transparent/);
});

test("V11 carousel fills the viewport more aggressively and sits higher", () => {
  assert.match(carouselSource, /h-\[68svh\]/);
  assert.match(carouselSource, /min-h-\[540px\]/);
  assert.match(carouselSource, /max-h-\[820px\]/);
  assert.match(carouselSource, /top-\[43%\]/);
  assert.match(carouselSource, /--carousel-scale/);
  assert.match(carouselSource, /scale\(var\(--carousel-scale\)\)/);
});

test("V11 reduces the gap between Projects and the carousel", () => {
  assert.match(projectsSource, /pt-24 pb-8/);
  assert.match(projectsSource, /md:pt-32 md:pb-10/);
  assert.doesNotMatch(projectsSource, /md:py-32/);
});

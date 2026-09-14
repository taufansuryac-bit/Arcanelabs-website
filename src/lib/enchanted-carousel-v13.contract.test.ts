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

test("V13 carousel keeps the open ring spacing while using the new larger cards", () => {
  assert.match(carouselSource, /--carousel-card-w:\s*clamp\(460px,\s*27vw,\s*540px\)/);
  assert.match(carouselSource, /--carousel-card-h:\s*clamp\(288px,\s*17vw,\s*340px\)/);
  assert.match(carouselSource, /--carousel-radius:\s*clamp\(800px,\s*52vw,\s*1050px\)/);
});

test("V13 camera keeps the larger ring forward without global scale", () => {
  assert.match(carouselSource, /--carousel-camera-z:\s*clamp\(-980px,\s*-48vw,\s*-820px\)/);
  assert.match(carouselSource, /--carousel-perspective:\s*clamp\(1900px,\s*110vw,\s*2300px\)/);
  assert.doesNotMatch(carouselSource, /scale\(var\(--carousel-scale\)\)/);
});

test("V13 trims the large vertical void around the carousel", () => {
  assert.match(carouselSource, /h-\[56svh\]/);
  assert.match(carouselSource, /min-h-\[480px\]/);
  assert.match(carouselSource, /max-h-\[620px\]/);
  assert.match(carouselSource, /top-\[46%\]/);
  assert.match(projectsSource, /md:pb-0/);
});

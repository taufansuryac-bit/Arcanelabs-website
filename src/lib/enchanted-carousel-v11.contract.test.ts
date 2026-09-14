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

test("carousel uses only the global website background", () => {
  assert.doesNotMatch(carouselSource, /enchanted-stage-glow/);
  assert.doesNotMatch(carouselSource, /radial-gradient\(/);
  assert.match(carouselSource, /bg-transparent/);
});

test("Projects keeps the reduced gap into the carousel", () => {
  assert.match(projectsSource, /pt-24 pb-0/);
  assert.match(projectsSource, /md:pt-32 md:pb-0/);
  assert.doesNotMatch(projectsSource, /md:py-32/);
});

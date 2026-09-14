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
const identitySource = await readFile(
  new URL("../components/IdentityConstellation.tsx", import.meta.url),
  "utf8",
);
const indexSource = await readFile(new URL("../routes/index.tsx", import.meta.url), "utf8");

test("3D carousel pauses autonomous work when hidden or reduced-motion is requested", () => {
  assert.match(carouselSource, /observeElementVisibility/);
  assert.match(carouselSource, /observeDocumentVisibility/);
  assert.match(carouselSource, /observeReducedMotion/);
  assert.match(carouselSource, /prefersReducedMotion/);
  assert.match(carouselSource, /shouldAnimate/);
  assert.match(carouselSource, /!active\s*\|\|\s*reducedMotion\s*\|\|\s*paused/);
  assert.match(carouselSource, /!active\s*\|\|\s*reducedMotion/);
});

test("expanded carousel card behaves as a real modal and locks background scroll", () => {
  assert.match(carouselSource, /role="dialog"/);
  assert.match(carouselSource, /aria-modal="true"/);
  assert.match(carouselSource, /document\.documentElement/);
  assert.match(carouselSource, /style\.overflow\s*=\s*"hidden"/);
});

test("project parallax keeps its layout but honors reduced motion", () => {
  assert.match(projectsSource, /useReducedMotion/);
  assert.match(projectsSource, /reduced\s*\?\s*0\s*:\s*y/);
  assert.match(projectsSource, /reduced\s*\?\s*"none"\s*:\s*blur/);
  assert.match(projectsSource, /reduced\s*\?\s*1\s*:\s*scale/);
  assert.match(projectsSource, /reduced\s*\?\s*"0%"\s*:\s*imgY/);
});

test("Identity keeps four floating cards but adds a narrow-phone geometry guard", () => {
  assert.match(identitySource, /@media \(max-width:\s*359px\)/);
  assert.match(identitySource, /active\.cards\.map\(\(card, index\)/);
  assert.match(identitySource, /data-card-index=\{index\}/);
  assert.doesNotMatch(identitySource, /active\.cards\.slice\(0, 2\)/);
});

test("section markers follow the visual order after Identity", () => {
  assert.match(projectsSource, />04<\/span>/);
  assert.match(indexSource, /Frequently asked[\s\S]{0,250}<span className="label-mono">05<\/span>/);
});

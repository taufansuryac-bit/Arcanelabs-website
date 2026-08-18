import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const routeSource = await readFile(new URL("../routes/index.tsx", import.meta.url), "utf8");
const carouselSource = await readFile(
  new URL("../components/EnchantedProjectCarousel.tsx", import.meta.url),
  "utf8",
);

test("carousel sits immediately after the real PROJECTS grid component", () => {
  const selectedWorks = routeSource.indexOf('id="works"');
  const projects = routeSource.indexOf("<ProjectConverge />");
  const carousel = routeSource.indexOf("<EnchantedProjectCarousel />");
  const faq = routeSource.indexOf('id="faq"');

  assert.ok(selectedWorks >= 0);
  assert.ok(projects > selectedWorks);
  assert.ok(carousel > projects);
  assert.ok(faq > carousel);
  assert.equal(
    routeSource.indexOf("<EnchantedProjectCarousel />"),
    routeSource.lastIndexOf("<EnchantedProjectCarousel />"),
  );
});

test("carousel remains a full 3D circular interaction without hiding rear cards", () => {
  assert.match(carouselSource, /const STEP = 360 \/ items\.length/);
  assert.match(carouselSource, /rotateY\(/);
  assert.match(carouselSource, /translateZ\(/);
  assert.match(carouselSource, /preserve-3d/);
  assert.doesNotMatch(carouselSource, /backfaceVisibility/);
});

test("carousel keeps the complete 12-card mixed ring and original interactions", () => {
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

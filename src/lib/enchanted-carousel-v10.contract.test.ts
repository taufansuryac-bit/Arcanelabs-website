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

test("carousel keeps the requested eight-card mixed ring and original interactions", () => {
  assert.match(carouselSource, /CUSTOM APPS/);
  assert.match(carouselSource, /APPLICATION DEVELOPMENT/);
  assert.match(carouselSource, /FINANCE DATA/);
  assert.match(carouselSource, /FINANCE ANALYTICS/);
  assert.match(carouselSource, /PRODUCT DATA/);
  assert.match(carouselSource, /PRODUCT ANALYTICS/);
  assert.match(carouselSource, /WEB SYSTEMS/);
  assert.match(carouselSource, /WEB DEVELOPMENT/);
  assert.doesNotMatch(carouselSource, /id:\s*(?:8|9|10|11)/);
  assert.match(carouselSource, /requestAnimationFrame/);
  assert.match(carouselSource, /onPointerDown/);
  assert.match(carouselSource, /onPointerMove/);
  assert.match(carouselSource, /setSelected/);
  assert.match(carouselSource, /pixel-in/);
  assert.match(carouselSource, /pixel-out/);
});

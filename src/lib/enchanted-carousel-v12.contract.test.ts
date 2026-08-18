import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const carouselSource = await readFile(
  new URL("../components/EnchantedProjectCarousel.tsx", import.meta.url),
  "utf8",
);

test("carousel keeps responsive geometry variables and no global world scale", () => {
  assert.doesNotMatch(carouselSource, /--carousel-scale/);
  assert.doesNotMatch(carouselSource, /scale\(var\(--carousel-scale\)\)/);
  assert.match(carouselSource, /--carousel-card-w/);
  assert.match(carouselSource, /--carousel-card-h/);
  assert.match(carouselSource, /--carousel-radius/);
  assert.match(carouselSource, /--carousel-camera-z/);
  assert.match(carouselSource, /--carousel-perspective/);
  assert.match(carouselSource, /--carousel-tilt/);
});

test("carousel keeps a viewport-relative stage and centered perspective", () => {
  assert.match(carouselSource, /svh/);
  assert.match(carouselSource, /perspectiveOrigin:\s*["']50% 50%["']/);
  assert.match(carouselSource, /left-1\/2/);
});

test("carousel applies camera and radius directly instead of scaling the entire 3D world", () => {
  assert.match(
    carouselSource,
    /translateZ\(var\(--carousel-camera-z\)\) rotateX\(var\(--carousel-tilt\)\)/,
  );
  assert.match(carouselSource, /translateZ\(var\(--carousel-radius\)\)/);
  assert.match(carouselSource, /width:\s*["']var\(--carousel-card-w\)["']/);
  assert.match(carouselSource, /height:\s*["']var\(--carousel-card-h\)["']/);
});

test("carousel remains transparent and does not introduce a local stage background", () => {
  assert.match(carouselSource, /bg-transparent/);
  assert.doesNotMatch(carouselSource, /enchanted-stage-glow/);
  assert.doesNotMatch(carouselSource, /radial-gradient\(/);
});

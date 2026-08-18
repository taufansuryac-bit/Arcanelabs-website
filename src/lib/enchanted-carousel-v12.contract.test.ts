import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const carouselSource = await readFile(
  new URL("../components/EnchantedProjectCarousel.tsx", import.meta.url),
  "utf8",
);

test("V12 removes global world scaling and uses responsive geometry variables", () => {
  assert.doesNotMatch(carouselSource, /--carousel-scale/);
  assert.doesNotMatch(carouselSource, /scale\(var\(--carousel-scale\)\)/);
  assert.match(carouselSource, /--carousel-card-w/);
  assert.match(carouselSource, /--carousel-card-h/);
  assert.match(carouselSource, /--carousel-radius/);
  assert.match(carouselSource, /--carousel-camera-z/);
  assert.match(carouselSource, /--carousel-perspective/);
  assert.match(carouselSource, /--carousel-tilt/);
});

test("V12 centers the ring and gives it a viewport-sized stage", () => {
  assert.match(carouselSource, /h-\[86svh\]/);
  assert.match(carouselSource, /min-h-\[620px\]/);
  assert.match(carouselSource, /max-h-\[980px\]/);
  assert.match(carouselSource, /top-1\/2/);
  assert.match(carouselSource, /perspectiveOrigin:\s*["']50% 50%["']/);
});

test("V12 applies camera and radius directly instead of scaling the entire 3D world", () => {
  assert.match(
    carouselSource,
    /translateZ\(var\(--carousel-camera-z\)\) rotateX\(var\(--carousel-tilt\)\)/,
  );
  assert.match(
    carouselSource,
    /translateZ\(var\(--carousel-radius\)\)/,
  );
  assert.match(carouselSource, /width:\s*["']var\(--carousel-card-w\)["']/);
  assert.match(carouselSource, /height:\s*["']var\(--carousel-card-h\)["']/);
});

test("V12 remains transparent and does not introduce a local stage background", () => {
  assert.match(carouselSource, /bg-transparent/);
  assert.doesNotMatch(carouselSource, /enchanted-stage-glow/);
  assert.doesNotMatch(carouselSource, /radial-gradient\(/);
});

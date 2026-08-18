import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const carouselSource = await readFile(
  new URL("../components/EnchantedProjectCarousel.tsx", import.meta.url),
  "utf8",
);

test("V13 carousel increases radius more than card size so spacing opens up", () => {
  assert.match(carouselSource, /--card-w:\s*clamp\(360px,\s*23vw,\s*430px\)/);
  assert.match(carouselSource, /--card-h:\s*clamp\(232px,\s*14\.8vw,\s*278px\)/);
  assert.match(carouselSource, /--ring-radius:\s*clamp\(760px,\s*48vw,\s*920px\)/);
});

test("V13 carousel moves camera closer while keeping full ring perspective", () => {
  assert.match(carouselSource, /--camera-z:\s*clamp\(-860px,\s*-48vw,\s*-720px\)/);
  assert.match(carouselSource, /--perspective:\s*clamp\(1800px,\s*115vw,\s*2200px\)/);
});

test("V13 trims vertical whitespace around the ring", () => {
  assert.match(carouselSource, /h-\[64svh\]/);
  assert.match(carouselSource, /min-h-\[520px\]/);
  assert.match(carouselSource, /max-h-\[720px\]/);
  assert.match(carouselSource, /top-1\/2/);
});

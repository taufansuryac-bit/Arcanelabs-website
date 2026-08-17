import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { shouldAnimate } from "./animation-runtime.ts";

async function readSource(relativeUrl: string) {
  return readFile(new URL(relativeUrl, import.meta.url), "utf8");
}

test("animation runs only when page and element are visible", () => {
  assert.equal(shouldAnimate(true, true), true);
  assert.equal(shouldAnimate(false, true), false);
  assert.equal(shouldAnimate(true, false), false);
  assert.equal(shouldAnimate(false, false), false);
});

test("AsciiWordmark is gated by viewport and document visibility", async () => {
  const source = await readSource("../components/AsciiWordmark.tsx");
  assert.match(source, /observeElementVisibility/);
  assert.match(source, /observeDocumentVisibility/);
  assert.match(source, /shouldAnimate/);
  assert.match(source, /const start = \(\) =>/);
  assert.match(source, /const stop = \(\) =>/);
});

test("NoiseBackground pauses hidden work without changing visual constants", async () => {
  const source = await readSource("../components/NoiseBackground.tsx");
  assert.match(source, /const CELL = 14/);
  assert.match(source, /const SEGMENTS = 16/);
  assert.match(source, /heat\[i\] = v \* 0\.87/);
  assert.match(source, /t - last < 50/);
  assert.match(source, /observeDocumentVisibility/);
  assert.match(source, /grainImage/);
});

test("MetaversePortal keeps full visual density while pausing offscreen", async () => {
  const source = await readSource("../components/MetaversePortal.tsx");
  assert.match(source, /const N = 460/);
  assert.match(source, /k < 14/);
  assert.match(source, /FROM FIRST FRAME/);
  assert.match(source, /THROUGH THE MACHINE/);
  assert.match(source, /INTO SOMETHING ARCANE/);
  assert.match(source, /h-\[640vh\]/);
  assert.match(source, /observeElementVisibility/);
  assert.match(source, /observeDocumentVisibility/);
  assert.match(source, /shouldAnimate/);
});

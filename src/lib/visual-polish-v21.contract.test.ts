import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function readSource(relativeUrl: string) {
  return readFile(new URL(relativeUrl, import.meta.url), "utf8");
}

test("selected system detail values wrap instead of clipping", async () => {
  const source = await readSource("../routes/index.tsx");
  assert.match(source, /\[overflow-wrap:anywhere\]/);
  assert.match(source, /min-w-0 flex-1 text-right/);
});

test("vision morph switches the whole line together and keeps readable statements", async () => {
  const source = await readSource("../components/VisionTextSequence.tsx");
  assert.match(source, /WHOLE_LINE_SWITCH_START/);
  assert.match(source, /WHOLE_LINE_SWITCH_END/);
  assert.match(source, /buildWholeLineGlitch/);
  assert.doesNotMatch(source, /const start = \(index \/ Math\.max\(1, length\)\)/);
  assert.match(source, /id="vision"/);
  assert.match(source, /data-nav-surface="dark"/);
});

test("desktop navigation forces light contrast while the dark vision surface is under it", async () => {
  const index = await readSource("../routes/index.tsx");
  const toggle = await readSource("../components/ThemeToggle.tsx");
  assert.match(index, /navOnDarkSurface/);
  assert.match(index, /document\.getElementById\("vision"\)/);
  assert.match(index, /<ThemeToggle forceContrast=\{navOnDarkSurface\} \/>/);
  assert.match(toggle, /forceContrast\?: boolean/);
  assert.match(toggle, /forceContrast[\s\S]{0,100}\? "border-white\/20 bg-black\/65 text-white"/);
});

test("stable voxel logo keeps chaos subtle and moves each depth column coherently", async () => {
  const source = await readSource("../components/UnifiedVoxelDimensionScene.tsx");
  assert.match(source, /let sampleIndex = 0/);
  assert.match(source, /const columnRand = seeded\(sampleIndex/);
  assert.match(source, /columnRand < 0\.035/);
  assert.match(source, /0\.18 \+ seeded\([^\n]+\) \* 0\.24/);
  assert.match(source, /sampleIndex \+= 1/);
});

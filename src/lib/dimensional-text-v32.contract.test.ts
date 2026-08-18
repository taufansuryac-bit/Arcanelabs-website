import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(
  new URL("../components/UnifiedVoxelDimensionScene.tsx", import.meta.url),
  "utf8",
);

test("dimension scene defines three configurable depth phrases", () => {
  assert.match(source, /DIMENSION_PHRASES/);
  assert.match(source, /ENTER THE ARCANE FIELD/);
  assert.match(source, /PIXELS BECOME SPACE/);
  assert.match(source, /BUILD BEYOND THE FRAME/);
});

test("phrases move through scene depth instead of being full-screen DOM overlays", () => {
  assert.match(source, /Text3D|<Text/);
  assert.match(source, /phraseDepth/);
  assert.match(source, /phraseOpacity/);
  assert.match(source, /phraseScale/);
  assert.doesNotMatch(source, /PortalPhrase/);
});

test("phrase transitions overlap using fade-out and fade-in windows", () => {
  assert.match(source, /phraseWindow/);
  assert.match(source, /fadeIn/);
  assert.match(source, /fadeOut/);
});

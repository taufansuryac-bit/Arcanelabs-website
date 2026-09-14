import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(
  new URL("../components/UnifiedVoxelDimensionScene.tsx", import.meta.url),
  "utf8",
);

test("dimension scene uses the approved cinematic ENTER THE FIELD phrase", () => {
  assert.match(source, /DIMENSION_PHRASES/);
  assert.match(source, /ENTER THE FIELD/);
  assert.match(source, /ARCANE \/\/ SIGNAL/);
  assert.doesNotMatch(source, /ENTER THE ARCANE FIELD/);
  assert.doesNotMatch(source, /PIXELS BECOME SPACE/);
  assert.doesNotMatch(source, /BUILD BEYOND THE FRAME/);
});

test("phrase moves through scene depth instead of being a full-screen DOM overlay", () => {
  assert.match(source, /<Text|<SafeText/);
  assert.match(source, /phraseDepth/);
  assert.match(source, /phraseOpacity/);
  assert.match(source, /phraseScale/);
  assert.doesNotMatch(source, /PortalPhrase/);
});

test("phrase reveal keeps a long premium hold between fade-in and fade-out", () => {
  assert.match(source, /phraseWindow/);
  assert.match(source, /fadeIn/);
  assert.match(source, /fadeOut/);
  assert.match(source, /phraseWindow - 0\.82/);
});

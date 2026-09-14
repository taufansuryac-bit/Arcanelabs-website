import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(
  new URL("../components/UnifiedVoxelDimensionScene.tsx", import.meta.url),
  "utf8",
);

test("dimension scene tells Arcane Labs story across three branded tunnel sessions", () => {
  assert.match(source, /DIMENSION_PHRASES/);
  assert.match(source, /WE BUILD WEBSITES/);
  assert.match(source, /ARCANE LABS \/\/ DIGITAL EXPERIENCES/);
  assert.match(source, /WE CRAFT APPS/);
  assert.match(source, /PRODUCTS \/\/ SYSTEMS \/\/ INTERFACES/);
  assert.match(source, /STEP INTO THE DIGITAL DIMENSION/);
  assert.match(source, /CODE \/\/ MOTION \/\/ INTERACTION/);
  assert.doesNotMatch(source, /text: "ENTER THE FIELD"/);
});

test("each phrase moves through scene depth and the camera gets three tunnel zoom pulses", () => {
  assert.match(source, /<Text|<SafeText/);
  assert.match(source, /phraseDepth/);
  assert.match(source, /phraseOpacity/);
  assert.match(source, /phraseScale/);
  assert.match(source, /sessionZoom/);
  assert.match(source, /sessionOneZoom/);
  assert.match(source, /sessionTwoZoom/);
  assert.match(source, /sessionThreeZoom/);
  assert.doesNotMatch(source, /PortalPhrase/);
});

test("final phase pulls back and fully reassembles the original voxel logo", () => {
  assert.match(source, /const reassemble = phase\(p, 0\.84, 0\.985\)/);
  assert.match(source, /THREE\.MathUtils\.lerp\(dimensionalX, voxel\.base\.x, reassemble\)/);
  assert.match(source, /THREE\.MathUtils\.lerp\(dimensionalY, voxel\.base\.y, reassemble\)/);
  assert.match(source, /THREE\.MathUtils\.lerp\(dimensionalZ, voxel\.base\.z, reassemble\)/);
  assert.match(source, /fit \* 0\.98/);
});

test("voxel material is graphite in light mode and silver in dark mode", () => {
  assert.match(source, /dark \? "#f4f4f5" : "#171a1f"/);
  assert.match(source, /dark \? "#9aa0ff" : "#000000"/);
  assert.match(source, /emissiveIntensity=\{dark \? 0\.08 : 0\}/);
});

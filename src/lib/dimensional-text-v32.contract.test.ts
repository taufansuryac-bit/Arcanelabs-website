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

test("final phase continues through the tunnel and dissolves into the footer handoff", () => {
  assert.match(source, /const exitDissolve = phase\(p, 0\.84, 1\)/);
  assert.match(source, /material\.opacity = 1 - exitDissolve/);
  assert.match(source, /travelDistance = travel \* 135 \+ exitDissolve \* 72/);
  assert.match(source, /cameraZ = tunnelZ - fit \* 0\.14 \* exitDissolve/);
  assert.doesNotMatch(source, /reassemble/);
});

test("voxel material is readable graphite in light mode and silver in dark mode", () => {
  assert.match(source, /dark \? "#f4f4f5" : "#2b3035"/);
  assert.match(source, /dark \? "#9aa0ff" : "#080a0c"/);
  assert.match(source, /emissiveIntensity=\{dark \? 0\.08 : 0\.02\}/);
  assert.match(source, /metalness=\{dark \? 0\.35 : 0\.18\}/);
  assert.match(source, /roughness=\{dark \? 0\.25 : 0\.42\}/);
});

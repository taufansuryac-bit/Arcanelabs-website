import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(
  new URL("../components/UnifiedVoxelDimensionScene.tsx", import.meta.url),
  "utf8",
);

test("portal field uses the approved premium ENTER THE FIELD composition", () => {
  assert.match(source, /ENTER THE FIELD/);
  assert.match(source, /ARCANE \/\/ SIGNAL/);
  assert.match(source, /ghostText/);
  assert.match(source, /#b7e36d/i);
  assert.match(source, /#171a1f/i);
  assert.match(source, /#f2f4f7/i);
  assert.doesNotMatch(source, /ENTER THE ARCANE FIELD/);
  assert.doesNotMatch(source, /PIXELS BECOME SPACE/);
  assert.doesNotMatch(source, /BUILD BEYOND THE FRAME/);
});

test("voxel field camera follows pointer with footer-like damped look parallax", () => {
  assert.match(source, /pointerPresence/);
  assert.match(source, /cameraLookX/);
  assert.match(source, /cameraLookY/);
  assert.match(source, /cameraRoll/);
  assert.match(source, /state\.pointer\.x \* 7\.2/);
  assert.match(source, /state\.pointer\.x \* 9\.2/);
  assert.match(source, /1 - pointerPresence\.current \* 0\.9/);
  assert.match(source, /eventSource=\{containerRef\.current!\}/);
  assert.match(source, /eventPrefix="client"/);
});

test("portal field gives the headline breathing room inside the voxel tunnel", () => {
  assert.match(source, /textPresence/);
  assert.match(source, /textClearance/);
  assert.match(source, /clearanceY/);
});

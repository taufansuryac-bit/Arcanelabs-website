import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(
  new URL("../components/UnifiedVoxelDimensionScene.tsx", import.meta.url),
  "utf8",
);

test("portal field keeps premium isolated typography across the three branded sessions", () => {
  assert.match(source, /WE BUILD WEBSITES/);
  assert.match(source, /WE CRAFT APPS/);
  assert.match(source, /STEP INTO THE DIGITAL DIMENSION/);
  assert.doesNotMatch(source, /ghostText/);
  assert.match(source, /renderOrder=\{20\}/);
  assert.match(source, /depthTest = false/);
  assert.match(source, /#b7e36d/i);
  assert.match(source, /#111418/i);
  assert.match(source, /#f2f4f7/i);
  assert.doesNotMatch(source, /text: "ENTER THE FIELD"/);
  assert.doesNotMatch(source, /ENTER THE ARCANE FIELD/);
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

test("portal field gives each headline a clear reading window inside the voxel tunnel", () => {
  assert.match(source, /particleTextWindow/);
  assert.match(source, /textClearance/);
  assert.match(source, /clearanceY/);
  assert.match(source, /readabilityScale/);
});

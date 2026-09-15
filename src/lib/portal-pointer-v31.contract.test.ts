import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(
  new URL("../components/UnifiedVoxelDimensionScene.tsx", import.meta.url),
  "utf8",
);

test("stable logo supports pointer-local gaussian fracture before entering the field", () => {
  assert.match(source, /Raycaster/);
  assert.match(source, /intersectPlane/);
  assert.match(source, /Math\.exp\(-\(distance \* distance\)/);
  assert.match(source, /localInfluence/);
  assert.match(source, /pointerFracture/);
});

test("logo uses damped pointer tilt while dimensional field uses camera parallax", () => {
  assert.match(source, /logoTiltX/);
  assert.match(source, /logoTiltY/);
  assert.match(source, /cameraParallaxX/);
  assert.match(source, /cameraParallaxY/);
  assert.match(source, /interactionBlend/);
});

test("pointer interaction fades through the dimensional exit instead of returning to a rebuilt logo", () => {
  assert.match(source, /stableInteraction/);
  assert.match(source, /fieldInteraction/);
  assert.match(source, /exitDissolve/);
  assert.doesNotMatch(source, /rebuiltInteraction/);
});

test("idle logo keeps a restrained coherent loose-orbit population without breaking silhouette", () => {
  assert.match(source, /orbitRadius/);
  assert.match(source, /columnRand < 0\.035/);
  assert.match(source, /columnOrbitRadius/);
  assert.match(source, /looseOrbit/);
});

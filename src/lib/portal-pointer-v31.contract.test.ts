import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(
  new URL("../components/UnifiedVoxelDimensionScene.tsx", import.meta.url),
  "utf8",
);

test("stable and rebuilt logo support pointer-local gaussian fracture", () => {
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

test("pointer interaction fades during fracture and returns after reassembly", () => {
  assert.match(source, /stableInteraction/);
  assert.match(source, /rebuiltInteraction/);
  assert.match(source, /fieldInteraction/);
});

test("idle logo has a visible loose-orbit population without destroying silhouette", () => {
  assert.match(source, /orbitRadius/);
  assert.match(source, /rand < 0\.0[6-9]/);
  assert.match(source, /looseOrbit/);
});

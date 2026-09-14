import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const scene = await readFile(
  new URL("../components/UnifiedVoxelDimensionScene.tsx", import.meta.url),
  "utf8",
);
const portal = await readFile(
  new URL("../components/MetaversePortalV2.tsx", import.meta.url),
  "utf8",
);
const footer = await readFile(
  new URL("../components/ArcaneFooterField.tsx", import.meta.url),
  "utf8",
);
const index = await readFile(new URL("../routes/index.tsx", import.meta.url), "utf8");

test("three tunnel phrases stay isolated and readable instead of stacking layered ghost copy", () => {
  assert.match(scene, /text: "WE BUILD WEBSITES"[\s\S]*start: 0\.18[\s\S]*end: 0\.34/);
  assert.match(scene, /text: "WE CRAFT APPS"[\s\S]*start: 0\.42[\s\S]*end: 0\.58/);
  assert.match(
    scene,
    /text: "STEP INTO THE DIGITAL DIMENSION"[\s\S]*start: 0\.66[\s\S]*end: 0\.82/,
  );
  assert.doesNotMatch(scene, /ghostText/);
  assert.match(scene, /renderOrder=\{20\}/);
  assert.match(scene, /depthTest = false/);
  assert.match(scene, /particleTextWindow/);
});

test("light mode keeps the logo black-graphite while preserving visible voxel separation", () => {
  assert.match(scene, /dark \? "#f4f4f5" : "#2b3035"/);
  assert.match(scene, /const themeScale = dark \? 1 : 0\.92/);
  assert.match(scene, /metalness=\{dark \? 0\.35 : 0\.18\}/);
  assert.match(scene, /roughness=\{dark \? 0\.25 : 0\.42\}/);
});

test("portal exits forward through the tunnel instead of rebuilding the logo", () => {
  assert.match(scene, /const exitDissolve = phase\(p, 0\.84, 1\)/);
  assert.match(scene, /material\.opacity = 1 - exitDissolve/);
  assert.match(scene, /travelDistance = travel \* 135 \+ exitDissolve \* 72/);
  assert.doesNotMatch(scene, /const reassemble =/);
  assert.doesNotMatch(scene, /rebuiltInteraction/);
});

test("portal and footer crossfade with a long overlap so the same floating-block language continues", () => {
  assert.match(portal, /useTransform/);
  assert.match(portal, /portalOpacity/);
  assert.match(portal, /\[0\.82, 0\.94, 1\]/);
  assert.match(portal, /-mb-\[12vh\]/);
  assert.match(portal, /md:-mb-\[16vh\]/);
  assert.match(index, /md:-mt-\[12vh\]/);
  assert.match(footer, /transparent_0%,black_18%,black_100%/);
});

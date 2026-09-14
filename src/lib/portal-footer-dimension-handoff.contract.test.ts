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
  assert.match(scene, /travelDistance = travel \* 135 \+ exitDissolve \* 82/);
  assert.match(scene, /const finalDrive = phase\(p, 0\.66, 1\)/);
  assert.doesNotMatch(scene, /const reassemble =/);
  assert.doesNotMatch(scene, /rebuiltInteraction/);
});

test("portal WebGL is pre-mounted after app ready instead of mounting at first viewport entry", () => {
  assert.match(scene, /if \(!appReady\) return undefined;/);
  assert.match(scene, /setTimeout\(\(\) => setHasMounted\(true\), 120\)/);
  assert.match(scene, /\}, \[appReady\]\);/);
  assert.doesNotMatch(scene, /if \(appReady && active\)/);
});

test("portal entry synchronizes dormant scene progress before the first visible frame", () => {
  assert.match(scene, /const activeRef = useRef\(false\)/);
  assert.match(scene, /if \(!activeRef\.current\) sceneProgress\.current = value/);
  assert.match(scene, /activeRef\.current = nextActive/);
  assert.match(scene, /sceneProgress\.current = currentProgress/);
});

test("portal disables scroll anchoring and lands slightly inside the footer before fading out", () => {
  assert.match(portal, /\[overflow-anchor:none\]/);
  assert.match(portal, /-mb-\[64vh\]/);
  assert.match(portal, /md:-mb-\[68vh\]/);
  assert.match(portal, /h-\[180vh\]/);
  assert.match(portal, /md:h-\[320vh\]/);
  assert.match(portal, /\[0\.9, 0\.965, 0\.995, 1\]/);
  assert.match(portal, /\[1, 0\.82, 0\.32, 0\]/);
  assert.match(index, /z-10 -mt-\[44vh\]/);
  assert.match(index, /md:-mt-\[40vh\]/);
  assert.match(footer, /rgba\(0,0,0,0\.45\)_0%,black_12%,black_100%/);
  assert.match(footer, /const RESIDUE_COUNT = 760/);
  assert.match(footer, /position=\{\[0, -3\.2, -62\]\}/);
});

test("footer WebGL is warmed before the overlap instead of appearing late during the handoff", () => {
  assert.match(footer, /if \(!appReady\) return undefined;/);
  assert.match(footer, /setTimeout\(\(\) => setHasMounted\(true\), 700\)/);
  assert.match(footer, /\}, \[appReady\]\);/);
  assert.doesNotMatch(footer, /if \(appReady && active\)/);
});

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function readSource(relativeUrl: string) {
  try {
    return await readFile(new URL(relativeUrl, import.meta.url), "utf8");
  } catch {
    return "";
  }
}

const portal = await readSource("../components/MetaversePortalV2.tsx");
const particleScene = await readSource("../components/ParticleDimensionScene.tsx");
const index = await readSource("../routes/index.tsx");

test("portal uses the cleaner GPU point-particle engine from the particle prototype", () => {
  assert.match(portal, /ParticleDimensionScene/);
  assert.doesNotMatch(portal, /UnifiedVoxelDimensionScene/);
  assert.match(particleScene, /THREE\.Points/);
  assert.match(particleScene, /THREE\.ShaderMaterial/);
  assert.match(particleScene, /curlNoise/);
  assert.match(particleScene, /uProgress/);
  assert.match(particleScene, /uMouse/);
  assert.match(particleScene, /progress\.on\("change"/);
});

test("three branded messages crossfade without opening and closing the particle tunnel", () => {
  assert.match(portal, /WE BUILD WEBSITES/);
  assert.match(portal, /WE CRAFT APPS/);
  assert.match(portal, /STEP INTO THE DIGITAL DIMENSION/);
  assert.match(portal, /phraseOneOpacity/);
  assert.match(portal, /phraseTwoOpacity/);
  assert.match(portal, /phraseThreeOpacity/);
  assert.match(portal, /useTransform/);
  assert.doesNotMatch(portal, /particleTextWindow/);
  assert.doesNotMatch(portal, /ghostText/);
});

test("final tunnel movement stays forward-only and dissolves directly into the footer", () => {
  assert.match(particleScene, /forwardTravel/);
  assert.match(particleScene, /exitProgress/);
  assert.doesNotMatch(particleScene, /pullBack/i);
  assert.doesNotMatch(particleScene, /reassemble/i);
  assert.match(portal, /portalOpacity/);
});

test("footer is already entering the viewport when the portal reaches its final frame", () => {
  assert.match(portal, /md:h-\[560vh\]/);
  assert.match(index, /-mt-\[100svh\]/);
  assert.match(index, /md:-mt-\[100vh\]/);
});

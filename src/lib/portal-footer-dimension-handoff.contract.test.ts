import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const scene = await readFile(
  new URL("../components/ParticleDimensionScene.tsx", import.meta.url),
  "utf8",
).catch(() => "");
const portal = await readFile(
  new URL("../components/MetaversePortalV2.tsx", import.meta.url),
  "utf8",
);
const footer = await readFile(
  new URL("../components/ArcaneFooterField.tsx", import.meta.url),
  "utf8",
);

test("three tunnel phrases crossfade independently without a particle aperture animation", () => {
  assert.match(portal, /WE BUILD WEBSITES/);
  assert.match(portal, /WE CRAFT APPS/);
  assert.match(portal, /STEP INTO THE DIGITAL DIMENSION/);
  assert.match(portal, /phraseOneOpacity/);
  assert.match(portal, /phraseTwoOpacity/);
  assert.match(portal, /phraseThreeOpacity/);
  assert.doesNotMatch(scene, /particleTextWindow/);
  assert.doesNotMatch(portal, /ghostText/);
});

test("point particles keep the clean shader lighting language in both themes", () => {
  assert.match(scene, /THREE\.ShaderMaterial/);
  assert.match(scene, /dark \? "#f4f4f5" : "#111418"/);
  assert.match(scene, /dark \? "#7f8992" : "#3d464e"/);
  assert.match(scene, /uLightColor/);
  assert.match(scene, /uShadowColor/);
});

test("portal exits only forward and dissolves into the footer", () => {
  assert.match(scene, /const exitProgress =/);
  assert.match(scene, /const forwardTravel =/);
  assert.doesNotMatch(scene, /pullBack/i);
  assert.doesNotMatch(scene, /reassemble/i);
  assert.match(portal, /portalOpacity/);
});

test("footer begins one viewport before portal layout ends so there is no blank scroll gap", () => {
  assert.match(portal, /md:h-\[560vh\]/);
  assert.match(portal, /-mb-\[100svh\]/);
  assert.match(portal, /md:-mb-\[100vh\]/);
  assert.match(footer, /transparent_0%,black_18%,black_100%/);
});

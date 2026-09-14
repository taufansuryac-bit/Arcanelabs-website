import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const homeSource = await readFile(new URL("../routes/index.tsx", import.meta.url), "utf8");
const portalSource = await readFile(
  new URL("../components/MetaversePortalV2.tsx", import.meta.url),
  "utf8",
);
const tunnelSource = await readFile(
  new URL("../components/UnifiedVoxelDimensionScene.tsx", import.meta.url),
  "utf8",
);

async function readComponent(name: string) {
  return readFile(new URL(`../components/${name}.tsx`, import.meta.url), "utf8");
}

test("homepage places the partner flip grid immediately after the hero and before works", () => {
  assert.match(homeSource, /PartnerFlipGrid/);
  const heroEnd = homeSource.indexOf("</section>", homeSource.indexOf('id="top"'));
  const partners = homeSource.indexOf("<PartnerFlipGrid");
  const works = homeSource.indexOf('id="works"');
  assert.ok(heroEnd >= 0 && partners > heroEnd && partners < works);
});

test("partner cards use 3d flips plus pixel particles and preserve reduced-motion support", async () => {
  const source = await readComponent("PartnerFlipGrid");
  assert.match(source, /rotateY/);
  assert.match(source, /perspective/);
  assert.match(source, /particle/i);
  assert.match(source, /prefersReducedMotion|useReducedMotion/);
  assert.match(source, /SAMSUNG/);
  assert.match(source, /EA × FC BAYERN|EA X FC BAYERN/);
  assert.match(source, /MCDONALD/i);
});

test("our vision sequence sits directly after From vision to screen and crossfades in a fixed frame", async () => {
  assert.match(homeSource, /VisionTextSequence/);
  const visionToScreen = homeSource.indexOf("From vision to screen");
  const sequence = homeSource.indexOf("<VisionTextSequence");
  const projects = homeSource.indexOf("<ProjectConverge");
  assert.ok(visionToScreen >= 0 && sequence > visionToScreen && sequence < projects);

  const source = await readComponent("VisionTextSequence");
  assert.match(source, /BUILT DIFFERENT/);
  assert.match(source, /CRAFT WITH PURPOSE/);
  assert.match(source, /CODE WITH INTENT/);
  assert.match(source, /CREATE THE UNCONVENTIONAL/);
  assert.match(source, /opacity/);
  assert.doesNotMatch(source, /height:\s*['"]auto['"]|layout/);
});

test("portal handoff is shorter and overlaps the footer without a dead-scroll tail", () => {
  assert.match(portalSource, /md:h-\[(?:4|5)\d{2}vh\]/);
  assert.doesNotMatch(portalSource, /md:h-\[700vh\]/);
  assert.match(portalSource, /-mb-\[(?:1\d|2\d)vh\]/);
});

test("final tunnel camera motion remains forward-only and pointer camera influence is restrained", () => {
  assert.match(tunnelSource, /finalDrive/);
  assert.doesNotMatch(
    tunnelSource,
    /sessionThreeZoom\s*=\s*phase\(p, 0\.66, 0\.71\) \* \(1 - phase\(p, 0\.79, 0\.83\)\)/,
  );
  assert.match(tunnelSource, /state\.pointer\.x \* [23]\.[0-9] \* fieldInteraction/);
  assert.match(tunnelSource, /state\.pointer\.y \* [12]\.[0-9] \* fieldInteraction/);
  assert.match(tunnelSource, /rollTarget = -state\.pointer\.x \* 0\.00[4-9] \* fieldInteraction/);
});

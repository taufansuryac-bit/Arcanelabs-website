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

test("partner cards continuously alternate faces without a section header or closing rule", async () => {
  const source = await readComponent("PartnerFlipGrid");
  assert.match(source, /rotateY/);
  assert.match(source, /perspective/);
  assert.match(source, /particle/i);
  assert.match(source, /Number\.POSITIVE_INFINITY/);
  assert.match(source, /backPartner/);
  assert.match(source, /bg-background/);
  assert.match(source, /prefersReducedMotion|useReducedMotion/);
  assert.doesNotMatch(source, /2011-/);
  assert.doesNotMatch(source, /\(Partners\)/);
  assert.doesNotMatch(source, /border-y/);
});

test("our vision sequence sits directly after From vision to screen and crossfades only with opacity", async () => {
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
  assert.match(source, /initial=\{prefersReducedMotion \? false : \{ opacity: 0 \}\}/);
  assert.match(source, /animate=\{\{ opacity: 1 \}\}/);
  assert.match(source, /exit=\{prefersReducedMotion \? \{\} : \{ opacity: 0 \}\}/);
  assert.doesNotMatch(source, /filter: "blur/);
  assert.doesNotMatch(source, /opacity: 0, y:/);
});

test("portal handoff stays animated until the end and reaches the footer with a shorter scroll tail", () => {
  assert.match(portalSource, /h-\[200vh\]/);
  assert.match(portalSource, /md:h-\[430vh\]/);
  assert.match(portalSource, /-mb-\[24vh\]/);
  assert.match(portalSource, /md:-mb-\[32vh\]/);
  assert.match(portalSource, /\[0\.9, 0\.99, 1\]/);
  assert.doesNotMatch(portalSource, /md:h-\[520vh\]/);
  assert.doesNotMatch(portalSource, /md:h-\[700vh\]/);
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

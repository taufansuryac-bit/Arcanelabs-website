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

async function readUiComponent(name: string) {
  return readFile(new URL(`../components/ui/${name}.tsx`, import.meta.url), "utf8");
}

test("homepage places the partner flip grid immediately after the hero and before works", () => {
  assert.match(homeSource, /PartnerFlipGrid/);
  const heroEnd = homeSource.indexOf("</section>", homeSource.indexOf('id="top"'));
  const partners = homeSource.indexOf("<PartnerFlipGrid");
  const works = homeSource.indexOf('id="works"');
  assert.ok(heroEnd >= 0 && partners > heroEnd && partners < works);
});

test("partner cards keep continuous alternating flips inside a visible near-background grid", async () => {
  const source = await readComponent("PartnerFlipGrid");
  assert.match(source, /rotateY/);
  assert.match(source, /perspective/);
  assert.match(source, /particle/i);
  assert.match(source, /Number\.POSITIVE_INFINITY/);
  assert.match(source, /backPartner/);
  assert.match(source, /gap-px/);
  assert.match(source, /border-foreground\/10/);
  assert.match(source, /bg-foreground\/\[0\.0[12]\]/);
  assert.match(source, /prefersReducedMotion|useReducedMotion/);
  assert.doesNotMatch(source, /2011-/);
  assert.doesNotMatch(source, /\(Partners\)/);
  assert.doesNotMatch(source, /-bottom-px h-\[2px\]/);
});

test("our vision uses Arcane developer capabilities and scroll-driven character morphing", async () => {
  assert.match(homeSource, /VisionTextSequence/);
  const problemToSystem = homeSource.indexOf("From problem to system");
  const sequence = homeSource.indexOf("<VisionTextSequence");
  const projects = homeSource.indexOf("<ProjectConverge");
  assert.ok(problemToSystem >= 0 && sequence > problemToSystem && sequence < projects);

  const source = await readComponent("VisionTextSequence");
  assert.match(source, /CUSTOM APPS/);
  assert.match(source, /WEB SYSTEMS/);
  assert.match(source, /FINANCE DATA/);
  assert.match(source, /PRODUCT DATA/);
  assert.match(source, /AI WORKFLOWS/);
  assert.match(source, /BUSINESS TOOLS/);
  assert.match(source, /morphStatement/);
  assert.match(source, /GLITCH_GLYPHS/);
  assert.match(source, /useMotionValueEvent/);
  assert.match(source, /KineticFabric/);
  assert.doesNotMatch(source, /AnimatePresence/);
  assert.doesNotMatch(source, /CREATE THE UNCONVENTIONAL/);
});

test("kinetic fabric background keeps the supplied mesh and pointer physics without demo chrome", async () => {
  const source = await readUiComponent("kinetic-particle-fabric");
  assert.match(source, /interface PhysicsNode/);
  assert.match(source, /interface StructuralConstraint/);
  assert.match(source, /buildMesh/);
  assert.match(source, /shockwaves/);
  assert.match(source, /requestAnimationFrame/);
  assert.match(source, /ResizeObserver/);
  assert.doesNotMatch(source, /PULSE/);
  assert.doesNotMatch(source, /FREEZE/);
});

test("portal handoff reaches a full footer viewport with no empty band", () => {
  assert.match(portalSource, /h-\[180vh\]/);
  assert.match(portalSource, /md:h-\[320vh\]/);
  assert.match(portalSource, /-mb-\[64vh\]/);
  assert.match(portalSource, /md:-mb-\[68vh\]/);
  assert.match(portalSource, /\[0\.9, 0\.965, 0\.995, 1\]/);
  assert.match(portalSource, /\[overflow-anchor:none\]/);
  assert.doesNotMatch(portalSource, /md:h-\[430vh\]/);
  assert.match(homeSource, /z-10 -mt-\[44vh\]/);
  assert.match(homeSource, /md:-mt-\[40vh\]/);
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

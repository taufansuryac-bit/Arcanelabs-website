import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { shouldAnimate } from "./animation-runtime.ts";

async function readSource(relativeUrl: string) {
  return readFile(new URL(relativeUrl, import.meta.url), "utf8");
}

test("animation runs only when page and element are visible", () => {
  assert.equal(shouldAnimate(true, true), true);
  assert.equal(shouldAnimate(false, true), false);
  assert.equal(shouldAnimate(true, false), false);
  assert.equal(shouldAnimate(false, false), false);
});

test("AsciiWordmark is gated by viewport and document visibility", async () => {
  const source = await readSource("../components/AsciiWordmark.tsx");
  assert.match(source, /observeElementVisibility/);
  assert.match(source, /observeDocumentVisibility/);
  assert.match(source, /shouldAnimate/);
  assert.match(source, /const start = \(\) =>/);
  assert.match(source, /const stop = \(\) =>/);
});

test("GridHoverBackground uses one lifecycle-gated canvas grid instead of a snake trail", async () => {
  const source = await readSource("../components/GridHoverBackground.tsx");
  const adapter = await readSource("../components/NoiseBackground.tsx");
  assert.match(source, /const CELL =/);
  assert.match(source, /const DECAY =/);
  assert.match(source, /requestAnimationFrame/);
  assert.match(source, /observeDocumentVisibility/);
  assert.match(source, /pointermove/);
  assert.match(source, /const next = current \* DECAY/);
  assert.match(source, /passive: true/);
  assert.match(adapter, /GridHoverBackground as NoiseBackground/);
  assert.doesNotMatch(source, /SEGMENTS/);
});

test("PixelReveal disposes its invisible overlay after the original transition finishes", async () => {
  const source = await readSource("../components/PixelReveal.tsx");
  assert.match(source, /const \[completed, setCompleted\] = useState\(false\)/);
  assert.match(source, /260ms steps\(2, end\)/);
  assert.match(source, /\* 520/);
  assert.match(source, /!completed &&/);
  assert.match(source, /setCompleted\(true\)/);
});

test("UI correctness fixes keep lifecycle and zero values intact", async () => {
  const menubar = await readSource("../components/ui/menubar.tsx");
  const carousel = await readSource("../components/ui/carousel.tsx");
  const chart = await readSource("../components/ui/chart.tsx");

  assert.match(menubar, /MenubarShortcut\.displayName = "MenubarShortcut"/);
  assert.doesNotMatch(menubar, /MenubarShortcut\.displayname/);
  assert.match(carousel, /api\?\.off\("reInit", onSelect\)/);
  assert.match(carousel, /api\?\.off\("select", onSelect\)/);
  assert.match(chart, /item\.value !== undefined && item\.value !== null/);
});

test("PixelLogo uses first-party Arcane assets instead of the Lovable asset gateway", async () => {
  const source = await readSource("../components/PixelLogo.tsx");
  assert.doesNotMatch(source, /__l5e\/assets-v1/);
  assert.doesNotMatch(source, /\.asset\.json/);
  assert.match(source, /\/arcane-logo-black\.svg/);
  assert.match(source, /\/arcane-logo-white\.svg/);
});

test("ArcaneLoader assembles the local mark on Canvas and has a safe exit", async () => {
  const source = await readSource("../components/ArcaneLoader.tsx");
  assert.match(source, /canvas/);
  assert.match(source, /sessionStorage/);
  assert.match(source, /arcane-logo-white\.svg/);
  assert.match(source, /arcane-logo-black\.svg/);
  assert.match(source, /onComplete/);
  assert.match(source, /requestAnimationFrame/);
});

test("SectionPixelReveal is one-shot and disposes its pixel veil", async () => {
  const source = await readSource("../components/SectionPixelReveal.tsx");
  assert.match(source, /IntersectionObserver/);
  assert.match(source, /setCompleted\(true\)/);
  assert.match(source, /observer\.disconnect\(\)/);
  assert.match(source, /!completed &&/);
});

test("InteractiveTicker contains the approved Arcane capability language", async () => {
  const source = await readSource("../components/InteractiveTicker.tsx");
  assert.match(source, /BRANDING/);
  assert.match(source, /UI\/UX/);
  assert.match(source, /WEB DEVELOPMENT/);
  assert.match(source, /MOTION/);
  assert.match(source, /CREATIVE TECHNOLOGY/);
  assert.match(source, /ticker-v2-track/);
});

test("IdentityConstellation supports four interactive capabilities", async () => {
  const source = await readSource("../components/IdentityConstellation.tsx");
  assert.match(source, /BRANDING/);
  assert.match(source, /UI\/UX/);
  assert.match(source, /WEB DEVELOPMENT/);
  assert.match(source, /MOTION \/ INTERACTION/);
  assert.match(source, /AnimatePresence/);
  assert.match(source, /onPointerEnter/);
  assert.match(source, /onFocus/);
  assert.match(source, /onClick/);
});

test("VoxelArcaneLogo uses local artwork and deterministic voxel sampling", async () => {
  const source = await readSource("../components/VoxelArcaneLogo.tsx");
  assert.match(source, /canvas/);
  assert.match(source, /progress/);
  assert.match(source, /arcane-logo-white\.svg/);
  assert.match(source, /arcane-logo-black\.svg/);
  assert.match(source, /seed/);
});

test("MetaversePortalV2 is a rectilinear voxel breach with lifecycle gating", async () => {
  const source = await readSource("../components/MetaversePortalV2.tsx");
  assert.match(source, /VoxelArcaneLogo/);
  assert.match(source, /observeElementVisibility/);
  assert.match(source, /observeDocumentVisibility/);
  assert.match(source, /nestedFrames/);
  assert.match(source, /DEBRIS/);
  assert.match(source, /h-\[680vh\]/);
  assert.doesNotMatch(source, /k < 14/);
});

test("index mounts the redesign v2 experience components", async () => {
  const source = await readSource("../routes/index.tsx");
  assert.match(source, /ArcaneLoader/);
  assert.match(source, /SectionPixelReveal/);
  assert.match(source, /InteractiveTicker/);
  assert.match(source, /IdentityConstellation/);
  assert.match(source, /MetaversePortalV2/);
  assert.doesNotMatch(source, /<MetaversePortal \/>/);
});

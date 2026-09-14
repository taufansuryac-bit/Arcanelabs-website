import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const indexSource = await readFile(new URL("../routes/index.tsx", import.meta.url), "utf8");
const identitySource = await readFile(
  new URL("../components/IdentityConstellation.tsx", import.meta.url),
  "utf8",
);
const carouselSource = await readFile(
  new URL("../components/EnchantedProjectCarousel.tsx", import.meta.url),
  "utf8",
);
const galaxySource = await readFile(
  new URL("../components/GalaxyHeroBackground.tsx", import.meta.url),
  "utf8",
);
const portalSource = await readFile(
  new URL("../components/MetaversePortalV2.tsx", import.meta.url),
  "utf8",
);

test("mobile header uses a compact menu while desktop navigation stays intact", () => {
  assert.match(indexSource, /Close navigation/);
  assert.match(indexSource, /Open navigation/);
  assert.match(indexSource, /aria-expanded=\{mobileMenuOpen\}/);
  assert.match(indexSource, /hidden items-center gap-9 md:flex/);
});

test("mobile hero and selected works use touch-first sizing and selection", () => {
  assert.match(indexSource, /h-\[28svh\][^\n]*md:h-\[46vh\]/);
  assert.match(indexSource, /onClick=\{\(\) => setActiveWork\(index\)\}/);
  assert.match(indexSource, /text-base uppercase[^\n]*md:text-3xl/);
});

test("identity preserves the floating constellation on mobile with responsive geometry", () => {
  assert.match(identitySource, /identity-constellation-cards/);
  assert.match(identitySource, /identity-card/);
  assert.match(identitySource, /@media \(max-width: 767px\)/);
  assert.doesNotMatch(identitySource, /active\.cards\.slice\(0, 2\)/);
  assert.doesNotMatch(identitySource, /overflow-x-auto[^\n]*md:hidden/);
});

test("project carousel keeps the 3D ring on mobile with compact touch geometry", () => {
  assert.match(carouselSource, /enchanted-ring-stage/);
  assert.match(carouselSource, /touch-pan-y/);
  assert.match(carouselSource, /@media \(max-width: 420px\)/);
  assert.match(carouselSource, /--carousel-radius: clamp\(188px, 54vw, 225px\)/);
  assert.match(carouselSource, /--carousel-card-w: clamp\(96px, 28vw, 118px\)/);
  assert.doesNotMatch(carouselSource, /snap-x snap-mandatory/);
  assert.doesNotMatch(carouselSource, /if \(isMobile\)/);
});

test("hero galaxy remains star-only so its black background blends into the next section", () => {
  assert.match(galaxySource, /const STAR_HUES = \[195, 205, 215, 225, 210\]/);
  assert.doesNotMatch(galaxySource, /NEBULA_LAYERS/);
  assert.doesNotMatch(galaxySource, /horizGrad/);
  assert.doesNotMatch(galaxySource, /Deep space base gradient/);
});

test("portal and footer use shorter mobile compositions while retaining desktop scenes", () => {
  assert.match(portalSource, /h-\[220vh\][^\n]*md:h-\[520vh\]/);
  assert.match(indexSource, /mobile-footer-shell/);
  assert.match(indexSource, /min-height:\s*900px/);
  assert.match(indexSource, /grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/);
});

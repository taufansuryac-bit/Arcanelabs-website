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

test("identity uses compact mobile tabs and limits the mobile visual payload", () => {
  assert.match(identitySource, /overflow-x-auto[^\n]*md:hidden/);
  assert.match(identitySource, /hidden[^\n]*md:flex/);
  assert.match(identitySource, /active\.cards\.slice\(0, 2\)/);
});

test("project carousel switches from the desktop 3D ring to mobile snap cards", () => {
  assert.match(carouselSource, /matchMedia\("\(max-width: 767px\)"\)/);
  assert.match(carouselSource, /snap-x snap-mandatory/);
  assert.match(carouselSource, /if \(isMobile\)/);
});

test("portal and footer use shorter mobile compositions while retaining desktop scenes", () => {
  assert.match(portalSource, /h-\[240vh\][^\n]*md:h-\[700vh\]/);
  assert.match(indexSource, /mobile-footer-shell/);
  assert.match(indexSource, /min-height:\s*900px/);
  assert.match(indexSource, /grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/);
});

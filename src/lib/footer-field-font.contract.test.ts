import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const footerSource = await readFile(
  new URL("../components/ArcaneFooterField.tsx", import.meta.url),
  "utf8",
);
const asciiSource = await readFile(
  new URL("../components/AsciiWordmark.tsx", import.meta.url),
  "utf8",
);
const portalSource = await readFile(
  new URL("../components/MetaversePortalV2.tsx", import.meta.url),
  "utf8",
);
const routeSource = await readFile(new URL("../routes/index.tsx", import.meta.url), "utf8");
const rootSource = await readFile(new URL("../routes/__root.tsx", import.meta.url), "utf8");
const themeSource = await readFile(
  new URL("../components/ThemeToggle.tsx", import.meta.url),
  "utf8",
);
const fontSource = await readFile(new URL("../pixel-fonts.css", import.meta.url), "utf8");

test("Arcane field owns the entire footer experience and no longer mounts from the portal", () => {
  const footerStart = routeSource.search(/<footer\s+id="contact"/);
  const fieldIndex = routeSource.indexOf("<ArcaneFooterField");
  const footerEnd = routeSource.indexOf("</footer>", fieldIndex);

  assert.ok(footerStart >= 0);
  assert.ok(fieldIndex > footerStart);
  assert.ok(footerEnd > fieldIndex);
  assert.doesNotMatch(portalSource, /ArcaneFooterField/);
  assert.doesNotMatch(routeSource.slice(footerStart, fieldIndex), /marquee-track|AsciiWordmark/);
});

test("dark mode is the versioned default while a new explicit user choice can persist", () => {
  assert.match(rootSource, /<html lang="en" className="dark"/);
  assert.match(rootSource, /al-theme-v2/);
  assert.match(rootSource, /\|\|'dark'/);
  assert.match(themeSource, /al-theme-v2/);
  assert.match(themeSource, /useState<Mode>\("dark"\)/);
});

test("navbar uses semantic theme colors instead of blend-mode inversion", () => {
  assert.doesNotMatch(routeSource, /mix-blend-difference/);
  assert.match(routeSource, /text-foreground/);
});

test("footer uses source-like GLSL hills with real 3D residue cubes", () => {
  assert.match(footerSource, /planeGeometry/i);
  assert.match(footerSource, /instancedMesh/i);
  assert.match(footerSource, /rotateMatrixX\(radians\(90\.0\)\)/);
  assert.match(footerSource, /state\.clock\.elapsedTime \* 0\.5/);
  assert.match(footerSource, /pow\(sin1, 2\.0\) \* 40\.0/);
  assert.doesNotMatch(footerSource, /terrainWave/);
  assert.doesNotMatch(footerSource, /\bbreathe\b/);
  assert.match(footerSource, /useFrame/);
  assert.match(footerSource, /state\.pointer/);
});

test("terrain keeps the reference neutral-gray transparent material", () => {
  assert.match(footerSource, /blending=\{THREE\.NormalBlending\}/);
  assert.match(footerSource, /vec3 color = vec3\(0\.6\)/);
  assert.match(footerSource, /float opacity = \(96\.0 - length\(vPosition\)\) \/ 256\.0 \* 0\.6/);
  assert.doesNotMatch(footerSource, /THREE\.AdditiveBlending/);
});

test("dark-mode residual cubes remain white-silver and light-mode cubes become graphite", () => {
  assert.match(footerSource, /dark \? "#ffffff" : "#17191a"/);
  assert.match(footerSource, /emissive=\{dark \? "#ffffff" : "#000000"\}/);
  assert.match(footerSource, /toneMapped=\{false\}/);
  assert.doesNotMatch(footerSource, /#7786ff/i);
  assert.doesNotMatch(footerSource, /#9aa0ff/i);
});

test("portal and footer overlap through a gradient fade without a hard separator", () => {
  assert.match(routeSource, /-mt-\[44vh\]/);
  assert.match(routeSource, /md:-mt-\[40vh\]/);
  assert.doesNotMatch(footerSource, /border-t border-border/);
  assert.match(footerSource, /data-footer-scene/);
  assert.match(footerSource, /rgba\(0,0,0,0\.45\)_0%,black_12%,black_100%/);
});

test("footer logo composition sits slightly lower than v5 without a blocking panel", () => {
  assert.match(footerSource, /bottom-\[12%\]/);
  assert.match(footerSource, /md:bottom-\[10%\]/);
  assert.match(footerSource, /h-\[35vh\]/);
  assert.match(footerSource, /md:h-\[45vh\]/);
  assert.doesNotMatch(footerSource, /bg-black\/50/);
});

test("footer navigation uses a conventional left-aligned multi-column footer layout", () => {
  assert.match(footerSource, /data-footer-nav/);
  assert.match(footerSource, /text-left/);
  assert.match(footerSource, /md:grid-cols-\[1\.4fr_1fr_1fr_1fr\]/);
  assert.match(footerSource, /hello@arcanelabs\.mov/);
  assert.match(footerSource, /PRIVACY \/ IMPRINT/);
});

test("small continuous creator ticker has a forty-percent black readability strip", () => {
  assert.match(footerSource, /data-footer-ticker/);
  assert.match(footerSource, /bg-black\/40/);
  assert.match(footerSource, /FOOTER_TICKER\.repeat\(2\)/);
  assert.match(footerSource, /THE BEGININNG OF DEVELOPER ERA/);
});

test("ASCII cursor chaos keeps the current default while footer keeps its local value", () => {
  assert.match(asciiSource, /chaosStrength = 1\.3/);
  assert.match(footerSource, /chaosStrength=\{1\.65\}/);
});

test("global pixel typography defines Pixellari and the mono UI token", () => {
  assert.match(fontSource, /font-family:\s*"Pixellari"/);
  assert.match(fontSource, /--font-mono-ui:\s*"Pixellari"/);
});
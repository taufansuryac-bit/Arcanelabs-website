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
const routeSource = await readFile(
  new URL("../routes/index.tsx", import.meta.url),
  "utf8",
);
const rootSource = await readFile(
  new URL("../routes/__root.tsx", import.meta.url),
  "utf8",
);
const themeSource = await readFile(
  new URL("../components/ThemeToggle.tsx", import.meta.url),
  "utf8",
);
const fontSource = await readFile(new URL("../pixel-fonts.css", import.meta.url), "utf8");

test("Arcane field owns the entire footer experience and no longer mounts from the portal", () => {
  const footerStart = routeSource.indexOf('<footer id="contact"');
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

test("footer uses the animated terrain and real 3D residue cubes strictly as the scene background", () => {
  assert.match(footerSource, /planeGeometry/i);
  assert.match(footerSource, /instancedMesh/i);
  assert.match(footerSource, /terrainWave/);
  assert.match(footerSource, /state\.clock\.elapsedTime \* 1\.45/);
  assert.match(footerSource, /0\.90\s*\+\s*0\.30\s*\*\s*sin\(uTime \* 0\.55\)/);
  assert.match(footerSource, /useFrame/);
  assert.match(footerSource, /state\.pointer/);
});

test("light mode terrain renders graphite with normal blending while dark mode remains additive", () => {
  assert.match(footerSource, /dark \? THREE\.AdditiveBlending : THREE\.NormalBlending/);
  assert.match(footerSource, /dark \? "#d7dddd" : "#2d3132"/);
  assert.match(footerSource, /dark \? "#ffffff" : "#070809"/);
});

test("dark-mode residual cubes remain white-silver and light-mode cubes become graphite", () => {
  assert.match(footerSource, /dark \? "#ffffff" : "#17191a"/);
  assert.match(footerSource, /emissive=\{dark \? "#ffffff" : "#000000"\}/);
  assert.match(footerSource, /toneMapped=\{false\}/);
  assert.doesNotMatch(footerSource, /#7786ff/i);
  assert.doesNotMatch(footerSource, /#9aa0ff/i);
});

test("portal and footer overlap through a gradient fade without a hard separator", () => {
  assert.match(routeSource, /-mt-\[12vh\]/);
  assert.doesNotMatch(footerSource, /border-t border-border/);
  assert.match(footerSource, /data-footer-scene/);
  assert.match(footerSource, /mask-image:linear-gradient/);
});

test("footer logo composition sits slightly lower than v5 without a blocking panel", () => {
  assert.match(footerSource, /data-footer-content/);
  assert.match(footerSource, /top-\[17%\]/);
  assert.match(footerSource, /md:top-\[16%\]/);
  assert.doesNotMatch(footerSource, /data-footer-frame/);
  assert.doesNotMatch(footerSource, /backdrop-blur-md/);
  assert.match(footerSource, /data-footer-logo/);
  assert.match(footerSource, /AsciiWordmark text="ARCANE LABS" cell=\{8\} chaosStrength=\{1\.65\}/);
});

test("footer navigation uses a conventional left-aligned multi-column footer layout", () => {
  assert.match(footerSource, /data-footer-nav/);
  assert.match(footerSource, /md:grid-cols-\[1\.4fr_1fr_1fr_1fr\]/);
  assert.match(footerSource, /text-left/);
  assert.doesNotMatch(footerSource, /md:grid-cols-6/);
  assert.match(footerSource, /CONTACT/);
  assert.match(footerSource, /hello@arcanelabs\.mov/);
  assert.match(footerSource, /INDEX/);
  assert.match(footerSource, /WORKS/);
  assert.match(footerSource, /STUDIO/);
  assert.match(footerSource, /FAQ/);
  assert.match(footerSource, /CREATED BY/);
  assert.match(footerSource, /LEGALS/);
  assert.match(footerSource, /drop-shadow/);
});

test("small continuous creator ticker has a forty-percent black readability strip", () => {
  assert.match(footerSource, /data-footer-ticker/);
  assert.match(footerSource, /marquee-track/);
  assert.match(
    footerSource,
    /\[c\] ARCANE LABS CREATED BY TAUFAN SURC 2026 — THE BEGININNG OF DEVELOPER ERA/,
  );
  assert.match(footerSource, /bottom-\[2%\]/);
  assert.match(footerSource, /bg-black\/40/);
  assert.doesNotMatch(footerSource, /Let&apos;s build something arcane/);
});

test("ASCII cursor chaos remains stronger by default while footer keeps its local value", () => {
  assert.match(asciiSource, /chaosStrength\s*=\s*1\.3/);
  assert.match(asciiSource, /const wob = chaos \* 3\.8/);
  assert.match(asciiSource, /\* chaos \* 2\.65/);
});

test("global pixel typography defines Pixellari and overrides the UI font token", () => {
  assert.match(fontSource, /@font-face/);
  assert.match(fontSource, /font-family:\s*["']Pixellari["']/i);
  assert.match(fontSource, /pixellari/i);
  assert.match(fontSource, /--font-mono-ui:\s*["']Pixellari["']/i);
});

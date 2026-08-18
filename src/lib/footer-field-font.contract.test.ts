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

test("footer uses the animated terrain and real 3D residue cubes strictly as the scene background", () => {
  assert.match(footerSource, /planeGeometry/i);
  assert.match(footerSource, /instancedMesh/i);
  assert.match(footerSource, /terrainWave/);
  assert.match(footerSource, /2\.75/);
  assert.match(footerSource, /2\.20/);
  assert.match(footerSource, /0\.98\s*\+\s*0\.18\s*\*\s*sin/);
  assert.match(footerSource, /useFrame/);
  assert.match(footerSource, /state\.pointer/);
});

test("dark-mode residual cubes remain white-silver and do not use blue material accents", () => {
  assert.match(footerSource, /dark \? "#ffffff" : "#17191a"/);
  assert.match(footerSource, /emissive=\{dark \? "#ffffff" : "#000000"\}/);
  assert.match(footerSource, /toneMapped=\{false\}/);
  assert.doesNotMatch(footerSource, /#7786ff/i);
  assert.doesNotMatch(footerSource, /#9aa0ff/i);
});

test("footer logo composition sits slightly lower than v5 without a blocking panel", () => {
  assert.match(footerSource, /data-footer-content/);
  assert.match(footerSource, /top-\[17%\]/);
  assert.match(footerSource, /md:top-\[16%\]/);
  assert.doesNotMatch(footerSource, /top-\[13%\]/);
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

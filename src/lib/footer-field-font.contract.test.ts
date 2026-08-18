import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const footerSource = await readFile(
  new URL("../components/ArcaneFooterField.tsx", import.meta.url),
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

test("Arcane field lives inside the footer and no longer mounts from the portal", () => {
  const footerStart = routeSource.indexOf('<footer id="contact"');
  const fieldIndex = routeSource.indexOf("<ArcaneFooterField");
  const footerEnd = routeSource.indexOf("</footer>", fieldIndex);

  assert.ok(footerStart >= 0);
  assert.ok(fieldIndex > footerStart);
  assert.ok(footerEnd > fieldIndex);
  assert.doesNotMatch(portalSource, /ArcaneFooterField/);
});

test("footer field uses animated wave terrain and real 3D residue cubes", () => {
  assert.match(footerSource, /planeGeometry/i);
  assert.match(footerSource, /instancedMesh/i);
  assert.match(footerSource, /terrainWave/);
  assert.match(footerSource, /2\.15/);
  assert.match(footerSource, /1\.75/);
  assert.match(footerSource, /useFrame/);
  assert.match(footerSource, /state\.pointer/);
});

test("residual cubes are white-silver rather than blue", () => {
  assert.match(footerSource, /#ffffff/i);
  assert.doesNotMatch(footerSource, /#7786ff/i);
  assert.doesNotMatch(footerSource, /#9aa0ff/i);
});

test("footer contact, index, creator and legal copy float inside the Arcane field", () => {
  assert.match(footerSource, /FloatingInfo/);
  assert.match(footerSource, /CONTACT/);
  assert.match(footerSource, /hello@arcanelabs\.mov/);
  assert.match(footerSource, /INDEX/);
  assert.match(footerSource, /CREATED BY/);
  assert.match(footerSource, /LEGALS/);
  assert.match(footerSource, /BACK TO TOP/);
  assert.match(footerSource, /repeat:\s*Infinity/);
});

test("global pixel typography defines Pixellari and overrides the UI font token", () => {
  assert.match(fontSource, /@font-face/);
  assert.match(fontSource, /font-family:\s*["']Pixellari["']/i);
  assert.match(fontSource, /pixellari/i);
  assert.match(fontSource, /--font-mono-ui:\s*["']Pixellari["']/i);
});

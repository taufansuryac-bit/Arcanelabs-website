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
const fontSource = await readFile(new URL("../pixel-fonts.css", import.meta.url), "utf8");

test("footer epilogue mounts ArcaneFooterField directly after the voxel journey", () => {
  assert.match(portalSource, /ArcaneFooterField/);
  assert.match(footerSource, /PlaneGeometry|planeGeometry/i);
  assert.match(footerSource, /InstancedMesh|instancedMesh/);
  assert.match(footerSource, /pointer/i);
});

test("footer field reuses Arcane voxel material language", () => {
  assert.match(footerSource, /#f4f4f5/i);
  assert.match(footerSource, /metalness/);
  assert.match(footerSource, /roughness/);
  assert.doesNotMatch(footerSource, /comet|trail|streak/i);
});

test("global pixel typography defines Pixellari and overrides the UI font token", () => {
  assert.match(fontSource, /@font-face/);
  assert.match(fontSource, /font-family:\s*["']Pixellari["']/i);
  assert.match(fontSource, /pixellari/i);
  assert.match(fontSource, /--font-mono-ui:\s*["']Pixellari["']/i);
});

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const footerSource = await readFile(
  new URL("../components/ArcaneFooterField.tsx", import.meta.url),
  "utf8",
);
const routeSource = await readFile(
  new URL("../routes/index.tsx", import.meta.url),
  "utf8",
);
const stylesSource = await readFile(new URL("../styles.css", import.meta.url), "utf8");

test("footer epilogue mounts ArcaneFooterField below the voxel journey", () => {
  assert.match(routeSource, /ArcaneFooterField/);
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

test("global pixel typography defines a self-hosted Pixellari family", () => {
  assert.match(stylesSource, /@font-face/);
  assert.match(stylesSource, /font-family:\s*["']Pixellari["']/i);
  assert.match(stylesSource, /pixellari/i);
  assert.match(stylesSource, /--font-mono-ui:\s*["']Pixellari["']/i);
});

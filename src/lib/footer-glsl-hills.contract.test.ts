import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const footerSource = await readFile(
  new URL("../components/ArcaneFooterField.tsx", import.meta.url),
  "utf8",
);

test("footer terrain ports the GLSL hills noise profile without the legacy wireframe floor", () => {
  assert.match(footerSource, /float cnoise\(vec3 P\)/);
  assert.match(footerSource, /noisePosition \* 0\.08/);
  assert.match(footerSource, /noisePosition \* 0\.06/);
  assert.match(footerSource, /noisePosition \* 0\.4/);
  assert.doesNotMatch(footerSource, /\bwireframe\b/);
});

test("footer keeps the floating residue cubes and existing scene composition", () => {
  assert.match(footerSource, /<Terrain dark=\{dark\} \/>/);
  assert.match(footerSource, /<ResidueVoxels dark=\{dark\} \/>/);
  assert.match(footerSource, /const RESIDUE_COUNT = 560/);
  assert.match(footerSource, /<CameraRig \/>/);
});

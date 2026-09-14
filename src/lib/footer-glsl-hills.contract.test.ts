import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const footerSource = await readFile(
  new URL("../components/ArcaneFooterField.tsx", import.meta.url),
  "utf8",
);

test("footer terrain follows the reference GLSL hills profile", () => {
  assert.match(footerSource, /float cnoise\(vec3 P\)/);
  assert.match(footerSource, /rotateMatrixX\(radians\(90\.0\)\)/);
  assert.match(
    footerSource,
    /vec3 noisePosition = updatePosition \+ vec3\(0\.0, 0\.0, uTime \* -30\.0\)/,
  );
  assert.match(footerSource, /noise1 \* sin1 \* 8\.0/);
  assert.match(footerSource, /noise2 \* sin1 \* 8\.0/);
  assert.match(footerSource, /noisePosition \* 0\.4/);
  assert.match(footerSource, /pow\(sin1, 2\.0\) \* 40\.0/);
  assert.match(footerSource, /elapsedTime \* 0\.5/);
  assert.match(footerSource, /<planeGeometry args=\{\[256, 256, 256, 256\]\} \/>/);
  assert.match(
    footerSource,
    /float opacity = \(96\.0 - length\(vPosition\)\) \/ 256\.0 \* 0\.6/,
  );
  assert.match(footerSource, /blending=\{THREE\.NormalBlending\}/);

  assert.doesNotMatch(footerSource, /\bwireframe\b/);
  assert.doesNotMatch(footerSource, /\bbreathe\b/);
  assert.doesNotMatch(footerSource, /h \* 0\.34/);
  assert.doesNotMatch(footerSource, /THREE\.AdditiveBlending/);
  assert.doesNotMatch(footerSource, /float crest =/);
});

test("footer keeps floating residue cubes and scene composition", () => {
  assert.match(footerSource, /<Terrain dark=\{dark\} \/>/);
  assert.match(footerSource, /<ResidueVoxels dark=\{dark\} \/>/);
  assert.match(footerSource, /const RESIDUE_COUNT = 560/);
  assert.match(footerSource, /<CameraRig \/>/);
});

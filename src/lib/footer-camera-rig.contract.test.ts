import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const footerSource = await readFile(
  new URL("../components/ArcaneFooterField.tsx", import.meta.url),
  "utf8",
);

test("footer camera follows pointer smoothly across the full footer surface", () => {
  assert.match(footerSource, /eventSource=\{containerRef\.current \?\? undefined\}/);
  assert.match(
    footerSource,
    /const pointerResponse = 1 - Math\.exp\(-Math\.min\(delta, 0\.05\) \* 7\.2\)/,
  );
  assert.match(footerSource, /const cameraTargetX = state\.pointer\.x \* 4\.6/);
  assert.match(footerSource, /const cameraTargetY = state\.pointer\.y \* 2\.8/);
  assert.match(
    footerSource,
    /const pointerMagnitude = Math\.min\(1, Math\.hypot\(state\.pointer\.x, state\.pointer\.y\)\)/,
  );
  assert.match(footerSource, /const idleWeight = 1 - pointerMagnitude/);
  assert.match(
    footerSource,
    /lookTarget\.set\([\s\S]*?cameraOffset\.current\.x \* 1\.55[\s\S]*?3\.8 \+ cameraOffset\.current\.y \* 1\.35/,
  );
  assert.match(footerSource, /roll\.current \+= \(rollTarget - roll\.current\) \* pointerResponse/);
  assert.doesNotMatch(footerSource, /8\.0 - smooth\.current\.y/);
  assert.doesNotMatch(footerSource, /3\.8 - smooth\.current\.y/);
});

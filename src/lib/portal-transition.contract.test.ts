import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { getPortalVisualState } from "./voxel-scene-model.ts";

async function readSource(relativeUrl: string) {
  return readFile(new URL(relativeUrl, import.meta.url), "utf8");
}

test("portal logo scale grows monotonically through the approach phase", () => {
  let previous = getPortalVisualState(0).scale;
  for (let step = 1; step <= 60; step += 1) {
    const progress = step / 100;
    const current = getPortalVisualState(progress).scale;
    assert.ok(
      current >= previous - 0.000001,
      `scale regressed at ${progress}: ${current} < ${previous}`,
    );
    previous = current;
  }
});

test("portal fracture overlaps the still-visible logo and particle field", async () => {
  const source = await readSource("./voxel-scene-model.ts");
  assert.match(source, /fractureIn = smoother\(\(p - 0\.42\) \/ 0\.28\)/);
  assert.match(source, /cameraPush = smoother\(\(p - 0\.58\) \/ 0\.24\)/);
});

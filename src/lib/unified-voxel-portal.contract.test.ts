import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function readSource(relativeUrl: string) {
  return readFile(new URL(relativeUrl, import.meta.url), "utf8");
}

test("portal mounts one unified voxel dimension scene instead of separate logo and canvas field", async () => {
  const portal = await readSource("../components/MetaversePortalV2.tsx");

  assert.match(portal, /UnifiedVoxelDimensionScene/);
  assert.doesNotMatch(portal, /SquareDepthField/);
  assert.doesNotMatch(portal, /VoxelChaosLogoScene/);
  assert.doesNotMatch(portal, /style=\{\{ opacity: logoOpacity, scale: logoScale \}\}/);
});

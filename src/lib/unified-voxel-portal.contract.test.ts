import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function readSource(relativeUrl: string) {
  return readFile(new URL(relativeUrl, import.meta.url), "utf8");
}

test("portal mounts the clean point-particle dimension scene", async () => {
  const portal = await readSource("../components/MetaversePortalV2.tsx");

  assert.match(portal, /ParticleDimensionScene/);
  assert.doesNotMatch(portal, /UnifiedVoxelDimensionScene/);
  assert.doesNotMatch(portal, /SquareDepthField/);
  assert.doesNotMatch(portal, /VoxelChaosLogoScene/);
});

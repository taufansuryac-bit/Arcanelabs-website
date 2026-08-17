import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function readSource(relativeUrl: string) {
  return readFile(new URL(relativeUrl, import.meta.url), "utf8");
}

test("voxel logo engine ports the voxel-chaos-logo density and depth model", async () => {
  const source = await readSource("../components/VoxelChaosLogoScene.tsx");
  assert.match(source, /const RES = 104/);
  assert.match(source, /const DEPTH = 7/);
  assert.match(source, /const GAP = 0\.54/);
  assert.match(source, /drawElementsInstanced/);
  assert.match(source, /for \(let z = 0; z < DEPTH; z\+\+\)/);
  assert.match(source, /exp\(-\(d \* d\)/);
});

test("portal uses square depth particles without comet trails", async () => {
  const source = await readSource("../components/MetaversePortalV2.tsx");
  assert.match(source, /SquareDepthField/);
  assert.match(source, /perspective/);
  assert.match(source, /particleSize/);
  assert.doesNotMatch(source, /shadowBlur/);
  assert.doesNotMatch(source, /stretch/);
});

test("project orbit inherits site background and uses 16:9 cards", async () => {
  const source = await readSource("../components/ProjectScrapbookOrbit.tsx");
  assert.match(source, /aspect-ratio:\s*16\s*\/\s*9/);
  assert.doesNotMatch(source, /#0a1937/);
  assert.match(source, /bg-background/);
  assert.match(source, /pixel/i);
});

test("loader uses voxel chaos scene instead of custom canvas pixel renderer", async () => {
  const source = await readSource("../components/ArcaneLoader.tsx");
  assert.match(source, /VoxelChaosLogoScene/);
  assert.doesNotMatch(source, /getContext\("2d"/);
});

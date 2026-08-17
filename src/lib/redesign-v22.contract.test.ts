import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function readSource(relativeUrl: string) {
  return readFile(new URL(relativeUrl, import.meta.url), "utf8");
}

test("voxel logo engine uses the voxel-chaos-logo R3F stack", async () => {
  const source = await readSource("../components/VoxelChaosLogoScene.tsx");
  assert.match(source, /@react-three\/fiber/);
  assert.match(source, /@react-three\/drei/);
  assert.match(source, /THREE\.InstancedMesh/);
  assert.match(source, /DEPTH = 7/);
  assert.match(source, /RES = 104/);
});

test("portal uses square depth particles without comet trails", async () => {
  const source = await readSource("../components/MetaversePortalV2.tsx");
  assert.match(source, /SquareDepthField/);
  assert.match(source, /perspective/);
  assert.doesNotMatch(source, /fillRect\([^\n]+stretch/);
  assert.doesNotMatch(source, /shadowBlur/);
});

test("project orbit inherits site background and uses 16:9 cards", async () => {
  const source = await readSource("../components/ProjectScrapbookOrbit.tsx");
  assert.match(source, /aspect-ratio:\s*16\s*\/\s*9/);
  assert.doesNotMatch(source, /#10264/);
  assert.match(source, /bg-background/);
});

test("loader uses voxel chaos scene instead of custom canvas pixel renderer", async () => {
  const source = await readSource("../components/ArcaneLoader.tsx");
  assert.match(source, /VoxelChaosLogoScene/);
  assert.doesNotMatch(source, /getContext\("2d"/);
});

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function readSource(relativeUrl: string) {
  return readFile(new URL(relativeUrl, import.meta.url), "utf8");
}

test("voxel logo engine ports the voxel-chaos-logo density and depth model", async () => {
  const source = await readSource("../components/VoxelChaosLogoScene.tsx");
  const model = await readSource("./voxel-scene-model.ts");
  assert.match(model, /VOXEL_RESOLUTION = 104/);
  assert.match(model, /VOXEL_DEPTH = 7/);
  assert.match(model, /VOXEL_GAP = 0\.54/);
  assert.match(source, /instancedMesh/);
  assert.match(source, /setMatrixAt/);
  assert.match(source, /for \(let z = 0; z < VOXEL_DEPTH; z \+= 1\)/);
});

test("voxel logo uses the source repo camera controls for genuine 360 degree inspection", async () => {
  const source = await readSource("../components/VoxelChaosLogoScene.tsx");
  assert.match(source, /@react-three\/fiber/);
  assert.match(source, /@react-three\/drei/);
  assert.match(source, /OrbitControls/);
  assert.match(source, /enableRotate/);
  assert.match(source, /enableZoom=\{interactive && mode === "loader"\}/);
  assert.match(source, /autoRotate/);
  assert.match(source, /minDistance/);
  assert.match(source, /maxDistance/);
});

test("voxel logo keeps cursor-local chaos in the loader while portal uses the unified scene", async () => {
  const scene = await readSource("../components/VoxelChaosLogoScene.tsx");
  const loader = await readSource("../components/ArcaneLoader.tsx");
  const portal = await readSource("../components/MetaversePortalV2.tsx");
  assert.match(scene, /onPointerEnter/);
  assert.match(scene, /onPointerLeave/);
  assert.match(scene, /Raycaster/);
  assert.match(scene, /intersectPlane/);
  assert.match(loader, /interactive/);
  assert.match(portal, /UnifiedVoxelDimensionScene/);
});

test("loader countdown waits until voxel geometry is ready", async () => {
  const source = await readSource("../components/VoxelChaosLogoScene.tsx");
  assert.match(source, /ready:\s*boolean/);
  assert.match(source, /if \(!ready\) return/);
  assert.match(source, /ready=\{Boolean\(voxels\)\}/);
});

test("voxel logo fits measured geometry responsively and uses the original standard material lighting", async () => {
  const source = await readSource("../components/VoxelChaosLogoScene.tsx");
  assert.match(source, /ResponsiveCamera/);
  assert.match(source, /measuredRadius/);
  assert.match(source, /meshStandardMaterial/);
  assert.match(source, /ambientLight/);
  assert.match(source, /directionalLight/);
});

test("portal morphs the same voxel instances through depth and back into the mark", async () => {
  const portal = await readSource("../components/MetaversePortalV2.tsx");
  const scene = await readSource("../components/UnifiedVoxelDimensionScene.tsx");
  assert.match(portal, /UnifiedVoxelDimensionScene/);
  assert.doesNotMatch(portal, /SquareDepthField/);
  assert.match(scene, /fieldAmount/);
  assert.match(scene, /reassemble/);
  assert.match(scene, /current\.setMatrixAt/);
  assert.match(scene, /camera\.lookAt\(origin\)/);
  assert.doesNotMatch(scene, /shadowBlur/);
  assert.doesNotMatch(scene, /fillRect/);
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

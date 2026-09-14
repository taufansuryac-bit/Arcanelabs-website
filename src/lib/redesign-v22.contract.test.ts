import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function readSource(relativeUrl: string) {
  return readFile(new URL(relativeUrl, import.meta.url), "utf8");
}

test("voxel logo engine ports the voxel-chaos-logo density and depth model", async () => {
  const source = await readSource("../components/VoxelChaosLogoScene.tsx");
  const model = await readSource("./voxel-scene-model.ts");
  assert.match(model, /VOXEL_RESOLUTION = 74/);
  assert.match(model, /VOXEL_DEPTH = 5/);
  assert.match(model, /VOXEL_GAP = 0\.76/);
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

test("loader keeps cursor-local chaos while portal uses the unified scene", async () => {
  const loaderScene = await readSource("../components/MagneticLoaderScene.tsx");
  const loader = await readSource("../components/ArcaneLoader.tsx");
  const portal = await readSource("../components/MetaversePortalV2.tsx");
  assert.match(loaderScene, /onPointerEnter/);
  assert.match(loaderScene, /onPointerLeave/);
  assert.match(loaderScene, /Raycaster/);
  assert.match(loaderScene, /intersectPlane/);
  assert.match(loader, /MagneticLoaderScene/);
  assert.match(portal, /UnifiedVoxelDimensionScene/);
});

test("loader countdown begins only after voxel geometry is ready", async () => {
  const source = await readSource("../components/MagneticLoaderScene.tsx");
  assert.match(source, /const data = useLogoVoxels/);
  assert.match(source, /\{data && \(/);
  assert.match(source, /<MagneticAssembly/);
  assert.match(source, /elapsedMs\.current \+=/);
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
  assert.match(scene, /camera\.lookAt\(/);
  assert.doesNotMatch(scene, /shadowBlur/);
  assert.doesNotMatch(scene, /fillRect/);
});

test("loader uses a real instanced WebGL magnetic scene instead of a custom canvas pixel renderer", async () => {
  const loader = await readSource("../components/ArcaneLoader.tsx");
  const scene = await readSource("../components/MagneticLoaderScene.tsx");
  assert.match(loader, /MagneticLoaderScene/);
  assert.match(scene, /instancedMesh/);
  assert.match(scene, /setMatrixAt/);
  assert.doesNotMatch(loader, /getContext\("2d"/);
});

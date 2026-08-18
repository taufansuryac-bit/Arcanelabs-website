import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function readSource(relativeUrl: string) {
  return readFile(new URL(relativeUrl, import.meta.url), "utf8");
}

test("voxel sampling matches the original square luminance-mask pipeline", async () => {
  const source = await readSource("../components/VoxelChaosLogoScene.tsx");
  assert.match(source, /canvas\.width = VOXEL_RESOLUTION/);
  assert.match(source, /canvas\.height = VOXEL_RESOLUTION/);
  assert.match(source, /0\.299/);
  assert.match(source, /0\.587/);
  assert.match(source, /0\.114/);
  assert.match(source, /const ink = alpha \* \(1 - luminance\)/);
  assert.match(source, /if \(ink < 0\.5\) continue/);
});

test("voxel geometry uses the original breathing gap and recenters actual occupied geometry", async () => {
  const model = await readSource("./voxel-scene-model.ts");
  const source = await readSource("../components/VoxelChaosLogoScene.tsx");
  assert.match(model, /VOXEL_SIZE = VOXEL_GAP \* 0\.9/);
  assert.match(source, /recenterVoxelGeometry/);
  assert.match(source, /boundsMin/);
  assert.match(source, /boundsMax/);
});

test("voxel material and lighting match the original silver premium look", async () => {
  const source = await readSource("../components/VoxelChaosLogoScene.tsx");
  assert.match(source, /meshStandardMaterial/);
  assert.match(source, /color="#f4f4f5"/);
  assert.match(source, /metalness=\{0\.35\}/);
  assert.match(source, /roughness=\{0\.25\}/);
  assert.match(source, /emissive="#9aa0ff"/);
  assert.match(source, /ambientLight intensity=\{0\.5\}/);
  assert.match(source, /directionalLight position=\{\[30, 40, 50\]\} intensity=\{2\.2\}/);
  assert.match(source, /directionalLight[\s\S]*color="#6b7cff"/);
  assert.doesNotMatch(source, /shaderMaterial/);
  assert.doesNotMatch(source, /0\.62, 0\.93, 0\.24/);
});

test("camera framing is based on measured voxel bounds rather than a hard-coded source aspect ratio", async () => {
  const source = await readSource("../components/VoxelChaosLogoScene.tsx");
  assert.match(source, /measuredWidth/);
  assert.match(source, /measuredHeight/);
  assert.match(source, /measuredRadius/);
  assert.doesNotMatch(source, /1153 \/ 1600/);
});

import assert from "node:assert/strict";
import test from "node:test";
import {
  LOGO_SCENE_HEIGHT,
  LOGO_SCENE_WIDTH,
  VOXEL_GAP,
  VOXEL_SIZE,
  getPortalVisualState,
  getResponsiveCameraDistance,
} from "./voxel-scene-model.ts";

test("responsive camera keeps the complete voxel logo inside wide and portrait viewports", () => {
  const fov = 40;
  const padding = 1.18;

  const viewports: Array<[number, number]> = [
    [1280, 720],
    [390, 844],
    [844, 390],
  ];

  for (const [width, height] of viewports) {
    const distance = getResponsiveCameraDistance(width, height, fov, padding);
    const verticalHalfView = Math.tan((fov * Math.PI) / 360) * distance;
    const horizontalHalfView = verticalHalfView * (width / height);

    assert.ok(verticalHalfView >= (LOGO_SCENE_HEIGHT * padding) / 2);
    assert.ok(horizontalHalfView >= (LOGO_SCENE_WIDTH * padding) / 2);
  }
});

test("settled voxels preserve the original breathing gap between cubes", () => {
  assert.equal(VOXEL_SIZE, VOXEL_GAP * 0.9);
  assert.ok(VOXEL_SIZE < VOXEL_GAP);
});

test("portal grows the intact logo before the fracture begins", () => {
  const start = getPortalVisualState(0);
  const small = getPortalVisualState(0.12);
  const larger = getPortalVisualState(0.24);
  const fracture = getPortalVisualState(0.58);

  assert.ok(start.scale < small.scale);
  assert.ok(small.scale < larger.scale);
  assert.equal(getPortalVisualState(0.18).chaos, 0);
  assert.ok(fracture.chaos > 0.15);
});

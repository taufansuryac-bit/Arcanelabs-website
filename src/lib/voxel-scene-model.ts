export const VOXEL_RESOLUTION = 74;
export const VOXEL_DEPTH = 5;
export const VOXEL_GAP = 0.76;
export const VOXEL_SIZE = VOXEL_GAP * 0.9;
export const LOGO_SCENE_WIDTH = VOXEL_RESOLUTION * VOXEL_GAP;
export const LOGO_SCENE_HEIGHT = VOXEL_RESOLUTION * VOXEL_GAP;

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

const smooth = (value: number) => {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
};

const smoother = (value: number) => {
  const t = clamp01(value);
  return t * t * t * (t * (t * 6 - 15) + 10);
};

export function getResponsiveCameraDistance(
  viewportWidth: number,
  viewportHeight: number,
  verticalFovDegrees = 40,
  padding = 1.18,
) {
  const safeWidth = Math.max(1, viewportWidth);
  const safeHeight = Math.max(1, viewportHeight);
  const halfVerticalFov = (verticalFovDegrees * Math.PI) / 360;
  const tangent = Math.tan(halfVerticalFov);
  const aspect = safeWidth / safeHeight;
  const verticalDistance = (LOGO_SCENE_HEIGHT * padding) / (2 * tangent);
  const horizontalDistance = (LOGO_SCENE_WIDTH * padding) / (2 * tangent * aspect);
  return Math.max(verticalDistance, horizontalDistance);
}

export function getPortalVisualState(progress: number) {
  const p = clamp01(progress);

  // One continuous approach curve: no scale reversals, no discrete-looking handoff.
  const approach = smoother(p / 0.58);
  const cameraPush = smoother((p - 0.58) / 0.24);
  const scale = 0.62 + approach * 0.62 + cameraPush * 0.18;

  // Fracture begins while the logo is still large and visible, then naturally
  // hands the same voxel matter into the dimensional field.
  const fractureIn = smoother((p - 0.42) / 0.28);
  const fractureOut = smoother((p - 0.86) / 0.12);

  return {
    scale,
    chaos: fractureIn * (1 - fractureOut) * 0.92,
  };
}

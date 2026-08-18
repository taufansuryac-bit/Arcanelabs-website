export const VOXEL_RESOLUTION = 104;
export const VOXEL_DEPTH = 7;
export const VOXEL_GAP = 0.54;
export const VOXEL_SIZE = VOXEL_GAP * 0.9;
export const LOGO_SCENE_WIDTH = VOXEL_RESOLUTION * VOXEL_GAP;
export const LOGO_SCENE_HEIGHT = VOXEL_RESOLUTION * VOXEL_GAP;
export const PORTAL_SCALE_INPUT = [0, 0.12, 0.24, 0.4, 0.76, 1];
export const PORTAL_SCALE_OUTPUT = [0.66, 0.76, 0.9, 1.02, 0.94, 0.76];

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

const smooth = (value: number) => {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
};

const interpolate = (value: number, input: number[], output: number[]) => {
  if (value <= input[0]!) return output[0]!;
  for (let index = 1; index < input.length; index += 1) {
    if (value <= input[index]!) {
      const from = input[index - 1]!;
      const to = input[index]!;
      const progress = (value - from) / (to - from);
      return output[index - 1]! + (output[index]! - output[index - 1]!) * progress;
    }
  }
  return output.at(-1)!;
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
  const fractureIn = smooth((p - 0.22) / 0.22);
  const fractureOut = smooth((p - 0.78) / 0.16);
  return {
    scale: interpolate(p, PORTAL_SCALE_INPUT, PORTAL_SCALE_OUTPUT),
    chaos: fractureIn * (1 - fractureOut) * 0.96,
  };
}
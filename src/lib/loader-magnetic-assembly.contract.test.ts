import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const sceneSource = await readFile(
  new URL("../components/MagneticLoaderScene.tsx", import.meta.url),
  "utf8",
);
const loaderSource = await readFile(
  new URL("../components/ArcaneLoader.tsx", import.meta.url),
  "utf8",
);

test("loader uses a magnetic snap phase and keeps a living final logo", () => {
  assert.match(sceneSource, /magneticPulse/);
  assert.match(sceneSource, /livingEnergy/);
  assert.match(sceneSource, /microOrbit/);
  assert.match(sceneSource, /impactEnergy/);
  assert.doesNotMatch(sceneSource, /OrbitControls/);
  assert.doesNotMatch(sceneSource, /autoRotate/);
});

test("loader remains pointer-interactive during the exit crossfade", () => {
  assert.doesNotMatch(loaderSource, /exiting \? "pointer-events-none opacity-0"/);
  assert.match(loaderSource, /exiting \? "opacity-0" : "opacity-100"/);
  assert.match(loaderSource, /<MagneticLoaderScene/);
});

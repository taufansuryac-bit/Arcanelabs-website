import assert from "node:assert/strict";
import test from "node:test";
import { shouldAnimate } from "./animation-runtime.ts";

test("animation runs only when page and element are visible", () => {
  assert.equal(shouldAnimate(true, true), true);
  assert.equal(shouldAnimate(false, true), false);
  assert.equal(shouldAnimate(true, false), false);
  assert.equal(shouldAnimate(false, false), false);
});

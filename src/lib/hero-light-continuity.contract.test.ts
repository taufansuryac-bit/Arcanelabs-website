import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const routeSource = await readFile(new URL("../routes/index.tsx", import.meta.url), "utf8");

test("light mode header and hero share the semantic site background without a dark color band", () => {
  assert.match(routeSource, /<header className="[^"]*bg-transparent[^"]*backdrop-blur-none/);
  assert.match(routeSource, /\[mask-image:radial-gradient\(/);
  assert.doesNotMatch(routeSource, /oklch\(0\.06 0 0 \/ 0\.65\)/);
  assert.match(routeSource, /leading-relaxed text-foreground\/70/);
  assert.match(routeSource, /text-right text-foreground\/70/);
  assert.match(routeSource, /leading-relaxed text-foreground\/60/);
  assert.match(routeSource, /shrink-0 text-foreground\/50/);
});

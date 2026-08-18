import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const routeSource = await readFile(new URL("../routes/index.tsx", import.meta.url), "utf8");
const carouselSource = await readFile(
  new URL("../components/ProjectScrapbookOrbit.tsx", import.meta.url),
  "utf8",
);

test("enchanted project carousel sits immediately after the projects section", () => {
  const worksSection = routeSource.indexOf('id="works"');
  const projectsSectionEnd = routeSource.indexOf("</SectionPixelReveal>", worksSection);
  const carousel = routeSource.indexOf("<ProjectScrapbookOrbit", projectsSectionEnd);
  const ticker = routeSource.indexOf("<InteractiveTicker", projectsSectionEnd);

  assert.ok(worksSection >= 0);
  assert.ok(projectsSectionEnd > worksSection);
  assert.ok(carousel > projectsSectionEnd);
  assert.ok(ticker > carousel);
});

test("project orbit is replaced by the enchanted circular carousel interaction", () => {
  assert.match(carouselSource, /perspective/i);
  assert.match(carouselSource, /transformStyle:\s*["']preserve-3d["']/);
  assert.match(carouselSource, /rotateY\(/);
  assert.match(carouselSource, /translateZ\(/);
  assert.match(carouselSource, /requestAnimationFrame/);
  assert.match(carouselSource, /onPointerDown/);
  assert.match(carouselSource, /onPointerMove/);
  assert.match(carouselSource, /setSelected/);
  assert.match(carouselSource, /pixel/i);
  assert.doesNotMatch(carouselSource, /Project Orbit/);
});

test("carousel remains project-focused and theme-native", () => {
  assert.match(carouselSource, /PROJECT 01/);
  assert.match(carouselSource, /PROJECT 08/);
  assert.match(carouselSource, /bg-background/);
  assert.match(carouselSource, /text-foreground/);
  assert.match(carouselSource, /border-border/);
  assert.match(carouselSource, /bg-neon/);
});

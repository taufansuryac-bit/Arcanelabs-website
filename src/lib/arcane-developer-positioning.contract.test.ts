import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const partnerSource = await readFile(
  new URL("../components/PartnerFlipGrid.tsx", import.meta.url),
  "utf8",
);
const tickerSource = await readFile(
  new URL("../components/InteractiveTicker.tsx", import.meta.url),
  "utf8",
);
const carouselSource = await readFile(
  new URL("../components/EnchantedProjectCarousel.tsx", import.meta.url),
  "utf8",
);
const indexSource = await readFile(new URL("../routes/index.tsx", import.meta.url), "utf8");
const rootSource = await readFile(new URL("../routes/__root.tsx", import.meta.url), "utf8");
const faqSource = await readFile(new URL("../components/PixelFaq.tsx", import.meta.url), "utf8");
const visionSource = await readFile(
  new URL("../components/VisionTextSequence.tsx", import.meta.url),
  "utf8",
);
const projectsSource = await readFile(
  new URL("../components/ProjectConverge.tsx", import.meta.url),
  "utf8",
);

test("Arcane Labs is positioned as a Bandung developer studio", () => {
  assert.match(indexSource, /Bandung\s*[—-]\s*Indonesia/);
  assert.match(indexSource, /developer studio/i);
  assert.match(indexSource, /finance analytics/i);
  assert.match(indexSource, /product analytics/i);
  assert.doesNotMatch(indexSource, /Film production|Berlin\s*[—-]\s*Worldwide/);
  assert.match(rootSource, /Developer Studio/);
  assert.match(rootSource, /Bandung, Indonesia/);
});

test("flip grid presents the technology stack instead of film partners", () => {
  for (const label of [
    "TYPESCRIPT",
    "PYTHON",
    "REACT",
    "TANSTACK",
    "NODE.JS",
    "POSTGRESQL",
    "TAILWIND CSS",
    "AI AUTOMATION",
  ]) {
    assert.match(partnerSource, new RegExp(label.replace(".", "\\.")));
  }
  assert.doesNotMatch(partnerSource, /SAMSUNG|FC BAYERN|McDONALD|NINA CHUBA/);
});

test("business capability ticker is placed immediately after the 3D carousel", () => {
  for (const label of [
    "APPLICATION DEVELOPMENT",
    "WEB DEVELOPMENT",
    "FINANCE ANALYTICS",
    "PRODUCT ANALYTICS",
    "AI AUTOMATION",
  ]) {
    assert.match(tickerSource, new RegExp(label));
  }

  const carouselPosition = indexSource.indexOf("<EnchantedProjectCarousel />");
  const tickerPosition = indexSource.indexOf("<InteractiveTicker />");
  assert.ok(carouselPosition >= 0 && tickerPosition > carouselPosition);
  assert.ok(tickerPosition - carouselPosition < 220);
});

test("3D carousel has exactly eight larger cards with depth blur away from focus", () => {
  assert.match(carouselSource, /id:\s*7/);
  assert.doesNotMatch(carouselSource, /id:\s*(?:8|9|10|11)/);
  assert.match(carouselSource, /--carousel-card-w:\s*clamp\(460px,/);
  assert.match(carouselSource, /--carousel-card-h:\s*clamp\(288px,/);
  assert.match(carouselSource, /normalizeAngle/);
  assert.match(carouselSource, /filter:\s*`blur\(/);
  assert.match(carouselSource, /focusDepth/);
});

test("remaining showcase copy describes software, analytics and automation work", () => {
  assert.match(visionSource, /CUSTOM APPS/);
  assert.match(visionSource, /FINANCE DATA/);
  assert.match(projectsSource, /Finance Analytics/);
  assert.match(projectsSource, /Product Analytics/);
  assert.match(faqSource, /applications, websites/i);
  assert.doesNotMatch(faqSource, /Commercials, brand films|produce out of Berlin/);
});

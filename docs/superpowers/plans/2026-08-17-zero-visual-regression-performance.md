# Zero Visual Regression Performance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce unnecessary CPU/GPU/runtime work across Arcane Labs motion systems while preserving the exact visible design, choreography, timings, density, particle/star counts, copy, and layout for normal users.

**Architecture:** Add a small shared animation-runtime layer that exposes page visibility and viewport activity without storing high-frequency pointer/animation data in React state. Each expensive canvas/RAF component will keep its existing drawing logic but start/stop its loop at lifecycle boundaries. DOM-heavy reveal overlays will self-dispose after completion. No visual constants are reduced.

**Tech Stack:** React 19, TypeScript, TanStack Start, Motion 13, Canvas 2D, Node built-in test runner, ESLint, Vite.

## Global Constraints

- ZERO VISUAL REGRESSION MODE: do not change layout, copy, colors, particle/star counts, effect intensity, visible timing, choreography, or visual identity for normal users.
- Do not merge to `main` without explicit user approval.
- Do not add a new runtime dependency.
- Preserve the existing 460-star portal field and 14 tunnel rings.
- Preserve the current NoiseBackground CELL=14, snake segment count=16, heat decay=0.87, and grain cadence=50ms while visible.
- Pause expensive work only when it cannot contribute a visible frame: document hidden, component outside viewport, or reveal overlay already completed.
- `prefers-reduced-motion` support may reduce motion only for users who explicitly enable that OS/browser preference; normal users remain unchanged.

---

### Task 1: Shared animation lifecycle primitives

**Files:**
- Create: `src/lib/animation-runtime.ts`
- Create: `src/lib/animation-runtime.test.ts`

**Interfaces:**
- Produces: `shouldAnimate(pageVisible: boolean, inViewport: boolean): boolean`
- Produces: `isDocumentVisible(): boolean`
- Produces: `observeElementVisibility(element: Element, onChange: (visible: boolean) => void, options?: IntersectionObserverInit): () => void`
- Produces: `observeDocumentVisibility(onChange: (visible: boolean) => void): () => void`

- [ ] **Step 1: Write the failing test**

```ts
import assert from "node:assert/strict";
import test from "node:test";
import { shouldAnimate } from "./animation-runtime.ts";

test("animation runs only when page and element are visible", () => {
  assert.equal(shouldAnimate(true, true), true);
  assert.equal(shouldAnimate(false, true), false);
  assert.equal(shouldAnimate(true, false), false);
  assert.equal(shouldAnimate(false, false), false);
});
```

- [ ] **Step 2: Run RED**

Run: `node --test src/lib/animation-runtime.test.ts`
Expected: FAIL because `animation-runtime.ts` does not exist yet.

- [ ] **Step 3: Implement the minimal runtime helpers**

`shouldAnimate` is pure. `observeElementVisibility` uses `IntersectionObserver`, emits the initial/intersection state, and returns `disconnect`. `observeDocumentVisibility` subscribes to `visibilitychange` and returns cleanup. No RAF is created here.

- [ ] **Step 4: Run GREEN**

Run: `node --test src/lib/animation-runtime.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

Commit: `perf: add shared animation lifecycle runtime`

### Task 2: Pause `AsciiWordmark` without changing rendering

**Files:**
- Modify: `src/components/AsciiWordmark.tsx`
- Test: `src/lib/animation-runtime.test.ts`

**Interfaces:**
- Consumes: `observeElementVisibility`, `observeDocumentVisibility`, `shouldAnimate`.

- [ ] **Step 1: Add a source contract test**

Add a Node test that reads `AsciiWordmark.tsx` and asserts it imports `observeElementVisibility` and `observeDocumentVisibility` and contains exactly one `requestAnimationFrame(draw)` scheduling site inside the lifecycle-controlled start function.

- [ ] **Step 2: Run RED**

Expected: FAIL because the component currently starts RAF unconditionally.

- [ ] **Step 3: Implement lifecycle start/stop**

Keep `build`, `sample`, `draw`, glyph ramp, shimmer, chaos math, fonts, radius, and all constants unchanged. Introduce `pageVisible` and `inViewport` booleans local to the effect, a `running` flag, `start()` and `stop()` functions, and observers. `start()` schedules only when `shouldAnimate(pageVisible, inViewport)` is true; `stop()` cancels the outstanding RAF. Resume from the current canvas/data state without resetting the visual.

- [ ] **Step 4: Run GREEN**

Run the contract test and project build.

- [ ] **Step 5: Commit**

Commit: `perf: pause ascii wordmarks offscreen`

### Task 3: Optimize `NoiseBackground` execution only

**Files:**
- Modify: `src/components/NoiseBackground.tsx`
- Test: `src/lib/animation-runtime.test.ts`

**Interfaces:**
- Consumes shared document visibility runtime.

- [ ] **Step 1: Add tests for hidden-page behavior contracts**

Assert the source subscribes to document visibility for both grain and neon effects and does not alter `CELL = 14`, `SEGMENTS = 16`, `heat[i] = v * 0.87`, or the `50` ms visible grain cadence.

- [ ] **Step 2: Run RED**

Expected: FAIL because both loops currently run while the document is hidden.

- [ ] **Step 3: Implement pause/resume**

The backdrop is fixed and always in viewport while the page is shown, so only page visibility is needed. Keep every visible rendering formula unchanged. Stop both RAF loops on `document.hidden`, restart once on visible, and prevent duplicate RAF chains. Allocate the grain `ImageData` buffer during resize and reuse the same buffer on each visible 50ms update instead of allocating a fresh `ImageData` every frame; continue filling it with the exact same random/alpha formula before `putImageData`.

- [ ] **Step 4: Run GREEN**

Run tests/build; visually the visible noise/neon output must be unchanged.

- [ ] **Step 5: Commit**

Commit: `perf: pause and reuse background canvas buffers`

### Task 4: Pause `MetaversePortal` when it cannot be seen

**Files:**
- Modify: `src/components/MetaversePortal.tsx`
- Test: `src/lib/animation-runtime.test.ts`

**Interfaces:**
- Consumes shared viewport/page visibility helpers.

- [ ] **Step 1: Add portal invariants test**

Read `MetaversePortal.tsx` and assert `const N = 460`, `k < 14`, the existing `PHRASES` strings, and `h-[640vh]` remain present. Also assert viewport/page observers are imported.

- [ ] **Step 2: Run RED**

Expected: FAIL on missing lifecycle observers.

- [ ] **Step 3: Implement start/stop around `PixelWarp` RAF**

Observe the canvas (or sticky portal container) with a small root margin so rendering starts just before entry. Preserve all star seeds, ring math, travel, flashes, scanline, shake, scroll transforms, spring values, and portal dimensions exactly. Stop RAF on offscreen/hidden; resume without rebuilding stars unless resize/re-mount requires it.

- [ ] **Step 4: Run GREEN**

Run tests/build.

- [ ] **Step 5: Commit**

Commit: `perf: pause portal rendering offscreen`

### Task 5: Dispose completed `PixelReveal` overlays

**Files:**
- Modify: `src/components/PixelReveal.tsx`
- Test: `src/lib/animation-runtime.test.ts`

**Interfaces:**
- Produces no new public API.

- [ ] **Step 1: Add a source contract test**

Assert `PixelReveal` contains a completion state and returns no pixel overlay after the reveal has completed while preserving its current reveal timing constants/classes.

- [ ] **Step 2: Run RED**

Expected: FAIL because the overlay remains mounted.

- [ ] **Step 3: Implement one-way completion disposal**

Keep current grid dimensions, animation delays, colors and reveal choreography. Set `completed=true` only from the final animation completion path, then omit only the already-invisible pixel overlay; keep children/layout mounted unchanged.

- [ ] **Step 4: Run GREEN**

Run tests/build.

- [ ] **Step 5: Commit**

Commit: `perf: dispose completed pixel reveal overlays`

### Task 6: Small correctness fixes with zero visible change

**Files:**
- Modify: `src/components/ui/menubar.tsx`
- Modify: `src/components/ui/carousel.tsx`
- Modify: `src/components/ui/chart.tsx`
- Modify: `src/components/ui/sidebar.tsx`
- Test: `src/lib/animation-runtime.test.ts`

- [ ] **Step 1: Add regression contracts**

Assert `MenubarShortcut.displayName` is correctly cased; carousel cleanup unsubscribes all subscribed Embla events; chart accepts numeric zero; sidebar skeleton width is deterministic per mounted instance without server/client `Math.random()` render divergence.

- [ ] **Step 2: Run RED**

Expected: FAIL against current source.

- [ ] **Step 3: Apply minimal fixes only**

Do not restyle any component. Fix property casing, symmetrical event cleanup, `item.value !== undefined && item.value !== null` handling, and deterministic skeleton width derived from `React.useId()` rather than render-time randomness.

- [ ] **Step 4: Run GREEN**

Run tests/typecheck/lint/build.

- [ ] **Step 5: Commit**

Commit: `fix: harden ui runtime correctness`

### Task 7: Add verification gates

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Add scripts**

Add:

```json
"typecheck": "tsc --noEmit",
"test": "node --test src/lib/animation-runtime.test.ts",
"verify": "npm run test && npm run typecheck && npm run lint && npm run build"
```

Do not change dependency versions.

- [ ] **Step 2: Run full verification**

Run: `npm run verify`
Expected: PASS with zero test/typecheck/lint/build errors.

- [ ] **Step 3: Commit**

Commit: `chore: add full verification gate`

### Task 8: Final diff and visual-regression review

**Files:** none unless verification exposes a bug.

- [ ] **Step 1:** Compare `main...perf/zero-visual-regression` and confirm no copy/layout/color/motion constants changed except lifecycle-related code and the explicitly listed correctness fixes.
- [ ] **Step 2:** Confirm branch deployment/build status is successful.
- [ ] **Step 3:** Report exact changed files, runtime behavior before/after, and any verification limitation. Do not merge.

# Arcane Labs Redesign V2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the approved Arcane Labs loader, grid-hover background, section reveals, interactive identity constellation, local logo pipeline, ticker, and dimensional portal V2 without touching `main`.

**Architecture:** Keep the existing TanStack/React/Motion stack and the shared animation lifecycle utilities. Use Canvas for dense pixel/portal effects and React/Motion for layout-level choreography. Avoid new heavy dependencies so the existing lockfile remains valid.

**Tech Stack:** React 19, TanStack Start, Motion, Canvas 2D, TypeScript, Tailwind CSS 4.

## Global Constraints
- Work only on `feature/arcane-redesign-v2`.
- `main` remains untouched.
- Dark/light theme parity is required.
- Pixel effects must remain modern/dimensional, not retro 8-bit.
- Expensive animation stops on hidden tabs and offscreen where applicable.
- No DOM particle clouds.
- DPR cap 2.
- Final gate: test + typecheck + lint + build.

---

### Task 1: First-party logo assets and runtime component

**Files:**
- Create binary assets: `public/arcane-logo-black.png`, `public/arcane-logo-white.png`
- Modify: `src/components/PixelLogo.tsx`
- Test: `src/lib/animation-runtime.test.ts`

**Produces:** A local logo component that never depends on `/__l5e/`.

- [ ] Add a source contract test that rejects `/__l5e/` in `PixelLogo.tsx` and requires `/arcane-logo-black.png` and `/arcane-logo-white.png`.
- [ ] Run test and verify RED.
- [ ] Upload optimized local logo assets.
- [ ] Replace `PixelLogo` sources with `/arcane-logo-black.png` and `/arcane-logo-white.png`.
- [ ] Run test and verify GREEN.
- [ ] Create checkpoint `checkpoint/redesign-v2-logo`.

### Task 2: Grid Hover Background V2

**Files:**
- Create: `src/components/GridHoverBackground.tsx`
- Modify: `src/routes/index.tsx`
- Test: `src/lib/animation-runtime.test.ts`

**Produces:** `GridHoverBackground` with persistent grain/vignette and hover-decay pixel cells.

- [ ] Add source contract test requiring Canvas, `requestAnimationFrame`, page visibility gate, `CELL`, heat decay, and passive pointer handling.
- [ ] Run RED.
- [ ] Implement canvas grid field with cursor-proximity excitation, decay, theme-aware acid green and subtle idle cells.
- [ ] Replace `NoiseBackground` mount in index only; preserve existing component file for rollback.
- [ ] Run GREEN.
- [ ] Create checkpoint `checkpoint/redesign-v2-grid`.

### Task 3: Arcane Loader

**Files:**
- Create: `src/components/ArcaneLoader.tsx`
- Modify: `src/routes/index.tsx`
- Modify: `src/styles.css`
- Test: `src/lib/animation-runtime.test.ts`

**Produces:** One-time loader that samples the local logo alpha and assembles/disperses pixel fragments.

- [ ] Add RED contract for loader component, local logo source, session guard, Canvas, and exit callback.
- [ ] Implement loader with `sessionStorage` guard and max-duration fail-safe.
- [ ] Mount loader above page content and unlock page after exit.
- [ ] Add minimal loader CSS utilities.
- [ ] Run GREEN.
- [ ] Create checkpoint `checkpoint/redesign-v2-loader`.

### Task 4: Reusable Section Pixel Entrance

**Files:**
- Create: `src/components/SectionPixelReveal.tsx`
- Modify: `src/routes/index.tsx`
- Test: `src/lib/animation-runtime.test.ts`

**Produces:** One-shot section entrance wrapper using IntersectionObserver, blur/translate content resolve and disposable pixel veil.

- [ ] Add RED contract for IntersectionObserver, one-shot disconnect, completed disposal and reduced DOM after completion.
- [ ] Implement wrapper.
- [ ] Wrap major sections without changing their internal layout.
- [ ] Run GREEN.

### Task 5: Interactive Ticker

**Files:**
- Create: `src/components/InteractiveTicker.tsx`
- Modify: `src/routes/index.tsx`
- Modify: `src/styles.css`
- Test: `src/lib/animation-runtime.test.ts`

**Produces:** Capability ticker placed before Our Identity.

- [ ] Add RED contract for duplicated ticker track, pause-on-hover/focus and reduced-motion-safe CSS.
- [ ] Implement ticker with `BRANDING × UI/UX × WEB DEVELOPMENT × MOTION × CREATIVE TECHNOLOGY ×`.
- [ ] Mount between current works/projects flow and identity.
- [ ] Run GREEN.

### Task 6: Our Identity V2

**Files:**
- Create: `src/components/IdentityConstellation.tsx`
- Modify: `src/routes/index.tsx`
- Modify: `src/styles.css`
- Test: `src/lib/animation-runtime.test.ts`

**Produces:** Center capability stack and deterministic floating project constellation.

- [ ] Add RED contract for the four capability labels, hover/focus selection, Motion presence transition and mobile tap behavior.
- [ ] Implement deterministic capability data and card positions.
- [ ] Implement outgoing blur/pixel/translate and incoming resolve animation.
- [ ] Replace old `CAMERA OR CODE?` identity block.
- [ ] Run GREEN.
- [ ] Create checkpoint `checkpoint/redesign-v2-identity`.

### Task 7: Voxel Arcane Logo

**Files:**
- Create: `src/components/VoxelArcaneLogo.tsx`
- Test: `src/lib/animation-runtime.test.ts`

**Produces:** Canvas/CSS pseudo-3D Arcane mark with voxel breakup parameter controlled by scroll progress.

- [ ] Add RED contract requiring local logo source, Canvas, deterministic seeded voxels and progress input.
- [ ] Implement local logo alpha sampling and pseudo-3D square extrusion/shading.
- [ ] Run GREEN.

### Task 8: Metaverse Portal V2

**Files:**
- Create: `src/components/MetaversePortalV2.tsx`
- Modify: `src/routes/index.tsx`
- Test: `src/lib/animation-runtime.test.ts`

**Produces:** Rectilinear pixel-dimensional transition replacing old radial tunnel.

- [ ] Add RED contract requiring no old `for (let k = 0; k < 14; k++)` tunnel-ring implementation, one Canvas, seeded debris, nested rectangular depth frames, visibility gating and Arcane gateway logo.
- [ ] Implement scroll-driven approach → gateway → fracture → breach → corridor → collapse → exit sequence.
- [ ] Preserve long-scroll sticky section behavior and theme-aware rendering.
- [ ] Replace `MetaversePortal` mount with `MetaversePortalV2`.
- [ ] Run GREEN.
- [ ] Create checkpoint `checkpoint/redesign-v2-portal`.

### Task 9: Full verification

**Files:**
- Modify tests only if assertions need formatting updates; no behavior weakening.

- [ ] Run `npm run test`.
- [ ] Run `npm run typecheck`.
- [ ] Run `npm run lint`.
- [ ] Run `npm run build`.
- [ ] Inspect branch diff against checkpoint for unintended copy/layout changes.
- [ ] Do not merge; provide preview/review branch only.
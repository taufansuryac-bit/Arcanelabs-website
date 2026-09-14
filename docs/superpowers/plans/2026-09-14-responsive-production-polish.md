# Responsive Production Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Harden Arcane Labs responsive behavior and animation lifecycle without changing the approved desktop visual language or replacing signature mobile compositions.

**Architecture:** Preserve the existing component structure and design. Add lifecycle guards to expensive DOM animation loops, make scroll-based motion respect reduced-motion, tighten narrow-mobile geometry only where clipping risk exists, and correct small visual-order/accessibility issues. No new dependencies.

**Tech Stack:** React 19, TypeScript, Motion, TanStack Start, Tailwind CSS, existing animation-runtime helpers.

**Spec:** `docs/superpowers/specs/2026-08-17-arcane-redesign-v2-design.md`

## Global Constraints

- Keep the floating Identity constellation on mobile.
- Keep the true 3D ring carousel on mobile.
- Preserve desktop `md+` geometry unless a bug requires otherwise.
- No new dependency.
- Expensive animation must pause offscreen, on hidden tabs, and for reduced motion.
- `npm run verify` must pass before merge.

---

### Task 1: Add responsive/performance regression contracts

**Files:**

- Create: `src/lib/responsive-production-polish.contract.test.ts`

- [ ] Assert carousel uses document/viewport/reduced-motion lifecycle guards and does not run autonomous RAF/timers when inactive.
- [ ] Assert carousel modal has dialog semantics and background scroll lock.
- [ ] Assert ProjectConverge respects reduced motion.
- [ ] Assert narrow-mobile Identity geometry has a dedicated <=359px guard while retaining four floating cards.
- [ ] Assert visual section numbering follows page order: Projects 04, FAQ 05.
- [ ] Run test and confirm RED before implementation.

### Task 2: Harden carousel runtime and mobile modal

**Files:**

- Modify: `src/components/EnchantedProjectCarousel.tsx`

- [ ] Reuse `animation-runtime` visibility/document/reduced-motion observers.
- [ ] Start RAF only while visible, document-visible, not reduced-motion, and not paused.
- [ ] Run image rotation timer only while active and motion is allowed.
- [ ] Lock document scrolling while an expanded card is open and restore it reliably.
- [ ] Add `role="dialog"` and `aria-modal="true"` to the expanded overlay.

### Task 3: Reduce motion cost without changing project design

**Files:**

- Modify: `src/components/ProjectConverge.tsx`

- [ ] Use `useReducedMotion()`.
- [ ] Preserve card/grid layout and imagery.
- [ ] Disable parallax translation, blur, scale, and image travel when reduced motion is requested.

### Task 4: Narrow-mobile geometry and visual-order polish

**Files:**

- Modify: `src/components/IdentityConstellation.tsx`
- Modify: `src/components/ProjectConverge.tsx`
- Modify: `src/routes/index.tsx`

- [ ] Add <=359px Identity card/typography geometry guard to reduce hard clipping while preserving constellation composition.
- [ ] Change Projects section marker to `04`.
- [ ] Change FAQ section marker to `05`.

### Task 5: Verification and integration

**Files:**

- Test: all `src/lib/*.test.ts`

- [ ] Run full CI: Test, Typecheck, Lint, Build.
- [ ] Confirm Vercel preview success.
- [ ] Review PR diff for desktop regressions.
- [ ] Merge only after required checks are green.

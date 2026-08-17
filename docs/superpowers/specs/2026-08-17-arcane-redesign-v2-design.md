# Arcane Labs Redesign V2 — Design Specification

## Goal
Upgrade the current Arcane Labs pixel website into a cohesive interactive developer-studio experience while preserving its black/white/acid-green visual identity and existing performance discipline.

## Non-negotiables
- Do not touch `main` until explicit approval.
- Work on `feature/arcane-redesign-v2` only.
- Keep checkpoint branches before major visual phases.
- Dark and light themes must both work.
- Pixel language must feel modern/dimensional, not retro 8-bit or terminal-themed.
- Expensive animation must pause when the tab is hidden and, where applicable, when its section is offscreen.
- Prefer Canvas/native browser APIs over hundreds of animated DOM nodes.
- Do not add heavy runtime dependencies unless strictly necessary.

## Phase 1 — Foundation

### 1. Local Arcane mark
Replace the Lovable `/__l5e/assets-v1/...` logo dependency with local first-party assets derived from the supplied black and white Arcane mark. The mark must never show a broken-image icon.

### 2. Entry loader
Add a full-screen loader shown only on the initial navigation. The mark assembles from square/pixel fragments, stabilizes, then the fragments spread outward as the site becomes visible. Target theatrical duration: 0.9–1.5 seconds after critical assets are ready. The loader must not intentionally block longer than necessary.

### 3. Grid Hover Background V2
Replace the snake-like hover field with a dense responsive pixel grid inspired by the provided Grid Hover Effect reference. Idle cells remain subtle. Cursor proximity raises brightness and acid-green intensity with a smooth decaying echo. Canvas only; no grid of DOM elements. Existing film grain and vignette remain.

### 4. Section entrance system
Each main section reveals once as it enters the viewport. Use the existing pixel/dither vocabulary: content resolves from pixel blocks and slight blur/offset, then the overlay is disposed. Do not make every element flicker independently.

## Phase 2 — Our Identity V2
Replace the current `CAMERA OR CODE?` block with a full-screen capability constellation.

### Capabilities
1. BRANDING
2. UI/UX
3. WEB DEVELOPMENT
4. MOTION / INTERACTION

Desktop: capability labels form a centered vertical stack. Hover/focus selects one capability. Active label becomes bright; inactive labels drop to subdued opacity. Four to six project cards orbit the stack in predefined positions. When selection changes, outgoing cards blur/pixelate and drift out; incoming cards resolve from pixel blocks into sharp images.

Mobile/tablet: no hover dependency. Selection changes using scroll position and tap/focus; one capability remains active at a time.

Project cards should support first-party image assets later but may use the current project URLs temporarily. Their motion must be deterministic and stable, not random every render.

## Phase 3 — Dimensional Portal V2
Redesign the existing radial star tunnel into a signature Arcane transition.

### Sequence
1. Approach: normal site grid starts to bend toward the center.
2. Gateway: Arcane symbol appears centered and gains pseudo-3D voxel depth.
3. Destabilization: nearby pixels detach from the logo surface.
4. Breach: camera visually passes through the mark.
5. Pixel metaverse: rectangular depth planes, voxel debris, streak blocks, nested frames and perspective slices create a multi-layer corridor rather than a round star tunnel.
6. Collapse: corridor fragments slow and magnetically return.
7. Exit: Arcane logo reassembles cleanly and the final content resolves.

The scene should use one Canvas render surface and deterministic seeded particles. Preserve the current long-scroll cinematic behavior but avoid generic hyperspace rings. The scene pauses while far offscreen or when the document is hidden.

## Phase 4 — Enhancements

### Interactive ticker
Place a horizontally scrolling capability ticker between Selected Work/Projects and Our Identity. Suggested copy: `BRANDING × UI/UX × WEB DEVELOPMENT × MOTION × CREATIVE TECHNOLOGY ×`. Hover/focus gently slows or arrests the ticker and emphasizes the active phrase.

### Unfocused-style transitions
Use selective chromatic defocus only during capability/project image changes. Never run it as a global persistent WebGL layer.

### Stamp/Scrapbook language
Only integrate if it can be adapted into the Arcane pixel system: no paper, tape, beige/vintage textures, or playful scrapbook aesthetic. Use floating project stamps/cards with black/white/graphite/acid-green surfaces.

## Architecture
- `ArcaneLoader.tsx`: initial pixel assembly/reveal.
- `GridHoverBackground.tsx`: background grid interaction + grain/vignette.
- `SectionPixelReveal.tsx`: reusable one-shot section reveal.
- `IdentityConstellation.tsx`: capability stack + image choreography.
- `InteractiveTicker.tsx`: capability transition strip.
- `VoxelArcaneLogo.tsx`: first-party Arcane mark with canvas/CSS pseudo-3D voxel breakup.
- `MetaversePortalV2.tsx`: one Canvas dimensional transition.
- `animation-runtime.ts`: shared visibility/lifecycle utilities remain the runtime gate.

## Performance budget
- One persistent background Canvas.
- One portal Canvas active only near portal.
- Loader Canvas exists only during loader.
- No more than one requestAnimationFrame loop per active Canvas component.
- No full-page DOM particle clouds.
- DPR capped at 2.
- Hidden-tab animation must stop.
- Portal and expensive wordmarks must pause offscreen.

## Acceptance criteria
- No broken logo in either theme.
- Loader visibly assembles the Arcane mark and exits cleanly.
- Background hover behaves like a responsive glowing grid instead of a snake trail.
- `Our Identity` visually follows the supplied capability-stack reference and changes project cards smoothly per capability.
- Each major section enters with a coherent pixel resolve.
- Portal clearly reads as a rectangular/voxel dimensional breach, not the old radial star field.
- Existing navigation, theme toggle, FAQ, works/projects and footer remain functional.
- `npm run test`, `npm run typecheck`, `npm run lint`, and `npm run build` all pass before any merge discussion.
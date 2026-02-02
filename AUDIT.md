# Particle Life — White Hat Audit Baseline

**Date:** 2026-02-02  
**Pass:** 1/10 (White Hat — Facts & Audit)

## Codebase Inventory

| Metric | Value |
|--------|-------|
| Source files | 8 (.ts/.tsx) + 2 (.css) |
| Total LOC | 1,371 |
| Components | 3 (App, ParticleCanvas, ControlPanel) |
| Test files | 2 |
| Tests | 28 |
| Commits | 2 (pre-audit) |

### File Breakdown

| File | Lines | Purpose |
|------|-------|---------|
| `simulation.ts` | 259 | Core engine: spatial hash, force function, update loop, renderer |
| `ControlPanel.tsx` | 293 | UI: sliders, rule matrix, presets, tabs |
| `App.css` | 364 | Styling for all UI components |
| `presets.ts` | 177 | 8 curated presets + randomizer |
| `ParticleCanvas.tsx` | 103 | Canvas mount, resize, animation loop |
| `App.tsx` | 81 | Root component, state, keyboard shortcuts |
| `types.ts` | 49 | Type definitions, colors, defaults |
| `index.css` | 42 | Global resets |
| `main.tsx` | 10 | Entry point + JSON-LD |

## Build Metrics

| Metric | Value |
|--------|-------|
| TypeScript errors | 0 |
| ESLint warnings | 0 |
| Strict mode | ✅ Yes |
| JS bundle | 206 KB (65 KB gzip) |
| CSS bundle | 5.36 KB (1.68 KB gzip) |
| Build time | ~425ms |

## Architecture

- **Rendering:** Canvas 2D (no WebGL)
- **State:** React useState (no external store)
- **Simulation:** Custom `ParticleSimulation` class, runs in main thread
- **Spatial indexing:** Hash grid with numeric keys (no string allocation)
- **Wrapping:** Toroidal (particles wrap around edges)
- **Force model:** Two-zone (repulsion < beta, attraction bell curve)
- **Animation:** requestAnimationFrame loop via refs

## What Exists ✅

- [x] 6 particle types with configurable 6×6 rule matrix
- [x] Proper particle life force function with configurable beta (minRadius/maxRadius)
- [x] Spatial hash grid for O(n) neighbor lookups
- [x] Toroidal world wrapping
- [x] 8 curated presets (Primordial Soup, Ecosystems, Living Cells, Orbital Clusters, Turbulence, Slime Mold, Galaxy, Random)
- [x] Real-time control panel (speed, friction, radius, force, trail, dot size)
- [x] Interactive rule matrix editor with color-coded cells
- [x] FPS counter
- [x] Keyboard shortcuts (Space, R)
- [x] Help overlay (auto-dismissing)
- [x] Batched rendering by particle type
- [x] OG/Twitter meta tags
- [x] JSON-LD structured data
- [x] Custom SVG favicon
- [x] Loading spinner
- [x] Noscript fallback
- [x] 404.html with SPA redirect
- [x] robots.txt + sitemap.xml

## What's Missing ❌

### Performance
- [ ] No devicePixelRatio handling on canvas (blurry on HiDPI)
- [ ] `getNearby()` allocates new array every call (GC pressure at high N)
- [ ] No Web Worker for simulation (blocks main thread)
- [ ] No performance monitor / auto-quality adjustment

### UX/UI
- [ ] No mobile responsiveness (control panel overlaps on small screens)
- [ ] No fullscreen toggle
- [ ] No particle count display (live count in scene)
- [ ] No zoom/pan capability
- [ ] No export/share functionality
- [ ] No animation when switching presets (abrupt change)

### Accessibility
- [ ] Canvas has no ARIA label or role
- [ ] No reduced-motion support
- [ ] No focus management for keyboard users
- [ ] Control panel sliders lack ARIA labels

### Code Quality
- [ ] No error boundary for React tree
- [ ] No tests before this pass (now: 28)
- [ ] No CI/CD before this pass (now: added)

### Meta/Deployment
- [ ] No manifest.json / PWA installability
- [ ] No screenshot/OG image

## Preset Analysis

All 8 presets tested stable over 100 simulation steps:

| Preset | Particles | Speed | Friction | Radius | Force | Trail |
|--------|-----------|-------|----------|--------|-------|-------|
| Primordial Soup | 1500 | 1.0 | 0.5 | 80 | 1.0 | 0.08 |
| Ecosystems | 1200 | 1.2 | 0.4 | 100 | 0.8 | 0.06 |
| Living Cells | 2000 | 0.8 | 0.6 | 60 | 1.2 | 0.04 |
| Orbital Clusters | 1000 | 1.0 | 0.3 | 120 | 0.6 | 0.03 |
| Turbulence | 1500 | 2.0 | 0.2 | 80 | 1.5 | 0.15 |
| Slime Mold | 2500 | 0.6 | 0.7 | 50 | 1.5 | 0.02 |
| Galaxy | 2000 | 0.8 | 0.15 | 150 | 0.4 | 0.02 |
| Random | 1200 | 1.0 | 0.5 | 100 | 1.0 | 0.05 |

## Changes Made in This Pass

1. **Installed vitest** — test framework with 28 baseline tests covering initialization, stepping, stability, config updates, stress tests, minRadius behavior, preset validation, and type invariants
2. **Added CI/CD workflow** — GitHub Actions: type check → lint → test → build → deploy
3. **Added `minRadius` slider** — UI now exposes the repulsion zone boundary (was a dead config field before previous fix)
4. **Added gh-pages deploy script** — `npm run deploy`
5. **Added LICENSE** (MIT)
6. **Created this audit document**

## Recommendations for Future Passes

- **Black Hat (Pass 2):** Test mobile, test extreme configs, check memory leaks, break the spatial hash
- **Green Hat (Pass 3):** Zoom/pan, particle trails as lines, mouse interaction, sonification
- **Yellow Hat (Pass 4):** Polish presets, enhance trail rendering, optimize defaults
- **Red Hat (Pass 5):** Visual feel — glow effects, smoother transitions, UI micro-animations
- **Blue Hat (Pass 6):** Extract simulation to Web Worker, add error boundary, refactor state

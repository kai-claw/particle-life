# 🌊 Particle Life

> Emergent behavior simulator — colored particles self-organize into living cells, ecosystems, and galaxies through simple attraction and repulsion rules.

<p align="center">
  <a href="https://kai-claw.github.io/particle-life/"><strong>▶ Live Demo</strong></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/status-live-brightgreen" alt="Status: Live" />
  <img src="https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript&logoColor=white" alt="TypeScript 5.9" />
  <img src="https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=white" alt="React 19" />
  <img src="https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white" alt="Vite 7" />
  <img src="https://img.shields.io/badge/Canvas_2D-Accelerated-orange" alt="Canvas 2D" />
  <img src="https://img.shields.io/badge/license-MIT-green" alt="MIT License" />
  <img src="https://img.shields.io/badge/tests-132_passing-brightgreen" alt="132 Tests" />
</p>

---

## What is Particle Life?

Particle Life is based on a beautifully simple idea: give colored particles rules about how they attract or repel each other, and watch **complex, lifelike behavior** emerge from those rules alone.

The magic is in the **force function** — particles repel at close range (preventing overlap) and attract or repel at medium range based on a configurable rule matrix. This two-zone force model creates stunning organic structures: cells, ecosystems, spirals, galaxies, and more.

---

## ✨ Features

### Core Simulation
| Feature | Description |
|---|---|
| **6 Species × 6×6 Rule Matrix** | Full configurable attraction/repulsion between every particle type |
| **Particle Life Force Model** | Close-range repulsion β-zone + medium-range bell curve |
| **Spatial Hash Grid** | O(n) neighbor lookups instead of O(n²) brute force |
| **Toroidal World** | Seamless edge wrapping — no boundary artifacts |
| **6 Launch Patterns** | Random, Big Bang, Spiral, Grid, Rings, Clusters |

### Visual Effects
| Feature | Description |
|---|---|
| **Glow Rendering** | Radial gradient blobs with additive blending — luminous nebula clusters |
| **Connection Web** | Neural-network lines between nearby particles via spatial hash |
| **3 Color Modes** | Species type, velocity heatmap, density crowding map |
| **Trail Effect** | Configurable motion blur / persistence of vision |
| **Species Mutation** | Particles convert when surrounded by majority of another species |

### Interactive
| Feature | Description |
|---|---|
| **Mouse Force Interaction** | Click to attract, right-click to repel, spawn new particles |
| **Smooth Preset Morphing** | Parameters lerp via smoothstep over 1.2s — organic transitions |
| **Cinematic Autoplay** | Auto-cycles through presets every 12s with smooth morphing |
| **Live Energy Chart** | Per-species kinetic energy over time — reveals oscillation dynamics |
| **Real-time Sliders** | Particles, speed, friction, radius, force, trail, dot size |

### Performance
| Feature | Description |
|---|---|
| **Glow Sprite Caching** | Pre-rendered offscreen sprites replace per-particle gradients (~10× faster) |
| **256-Entry Color LUTs** | Pre-computed lookup tables eliminate per-particle color math |
| **Spatial Hash Cell Pooling** | Array recycling eliminates thousands of GC allocations per frame |
| **Ring Buffer Energy History** | O(1) circular buffer replaces O(n) array shifting |
| **Adaptive Performance Monitor** | Auto-disables glow + web at <30 FPS, auto-recovers at >45 FPS |

---

## 📋 Presets

| Preset | Emoji | Behavior |
|---|---|---|
| Primordial Soup | 🧬 | Organic structures from simple attraction rules |
| Ecosystems | 🌿 | Predator-prey dynamics with chasing and fleeing |
| Living Cells | 🔬 | Self-organizing membranes and internal structures |
| Orbital Clusters | ☄️ | Orbiting formations and satellite structures |
| Turbulence | 🌊 | Chaotic mixing and eddies |
| Slime Mold | 🍄 | Branching networks and tendrils |
| Galaxy | 🌌 | Spiral arm formation and stellar clusters |
| Nebula | ✨ | Luminous glow clouds with strong self-attraction |
| Neural Web | 🧠 | Connected neural mesh with visible structure |
| Contagion | 🦠 | Species mutation waves with cyclic dominance |
| Random | 🎲 | Fresh random rules every time |

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
|---|---|
| <kbd>Space</kbd> | Pause / Play |
| <kbd>R</kbd> | Reset simulation |
| <kbd>S</kbd> | Save screenshot (PNG) |
| <kbd>E</kbd> | Toggle energy chart |
| <kbd>C</kbd> | Toggle cinematic autoplay |
| <kbd>W</kbd> | Toggle connection web |
| <kbd>M</kbd> | Toggle species mutation |
| <kbd>1</kbd> | Mouse: Attract mode |
| <kbd>2</kbd> | Mouse: Repel mode |
| <kbd>3</kbd> | Mouse: Spawn mode |
| <kbd>Esc</kbd> | Dismiss help overlay |

---

## 🏗️ Architecture

```
src/
├── simulation.ts        # Core simulation engine (particles, physics, spatial queries)
├── spatial-hash.ts      # Toroidal spatial hash grid for O(n) neighbor lookups
├── renderer.ts          # ParticleRenderer — glow sprites, color LUTs, web/mutation
├── types.ts             # TypeScript interfaces, defaults, color constants
├── presets.ts           # 11 curated presets with tuned rule matrices
├── App.tsx              # Main app — state management, morphing, keyboard shortcuts
├── ParticleCanvas.tsx   # Canvas component — RAF loop, mouse interaction, screenshot
├── ControlPanel.tsx     # 4-tab control panel (Controls, Rules, Presets, Creative)
├── DynamicsChart.tsx    # Live per-species kinetic energy chart (ring buffer)
├── ErrorBoundary.tsx    # Graceful crash recovery with reload
└── __tests__/           # 132 unit + integration tests (vitest)
    ├── simulation.test.ts
    ├── architecture.test.ts
    ├── presets.test.ts
    ├── blackhat.test.ts
    ├── greenhat.test.ts
    └── stresstest.test.ts
```

### How It Works

Each frame:
1. Particles are inserted into a **spatial hash grid** for efficient neighbor lookup
2. For each particle, nearby particles within the **interaction radius** are found
3. Forces are computed using the **particle life force function**:
   - Distance < β (minRadius): **repulsion** — prevents overlap
   - β < Distance < maxRadius: **attraction/repulsion** — bell curve shaped by rule matrix
4. Velocities are updated with **friction damping**
5. Positions are updated with **toroidal wrapping**
6. Optional: **mutation** checks species-majority neighborhoods
7. Optional: **connection web** draws luminous links between nearby particles

The rule matrix defines how each of the 6 species interacts:
- **Positive values** → attraction (particles move toward each other)
- **Negative values** → repulsion (particles flee)
- **Zero** → no interaction

---

## 🛠️ Tech Stack

| Technology | Role |
|---|---|
| **React 19** | UI framework with hooks-based state |
| **TypeScript 5.9** | Full strict-mode type safety |
| **Canvas 2D** | High-performance batched rendering |
| **Vite 7** | Sub-second dev server, optimized builds |
| **Vitest** | 132 unit + integration tests |
| **GitHub Actions** | CI/CD — types, tests, build, deploy |
| **GitHub Pages** | Production hosting |

---

## 🚀 Getting Started

```bash
git clone https://github.com/kai-claw/particle-life.git
cd particle-life
npm install
npm run dev
```

Open [http://localhost:5173/particle-life/](http://localhost:5173/particle-life/)

### Build

```bash
npm run build    # Production build → dist/
npm run test     # Run 132 tests
npm run deploy   # Build + deploy to GitHub Pages
```

---

## 📊 Bundle Stats

| Metric | Value |
|---|---|
| **JS Bundle** | ~235 KB (74 KB gzip) |
| **CSS** | ~16 KB (3.8 KB gzip) |
| **Total Transfer** | ~78 KB gzip |
| **Source Files** | 17 modules |
| **Test Coverage** | 132 tests |
| **TypeScript** | Strict mode, 0 errors |

---

## 🔬 The Science

Particle Life is inspired by Jeffrey Ventrella's [Clusters](http://www.interhacktives.com/clusters/) and the broader field of **artificial life**. The simulation demonstrates several fascinating emergent phenomena:

| Concept | What You See |
|---|---|
| **Emergence** | Complex patterns arise from simple local rules |
| **Self-Organization** | Stable structures form without central coordination |
| **Predator-Prey Dynamics** | Species chase and flee in oscillating waves |
| **Phase Transitions** | Small parameter changes cause dramatic behavior shifts |
| **Symmetry Breaking** | Identical initial conditions diverge into unique patterns |

---

## License

[MIT](./LICENSE)

# 🌊 Particle Life

An emergent behavior simulator where colored particles interact through configurable attraction and repulsion rules, spontaneously forming organic structures — cells, ecosystems, spirals, and more.

**[▶ Live Demo](https://kai-claw.github.io/particle-life/)**

![Particle Life](https://img.shields.io/badge/status-live-brightgreen) ![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue) ![React](https://img.shields.io/badge/React-19-61dafb)

## What is Particle Life?

Particle Life is based on a beautifully simple idea: give colored particles rules about how they attract or repel each other, and watch complex, lifelike behavior emerge from those rules alone.

The magic is in the **force function** — particles repel at close range (preventing overlap) and attract or repel at medium range based on configurable rules. This two-zone force model is what creates the stunning organic structures.

## Features

- **6 particle types** with a full 6×6 configurable attraction/repulsion matrix
- **Proper particle life force model** — close-range repulsion + medium-range attraction bell curve
- **Spatial hash grid** for O(n) performance instead of O(n²)
- **Toroidal world** — particles wrap around edges seamlessly
- **Real-time controls** — particle count, speed, friction, radius, force strength, trail effects
- **8 curated presets** — Primordial Soup, Ecosystems, Living Cells, Orbital Clusters, Turbulence, Slime Mold, Galaxy, Random
- **Keyboard shortcuts** — Space (pause/play), R (reset)
- **FPS counter** — monitor performance in real-time
- **Responsive** — fills the entire viewport

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173/particle-life/](http://localhost:5173/particle-life/)

## Building

```bash
npm run build
```

Output goes to `dist/`.

## How It Works

Each frame:
1. Particles are inserted into a **spatial hash grid** for efficient neighbor lookup
2. For each particle, nearby particles within the **interaction radius** are found
3. Forces are computed using the **particle life force function**:
   - Distance < β (30% of radius): **repulsion** (prevents overlap)
   - β < Distance < radius: **attraction/repulsion** shaped by a bell curve, scaled by the rule matrix value
4. Velocities are updated with friction damping
5. Positions are updated with toroidal wrapping

The rule matrix defines how each particle type reacts to every other type:
- **Positive values** → attraction (particles move toward each other)
- **Negative values** → repulsion (particles flee from each other)
- **Zero** → no interaction

## Tech Stack

- **React 19** + TypeScript
- **Canvas 2D** rendering with batched draw calls
- **Vite 7** for development and building
- **GitHub Pages** for deployment

## License

MIT

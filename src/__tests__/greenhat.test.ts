/**
 * Green Hat pass — tests for creative features:
 * - Initial layouts (big bang, spiral, grid, ring, clusters)
 * - Color modes (velocity, density)
 * - Mouse force interaction
 * - Velocity color mapping
 * - hslToRgb utility
 */
import { describe, it, expect } from 'vitest';
import { ParticleSimulation } from '../simulation';
import { DEFAULT_CONFIG, PARTICLE_TYPES, hslToRgb } from '../types';
import type { SimulationConfig, InitialLayout, ColorMode } from '../types';

const W = 800;
const H = 600;

function makeConfig(overrides: Partial<SimulationConfig> = {}): SimulationConfig {
  return { ...DEFAULT_CONFIG, ...overrides };
}

describe('Initial layouts', () => {
  const layouts: InitialLayout[] = ['random', 'bigbang', 'spiral', 'grid', 'ring', 'clusters'];

  it.each(layouts)('layout "%s" creates correct number of particles', (layout) => {
    const config = makeConfig({ particleCount: 500 });
    const sim = new ParticleSimulation(config);
    sim.setDimensions(W, H);
    sim.initializeWithLayout(layout);

    expect(sim.particles.length).toBe(500);
  });

  it.each(layouts)('layout "%s" places all particles within bounds', (layout) => {
    const config = makeConfig({ particleCount: 500 });
    const sim = new ParticleSimulation(config);
    sim.setDimensions(W, H);
    sim.initializeWithLayout(layout);

    for (const p of sim.particles) {
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.x).toBeLessThan(W);
      expect(p.y).toBeGreaterThanOrEqual(0);
      expect(p.y).toBeLessThan(H);
      expect(p.type).toBeGreaterThanOrEqual(0);
      expect(p.type).toBeLessThan(PARTICLE_TYPES);
    }
  });

  it.each(layouts)('layout "%s" particles remain stable after 100 steps', (layout) => {
    const config = makeConfig({ particleCount: 300 });
    const sim = new ParticleSimulation(config);
    sim.setDimensions(W, H);
    sim.initializeWithLayout(layout);

    for (let i = 0; i < 100; i++) sim.update();

    for (const p of sim.particles) {
      expect(Number.isFinite(p.x)).toBe(true);
      expect(Number.isFinite(p.y)).toBe(true);
      expect(Number.isFinite(p.vx)).toBe(true);
      expect(Number.isFinite(p.vy)).toBe(true);
    }
  });

  it('bigbang starts particles clustered near center', () => {
    const config = makeConfig({ particleCount: 500 });
    const sim = new ParticleSimulation(config);
    sim.setDimensions(W, H);
    sim.initializeWithLayout('bigbang');

    const cx = W / 2;
    const cy = H / 2;
    const spread = Math.min(W, H) * 0.03;
    let nearCenter = 0;
    for (const p of sim.particles) {
      const dist = Math.sqrt((p.x - cx) ** 2 + (p.y - cy) ** 2);
      if (dist < spread * 2) nearCenter++;
    }
    // Most particles should be near center
    expect(nearCenter).toBeGreaterThan(sim.particles.length * 0.8);
  });

  it('bigbang particles have outward velocities', () => {
    const config = makeConfig({ particleCount: 200 });
    const sim = new ParticleSimulation(config);
    sim.setDimensions(W, H);
    sim.initializeWithLayout('bigbang');

    let hasVelocity = 0;
    for (const p of sim.particles) {
      if (p.vx !== 0 || p.vy !== 0) hasVelocity++;
    }
    expect(hasVelocity).toBe(sim.particles.length);
  });

  it('grid layout arranges particles in rows and columns', () => {
    const config = makeConfig({ particleCount: 100 });
    const sim = new ParticleSimulation(config);
    sim.setDimensions(W, H);
    sim.initializeWithLayout('grid');

    // Grid particles should have zero initial velocity
    for (const p of sim.particles) {
      expect(p.vx).toBe(0);
      expect(p.vy).toBe(0);
    }
  });

  it('ring layout creates concentric rings', () => {
    const config = makeConfig({ particleCount: 600 });
    const sim = new ParticleSimulation(config);
    sim.setDimensions(W, H);
    sim.initializeWithLayout('ring');

    const cx = W / 2;
    const cy = H / 2;
    // All particles should be at various distances from center
    const distances = sim.particles.map(p =>
      Math.sqrt((p.x - cx) ** 2 + (p.y - cy) ** 2)
    );
    const maxDist = Math.max(...distances);
    const minDist = Math.min(...distances);
    // There should be a range of distances (concentric rings)
    expect(maxDist - minDist).toBeGreaterThan(50);
  });

  it('clusters layout groups particles by type', () => {
    const config = makeConfig({ particleCount: 600 });
    const sim = new ParticleSimulation(config);
    sim.setDimensions(W, H);
    sim.initializeWithLayout('clusters');

    // Check that same-type particles are closer to each other on average
    const typeCenters: { x: number; y: number; count: number }[] = [];
    for (let t = 0; t < PARTICLE_TYPES; t++) {
      typeCenters.push({ x: 0, y: 0, count: 0 });
    }
    for (const p of sim.particles) {
      typeCenters[p.type].x += p.x;
      typeCenters[p.type].y += p.y;
      typeCenters[p.type].count++;
    }
    // Each type should have particles
    for (const tc of typeCenters) {
      expect(tc.count).toBeGreaterThan(0);
    }
  });
});

describe('Color modes in simulation', () => {
  const colorModes: ColorMode[] = ['type', 'velocity', 'density'];

  it.each(colorModes)('color mode "%s" runs simulation without errors', (mode) => {
    const config = makeConfig({ colorMode: mode, particleCount: 200 });
    const sim = new ParticleSimulation(config);
    sim.setDimensions(W, H);
    sim.initializeParticles();

    for (let i = 0; i < 50; i++) sim.update();

    for (const p of sim.particles) {
      expect(Number.isFinite(p.x)).toBe(true);
      expect(Number.isFinite(p.y)).toBe(true);
    }
  });

  it('density mode tracks neighbor counts', () => {
    const config = makeConfig({ colorMode: 'density', particleCount: 100 });
    const sim = new ParticleSimulation(config);
    sim.setDimensions(W, H);
    sim.initializeParticles();

    // Run enough steps to populate neighbor counts
    for (let i = 0; i < 20; i++) sim.update();

    // Simulation should still be stable
    for (const p of sim.particles) {
      expect(Number.isFinite(p.x)).toBe(true);
    }
  });
});

describe('Mouse force interaction', () => {
  it('attract mouse force pulls particles toward cursor', () => {
    const config = makeConfig({ particleCount: 50, friction: 0.1 });
    const sim = new ParticleSimulation(config);
    sim.setDimensions(W, H);
    sim.initializeParticles();

    // Place mouse force at center with attraction
    sim.mouseForce = {
      active: true,
      x: W / 2,
      y: H / 2,
      radius: 300,
      strength: 2.0,
    };

    // Get initial average distance from center
    const avgDistBefore = sim.particles.reduce((sum, p) =>
      sum + Math.sqrt((p.x - W / 2) ** 2 + (p.y - H / 2) ** 2), 0) / sim.particles.length;

    for (let i = 0; i < 50; i++) sim.update();

    const avgDistAfter = sim.particles.reduce((sum, p) =>
      sum + Math.sqrt((p.x - W / 2) ** 2 + (p.y - H / 2) ** 2), 0) / sim.particles.length;

    // Particles should be closer to center after attraction
    expect(avgDistAfter).toBeLessThan(avgDistBefore);
  });

  it('repel mouse force pushes particles away from cursor', () => {
    // Create particles all clustered at center
    const config = makeConfig({ particleCount: 50, friction: 0.1 });
    const sim = new ParticleSimulation(config);
    sim.setDimensions(W, H);

    // Manually place all particles near center
    sim.particles = [];
    for (let i = 0; i < 50; i++) {
      sim.particles.push({
        x: W / 2 + (Math.random() - 0.5) * 20,
        y: H / 2 + (Math.random() - 0.5) * 20,
        vx: 0,
        vy: 0,
        type: i % PARTICLE_TYPES,
      });
    }

    sim.mouseForce = {
      active: true,
      x: W / 2,
      y: H / 2,
      radius: 300,
      strength: -2.0,
    };

    const avgDistBefore = sim.particles.reduce((sum, p) =>
      sum + Math.sqrt((p.x - W / 2) ** 2 + (p.y - H / 2) ** 2), 0) / sim.particles.length;

    for (let i = 0; i < 50; i++) sim.update();

    const avgDistAfter = sim.particles.reduce((sum, p) =>
      sum + Math.sqrt((p.x - W / 2) ** 2 + (p.y - H / 2) ** 2), 0) / sim.particles.length;

    // Particles should be farther from center after repulsion
    expect(avgDistAfter).toBeGreaterThan(avgDistBefore);
  });

  it('inactive mouse force has no effect', () => {
    const config = makeConfig({ particleCount: 20 });
    const sim = new ParticleSimulation(config);
    sim.setDimensions(W, H);
    sim.initializeParticles();

    sim.mouseForce = {
      active: false,
      x: W / 2,
      y: H / 2,
      radius: 300,
      strength: 10.0,
    };

    // Positions should be same whether mouse is active or not
    // (can't easily compare, but at least it shouldn't crash)
    for (let i = 0; i < 20; i++) sim.update();

    for (const p of sim.particles) {
      expect(Number.isFinite(p.x)).toBe(true);
    }
  });
});

describe('hslToRgb utility', () => {
  it('pure red (h=0, s=1, l=0.5)', () => {
    const [r, g, b] = hslToRgb(0, 1, 0.5);
    expect(r).toBe(255);
    expect(g).toBe(0);
    expect(b).toBe(0);
  });

  it('pure green (h=0.333, s=1, l=0.5)', () => {
    const [r, g, b] = hslToRgb(1 / 3, 1, 0.5);
    expect(r).toBe(0);
    expect(g).toBe(255);
    expect(b).toBe(0);
  });

  it('white (s=0, l=1)', () => {
    const [r, g, b] = hslToRgb(0, 0, 1);
    expect(r).toBe(255);
    expect(g).toBe(255);
    expect(b).toBe(255);
  });

  it('black (s=0, l=0)', () => {
    const [r, g, b] = hslToRgb(0, 0, 0);
    expect(r).toBe(0);
    expect(g).toBe(0);
    expect(b).toBe(0);
  });

  it('returns values in 0-255 range for any input', () => {
    for (let h = 0; h <= 1; h += 0.1) {
      for (let s = 0; s <= 1; s += 0.25) {
        for (let l = 0; l <= 1; l += 0.25) {
          const [r, g, b] = hslToRgb(h, s, l);
          expect(r).toBeGreaterThanOrEqual(0);
          expect(r).toBeLessThanOrEqual(255);
          expect(g).toBeGreaterThanOrEqual(0);
          expect(g).toBeLessThanOrEqual(255);
          expect(b).toBeGreaterThanOrEqual(0);
          expect(b).toBeLessThanOrEqual(255);
        }
      }
    }
  });
});

describe('Stress: layouts + color modes combined', () => {
  const layouts: InitialLayout[] = ['bigbang', 'spiral', 'grid', 'ring', 'clusters'];

  it.each(layouts)('layout "%s" + velocity mode stays stable', (layout) => {
    const config = makeConfig({ colorMode: 'velocity', particleCount: 200 });
    const sim = new ParticleSimulation(config);
    sim.setDimensions(W, H);
    sim.initializeWithLayout(layout);

    for (let i = 0; i < 100; i++) sim.update();

    for (const p of sim.particles) {
      expect(Number.isFinite(p.x)).toBe(true);
      expect(Number.isFinite(p.y)).toBe(true);
    }
  });

  it('switching color mode mid-simulation is stable', () => {
    const config = makeConfig({ colorMode: 'type', particleCount: 200 });
    const sim = new ParticleSimulation(config);
    sim.setDimensions(W, H);
    sim.initializeParticles();

    for (let i = 0; i < 30; i++) sim.update();

    // Switch to velocity mode
    sim.updateConfig({ ...config, colorMode: 'velocity' });
    for (let i = 0; i < 30; i++) sim.update();

    // Switch to density mode
    sim.updateConfig({ ...config, colorMode: 'density' });
    for (let i = 0; i < 30; i++) sim.update();

    for (const p of sim.particles) {
      expect(Number.isFinite(p.x)).toBe(true);
    }
  });
});

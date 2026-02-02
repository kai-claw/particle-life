/**
 * Black Hat pass — tests for bugs found and fixed:
 * - Toroidal spatial hash wrapping
 * - minRadius/maxRadius validation
 * - NaN/Infinity recovery
 * - Velocity clamping
 * - Resize particle clamping
 * - Random preset regeneration
 */
import { describe, it, expect } from 'vitest';
import { ParticleSimulation } from '../simulation';
import { DEFAULT_CONFIG, PARTICLE_TYPES } from '../types';
import type { SimulationConfig } from '../types';
import { PRESETS, randomRules } from '../presets';

const W = 800;
const H = 600;

describe('Toroidal spatial hash', () => {
  it('particles near opposite edges interact across the boundary', () => {
    // Create two attracting particles on opposite sides of the x-wrap
    const config: SimulationConfig = {
      ...DEFAULT_CONFIG,
      particleCount: 2,
      maxRadius: 100,
      minRadius: 20,
      friction: 0.5,
      forceStrength: 1.0,
      speed: 1.0,
      // Type 0 strongly attracts type 0
      rules: Array.from({ length: PARTICLE_TYPES }, () =>
        Array.from({ length: PARTICLE_TYPES }, () => 0)
      ),
    };
    config.rules[0][0] = 1.0;

    const sim = new ParticleSimulation(config);
    sim.setDimensions(W, H);
    sim.particles = [
      { x: 5, y: 300, vx: 0, vy: 0, type: 0 },    // near left edge
      { x: W - 5, y: 300, vx: 0, vy: 0, type: 0 }, // near right edge
    ];

    // Distance across wrap = 5 + 5 = 10, well within maxRadius of 100
    // After updates, they should move TOWARD each other across the boundary
    for (let i = 0; i < 10; i++) sim.update();

    // Particle 0 should move left (toward the boundary, wrapping around)
    // or particle 1 should move right (toward boundary)
    // Both should have non-zero velocity
    const p0 = sim.particles[0];
    const p1 = sim.particles[1];
    expect(p0.vx !== 0 || p1.vx !== 0).toBe(true);
  });

  it('particles near opposite y-edges interact', () => {
    const config: SimulationConfig = {
      ...DEFAULT_CONFIG,
      particleCount: 2,
      maxRadius: 100,
      rules: Array.from({ length: PARTICLE_TYPES }, () =>
        Array.from({ length: PARTICLE_TYPES }, () => 0)
      ),
    };
    config.rules[0][0] = 1.0;

    const sim = new ParticleSimulation(config);
    sim.setDimensions(W, H);
    sim.particles = [
      { x: 400, y: 5, vx: 0, vy: 0, type: 0 },
      { x: 400, y: H - 5, vx: 0, vy: 0, type: 0 },
    ];

    for (let i = 0; i < 10; i++) sim.update();

    const p0 = sim.particles[0];
    const p1 = sim.particles[1];
    expect(p0.vy !== 0 || p1.vy !== 0).toBe(true);
  });
});

describe('minRadius / maxRadius validation', () => {
  it('updateConfig clamps minRadius when it exceeds maxRadius', () => {
    const sim = new ParticleSimulation(DEFAULT_CONFIG);
    sim.setDimensions(W, H);
    sim.initializeParticles();

    // Try to set minRadius > maxRadius
    const badConfig: SimulationConfig = {
      ...DEFAULT_CONFIG,
      maxRadius: 30,
      minRadius: 80, // exceeds maxRadius!
    };
    sim.updateConfig(badConfig);
    const cfg = sim.getConfig();

    // minRadius should have been clamped
    expect(cfg.minRadius).toBeLessThanOrEqual(cfg.maxRadius);
  });

  it('simulation remains stable with edge-case radius values', () => {
    const config: SimulationConfig = {
      ...DEFAULT_CONFIG,
      maxRadius: 30,
      minRadius: 29, // very close to maxRadius
      particleCount: 200,
    };

    const sim = new ParticleSimulation(config);
    sim.setDimensions(W, H);
    sim.initializeParticles();

    for (let i = 0; i < 100; i++) sim.update();

    for (const p of sim.particles) {
      expect(Number.isFinite(p.x)).toBe(true);
      expect(Number.isFinite(p.y)).toBe(true);
    }
  });
});

describe('NaN/Infinity recovery', () => {
  it('recovers from manually corrupted particle velocities', () => {
    const sim = new ParticleSimulation(DEFAULT_CONFIG);
    sim.setDimensions(W, H);
    sim.initializeParticles();

    // Corrupt some particles
    sim.particles[0].vx = NaN;
    sim.particles[1].vy = Infinity;
    sim.particles[2].vx = -Infinity;

    // Should not crash and should recover
    for (let i = 0; i < 10; i++) sim.update();

    for (const p of sim.particles) {
      expect(Number.isFinite(p.x)).toBe(true);
      expect(Number.isFinite(p.y)).toBe(true);
      expect(Number.isFinite(p.vx)).toBe(true);
      expect(Number.isFinite(p.vy)).toBe(true);
    }
  });

  it('recovers from corrupted positions', () => {
    const sim = new ParticleSimulation(DEFAULT_CONFIG);
    sim.setDimensions(W, H);
    sim.initializeParticles();

    sim.particles[0].x = NaN;
    sim.particles[1].y = Infinity;

    sim.update();

    for (const p of sim.particles) {
      expect(Number.isFinite(p.x)).toBe(true);
      expect(Number.isFinite(p.y)).toBe(true);
    }
  });
});

describe('Velocity clamping', () => {
  it('prevents velocity explosion under extreme force + low friction', () => {
    const extreme: SimulationConfig = {
      ...DEFAULT_CONFIG,
      particleCount: 100,
      speed: 3.0,
      friction: 0.01,
      forceStrength: 3.0,
      rules: Array.from({ length: PARTICLE_TYPES }, () =>
        Array.from({ length: PARTICLE_TYPES }, () => 1.0) // all attract strongly
      ),
    };

    const sim = new ParticleSimulation(extreme);
    sim.setDimensions(W, H);
    sim.initializeParticles();

    for (let i = 0; i < 500; i++) sim.update();

    const maxVel = extreme.maxRadius * 0.5;
    for (const p of sim.particles) {
      expect(Math.abs(p.vx)).toBeLessThanOrEqual(maxVel + 0.01);
      expect(Math.abs(p.vy)).toBeLessThanOrEqual(maxVel + 0.01);
      expect(Number.isFinite(p.x)).toBe(true);
      expect(Number.isFinite(p.y)).toBe(true);
    }
  });
});

describe('Resize clamping', () => {
  it('clamps particles into new bounds when canvas shrinks', () => {
    const sim = new ParticleSimulation({ ...DEFAULT_CONFIG, particleCount: 100 });
    sim.setDimensions(1000, 1000);
    sim.initializeParticles();

    // Some particles will be at x > 500 or y > 500
    const hadOutside = sim.particles.some(p => p.x > 500 || p.y > 500);
    expect(hadOutside).toBe(true);

    // Shrink canvas
    sim.setDimensions(500, 500);

    // All particles should now be within [0, 500)
    for (const p of sim.particles) {
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.x).toBeLessThan(500);
      expect(p.y).toBeGreaterThanOrEqual(0);
      expect(p.y).toBeLessThan(500);
    }
  });
});

describe('randomRules', () => {
  it('generates different rules on each call', () => {
    const r1 = randomRules();
    const r2 = randomRules();

    // Flatten and compare — should differ (astronomically unlikely to match)
    const flat1 = r1.flat().join(',');
    const flat2 = r2.flat().join(',');
    expect(flat1).not.toBe(flat2);
  });

  it('generates valid NxN matrices with values in [-1, 1]', () => {
    const rules = randomRules();
    expect(rules.length).toBe(PARTICLE_TYPES);
    for (const row of rules) {
      expect(row.length).toBe(PARTICLE_TYPES);
      for (const val of row) {
        expect(val).toBeGreaterThanOrEqual(-1);
        expect(val).toBeLessThanOrEqual(1);
      }
    }
  });
});

describe('Edge case stress tests', () => {
  it('handles 1 particle without crashing', () => {
    const config: SimulationConfig = { ...DEFAULT_CONFIG, particleCount: 1 };
    const sim = new ParticleSimulation(config);
    sim.setDimensions(W, H);
    sim.initializeParticles();

    expect(sim.particles.length).toBe(1);
    for (let i = 0; i < 50; i++) sim.update();

    expect(Number.isFinite(sim.particles[0].x)).toBe(true);
  });

  it('handles 0 particles without crashing', () => {
    const config: SimulationConfig = { ...DEFAULT_CONFIG, particleCount: 0 };
    const sim = new ParticleSimulation(config);
    sim.setDimensions(W, H);
    sim.initializeParticles();

    expect(sim.particles.length).toBe(0);
    // Should not throw
    sim.update();
  });

  it('handles very small canvas (10x10)', () => {
    const sim = new ParticleSimulation({ ...DEFAULT_CONFIG, particleCount: 50, maxRadius: 30 });
    sim.setDimensions(10, 10);
    sim.initializeParticles();

    for (let i = 0; i < 50; i++) sim.update();

    for (const p of sim.particles) {
      expect(Number.isFinite(p.x)).toBe(true);
      expect(Number.isFinite(p.y)).toBe(true);
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.x).toBeLessThan(10);
    }
  });

  it('all presets remain stable after 500 steps', () => {
    for (const preset of PRESETS) {
      const config = { ...DEFAULT_CONFIG, ...preset.config, particleCount: 100 };
      const sim = new ParticleSimulation(config);
      sim.setDimensions(W, H);
      sim.initializeParticles();

      for (let i = 0; i < 500; i++) sim.update();

      for (const p of sim.particles) {
        expect(Number.isFinite(p.x)).toBe(true);
        expect(Number.isFinite(p.y)).toBe(true);
        expect(Number.isFinite(p.vx)).toBe(true);
        expect(Number.isFinite(p.vy)).toBe(true);
      }
    }
  });
});

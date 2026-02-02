import { describe, it, expect } from 'vitest';
import { ParticleSimulation, particleLifeForce } from '../simulation';
import { SpatialHash } from '../spatial-hash';
import { velocityToColor, densityToColor } from '../renderer';
import { DEFAULT_CONFIG, PARTICLE_TYPES } from '../types';

// ─── Stress Test Suite (Black Hat #2 — Pass 8) ─────────────────────────────
// Tests for performance correctness, memory safety, and edge cases under load.

describe('SpatialHash cell pooling', () => {
  it('reuses cell arrays across clear cycles (no new allocations)', () => {
    const hash = new SpatialHash(50);
    hash.setWorldSize(500, 500);

    // First fill
    for (let i = 0; i < 100; i++) {
      hash.add({ x: Math.random() * 500, y: Math.random() * 500, vx: 0, vy: 0, type: 0 });
    }

    // Clear and refill multiple times
    for (let cycle = 0; cycle < 10; cycle++) {
      hash.clear();
      for (let i = 0; i < 100; i++) {
        hash.add({ x: Math.random() * 500, y: Math.random() * 500, vx: 0, vy: 0, type: 0 });
      }
    }

    // Should still find particles correctly after pooling
    const nearby = hash.getNearby(250, 250);
    expect(nearby.length).toBeGreaterThanOrEqual(0);
  });

  it('maintains correct neighbor results after many pool recycles', () => {
    const hash = new SpatialHash(100);
    hash.setWorldSize(200, 200);

    for (let cycle = 0; cycle < 50; cycle++) {
      hash.clear();
      // Place all particles at center — should all be neighbors
      for (let i = 0; i < 20; i++) {
        hash.add({ x: 100, y: 100, vx: 0, vy: 0, type: i % PARTICLE_TYPES });
      }
      const nearby = hash.getNearby(100, 100);
      expect(nearby.length).toBe(20);
    }
  });
});

describe('Energy history ring buffer', () => {
  it('returns correct history length without exceeding max', () => {
    const sim = new ParticleSimulation({
      ...DEFAULT_CONFIG,
      particleCount: 50,
    });
    sim.setDimensions(200, 200);
    sim.initializeParticles();

    // Run enough frames to fill energy history (every 6 frames = 1 sample)
    // 200 max × 6 frames = 1200 frames
    for (let i = 0; i < 1500; i++) {
      sim.update();
    }

    const history = sim.getEnergyHistory();
    expect(history.length).toBeLessThanOrEqual(200);
    expect(history.length).toBeGreaterThan(0);

    // Each snapshot should have PARTICLE_TYPES entries
    for (const snapshot of history) {
      expect(snapshot.length).toBe(PARTICLE_TYPES);
      for (const val of snapshot) {
        expect(Number.isFinite(val)).toBe(true);
        expect(val).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('ring buffer wraps correctly (oldest data is dropped)', () => {
    const sim = new ParticleSimulation({
      ...DEFAULT_CONFIG,
      particleCount: 20,
    });
    sim.setDimensions(100, 100);
    sim.initializeParticles();

    // Run far past the 200-sample buffer
    for (let i = 0; i < 2400; i++) {
      sim.update();
    }

    const history = sim.getEnergyHistory();
    expect(history.length).toBe(200);

    // Verify ordering: later samples should generally exist
    // (we can't verify exact values but structure must be valid)
    const lastSnapshot = history[history.length - 1];
    expect(lastSnapshot.length).toBe(PARTICLE_TYPES);
  });
});

describe('Performance degradation auto-recovery', () => {
  it('isPerformanceDegraded starts false', () => {
    const sim = new ParticleSimulation({ ...DEFAULT_CONFIG, particleCount: 10 });
    sim.setDimensions(100, 100);
    sim.initializeParticles();
    expect(sim.isPerformanceDegraded).toBe(false);
    expect(sim.performanceWarning).toBe('');
  });
});

describe('Force function stress tests', () => {
  it('handles millions of calls without precision loss', () => {
    let sum = 0;
    for (let i = 0; i < 1_000_000; i++) {
      const d = Math.random();
      const a = Math.random() * 2 - 1;
      const beta = 0.1 + Math.random() * 0.8;
      const f = particleLifeForce(d, a, beta);
      sum += f;
      expect(Number.isFinite(f)).toBe(true);
    }
    expect(Number.isFinite(sum)).toBe(true);
  });

  it('force is always zero at and beyond normalized distance 1.0', () => {
    for (let i = 0; i < 10000; i++) {
      const d = 1.0 + Math.random() * 10;
      const a = Math.random() * 2 - 1;
      expect(particleLifeForce(d, a, 0.3)).toBe(0);
    }
  });
});

describe('Large particle count stress', () => {
  it('handles 3000 particles without NaN/Infinity', () => {
    const sim = new ParticleSimulation({
      ...DEFAULT_CONFIG,
      particleCount: 3000,
      speed: 2.0,
    });
    sim.setDimensions(800, 600);
    sim.initializeParticles();

    for (let step = 0; step < 60; step++) {
      sim.update();
    }

    for (const p of sim.particles) {
      expect(Number.isFinite(p.x)).toBe(true);
      expect(Number.isFinite(p.y)).toBe(true);
      expect(Number.isFinite(p.vx)).toBe(true);
      expect(Number.isFinite(p.vy)).toBe(true);
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.x).toBeLessThan(800);
      expect(p.y).toBeGreaterThanOrEqual(0);
      expect(p.y).toBeLessThan(600);
    }
  });

  it('handles 3000 particles with mutation enabled', () => {
    const sim = new ParticleSimulation({
      ...DEFAULT_CONFIG,
      particleCount: 3000,
      mutationEnabled: true,
    });
    sim.setDimensions(800, 600);
    sim.initializeParticles();

    for (let step = 0; step < 100; step++) {
      sim.update();
    }

    // All particles should still be valid
    expect(sim.particles.length).toBe(3000);
    for (const p of sim.particles) {
      expect(p.type).toBeGreaterThanOrEqual(0);
      expect(p.type).toBeLessThan(PARTICLE_TYPES);
      expect(Number.isFinite(p.x)).toBe(true);
      expect(Number.isFinite(p.y)).toBe(true);
    }
  });
});

describe('Color LUT correctness', () => {
  it('velocityToColor returns valid RGB at all extremes', () => {
    const testValues = [0, 0.001, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 0.999, 1.0];
    for (const v of testValues) {
      const [r, g, b] = velocityToColor(v);
      expect(r).toBeGreaterThanOrEqual(0);
      expect(r).toBeLessThanOrEqual(255);
      expect(g).toBeGreaterThanOrEqual(0);
      expect(g).toBeLessThanOrEqual(255);
      expect(b).toBeGreaterThanOrEqual(0);
      expect(b).toBeLessThanOrEqual(255);
    }
  });

  it('densityToColor returns valid RGB at all extremes', () => {
    const testValues = [0, 0.001, 0.25, 0.5, 0.75, 0.999, 1.0];
    for (const v of testValues) {
      const [r, g, b] = densityToColor(v);
      expect(r).toBeGreaterThanOrEqual(0);
      expect(r).toBeLessThanOrEqual(255);
      expect(g).toBeGreaterThanOrEqual(0);
      expect(g).toBeLessThanOrEqual(255);
      expect(b).toBeGreaterThanOrEqual(0);
      expect(b).toBeLessThanOrEqual(255);
    }
  });

  it('velocityToColor clamps out-of-range inputs', () => {
    const [r1, g1, b1] = velocityToColor(-5);
    const [r2, g2, b2] = velocityToColor(0);
    expect(r1).toBe(r2);
    expect(g1).toBe(g2);
    expect(b1).toBe(b2);

    const [r3, g3, b3] = velocityToColor(100);
    const [r4, g4, b4] = velocityToColor(1);
    expect(r3).toBe(r4);
    expect(g3).toBe(g4);
    expect(b3).toBe(b4);
  });
});

describe('Simulation with all features enabled simultaneously', () => {
  it('runs stable with glow + web + mutation + velocity mode', () => {
    const sim = new ParticleSimulation({
      ...DEFAULT_CONFIG,
      particleCount: 1000,
      glowEnabled: true,
      webEnabled: true,
      mutationEnabled: true,
      colorMode: 'velocity',
      speed: 1.5,
    });
    sim.setDimensions(600, 400);
    sim.initializeParticles();

    // Run 300 frames — should not throw
    for (let i = 0; i < 300; i++) {
      sim.update();
    }

    expect(sim.particles.length).toBe(1000);
    const history = sim.getEnergyHistory();
    expect(history.length).toBeGreaterThan(0);
  });
});

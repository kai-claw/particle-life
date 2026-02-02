import { describe, it, expect } from 'vitest';
import { SpatialHash } from '../spatial-hash';
import { velocityToColor, densityToColor, ParticleRenderer } from '../renderer';
import { particleLifeForce, ParticleSimulation } from '../simulation';
import { PARTICLE_TYPES, DEFAULT_CONFIG } from '../types';
import type { Particle } from '../types';

// ============================================================
// SpatialHash unit tests
// ============================================================
describe('SpatialHash', () => {
  const mkParticle = (x: number, y: number, type = 0): Particle => ({
    x, y, vx: 0, vy: 0, type,
  });

  it('should find particles in the same cell', () => {
    const hash = new SpatialHash(100);
    hash.setWorldSize(800, 600);
    const p1 = mkParticle(50, 50);
    const p2 = mkParticle(60, 60);
    hash.add(p1);
    hash.add(p2);
    const nearby = hash.getNearby(55, 55);
    expect(nearby).toContain(p1);
    expect(nearby).toContain(p2);
  });

  it('should find particles in adjacent cells', () => {
    const hash = new SpatialHash(50);
    hash.setWorldSize(400, 400);
    const p1 = mkParticle(48, 48); // near cell boundary
    const p2 = mkParticle(52, 52); // next cell
    hash.add(p1);
    hash.add(p2);
    const nearby = hash.getNearby(49, 49);
    expect(nearby).toContain(p1);
    expect(nearby).toContain(p2);
  });

  it('should wrap toroidally — left/right edges', () => {
    const hash = new SpatialHash(50);
    hash.setWorldSize(400, 400);
    const pLeft = mkParticle(5, 200);
    const pRight = mkParticle(395, 200);
    hash.add(pLeft);
    hash.add(pRight);
    // Querying near left edge should find particle near right edge
    const nearby = hash.getNearby(5, 200);
    expect(nearby).toContain(pLeft);
    expect(nearby).toContain(pRight);
  });

  it('should wrap toroidally — top/bottom edges', () => {
    const hash = new SpatialHash(50);
    hash.setWorldSize(400, 400);
    const pTop = mkParticle(200, 5);
    const pBottom = mkParticle(200, 395);
    hash.add(pTop);
    hash.add(pBottom);
    const nearby = hash.getNearby(200, 5);
    expect(nearby).toContain(pTop);
    expect(nearby).toContain(pBottom);
  });

  it('should not find distant particles', () => {
    const hash = new SpatialHash(50);
    hash.setWorldSize(800, 800);
    const p1 = mkParticle(100, 100);
    const pFar = mkParticle(500, 500);
    hash.add(p1);
    hash.add(pFar);
    const nearby = hash.getNearby(100, 100);
    expect(nearby).toContain(p1);
    expect(nearby).not.toContain(pFar);
  });

  it('should clear all entries', () => {
    const hash = new SpatialHash(100);
    hash.setWorldSize(400, 400);
    hash.add(mkParticle(50, 50));
    hash.add(mkParticle(150, 150));
    hash.clear();
    expect(hash.getNearby(50, 50).length).toBe(0);
  });

  it('should clamp cellSize to minimum of 1', () => {
    const hash = new SpatialHash(0);
    hash.setWorldSize(100, 100);
    // Should not throw
    hash.add(mkParticle(50, 50));
    expect(hash.getNearby(50, 50).length).toBe(1);
  });
});

// ============================================================
// Color function tests
// ============================================================
describe('velocityToColor', () => {
  it('returns deep purple/blue for zero speed', () => {
    const rgb = velocityToColor(0);
    expect(rgb[0]).toBeLessThan(100);
    expect(rgb[2]).toBeGreaterThan(50);
  });

  it('returns bright white/yellow for max speed', () => {
    const rgb = velocityToColor(1);
    expect(rgb[0]).toBe(255);
    expect(rgb[1]).toBe(255);
    expect(rgb[2]).toBeGreaterThan(200);
  });

  it('clamps values outside [0,1]', () => {
    expect(velocityToColor(-0.5)).toEqual(velocityToColor(0));
    expect(velocityToColor(1.5)).toEqual(velocityToColor(1));
  });

  it('returns valid RGB range for all gradient stops', () => {
    for (let t = 0; t <= 1.0; t += 0.05) {
      const [r, g, b] = velocityToColor(t);
      expect(r).toBeGreaterThanOrEqual(0);
      expect(r).toBeLessThanOrEqual(255);
      expect(g).toBeGreaterThanOrEqual(0);
      expect(g).toBeLessThanOrEqual(255);
      expect(b).toBeGreaterThanOrEqual(0);
      expect(b).toBeLessThanOrEqual(255);
    }
  });
});

describe('densityToColor', () => {
  it('returns cool dark for zero density', () => {
    const rgb = densityToColor(0);
    expect(rgb[0] + rgb[1] + rgb[2]).toBeLessThan(300); // relatively dark
  });

  it('returns warm bright for max density', () => {
    const rgb = densityToColor(1);
    expect(rgb[0] + rgb[1] + rgb[2]).toBeGreaterThan(200); // relatively bright
  });

  it('clamps values outside [0,1]', () => {
    expect(densityToColor(-1)).toEqual(densityToColor(0));
    expect(densityToColor(2)).toEqual(densityToColor(1));
  });
});

// ============================================================
// particleLifeForce tests
// ============================================================
describe('particleLifeForce', () => {
  const beta = 0.3;

  it('returns repulsion at very close range', () => {
    expect(particleLifeForce(0.1, 1.0, beta)).toBeLessThan(0);
  });

  it('returns -1 at distance 0 (max repulsion)', () => {
    expect(particleLifeForce(0, 1.0, beta)).toBeCloseTo(-1);
  });

  it('returns 0 at distance = beta (transition point)', () => {
    expect(particleLifeForce(beta, 1.0, beta)).toBeCloseTo(0);
  });

  it('returns 0 beyond unit distance', () => {
    expect(particleLifeForce(1.0, 1.0, beta)).toBe(0);
    expect(particleLifeForce(1.5, 1.0, beta)).toBe(0);
  });

  it('attraction > 0 produces positive force in mid-range', () => {
    const f = particleLifeForce(0.5, 1.0, beta);
    expect(f).toBeGreaterThan(0);
  });

  it('attraction < 0 produces negative force in mid-range', () => {
    const f = particleLifeForce(0.5, -1.0, beta);
    expect(f).toBeLessThan(0);
  });

  it('attraction = 0 produces zero force in mid-range', () => {
    const f = particleLifeForce(0.5, 0, beta);
    expect(f).toBe(0);
  });
});

// ============================================================
// ParticleRenderer instantiation test
// ============================================================
describe('ParticleRenderer', () => {
  it('can be instantiated independently of simulation', () => {
    const renderer = new ParticleRenderer();
    expect(renderer).toBeDefined();
    expect(typeof renderer.render).toBe('function');
  });
});

// ============================================================
// Module separation verification
// ============================================================
describe('Module architecture', () => {
  it('SpatialHash is independently importable', async () => {
    const mod = await import('../spatial-hash');
    expect(mod.SpatialHash).toBeDefined();
  });

  it('ParticleRenderer is independently importable', async () => {
    const mod = await import('../renderer');
    expect(mod.ParticleRenderer).toBeDefined();
    expect(mod.velocityToColor).toBeDefined();
    expect(mod.densityToColor).toBeDefined();
  });

  it('simulation re-exports particleLifeForce', async () => {
    const mod = await import('../simulation');
    expect(mod.particleLifeForce).toBeDefined();
    expect(mod.ParticleSimulation).toBeDefined();
  });

  it('ParticleSimulation delegates to renderer (no render methods on class)', () => {
    const sim = new ParticleSimulation(DEFAULT_CONFIG);
    // The render method should exist and delegate
    expect(typeof sim.render).toBe('function');
    // But the class should NOT have renderFlat/renderGlow/etc as own methods
    const proto = Object.getOwnPropertyNames(Object.getPrototypeOf(sim));
    expect(proto).not.toContain('renderFlat');
    expect(proto).not.toContain('renderGlow');
    expect(proto).not.toContain('renderVelocity');
    expect(proto).not.toContain('renderDensity');
  });

  it('PARTICLE_TYPES matches expected species count', () => {
    expect(PARTICLE_TYPES).toBe(6);
  });
});

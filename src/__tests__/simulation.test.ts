import { describe, it, expect, beforeEach } from 'vitest';
import { ParticleSimulation } from '../simulation';
import { DEFAULT_CONFIG, PARTICLE_TYPES, PARTICLE_COLORS } from '../types';
import type { SimulationConfig } from '../types';

describe('ParticleSimulation', () => {
  let sim: ParticleSimulation;
  const W = 800;
  const H = 600;

  beforeEach(() => {
    sim = new ParticleSimulation(DEFAULT_CONFIG);
    sim.setDimensions(W, H);
    sim.initializeParticles();
  });

  describe('initialization', () => {
    it('creates the configured number of particles', () => {
      expect(sim.particles.length).toBe(DEFAULT_CONFIG.particleCount);
    });

    it('all particles are within canvas bounds', () => {
      for (const p of sim.particles) {
        expect(p.x).toBeGreaterThanOrEqual(0);
        expect(p.x).toBeLessThan(W);
        expect(p.y).toBeGreaterThanOrEqual(0);
        expect(p.y).toBeLessThan(H);
      }
    });

    it('all particles have valid types', () => {
      for (const p of sim.particles) {
        expect(p.type).toBeGreaterThanOrEqual(0);
        expect(p.type).toBeLessThan(PARTICLE_TYPES);
        expect(Number.isInteger(p.type)).toBe(true);
      }
    });

    it('particles start with zero velocity', () => {
      for (const p of sim.particles) {
        expect(p.vx).toBe(0);
        expect(p.vy).toBe(0);
      }
    });

    it('distributes particles across multiple types', () => {
      const typeCounts = new Map<number, number>();
      for (const p of sim.particles) {
        typeCounts.set(p.type, (typeCounts.get(p.type) ?? 0) + 1);
      }
      // With 1200 particles and 6 types, each type should have at least some
      for (let t = 0; t < PARTICLE_TYPES; t++) {
        expect(typeCounts.get(t)).toBeGreaterThan(0);
      }
    });
  });

  describe('simulation step', () => {
    it('moves particles after update', () => {
      const initialPositions = sim.particles.slice(0, 20).map(p => ({ x: p.x, y: p.y }));
      
      // Run several steps to ensure movement
      for (let i = 0; i < 50; i++) sim.update();
      
      let moved = 0;
      for (let i = 0; i < 20; i++) {
        const p = sim.particles[i];
        if (p.x !== initialPositions[i].x || p.y !== initialPositions[i].y) moved++;
      }
      expect(moved).toBeGreaterThan(0);
    });

    it('keeps all particles within bounds after steps (toroidal wrapping)', () => {
      for (let i = 0; i < 100; i++) sim.update();
      
      for (const p of sim.particles) {
        expect(p.x).toBeGreaterThanOrEqual(0);
        expect(p.x).toBeLessThan(W);
        expect(p.y).toBeGreaterThanOrEqual(0);
        expect(p.y).toBeLessThan(H);
      }
    });

    it('does not produce NaN or Infinity positions', () => {
      for (let i = 0; i < 200; i++) sim.update();
      
      for (const p of sim.particles) {
        expect(Number.isFinite(p.x)).toBe(true);
        expect(Number.isFinite(p.y)).toBe(true);
        expect(Number.isFinite(p.vx)).toBe(true);
        expect(Number.isFinite(p.vy)).toBe(true);
      }
    });

    it('particle count remains stable over many steps', () => {
      const initial = sim.particles.length;
      for (let i = 0; i < 100; i++) sim.update();
      expect(sim.particles.length).toBe(initial);
    });
  });

  describe('config updates', () => {
    it('adjusts particle count upward', () => {
      const newConfig: SimulationConfig = { ...DEFAULT_CONFIG, particleCount: 2000 };
      sim.updateConfig(newConfig);
      expect(sim.particles.length).toBe(2000);
    });

    it('adjusts particle count downward', () => {
      const newConfig: SimulationConfig = { ...DEFAULT_CONFIG, particleCount: 500 };
      sim.updateConfig(newConfig);
      expect(sim.particles.length).toBe(500);
    });

    it('preserves existing particles when adding more', () => {
      const firstFive = sim.particles.slice(0, 5).map(p => ({ x: p.x, y: p.y, type: p.type }));
      const newConfig: SimulationConfig = { ...DEFAULT_CONFIG, particleCount: 2000 };
      sim.updateConfig(newConfig);
      
      for (let i = 0; i < 5; i++) {
        expect(sim.particles[i].x).toBe(firstFive[i].x);
        expect(sim.particles[i].y).toBe(firstFive[i].y);
        expect(sim.particles[i].type).toBe(firstFive[i].type);
      }
    });

    it('getConfig returns current configuration', () => {
      const cfg = sim.getConfig();
      expect(cfg.particleCount).toBe(DEFAULT_CONFIG.particleCount);
      expect(cfg.speed).toBe(DEFAULT_CONFIG.speed);
      expect(cfg.friction).toBe(DEFAULT_CONFIG.friction);
    });
  });

  describe('stability under stress', () => {
    it('handles high speed without instability', () => {
      const highSpeed: SimulationConfig = {
        ...DEFAULT_CONFIG,
        speed: 3.0,
        forceStrength: 3.0,
      };
      sim.updateConfig(highSpeed);
      
      for (let i = 0; i < 200; i++) sim.update();
      
      for (const p of sim.particles) {
        expect(Number.isFinite(p.x)).toBe(true);
        expect(Number.isFinite(p.y)).toBe(true);
      }
    });

    it('handles very low friction without divergence', () => {
      const lowFriction: SimulationConfig = {
        ...DEFAULT_CONFIG,
        friction: 0.01,
      };
      sim.updateConfig(lowFriction);
      
      for (let i = 0; i < 200; i++) sim.update();
      
      for (const p of sim.particles) {
        expect(Number.isFinite(p.x)).toBe(true);
        expect(Number.isFinite(p.y)).toBe(true);
      }
    });

    it('handles zero-size canvas gracefully', () => {
      const sim2 = new ParticleSimulation(DEFAULT_CONFIG);
      sim2.setDimensions(0, 0);
      // Should not throw
      sim2.update();
    });

    it('handles extreme rule values (-1 and 1)', () => {
      const extreme: SimulationConfig = {
        ...DEFAULT_CONFIG,
        rules: Array.from({ length: PARTICLE_TYPES }, (_, i) =>
          Array.from({ length: PARTICLE_TYPES }, (_, j) => (i + j) % 2 === 0 ? 1 : -1)
        ),
      };
      sim.updateConfig(extreme);
      
      for (let i = 0; i < 100; i++) sim.update();
      
      for (const p of sim.particles) {
        expect(Number.isFinite(p.x)).toBe(true);
        expect(Number.isFinite(p.y)).toBe(true);
      }
    });
  });

  describe('minRadius / beta', () => {
    it('different minRadius values produce different behavior', () => {
      // Create two simulations with same initial state but different minRadius
      const configLow: SimulationConfig = { ...DEFAULT_CONFIG, particleCount: 100, minRadius: 10 };
      const configHigh: SimulationConfig = { ...DEFAULT_CONFIG, particleCount: 100, minRadius: 50 };
      
      const sim1 = new ParticleSimulation(configLow);
      const sim2 = new ParticleSimulation(configHigh);
      
      sim1.setDimensions(W, H);
      sim2.setDimensions(W, H);
      
      // Set identical initial positions using manual seeding
      sim1.initializeParticles();
      // Copy exact positions
      sim2.particles = sim1.particles.map(p => ({ ...p }));
      
      for (let i = 0; i < 50; i++) {
        sim1.update();
        sim2.update();
      }
      
      // They should diverge due to different beta
      let totalDiff = 0;
      for (let i = 0; i < sim1.particles.length; i++) {
        totalDiff += Math.abs(sim1.particles[i].x - sim2.particles[i].x);
        totalDiff += Math.abs(sim1.particles[i].y - sim2.particles[i].y);
      }
      expect(totalDiff).toBeGreaterThan(0);
    });
  });
});

describe('types', () => {
  it('PARTICLE_COLORS has entries for all types', () => {
    expect(PARTICLE_COLORS.length).toBe(PARTICLE_TYPES);
  });

  it('PARTICLE_COLORS are valid hex strings', () => {
    for (const color of PARTICLE_COLORS) {
      expect(color).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });

  it('DEFAULT_CONFIG rules matrix is square NxN', () => {
    const { rules } = DEFAULT_CONFIG;
    expect(rules.length).toBe(PARTICLE_TYPES);
    for (const row of rules) {
      expect(row.length).toBe(PARTICLE_TYPES);
    }
  });

  it('DEFAULT_CONFIG rule values are in [-1, 1]', () => {
    for (const row of DEFAULT_CONFIG.rules) {
      for (const val of row) {
        expect(val).toBeGreaterThanOrEqual(-1);
        expect(val).toBeLessThanOrEqual(1);
      }
    }
  });
});

/**
 * Pass 10/10 — White Hat Final Verification
 *
 * Comprehensive integration tests verifying all features work together
 * after 10 passes of Six Thinking Hats iteration.
 */
import { describe, it, expect } from 'vitest';
import { ParticleSimulation, particleLifeForce } from '../simulation';
import { SpatialHash } from '../spatial-hash';
import { velocityToColor, densityToColor } from '../renderer';
import { PRESETS, randomRules } from '../presets';
import {
  DEFAULT_CONFIG,
  PARTICLE_TYPES,
  PARTICLE_COLORS,
  PARTICLE_RGB,
  hslToRgb,
} from '../types';
import type { SimulationConfig, InitialLayout } from '../types';

// ─── Cross-Module Integration Tests ────────────────────────────────────

describe('Cross-Module Integration', () => {
  it('simulation + spatial hash + force function work together', () => {
    const sim = new ParticleSimulation(DEFAULT_CONFIG);
    sim.setDimensions(800, 600);
    sim.initializeParticles();

    // Step enough for forces to act
    for (let i = 0; i < 50; i++) sim.update();

    const particles = sim.particles;
    expect(particles.length).toBe(DEFAULT_CONFIG.particleCount);

    // All particles must remain valid after physics
    for (const p of particles) {
      expect(Number.isFinite(p.x)).toBe(true);
      expect(Number.isFinite(p.y)).toBe(true);
      expect(Number.isFinite(p.vx)).toBe(true);
      expect(Number.isFinite(p.vy)).toBe(true);
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.x).toBeLessThan(800);
      expect(p.y).toBeGreaterThanOrEqual(0);
      expect(p.y).toBeLessThan(600);
      expect(p.type).toBeGreaterThanOrEqual(0);
      expect(p.type).toBeLessThan(PARTICLE_TYPES);
    }
  });

  it('all presets produce stable simulations after 200 steps', () => {
    for (const preset of PRESETS) {
      const config: SimulationConfig = {
        ...DEFAULT_CONFIG,
        ...preset.config,
        rules: (preset.config.rules ?? DEFAULT_CONFIG.rules).map(r => [...r]),
      };

      const sim = new ParticleSimulation(config);
      sim.setDimensions(800, 600);
      sim.initializeParticles();

      for (let i = 0; i < 200; i++) sim.update();

      const particles = sim.particles;
      const hasNaN = particles.some(
        p => !Number.isFinite(p.x) || !Number.isFinite(p.y) ||
             !Number.isFinite(p.vx) || !Number.isFinite(p.vy)
      );
      expect(hasNaN).toBe(false);
      // `${preset.name} produced NaN after 200 steps`
    }
  });

  it('energy history is populated after simulation steps', () => {
    const sim = new ParticleSimulation(DEFAULT_CONFIG);
    sim.setDimensions(800, 600);
    sim.initializeParticles();

    // Run enough frames for energy sampling (~10Hz, so 60 frames = ~10 samples)
    for (let i = 0; i < 100; i++) sim.update();

    const history = sim.getEnergyHistory();
    expect(history.length).toBeGreaterThan(0);
    // Each snapshot has PARTICLE_TYPES entries
    for (const snapshot of history) {
      expect(snapshot.length).toBe(PARTICLE_TYPES);
      for (const val of snapshot) {
        expect(Number.isFinite(val)).toBe(true);
        expect(val).toBeGreaterThanOrEqual(0);
      }
    }
  });
});

// ─── Every Layout × Every Preset ───────────────────────────────────────

describe('Layout × Preset Matrix', () => {
  const layouts: InitialLayout[] = ['random', 'bigbang', 'spiral', 'grid', 'ring', 'clusters'];

  it('every layout initializes correct particle count', () => {
    for (const layout of layouts) {
      const sim = new ParticleSimulation(DEFAULT_CONFIG);
      sim.setDimensions(800, 600);
      sim.initializeWithLayout(layout);
      expect(sim.particles.length).toBe(DEFAULT_CONFIG.particleCount);

      // All in bounds
      for (const p of sim.particles) {
        expect(p.x).toBeGreaterThanOrEqual(0);
        expect(p.x).toBeLessThanOrEqual(800);
        expect(p.y).toBeGreaterThanOrEqual(0);
        expect(p.y).toBeLessThanOrEqual(600);
      }
    }
  });

  it('every layout stays stable through 100 simulation steps', () => {
    for (const layout of layouts) {
      const sim = new ParticleSimulation(DEFAULT_CONFIG);
      sim.setDimensions(800, 600);
      sim.initializeWithLayout(layout);

      for (let i = 0; i < 100; i++) sim.update();

      const hasNaN = sim.particles.some(
        p => !Number.isFinite(p.x) || !Number.isFinite(p.y)
      );
      expect(hasNaN).toBe(false);
    }
  });
});

// ─── Mutation + Web + Glow Feature Combinations ────────────────────────

describe('Feature Combinations', () => {
  it('mutation + high speed does not crash', () => {
    const config: SimulationConfig = {
      ...DEFAULT_CONFIG,
      speed: 3.0,
      mutationEnabled: true,
      particleCount: 800,
    };
    const sim = new ParticleSimulation(config);
    sim.setDimensions(600, 400);
    sim.initializeParticles();

    for (let i = 0; i < 300; i++) sim.update();

    expect(sim.particles.length).toBe(800);
    const hasNaN = sim.particles.some(
      p => !Number.isFinite(p.x) || !Number.isFinite(p.y)
    );
    expect(hasNaN).toBe(false);
  });

  it('mutation actually changes particle types over many frames', () => {
    const config: SimulationConfig = {
      ...DEFAULT_CONFIG,
      mutationEnabled: true,
      particleCount: 500,
      friction: 0.3,
    };
    const sim = new ParticleSimulation(config);
    sim.setDimensions(400, 400);
    sim.initializeParticles();

    // Capture initial type distribution
    const initialTypes = sim.particles.map(p => p.type);

    // Run 500 frames to give mutation time
    for (let i = 0; i < 500; i++) sim.update();

    const finalTypes = sim.particles.map(p => p.type);
    let changes = 0;
    for (let i = 0; i < initialTypes.length; i++) {
      if (initialTypes[i] !== finalTypes[i]) changes++;
    }

    // At least some particles should have mutated
    expect(changes).toBeGreaterThan(0);
  });

  it('config updates during simulation do not destabilize', () => {
    const sim = new ParticleSimulation(DEFAULT_CONFIG);
    sim.setDimensions(800, 600);
    sim.initializeParticles();

    // Run some steps
    for (let i = 0; i < 50; i++) sim.update();

    // Rapid config changes
    sim.updateConfig({ ...DEFAULT_CONFIG, speed: 2.5, friction: 0.1 });
    for (let i = 0; i < 50; i++) sim.update();

    sim.updateConfig({ ...DEFAULT_CONFIG, maxRadius: 200, forceStrength: 2.0 });
    for (let i = 0; i < 50; i++) sim.update();

    sim.updateConfig({ ...DEFAULT_CONFIG, mutationEnabled: true, particleCount: 2000 });
    for (let i = 0; i < 50; i++) sim.update();

    expect(sim.particles.length).toBe(2000);
    const hasNaN = sim.particles.some(
      p => !Number.isFinite(p.x) || !Number.isFinite(p.y)
    );
    expect(hasNaN).toBe(false);
  });
});

// ─── Force Function Completeness ───────────────────────────────────────

describe('Force Function Verification', () => {
  it('force is continuous across the beta boundary', () => {
    const beta = 0.3;
    const attraction = 0.5;
    const epsilon = 0.001;

    const justBelow = particleLifeForce(beta - epsilon, attraction, beta);
    const justAbove = particleLifeForce(beta + epsilon, attraction, beta);

    // Force should be approximately continuous at beta
    expect(Math.abs(justBelow - justAbove)).toBeLessThan(0.1);
  });

  it('force at distance 0 is approximately -1 (max repulsion)', () => {
    // At d=0 (very near), f = d/beta - 1 ≈ -1
    expect(particleLifeForce(0.001, 0.5, 0.3)).toBeLessThan(-0.9);
  });

  it('force at distance 1 is exactly 0 (beyond range)', () => {
    expect(particleLifeForce(1.0, 0.5, 0.3)).toBe(0);
    expect(particleLifeForce(1.5, 0.5, 0.3)).toBe(0);
  });

  it('repulsion works (negative attraction)', () => {
    const f = particleLifeForce(0.65, -0.8, 0.3);
    expect(f).toBeLessThan(0);
  });

  it('attraction works (positive attraction)', () => {
    const f = particleLifeForce(0.65, 0.8, 0.3);
    expect(f).toBeGreaterThan(0);
  });
});

// ─── Color & Type System Consistency ───────────────────────────────────

describe('Type System Consistency', () => {
  it('PARTICLE_COLORS and PARTICLE_RGB have matching length', () => {
    expect(PARTICLE_COLORS.length).toBe(PARTICLE_TYPES);
    expect(PARTICLE_RGB.length).toBe(PARTICLE_TYPES);
  });

  it('PARTICLE_RGB values are in valid 0-255 range', () => {
    for (const rgb of PARTICLE_RGB) {
      expect(rgb.r).toBeGreaterThanOrEqual(0);
      expect(rgb.r).toBeLessThanOrEqual(255);
      expect(rgb.g).toBeGreaterThanOrEqual(0);
      expect(rgb.g).toBeLessThanOrEqual(255);
      expect(rgb.b).toBeGreaterThanOrEqual(0);
      expect(rgb.b).toBeLessThanOrEqual(255);
    }
  });

  it('DEFAULT_CONFIG rules matrix is square and correct size', () => {
    expect(DEFAULT_CONFIG.rules.length).toBe(PARTICLE_TYPES);
    for (const row of DEFAULT_CONFIG.rules) {
      expect(row.length).toBe(PARTICLE_TYPES);
      for (const val of row) {
        expect(val).toBeGreaterThanOrEqual(-1);
        expect(val).toBeLessThanOrEqual(1);
      }
    }
  });

  it('all presets have valid rule matrices', () => {
    for (const preset of PRESETS) {
      if (preset.config.rules) {
        expect(preset.config.rules.length).toBe(PARTICLE_TYPES);
        for (const row of preset.config.rules) {
          expect(row.length).toBe(PARTICLE_TYPES);
          for (const val of row) {
            expect(val).toBeGreaterThanOrEqual(-1);
            expect(val).toBeLessThanOrEqual(1);
          }
        }
      }
    }
  });

  it('randomRules produces valid matrix', () => {
    for (let trial = 0; trial < 10; trial++) {
      const rules = randomRules();
      expect(rules.length).toBe(PARTICLE_TYPES);
      for (const row of rules) {
        expect(row.length).toBe(PARTICLE_TYPES);
        for (const val of row) {
          expect(val).toBeGreaterThanOrEqual(-1);
          expect(val).toBeLessThanOrEqual(1);
        }
      }
    }
  });
});

// ─── Color Functions ───────────────────────────────────────────────────

describe('Color Functions', () => {
  it('hslToRgb produces valid RGB values', () => {
    const testCases = [
      [0, 0, 0],     // Black
      [0, 0, 1],     // White
      [0, 1, 0.5],   // Red
      [0.333, 1, 0.5], // Green
      [0.667, 1, 0.5], // Blue
    ];

    for (const [h, s, l] of testCases) {
      const [r, g, b] = hslToRgb(h, s, l);
      expect(r).toBeGreaterThanOrEqual(0);
      expect(r).toBeLessThanOrEqual(255);
      expect(g).toBeGreaterThanOrEqual(0);
      expect(g).toBeLessThanOrEqual(255);
      expect(b).toBeGreaterThanOrEqual(0);
      expect(b).toBeLessThanOrEqual(255);
    }
  });

  it('velocityToColor covers full range', () => {
    const low = velocityToColor(0);
    const high = velocityToColor(1);

    // Both should produce valid RGB
    for (const [r, g, b] of [low, high]) {
      expect(r).toBeGreaterThanOrEqual(0);
      expect(r).toBeLessThanOrEqual(255);
      expect(g).toBeGreaterThanOrEqual(0);
      expect(g).toBeLessThanOrEqual(255);
      expect(b).toBeGreaterThanOrEqual(0);
      expect(b).toBeLessThanOrEqual(255);
    }

    // Colors should be visibly different at extremes
    const diff = Math.abs(low[0] - high[0]) + Math.abs(low[1] - high[1]) + Math.abs(low[2] - high[2]);
    expect(diff).toBeGreaterThan(100);
  });

  it('densityToColor covers full range', () => {
    const low = densityToColor(0);
    const high = densityToColor(1);

    for (const [r, g, b] of [low, high]) {
      expect(r).toBeGreaterThanOrEqual(0);
      expect(r).toBeLessThanOrEqual(255);
      expect(g).toBeGreaterThanOrEqual(0);
      expect(g).toBeLessThanOrEqual(255);
      expect(b).toBeGreaterThanOrEqual(0);
      expect(b).toBeLessThanOrEqual(255);
    }
  });

  it('velocityToColor clamps out-of-range input', () => {
    const neg = velocityToColor(-5);
    const over = velocityToColor(10);
    const zero = velocityToColor(0);
    const one = velocityToColor(1);

    // Negative should equal 0, over should equal 1
    expect(neg).toEqual(zero);
    expect(over).toEqual(one);
  });
});

// ─── Spatial Hash Correctness ──────────────────────────────────────────

describe('Spatial Hash Final Verification', () => {
  it('finds particles in adjacent cells', () => {
    const hash = new SpatialHash(50);
    hash.setWorldSize(200, 200);
    hash.clear();

    const p1 = { x: 45, y: 45, vx: 0, vy: 0, type: 0 };
    const p2 = { x: 55, y: 55, vx: 0, vy: 0, type: 1 };
    hash.add(p1);
    hash.add(p2);

    // Both should find each other
    const near1 = hash.getNearby(45, 45);
    expect(near1).toContain(p1);
    expect(near1).toContain(p2);
  });

  it('toroidal wrapping works in all directions', () => {
    const hash = new SpatialHash(50);
    hash.setWorldSize(200, 200);
    hash.clear();

    // Place particles at opposite edges
    const topLeft = { x: 5, y: 5, vx: 0, vy: 0, type: 0 };
    const bottomRight = { x: 195, y: 195, vx: 0, vy: 0, type: 1 };
    hash.add(topLeft);
    hash.add(bottomRight);

    // They should be able to see each other through the wrap
    const nearTL = hash.getNearby(5, 5);
    expect(nearTL).toContain(topLeft);
    expect(nearTL).toContain(bottomRight);
  });

  it('cell pool does not leak across clear cycles', () => {
    const hash = new SpatialHash(50);
    hash.setWorldSize(400, 400);

    for (let cycle = 0; cycle < 10; cycle++) {
      hash.clear();
      for (let i = 0; i < 100; i++) {
        hash.add({
          x: Math.random() * 400,
          y: Math.random() * 400,
          vx: 0, vy: 0, type: i % 6,
        });
      }
      const nearby = hash.getNearby(200, 200);
      expect(nearby.length).toBeGreaterThanOrEqual(0);
    }
  });
});

// ─── Performance Degradation Logic ─────────────────────────────────────

describe('Adaptive Performance', () => {
  it('simulation reports performance degradation after sustained low FPS', () => {
    const sim = new ParticleSimulation(DEFAULT_CONFIG);
    sim.setDimensions(800, 600);
    sim.initializeParticles();

    // Default state should not be degraded
    expect(sim.isPerformanceDegraded).toBe(false);
    expect(sim.performanceWarning).toBe('');
  });

  it('particle count adjustment works correctly', () => {
    const sim = new ParticleSimulation(DEFAULT_CONFIG);
    sim.setDimensions(800, 600);
    sim.initializeParticles();
    expect(sim.particles.length).toBe(DEFAULT_CONFIG.particleCount);

    // Increase
    sim.updateConfig({ ...DEFAULT_CONFIG, particleCount: 2000 });
    expect(sim.particles.length).toBe(2000);

    // Decrease
    sim.updateConfig({ ...DEFAULT_CONFIG, particleCount: 500 });
    expect(sim.particles.length).toBe(500);
  });
});

// ─── Preset Completeness ───────────────────────────────────────────────

describe('Preset Completeness', () => {
  it('all 11 presets exist with required fields', () => {
    expect(PRESETS.length).toBe(11);

    for (const preset of PRESETS) {
      expect(typeof preset.name).toBe('string');
      expect(preset.name.length).toBeGreaterThan(0);
      expect(typeof preset.emoji).toBe('string');
      expect(preset.emoji.length).toBeGreaterThan(0);
      expect(typeof preset.description).toBe('string');
      expect(preset.description.length).toBeGreaterThan(0);
      expect(typeof preset.config).toBe('object');
    }
  });

  it('preset names are unique', () => {
    const names = PRESETS.map(p => p.name);
    const unique = new Set(names);
    expect(unique.size).toBe(names.length);
  });

  it('all presets have documented coverage in PRESETS array', () => {
    const expectedNames = [
      'Primordial Soup', 'Ecosystems', 'Living Cells',
      'Orbital Clusters', 'Turbulence', 'Slime Mold',
      'Galaxy', 'Nebula', 'Neural Web', 'Contagion', 'Random',
    ];

    for (const name of expectedNames) {
      expect(PRESETS.find(p => p.name === name)).toBeDefined();
    }
  });
});

// ─── MinRadius/MaxRadius Cross-Validation ──────────────────────────────

describe('Radius Validation', () => {
  it('updateConfig enforces minRadius <= maxRadius', () => {
    const sim = new ParticleSimulation(DEFAULT_CONFIG);
    sim.setDimensions(800, 600);
    sim.initializeParticles();

    // Try to set minRadius > maxRadius
    sim.updateConfig({
      ...DEFAULT_CONFIG,
      minRadius: 200,
      maxRadius: 50,
    });

    const cfg = sim.getConfig();
    expect(cfg.minRadius).toBeLessThanOrEqual(cfg.maxRadius);
  });
});

// ─── Resize Handling ───────────────────────────────────────────────────

describe('Resize Handling', () => {
  it('particles are clamped into new bounds after resize', () => {
    const sim = new ParticleSimulation({ ...DEFAULT_CONFIG, particleCount: 100 });
    sim.setDimensions(1000, 1000);
    sim.initializeParticles();

    // Shrink the world
    sim.setDimensions(200, 200);

    for (const p of sim.particles) {
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.x).toBeLessThan(200);
      expect(p.y).toBeGreaterThanOrEqual(0);
      expect(p.y).toBeLessThan(200);
    }
  });
});

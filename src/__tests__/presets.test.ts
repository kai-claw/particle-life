import { describe, it, expect } from 'vitest';
import { PRESETS } from '../presets';
import { PARTICLE_TYPES, DEFAULT_CONFIG } from '../types';
import { ParticleSimulation } from '../simulation';

describe('presets', () => {
  it('has at least 5 presets', () => {
    expect(PRESETS.length).toBeGreaterThanOrEqual(5);
  });

  it('all presets have name, emoji, and description', () => {
    for (const preset of PRESETS) {
      expect(preset.name).toBeTruthy();
      expect(preset.emoji).toBeTruthy();
      expect(preset.description).toBeTruthy();
    }
  });

  it('all presets have unique names', () => {
    const names = PRESETS.map(p => p.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('preset rules are valid NxN matrices', () => {
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

  it('all presets produce stable simulations (100 steps)', () => {
    const W = 800, H = 600;
    
    for (const preset of PRESETS) {
      const config = { ...DEFAULT_CONFIG, ...preset.config };
      // Use smaller particle count for speed
      config.particleCount = Math.min(config.particleCount, 200);
      
      const sim = new ParticleSimulation(config);
      sim.setDimensions(W, H);
      sim.initializeParticles();
      
      for (let i = 0; i < 100; i++) sim.update();
      
      for (const p of sim.particles) {
        expect(Number.isFinite(p.x)).toBe(true);
        expect(Number.isFinite(p.y)).toBe(true);
        expect(Number.isFinite(p.vx)).toBe(true);
        expect(Number.isFinite(p.vy)).toBe(true);
      }
    }
  });

  it('preset configs merge cleanly with DEFAULT_CONFIG', () => {
    for (const preset of PRESETS) {
      const merged = { ...DEFAULT_CONFIG, ...preset.config };
      // All required fields should exist
      expect(typeof merged.particleCount).toBe('number');
      expect(typeof merged.speed).toBe('number');
      expect(typeof merged.friction).toBe('number');
      expect(typeof merged.maxRadius).toBe('number');
      expect(typeof merged.minRadius).toBe('number');
      expect(typeof merged.forceStrength).toBe('number');
      expect(typeof merged.trailEffect).toBe('number');
      expect(typeof merged.particleSize).toBe('number');
      expect(Array.isArray(merged.rules)).toBe(true);
    }
  });
});

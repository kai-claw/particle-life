import type { Particle, SimulationConfig } from './types';
import { PARTICLE_TYPES, PARTICLE_COLORS } from './types';

/**
 * Spatial hash grid for O(n) neighbor lookups instead of O(n²).
 */
class SpatialHash {
  private cellSize: number;
  private grid: Map<number, Particle[]>;
  constructor(cellSize: number, _w: number, _h: number) {
    this.cellSize = Math.max(cellSize, 1);
    this.grid = new Map();
  }

  clear() {
    this.grid.clear();
  }

  private key(cx: number, cy: number): number {
    // Pack two 16-bit ints into one number — avoids string keys
    return ((cx & 0xffff) << 16) | (cy & 0xffff);
  }

  add(p: Particle) {
    const cx = Math.floor(p.x / this.cellSize);
    const cy = Math.floor(p.y / this.cellSize);
    const k = this.key(cx, cy);
    let list = this.grid.get(k);
    if (!list) {
      list = [];
      this.grid.set(k, list);
    }
    list.push(p);
  }

  getNearby(x: number, y: number): Particle[] {
    const cx = Math.floor(x / this.cellSize);
    const cy = Math.floor(y / this.cellSize);
    const out: Particle[] = [];
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const list = this.grid.get(this.key(cx + dx, cy + dy));
        if (list) {
          for (let i = 0; i < list.length; i++) out.push(list[i]);
        }
      }
    }
    return out;
  }
}

/**
 * The standard Particle Life force function.
 * 
 * At very close range (d < beta) → repulsion that prevents overlap.
 * At medium range (beta < d < 1) → attraction or repulsion based on the rule value.
 * Beyond the radius → no force.
 * 
 * This is what creates the beautiful emergent organic structures.
 */
function particleLifeForce(normalizedDist: number, attraction: number): number {
  const beta = 0.3; // boundary between repulsion and attraction zones

  if (normalizedDist < beta) {
    // Strong repulsion at close range, linearly goes from -1 to 0
    return normalizedDist / beta - 1;
  }

  if (normalizedDist < 1.0) {
    // Bell curve shaped attraction/repulsion
    // Peaks at midpoint between beta and 1.0
    return attraction * (1 - Math.abs(2 * normalizedDist - 1 - beta) / (1 - beta));
  }

  return 0;
}

export class ParticleSimulation {
  particles: Particle[] = [];
  private config: SimulationConfig;
  private width: number = 0;
  private height: number = 0;
  private spatialHash: SpatialHash | null = null;
  private frameCount: number = 0;
  private lastFpsTime: number = 0;
  fps: number = 0;

  constructor(config: SimulationConfig) {
    this.config = { ...config, rules: config.rules.map(r => [...r]) };
  }

  setDimensions(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.spatialHash = new SpatialHash(this.config.maxRadius, width, height);
  }

  updateConfig(newConfig: SimulationConfig) {
    const oldCount = this.config.particleCount;
    this.config = { ...newConfig, rules: newConfig.rules.map(r => [...r]) };

    if (this.width > 0) {
      this.spatialHash = new SpatialHash(this.config.maxRadius, this.width, this.height);
    }

    // Only adjust particles if count actually changed
    if (this.particles.length > 0 && oldCount !== newConfig.particleCount) {
      this.adjustParticleCount(newConfig.particleCount);
    }
  }

  private adjustParticleCount(target: number) {
    const current = this.particles.length;
    if (target > current) {
      // Add particles
      for (let i = current; i < target; i++) {
        this.particles.push({
          x: Math.random() * this.width,
          y: Math.random() * this.height,
          vx: 0,
          vy: 0,
          type: Math.floor(Math.random() * PARTICLE_TYPES),
        });
      }
    } else if (target < current) {
      // Remove excess (from the end)
      this.particles.length = target;
    }
  }

  initializeParticles() {
    this.particles = [];
    for (let i = 0; i < this.config.particleCount; i++) {
      this.particles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: 0,
        vy: 0,
        type: Math.floor(Math.random() * PARTICLE_TYPES),
      });
    }
  }

  update() {
    if (!this.spatialHash || this.width === 0) return;

    // FPS tracking
    this.frameCount++;
    const now = performance.now();
    if (now - this.lastFpsTime >= 1000) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.lastFpsTime = now;
    }

    const hash = this.spatialHash;
    const { speed, friction, maxRadius, forceStrength, rules } = this.config;
    const w = this.width;
    const h = this.height;
    const halfW = w / 2;
    const halfH = h / 2;
    const rSq = maxRadius * maxRadius;
    const invR = 1 / maxRadius;
    const dt = speed * 0.5; // timestep scaled by speed

    // Rebuild spatial hash
    hash.clear();
    const particles = this.particles;
    for (let i = 0; i < particles.length; i++) {
      hash.add(particles[i]);
    }

    // Update forces
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const nearby = hash.getNearby(p.x, p.y);
      const pRules = rules[p.type];

      let fx = 0;
      let fy = 0;

      for (let j = 0; j < nearby.length; j++) {
        const other = nearby[j];
        if (other === p) continue;

        // Distance with toroidal wrapping
        let dx = other.x - p.x;
        let dy = other.y - p.y;

        if (dx > halfW) dx -= w;
        else if (dx < -halfW) dx += w;
        if (dy > halfH) dy -= h;
        else if (dy < -halfH) dy += h;

        const dSq = dx * dx + dy * dy;
        if (dSq >= rSq || dSq < 0.01) continue;

        const d = Math.sqrt(dSq);
        const nd = d * invR; // normalized distance 0..1
        const attraction = pRules[other.type];
        const f = particleLifeForce(nd, attraction) * forceStrength;

        fx += (dx / d) * f;
        fy += (dy / d) * f;
      }

      // Apply forces
      p.vx = p.vx * (1 - friction) + fx * dt;
      p.vy = p.vy * (1 - friction) + fy * dt;
    }

    // Move particles
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;

      // Wrap toroidally
      if (p.x < 0) p.x += w;
      else if (p.x >= w) p.x -= w;
      if (p.y < 0) p.y += h;
      else if (p.y >= h) p.y -= h;
    }
  }

  render(ctx: CanvasRenderingContext2D) {
    const { trailEffect, particleSize } = this.config;
    const w = this.width;
    const h = this.height;

    // Trail/clear
    if (trailEffect > 0) {
      ctx.fillStyle = `rgba(0, 0, 0, ${trailEffect})`;
      ctx.fillRect(0, 0, w, h);
    } else {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, w, h);
    }

    // Batch render by type for fewer state changes
    for (let t = 0; t < PARTICLE_TYPES; t++) {
      ctx.fillStyle = PARTICLE_COLORS[t];
      ctx.beginPath();

      for (let i = 0; i < this.particles.length; i++) {
        const p = this.particles[i];
        if (p.type !== t) continue;
        ctx.moveTo(p.x + particleSize, p.y);
        ctx.arc(p.x, p.y, particleSize, 0, Math.PI * 2);
      }

      ctx.fill();
    }
  }

  getConfig(): SimulationConfig {
    return this.config;
  }
}

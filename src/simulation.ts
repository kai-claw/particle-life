import type { Particle, SimulationConfig, MouseForce, InitialLayout } from './types';
import { PARTICLE_TYPES } from './types';
import { SpatialHash } from './spatial-hash';
import { ParticleRenderer } from './renderer';

/**
 * The standard Particle Life force function.
 *
 * At very close range (d < beta) → repulsion that prevents overlap.
 * At medium range (beta < d < 1) → attraction or repulsion based on the rule value.
 * Beyond the radius → no force.
 */
export function particleLifeForce(normalizedDist: number, attraction: number, beta: number): number {
  if (normalizedDist < beta) {
    return normalizedDist / beta - 1;
  }

  if (normalizedDist < 1.0) {
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
  private renderer = new ParticleRenderer();
  private frameCount: number = 0;
  private lastFpsTime: number = 0;
  fps: number = 0;

  // Mouse interaction force
  mouseForce: MouseForce = { active: false, x: 0, y: 0, radius: 150, strength: 0 };

  // Energy history for species chart (ring buffer, last 200 snapshots)
  private energyHistory: number[][] = [];
  private energyHistoryMax = 200;
  private energySampleCounter = 0;

  // Per-particle neighbor count cache (for density color mode)
  private neighborCounts: Float32Array = new Float32Array(0);

  // Pre-computed velocity color cache per frame
  private maxSpeedObserved: number = 1;

  constructor(config: SimulationConfig) {
    this.config = { ...config, rules: config.rules.map(r => [...r]) };
  }

  setDimensions(width: number, height: number) {
    this.width = width;
    this.height = height;
    const hash = new SpatialHash(this.config.maxRadius);
    hash.setWorldSize(width, height);
    this.spatialHash = hash;

    // Clamp existing particles into new bounds (prevents out-of-bounds on resize)
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      if (width > 0) {
        if (p.x < 0) p.x = 0;
        else if (p.x >= width) p.x = width - 1;
      }
      if (height > 0) {
        if (p.y < 0) p.y = 0;
        else if (p.y >= height) p.y = height - 1;
      }
    }
  }

  updateConfig(newConfig: SimulationConfig) {
    const oldCount = this.config.particleCount;

    // Enforce minRadius <= maxRadius to prevent broken force function
    const safeConfig = { ...newConfig };
    if (safeConfig.minRadius > safeConfig.maxRadius) {
      safeConfig.minRadius = safeConfig.maxRadius * 0.3;
    }

    this.config = { ...safeConfig, rules: safeConfig.rules.map(r => [...r]) };

    if (this.width > 0) {
      const hash = new SpatialHash(this.config.maxRadius);
      hash.setWorldSize(this.width, this.height);
      this.spatialHash = hash;
    }

    // Only adjust particles if count actually changed
    if (this.particles.length > 0 && oldCount !== newConfig.particleCount) {
      this.adjustParticleCount(newConfig.particleCount);
    }
  }

  private adjustParticleCount(target: number) {
    const current = this.particles.length;
    if (target > current) {
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
      this.particles.length = target;
    }
  }

  /** Initialize particles with random positions (default) */
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

  /**
   * Initialize particles with a specific spatial layout.
   * Creates visually striking starting configurations.
   */
  initializeWithLayout(layout: InitialLayout) {
    const n = this.config.particleCount;
    const w = this.width;
    const h = this.height;
    const cx = w / 2;
    const cy = h / 2;
    this.particles = [];

    switch (layout) {
      case 'bigbang': {
        const spread = Math.min(w, h) * 0.03;
        for (let i = 0; i < n; i++) {
          const angle = Math.random() * Math.PI * 2;
          const dist = Math.random() * spread;
          const speed = 0.5 + Math.random() * 2;
          this.particles.push({
            x: cx + Math.cos(angle) * dist,
            y: cy + Math.sin(angle) * dist,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            type: Math.floor(Math.random() * PARTICLE_TYPES),
          });
        }
        break;
      }

      case 'spiral': {
        const maxR = Math.min(w, h) * 0.4;
        const goldenAngle = Math.PI * (3 - Math.sqrt(5));
        for (let i = 0; i < n; i++) {
          const t = i / n;
          const r = maxR * Math.sqrt(t);
          const angle = i * goldenAngle;
          const tangentSpeed = 0.3 + t * 0.5;
          this.particles.push({
            x: cx + Math.cos(angle) * r,
            y: cy + Math.sin(angle) * r,
            vx: Math.cos(angle + Math.PI / 2) * tangentSpeed,
            vy: Math.sin(angle + Math.PI / 2) * tangentSpeed,
            type: Math.floor(i / (n / PARTICLE_TYPES)) % PARTICLE_TYPES,
          });
        }
        break;
      }

      case 'grid': {
        const cols = Math.ceil(Math.sqrt(n * (w / h)));
        const rows = Math.ceil(n / cols);
        const spacingX = w / (cols + 1);
        const spacingY = h / (rows + 1);
        for (let i = 0; i < n; i++) {
          const col = i % cols;
          const row = Math.floor(i / cols);
          this.particles.push({
            x: spacingX * (col + 1),
            y: spacingY * (row + 1),
            vx: 0,
            vy: 0,
            type: (col + row) % PARTICLE_TYPES,
          });
        }
        break;
      }

      case 'ring': {
        const rings = PARTICLE_TYPES;
        const perRing = Math.floor(n / rings);
        const maxRingR = Math.min(w, h) * 0.4;
        let idx = 0;
        for (let ring = 0; ring < rings; ring++) {
          const r = maxRingR * (ring + 1) / rings;
          const count = ring < rings - 1 ? perRing : n - idx;
          for (let j = 0; j < count && idx < n; j++, idx++) {
            const angle = (j / count) * Math.PI * 2 + ring * 0.5;
            const tangentSpeed = 0.2 + ring * 0.15;
            this.particles.push({
              x: cx + Math.cos(angle) * r,
              y: cy + Math.sin(angle) * r,
              vx: Math.cos(angle + Math.PI / 2) * tangentSpeed,
              vy: Math.sin(angle + Math.PI / 2) * tangentSpeed,
              type: ring,
            });
          }
        }
        break;
      }

      case 'clusters': {
        const clusterCenters: { x: number; y: number }[] = [];
        const margin = Math.min(w, h) * 0.15;
        for (let t = 0; t < PARTICLE_TYPES; t++) {
          clusterCenters.push({
            x: margin + Math.random() * (w - 2 * margin),
            y: margin + Math.random() * (h - 2 * margin),
          });
        }
        const clusterRadius = Math.min(w, h) * 0.08;
        for (let i = 0; i < n; i++) {
          const t = i % PARTICLE_TYPES;
          const cc = clusterCenters[t];
          const angle = Math.random() * Math.PI * 2;
          const dist = Math.random() * clusterRadius;
          this.particles.push({
            x: ((cc.x + Math.cos(angle) * dist) % w + w) % w,
            y: ((cc.y + Math.sin(angle) * dist) % h + h) % h,
            vx: (Math.random() - 0.5) * 0.3,
            vy: (Math.random() - 0.5) * 0.3,
            type: t,
          });
        }
        break;
      }

      default:
        this.initializeParticles();
        return;
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
    const { speed, friction, maxRadius, minRadius, forceStrength, rules, colorMode } = this.config;
    const w = this.width;
    const h = this.height;
    const halfW = w / 2;
    const halfH = h / 2;
    const rSq = maxRadius * maxRadius;
    const invR = 1 / maxRadius;
    const beta = Math.max(0.01, Math.min(0.99, minRadius / maxRadius));
    const dt = speed * 0.5;

    // Rebuild spatial hash
    hash.clear();
    const particles = this.particles;
    for (let i = 0; i < particles.length; i++) {
      hash.add(particles[i]);
    }

    // Mouse force state
    const mf = this.mouseForce;
    const mfActive = mf.active && mf.strength !== 0;
    const mfRadSq = mf.radius * mf.radius;

    // Ensure neighbor count array is big enough for density mode
    const trackDensity = colorMode === 'density';
    if (trackDensity && this.neighborCounts.length < particles.length) {
      this.neighborCounts = new Float32Array(particles.length);
    }

    // Update forces
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const nearby = hash.getNearby(p.x, p.y);
      const pRules = rules[p.type];

      let fx = 0;
      let fy = 0;
      let neighborCount = 0;

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
        const nd = d * invR;
        const attraction = pRules[other.type];
        const f = particleLifeForce(nd, attraction, beta) * forceStrength;

        fx += (dx / d) * f;
        fy += (dy / d) * f;
        neighborCount++;
      }

      // Mouse force — attract/repel particles toward/from cursor
      if (mfActive) {
        const mdx = mf.x - p.x;
        const mdy = mf.y - p.y;
        const mdSq = mdx * mdx + mdy * mdy;
        if (mdSq < mfRadSq && mdSq > 1) {
          const md = Math.sqrt(mdSq);
          const falloff = 1 - md / mf.radius;
          const mfStrength = mf.strength * falloff * 3;
          fx += (mdx / md) * mfStrength;
          fy += (mdy / md) * mfStrength;
        }
      }

      // Apply forces
      p.vx = p.vx * (1 - friction) + fx * dt;
      p.vy = p.vy * (1 - friction) + fy * dt;

      if (trackDensity) {
        this.neighborCounts[i] = neighborCount;
      }
    }

    // Move particles with safety guards
    const maxVel = maxRadius * 0.5;
    let maxSpd = 0;
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];

      if (p.vx > maxVel) p.vx = maxVel;
      else if (p.vx < -maxVel) p.vx = -maxVel;
      if (p.vy > maxVel) p.vy = maxVel;
      else if (p.vy < -maxVel) p.vy = -maxVel;

      if (!Number.isFinite(p.vx) || !Number.isFinite(p.vy)) {
        p.vx = 0;
        p.vy = 0;
      }

      const spd = p.vx * p.vx + p.vy * p.vy;
      if (spd > maxSpd) maxSpd = spd;

      p.x += p.vx;
      p.y += p.vy;

      if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) {
        p.x = Math.random() * w;
        p.y = Math.random() * h;
        p.vx = 0;
        p.vy = 0;
        continue;
      }

      p.x = ((p.x % w) + w) % w;
      p.y = ((p.y % h) + h) % h;
    }

    // Smooth max speed tracking (exponential moving average for stable colors)
    const observedMax = Math.sqrt(maxSpd);
    this.maxSpeedObserved = this.maxSpeedObserved * 0.95 + observedMax * 0.05;
    if (this.maxSpeedObserved < 0.1) this.maxSpeedObserved = 0.1;

    // Sample species energy every 6 frames (~10Hz)
    this.energySampleCounter++;
    if (this.energySampleCounter >= 6) {
      this.energySampleCounter = 0;
      this.sampleEnergy();
    }
  }

  /** Compute average kinetic energy per species */
  private sampleEnergy() {
    const counts = new Float64Array(PARTICLE_TYPES);
    const energy = new Float64Array(PARTICLE_TYPES);
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      counts[p.type]++;
      energy[p.type] += Math.sqrt(p.vx * p.vx + p.vy * p.vy);
    }
    const snapshot: number[] = [];
    for (let t = 0; t < PARTICLE_TYPES; t++) {
      snapshot.push(counts[t] > 0 ? energy[t] / counts[t] : 0);
    }
    this.energyHistory.push(snapshot);
    if (this.energyHistory.length > this.energyHistoryMax) {
      this.energyHistory.shift();
    }
  }

  /** Get species energy history for DynamicsChart */
  getEnergyHistory(): number[][] {
    return this.energyHistory;
  }

  /** Delegate rendering to the dedicated ParticleRenderer */
  render(ctx: CanvasRenderingContext2D) {
    this.renderer.render(
      ctx,
      this.particles,
      this.config,
      this.width,
      this.height,
      this.mouseForce,
      this.maxSpeedObserved,
      this.neighborCounts,
    );
  }

  getConfig(): SimulationConfig {
    return this.config;
  }
}

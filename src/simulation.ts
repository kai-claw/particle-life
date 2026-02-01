import type { Particle, SimulationConfig } from './types';
import { PARTICLE_TYPES, PARTICLE_COLORS } from './types';

export class SpatialHash {
  private cellSize: number;
  private grid: Map<string, Particle[]>;
  
  constructor(cellSize: number) {
    this.cellSize = cellSize;
    this.grid = new Map();
  }

  clear() {
    this.grid.clear();
  }

  add(particle: Particle) {
    const key = this.getKey(particle.x, particle.y);
    if (!this.grid.has(key)) {
      this.grid.set(key, []);
    }
    this.grid.get(key)!.push(particle);
  }

  getNearby(x: number, y: number): Particle[] {
    const nearby: Particle[] = [];
    const cellX = Math.floor(x / this.cellSize);
    const cellY = Math.floor(y / this.cellSize);

    // Check 9 cells (3x3 grid around the particle)
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const key = `${cellX + dx},${cellY + dy}`;
        const particles = this.grid.get(key);
        if (particles) {
          nearby.push(...particles);
        }
      }
    }
    return nearby;
  }

  private getKey(x: number, y: number): string {
    const cellX = Math.floor(x / this.cellSize);
    const cellY = Math.floor(y / this.cellSize);
    return `${cellX},${cellY}`;
  }
}

export class ParticleSimulation {
  private particles: Particle[] = [];
  private config: SimulationConfig;
  private width: number = 0;
  private height: number = 0;
  private spatialHash: SpatialHash;

  constructor(config: SimulationConfig) {
    this.config = config;
    this.spatialHash = new SpatialHash(config.radius);
  }

  setDimensions(width: number, height: number) {
    this.width = width;
    this.height = height;
  }

  updateConfig(config: SimulationConfig) {
    this.config = config;
    this.spatialHash = new SpatialHash(config.radius);
    
    // Adjust particle count if needed
    if (this.particles.length !== config.particleCount) {
      this.initializeParticles();
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
    // Rebuild spatial hash
    this.spatialHash.clear();
    for (const particle of this.particles) {
      this.spatialHash.add(particle);
    }

    // Update each particle
    for (const particle of this.particles) {
      this.updateParticle(particle);
    }

    // Apply velocities and wrap around
    for (const particle of this.particles) {
      particle.x += particle.vx * this.config.speed;
      particle.y += particle.vy * this.config.speed;

      // Apply friction
      particle.vx *= (1 - this.config.friction);
      particle.vy *= (1 - this.config.friction);

      // Wrap around (toroidal topology)
      if (particle.x < 0) particle.x = this.width;
      if (particle.x > this.width) particle.x = 0;
      if (particle.y < 0) particle.y = this.height;
      if (particle.y > this.height) particle.y = 0;
    }
  }

  private updateParticle(particle: Particle) {
    const nearby = this.spatialHash.getNearby(particle.x, particle.y);
    
    for (const other of nearby) {
      if (other === particle) continue;

      const dx = other.x - particle.x;
      const dy = other.y - particle.y;
      
      // Handle wrapping for distance calculation
      const wrappedDx = this.wrapDistance(dx, this.width);
      const wrappedDy = this.wrapDistance(dy, this.height);
      
      const distSq = wrappedDx * wrappedDx + wrappedDy * wrappedDy;
      const radiusSq = this.config.radius * this.config.radius;

      if (distSq > 0 && distSq < radiusSq) {
        const dist = Math.sqrt(distSq);
        const force = this.config.rules[particle.type][other.type] * this.config.forceStrength;
        
        // Normalize and apply force
        const fx = (wrappedDx / dist) * force;
        const fy = (wrappedDy / dist) * force;
        
        particle.vx += fx;
        particle.vy += fy;
      }
    }
  }

  private wrapDistance(d: number, max: number): number {
    const half = max / 2;
    if (d > half) return d - max;
    if (d < -half) return d + max;
    return d;
  }

  render(ctx: CanvasRenderingContext2D) {
    // Trail effect - slight fade instead of full clear
    if (this.config.trailEffect) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, this.width, this.height);
    } else {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, this.width, this.height);
    }

    // Render particles
    for (const particle of this.particles) {
      ctx.fillStyle = PARTICLE_COLORS[particle.type];
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  getParticles(): Particle[] {
    return this.particles;
  }

  randomizeRules() {
    for (let i = 0; i < PARTICLE_TYPES; i++) {
      for (let j = 0; j < PARTICLE_TYPES; j++) {
        this.config.rules[i][j] = (Math.random() - 0.5) * 2; // -1 to 1
      }
    }
  }
}
import type { Particle, SimulationConfig, MouseForce } from './types';
import { PARTICLE_COLORS, PARTICLE_RGB, PARTICLE_TYPES, hslToRgb } from './types';

/**
 * Map a speed value to an RGB color using a thermal/plasma gradient.
 * Slow (0) = deep blue/purple → fast (1) = white/yellow
 */
export function velocityToColor(normalizedSpeed: number): [number, number, number] {
  const t = Math.max(0, Math.min(1, normalizedSpeed));
  // Plasma-like gradient: purple → blue → cyan → green → yellow → white
  if (t < 0.2) {
    const s = t / 0.2;
    return [Math.round(40 + 20 * s), Math.round(10 + 30 * s), Math.round(80 + 100 * s)];
  }
  if (t < 0.4) {
    const s = (t - 0.2) / 0.2;
    return [Math.round(60 - 30 * s), Math.round(40 + 160 * s), Math.round(180 + 60 * s)];
  }
  if (t < 0.6) {
    const s = (t - 0.4) / 0.2;
    return [Math.round(30 + 40 * s), Math.round(200 + 55 * s), Math.round(240 - 100 * s)];
  }
  if (t < 0.8) {
    const s = (t - 0.6) / 0.2;
    return [Math.round(70 + 185 * s), Math.round(255), Math.round(140 - 100 * s)];
  }
  const s = (t - 0.8) / 0.2;
  return [255, 255, Math.round(40 + 215 * s)];
}

/**
 * Map density (neighbor count) to an RGB color.
 * Isolated = dark cool → crowded = bright warm
 */
export function densityToColor(normalizedDensity: number): [number, number, number] {
  const t = Math.max(0, Math.min(1, normalizedDensity));
  const [r, g, b] = hslToRgb(0.7 - t * 0.7, 0.9, 0.15 + t * 0.55);
  return [r, g, b];
}

/**
 * Dedicated particle renderer — separated from simulation physics.
 * Handles all canvas drawing: trails, flat/glow/velocity/density modes, mouse cursor.
 */
export class ParticleRenderer {
  /** Render a full frame of particles */
  render(
    ctx: CanvasRenderingContext2D,
    particles: Particle[],
    config: SimulationConfig,
    width: number,
    height: number,
    mouseForce: MouseForce,
    maxSpeedObserved: number,
    neighborCounts: Float32Array,
  ) {
    const { trailEffect, particleSize, glowEnabled, colorMode } = config;

    // Trail/clear
    if (trailEffect > 0) {
      ctx.fillStyle = `rgba(0, 0, 0, ${trailEffect})`;
      ctx.fillRect(0, 0, width, height);
    } else {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, height);
    }

    if (colorMode === 'type') {
      if (glowEnabled && particleSize >= 1.5) {
        this.renderGlow(ctx, particles, particleSize);
      } else {
        this.renderFlat(ctx, particles, particleSize);
      }
    } else if (colorMode === 'velocity') {
      this.renderVelocity(ctx, particles, particleSize, glowEnabled, maxSpeedObserved);
    } else if (colorMode === 'density') {
      this.renderDensity(ctx, particles, particleSize, glowEnabled, neighborCounts);
    }

    // Draw mouse force radius indicator
    if (mouseForce.active) {
      this.renderMouseCursor(ctx, mouseForce);
    }
  }

  /** Standard flat rendering — batch by type */
  private renderFlat(ctx: CanvasRenderingContext2D, particles: Particle[], size: number) {
    for (let t = 0; t < PARTICLE_TYPES; t++) {
      ctx.fillStyle = PARTICLE_COLORS[t];
      ctx.beginPath();
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        if (p.type !== t) continue;
        ctx.moveTo(p.x + size, p.y);
        ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
      }
      ctx.fill();
    }
  }

  /** Glow rendering — radial gradients with additive blending */
  private renderGlow(ctx: CanvasRenderingContext2D, particles: Particle[], size: number) {
    const glowSize = size * 3;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    for (let t = 0; t < PARTICLE_TYPES; t++) {
      const rgb = PARTICLE_RGB[t];
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        if (p.type !== t) continue;
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowSize);
        grad.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.8)`);
        grad.addColorStop(0.3, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.3)`);
        grad.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`);
        ctx.fillStyle = grad;
        ctx.fillRect(p.x - glowSize, p.y - glowSize, glowSize * 2, glowSize * 2);
      }
    }
    ctx.restore();

    // Solid core
    for (let t = 0; t < PARTICLE_TYPES; t++) {
      ctx.fillStyle = PARTICLE_COLORS[t];
      ctx.beginPath();
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        if (p.type !== t) continue;
        ctx.moveTo(p.x + size * 0.7, p.y);
        ctx.arc(p.x, p.y, size * 0.7, 0, Math.PI * 2);
      }
      ctx.fill();
    }
  }

  /** Velocity-based rainbow coloring — particles colored by speed */
  private renderVelocity(
    ctx: CanvasRenderingContext2D,
    particles: Particle[],
    size: number,
    glow: boolean,
    maxSpeedObserved: number,
  ) {
    const invMax = 1 / maxSpeedObserved;

    if (glow && size >= 1.5) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const glowSize = size * 3;
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const spd = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        const norm = spd * invMax;
        const [r, g, b] = velocityToColor(norm);
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowSize);
        grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.7)`);
        grad.addColorStop(0.4, `rgba(${r}, ${g}, ${b}, 0.2)`);
        grad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
        ctx.fillStyle = grad;
        ctx.fillRect(p.x - glowSize, p.y - glowSize, glowSize * 2, glowSize * 2);
      }
      ctx.restore();
    }

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const spd = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
      const norm = spd * invMax;
      const [r, g, b] = velocityToColor(norm);
      ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /** Density-based coloring — particles colored by local neighbor count */
  private renderDensity(
    ctx: CanvasRenderingContext2D,
    particles: Particle[],
    size: number,
    glow: boolean,
    neighborCounts: Float32Array,
  ) {
    const counts = neighborCounts;
    let maxN = 1;
    for (let i = 0; i < particles.length; i++) {
      if (i < counts.length && counts[i] > maxN) maxN = counts[i];
    }
    const invMax = 1 / maxN;

    if (glow && size >= 1.5) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const glowSize = size * 3;
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const nc = i < counts.length ? counts[i] : 0;
        const norm = nc * invMax;
        const [r, g, b] = densityToColor(norm);
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowSize);
        grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.6)`);
        grad.addColorStop(0.4, `rgba(${r}, ${g}, ${b}, 0.15)`);
        grad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
        ctx.fillStyle = grad;
        ctx.fillRect(p.x - glowSize, p.y - glowSize, glowSize * 2, glowSize * 2);
      }
      ctx.restore();
    }

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const nc = i < counts.length ? counts[i] : 0;
      const norm = nc * invMax;
      const [r, g, b] = densityToColor(norm);
      ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /** Draw a visual indicator around the mouse cursor when force is active */
  private renderMouseCursor(ctx: CanvasRenderingContext2D, mf: MouseForce) {
    const isAttract = mf.strength > 0;
    ctx.save();

    // Outer ring
    ctx.strokeStyle = isAttract
      ? 'rgba(51, 255, 119, 0.4)'
      : 'rgba(255, 85, 102, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.arc(mf.x, mf.y, mf.radius, 0, Math.PI * 2);
    ctx.stroke();

    // Inner glow
    const grad = ctx.createRadialGradient(mf.x, mf.y, 0, mf.x, mf.y, mf.radius);
    grad.addColorStop(0, isAttract
      ? 'rgba(51, 255, 119, 0.08)'
      : 'rgba(255, 85, 102, 0.08)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(mf.x, mf.y, mf.radius, 0, Math.PI * 2);
    ctx.fill();

    // Center crosshair
    ctx.setLineDash([]);
    ctx.strokeStyle = isAttract
      ? 'rgba(51, 255, 119, 0.6)'
      : 'rgba(255, 85, 102, 0.6)';
    ctx.lineWidth = 1;
    const cs = 8;
    ctx.beginPath();
    ctx.moveTo(mf.x - cs, mf.y);
    ctx.lineTo(mf.x + cs, mf.y);
    ctx.moveTo(mf.x, mf.y - cs);
    ctx.lineTo(mf.x, mf.y + cs);
    ctx.stroke();

    ctx.restore();
  }
}

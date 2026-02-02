export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  type: number;
}

/** Color rendering mode for particles */
export type ColorMode = 'type' | 'velocity' | 'density';

/** Initial particle layout configuration */
export type InitialLayout = 'random' | 'bigbang' | 'spiral' | 'grid' | 'ring' | 'clusters';

/** Mouse tool mode for canvas interaction */
export type MouseTool = 'attract' | 'repel' | 'spawn';

export interface SimulationConfig {
  particleCount: number;
  speed: number;
  friction: number;
  maxRadius: number;       // Max interaction radius
  minRadius: number;       // Min radius (repulsion zone boundary)
  forceStrength: number;
  trailEffect: number;     // 0 = no trail, 0.01-0.3 = trail intensity
  particleSize: number;
  glowEnabled: boolean;    // Radial gradient glow rendering with additive blending
  colorMode: ColorMode;    // How particles are colored
  rules: number[][];       // NxN matrix of attraction/repulsion values (-1 to 1)
}

export const PARTICLE_COLORS = [
  '#ff3344', // Red
  '#33ff77', // Green
  '#3388ff', // Blue
  '#ffdd33', // Yellow
  '#33ddff', // Cyan
  '#ff44dd', // Magenta
];

/** RGB components for each particle color (for canvas rendering) */
export const PARTICLE_RGB = [
  { r: 255, g: 51, b: 68 },   // Red
  { r: 51, g: 255, b: 119 },  // Green
  { r: 51, g: 136, b: 255 },  // Blue
  { r: 255, g: 221, b: 51 },  // Yellow
  { r: 51, g: 221, b: 255 },  // Cyan
  { r: 255, g: 68, b: 221 },  // Magenta
];

/** Mouse interaction mode for direct particle manipulation */
export interface MouseForce {
  active: boolean;
  x: number;
  y: number;
  radius: number;
  strength: number;  // positive = attract, negative = repel
}

export const PARTICLE_TYPES = PARTICLE_COLORS.length;

export const DEFAULT_CONFIG: SimulationConfig = {
  particleCount: 1200,
  speed: 1.0,
  friction: 0.5,
  maxRadius: 100,
  minRadius: 20,
  forceStrength: 1.0,
  trailEffect: 0.05,
  particleSize: 2,
  glowEnabled: true,
  colorMode: 'type',
  rules: [
    [ 0.10, -0.20,  0.30, -0.10,  0.20, -0.30],
    [-0.20,  0.10, -0.30,  0.20, -0.10,  0.30],
    [ 0.30, -0.30,  0.10,  0.20, -0.20,  0.10],
    [-0.10,  0.20,  0.20,  0.10, -0.30, -0.20],
    [ 0.20, -0.10, -0.20, -0.30,  0.10,  0.30],
    [-0.30,  0.30,  0.10, -0.20,  0.30,  0.10],
  ],
};

/**
 * HSL-to-RGB for velocity/density color mapping.
 * All inputs 0-1, returns [r, g, b] in 0-255 range.
 */
export function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  if (s === 0) {
    const v = Math.round(l * 255);
    return [v, v, v];
  }
  const hue2rgb = (p: number, q: number, t: number): number => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return [
    Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
    Math.round(hue2rgb(p, q, h) * 255),
    Math.round(hue2rgb(p, q, h - 1 / 3) * 255),
  ];
}

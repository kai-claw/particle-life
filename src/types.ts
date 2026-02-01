export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  type: number;
}

export interface SimulationConfig {
  particleCount: number;
  speed: number;
  friction: number;
  maxRadius: number;       // Max interaction radius
  minRadius: number;       // Min radius (repulsion zone boundary)
  forceStrength: number;
  trailEffect: number;     // 0 = no trail, 0.01-0.3 = trail intensity
  particleSize: number;
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
  rules: [
    [ 0.10, -0.20,  0.30, -0.10,  0.20, -0.30],
    [-0.20,  0.10, -0.30,  0.20, -0.10,  0.30],
    [ 0.30, -0.30,  0.10,  0.20, -0.20,  0.10],
    [-0.10,  0.20,  0.20,  0.10, -0.30, -0.20],
    [ 0.20, -0.10, -0.20, -0.30,  0.10,  0.30],
    [-0.30,  0.30,  0.10, -0.20,  0.30,  0.10],
  ],
};

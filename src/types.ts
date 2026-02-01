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
  radius: number;
  forceStrength: number;
  trailEffect: boolean;
  rules: number[][]; // 6x6 matrix of attraction/repulsion values
}

export interface SimulationState {
  particles: Particle[];
  config: SimulationConfig;
  isRunning: boolean;
  canvas: HTMLCanvasElement | null;
  ctx: CanvasRenderingContext2D | null;
}

export const PARTICLE_COLORS = [
  '#FF4444', // Red
  '#44FF44', // Green  
  '#4444FF', // Blue
  '#FFFF44', // Yellow
  '#44FFFF', // Cyan
  '#FF44FF', // Magenta
];

export const PARTICLE_TYPES = PARTICLE_COLORS.length;

export const DEFAULT_CONFIG: SimulationConfig = {
  particleCount: 1000,
  speed: 1.0,
  friction: 0.02,
  radius: 80,
  forceStrength: 0.5,
  trailEffect: true,
  rules: [
    [0.1, -0.2, 0.3, -0.1, 0.2, -0.3],
    [-0.2, 0.1, -0.3, 0.2, -0.1, 0.3],
    [0.3, -0.3, 0.1, 0.2, -0.2, 0.1],
    [-0.1, 0.2, 0.2, 0.1, -0.3, -0.2],
    [0.2, -0.1, -0.2, -0.3, 0.1, 0.3],
    [-0.3, 0.3, 0.1, -0.2, 0.3, 0.1],
  ],
};
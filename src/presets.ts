import type { SimulationConfig } from './types';
import { DEFAULT_CONFIG, PARTICLE_TYPES } from './types';

export interface Preset {
  name: string;
  emoji: string;
  description: string;
  config: Partial<SimulationConfig>;
}

/** Generate a random rule matrix */
export function randomRules(): number[][] {
  return Array.from({ length: PARTICLE_TYPES }, () =>
    Array.from({ length: PARTICLE_TYPES }, () =>
      Math.round((Math.random() * 2 - 1) * 100) / 100
    )
  );
}

// Note: presets use Partial<SimulationConfig>, so colorMode is optional
// and will default to the user's current selection if not specified.

export const PRESETS: Preset[] = [
  {
    name: 'Primordial Soup',
    emoji: '🧬',
    description: 'Organic structures emerge from simple attraction rules',
    config: {
      particleCount: 1500,
      speed: 1.0,
      friction: 0.5,
      maxRadius: 80,
      forceStrength: 1.0,
      trailEffect: 0.08,
      rules: [
        [ 0.10, -0.30,  0.40, -0.10,  0.20, -0.20],
        [ 0.30,  0.05, -0.20,  0.30, -0.10,  0.40],
        [-0.20,  0.10,  0.10,  0.20, -0.30,  0.10],
        [ 0.10, -0.40,  0.20,  0.05, -0.20, -0.10],
        [-0.10,  0.20, -0.30,  0.20,  0.10,  0.30],
        [ 0.20, -0.10,  0.10, -0.30,  0.40,  0.05],
      ],
    },
  },
  {
    name: 'Ecosystems',
    emoji: '🌿',
    description: 'Predator-prey dynamics with chasing and fleeing',
    config: {
      particleCount: 1200,
      speed: 1.2,
      friction: 0.4,
      maxRadius: 100,
      forceStrength: 0.8,
      trailEffect: 0.06,
      rules: [
        [ 0.20,  0.60, -0.40,  0.10, -0.20,  0.30],
        [-0.60,  0.10,  0.50, -0.30,  0.20, -0.10],
        [ 0.30, -0.50,  0.20,  0.60, -0.10,  0.10],
        [-0.10,  0.30, -0.60,  0.10,  0.40, -0.30],
        [ 0.20, -0.20,  0.10, -0.40,  0.20,  0.50],
        [-0.30,  0.10, -0.10,  0.30, -0.50,  0.10],
      ],
    },
  },
  {
    name: 'Living Cells',
    emoji: '🔬',
    description: 'Self-organizing membranes and internal structures',
    config: {
      particleCount: 2000,
      speed: 0.8,
      friction: 0.6,
      maxRadius: 60,
      forceStrength: 1.2,
      trailEffect: 0.04,
      rules: [
        [ 0.60, -0.20, -0.30,  0.10, -0.10,  0.20],
        [-0.20,  0.50, -0.10, -0.30,  0.20, -0.10],
        [-0.30, -0.10,  0.40,  0.20, -0.20, -0.10],
        [ 0.10, -0.30,  0.20,  0.50, -0.10, -0.20],
        [-0.10,  0.20, -0.20, -0.10,  0.40,  0.10],
        [ 0.20, -0.10, -0.10, -0.20,  0.10,  0.60],
      ],
    },
  },
  {
    name: 'Orbital Clusters',
    emoji: '🪐',
    description: 'Stable spinning clusters with orbiting satellites',
    config: {
      particleCount: 1000,
      speed: 1.0,
      friction: 0.3,
      maxRadius: 120,
      forceStrength: 0.6,
      trailEffect: 0.03,
      rules: [
        [ 0.10,  0.40, -0.10, -0.30,  0.20, -0.20],
        [-0.40,  0.10,  0.30, -0.10, -0.20,  0.20],
        [ 0.10, -0.30,  0.10,  0.40, -0.10, -0.20],
        [ 0.30,  0.10, -0.40,  0.10,  0.20, -0.10],
        [-0.20,  0.20,  0.10, -0.20,  0.10,  0.30],
        [ 0.20, -0.20,  0.20,  0.10, -0.30,  0.10],
      ],
    },
  },
  {
    name: 'Turbulence',
    emoji: '🌪️',
    description: 'Violent, ever-shifting chaos with fleeting patterns',
    config: {
      particleCount: 1500,
      speed: 2.0,
      friction: 0.2,
      maxRadius: 80,
      forceStrength: 1.5,
      trailEffect: 0.15,
      rules: [
        [ 0.70, -0.80,  0.40, -0.60,  0.30, -0.50],
        [-0.50,  0.60, -0.70,  0.40, -0.80,  0.30],
        [ 0.40, -0.30,  0.80, -0.70,  0.50, -0.60],
        [-0.60,  0.50, -0.40,  0.70, -0.30,  0.80],
        [ 0.30, -0.80,  0.50, -0.40,  0.60, -0.70],
        [-0.70,  0.40, -0.60,  0.80, -0.50,  0.30],
      ],
    },
  },
  {
    name: 'Slime Mold',
    emoji: '🟡',
    description: 'Branching networks like real slime mold',
    config: {
      particleCount: 2500,
      speed: 0.6,
      friction: 0.7,
      maxRadius: 50,
      forceStrength: 1.5,
      trailEffect: 0.02,
      rules: [
        [ 0.30,  0.20,  0.10,  0.10,  0.15,  0.10],
        [ 0.20,  0.30,  0.20,  0.10,  0.10,  0.15],
        [ 0.10,  0.20,  0.30,  0.20,  0.10,  0.10],
        [ 0.10,  0.10,  0.20,  0.30,  0.20,  0.10],
        [ 0.15,  0.10,  0.10,  0.20,  0.30,  0.20],
        [ 0.10,  0.15,  0.10,  0.10,  0.20,  0.30],
      ],
    },
  },
  {
    name: 'Galaxy',
    emoji: '🌌',
    description: 'Spiral arm formation with dense cores',
    config: {
      particleCount: 2000,
      speed: 0.8,
      friction: 0.15,
      maxRadius: 150,
      forceStrength: 0.4,
      trailEffect: 0.02,
      rules: [
        [ 0.05,  0.30, -0.20, -0.10,  0.15, -0.15],
        [-0.30,  0.05,  0.25, -0.20, -0.10,  0.20],
        [ 0.20, -0.25,  0.05,  0.30, -0.15, -0.10],
        [ 0.10,  0.20, -0.30,  0.05,  0.25, -0.15],
        [-0.15,  0.10,  0.15, -0.25,  0.05,  0.30],
        [ 0.15, -0.20,  0.10,  0.15, -0.30,  0.05],
      ],
    },
  },
  {
    name: 'Nebula',
    emoji: '🌠',
    description: 'Dense glowing clusters that drift and merge like cosmic nebulae',
    config: {
      particleCount: 2000,
      speed: 0.7,
      friction: 0.45,
      maxRadius: 90,
      forceStrength: 1.0,
      trailEffect: 0.03,
      particleSize: 2.5,
      glowEnabled: true,
      rules: [
        [ 0.40,  0.20, -0.10,  0.30, -0.20,  0.10],
        [ 0.20,  0.40,  0.30, -0.10,  0.10, -0.20],
        [-0.10,  0.30,  0.40,  0.20, -0.10,  0.10],
        [ 0.30, -0.10,  0.20,  0.40,  0.30, -0.10],
        [-0.20,  0.10, -0.10,  0.30,  0.40,  0.20],
        [ 0.10, -0.20,  0.10, -0.10,  0.20,  0.40],
      ],
    },
  },
  {
    name: 'Neural Web',
    emoji: '🕸️',
    description: 'Connection lines reveal hidden structure — living neural network',
    config: {
      particleCount: 1200,
      speed: 0.8,
      friction: 0.5,
      maxRadius: 80,
      forceStrength: 1.0,
      trailEffect: 0.04,
      particleSize: 2.0,
      glowEnabled: true,
      webEnabled: true,
      rules: [
        [ 0.50, -0.15,  0.20, -0.10,  0.30, -0.20],
        [-0.15,  0.50, -0.10,  0.25, -0.15,  0.30],
        [ 0.20, -0.10,  0.50, -0.15,  0.20, -0.10],
        [-0.10,  0.25, -0.15,  0.50, -0.10,  0.20],
        [ 0.30, -0.15,  0.20, -0.10,  0.50, -0.15],
        [-0.20,  0.30, -0.10,  0.20, -0.15,  0.50],
      ],
    },
  },
  {
    name: 'Contagion',
    emoji: '🦠',
    description: 'Species mutation spreads in waves — watch colors shift and compete',
    config: {
      particleCount: 2000,
      speed: 0.9,
      friction: 0.5,
      maxRadius: 70,
      forceStrength: 1.0,
      trailEffect: 0.05,
      particleSize: 2.5,
      glowEnabled: true,
      mutationEnabled: true,
      rules: [
        [ 0.30, -0.40,  0.10, -0.20,  0.20, -0.30],
        [ 0.40,  0.30, -0.30,  0.10, -0.20,  0.20],
        [-0.10,  0.30,  0.30, -0.40,  0.10, -0.20],
        [ 0.20, -0.10,  0.40,  0.30, -0.30,  0.10],
        [-0.20,  0.20, -0.10,  0.30,  0.30, -0.40],
        [ 0.30, -0.30,  0.20, -0.10,  0.40,  0.30],
      ],
    },
  },
  {
    name: 'Random',
    emoji: '🎲',
    description: 'Randomize all rules — discover something new!',
    config: {
      ...DEFAULT_CONFIG,
      rules: randomRules(),
    },
  },
];

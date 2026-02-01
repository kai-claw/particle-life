import type { SimulationConfig } from './types';
import { DEFAULT_CONFIG } from './types';

export interface Preset {
  name: string;
  description: string;
  config: Partial<SimulationConfig>;
}

export const PRESETS: Preset[] = [
  {
    name: 'Ecosystems',
    description: 'Predator-prey relationships create dynamic ecosystems',
    config: {
      ...DEFAULT_CONFIG,
      rules: [
        [0.2, -0.4, 0.1, 0.3, -0.1, 0.2],
        [0.3, 0.1, -0.3, 0.2, 0.4, -0.2],
        [-0.1, 0.2, 0.3, -0.4, 0.1, 0.3],
        [-0.3, -0.1, 0.4, 0.2, -0.3, 0.1],
        [0.1, -0.4, -0.1, 0.3, 0.2, -0.3],
        [-0.2, 0.3, -0.3, -0.1, 0.4, 0.1],
      ],
    },
  },
  {
    name: 'Cells',
    description: 'Self-organizing cellular structures',
    config: {
      ...DEFAULT_CONFIG,
      friction: 0.05,
      radius: 60,
      rules: [
        [0.5, -0.2, -0.3, 0.1, -0.1, 0.2],
        [-0.2, 0.4, -0.1, -0.3, 0.2, -0.1],
        [-0.3, -0.1, 0.3, 0.2, -0.2, -0.1],
        [0.1, -0.3, 0.2, 0.4, -0.1, -0.2],
        [-0.1, 0.2, -0.2, -0.1, 0.3, 0.1],
        [0.2, -0.1, -0.1, -0.2, 0.1, 0.5],
      ],
    },
  },
  {
    name: 'Hunters',
    description: 'Chasing behaviors and pack formation',
    config: {
      ...DEFAULT_CONFIG,
      speed: 1.5,
      friction: 0.01,
      rules: [
        [-0.1, 0.8, -0.2, 0.3, -0.4, 0.1],
        [-0.8, -0.1, 0.4, -0.2, 0.3, -0.1],
        [0.2, -0.4, -0.1, 0.6, -0.3, 0.2],
        [-0.3, 0.2, -0.6, -0.1, 0.5, -0.2],
        [0.4, -0.3, 0.3, -0.5, -0.1, 0.7],
        [-0.1, 0.1, -0.2, 0.2, -0.7, -0.1],
      ],
    },
  },
  {
    name: 'Symmetry',
    description: 'Beautiful symmetric patterns and formations',
    config: {
      ...DEFAULT_CONFIG,
      friction: 0.03,
      radius: 100,
      rules: [
        [0.3, -0.3, 0.2, -0.2, 0.1, -0.1],
        [-0.3, 0.3, -0.2, 0.2, -0.1, 0.1],
        [0.2, -0.2, 0.3, -0.3, 0.1, -0.1],
        [-0.2, 0.2, -0.3, 0.3, -0.1, 0.1],
        [0.1, -0.1, 0.1, -0.1, 0.2, -0.2],
        [-0.1, 0.1, -0.1, 0.1, -0.2, 0.2],
      ],
    },
  },
  {
    name: 'Chaos',
    description: 'Turbulent, ever-changing patterns',
    config: {
      ...DEFAULT_CONFIG,
      speed: 2.0,
      friction: 0.005,
      forceStrength: 0.8,
      rules: [
        [0.7, -0.8, 0.4, -0.6, 0.3, -0.5],
        [-0.5, 0.6, -0.7, 0.4, -0.8, 0.3],
        [0.4, -0.3, 0.8, -0.7, 0.5, -0.6],
        [-0.6, 0.5, -0.4, 0.7, -0.3, 0.8],
        [0.3, -0.8, 0.5, -0.4, 0.6, -0.7],
        [-0.7, 0.4, -0.6, 0.8, -0.5, 0.3],
      ],
    },
  },
  {
    name: 'Orbits',
    description: 'Stable orbital patterns and clusters',
    config: {
      ...DEFAULT_CONFIG,
      friction: 0.01,
      radius: 120,
      forceStrength: 0.3,
      rules: [
        [0.1, 0.4, -0.1, -0.3, 0.2, -0.2],
        [-0.4, 0.1, 0.3, -0.1, -0.2, 0.2],
        [0.1, -0.3, 0.1, 0.4, -0.1, -0.2],
        [0.3, 0.1, -0.4, 0.1, 0.2, -0.1],
        [-0.2, 0.2, 0.1, -0.2, 0.1, 0.3],
        [0.2, -0.2, 0.2, 0.1, -0.3, 0.1],
      ],
    },
  },
];
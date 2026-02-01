import { useRef, useEffect, useCallback } from 'react';
import { ParticleSimulation } from './simulation';
import type { SimulationConfig } from './types';

interface ParticleCanvasProps {
  config: SimulationConfig;
  isRunning: boolean;
  onSimulationRef: (sim: ParticleSimulation | null) => void;
}

export const ParticleCanvas: React.FC<ParticleCanvasProps> = ({
  config,
  isRunning,
  onSimulationRef,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const simRef = useRef<ParticleSimulation | null>(null);
  const rafRef = useRef<number>(0);
  const configRef = useRef(config);
  const runningRef = useRef(isRunning);

  // Keep refs in sync
  configRef.current = config;
  runningRef.current = isRunning;

  // Initialize simulation once
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const sim = new ParticleSimulation(config);
    sim.setDimensions(canvas.width, canvas.height);
    sim.initializeParticles();
    simRef.current = sim;
    onSimulationRef(sim);

    const onResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      sim.setDimensions(canvas.width, canvas.height);
    };

    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      simRef.current = null;
      onSimulationRef(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Push config updates WITHOUT reinitializing
  useEffect(() => {
    if (simRef.current) {
      simRef.current.updateConfig(config);
    }
  }, [config]);

  // Animation loop — uses refs to avoid dependency churn
  const animate = useCallback(() => {
    const sim = simRef.current;
    const canvas = canvasRef.current;
    if (!sim || !canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (runningRef.current) {
      sim.update();
    }
    sim.render(ctx);

    rafRef.current = requestAnimationFrame(animate);
  }, []);

  // Start/stop animation
  useEffect(() => {
    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [animate]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: '#000',
        zIndex: 1,
      }}
    />
  );
};

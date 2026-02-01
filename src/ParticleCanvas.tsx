import React, { useRef, useEffect, useCallback } from 'react';
import { ParticleSimulation } from './simulation';
import type { SimulationConfig } from './types';

interface ParticleCanvasProps {
  config: SimulationConfig;
  isRunning: boolean;
  onSimulationRef: (simulation: ParticleSimulation | null) => void;
}

export const ParticleCanvas: React.FC<ParticleCanvasProps> = ({
  config,
  isRunning,
  onSimulationRef,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const simulationRef = useRef<ParticleSimulation | null>(null);
  const animationIdRef = useRef<number | null>(null);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    if (simulationRef.current) {
      simulationRef.current.setDimensions(canvas.width, canvas.height);
    }
  }, []);

  const animate = useCallback(() => {
    if (!isRunning || !simulationRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    simulationRef.current.update();
    simulationRef.current.render(ctx);

    animationIdRef.current = requestAnimationFrame(animate);
  }, [isRunning]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const simulation = new ParticleSimulation(config);
    simulationRef.current = simulation;
    onSimulationRef(simulation);

    resizeCanvas();
    simulation.initializeParticles();

    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      onSimulationRef(null);
    };
  }, [config, onSimulationRef, resizeCanvas]);

  useEffect(() => {
    if (simulationRef.current) {
      simulationRef.current.updateConfig(config);
    }
  }, [config]);

  useEffect(() => {
    if (isRunning) {
      animate();
    } else if (animationIdRef.current) {
      cancelAnimationFrame(animationIdRef.current);
      animationIdRef.current = null;
    }
  }, [isRunning, animate]);

  useEffect(() => {
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [resizeCanvas]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: '#000000',
        cursor: 'none',
        zIndex: 1,
      }}
    />
  );
};
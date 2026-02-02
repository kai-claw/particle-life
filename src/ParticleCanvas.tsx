import { useRef, useEffect, useCallback } from 'react';
import { ParticleSimulation } from './simulation';
import type { SimulationConfig } from './types';

interface ParticleCanvasProps {
  config: SimulationConfig;
  isRunning: boolean;
  onSimulationRef: (sim: ParticleSimulation | null) => void;
}

/**
 * Set canvas resolution accounting for device pixel ratio.
 * CSS size stays at viewport dimensions; canvas buffer is scaled up.
 */
function setupCanvas(canvas: HTMLCanvasElement): number {
  const dpr = Math.min(window.devicePixelRatio || 1, 2); // cap at 2× for perf
  const w = window.innerWidth;
  const h = window.innerHeight;
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  canvas.style.width = w + 'px';
  canvas.style.height = h + 'px';
  return dpr;
}

export const ParticleCanvas: React.FC<ParticleCanvasProps> = ({
  config,
  isRunning,
  onSimulationRef,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const simRef = useRef<ParticleSimulation | null>(null);
  const rafRef = useRef<number>(0);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const configRef = useRef(config);
  const runningRef = useRef(isRunning);

  // Keep refs in sync
  configRef.current = config;
  runningRef.current = isRunning;

  // Initialize simulation once
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = setupCanvas(canvas);

    // Get and cache context — apply DPR transform
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('Particle Life: Could not get canvas 2D context');
      return;
    }
    ctx.scale(dpr, dpr);
    ctxRef.current = ctx;

    // Simulation uses CSS pixel dimensions (not canvas buffer pixels)
    const sim = new ParticleSimulation(config);
    sim.setDimensions(window.innerWidth, window.innerHeight);
    sim.initializeParticles();
    simRef.current = sim;
    onSimulationRef(sim);

    const onResize = () => {
      const newDpr = setupCanvas(canvas);
      const newCtx = canvas.getContext('2d');
      if (newCtx) {
        newCtx.scale(newDpr, newDpr);
        ctxRef.current = newCtx;
      }
      sim.setDimensions(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      simRef.current = null;
      ctxRef.current = null;
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

  // Mouse interaction handlers
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const sim = simRef.current;
    if (!sim) return;
    e.preventDefault();
    // Left click = attract, right click = repel
    const strength = e.button === 2 ? -1.5 : 1.5;
    sim.mouseForce = { active: true, x: e.clientX, y: e.clientY, radius: 150, strength };
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const sim = simRef.current;
    if (!sim || !sim.mouseForce.active) return;
    sim.mouseForce.x = e.clientX;
    sim.mouseForce.y = e.clientY;
  }, []);

  const handleMouseUp = useCallback(() => {
    const sim = simRef.current;
    if (!sim) return;
    sim.mouseForce.active = false;
  }, []);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault(); // Prevent context menu on right-click
  }, []);

  // Touch support for mobile
  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    const sim = simRef.current;
    if (!sim || e.touches.length === 0) return;
    const touch = e.touches[0];
    // Single touch = attract, two-finger = repel
    const strength = e.touches.length >= 2 ? -1.5 : 1.5;
    sim.mouseForce = { active: true, x: touch.clientX, y: touch.clientY, radius: 150, strength };
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    const sim = simRef.current;
    if (!sim || !sim.mouseForce.active || e.touches.length === 0) return;
    const touch = e.touches[0];
    sim.mouseForce.x = touch.clientX;
    sim.mouseForce.y = touch.clientY;
  }, []);

  const handleTouchEnd = useCallback(() => {
    const sim = simRef.current;
    if (!sim) return;
    sim.mouseForce.active = false;
  }, []);

  // Animation loop — uses refs to avoid dependency churn
  const animate = useCallback(() => {
    const sim = simRef.current;
    const ctx = ctxRef.current;
    if (!sim || !ctx) return;

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
      role="img"
      aria-label="Particle life simulation — colored particles attracting and repelling each other. Click to attract particles, right-click to repel."
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onContextMenu={handleContextMenu}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: '#000',
        zIndex: 1,
        cursor: 'crosshair',
      }}
    />
  );
};

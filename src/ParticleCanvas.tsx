import { useRef, useEffect, useCallback } from 'react';
import { ParticleSimulation } from './simulation';
import type { SimulationConfig, MouseTool, InitialLayout } from './types';

interface ParticleCanvasProps {
  config: SimulationConfig;
  isRunning: boolean;
  mouseTool: MouseTool;
  onSimulationRef: (sim: ParticleSimulation | null) => void;
  onScreenshot?: () => void;
  onCanvasRef?: (el: HTMLCanvasElement | null) => void;
  initialLayout?: InitialLayout;
}

/**
 * Set canvas resolution accounting for device pixel ratio.
 * CSS size stays at viewport dimensions; canvas buffer is scaled up.
 */
function setupCanvas(canvas: HTMLCanvasElement): number {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = window.innerWidth;
  const h = window.innerHeight;
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  canvas.style.width = w + 'px';
  canvas.style.height = h + 'px';
  return dpr;
}

// Default export for fast-refresh compliance (no non-component exports)
export const ParticleCanvas: React.FC<ParticleCanvasProps> = ({
  config,
  isRunning,
  mouseTool,
  onSimulationRef,
  onCanvasRef,
  initialLayout = 'random',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const simRef = useRef<ParticleSimulation | null>(null);
  const rafRef = useRef<number>(0);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const configRef = useRef(config);
  const runningRef = useRef(isRunning);
  const mouseToolRef = useRef(mouseTool);

  // Keep refs in sync
  configRef.current = config;
  runningRef.current = isRunning;
  mouseToolRef.current = mouseTool;

  // Initialize simulation once
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = setupCanvas(canvas);

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('Particle Life: Could not get canvas 2D context');
      return;
    }
    ctx.scale(dpr, dpr);
    ctxRef.current = ctx;

    const sim = new ParticleSimulation(config);
    sim.setDimensions(window.innerWidth, window.innerHeight);

    if (initialLayout === 'random') {
      sim.initializeParticles();
    } else {
      sim.initializeWithLayout(initialLayout);
    }

    simRef.current = sim;
    onSimulationRef(sim);
    if (onCanvasRef) onCanvasRef(canvas);

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

  // --- Mouse / Pointer interaction ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const getStrength = (): number => {
      switch (mouseToolRef.current) {
        case 'attract': return 1.5;
        case 'repel': return -1.5;
        case 'spawn': return 0;
        default: return 0;
      }
    };

    const handlePointerDown = (e: PointerEvent) => {
      const sim = simRef.current;
      if (!sim) return;

      // Ignore if over the control panel (z-index check via element)
      if ((e.target as HTMLElement) !== canvas) return;

      const tool = mouseToolRef.current;

      if (tool === 'spawn') {
        // Spawn a burst of particles at cursor
        spawnBurst(sim, e.clientX, e.clientY);
        return;
      }

      // Attract or repel
      sim.mouseForce.active = true;
      sim.mouseForce.x = e.clientX;
      sim.mouseForce.y = e.clientY;
      sim.mouseForce.strength = getStrength();
      canvas.setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e: PointerEvent) => {
      const sim = simRef.current;
      if (!sim || !sim.mouseForce.active) return;
      sim.mouseForce.x = e.clientX;
      sim.mouseForce.y = e.clientY;
    };

    const handlePointerUp = () => {
      const sim = simRef.current;
      if (!sim) return;
      sim.mouseForce.active = false;
    };

    const handleContextMenu = (e: Event) => {
      // Prevent context menu on canvas for right-click repel
      e.preventDefault();
    };

    canvas.addEventListener('pointerdown', handlePointerDown);
    canvas.addEventListener('pointermove', handlePointerMove);
    canvas.addEventListener('pointerup', handlePointerUp);
    canvas.addEventListener('pointercancel', handlePointerUp);
    canvas.addEventListener('contextmenu', handleContextMenu);

    return () => {
      canvas.removeEventListener('pointerdown', handlePointerDown);
      canvas.removeEventListener('pointermove', handlePointerMove);
      canvas.removeEventListener('pointerup', handlePointerUp);
      canvas.removeEventListener('pointercancel', handlePointerUp);
      canvas.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);

  // Animation loop
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
      aria-label="Particle life simulation — colored particles attracting and repelling each other"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: '#000',
        zIndex: 1,
        cursor: mouseTool === 'spawn' ? 'crosshair' : mouseTool === 'repel' ? 'crosshair' : 'default',
        touchAction: 'none', // prevent browser gestures on canvas
      }}
    />
  );
};

/** Spawn a burst of particles at a click position */
function spawnBurst(sim: ParticleSimulation, x: number, y: number) {
  const count = 20;
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + Math.random() * 0.3;
    const speed = 0.5 + Math.random() * 2;
    sim.particles.push({
      x: x + Math.cos(angle) * 5,
      y: y + Math.sin(angle) * 5,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      type: Math.floor(Math.random() * 6),
    });
  }
}

// takeScreenshot moved to ./screenshot.ts for fast-refresh compliance

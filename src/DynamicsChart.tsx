import { useRef, useEffect } from 'react';
import type { ParticleSimulation } from './simulation';
import { PARTICLE_COLORS, PARTICLE_RGB, PARTICLE_TYPES } from './types';

interface DynamicsChartProps {
  simulation: ParticleSimulation | null;
  visible: boolean;
}

const CHART_W = 240;
const CHART_H = 90;
const PADDING = 8;
const LINE_WIDTH = 1.5;

export const DynamicsChart: React.FC<DynamicsChartProps> = ({ simulation, visible }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!visible || !simulation) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frameCount = 0;

    const draw = () => {
      frameCount++;
      // Redraw every 3 frames (~20fps) for performance
      if (frameCount % 3 !== 0) {
        rafRef.current = requestAnimationFrame(draw);
        return;
      }

      const history = simulation.getEnergyHistory();
      if (history.length < 2) {
        rafRef.current = requestAnimationFrame(draw);
        return;
      }

      const w = CHART_W;
      const h = CHART_H;
      const plotL = PADDING;
      const plotR = w - PADDING;
      const plotT = PADDING + 12; // space for title
      const plotB = h - PADDING;
      const plotW = plotR - plotL;
      const plotH = plotB - plotT;

      // Clear
      ctx.clearRect(0, 0, w, h);

      // Background
      ctx.fillStyle = 'rgba(10, 10, 20, 0.8)';
      ctx.beginPath();
      ctx.roundRect(0, 0, w, h, 10);
      ctx.fill();

      // Border
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(0.5, 0.5, w - 1, h - 1, 10);
      ctx.stroke();

      // Title
      ctx.font = '10px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.fillText('Species Energy', PADDING, PADDING + 9);

      // Find max value for Y-axis scaling
      let maxVal = 0.1;
      for (let i = 0; i < history.length; i++) {
        for (let t = 0; t < PARTICLE_TYPES; t++) {
          if (history[i][t] > maxVal) maxVal = history[i][t];
        }
      }

      // Subtle grid lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 0.5;
      for (let g = 0; g < 3; g++) {
        const gy = plotT + (plotH * (g + 1)) / 4;
        ctx.beginPath();
        ctx.moveTo(plotL, gy);
        ctx.lineTo(plotR, gy);
        ctx.stroke();
      }

      const len = history.length;
      const dx = plotW / Math.max(len - 1, 1);

      // Draw filled areas + lines per species
      for (let t = 0; t < PARTICLE_TYPES; t++) {
        const rgb = PARTICLE_RGB[t];

        // Filled area (very subtle)
        ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.08)`;
        ctx.beginPath();
        ctx.moveTo(plotL, plotB);
        for (let i = 0; i < len; i++) {
          const x = plotL + i * dx;
          const y = plotT + plotH * (1 - history[i][t] / maxVal);
          ctx.lineTo(x, y);
        }
        ctx.lineTo(plotL + (len - 1) * dx, plotB);
        ctx.closePath();
        ctx.fill();

        // Line
        ctx.strokeStyle = PARTICLE_COLORS[t];
        ctx.lineWidth = LINE_WIDTH;
        ctx.globalAlpha = 0.85;
        ctx.beginPath();
        for (let i = 0; i < len; i++) {
          const x = plotL + i * dx;
          const y = plotT + plotH * (1 - history[i][t] / maxVal);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [simulation, visible]);

  if (!visible) return null;

  return (
    <canvas
      ref={canvasRef}
      width={CHART_W}
      height={CHART_H}
      className="dynamics-chart"
      role="img"
      aria-label="Real-time species energy dynamics chart showing average speed per particle type over time"
    />
  );
};

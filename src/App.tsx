import { useState, useCallback, useEffect, useRef } from 'react';
import { ParticleCanvas, takeScreenshot } from './ParticleCanvas';
import { ControlPanel } from './ControlPanel';
import { DynamicsChart } from './DynamicsChart';
import { ErrorBoundary } from './ErrorBoundary';
import type { ParticleSimulation } from './simulation';
import type { SimulationConfig, MouseTool, InitialLayout } from './types';
import { DEFAULT_CONFIG } from './types';
import { PRESETS } from './presets';
import './App.css';

/** Start with Nebula preset for maximum first-impression wow */
const INITIAL_CONFIG: SimulationConfig = {
  ...DEFAULT_CONFIG,
  ...PRESETS.find(p => p.name === 'Nebula')!.config,
  // Override rules to be a full matrix (preset may be partial)
  rules: (PRESETS.find(p => p.name === 'Nebula')!.config.rules ?? DEFAULT_CONFIG.rules).map(r => [...r]),
};

const AppInner: React.FC = () => {
  const [config, setConfig] = useState<SimulationConfig>(INITIAL_CONFIG);
  const [isRunning, setIsRunning] = useState(true);
  const [simulation, setSimulation] = useState<ParticleSimulation | null>(null);
  const [showHelp, setShowHelp] = useState(true);
  const [showChart, setShowChart] = useState(false);
  const [mouseTool, setMouseTool] = useState<MouseTool>('attract');
  const [initialLayout, setInitialLayout] = useState<InitialLayout>('bigbang');
  const [resetKey, setResetKey] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const handleConfigChange = useCallback((newConfig: SimulationConfig) => {
    setConfig(newConfig);
  }, []);

  const toggleRunning = useCallback(() => {
    setIsRunning((prev) => !prev);
  }, []);

  const handleReset = useCallback(() => {
    setInitialLayout('random');
    setResetKey((k) => k + 1);
  }, []);

  const handleResetWithLayout = useCallback((layout: InitialLayout) => {
    setInitialLayout(layout);
    setResetKey((k) => k + 1);
  }, []);

  const handleScreenshot = useCallback(() => {
    takeScreenshot(canvasRef.current);
  }, []);

  // Capture canvas ref from the ParticleCanvas component
  const handleSimulationRef = useCallback((sim: ParticleSimulation | null) => {
    setSimulation(sim);
  }, []);

  // Auto-hide help after 8 seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowHelp(false), 8000);
    return () => clearTimeout(timer);
  }, []);

  // Keyboard shortcuts — skip when focused on inputs or textareas
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.code === 'Space') { e.preventDefault(); toggleRunning(); }
      if (e.code === 'KeyR') { handleReset(); }
      if (e.code === 'KeyS') { handleScreenshot(); }
      if (e.code === 'KeyE') { setShowChart(v => !v); }
      if (e.code === 'Escape' && showHelp) { setShowHelp(false); }
      // Mouse tool shortcuts
      if (e.code === 'Digit1') { setMouseTool('attract'); }
      if (e.code === 'Digit2') { setMouseTool('repel'); }
      if (e.code === 'Digit3') { setMouseTool('spawn'); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [toggleRunning, handleReset, handleScreenshot, showHelp]);

  return (
    <div className="app" role="application" aria-label="Particle Life simulation">
      <ParticleCanvas
        key={resetKey}
        config={config}
        isRunning={isRunning}
        mouseTool={mouseTool}
        onSimulationRef={handleSimulationRef}
        initialLayout={initialLayout}
        onCanvasRef={(el) => { canvasRef.current = el; }}
      />
      <ControlPanel
        config={config}
        onConfigChange={handleConfigChange}
        isRunning={isRunning}
        onToggleRunning={toggleRunning}
        onReset={handleReset}
        onResetWithLayout={handleResetWithLayout}
        onScreenshot={handleScreenshot}
        mouseTool={mouseTool}
        onMouseToolChange={setMouseTool}
        simulation={simulation}
        showChart={showChart}
        onToggleChart={() => setShowChart(v => !v)}
      />

      {/* Floating energy chart (bottom-right) */}
      {showChart && (
        <div className="floating-chart" role="complementary" aria-label="Species energy dynamics chart">
          <DynamicsChart simulation={simulation} visible={showChart} />
        </div>
      )}

      {/* Help overlay — auto-hides */}
      {showHelp && (
        <div
          className="help-overlay"
          onClick={() => setShowHelp(false)}
          onKeyDown={(e) => { if (e.key === 'Escape' || e.key === 'Enter') setShowHelp(false); }}
          role="status"
          aria-live="polite"
          tabIndex={0}
        >
          <div className="help-title">🌊 Particle Life</div>
          <div className="help-body">
            Colored particles attract or repel based on configurable rules,
            creating emergent organic structures.
          </div>
          <div className="help-keys">
            <kbd>Space</kbd> Pause &nbsp;
            <kbd>R</kbd> Reset &nbsp;
            <kbd>S</kbd> Screenshot &nbsp;
            <kbd>E</kbd> Energy chart
            <br />
            <kbd>1</kbd> Attract &nbsp;
            <kbd>2</kbd> Repel &nbsp;
            <kbd>3</kbd> Spawn
          </div>
          <div className="help-dismiss">Click or press Esc to dismiss</div>
        </div>
      )}
    </div>
  );
};

const App: React.FC = () => (
  <ErrorBoundary>
    <AppInner />
  </ErrorBoundary>
);

export default App;

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
  rules: (PRESETS.find(p => p.name === 'Nebula')!.config.rules ?? DEFAULT_CONFIG.rules).map(r => [...r]),
};

/** Smoothstep interpolation for organic transitions */
function smoothstep(t: number): number {
  return t * t * (3 - 2 * t);
}

/** Lerp between two full configs, focusing on rules + continuous params */
function lerpConfig(from: SimulationConfig, to: SimulationConfig, t: number): SimulationConfig {
  const st = smoothstep(Math.max(0, Math.min(1, t)));
  const lerp = (a: number, b: number) => a + (b - a) * st;

  // Lerp rules matrix
  const rules = from.rules.map((row, i) =>
    row.map((val, j) => {
      const target = to.rules[i]?.[j] ?? val;
      return Math.round(lerp(val, target) * 1000) / 1000;
    })
  );

  return {
    ...to,
    // Lerp continuous parameters for smooth morphing
    speed: lerp(from.speed, to.speed),
    friction: lerp(from.friction, to.friction),
    maxRadius: Math.round(lerp(from.maxRadius, to.maxRadius)),
    minRadius: Math.round(lerp(from.minRadius, to.minRadius)),
    forceStrength: lerp(from.forceStrength, to.forceStrength),
    trailEffect: Math.round(lerp(from.trailEffect, to.trailEffect) * 100) / 100,
    particleSize: Math.round(lerp(from.particleSize, to.particleSize) * 10) / 10,
    // Snap discrete values at halfway
    particleCount: st < 0.5 ? from.particleCount : to.particleCount,
    glowEnabled: st < 0.5 ? from.glowEnabled : to.glowEnabled,
    colorMode: st < 0.5 ? from.colorMode : to.colorMode,
    webEnabled: st < 0.5 ? from.webEnabled : to.webEnabled,
    mutationEnabled: st < 0.5 ? from.mutationEnabled : to.mutationEnabled,
    rules,
  };
}

/** Curated preset order for cinematic autoplay (skip Random) */
const CINEMATIC_ORDER = PRESETS.filter(p => p.name !== 'Random');

const MORPH_DURATION_MS = 1200; // 1.2s smooth transition
const CINEMATIC_DWELL_MS = 12000; // 12s per preset in cinematic mode

const AppInner: React.FC = () => {
  const [config, setConfig] = useState<SimulationConfig>(INITIAL_CONFIG);
  const [isRunning, setIsRunning] = useState(true);
  const [simulation, setSimulation] = useState<ParticleSimulation | null>(null);
  const [showHelp, setShowHelp] = useState(true);
  const [showChart, setShowChart] = useState(false);
  const [mouseTool, setMouseTool] = useState<MouseTool>('attract');
  const [initialLayout, setInitialLayout] = useState<InitialLayout>('bigbang');
  const [resetKey, setResetKey] = useState(0);
  const [cinematic, setCinematic] = useState(false);
  const [activePresetName, setActivePresetName] = useState<string>('Nebula');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Morphing state
  const morphRef = useRef<{
    from: SimulationConfig;
    to: SimulationConfig;
    startTime: number;
    toName: string;
    raf: number;
  } | null>(null);

  /** Start a smooth morph from current config to target */
  const morphToConfig = useCallback((targetConfig: SimulationConfig, presetName: string) => {
    // Cancel any existing morph
    if (morphRef.current?.raf) cancelAnimationFrame(morphRef.current.raf);

    const fromConfig: SimulationConfig = {
      ...config,
      rules: config.rules.map(r => [...r]),
    };
    const toConfig: SimulationConfig = {
      ...config,
      ...targetConfig,
      rules: (targetConfig.rules ?? config.rules).map(r => [...r]),
    };

    const startTime = performance.now();

    const tick = () => {
      const elapsed = performance.now() - startTime;
      const t = Math.min(elapsed / MORPH_DURATION_MS, 1);
      const interpolated = lerpConfig(fromConfig, toConfig, t);

      setConfig(interpolated);

      if (t < 1) {
        morphRef.current = { from: fromConfig, to: toConfig, startTime, toName: presetName, raf: requestAnimationFrame(tick) };
      } else {
        setConfig(toConfig);
        setActivePresetName(presetName);
        morphRef.current = null;
      }
    };

    morphRef.current = { from: fromConfig, to: toConfig, startTime, toName: presetName, raf: requestAnimationFrame(tick) };
  }, [config]);

  /** Apply a preset with smooth morphing */
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

  const handleSimulationRef = useCallback((sim: ParticleSimulation | null) => {
    setSimulation(sim);
  }, []);

  // Cinematic autoplay — cycle through presets
  useEffect(() => {
    if (!cinematic) return;

    let idx = CINEMATIC_ORDER.findIndex(p => p.name === activePresetName);
    if (idx < 0) idx = 0;

    const timer = setInterval(() => {
      idx = (idx + 1) % CINEMATIC_ORDER.length;
      const preset = CINEMATIC_ORDER[idx];
      const targetConfig: SimulationConfig = {
        ...config,
        ...preset.config,
        rules: (preset.config.rules ?? config.rules).map(r => [...r]),
      };
      morphToConfig(targetConfig, preset.name);
    }, CINEMATIC_DWELL_MS);

    return () => clearInterval(timer);
  }, [cinematic, activePresetName, morphToConfig, config]);

  // Auto-hide help after 8 seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowHelp(false), 8000);
    return () => clearTimeout(timer);
  }, []);

  // Cleanup morph on unmount
  useEffect(() => {
    return () => {
      if (morphRef.current?.raf) cancelAnimationFrame(morphRef.current.raf);
    };
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.code === 'Space') { e.preventDefault(); toggleRunning(); }
      if (e.code === 'KeyR') { handleReset(); }
      if (e.code === 'KeyS') { handleScreenshot(); }
      if (e.code === 'KeyE') { setShowChart(v => !v); }
      if (e.code === 'KeyC') { setCinematic(v => !v); }
      if (e.code === 'Escape' && showHelp) { setShowHelp(false); }
      if (e.code === 'KeyW') { setConfig(c => ({ ...c, rules: c.rules.map(r => [...r]), webEnabled: !c.webEnabled })); }
      if (e.code === 'KeyM') { setConfig(c => ({ ...c, rules: c.rules.map(r => [...r]), mutationEnabled: !c.mutationEnabled })); }
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
      {/* Subtle vignette to frame the simulation */}
      <div className="canvas-vignette" aria-hidden="true" />
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
        cinematic={cinematic}
        onToggleCinematic={() => setCinematic(v => !v)}
        activePresetName={activePresetName}
        onMorphToPreset={morphToConfig}
      />

      {/* Floating energy chart */}
      {showChart && (
        <div className="floating-chart" role="complementary" aria-label="Species energy dynamics chart">
          <DynamicsChart simulation={simulation} visible={showChart} />
        </div>
      )}

      {/* Cinematic mode indicator */}
      {cinematic && (
        <div className="cinematic-badge" aria-live="polite">
          <span className="cinematic-dot" /> Cinematic · <strong>{activePresetName}</strong>
        </div>
      )}

      {/* Help overlay */}
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
            <kbd>E</kbd> Energy
            <br />
            <kbd>1</kbd> Attract &nbsp;
            <kbd>2</kbd> Repel &nbsp;
            <kbd>3</kbd> Spawn &nbsp;
            <kbd>C</kbd> Cinematic
            <br />
            <kbd>W</kbd> Connection Web &nbsp;
            <kbd>M</kbd> Mutation
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

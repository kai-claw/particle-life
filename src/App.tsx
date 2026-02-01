import { useState, useCallback, useEffect } from 'react';
import { ParticleCanvas } from './ParticleCanvas';
import { ControlPanel } from './ControlPanel';
import type { ParticleSimulation } from './simulation';
import type { SimulationConfig } from './types';
import { DEFAULT_CONFIG } from './types';
import './App.css';

const App: React.FC = () => {
  const [config, setConfig] = useState<SimulationConfig>(DEFAULT_CONFIG);
  const [isRunning, setIsRunning] = useState(true);
  const [simulation, setSimulation] = useState<ParticleSimulation | null>(null);
  const [showHelp, setShowHelp] = useState(true);
  const [resetKey, setResetKey] = useState(0);

  const handleConfigChange = useCallback((newConfig: SimulationConfig) => {
    setConfig(newConfig);
  }, []);

  const toggleRunning = useCallback(() => {
    setIsRunning((prev) => !prev);
  }, []);

  const handleReset = useCallback(() => {
    setResetKey((k) => k + 1);
  }, []);

  // Auto-hide help after 8 seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowHelp(false), 8000);
    return () => clearTimeout(timer);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.code === 'Space') { e.preventDefault(); toggleRunning(); }
      if (e.code === 'KeyR') { handleReset(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [toggleRunning, handleReset]);

  return (
    <div className="app">
      <ParticleCanvas
        key={resetKey}
        config={config}
        isRunning={isRunning}
        onSimulationRef={setSimulation}
      />
      <ControlPanel
        config={config}
        onConfigChange={handleConfigChange}
        isRunning={isRunning}
        onToggleRunning={toggleRunning}
        onReset={handleReset}
        simulation={simulation}
      />

      {/* Help overlay — auto-hides */}
      {showHelp && (
        <div className="help-overlay" onClick={() => setShowHelp(false)}>
          <div className="help-title">🌊 Particle Life</div>
          <div className="help-body">
            Colored particles attract or repel based on configurable rules,
            creating emergent organic structures.
          </div>
          <div className="help-keys">
            <kbd>Space</kbd> Pause/Play &nbsp;&nbsp;
            <kbd>R</kbd> Reset
          </div>
          <div className="help-dismiss">Click to dismiss</div>
        </div>
      )}
    </div>
  );
};

export default App;

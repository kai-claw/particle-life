import React, { useState, useCallback } from 'react';
import { ParticleCanvas } from './ParticleCanvas';
import { ControlPanel } from './ControlPanel';
import { ParticleSimulation } from './simulation';
import type { SimulationConfig } from './types';
import { DEFAULT_CONFIG } from './types';
import './App.css';

const App: React.FC = () => {
  const [config, setConfig] = useState<SimulationConfig>(DEFAULT_CONFIG);
  const [isRunning, setIsRunning] = useState(true);

  const handleConfigChange = useCallback((newConfig: SimulationConfig) => {
    setConfig(newConfig);
  }, []);

  const toggleRunning = useCallback(() => {
    setIsRunning(prev => !prev);
  }, []);

  const handleSimulationRef = useCallback((_sim: ParticleSimulation | null) => {
    // Simulation ref for potential future use
  }, []);

  return (
    <div className="app">
      <ParticleCanvas
        config={config}
        isRunning={isRunning}
        onSimulationRef={handleSimulationRef}
      />
      <ControlPanel
        config={config}
        onConfigChange={handleConfigChange}
        isRunning={isRunning}
        onToggleRunning={toggleRunning}
      />
      
      {/* Instruction overlay for first-time users */}
      <div
        style={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          background: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          padding: '15px',
          borderRadius: '5px',
          fontSize: '12px',
          maxWidth: '300px',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          zIndex: 10,
        }}
      >
        <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
          🌊 Particle Life Simulator
        </div>
        <div style={{ opacity: 0.9, lineHeight: 1.4 }}>
          Watch particles interact based on attraction/repulsion rules.
          Try different presets or randomize rules to discover emergent behaviors!
        </div>
      </div>
    </div>
  );
};

export default App;
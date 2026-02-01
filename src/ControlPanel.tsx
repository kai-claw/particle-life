import React, { useState } from 'react';
import type { SimulationConfig } from './types';
import { PARTICLE_COLORS, PARTICLE_TYPES } from './types';
import { PRESETS } from './presets';

interface ControlPanelProps {
  config: SimulationConfig;
  onConfigChange: (config: SimulationConfig) => void;
  isRunning: boolean;
  onToggleRunning: () => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  config,
  onConfigChange,
  isRunning,
  onToggleRunning,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState<'controls' | 'rules' | 'presets'>('controls');

  const updateConfig = (updates: Partial<SimulationConfig>) => {
    onConfigChange({ ...config, ...updates });
  };

  const handleRuleChange = (fromType: number, toType: number, value: number) => {
    const newRules = [...config.rules];
    newRules[fromType][toType] = value;
    updateConfig({ rules: newRules });
  };

  const randomizeRules = () => {
    const newRules = Array.from({ length: PARTICLE_TYPES }, () =>
      Array.from({ length: PARTICLE_TYPES }, () => (Math.random() - 0.5) * 2)
    );
    updateConfig({ rules: newRules });
  };

  const applyPreset = (presetConfig: Partial<SimulationConfig>) => {
    onConfigChange({ ...config, ...presetConfig });
  };

  if (!isExpanded) {
    return (
      <div style={{ position: 'fixed', top: 20, left: 20, zIndex: 10 }}>
        <button
          onClick={() => setIsExpanded(true)}
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            color: 'white',
            padding: '10px 15px',
            borderRadius: '5px',
            cursor: 'pointer',
            backdropFilter: 'blur(10px)',
          }}
        >
          ☰ Controls
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 20,
        left: 20,
        width: 350,
        background: 'rgba(0, 0, 0, 0.85)',
        border: '1px solid rgba(255, 255, 255, 0.3)',
        borderRadius: '10px',
        color: 'white',
        backdropFilter: 'blur(10px)',
        zIndex: 10,
        maxHeight: 'calc(100vh - 40px)',
        overflowY: 'auto',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '15px 20px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
        }}
      >
        <h2 style={{ margin: 0, fontSize: '18px' }}>Particle Life</h2>
        <button
          onClick={() => setIsExpanded(false)}
          style={{
            background: 'none',
            border: 'none',
            color: 'white',
            fontSize: '18px',
            cursor: 'pointer',
          }}
        >
          ×
        </button>
      </div>

      <div style={{ padding: '15px 20px' }}>
        <button
          onClick={onToggleRunning}
          style={{
            width: '100%',
            padding: '12px',
            background: isRunning ? '#ff4444' : '#44ff44',
            color: 'black',
            border: 'none',
            borderRadius: '5px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: 'pointer',
            marginBottom: '15px',
          }}
        >
          {isRunning ? 'Pause' : 'Start'}
        </button>

        <div style={{ display: 'flex', marginBottom: '15px' }}>
          {(['controls', 'rules', 'presets'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                flex: 1,
                padding: '8px',
                background: activeTab === tab ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 'controls' && (
          <div>
            <div style={{ marginBottom: '15px' }}>
              <label>Particles: {config.particleCount}</label>
              <input
                type="range"
                min="500"
                max="5000"
                step="100"
                value={config.particleCount}
                onChange={(e) => updateConfig({ particleCount: parseInt(e.target.value) })}
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label>Speed: {config.speed.toFixed(1)}</label>
              <input
                type="range"
                min="0.1"
                max="3.0"
                step="0.1"
                value={config.speed}
                onChange={(e) => updateConfig({ speed: parseFloat(e.target.value) })}
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label>Friction: {config.friction.toFixed(3)}</label>
              <input
                type="range"
                min="0.001"
                max="0.1"
                step="0.001"
                value={config.friction}
                onChange={(e) => updateConfig({ friction: parseFloat(e.target.value) })}
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label>Radius: {config.radius}</label>
              <input
                type="range"
                min="30"
                max="200"
                step="5"
                value={config.radius}
                onChange={(e) => updateConfig({ radius: parseInt(e.target.value) })}
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label>Force: {config.forceStrength.toFixed(2)}</label>
              <input
                type="range"
                min="0.1"
                max="2.0"
                step="0.1"
                value={config.forceStrength}
                onChange={(e) => updateConfig({ forceStrength: parseFloat(e.target.value) })}
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label>
                <input
                  type="checkbox"
                  checked={config.trailEffect}
                  onChange={(e) => updateConfig({ trailEffect: e.target.checked })}
                  style={{ marginRight: '8px' }}
                />
                Trail Effect
              </label>
            </div>
          </div>
        )}

        {activeTab === 'rules' && (
          <div>
            <div style={{ marginBottom: '15px' }}>
              <button
                onClick={randomizeRules}
                style={{
                  width: '100%',
                  padding: '10px',
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: 'none',
                  color: 'white',
                  borderRadius: '5px',
                  cursor: 'pointer',
                }}
              >
                🎲 Randomize Rules
              </button>
            </div>

            <div style={{ fontSize: '12px', marginBottom: '10px' }}>
              Attraction/Repulsion Matrix (-1 to 1)
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: `30px repeat(${PARTICLE_TYPES}, 1fr)`,
                gap: '2px',
                fontSize: '10px',
              }}
            >
              <div></div>
              {PARTICLE_COLORS.map((color, i) => (
                <div
                  key={i}
                  style={{
                    background: color,
                    height: '20px',
                    borderRadius: '2px',
                  }}
                />
              ))}

              {config.rules.map((row, fromType) => (
                <React.Fragment key={fromType}>
                  <div
                    style={{
                      background: PARTICLE_COLORS[fromType],
                      height: '25px',
                      borderRadius: '2px',
                    }}
                  />
                  {row.map((value, toType) => (
                    <input
                      key={toType}
                      type="number"
                      min="-1"
                      max="1"
                      step="0.1"
                      value={value.toFixed(1)}
                      onChange={(e) =>
                        handleRuleChange(fromType, toType, parseFloat(e.target.value) || 0)
                      }
                      style={{
                        width: '100%',
                        height: '25px',
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: 'none',
                        color: 'white',
                        fontSize: '9px',
                        textAlign: 'center',
                        borderRadius: '2px',
                      }}
                    />
                  ))}
                </React.Fragment>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'presets' && (
          <div>
            {PRESETS.map((preset, index) => (
              <div
                key={index}
                style={{
                  marginBottom: '12px',
                  padding: '12px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '5px',
                  cursor: 'pointer',
                }}
                onClick={() => applyPreset(preset.config)}
              >
                <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                  {preset.name}
                </div>
                <div style={{ fontSize: '12px', opacity: 0.8 }}>
                  {preset.description}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
import React, { useState, useCallback } from 'react';
import type { SimulationConfig } from './types';
import { PARTICLE_COLORS, PARTICLE_TYPES } from './types';
import { PRESETS } from './presets';
import type { ParticleSimulation } from './simulation';

interface ControlPanelProps {
  config: SimulationConfig;
  onConfigChange: (config: SimulationConfig) => void;
  isRunning: boolean;
  onToggleRunning: () => void;
  onReset: () => void;
  simulation: ParticleSimulation | null;
}

const Slider: React.FC<{
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format?: (v: number) => string;
  onChange: (v: number) => void;
}> = ({ label, value, min, max, step, format, onChange }) => (
  <div className="slider-row">
    <div className="slider-header">
      <span className="slider-label">{label}</span>
      <span className="slider-value">{format ? format(value) : value}</span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
    />
  </div>
);

export const ControlPanel: React.FC<ControlPanelProps> = ({
  config,
  onConfigChange,
  isRunning,
  onToggleRunning,
  onReset,
  simulation,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState<'controls' | 'rules' | 'presets'>('controls');

  const updateConfig = useCallback(
    (updates: Partial<SimulationConfig>) => {
      onConfigChange({ ...config, rules: config.rules.map(r => [...r]), ...updates });
    },
    [config, onConfigChange]
  );

  const handleRuleChange = useCallback(
    (from: number, to: number, value: number) => {
      const newRules = config.rules.map(r => [...r]);
      newRules[from][to] = Math.max(-1, Math.min(1, value));
      onConfigChange({ ...config, rules: newRules });
    },
    [config, onConfigChange]
  );

  const randomizeRules = useCallback(() => {
    const newRules = Array.from({ length: PARTICLE_TYPES }, () =>
      Array.from({ length: PARTICLE_TYPES }, () =>
        Math.round((Math.random() * 2 - 1) * 100) / 100
      )
    );
    onConfigChange({ ...config, rules: newRules });
  }, [config, onConfigChange]);

  const applyPreset = useCallback(
    (presetConfig: Partial<SimulationConfig>) => {
      onConfigChange({ ...config, ...presetConfig });
    },
    [config, onConfigChange]
  );

  const fps = simulation?.fps ?? 0;

  if (!isExpanded) {
    return (
      <button
        className="panel-toggle"
        onClick={() => setIsExpanded(true)}
      >
        ☰ Controls
      </button>
    );
  }

  return (
    <div className="control-panel">
      {/* Header */}
      <div className="panel-header">
        <div className="panel-title">
          <h2>Particle Life</h2>
          <span className="fps-badge">{fps} FPS</span>
        </div>
        <button className="close-btn" onClick={() => setIsExpanded(false)}>×</button>
      </div>

      {/* Action buttons */}
      <div className="panel-actions">
        <button
          className={`btn-primary ${isRunning ? 'btn-pause' : 'btn-play'}`}
          onClick={onToggleRunning}
        >
          {isRunning ? '⏸ Pause' : '▶ Play'}
        </button>
        <button className="btn-secondary" onClick={onReset}>
          ↺ Reset
        </button>
        <button className="btn-secondary" onClick={randomizeRules}>
          🎲 Randomize
        </button>
      </div>

      {/* Tabs */}
      <div className="tab-bar">
        {(['controls', 'rules', 'presets'] as const).map((tab) => (
          <button
            key={tab}
            className={`tab ${activeTab === tab ? 'tab-active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'controls' ? '⚙' : tab === 'rules' ? '🧪' : '📋'}{' '}
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="tab-content">
        {activeTab === 'controls' && (
          <div className="controls-tab">
            <Slider
              label="Particles"
              value={config.particleCount}
              min={200}
              max={5000}
              step={100}
              onChange={(v) => updateConfig({ particleCount: v })}
            />
            <Slider
              label="Speed"
              value={config.speed}
              min={0.1}
              max={3.0}
              step={0.1}
              format={(v) => v.toFixed(1)}
              onChange={(v) => updateConfig({ speed: v })}
            />
            <Slider
              label="Friction"
              value={config.friction}
              min={0.01}
              max={0.9}
              step={0.01}
              format={(v) => v.toFixed(2)}
              onChange={(v) => updateConfig({ friction: v })}
            />
            <Slider
              label="Max Radius"
              value={config.maxRadius}
              min={30}
              max={200}
              step={5}
              onChange={(v) => updateConfig({ maxRadius: v })}
            />
            <Slider
              label="Min Radius"
              value={config.minRadius}
              min={5}
              max={80}
              step={1}
              onChange={(v) => updateConfig({ minRadius: v })}
            />
            <Slider
              label="Force"
              value={config.forceStrength}
              min={0.1}
              max={3.0}
              step={0.1}
              format={(v) => v.toFixed(1)}
              onChange={(v) => updateConfig({ forceStrength: v })}
            />
            <Slider
              label="Trail"
              value={config.trailEffect}
              min={0}
              max={0.3}
              step={0.01}
              format={(v) => v === 0 ? 'Off' : v.toFixed(2)}
              onChange={(v) => updateConfig({ trailEffect: v })}
            />
            <Slider
              label="Dot Size"
              value={config.particleSize}
              min={1}
              max={5}
              step={0.5}
              format={(v) => v.toFixed(1)}
              onChange={(v) => updateConfig({ particleSize: v })}
            />
          </div>
        )}

        {activeTab === 'rules' && (
          <div className="rules-tab">
            <p className="rules-help">
              Each cell controls how <strong>row color</strong> reacts to <strong>column color</strong>.
              <br />Positive = attract · Negative = repel
            </p>

            <div
              className="rule-matrix"
              style={{
                gridTemplateColumns: `32px repeat(${PARTICLE_TYPES}, 1fr)`,
              }}
            >
              {/* Column headers */}
              <div />
              {PARTICLE_COLORS.map((color, i) => (
                <div
                  key={`ch-${i}`}
                  className="rule-dot-header"
                  style={{ background: color }}
                />
              ))}

              {/* Matrix rows */}
              {config.rules.map((row, fromType) => (
                <React.Fragment key={`row-${fromType}`}>
                  <div
                    className="rule-dot-header"
                    style={{ background: PARTICLE_COLORS[fromType] }}
                  />
                  {row.map((value, toType) => {
                    const intensity = Math.abs(value);
                    const bg =
                      value > 0
                        ? `rgba(50, 255, 100, ${intensity * 0.4})`
                        : value < 0
                        ? `rgba(255, 60, 60, ${intensity * 0.4})`
                        : 'rgba(255,255,255,0.05)';
                    return (
                      <input
                        key={`${fromType}-${toType}`}
                        type="number"
                        min="-1"
                        max="1"
                        step="0.1"
                        value={value.toFixed(1)}
                        onChange={(e) =>
                          handleRuleChange(fromType, toType, parseFloat(e.target.value) || 0)
                        }
                        className="rule-cell"
                        style={{ background: bg }}
                      />
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'presets' && (
          <div className="presets-tab">
            {PRESETS.map((preset, i) => (
              <button
                key={i}
                className="preset-card"
                onClick={() => applyPreset(preset.config)}
              >
                <span className="preset-emoji">{preset.emoji}</span>
                <div className="preset-info">
                  <div className="preset-name">{preset.name}</div>
                  <div className="preset-desc">{preset.description}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

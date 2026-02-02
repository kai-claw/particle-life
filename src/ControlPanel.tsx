import React, { useState, useCallback } from 'react';
import type { SimulationConfig, ColorMode, MouseTool, InitialLayout } from './types';
import { PARTICLE_COLORS, PARTICLE_TYPES } from './types';
import { PRESETS, randomRules } from './presets';
import type { ParticleSimulation } from './simulation';

/** Color names for screen readers (matches PARTICLE_COLORS order) */
const COLOR_NAMES = ['Red', 'Green', 'Blue', 'Yellow', 'Cyan', 'Magenta'];

/** Initial layout options */
const LAYOUTS: { id: InitialLayout; emoji: string; name: string }[] = [
  { id: 'random', emoji: '🎲', name: 'Random' },
  { id: 'bigbang', emoji: '💥', name: 'Big Bang' },
  { id: 'spiral', emoji: '🌀', name: 'Spiral' },
  { id: 'grid', emoji: '⊞', name: 'Grid' },
  { id: 'ring', emoji: '⭕', name: 'Rings' },
  { id: 'clusters', emoji: '🫧', name: 'Clusters' },
];

/** Color mode options */
const COLOR_MODES: { id: ColorMode; emoji: string; name: string; desc: string }[] = [
  { id: 'type', emoji: '🎨', name: 'Species', desc: 'Color by particle type' },
  { id: 'velocity', emoji: '🌡️', name: 'Velocity', desc: 'Plasma heatmap by speed' },
  { id: 'density', emoji: '🔬', name: 'Density', desc: 'Cool→warm by crowding' },
];

/** Mouse tool options */
const MOUSE_TOOLS: { id: MouseTool; emoji: string; name: string }[] = [
  { id: 'attract', emoji: '🧲', name: 'Attract' },
  { id: 'repel', emoji: '💨', name: 'Repel' },
  { id: 'spawn', emoji: '✨', name: 'Spawn' },
];

interface ControlPanelProps {
  config: SimulationConfig;
  onConfigChange: (config: SimulationConfig) => void;
  isRunning: boolean;
  onToggleRunning: () => void;
  onReset: () => void;
  onResetWithLayout: (layout: InitialLayout) => void;
  onScreenshot: () => void;
  mouseTool: MouseTool;
  onMouseToolChange: (tool: MouseTool) => void;
  simulation: ParticleSimulation | null;
  showChart: boolean;
  onToggleChart: () => void;
  cinematic: boolean;
  onToggleCinematic: () => void;
  activePresetName: string;
  onMorphToPreset: (config: SimulationConfig, name: string) => void;
}

const Slider: React.FC<{
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format?: (v: number) => string;
  onChange: (v: number) => void;
  id: string;
}> = ({ label, value, min, max, step, format, onChange, id }) => (
  <div className="slider-row">
    <div className="slider-header">
      <label className="slider-label" htmlFor={id}>{label}</label>
      <span className="slider-value" aria-hidden="true">{format ? format(value) : value}</span>
    </div>
    <input
      id={id}
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-valuetext={format ? format(value) : String(value)}
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
  onResetWithLayout,
  onScreenshot,
  mouseTool,
  onMouseToolChange,
  simulation,
  showChart,
  onToggleChart,
  cinematic,
  onToggleCinematic,
  activePresetName,
  onMorphToPreset,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState<'controls' | 'rules' | 'presets' | 'creative'>('controls');

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
    onConfigChange({ ...config, rules: randomRules() });
  }, [config, onConfigChange]);

  const applyPreset = useCallback(
    (preset: { config: Partial<SimulationConfig>; name: string }) => {
      if (preset.name === 'Random') {
        // Random: instant change (can't morph to unknown rules)
        onConfigChange({ ...config, ...preset.config, rules: randomRules() });
      } else {
        // Smooth morph to preset
        const targetConfig: SimulationConfig = {
          ...config,
          ...preset.config,
          rules: (preset.config.rules ?? config.rules).map(r => [...r]),
        };
        onMorphToPreset(targetConfig, preset.name);
      }
    },
    [config, onConfigChange, onMorphToPreset]
  );

  const fps = simulation?.fps ?? 0;

  if (!isExpanded) {
    return (
      <button
        className="panel-toggle"
        onClick={() => setIsExpanded(true)}
        aria-label="Open control panel"
        aria-expanded="false"
      >
        ☰ Controls
      </button>
    );
  }

  return (
    <div className="control-panel" role="region" aria-label="Simulation controls">
      {/* Header */}
      <div className="panel-header">
        <div className="panel-title">
          <h2>Particle Life</h2>
          <span className="fps-badge" aria-live="polite" aria-label={`${fps} frames per second`}>{fps} FPS</span>
        </div>
        <button
          className="close-btn"
          onClick={() => setIsExpanded(false)}
          aria-label="Close control panel"
          aria-expanded="true"
        >×</button>
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
        <button className="btn-secondary btn-screenshot" onClick={onScreenshot} title="Save screenshot (PNG)">
          📸
        </button>
      </div>

      {/* Tabs */}
      <div className="tab-bar" role="tablist" aria-label="Control panel sections">
        {(['controls', 'rules', 'presets', 'creative'] as const).map((tab) => (
          <button
            key={tab}
            role="tab"
            id={`tab-${tab}`}
            aria-selected={activeTab === tab}
            aria-controls={`tabpanel-${tab}`}
            className={`tab ${activeTab === tab ? 'tab-active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'controls' ? '⚙' : tab === 'rules' ? '🧪' : tab === 'presets' ? '📋' : '✨'}{' '}
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="tab-content">
        {activeTab === 'controls' && (
          <div className="controls-tab" role="tabpanel" id="tabpanel-controls" aria-labelledby="tab-controls">
            <Slider
              id="slider-particles"
              label="Particles"
              value={config.particleCount}
              min={200}
              max={5000}
              step={100}
              onChange={(v) => updateConfig({ particleCount: v })}
            />
            <Slider
              id="slider-speed"
              label="Speed"
              value={config.speed}
              min={0.1}
              max={3.0}
              step={0.1}
              format={(v) => v.toFixed(1)}
              onChange={(v) => updateConfig({ speed: v })}
            />
            <Slider
              id="slider-friction"
              label="Friction"
              value={config.friction}
              min={0.01}
              max={0.9}
              step={0.01}
              format={(v) => v.toFixed(2)}
              onChange={(v) => updateConfig({ friction: v })}
            />
            <Slider
              id="slider-maxradius"
              label="Max Radius"
              value={config.maxRadius}
              min={30}
              max={200}
              step={5}
              onChange={(v) => {
                const updates: Partial<SimulationConfig> = { maxRadius: v };
                if (config.minRadius > v) updates.minRadius = Math.round(v * 0.3);
                updateConfig(updates);
              }}
            />
            <Slider
              id="slider-minradius"
              label="Min Radius"
              value={config.minRadius}
              min={5}
              max={Math.min(80, config.maxRadius - 1)}
              step={1}
              onChange={(v) => updateConfig({ minRadius: Math.min(v, config.maxRadius - 1) })}
            />
            <Slider
              id="slider-force"
              label="Force"
              value={config.forceStrength}
              min={0.1}
              max={3.0}
              step={0.1}
              format={(v) => v.toFixed(1)}
              onChange={(v) => updateConfig({ forceStrength: v })}
            />
            <Slider
              id="slider-trail"
              label="Trail"
              value={config.trailEffect}
              min={0}
              max={0.3}
              step={0.01}
              format={(v) => v === 0 ? 'Off' : v.toFixed(2)}
              onChange={(v) => updateConfig({ trailEffect: v })}
            />
            <Slider
              id="slider-dotsize"
              label="Dot Size"
              value={config.particleSize}
              min={1}
              max={5}
              step={0.5}
              format={(v) => v.toFixed(1)}
              onChange={(v) => updateConfig({ particleSize: v })}
            />

            {/* Glow toggle */}
            <div className="toggle-row">
              <label htmlFor="toggle-glow" className="slider-label">✨ Glow Effect</label>
              <button
                id="toggle-glow"
                className={`toggle-btn ${config.glowEnabled ? 'toggle-on' : ''}`}
                onClick={() => updateConfig({ glowEnabled: !config.glowEnabled })}
                aria-pressed={config.glowEnabled}
              >
                {config.glowEnabled ? 'ON' : 'OFF'}
              </button>
            </div>

            {/* Energy Chart toggle */}
            <div className="toggle-row">
              <label htmlFor="toggle-chart" className="slider-label">📊 Energy Chart</label>
              <button
                id="toggle-chart"
                className={`toggle-btn ${showChart ? 'toggle-on' : ''}`}
                onClick={onToggleChart}
                aria-pressed={showChart}
              >
                {showChart ? 'ON' : 'OFF'}
              </button>
            </div>

            <div className="mouse-hint">
              <span className="hint-icon" aria-hidden="true">🖱️</span>
              <span className="hint-text">Click & drag to interact · Switch tools in ✨ Creative tab</span>
            </div>
          </div>
        )}

        {activeTab === 'rules' && (
          <div className="rules-tab" role="tabpanel" id="tabpanel-rules" aria-labelledby="tab-rules">
            <p className="rules-help">
              Each cell controls how <strong>row color</strong> reacts to <strong>column color</strong>.
              <br /><span aria-hidden="true">+</span> Positive = attract · <span aria-hidden="true">−</span> Negative = repel
            </p>

            <div
              className="rule-matrix"
              role="grid"
              aria-label="Particle interaction rule matrix"
              style={{
                gridTemplateColumns: `32px repeat(${PARTICLE_TYPES}, 1fr)`,
              }}
            >
              <div role="columnheader" />
              {PARTICLE_COLORS.map((color, i) => (
                <div
                  key={`ch-${i}`}
                  role="columnheader"
                  className="rule-dot-header"
                  style={{ background: color }}
                  aria-label={COLOR_NAMES[i]}
                  title={COLOR_NAMES[i]}
                />
              ))}

              {config.rules.map((row, fromType) => (
                <React.Fragment key={`row-${fromType}`}>
                  <div
                    role="rowheader"
                    className="rule-dot-header"
                    style={{ background: PARTICLE_COLORS[fromType] }}
                    aria-label={COLOR_NAMES[fromType]}
                    title={COLOR_NAMES[fromType]}
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
                        aria-label={`${COLOR_NAMES[fromType]} → ${COLOR_NAMES[toType]}: ${value > 0 ? 'attract' : value < 0 ? 'repel' : 'neutral'} ${value.toFixed(1)}`}
                        title={`${COLOR_NAMES[fromType]} → ${COLOR_NAMES[toType]}`}
                      />
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'presets' && (
          <div className="presets-tab" role="tabpanel" id="tabpanel-presets" aria-labelledby="tab-presets">
            {/* Cinematic autoplay toggle */}
            <div className="cinematic-toggle">
              <div className="cinematic-info">
                <span className="cinematic-label">🎬 Cinematic</span>
                <span className="cinematic-sublabel">Auto-morphs through presets</span>
              </div>
              <button
                className={`toggle-btn ${cinematic ? 'toggle-on' : ''}`}
                onClick={onToggleCinematic}
                aria-pressed={cinematic}
              >
                {cinematic ? 'ON' : 'OFF'}
              </button>
            </div>

            {PRESETS.map((preset, i) => (
              <button
                key={i}
                className={`preset-card ${activePresetName === preset.name ? 'preset-active' : ''}`}
                onClick={() => applyPreset(preset)}
                aria-label={`${preset.name}: ${preset.description}`}
                aria-current={activePresetName === preset.name ? 'true' : undefined}
              >
                <span className="preset-emoji" aria-hidden="true">{preset.emoji}</span>
                <div className="preset-info">
                  <div className="preset-name">{preset.name}</div>
                  <div className="preset-desc">{preset.description}</div>
                </div>
                {activePresetName === preset.name && (
                  <span className="preset-active-dot" aria-hidden="true" />
                )}
              </button>
            ))}
          </div>
        )}

        {activeTab === 'creative' && (
          <div className="creative-tab" role="tabpanel" id="tabpanel-creative" aria-labelledby="tab-creative">
            {/* Color Mode */}
            <div className="section-label">Color Mode</div>
            <div className="mode-picker">
              {COLOR_MODES.map((mode) => (
                <button
                  key={mode.id}
                  className={`mode-btn ${config.colorMode === mode.id ? 'mode-active' : ''}`}
                  onClick={() => updateConfig({ colorMode: mode.id })}
                  title={mode.desc}
                  aria-pressed={config.colorMode === mode.id}
                >
                  <span className="mode-emoji" aria-hidden="true">{mode.emoji}</span>
                  <span className="mode-name">{mode.name}</span>
                </button>
              ))}
            </div>

            {/* Mouse Tool */}
            <div className="section-label">Mouse Tool <span className="section-hint">(click & drag on canvas)</span></div>
            <div className="mode-picker">
              {MOUSE_TOOLS.map((tool) => (
                <button
                  key={tool.id}
                  className={`mode-btn ${mouseTool === tool.id ? 'mode-active' : ''}`}
                  onClick={() => onMouseToolChange(tool.id)}
                  aria-pressed={mouseTool === tool.id}
                >
                  <span className="mode-emoji" aria-hidden="true">{tool.emoji}</span>
                  <span className="mode-name">{tool.name}</span>
                </button>
              ))}
            </div>

            {/* Initial Layout */}
            <div className="section-label">Launch Pattern <span className="section-hint">(resets simulation)</span></div>
            <div className="layout-picker">
              {LAYOUTS.map((layout) => (
                <button
                  key={layout.id}
                  className="layout-btn"
                  onClick={() => onResetWithLayout(layout.id)}
                  title={`Reset with ${layout.name} pattern`}
                >
                  <span aria-hidden="true">{layout.emoji}</span> {layout.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

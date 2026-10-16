import React, { useState, useEffect } from 'react';
import {
  Palette,
  Sparkles,
  SlidersHorizontal,
  RotateCcw,
  Check,
  X,
  Pipette,
  Layers,
  Sun,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import {
  GUI_THEME_PRESETS,
  DEFAULT_GUI_THEME,
  type GuiColorPalette,
  getStoredGuiTheme,
  saveGuiTheme,
  normalizeTheme
} from '../gui-theme';

interface GuiThemeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GuiThemeModal: React.FC<GuiThemeModalProps> = ({ isOpen, onClose }) => {
  const [theme, setTheme] = useState<GuiColorPalette>(() => getStoredGuiTheme());
  const [activeTab, setActiveTab] = useState<'presets' | 'custom' | 'artwork'>('presets');
  const [justAppliedNotice, setJustAppliedNotice] = useState(false);

  // Sync state if external change occurs
  useEffect(() => {
    const handleThemeChange = (e: Event) => {
      const customEvent = e as CustomEvent<GuiColorPalette>;
      if (customEvent.detail) {
        setTheme(customEvent.detail);
      }
    };
    window.addEventListener('gui-theme-changed', handleThemeChange);
    return () => window.removeEventListener('gui-theme-changed', handleThemeChange);
  }, []);

  if (!isOpen) return null;

  const handleApplyPreset = (preset: GuiColorPalette) => {
    setTheme(preset);
    saveGuiTheme(preset);
    triggerNotice();
  };

  const handleUpdateField = <K extends keyof GuiColorPalette>(field: K, val: GuiColorPalette[K]) => {
    const updated = normalizeTheme({
      ...theme,
      id: 'custom-palette',
      name: 'Custom Tailored Theme',
      [field]: val
    });
    setTheme(updated);
    saveGuiTheme(updated);
    triggerNotice();
  };

  const handleResetDefaults = () => {
    setTheme(DEFAULT_GUI_THEME);
    saveGuiTheme(DEFAULT_GUI_THEME);
    triggerNotice();
  };

  const triggerNotice = () => {
    setJustAppliedNotice(true);
    setTimeout(() => setJustAppliedNotice(false), 2000);
  };

  return (
    <div className="modal-backdrop gui-theme-modal-backdrop" onClick={onClose}>
      <div
        className="gui-theme-modal-panel"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Application Color & Visual Theme Studio"
      >
        {/* Header */}
        <div className="gui-theme-header">
          <div className="gui-theme-title-group">
            <div
              className="gui-theme-icon-badge"
              style={{
                background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
                boxShadow: `0 0 16px ${theme.primary}66`
              }}
            >
              <Palette size={20} color="#ffffff" />
            </div>
            <div>
              <div className="gui-theme-eyebrow" style={{ color: theme.accent }}>
                System-Wide Theme & Visual Staging
              </div>
              <h2 className="gui-theme-heading">Global GUI Color Studio</h2>
            </div>
          </div>

          <div className="gui-theme-header-actions">
            {justAppliedNotice && (
              <div className="gui-theme-applied-badge">
                <CheckCircle2 size={13} />
                <span>Colors Applied to GUI</span>
              </div>
            )}
            <button
              type="button"
              className="btn-theme-modal-close"
              onClick={onClose}
              title="Close theme studio"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Live Preview Strip */}
        <div className="gui-theme-preview-banner">
          <div className="preview-label">Live Active Theme:</div>
          <div className="preview-swatches-row">
            <div className="swatch-item">
              <span className="swatch-circle" style={{ background: theme.primary }} />
              <span className="swatch-name">Primary</span>
            </div>
            <div className="swatch-item">
              <span className="swatch-circle" style={{ background: theme.secondary }} />
              <span className="swatch-name">Secondary</span>
            </div>
            <div className="swatch-item">
              <span className="swatch-circle" style={{ background: theme.accent }} />
              <span className="swatch-name">Accent</span>
            </div>
            <div className="swatch-item">
              <span className="swatch-circle" style={{ background: theme.surfaceCard, border: `1px solid ${theme.border}` }} />
              <span className="swatch-name">Surface</span>
            </div>
            <div className="swatch-item">
              <span className="swatch-circle" style={{ background: theme.bg }} />
              <span className="swatch-name">Canvas</span>
            </div>
          </div>
          <div className="preview-theme-title" style={{ color: theme.accent }}>
            {theme.name}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="gui-theme-tabs">
          <button
            type="button"
            className={`gui-theme-tab-btn ${activeTab === 'presets' ? 'active' : ''}`}
            onClick={() => setActiveTab('presets')}
          >
            <Sparkles size={15} />
            <span>Instant Presets (9)</span>
          </button>
          <button
            type="button"
            className={`gui-theme-tab-btn ${activeTab === 'custom' ? 'active' : ''}`}
            onClick={() => setActiveTab('custom')}
          >
            <Pipette size={15} />
            <span>Custom Color Pickers</span>
          </button>
          <button
            type="button"
            className={`gui-theme-tab-btn ${activeTab === 'artwork' ? 'active' : ''}`}
            onClick={() => setActiveTab('artwork')}
          >
            <SlidersHorizontal size={15} />
            <span>Mandala & Visual Hue Shift</span>
          </button>
        </div>

        {/* Tab 1: Instant Presets */}
        {activeTab === 'presets' && (
          <div className="gui-theme-content-area">
            <p className="gui-theme-section-tip">
              Select any curated color harmony below. Your selection immediately permeates all screens, buttons, navigation tabs, cards, and the 3D breathing sphere.
            </p>
            <div className="gui-presets-grid">
              {GUI_THEME_PRESETS.map(preset => {
                const isSelected = theme.id === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    className={`gui-preset-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleApplyPreset(preset)}
                    style={{
                      borderColor: isSelected ? preset.primary : undefined,
                      boxShadow: isSelected ? `0 0 16px ${preset.primary}44` : undefined
                    }}
                  >
                    <div
                      className="gui-preset-header-strip"
                      style={{
                        background: `linear-gradient(135deg, ${preset.primary} 0%, ${preset.secondary} 100%)`
                      }}
                    >
                      <div className="strip-dots">
                        <span style={{ background: preset.accent }} />
                        <span style={{ background: preset.bg }} />
                        <span style={{ background: preset.surface }} />
                      </div>
                      {isSelected && (
                        <div className="preset-selected-check">
                          <Check size={14} color="#ffffff" />
                        </div>
                      )}
                    </div>
                    <div className="gui-preset-body">
                      <div className="gui-preset-title">{preset.name}</div>
                      <div className="gui-preset-hexes">
                        <span style={{ color: preset.primary }}>● {preset.primary}</span>
                        <span style={{ color: preset.secondary }}>● {preset.secondary}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 2: Custom Pickers */}
        {activeTab === 'custom' && (
          <div className="gui-theme-content-area">
            <p className="gui-theme-section-tip">
              Customize any color in the entire interface. Every adjustment updates the live application canvas, header, buttons, and panels instantly.
            </p>
            <div className="gui-pickers-grid">
              {/* Primary Accent */}
              <div className="gui-picker-cell">
                <div className="cell-top">
                  <span className="cell-title">Primary Accent (Buttons & Focus)</span>
                  <span className="cell-hex" style={{ color: theme.primary }}>{theme.primary}</span>
                </div>
                <div className="cell-controls">
                  <input
                    type="color"
                    className="gui-native-picker"
                    value={theme.primary}
                    onChange={e => handleUpdateField('primary', e.target.value)}
                  />
                  <input
                    type="text"
                    className="gui-hex-input"
                    value={theme.primary}
                    onChange={e => handleUpdateField('primary', e.target.value)}
                  />
                </div>
              </div>

              {/* Secondary Gradient */}
              <div className="gui-picker-cell">
                <div className="cell-top">
                  <span className="cell-title">Secondary Harmonic</span>
                  <span className="cell-hex" style={{ color: theme.secondary }}>{theme.secondary}</span>
                </div>
                <div className="cell-controls">
                  <input
                    type="color"
                    className="gui-native-picker"
                    value={theme.secondary}
                    onChange={e => handleUpdateField('secondary', e.target.value)}
                  />
                  <input
                    type="text"
                    className="gui-hex-input"
                    value={theme.secondary}
                    onChange={e => handleUpdateField('secondary', e.target.value)}
                  />
                </div>
              </div>

              {/* Accent Highlight Lines */}
              <div className="gui-picker-cell">
                <div className="cell-top">
                  <span className="cell-title">Accent Lines & Active Tabs</span>
                  <span className="cell-hex" style={{ color: theme.accent }}>{theme.accent}</span>
                </div>
                <div className="cell-controls">
                  <input
                    type="color"
                    className="gui-native-picker"
                    value={theme.accent}
                    onChange={e => {
                      handleUpdateField('accent', e.target.value);
                      handleUpdateField('textAccent', e.target.value);
                    }}
                  />
                  <input
                    type="text"
                    className="gui-hex-input"
                    value={theme.accent}
                    onChange={e => {
                      handleUpdateField('accent', e.target.value);
                      handleUpdateField('textAccent', e.target.value);
                    }}
                  />
                </div>
              </div>

              {/* App Canvas Background */}
              <div className="gui-picker-cell">
                <div className="cell-top">
                  <span className="cell-title">App Background Canvas</span>
                  <span className="cell-hex" style={{ color: theme.bg }}>{theme.bg}</span>
                </div>
                <div className="cell-controls">
                  <input
                    type="color"
                    className="gui-native-picker"
                    value={theme.bg}
                    onChange={e => handleUpdateField('bg', e.target.value)}
                  />
                  <input
                    type="text"
                    className="gui-hex-input"
                    value={theme.bg}
                    onChange={e => handleUpdateField('bg', e.target.value)}
                  />
                </div>
              </div>

              {/* Panel & Card Surface */}
              <div className="gui-picker-cell">
                <div className="cell-top">
                  <span className="cell-title">Panel & Navigation Surface</span>
                  <span className="cell-hex" style={{ color: theme.surface }}>{theme.surface}</span>
                </div>
                <div className="cell-controls">
                  <input
                    type="color"
                    className="gui-native-picker"
                    value={theme.surface}
                    onChange={e => handleUpdateField('surface', e.target.value)}
                  />
                  <input
                    type="text"
                    className="gui-hex-input"
                    value={theme.surface}
                    onChange={e => handleUpdateField('surface', e.target.value)}
                  />
                </div>
              </div>

              {/* Card & Element Border */}
              <div className="gui-picker-cell">
                <div className="cell-top">
                  <span className="cell-title">Borders & Dividers</span>
                  <span className="cell-hex" style={{ color: theme.border }}>{theme.border}</span>
                </div>
                <div className="cell-controls">
                  <input
                    type="color"
                    className="gui-native-picker"
                    value={theme.border}
                    onChange={e => handleUpdateField('border', e.target.value)}
                  />
                  <input
                    type="text"
                    className="gui-hex-input"
                    value={theme.border}
                    onChange={e => handleUpdateField('border', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Artwork & Hue Shift */}
        {activeTab === 'artwork' && (
          <div className="gui-theme-content-area">
            <p className="gui-theme-section-tip">
              Calibrate the sacred geometry mandala and ambient lighting shader across the entire color wheel.
            </p>
            <div className="gui-sliders-box">
              {/* Hue Shift */}
              <div className="gui-slider-unit">
                <div className="gui-slider-meta">
                  <span className="meta-label">Spectrum Hue Shift</span>
                  <span className="meta-val" style={{ color: theme.accent }}>{theme.hueRotate}°</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="360"
                  className="rainbow-range-slider"
                  value={theme.hueRotate}
                  onChange={e => handleUpdateField('hueRotate', Number(e.target.value))}
                />
              </div>

              {/* Saturation */}
              <div className="gui-slider-unit">
                <div className="gui-slider-meta">
                  <span className="meta-label">Color Saturation</span>
                  <span className="meta-val" style={{ color: theme.accent }}>{theme.saturation}%</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="200"
                  className="custom-range-slider"
                  value={theme.saturation}
                  onChange={e => handleUpdateField('saturation', Number(e.target.value))}
                />
              </div>

              {/* Brightness */}
              <div className="gui-slider-unit">
                <div className="gui-slider-meta">
                  <span className="meta-label">Visual Brightness</span>
                  <span className="meta-val" style={{ color: theme.accent }}>{theme.brightness}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="160"
                  className="custom-range-slider"
                  value={theme.brightness}
                  onChange={e => handleUpdateField('brightness', Number(e.target.value))}
                />
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="gui-theme-footer">
          <button
            type="button"
            className="btn-theme-reset"
            onClick={handleResetDefaults}
          >
            <RotateCcw size={14} />
            <span>Reset to Cosmic Cyan Defaults</span>
          </button>

          <button
            type="button"
            className="btn-primary"
            onClick={onClose}
          >
            <Check size={15} />
            <span>Done Customizing</span>
          </button>
        </div>
      </div>
    </div>
  );
};

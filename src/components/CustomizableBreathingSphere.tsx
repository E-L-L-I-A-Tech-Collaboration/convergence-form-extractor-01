import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Sliders,
  RotateCcw,
  Maximize2,
  Minimize2,
  Layers,
  Palette,
  Compass,
  Zap,
  Check,
  X,
  Orbit,
  Sun,
  Flame,
  Globe,
  Pipette,
  Eye,
  SlidersHorizontal,
  LayoutTemplate,
  Volume2,
  VolumeX,
  Music,
  Mic,
  MicOff
} from 'lucide-react';
import { getStoredGuiTheme, saveGuiTheme, type GuiColorPalette } from '../gui-theme';
import {
  meditationMusic,
  SOUNDSCAPE_TRACKS,
  type MeditativeTrack,
  SpokenMantraEngine
} from '../audio/meditation-music';

const DEFAULT_SACRED_MANDALA_URL = '/sacred_geometry.jpg';

export type VisualMotif =
  | 'sacred-geometry'
  | 'sri-yantra'
  | 'merkaba'
  | 'bioluminescent'
  | 'solar-core'
  | 'amethyst-lotus';

export type ForwardPulseIntensity = 'subtle' | 'dynamic' | 'hyper' | 'none';
export type SphereSize = 'compact' | 'standard' | 'majestic' | 'colossal' | 'focus-zenith';
export type HudStyle = 'crystal-center' | 'floating-pill' | 'invisible-minimal';

export interface SphereColors {
  primary: string;      // Glow and primary aura
  secondary: string;    // Secondary gradient harmonic
  lines: string;        // Sacred geometric SVG strokes
  text: string;         // Timer and phase label text
  glow: string;         // Outer optical bloom
  bg: string;           // Inner sphere void background
  hueRotate: number;    // 0 - 360 deg
  saturation: number;   // 50 - 200%
  brightness: number;   // 50 - 150%
}

export interface SphereCustomizationConfig {
  visualMotif: VisualMotif;
  forwardPulseIntensity: ForwardPulseIntensity;
  pulseTrigger: 'countdown' | 'phase' | 'continuous';
  sphereSize: SphereSize;
  hudStyle: HudStyle;
  glowIntensity: 'ambient' | 'luminous' | 'supernova';
  colors: SphereColors;
  showMetatronRings: boolean;
  showSriYantraLattice: boolean;
  showFibonacciSpirals: boolean;
  showMoonPhases: boolean;
  enableMouseParallax: boolean;
  rotationSpeed: 'slow' | 'medium' | 'fast' | 'frozen';
  customImageUrl?: string;
}

export interface ColorPreset {
  id: string;
  name: string;
  colors: SphereColors;
  preview: string;
}

const COLOR_PRESETS: ColorPreset[] = [
  {
    id: 'solar-gold-violet',
    name: 'Sacred Gold & Royal Violet',
    colors: {
      primary: '#f59e0b',
      secondary: '#7c3aed',
      lines: '#fbbf24',
      text: '#ffffff',
      glow: '#f59e0b',
      bg: '#050814',
      hueRotate: 0,
      saturation: 110,
      brightness: 105
    },
    preview: 'linear-gradient(135deg, #f59e0b, #7c3aed)'
  },
  {
    id: 'amethyst-magenta',
    name: 'Deep Amethyst & Orchid',
    colors: {
      primary: '#a855f7',
      secondary: '#ec4899',
      lines: '#c084fc',
      text: '#ffffff',
      glow: '#9333ea',
      bg: '#090417',
      hueRotate: 265,
      saturation: 130,
      brightness: 110
    },
    preview: 'linear-gradient(135deg, #a855f7, #ec4899)'
  },
  {
    id: 'vagal-emerald',
    name: 'Vagal Parasympathetic Teal',
    colors: {
      primary: '#10b981',
      secondary: '#06b6d4',
      lines: '#34d399',
      text: '#ffffff',
      glow: '#059669',
      bg: '#011710',
      hueRotate: 135,
      saturation: 120,
      brightness: 105
    },
    preview: 'linear-gradient(135deg, #10b981, #06b6d4)'
  },
  {
    id: 'celestial-cyan',
    name: 'Cosmic Sapphire & Cyan',
    colors: {
      primary: '#0ea5e9',
      secondary: '#6366f1',
      lines: '#38bdf8',
      text: '#ffffff',
      glow: '#0284c7',
      bg: '#020b18',
      hueRotate: 195,
      saturation: 125,
      brightness: 110
    },
    preview: 'linear-gradient(135deg, #0ea5e9, #6366f1)'
  },
  {
    id: 'solar-corona',
    name: 'Solar Corona & Fiery Amber',
    colors: {
      primary: '#f97316',
      secondary: '#ef4444',
      lines: '#fde047',
      text: '#ffffff',
      glow: '#ea580c',
      bg: '#140502',
      hueRotate: 30,
      saturation: 140,
      brightness: 115
    },
    preview: 'linear-gradient(135deg, #f97316, #ef4444)'
  },
  {
    id: 'rose-quartz',
    name: 'Celestial Rose Quartz',
    colors: {
      primary: '#f43f5e',
      secondary: '#d946ef',
      lines: '#fda4af',
      text: '#ffffff',
      glow: '#e11d48',
      bg: '#120208',
      hueRotate: 330,
      saturation: 115,
      brightness: 105
    },
    preview: 'linear-gradient(135deg, #f43f5e, #d946ef)'
  },
  {
    id: 'cyber-neon',
    name: 'Cyberpunk Neon Lime',
    colors: {
      primary: '#84cc16',
      secondary: '#14b8a6',
      lines: '#bef264',
      text: '#ffffff',
      glow: '#65a30d',
      bg: '#051204',
      hueRotate: 80,
      saturation: 135,
      brightness: 110
    },
    preview: 'linear-gradient(135deg, #84cc16, #14b8a6)'
  },
  {
    id: 'diamond-silver',
    name: 'Transcendent White Diamond',
    colors: {
      primary: '#e2e8f0',
      secondary: '#94a3b8',
      lines: '#ffffff',
      text: '#ffffff',
      glow: '#cbd5e1',
      bg: '#080c14',
      hueRotate: 0,
      saturation: 0,
      brightness: 120
    },
    preview: 'linear-gradient(135deg, #ffffff, #94a3b8)'
  }
];

const DEFAULT_CONFIG: SphereCustomizationConfig = {
  visualMotif: 'sacred-geometry',
  forwardPulseIntensity: 'dynamic',
  pulseTrigger: 'countdown',
  sphereSize: 'majestic',
  hudStyle: 'crystal-center',
  glowIntensity: 'luminous',
  colors: {
    primary: '#f59e0b',
    secondary: '#7c3aed',
    lines: '#fbbf24',
    text: '#ffffff',
    glow: '#f59e0b',
    bg: '#040817',
    hueRotate: 0,
    saturation: 115,
    brightness: 105
  },
  showMetatronRings: true,
  showSriYantraLattice: true,
  showFibonacciSpirals: true,
  showMoonPhases: true,
  enableMouseParallax: true,
  rotationSpeed: 'slow'
};

const MOTIF_OPTIONS: { id: VisualMotif; label: string; desc: string; icon: React.ReactNode }[] = [
  {
    id: 'sacred-geometry',
    label: 'Sacred Geometry Mandala',
    desc: 'Intricate cosmic Sri Yantra & Metatron matrix based on master artwork',
    icon: <Sparkles size={16} />
  },
  {
    id: 'sri-yantra',
    label: 'Golden Sri Yantra Matrix',
    desc: 'Nine interlocking divine triangles emitting radial celestial coherence',
    icon: <Compass size={16} />
  },
  {
    id: 'merkaba',
    label: '3D Crystalline Merkaba',
    desc: 'Star tetrahedron light body rotating in counter-phase balance',
    icon: <Layers size={16} />
  },
  {
    id: 'bioluminescent',
    label: 'Bioluminescent Prana',
    desc: 'Organic fluid plasma currents for soothing parasympathetic recalibration',
    icon: <Globe size={16} />
  },
  {
    id: 'solar-core',
    label: 'Alchemical Solar Core',
    desc: 'Warm golden coronal flares evoking radiant somatic warmth and vitality',
    icon: <Sun size={16} />
  },
  {
    id: 'amethyst-lotus',
    label: 'Amethyst Lotus Crown',
    desc: 'Deep ethereal violet petals unfolding in concentric tranquility',
    icon: <Flame size={16} />
  }
];

interface CustomizableBreathingSphereProps {
  isBreathingActive: boolean;
  currentPhase: {
    name: string;
    duration: number;
    action: 'inhale' | 'inhale-extra' | 'hold' | 'exhale' | 'rest';
    tip?: string;
    chantSyllable?: string;
    chantCue?: string;
  };
  phaseSecondsLeft: number;
  completedCycles: number;
  protocolId?: string;
  protocolName?: string;
  onStart?: () => void;
  onStop?: () => void;
}

export function CustomizableBreathingSphere({
  isBreathingActive,
  currentPhase,
  phaseSecondsLeft,
  completedCycles,
  protocolId = 'physiological-sigh',
  protocolName = 'Physiological Sigh'
}: CustomizableBreathingSphereProps) {
  // Load saved config or defaults
  const [config, setConfig] = useState<SphereCustomizationConfig>(() => {
    try {
      const saved = localStorage.getItem('breathing_sphere_config_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_CONFIG,
          ...parsed,
          colors: { ...DEFAULT_CONFIG.colors, ...(parsed.colors || {}) }
        };
      }
    } catch {
      // Fallback
    }
    return DEFAULT_CONFIG;
  });

  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'colors' | 'motifs' | 'pulse' | 'display'>('colors');
  const [manualSurgeTrigger, setManualSurgeTrigger] = useState(false);
  const [isForwardSurging, setIsForwardSurging] = useState(false);
  const [imgLoadError, setImgLoadError] = useState(false);
  const [syncWithGlobalGui, setSyncWithGlobalGui] = useState(true);

  // Large focus mode & audio state
  const [isFocusFullscreen, setIsFocusFullscreen] = useState(false);
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [musicVolume, setMusicVolume] = useState(0.65);
  const [selectedTrack, setSelectedTrack] = useState<MeditativeTrack>('celestial-432');
  const [voiceChantEnabled, setVoiceChantEnabled] = useState(true);
  const [showAudioControls, setShowAudioControls] = useState(false);

  // Parallax rotation state
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Listen to external GUI theme changes (from Header or GUI Theme Modal)
  useEffect(() => {
    const handleGuiThemeChange = (e: Event) => {
      const custom = e as CustomEvent<GuiColorPalette>;
      if (custom.detail) {
        const t = custom.detail;
        setConfig(prev => ({
          ...prev,
          colors: {
            ...prev.colors,
            primary: t.primary,
            secondary: t.secondary,
            lines: t.accent,
            glow: t.glow || t.primary,
            bg: t.bg,
            hueRotate: t.hueRotate,
            saturation: t.saturation,
            brightness: t.brightness
          }
        }));
      }
    };
    window.addEventListener('gui-theme-changed', handleGuiThemeChange);
    return () => window.removeEventListener('gui-theme-changed', handleGuiThemeChange);
  }, []);

  // Save config changes
  useEffect(() => {
    try {
      localStorage.setItem('breathing_sphere_config_v2', JSON.stringify(config));
    } catch {
      // Ignore
    }
  }, [config]);

  // Forward pulse trigger: When seconds tick down or hit 0, or on manual trigger
  useEffect(() => {
    if (!isBreathingActive && !manualSurgeTrigger) return;

    if (config.forwardPulseIntensity === 'none') return;

    const isTimeout = phaseSecondsLeft <= 1;
    const shouldPulse =
      manualSurgeTrigger ||
      config.pulseTrigger === 'continuous' ||
      (config.pulseTrigger === 'countdown' && (phaseSecondsLeft % 2 === 0 || isTimeout)) ||
      (config.pulseTrigger === 'phase' && isTimeout);

    if (shouldPulse) {
      setIsForwardSurging(true);
      const timer = setTimeout(() => {
        setIsForwardSurging(false);
        if (manualSurgeTrigger) setManualSurgeTrigger(false);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [phaseSecondsLeft, isBreathingActive, config.pulseTrigger, config.forwardPulseIntensity, manualSurgeTrigger]);

  // Mouse parallax interaction
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!config.enableMouseParallax || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const normX = (e.clientX - centerX) / (rect.width / 2);
    const normY = (e.clientY - centerY) / (rect.height / 2);
    setTilt({
      x: Math.max(-18, Math.min(18, -normY * 16)),
      y: Math.max(-18, Math.min(18, normX * 16))
    });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  // Continuous Ambient Meditative Music Lifecycle
  useEffect(() => {
    if (isBreathingActive && musicEnabled) {
      meditationMusic.setVolume(musicVolume);
      meditationMusic.start(selectedTrack);
    } else {
      meditationMusic.stop();
    }
    return () => {
      meditationMusic.stop();
    };
  }, [isBreathingActive, musicEnabled, selectedTrack]);

  // Spoken Mantra Vocalization on phase start (Om & Quadra-Sync OA-ZA-NA-EIO)
  useEffect(() => {
    if (isBreathingActive && currentPhase.chantSyllable && voiceChantEnabled) {
      SpokenMantraEngine.speakChant(currentPhase.chantSyllable, {
        enabled: voiceChantEnabled,
        volume: 0.95
      });
    }
  }, [currentPhase.name, currentPhase.chantSyllable, isBreathingActive, voiceChantEnabled]);

  // Sync music volume
  useEffect(() => {
    meditationMusic.setVolume(musicVolume);
  }, [musicVolume]);

  // Dynamic viewport width tracker for responsive mobile and phone screens
  const [viewportWidth, setViewportWidth] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth : 1200
  );

  useEffect(() => {
    const handleResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isPhoneScreen = viewportWidth < 640;

  // Dimensions based on size config (substantially enlarged on desktop, gracefully bounded on mobile phones)
  const baseSize = {
    compact: 340,
    standard: 440,
    majestic: 560,
    colossal: 680,
    'focus-zenith': 800
  }[config.sphereSize] || 560;

  // On phone screens (< 640px), constrain sphere to viewport width minus safe margins
  const sizePixels = isPhoneScreen
    ? Math.min(baseSize, Math.max(250, viewportWidth - 36))
    : baseSize;

  // 3D Z-translation depth surge amount
  const zSurgeAmount = {
    none: 0,
    subtle: 40,
    dynamic: 85,
    hyper: 140
  }[config.forwardPulseIntensity];

  // Phase-specific Z-depth and scale
  const getPhaseTransform = () => {
    if (!isBreathingActive) {
      return {
        scale: 1,
        z: isForwardSurging ? zSurgeAmount : 0,
        extraZ: isForwardSurging ? zSurgeAmount * 0.7 : 0
      };
    }

    switch (currentPhase.action) {
      case 'inhale':
        return {
          scale: 1.28,
          z: (isForwardSurging ? zSurgeAmount : zSurgeAmount * 0.5) + 30,
          extraZ: zSurgeAmount * 0.8
        };
      case 'inhale-extra':
        return {
          scale: 1.42,
          z: zSurgeAmount + 55,
          extraZ: zSurgeAmount * 1.1
        };
      case 'hold':
        return {
          scale: 1.28,
          z: (isForwardSurging ? zSurgeAmount : zSurgeAmount * 0.4) + 25,
          extraZ: zSurgeAmount * 0.6
        };
      case 'exhale':
        return {
          scale: 0.88,
          z: isForwardSurging ? zSurgeAmount * 0.3 : -15,
          extraZ: 0
        };
      case 'rest':
        return {
          scale: 0.88,
          z: isForwardSurging ? zSurgeAmount * 0.2 : -10,
          extraZ: 0
        };
      default:
        return { scale: 1, z: 0, extraZ: 0 };
    }
  };

  const { scale: currentScale, z: currentZ, extraZ } = getPhaseTransform();

  const rotationSpeedClass = {
    slow: 'rotate-slow',
    medium: 'rotate-medium',
    fast: 'rotate-fast',
    frozen: 'rotate-none'
  }[config.rotationSpeed];

  // 12 moon phases points for outer orbital ring
  const moonPhases = [
    '🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘', '🌑', '🌒', '🌓', '🌔'
  ];

  const syncToGlobalGui = (newColors: SphereColors) => {
    if (!syncWithGlobalGui) return;
    const currentGui = getStoredGuiTheme();
    saveGuiTheme({
      ...currentGui,
      primary: newColors.primary,
      secondary: newColors.secondary,
      accent: newColors.lines,
      glow: newColors.glow,
      bg: newColors.bg,
      textAccent: newColors.lines,
      hueRotate: newColors.hueRotate,
      saturation: newColors.saturation,
      brightness: newColors.brightness
    });
  };

  const updateColor = <K extends keyof SphereColors>(key: K, value: SphereColors[K]) => {
    setConfig(prev => {
      const newColors = {
        ...prev.colors,
        [key]: value
      };
      syncToGlobalGui(newColors);
      return {
        ...prev,
        colors: newColors
      };
    });
  };

  const applyPreset = (preset: ColorPreset) => {
    setConfig(prev => {
      const newColors = { ...preset.colors };
      syncToGlobalGui(newColors);
      return {
        ...prev,
        colors: newColors
      };
    });
  };

  // Construct CSS variables object to dynamically tint all parts of the sphere
  const dynamicCssVars = {
    '--sphere-primary': config.colors.primary,
    '--sphere-secondary': config.colors.secondary,
    '--sphere-lines': config.colors.lines,
    '--sphere-text': config.colors.text,
    '--sphere-glow': config.colors.glow,
    '--sphere-bg': config.colors.bg,
    '--mandala-filter': `hue-rotate(${config.colors.hueRotate}deg) saturate(${config.colors.saturation}%) brightness(${config.colors.brightness}%)`
  } as React.CSSProperties;

  return (
    <div className="custom-sphere-container" style={dynamicCssVars}>
      {/* Top Customization Header Bar */}
      <div className="sphere-control-bar">
        <div className="sphere-motif-badge">
          <Sparkles size={14} style={{ color: config.colors.primary }} />
          <span className="motif-name">
            {MOTIF_OPTIONS.find(m => m.id === config.visualMotif)?.label || 'Sacred Geometry'}
          </span>
          <span className="pulse-tag" style={{ borderColor: config.colors.primary, color: config.colors.primary }}>
            3D Pulse: {config.forwardPulseIntensity.toUpperCase()}
          </span>
          <div
            className="color-dot-indicator"
            style={{ background: `linear-gradient(135deg, ${config.colors.primary}, ${config.colors.secondary})` }}
            title="Active Color Palette"
          />
        </div>

        <div className="sphere-action-buttons">
          <button
            type="button"
            className={`btn-sphere-tool ${isFocusFullscreen ? 'active' : ''}`}
            onClick={() => setIsFocusFullscreen(!isFocusFullscreen)}
            title="Toggle Giant Focus Theater Mode"
          >
            {isFocusFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
            <span>{isFocusFullscreen ? 'Exit Focus' : 'Focus Mode'}</span>
          </button>

          <button
            type="button"
            className={`btn-sphere-tool ${showAudioControls || (isBreathingActive && musicEnabled) ? 'active' : ''}`}
            onClick={() => setShowAudioControls(!showAudioControls)}
            title="Configure Ambient Music & Spoken Voice Mantras"
          >
            <Music size={13} style={{ color: config.colors.primary }} />
            <span>{musicEnabled ? 'Music Playing' : 'Music Controls'}</span>
          </button>

          <button
            type="button"
            className="btn-sphere-tool"
            onClick={() => setManualSurgeTrigger(true)}
            title="Test 3D forward visual pulse shockwave"
          >
            <Zap size={13} style={{ color: config.colors.primary }} />
            <span>Pulse 3D Forward</span>
          </button>

          <button
            type="button"
            className={`btn-sphere-tool ${isCustomizerOpen ? 'active' : ''}`}
            onClick={() => setIsCustomizerOpen(!isCustomizerOpen)}
            title="Open Sphere & Full Color Studio"
          >
            <Palette size={14} style={{ color: config.colors.primary }} />
            <span>Customize Colors & 3D</span>
          </button>
        </div>
      </div>

      {/* Ambient Soundscape & Spoken Mantra Control Strip */}
      {showAudioControls && (
        <div className="sphere-audio-strip">
          <div className="audio-strip-left">
            <button
              type="button"
              className={`audio-pill-toggle ${musicEnabled ? 'active' : ''}`}
              onClick={() => setMusicEnabled(!musicEnabled)}
            >
              {musicEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
              <span>{musicEnabled ? 'Ambient Music ON' : 'Ambient Music Muted'}</span>
            </button>

            <select
              className="audio-track-select"
              value={selectedTrack}
              onChange={e => setSelectedTrack(e.target.value as MeditativeTrack)}
            >
              {SOUNDSCAPE_TRACKS.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.frequencyHz} Hz)
                </option>
              ))}
            </select>
          </div>

          <div className="audio-strip-right">
            <div className="volume-slider-wrap">
              <span className="volume-label">Vol</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={musicVolume}
                onChange={e => setMusicVolume(parseFloat(e.target.value))}
                className="audio-vol-range"
              />
            </div>

            <button
              type="button"
              className={`audio-pill-toggle ${voiceChantEnabled ? 'active' : ''}`}
              onClick={() => setVoiceChantEnabled(!voiceChantEnabled)}
              title="Toggle Spoken Om & OA-ZA-NA-EIO vocalization"
            >
              {voiceChantEnabled ? <Mic size={14} /> : <MicOff size={14} />}
              <span>{voiceChantEnabled ? 'Spoken Mantras ON' : 'Spoken Voice Off'}</span>
            </button>
          </div>
        </div>
      )}

      {/* 3D Holographic Stage */}
      <div
        ref={containerRef}
        className={`sphere-3d-stage ${isFocusFullscreen ? 'focus-fullscreen-stage' : ''}`}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          perspective: isPhoneScreen ? '750px' : '1100px',
          minHeight: isFocusFullscreen ? 'min(94vw, 760px)' : `${sizePixels + (isPhoneScreen ? 20 : 60)}px`,
          maxWidth: '100%',
          overflow: isPhoneScreen ? 'hidden' : 'visible'
        }}
      >
        {/* Shockwave expanding ring that shoots forward during timeout pulse */}
        <div
          className={`forward-shockwave-ring ${isForwardSurging ? 'surging' : ''}`}
          style={{
            width: `${sizePixels * (isPhoneScreen ? 1.1 : 1.25)}px`,
            height: `${sizePixels * (isPhoneScreen ? 1.1 : 1.25)}px`,
            borderColor: config.colors.primary,
            boxShadow: `0 0 50px ${config.colors.primary}, inset 0 0 30px ${config.colors.secondary}`,
            transform: `translateZ(${currentZ + 70}px) scale(${isForwardSurging ? 1.6 : 0.85})`,
            opacity: isForwardSurging ? 0.95 : 0
          }}
        />

        {/* Dynamic Chromatic Aura Layer */}
        <div
          className={`sphere-chromatic-aura glow-${config.glowIntensity}`}
          style={{
            width: `${sizePixels * (isPhoneScreen ? 1.2 : 1.45)}px`,
            height: `${sizePixels * (isPhoneScreen ? 1.2 : 1.45)}px`,
            background: `radial-gradient(circle, ${config.colors.glow}99 0%, ${config.colors.primary}55 40%, ${config.colors.secondary}33 70%, transparent 85%)`,
            transform: `scale(${currentScale * 1.15}) translateZ(${currentZ * 0.4}px)`
          }}
        />

        {/* 3D Rotating & Tilting Gimbal Card */}
        <div
          className="sphere-3d-gimbal"
          style={{
            width: isFocusFullscreen ? 'min(94vw, 760px)' : `min(${sizePixels}px, 92vw)`,
            height: isFocusFullscreen ? 'min(94vw, 760px)' : `min(${sizePixels}px, 92vw)`,
            transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) translateZ(${currentZ}px) scale(${currentScale})`,
            transition: isForwardSurging
              ? 'transform 0.45s cubic-bezier(0.18, 0.89, 0.32, 1.28)'
              : 'transform 3.2s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          {/* Layer 1 (Z: -25px): Void Background */}
          <div
            className="sphere-layer layer-deep-space"
            style={{
              transform: 'translateZ(-25px)',
              background: `radial-gradient(circle at center, ${config.colors.bg} 0%, #01040a 100%)`
            }}
          >
            <div
              className="galaxy-vortex"
              style={{
                background: `radial-gradient(circle, ${config.colors.primary}22 0%, ${config.colors.secondary}15 50%, transparent 80%)`
              }}
            />
          </div>

          {/* Layer 2 (Z: 0px): Master Sacred Geometry Mandala Artwork / Visual Motif Plate */}
          <div
            className={`sphere-layer layer-mandala-artwork ${config.visualMotif}`}
            style={{
              transform: 'translateZ(0px)',
              borderColor: config.colors.lines,
              boxShadow: `0 0 40px ${config.colors.glow}77, inset 0 0 25px ${config.colors.primary}44`
            }}
          >
            {config.visualMotif === 'sacred-geometry' && !imgLoadError && (
              <div className="mandala-image-canvas">
                <img
                  src={config.customImageUrl || DEFAULT_SACRED_MANDALA_URL}
                  alt="Sacred Geometry Mandala Artwork"
                  className={`sacred-img-core ${rotationSpeedClass}`}
                  referrerPolicy="no-referrer"
                  onError={() => setImgLoadError(true)}
                  style={{
                    filter: `contrast(1.15) hue-rotate(${config.colors.hueRotate}deg) saturate(${config.colors.saturation}%) brightness(${config.colors.brightness}%)`
                  }}
                />
                <div
                  className="mandala-light-overlay"
                  style={{
                    background: `radial-gradient(circle at center, ${config.colors.primary}33 0%, ${config.colors.secondary}22 55%, rgba(0,0,0,0.3) 85%)`
                  }}
                />
              </div>
            )}

            {/* Fallback or Vector Sri Yantra */}
            {(config.visualMotif === 'sri-yantra' || (config.visualMotif === 'sacred-geometry' && imgLoadError)) && (
              <div className="sri-yantra-pure-vector" style={{ background: config.colors.bg }}>
                <svg viewBox="0 0 400 400" className={`svg-yantra ${rotationSpeedClass}`}>
                  <circle cx="200" cy="200" r="185" fill="none" stroke={config.colors.lines} strokeWidth="2" strokeDasharray="4 4" opacity="0.6" />
                  <circle cx="200" cy="200" r="170" fill="none" stroke={config.colors.lines} strokeWidth="2.5" />
                  {/* Concentric petal lotus border */}
                  {Array.from({ length: 16 }).map((_, i) => {
                    const angle = (i * 360) / 16;
                    return (
                      <path
                        key={i}
                        d={`M 200 35 Q 212 55 200 70 Q 188 55 200 35`}
                        fill={`${config.colors.primary}25`}
                        stroke={config.colors.lines}
                        strokeWidth="1.4"
                        transform={`rotate(${angle} 200 200)`}
                      />
                    );
                  })}
                  {/* Interlocking Triangles of Sri Yantra */}
                  <polygon points="200,60 330,285 70,285" fill="none" stroke={config.colors.primary} strokeWidth="2.2" />
                  <polygon points="200,340 70,115 330,115" fill="none" stroke={config.colors.lines} strokeWidth="2.2" />
                  <polygon points="200,90 310,270 90,270" fill="none" stroke={config.colors.secondary} strokeWidth="2" />
                  <polygon points="200,310 90,130 310,130" fill="none" stroke={config.colors.primary} strokeWidth="2" />
                  <polygon points="200,120 280,250 120,250" fill="none" stroke={config.colors.lines} strokeWidth="1.8" />
                  <circle cx="200" cy="200" r="7" fill={config.colors.text} filter={`drop-shadow(0 0 10px ${config.colors.primary})`} />
                </svg>
              </div>
            )}

            {config.visualMotif === 'merkaba' && (
              <div className="merkaba-visual-canvas" style={{ background: config.colors.bg }}>
                <svg viewBox="0 0 300 300" className={`svg-merkaba ${rotationSpeedClass}`}>
                  <polygon points="150,30 255,210 45,210" fill={`${config.colors.primary}33`} stroke={config.colors.primary} strokeWidth="2.5" />
                  <polygon points="150,270 45,90 255,90" fill={`${config.colors.secondary}33`} stroke={config.colors.secondary} strokeWidth="2.5" />
                  <line x1="150" y1="30" x2="150" y2="270" stroke={config.colors.lines} strokeWidth="1.5" strokeDasharray="4 4" />
                  <line x1="45" y1="90" x2="255" y2="210" stroke={config.colors.lines} strokeWidth="1.5" strokeDasharray="4 4" />
                  <line x1="255" y1="90" x2="45" y2="210" stroke={config.colors.lines} strokeWidth="1.5" strokeDasharray="4 4" />
                  <circle cx="150" cy="150" r="130" fill="none" stroke={config.colors.lines} strokeWidth="1.5" opacity="0.6" />
                </svg>
              </div>
            )}

            {config.visualMotif === 'bioluminescent' && (
              <div
                className="bioluminescent-plasma-sphere"
                style={{
                  background: `radial-gradient(circle at 35% 35%, ${config.colors.primary}, ${config.colors.secondary} 60%, ${config.colors.bg} 95%)`
                }}
              >
                <div className="plasma-blob blob-1" style={{ background: `${config.colors.primary}99` }} />
                <div className="plasma-blob blob-2" style={{ background: `${config.colors.secondary}99` }} />
                <div className="plasma-blob blob-3" style={{ background: `${config.colors.lines}88` }} />
              </div>
            )}

            {config.visualMotif === 'solar-core' && (
              <div
                className="solar-fusion-core"
                style={{
                  background: `radial-gradient(circle at center, #ffffff 0%, ${config.colors.lines} 30%, ${config.colors.primary} 60%, ${config.colors.bg} 100%)`
                }}
              >
                <div className="solar-prominence flare-1" />
                <div className="solar-prominence flare-2" />
                <div className="solar-prominence flare-3" />
              </div>
            )}

            {config.visualMotif === 'amethyst-lotus' && (
              <div
                className="amethyst-lotus-core"
                style={{
                  background: `radial-gradient(circle at center, #ffffff 0%, ${config.colors.primary} 40%, ${config.colors.secondary} 75%, ${config.colors.bg} 100%)`
                }}
              />
            )}
          </div>

          {/* Layer 3 (Z: +35px): Floating Metatron's Cube Outer Rings & Nodes */}
          {config.showMetatronRings && (
            <div
              className="sphere-layer layer-metatron"
              style={{
                transform: `translateZ(${35 + extraZ * 0.4}px)`
              }}
            >
              <svg viewBox="0 0 300 300" className="svg-metatron-overlay">
                <circle cx="150" cy="150" r="140" fill="none" stroke={config.colors.lines} strokeWidth="1.2" opacity="0.65" />
                <circle cx="150" cy="150" r="115" fill="none" stroke={config.colors.primary} strokeWidth="1" strokeDasharray="3 6" opacity="0.8" />
                {Array.from({ length: 6 }).map((_, idx) => {
                  const angle = (idx * Math.PI) / 3;
                  const cx = 150 + 90 * Math.cos(angle);
                  const cy = 150 + 90 * Math.sin(angle);
                  return (
                    <g key={idx}>
                      <circle cx={cx} cy={cy} r="28" fill="none" stroke={config.colors.lines} strokeWidth="1.4" opacity="0.85" />
                      <line x1="150" y1="150" x2={cx} y2={cy} stroke={config.colors.secondary} strokeWidth="1" opacity="0.7" />
                    </g>
                  );
                })}
              </svg>
            </div>
          )}

          {/* Layer 4 (Z: +65px): Fibonacci Logarithmic Spirals */}
          {config.showFibonacciSpirals && (
            <div
              className="sphere-layer layer-fibonacci"
              style={{
                transform: `translateZ(${65 + extraZ * 0.7}px)`
              }}
            >
              <div className="fibonacci-arms">
                <div className="spiral-arm spiral-left" style={{ borderColor: `${config.colors.lines}88` }} />
                <div className="spiral-arm spiral-right" style={{ borderColor: `${config.colors.primary}88` }} />
              </div>
            </div>
          )}

          {/* Layer 5 (Z: +80px): Celestial Moon Phase & Zodiac Orbiters */}
          {config.showMoonPhases && (
            <div
              className="sphere-layer layer-moon-orbit"
              style={{
                transform: `translateZ(${80 + extraZ * 0.9}px)`
              }}
            >
              <div className="moon-phase-ring">
                {moonPhases.map((moon, idx) => {
                  const angle = (idx * 360) / 12;
                  return (
                    <div
                      key={idx}
                      className="moon-node"
                      style={{
                        transform: `rotate(${angle}deg) translate(0, -${sizePixels * 0.48}px) rotate(-${angle}deg)`
                      }}
                    >
                      <span className="moon-glyph" style={{ filter: `drop-shadow(0 0 6px ${config.colors.primary})` }}>
                        {moon}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Layer 6 (Z: +105px): Floating Holographic Lens & Timer */}
          <div
            className={`sphere-layer layer-foreground-telemetry hud-style-${config.hudStyle}`}
            style={{
              transform: `translateZ(${105 + extraZ}px)`
            }}
          >
            <div
              className="holographic-lens"
              style={{
                borderColor: `${config.colors.lines}55`,
                boxShadow: `0 0 25px rgba(0,0,0,0.6), inset 0 0 15px ${config.colors.primary}22`
              }}
            >
              <span
                className="holo-phase-title"
                style={{
                  color: config.colors.lines,
                  textShadow: `0 0 10px ${config.colors.primary}, 0 2px 4px rgba(0,0,0,0.9)`
                }}
              >
                {isBreathingActive ? currentPhase.name : 'Physiological Reset'}
              </span>

              {/* Sacred Chant & Syllable Resonance Display (Om & Quadra-Sync OA-ZA-NA-EIO) */}
              {isBreathingActive && currentPhase.chantSyllable && (
                <div className="holo-chant-anchor">
                  <div
                    className="chant-glyph-large"
                    style={{
                      color: config.colors.lines,
                      textShadow: `0 0 25px ${config.colors.primary}, 0 0 50px ${config.colors.secondary}`
                    }}
                  >
                    {currentPhase.chantSyllable === 'OM' ? 'ॐ' : currentPhase.chantSyllable}
                  </div>
                  <div
                    className="chant-syllable-tag"
                    style={{
                      borderColor: `${config.colors.lines}88`,
                      color: config.colors.text,
                      background: `${config.colors.bg}cc`
                    }}
                  >
                    {currentPhase.chantSyllable === 'OM'
                      ? 'TIMED SPOKEN OM'
                      : `QUADRA-SYNC: ${currentPhase.chantSyllable}`}
                  </div>
                  {currentPhase.chantCue && (
                    <div className="chant-cue-label" style={{ color: `${config.colors.text}dd` }}>
                      {currentPhase.chantCue}
                    </div>
                  )}
                </div>
              )}

              <div className="holo-timer-display">
                <span
                  className={`holo-seconds-num ${isForwardSurging ? 'pulse-forward-text' : ''}`}
                  style={{
                    color: config.colors.text,
                    textShadow: `0 0 15px ${config.colors.primary}, 0 0 30px ${config.colors.secondary}`
                  }}
                >
                  {isBreathingActive ? phaseSecondsLeft : '0'}
                </span>
                <span className="holo-seconds-unit" style={{ color: config.colors.lines }}>
                  {isBreathingActive ? 's' : ''}
                </span>
              </div>

              <div className="holo-status-pill" style={{ borderColor: `${config.colors.lines}44`, color: config.colors.text }}>
                {isBreathingActive ? (
                  <span>Cycle {completedCycles + 1} • {currentPhase.action.toUpperCase()}</span>
                ) : (
                  <span>Ready • Tap Start Below</span>
                )}
              </div>

              {currentPhase.tip && isBreathingActive && config.hudStyle !== 'floating-pill' && (
                <div className="holo-coaching-tip">
                  {currentPhase.tip}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Customization Drawer & Live Color Studio */}
      {isCustomizerOpen && (
        <div className="sphere-customizer-panel">
          <div className="panel-header">
            <div className="panel-title">
              <Palette size={18} style={{ color: config.colors.primary }} />
              <span>Breathing Sphere & Live Color Studio</span>
            </div>
            <button
              type="button"
              className="btn-panel-close"
              onClick={() => setIsCustomizerOpen(false)}
            >
              <X size={16} />
            </button>
          </div>

          {/* Navigation Sub-Tabs */}
          <div className="customizer-tabs-nav">
            <button
              type="button"
              className={`tab-nav-btn ${activeTab === 'colors' ? 'active' : ''}`}
              onClick={() => setActiveTab('colors')}
            >
              <Palette size={14} />
              <span>Full Color Studio</span>
            </button>
            <button
              type="button"
              className={`tab-nav-btn ${activeTab === 'motifs' ? 'active' : ''}`}
              onClick={() => setActiveTab('motifs')}
            >
              <Sparkles size={14} />
              <span>Visual Motifs</span>
            </button>
            <button
              type="button"
              className={`tab-nav-btn ${activeTab === 'pulse' ? 'active' : ''}`}
              onClick={() => setActiveTab('pulse')}
            >
              <Zap size={14} />
              <span>3D Forward Pulse</span>
            </button>
            <button
              type="button"
              className={`tab-nav-btn ${activeTab === 'display' ? 'active' : ''}`}
              onClick={() => setActiveTab('display')}
            >
              <LayoutTemplate size={14} />
              <span>Lens & Layers</span>
            </button>
          </div>

          <div className="panel-body">
            {/* TAB 1: FULL COLOR STUDIO */}
            {activeTab === 'colors' && (
              <div className="tab-pane-content">
                {/* Global GUI Integration Banner */}
                <div
                  style={{
                    background: 'rgba(var(--gui-primary-rgb, 14, 165, 233), 0.12)',
                    border: '1px solid var(--gui-border-highlight, rgba(56, 189, 248, 0.4))',
                    borderRadius: '12px',
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '12px',
                    marginBottom: '14px'
                  }}
                >
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: 600,
                      color: '#f1f5f9'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={syncWithGlobalGui}
                      onChange={e => setSyncWithGlobalGui(e.target.checked)}
                      style={{
                        width: '16px',
                        height: '16px',
                        accentColor: config.colors.primary,
                        cursor: 'pointer'
                      }}
                    />
                    <span>Sync with Entire Application GUI (Buttons, Nav, Cards, Backgrounds)</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => {
                      if (typeof window !== 'undefined') {
                        window.dispatchEvent(new CustomEvent('open-gui-theme-modal'));
                      }
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: config.colors.primary,
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '6px 12px',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                    }}
                  >
                    <Palette size={13} />
                    <span>Open Full GUI Theme Studio</span>
                  </button>
                </div>

                {/* 1. Quick Presets */}
                <div className="custom-group">
                  <label className="group-label">
                    <Sparkles size={14} style={{ color: config.colors.primary }} />
                    <span>Instant Color Palettes</span>
                  </label>
                  <div className="color-presets-grid">
                    {COLOR_PRESETS.map(preset => (
                      <button
                        key={preset.id}
                        type="button"
                        className="color-preset-card"
                        onClick={() => applyPreset(preset)}
                      >
                        <div className="preset-swatch" style={{ background: preset.preview }} />
                        <span className="preset-name">{preset.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Granular Color Pickers (User Requested: "customize all colors in the GUI") */}
                <div className="custom-group">
                  <label className="group-label">
                    <Pipette size={14} style={{ color: config.colors.primary }} />
                    <span>Customize All Individual Colors</span>
                  </label>
                  <div className="granular-pickers-grid">
                    {/* Primary Accent */}
                    <div className="picker-item">
                      <div className="picker-label-wrap">
                        <span className="picker-title">Primary Glow / Aura</span>
                        <span className="picker-hex">{config.colors.primary}</span>
                      </div>
                      <div className="picker-input-wrap">
                        <input
                          type="color"
                          className="native-color-picker"
                          value={config.colors.primary}
                          onChange={e => updateColor('primary', e.target.value)}
                        />
                        <input
                          type="text"
                          className="hex-text-input"
                          value={config.colors.primary}
                          onChange={e => updateColor('primary', e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Secondary Harmony */}
                    <div className="picker-item">
                      <div className="picker-label-wrap">
                        <span className="picker-title">Secondary Harmonic</span>
                        <span className="picker-hex">{config.colors.secondary}</span>
                      </div>
                      <div className="picker-input-wrap">
                        <input
                          type="color"
                          className="native-color-picker"
                          value={config.colors.secondary}
                          onChange={e => updateColor('secondary', e.target.value)}
                        />
                        <input
                          type="text"
                          className="hex-text-input"
                          value={config.colors.secondary}
                          onChange={e => updateColor('secondary', e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Sacred Lines */}
                    <div className="picker-item">
                      <div className="picker-label-wrap">
                        <span className="picker-title">Sacred Geometric Lines</span>
                        <span className="picker-hex">{config.colors.lines}</span>
                      </div>
                      <div className="picker-input-wrap">
                        <input
                          type="color"
                          className="native-color-picker"
                          value={config.colors.lines}
                          onChange={e => updateColor('lines', e.target.value)}
                        />
                        <input
                          type="text"
                          className="hex-text-input"
                          value={config.colors.lines}
                          onChange={e => updateColor('lines', e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Telemetry / Timer Text */}
                    <div className="picker-item">
                      <div className="picker-label-wrap">
                        <span className="picker-title">Timer & HUD Text</span>
                        <span className="picker-hex">{config.colors.text}</span>
                      </div>
                      <div className="picker-input-wrap">
                        <input
                          type="color"
                          className="native-color-picker"
                          value={config.colors.text}
                          onChange={e => updateColor('text', e.target.value)}
                        />
                        <input
                          type="text"
                          className="hex-text-input"
                          value={config.colors.text}
                          onChange={e => updateColor('text', e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Bloom / Optical Glow */}
                    <div className="picker-item">
                      <div className="picker-label-wrap">
                        <span className="picker-title">Optical Bloom Glow</span>
                        <span className="picker-hex">{config.colors.glow}</span>
                      </div>
                      <div className="picker-input-wrap">
                        <input
                          type="color"
                          className="native-color-picker"
                          value={config.colors.glow}
                          onChange={e => updateColor('glow', e.target.value)}
                        />
                        <input
                          type="text"
                          className="hex-text-input"
                          value={config.colors.glow}
                          onChange={e => updateColor('glow', e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Inner Core Void */}
                    <div className="picker-item">
                      <div className="picker-label-wrap">
                        <span className="picker-title">Core Space / Void</span>
                        <span className="picker-hex">{config.colors.bg}</span>
                      </div>
                      <div className="picker-input-wrap">
                        <input
                          type="color"
                          className="native-color-picker"
                          value={config.colors.bg}
                          onChange={e => updateColor('bg', e.target.value)}
                        />
                        <input
                          type="text"
                          className="hex-text-input"
                          value={config.colors.bg}
                          onChange={e => updateColor('bg', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Mandala Artwork Color Tuning (Hue Shift, Saturation, Brightness) */}
                <div className="custom-group">
                  <label className="group-label">
                    <SlidersHorizontal size={14} style={{ color: config.colors.primary }} />
                    <span>Mandala Artwork Color Grading</span>
                  </label>
                  <div className="color-sliders-container">
                    {/* Hue Rotation */}
                    <div className="slider-row">
                      <div className="slider-label-line">
                        <span>Hue Shift Spectrum</span>
                        <span className="slider-val">{config.colors.hueRotate}°</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="360"
                        className="rainbow-range-slider"
                        value={config.colors.hueRotate}
                        onChange={e => updateColor('hueRotate', Number(e.target.value))}
                      />
                    </div>

                    {/* Saturation */}
                    <div className="slider-row">
                      <div className="slider-label-line">
                        <span>Color Saturation</span>
                        <span className="slider-val">{config.colors.saturation}%</span>
                      </div>
                      <input
                        type="range"
                        min="20"
                        max="200"
                        className="custom-range-slider"
                        value={config.colors.saturation}
                        onChange={e => updateColor('saturation', Number(e.target.value))}
                      />
                    </div>

                    {/* Brightness */}
                    <div className="slider-row">
                      <div className="slider-label-line">
                        <span>Visual Brightness</span>
                        <span className="slider-val">{config.colors.brightness}%</span>
                      </div>
                      <input
                        type="range"
                        min="50"
                        max="160"
                        className="custom-range-slider"
                        value={config.colors.brightness}
                        onChange={e => updateColor('brightness', Number(e.target.value))}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: VISUAL MOTIFS */}
            {activeTab === 'motifs' && (
              <div className="tab-pane-content">
                <div className="custom-group">
                  <label className="group-label">
                    <Sparkles size={14} style={{ color: config.colors.primary }} />
                    <span>Select Master Visual Theme</span>
                  </label>
                  <div className="motif-cards-grid">
                    {MOTIF_OPTIONS.map(option => (
                      <button
                        key={option.id}
                        type="button"
                        className={`motif-card ${config.visualMotif === option.id ? 'selected' : ''}`}
                        onClick={() => {
                          setConfig({ ...config, visualMotif: option.id });
                          setImgLoadError(false);
                        }}
                      >
                        <div className="motif-card-icon" style={{ color: config.colors.primary }}>
                          {option.icon}
                        </div>
                        <div className="motif-card-text">
                          <div className="motif-title">{option.label}</div>
                          <div className="motif-desc">{option.desc}</div>
                        </div>
                        {config.visualMotif === option.id && (
                          <Check size={16} className="motif-check-icon" style={{ color: config.colors.primary }} />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: 3D FORWARD PULSE */}
            {activeTab === 'pulse' && (
              <div className="tab-pane-content">
                {/* 3D Forward Pulse Depth */}
                <div className="custom-group">
                  <div className="group-header-with-badge">
                    <label className="group-label">
                      <Zap size={14} style={{ color: config.colors.primary }} />
                      <span>3D Forward Pulse & Z-Surge Intensity</span>
                    </label>
                    <span className="feature-badge" style={{ color: config.colors.primary, borderColor: config.colors.primary }}>
                      Forward Projection
                    </span>
                  </div>
                  <p className="group-subtext">
                    Surges the sacred geometry along the Z-axis toward you as the timer counts down and times out.
                  </p>
                  <div className="intensity-buttons-row">
                    {[
                      { id: 'none', label: 'Flat (0px)', desc: '2D static plane' },
                      { id: 'subtle', label: 'Subtle (+40px)', desc: 'Gentle somatic breath' },
                      { id: 'dynamic', label: 'Dynamic (+85px)', desc: 'Pronounced timeout surge' },
                      { id: 'hyper', label: 'Hyper-3D (+140px)', desc: 'Deep dimensional projection' }
                    ].map(item => (
                      <button
                        key={item.id}
                        type="button"
                        className={`intensity-btn ${config.forwardPulseIntensity === item.id ? 'active' : ''}`}
                        onClick={() => {
                          setConfig({ ...config, forwardPulseIntensity: item.id as ForwardPulseIntensity });
                          setManualSurgeTrigger(true);
                        }}
                      >
                        <span className="btn-main">{item.label}</span>
                        <span className="btn-sub">{item.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Pulse Trigger Cadence */}
                <div className="custom-group">
                  <label className="group-label">
                    <Orbit size={14} style={{ color: config.colors.primary }} />
                    <span>3D Pulse Trigger Cadence</span>
                  </label>
                  <div className="radio-pill-group">
                    {[
                      { id: 'countdown', label: 'Every Countdown Tick & 0s Timeout (Recommended)' },
                      { id: 'phase', label: 'Phase Transitions Only' },
                      { id: 'continuous', label: 'Continuous Harmonic Pulse' }
                    ].map(trigger => (
                      <button
                        key={trigger.id}
                        type="button"
                        className={`pill-option ${config.pulseTrigger === trigger.id ? 'active' : ''}`}
                        onClick={() => setConfig({ ...config, pulseTrigger: trigger.id as 'countdown' | 'phase' | 'continuous' })}
                      >
                        {trigger.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: LENS & DISPLAY LAYERS */}
            {activeTab === 'display' && (
              <div className="tab-pane-content">
                {/* Center HUD Lens Style */}
                <div className="custom-group">
                  <label className="group-label">
                    <Eye size={14} style={{ color: config.colors.primary }} />
                    <span>Center HUD Lens Style</span>
                  </label>
                  <p className="group-subtext">
                    Control how the timer and phase text overlay the artwork so the mandala remains fully visible.
                  </p>
                  <div className="segmented-selector">
                    {[
                      { id: 'crystal-center', label: 'Crystal Center (Compact)' },
                      { id: 'floating-pill', label: 'Floating Pill (Max Art Visibility)' },
                      { id: 'invisible-minimal', label: 'Minimal Glow HUD' }
                    ].map(hud => (
                      <button
                        key={hud.id}
                        type="button"
                        className={`seg-btn ${config.hudStyle === hud.id ? 'active' : ''}`}
                        onClick={() => setConfig({ ...config, hudStyle: hud.id as HudStyle })}
                      >
                        {hud.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Geometric Layer Toggles */}
                <div className="custom-group">
                  <label className="group-label">
                    <Layers size={14} style={{ color: config.colors.primary }} />
                    <span>Sacred Geometry Dimensional Layers</span>
                  </label>
                  <div className="toggles-grid">
                    <label className="toggle-item">
                      <input
                        type="checkbox"
                        checked={config.showMetatronRings}
                        onChange={e => setConfig({ ...config, showMetatronRings: e.target.checked })}
                      />
                      <span>Metatron's 13 Sphere Rings</span>
                    </label>

                    <label className="toggle-item">
                      <input
                        type="checkbox"
                        checked={config.showFibonacciSpirals}
                        onChange={e => setConfig({ ...config, showFibonacciSpirals: e.target.checked })}
                      />
                      <span>Fibonacci Golden Spirals</span>
                    </label>

                    <label className="toggle-item">
                      <input
                        type="checkbox"
                        checked={config.showMoonPhases}
                        onChange={e => setConfig({ ...config, showMoonPhases: e.target.checked })}
                      />
                      <span>Celestial 12 Moon Phases</span>
                    </label>

                    <label className="toggle-item">
                      <input
                        type="checkbox"
                        checked={config.enableMouseParallax}
                        onChange={e => setConfig({ ...config, enableMouseParallax: e.target.checked })}
                      />
                      <span>Interactive 3D Mouse Tilt</span>
                    </label>
                  </div>
                </div>

                {/* Sphere Scale & Rotation Speed */}
                <div className="custom-group two-column-controls">
                  <div>
                    <label className="group-label">
                      <Maximize2 size={14} style={{ color: config.colors.primary }} />
                      <span>Stage Diameter & Focus Size</span>
                    </label>
                    <div className="segmented-selector">
                      {(['compact', 'standard', 'majestic', 'colossal', 'focus-zenith'] as SphereSize[]).map(size => (
                        <button
                          key={size}
                          type="button"
                          className={`seg-btn ${config.sphereSize === size ? 'active' : ''}`}
                          onClick={() => setConfig({ ...config, sphereSize: size })}
                        >
                          {size === 'focus-zenith' ? 'Zenith (800px)' : size === 'colossal' ? 'Colossal (680px)' : size === 'majestic' ? 'Majestic (560px)' : size === 'standard' ? 'Standard (440px)' : 'Compact (340px)'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="group-label">
                      <RotateCcw size={14} style={{ color: config.colors.primary }} />
                      <span>Mandala Rotation</span>
                    </label>
                    <div className="segmented-selector">
                      {(['frozen', 'slow', 'medium', 'fast'] as const).map(speed => (
                        <button
                          key={speed}
                          type="button"
                          className={`seg-btn ${config.rotationSpeed === speed ? 'active' : ''}`}
                          onClick={() => setConfig({ ...config, rotationSpeed: speed })}
                        >
                          {speed.charAt(0).toUpperCase() + speed.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Panel Footer Actions */}
            <div className="panel-footer-actions">
              <button
                type="button"
                className="btn-reset-defaults"
                onClick={() => setConfig(DEFAULT_CONFIG)}
              >
                <RotateCcw size={14} />
                <span>Reset to Sacred Gold & Violet</span>
              </button>

              <button
                type="button"
                className="btn-done-customizing"
                style={{
                  background: `linear-gradient(135deg, ${config.colors.primary}, ${config.colors.secondary})`,
                  color: '#ffffff'
                }}
                onClick={() => setIsCustomizerOpen(false)}
              >
                <Check size={14} />
                <span>Apply & Close Studio</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

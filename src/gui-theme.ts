// Centralized GUI Theme & Color Customization Engine

export interface GuiColorPalette {
  id: string;
  name: string;
  primary: string;           // Main action & accent color (#0ea5e9, #f59e0b, #a855f7, etc.)
  secondary: string;         // Secondary harmonic gradient stop (#6366f1, #7c3aed, etc.)
  accent: string;            // Crisp highlights, active borders, lines (#38bdf8, #fbbf24, etc.)
  bg: string;                // App canvas background (#070d17, #050814, etc.)
  bgDeep: string;            // Bottom gradient floor (#03060d, #010308, etc.)
  surface: string;           // Panels, nav, header bars (#0c1829, #0f172a, etc.)
  surfaceCard: string;       // Exercise and monitor cards (#0e1e33, #131d2e, etc.)
  border: string;            // Element borders (#1e324b, #2a2d42, etc.)
  borderHighlight: string;   // Active/selected border (#38bdf8, #f59e0b, etc.)
  glow: string;              // Optical bloom & ambient glow (rgba or hex)
  textAccent: string;        // Accent text & eyebrows
  hueRotate: number;         // 0 - 360 deg
  saturation: number;        // 50 - 200%
  brightness: number;        // 50 - 150%
}

export const GUI_THEME_PRESETS: GuiColorPalette[] = [
  {
    id: 'cosmic-cyan',
    name: 'Cosmic Sapphire & Cyan (Default)',
    primary: '#0ea5e9',
    secondary: '#6366f1',
    accent: '#38bdf8',
    bg: '#070d17',
    bgDeep: '#03060d',
    surface: '#0c1829',
    surfaceCard: '#0e1e33',
    border: '#1e324b',
    borderHighlight: 'rgba(56, 189, 248, 0.45)',
    glow: 'rgba(14, 165, 233, 0.35)',
    textAccent: '#38bdf8',
    hueRotate: 195,
    saturation: 125,
    brightness: 110
  },
  {
    id: 'solar-gold-violet',
    name: 'Sacred Gold & Royal Violet',
    primary: '#f59e0b',
    secondary: '#7c3aed',
    accent: '#fbbf24',
    bg: '#0a0814',
    bgDeep: '#05030a',
    surface: '#15102a',
    surfaceCard: '#1b1435',
    border: '#362758',
    borderHighlight: 'rgba(245, 158, 11, 0.5)',
    glow: 'rgba(245, 158, 11, 0.35)',
    textAccent: '#fbbf24',
    hueRotate: 0,
    saturation: 110,
    brightness: 105
  },
  {
    id: 'amethyst-magenta',
    name: 'Deep Amethyst & Orchid',
    primary: '#a855f7',
    secondary: '#ec4899',
    accent: '#c084fc',
    bg: '#0d0618',
    bgDeep: '#06020c',
    surface: '#180c2e',
    surfaceCard: '#221140',
    border: '#3f1f66',
    borderHighlight: 'rgba(168, 85, 247, 0.5)',
    glow: 'rgba(168, 85, 247, 0.35)',
    textAccent: '#d8b4fe',
    hueRotate: 265,
    saturation: 130,
    brightness: 110
  },
  {
    id: 'vagal-emerald',
    name: 'Vagal Parasympathetic Teal',
    primary: '#10b981',
    secondary: '#06b6d4',
    accent: '#34d399',
    bg: '#041410',
    bgDeep: '#010907',
    surface: '#09241d',
    surfaceCard: '#0e3027',
    border: '#19493c',
    borderHighlight: 'rgba(52, 211, 153, 0.45)',
    glow: 'rgba(16, 185, 129, 0.35)',
    textAccent: '#34d399',
    hueRotate: 135,
    saturation: 120,
    brightness: 105
  },
  {
    id: 'solar-corona',
    name: 'Solar Corona & Fiery Amber',
    primary: '#f97316',
    secondary: '#ef4444',
    accent: '#fde047',
    bg: '#140803',
    bgDeep: '#080301',
    surface: '#241006',
    surfaceCard: '#30160a',
    border: '#542611',
    borderHighlight: 'rgba(249, 115, 22, 0.5)',
    glow: 'rgba(249, 115, 22, 0.35)',
    textAccent: '#fb923c',
    hueRotate: 30,
    saturation: 140,
    brightness: 115
  },
  {
    id: 'rose-quartz',
    name: 'Celestial Rose Quartz',
    primary: '#f43f5e',
    secondary: '#d946ef',
    accent: '#fda4af',
    bg: '#15050c',
    bgDeep: '#090206',
    surface: '#260c18',
    surfaceCard: '#331221',
    border: '#59203c',
    borderHighlight: 'rgba(244, 63, 94, 0.5)',
    glow: 'rgba(244, 63, 94, 0.35)',
    textAccent: '#fda4af',
    hueRotate: 330,
    saturation: 115,
    brightness: 105
  },
  {
    id: 'cyber-neon',
    name: 'Cyberpunk Neon Lime',
    primary: '#84cc16',
    secondary: '#14b8a6',
    accent: '#bef264',
    bg: '#071204',
    bgDeep: '#030801',
    surface: '#11220a',
    surfaceCard: '#18300f',
    border: '#2a501a',
    borderHighlight: 'rgba(132, 204, 22, 0.5)',
    glow: 'rgba(132, 204, 22, 0.35)',
    textAccent: '#bef264',
    hueRotate: 80,
    saturation: 135,
    brightness: 110
  },
  {
    id: 'diamond-silver',
    name: 'Transcendent White Diamond',
    primary: '#cbd5e1',
    secondary: '#64748b',
    accent: '#ffffff',
    bg: '#0a0d14',
    bgDeep: '#04060a',
    surface: '#131924',
    surfaceCard: '#1a2230',
    border: '#2c394d',
    borderHighlight: 'rgba(255, 255, 255, 0.45)',
    glow: 'rgba(203, 213, 225, 0.3)',
    textAccent: '#f8fafc',
    hueRotate: 0,
    saturation: 0,
    brightness: 120
  },
  {
    id: 'midnight-obsidian',
    name: 'Midnight Obsidian & Ruby',
    primary: '#e11d48',
    secondary: '#4f46e5',
    accent: '#fb7185',
    bg: '#050508',
    bgDeep: '#000000',
    surface: '#101018',
    surfaceCard: '#161622',
    border: '#28283a',
    borderHighlight: 'rgba(225, 29, 72, 0.5)',
    glow: 'rgba(225, 29, 72, 0.35)',
    textAccent: '#fb7185',
    hueRotate: 340,
    saturation: 130,
    brightness: 105
  }
];

export const DEFAULT_GUI_THEME: GuiColorPalette = GUI_THEME_PRESETS[0];

const STORAGE_KEY = 'convergence_gui_theme_v2';

function hexToRgb(hex: string): string {
  let cleaned = hex.replace('#', '');
  if (cleaned.length === 3) {
    cleaned = cleaned.split('').map(c => c + c).join('');
  }
  if (cleaned.length >= 6) {
    const r = parseInt(cleaned.substring(0, 2), 16) || 14;
    const g = parseInt(cleaned.substring(2, 4), 16) || 165;
    const b = parseInt(cleaned.substring(4, 6), 16) || 233;
    return `${r}, ${g}, ${b}`;
  }
  return '14, 165, 233';
}

function parseHex(hex: string): [number, number, number] {
  let cleaned = (hex || '#0ea5e9').replace('#', '');
  if (cleaned.length === 3) {
    cleaned = cleaned.split('').map(c => c + c).join('');
  }
  if (cleaned.length >= 6) {
    return [
      parseInt(cleaned.substring(0, 2), 16) || 14,
      parseInt(cleaned.substring(2, 4), 16) || 165,
      parseInt(cleaned.substring(4, 6), 16) || 233
    ];
  }
  return [14, 165, 233];
}

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
  return '#' + [clamp(r), clamp(g), clamp(b)].map(x => x.toString(16).padStart(2, '0')).join('');
}

/**
 * Adjust brightness/lightness of a hex color
 */
export function adjustHex(hex: string, percent: number): string {
  const [r, g, b] = parseHex(hex);
  if (percent > 0) {
    const newR = r + (255 - r) * (percent / 100);
    const newG = g + (255 - g) * (percent / 100);
    const newB = b + (255 - b) * (percent / 100);
    return rgbToHex(newR, newG, newB);
  } else {
    const factor = (100 + percent) / 100;
    return rgbToHex(r * factor, g * factor, b * factor);
  }
}

/**
 * Blend two hex colors
 */
export function blendHex(colorA: string, colorB: string, weightA: number): string {
  const [r1, g1, b1] = parseHex(colorA);
  const [r2, g2, b2] = parseHex(colorB);
  const w1 = Math.max(0, Math.min(1, weightA));
  const w2 = 1 - w1;
  return rgbToHex(r1 * w1 + r2 * w2, r1 * w1 + g2 * w2, b1 * w1 + b2 * w2);
}

/**
 * Normalize and auto-derive complementary palette slots if not explicitly tailored
 */
export function normalizeTheme(partial: Partial<GuiColorPalette>): GuiColorPalette {
  const baseBg = partial.bg || DEFAULT_GUI_THEME.bg;
  const primary = partial.primary || DEFAULT_GUI_THEME.primary;
  const secondary = partial.secondary || DEFAULT_GUI_THEME.secondary;
  const accent = partial.accent || primary;
  const primaryRgb = hexToRgb(primary);
  const secondaryRgb = hexToRgb(secondary);

  // Derive canvas & elevated surfaces with ambient tinting from baseBg and primary
  const bgDeep = partial.bgDeep || adjustHex(baseBg, -40);
  const surface = partial.surface || blendHex(adjustHex(baseBg, 22), primary, 0.94);
  const surfaceCard = partial.surfaceCard || blendHex(adjustHex(baseBg, 34), primary, 0.92);
  const border = partial.border || blendHex(adjustHex(baseBg, 65), primary, 0.82);
  const borderHighlight = partial.borderHighlight || `rgba(${primaryRgb}, 0.55)`;
  const glow = partial.glow || `rgba(${primaryRgb}, 0.38)`;
  const textAccent = partial.textAccent || accent;

  return {
    id: partial.id || 'custom-palette',
    name: partial.name || 'Custom Tailored Theme',
    primary,
    secondary,
    accent,
    bg: baseBg,
    bgDeep,
    surface,
    surfaceCard,
    border,
    borderHighlight,
    glow,
    textAccent,
    hueRotate: partial.hueRotate ?? DEFAULT_GUI_THEME.hueRotate,
    saturation: partial.saturation ?? DEFAULT_GUI_THEME.saturation,
    brightness: partial.brightness ?? DEFAULT_GUI_THEME.brightness
  };
}

/**
 * Injects all CSS custom properties to documentElement so the entire GUI transforms in real time.
 */
export function applyThemeToDom(themeInput: GuiColorPalette): void {
  if (typeof document === 'undefined') return;

  const theme = normalizeTheme(themeInput);
  const root = document.documentElement;
  const primaryRgb = hexToRgb(theme.primary);
  const secondaryRgb = hexToRgb(theme.secondary);
  const accentRgb = hexToRgb(theme.accent || theme.primary);

  // General GUI CSS Variables
  root.style.setProperty('--gui-primary', theme.primary);
  root.style.setProperty('--gui-primary-rgb', primaryRgb);
  root.style.setProperty('--gui-primary-hover', adjustHex(theme.primary, -12));
  root.style.setProperty('--gui-secondary', theme.secondary);
  root.style.setProperty('--gui-secondary-rgb', secondaryRgb);
  root.style.setProperty('--gui-accent', theme.accent);
  root.style.setProperty('--gui-accent-rgb', accentRgb);
  root.style.setProperty('--gui-bg', theme.bg);
  root.style.setProperty('--gui-bg-deep', theme.bgDeep);
  root.style.setProperty('--gui-surface', theme.surface);
  root.style.setProperty('--gui-surface-card', theme.surfaceCard);
  root.style.setProperty('--gui-surface-hover', adjustHex(theme.surfaceCard, 14));
  root.style.setProperty('--gui-border', theme.border);
  root.style.setProperty('--gui-border-highlight', theme.borderHighlight || theme.accent);
  root.style.setProperty('--gui-glow', theme.glow || `rgba(${primaryRgb}, 0.35)`);
  root.style.setProperty('--gui-text-accent', theme.textAccent || theme.accent);

  // Synchronize Breathing Sphere CSS Variables globally
  root.style.setProperty('--sphere-primary', theme.primary);
  root.style.setProperty('--sphere-secondary', theme.secondary);
  root.style.setProperty('--sphere-lines', theme.accent);
  root.style.setProperty('--sphere-text', '#ffffff');
  root.style.setProperty('--sphere-glow', theme.glow || theme.primary);
  root.style.setProperty('--sphere-bg', theme.bg);
  root.style.setProperty(
    '--mandala-filter',
    `contrast(1.15) hue-rotate(${theme.hueRotate}deg) saturate(${theme.saturation}%) brightness(${theme.brightness}%)`
  );
}

export function getStoredGuiTheme(): GuiColorPalette {
  if (typeof localStorage === 'undefined') return DEFAULT_GUI_THEME;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_GUI_THEME, ...parsed };
    }
    // Also check if sphere config had custom colors to migrate seamlessly
    const sphereRaw = localStorage.getItem('breathing_sphere_config_v2');
    if (sphereRaw) {
      const sphereConfig = JSON.parse(sphereRaw);
      if (sphereConfig.colors && sphereConfig.colors.primary) {
        return {
          ...DEFAULT_GUI_THEME,
          id: 'migrated-custom',
          name: 'Custom Palette',
          primary: sphereConfig.colors.primary,
          secondary: sphereConfig.colors.secondary || DEFAULT_GUI_THEME.secondary,
          accent: sphereConfig.colors.lines || sphereConfig.colors.primary,
          bg: sphereConfig.colors.bg || DEFAULT_GUI_THEME.bg,
          glow: sphereConfig.colors.glow || sphereConfig.colors.primary,
          textAccent: sphereConfig.colors.lines || sphereConfig.colors.primary,
          hueRotate: sphereConfig.colors.hueRotate ?? DEFAULT_GUI_THEME.hueRotate,
          saturation: sphereConfig.colors.saturation ?? DEFAULT_GUI_THEME.saturation,
          brightness: sphereConfig.colors.brightness ?? DEFAULT_GUI_THEME.brightness
        };
      }
    }
  } catch (e) {
    console.warn('Failed to parse stored GUI theme', e);
  }
  return DEFAULT_GUI_THEME;
}

export function saveGuiTheme(themeInput: GuiColorPalette): void {
  if (typeof localStorage === 'undefined') return;
  try {
    const theme = normalizeTheme(themeInput);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(theme));
    applyThemeToDom(theme);

    // Also update breathing_sphere_config_v2 so sphere stays in 100% sync
    try {
      const sphereRaw = localStorage.getItem('breathing_sphere_config_v2');
      const sphereParsed = sphereRaw ? JSON.parse(sphereRaw) : {};
      sphereParsed.colors = {
        primary: theme.primary,
        secondary: theme.secondary,
        lines: theme.accent,
        text: '#ffffff',
        glow: theme.glow || theme.primary,
        bg: theme.bg,
        hueRotate: theme.hueRotate,
        saturation: theme.saturation,
        brightness: theme.brightness
      };
      localStorage.setItem('breathing_sphere_config_v2', JSON.stringify(sphereParsed));
    } catch {
      // Non-critical
    }

    // Broadcast change event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('gui-theme-changed', { detail: theme }));
    }
  } catch (e) {
    console.warn('Failed to save GUI theme', e);
  }
}

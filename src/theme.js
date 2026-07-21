import { Platform } from 'react-native';

export const COLORS = {
  bg: '#000000',
  bgSoft: '#0A0A0A',
  surface: 'rgba(255,255,255,0.06)',
  surfaceSolid: '#101016',
  glass: 'rgba(255,255,255,0.06)',
  glassBorder: 'rgba(255,255,255,0.09)',
  glassHighlight: 'rgba(255,255,255,0.15)',
  ringTrack: 'rgba(255,255,255,0.05)',
  text: '#FFFFFF',
  textDim: 'rgba(255,255,255,0.60)',
  textFaint: 'rgba(255,255,255,0.30)',
};

export const ACCENTS = {
  onyx: { key: 'onyx', name: 'Onyx', from: '#FFFFFF', to: '#A1A1AA', glow: 'rgba(255,255,255,0.15)' },
  mint: { key: 'mint', name: 'Mint', from: '#5EEAD4', to: '#22D3EE', glow: 'rgba(94,234,212,0.25)' },
  violet: { key: 'violet', name: 'Violet', from: '#A78BFA', to: '#6366F1', glow: 'rgba(167,139,250,0.25)' },
  sunrise: { key: 'sunrise', name: 'Sunrise', from: '#FB923C', to: '#F43F5E', glow: 'rgba(251,146,60,0.25)' },
  lime: { key: 'lime', name: 'Lime', from: '#BEF264', to: '#22C55E', glow: 'rgba(163,230,53,0.22)' },
};

export const DEFAULT_ACCENT = 'onyx';

export const FONT = 'Poppins_400Regular';
export const FONT_MEDIUM = 'Poppins_500Medium';
export const FONT_SEMIBOLD = 'Poppins_600SemiBold';
export const FONT_BOLD = 'Poppins_700Bold';

// iOS-only font names (Courier, Georgia, Impact) don't exist on Android —
// map every style to fonts that exist on each platform.
const platformFont = (ios, android) => Platform.select({ ios, android, default: android });

export const getFontsForStyle = (style) => {
  if (style === 'mono') {
    const mono = platformFont('Courier', 'monospace');
    const monoBold = platformFont('Courier-Bold', 'monospace');
    return { regular: mono, medium: mono, semibold: monoBold, bold: monoBold };
  }
  if (style === 'classic') {
    const sys = platformFont('System', 'sans-serif');
    return { regular: sys, medium: sys, semibold: sys, bold: sys };
  }
  if (style === 'serif') {
    const serif = platformFont('Georgia', 'serif');
    const serifBold = platformFont('Georgia-Bold', 'serif');
    return { regular: serif, medium: serif, semibold: serifBold, bold: serifBold };
  }
  if (style === 'heavy') {
    const heavy = platformFont('Impact', 'sans-serif-black');
    return { regular: heavy, medium: heavy, semibold: heavy, bold: heavy };
  }
  return {
    regular: 'Poppins_400Regular',
    medium: 'Poppins_500Medium',
    semibold: 'Poppins_600SemiBold',
    bold: 'Poppins_700Bold',
  };
};

import { Platform } from 'react-native';

export const GLASS = {
  // Thailand Glass — bright Andaman water, pale sky and warm temple gold.
  aqua: '#7EF4F4',
  cyan: '#20D5DF',
  turquoise: '#23C9C0',
  teal: '#087F94',
  tealDeep: '#075A70',
  tealNight: '#07566C',
  emerald: '#56E2B5',
  sky: '#D9FAFC',
  white: '#FFFFFF',
  whiteSoft: '#F2FCFD',
  gold: '#FFE1A3',
  goldStrong: '#E9B85A',
  ink: '#063D50',
  inkSoft: '#3B7B89',

  // Airy aqua glass from the reference — readable without hiding the scenery.
  glass: 'rgba(94,206,222,0.23)',
  glassStrong: 'rgba(16,126,151,0.38)',
  glassSoft: 'rgba(185,239,245,0.18)',
  glassDark: 'rgba(5,84,105,0.54)',
  glassUltra: 'rgba(4,67,88,0.70)',

  border: 'rgba(231,253,255,0.34)',
  borderStrong: 'rgba(255,255,255,0.52)',
  highlight: 'rgba(255,255,255,0.76)',

  overlayTop: 'rgba(4,121,151,0.35)',
  overlayMid: 'rgba(13,164,185,0.16)',
  overlayBottom: 'rgba(3,83,105,0.48)',
  overlayVignette: 'rgba(0,52,70,0.08)',
  shadow: 'rgba(0,52,70,0.28)',
};

export const GLASS_RADIUS = { sm: 14, md: 19, lg: 24, xl: 30, pill: 999 };
export const GLASS_SPACING = { xs: 6, sm: 10, md: 16, lg: 22, xl: 30, xxl: 40 };

export const GLASS_TEXT = {
  primary: GLASS.white,
  secondary: 'rgba(255,255,255,0.88)',
  tertiary: 'rgba(255,255,255,0.72)',
  muted: 'rgba(255,255,255,0.62)',
  gold: GLASS.gold,
};

export const glassSurface = (strong = false) => ({
  backgroundColor: strong ? GLASS.glassStrong : GLASS.glass,
  borderWidth: 1,
  borderColor: strong ? GLASS.borderStrong : GLASS.border,
  shadowColor: GLASS.shadow,
  shadowOffset: { width: 0, height: 14 },
  shadowOpacity: Platform.OS === 'web' ? 0.30 : 0.24,
  shadowRadius: 22,
  elevation: 8,
  ...(Platform.OS === 'web' ? ({
    backdropFilter: strong ? 'blur(28px) saturate(145%)' : 'blur(20px) saturate(138%)',
    WebkitBackdropFilter: strong ? 'blur(28px) saturate(145%)' : 'blur(20px) saturate(138%)',
    boxShadow: strong
      ? '0 16px 38px rgba(0,65,82,.25), inset 0 1px 0 rgba(255,255,255,.34)'
      : '0 12px 28px rgba(0,65,82,.20), inset 0 1px 0 rgba(255,255,255,.24)',
  } as any) : {}),
});

export const glassPress = {
  pressedScale: 0.97,
  hoverLift: -4,
  duration: 220,
};

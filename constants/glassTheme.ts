import { Platform } from 'react-native';

export const GLASS = {
  // Thailand Glass — a shared ocean-blue palette for every route.
  aqua: '#82F4FB',
  cyan: '#45E5F1',
  turquoise: '#3BDEC8',
  teal: '#087F98',
  tealDeep: '#064A63',
  tealNight: '#032F46',
  emerald: '#38DBAC',
  sky: '#C9F5FA',
  white: '#FFFFFF',
  whiteSoft: '#F2FCFD',
  gold: '#F4D69B',
  goldStrong: '#E9B95B',
  ink: '#042C42',
  inkSoft: '#2A7282',

  // Dark cyan glass keeps white typography readable even on bright travel photos.
  glass: 'rgba(3,50,72,0.46)',
  glassStrong: 'rgba(3,43,65,0.66)',
  glassSoft: 'rgba(7,83,105,0.34)',
  glassDark: 'rgba(2,33,52,0.74)',
  glassUltra: 'rgba(1,26,43,0.84)',

  border: 'rgba(255,255,255,0.24)',
  borderStrong: 'rgba(255,255,255,0.42)',
  highlight: 'rgba(255,255,255,0.62)',

  overlayTop: 'rgba(3,59,91,0.68)',
  overlayMid: 'rgba(0,116,145,0.35)',
  overlayBottom: 'rgba(2,31,55,0.88)',
  overlayVignette: 'rgba(0,19,39,0.24)',
  shadow: 'rgba(0,20,43,0.46)',
};

export const GLASS_RADIUS = { sm: 16, md: 22, lg: 28, xl: 34, pill: 999 };
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
  shadowRadius: 28,
  elevation: 10,
  ...(Platform.OS === 'web' ? ({
    backdropFilter: strong ? 'blur(32px) saturate(155%)' : 'blur(24px) saturate(145%)',
    WebkitBackdropFilter: strong ? 'blur(32px) saturate(155%)' : 'blur(24px) saturate(145%)',
    boxShadow: strong
      ? '0 18px 46px rgba(0,20,43,.34), inset 0 1px 0 rgba(255,255,255,.26)'
      : '0 14px 34px rgba(0,20,43,.28), inset 0 1px 0 rgba(255,255,255,.16)',
  } as any) : {}),
});

export const glassPress = {
  pressedScale: 0.97,
  hoverLift: -4,
  duration: 220,
};

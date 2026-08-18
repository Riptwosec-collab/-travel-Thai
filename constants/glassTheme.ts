import { Platform } from 'react-native';

export const GLASS = {
  aqua: '#73F0F8',
  cyan: '#35DFEB',
  turquoise: '#28D5C7',
  teal: '#0B8798',
  tealDeep: '#064E60',
  tealNight: '#033A49',
  emerald: '#38DBAC',
  sky: '#C9F5FA',
  white: '#FFFFFF',
  whiteSoft: '#F2FCFD',
  gold: '#F4D69B',
  goldStrong: '#E9B95B',
  ink: '#063846',
  inkSoft: '#2A6672',

  // Dark cyan glass keeps white typography readable even on bright travel photos.
  glass: 'rgba(3,58,73,0.42)',
  glassStrong: 'rgba(3,53,68,0.56)',
  glassSoft: 'rgba(4,70,86,0.30)',
  glassDark: 'rgba(2,42,55,0.66)',
  glassUltra: 'rgba(2,35,47,0.76)',

  border: 'rgba(255,255,255,0.24)',
  borderStrong: 'rgba(255,255,255,0.42)',
  highlight: 'rgba(255,255,255,0.62)',

  overlayTop: 'rgba(2,77,102,0.54)',
  overlayMid: 'rgba(0,128,151,0.28)',
  overlayBottom: 'rgba(2,45,59,0.82)',
  overlayVignette: 'rgba(1,27,36,0.16)',
  shadow: 'rgba(1,31,43,0.38)',
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
  shadowOffset: { width: 0, height: 16 },
  shadowOpacity: Platform.OS === 'web' ? 0.28 : 0.20,
  shadowRadius: 30,
  elevation: 10,
  ...(Platform.OS === 'web' ? ({
    backdropFilter: strong ? 'blur(32px) saturate(155%)' : 'blur(24px) saturate(145%)',
    WebkitBackdropFilter: strong ? 'blur(32px) saturate(155%)' : 'blur(24px) saturate(145%)',
    boxShadow: strong
      ? '0 18px 46px rgba(1,31,43,.28), inset 0 1px 0 rgba(255,255,255,.22)'
      : '0 14px 34px rgba(1,31,43,.22), inset 0 1px 0 rgba(255,255,255,.14)',
  } as any) : {}),
});

export const glassPress = {
  pressedScale: 0.97,
  hoverLift: -4,
  duration: 220,
};

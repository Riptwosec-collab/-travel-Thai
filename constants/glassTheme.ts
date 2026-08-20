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

// Phone-first visual tokens shared by new and upgraded screens.
export const GLASS_RADIUS = { sm: 13, md: 18, lg: 22, xl: 26, pill: 999 };
export const GLASS_SPACING = { xs: 5, sm: 8, md: 13, lg: 18, xl: 23, xxl: 30 };
export const GLASS_LAYOUT = {
  phoneMaxWidth: 430,
  webPhoneWidth: 402,
  pagePadding: 14,
  sectionGap: 12,
  cardPadding: 13,
  touchTarget: 44,
  compactTouchTarget: 36,
  bottomContentPadding: 120,
};

export const GLASS_TEXT = {
  primary: GLASS.white,
  secondary: 'rgba(255,255,255,0.90)',
  tertiary: 'rgba(255,255,255,0.74)',
  muted: 'rgba(255,255,255,0.64)',
  gold: GLASS.gold,
};

export const glassSurface = (strong = false) => ({
  backgroundColor: strong ? GLASS.glassStrong : GLASS.glass,
  borderWidth: 1,
  borderColor: strong ? GLASS.borderStrong : GLASS.border,
  shadowColor: GLASS.shadow,
  shadowOffset: { width: 0, height: 9 },
  shadowOpacity: Platform.OS === 'web' ? 0.24 : 0.18,
  shadowRadius: 20,
  elevation: 7,
  ...(Platform.OS === 'web' ? ({
    backdropFilter: strong ? 'blur(28px) saturate(150%)' : 'blur(22px) saturate(142%)',
    WebkitBackdropFilter: strong ? 'blur(28px) saturate(150%)' : 'blur(22px) saturate(142%)',
    boxShadow: strong
      ? '0 12px 32px rgba(1,31,43,.25), inset 0 1px 0 rgba(255,255,255,.20)'
      : '0 9px 24px rgba(1,31,43,.20), inset 0 1px 0 rgba(255,255,255,.13)',
  } as any) : {}),
});

export const glassPress = {
  pressedScale: 0.97,
  hoverLift: -2,
  duration: 180,
};

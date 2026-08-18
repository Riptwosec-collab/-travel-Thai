import { Platform } from 'react-native';

export const GLASS = {
  aqua: '#63E8F4',
  cyan: '#28D9E8',
  turquoise: '#22D3C5',
  teal: '#0B7E91',
  tealDeep: '#07576A',
  emerald: '#2BD3A6',
  sky: '#BDEFF7',
  white: '#FFFFFF',
  gold: '#F2D39A',
  goldStrong: '#E8B957',
  ink: '#073B49',
  inkSoft: '#2D6571',
  glass: 'rgba(255,255,255,0.16)',
  glassStrong: 'rgba(255,255,255,0.24)',
  glassSoft: 'rgba(255,255,255,0.10)',
  glassDark: 'rgba(4,66,82,0.34)',
  border: 'rgba(255,255,255,0.30)',
  borderStrong: 'rgba(255,255,255,0.48)',
  overlayTop: 'rgba(5,88,130,0.40)',
  overlayMid: 'rgba(0,160,180,0.18)',
  overlayBottom: 'rgba(4,60,75,0.72)',
  shadow: 'rgba(2,70,88,0.22)',
};

export const GLASS_RADIUS = { sm: 16, md: 22, lg: 28, xl: 34, pill: 999 };
export const GLASS_SPACING = { xs: 6, sm: 10, md: 16, lg: 22, xl: 30, xxl: 40 };

export const glassSurface = (strong = false) => ({
  backgroundColor: strong ? GLASS.glassStrong : GLASS.glass,
  borderWidth: 1,
  borderColor: strong ? GLASS.borderStrong : GLASS.border,
  shadowColor: GLASS.shadow,
  shadowOffset: { width: 0, height: 14 },
  shadowOpacity: Platform.OS === 'web' ? 0.16 : 0.12,
  shadowRadius: 28,
  elevation: 8,
  ...(Platform.OS === 'web' ? ({
    backdropFilter: strong ? 'blur(34px) saturate(145%)' : 'blur(26px) saturate(135%)',
    WebkitBackdropFilter: strong ? 'blur(34px) saturate(145%)' : 'blur(26px) saturate(135%)',
  } as any) : {}),
});

export const glassPress = {
  pressedScale: 0.97,
  hoverLift: -4,
  duration: 220,
};

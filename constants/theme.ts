export const COLORS = {
  primary: '#21D5E4',
  primaryDark: '#087E91',
  secondary: '#61DDF2',
  wishlist: '#F0C774',
  visited: '#25D5B2',
  rating: '#FFD166',
  background: 'rgba(7,91,108,0.18)',
  surface: 'rgba(255,255,255,0.20)',
  surfaceAlt: 'rgba(255,255,255,0.12)',
  text: '#073D4B',
  textMuted: '#3F6F79',
  border: 'rgba(255,255,255,0.34)',
  dark: '#075A6E',
  darkSurface: '#0B7A8E',
  gold: '#F2D39A',
  danger: '#E05C66',
};

export const CATEGORY_COLORS: Record<string, string> = {
  ทะเล: '#58DBEF', ธรรมชาติ: '#35D1A7', ภูเขา: '#78B8FF',
  วัด: '#F2C66D', คาเฟ่: '#F4A66D', อาหาร: '#EF7C72', ที่พัก: '#4FD3E8',
};

// Phone-first scale used by legacy/core screens. Keep touch targets large while reducing oversized desktop spacing.
export const SPACING = { xs: 5, sm: 8, md: 13, lg: 18, xl: 24 };
export const RADIUS = { sm: 12, md: 16, lg: 22, pill: 999 };
export const SHADOW = {
  shadowColor: '#03566B', shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.14, shadowRadius: 20, elevation: 5,
};

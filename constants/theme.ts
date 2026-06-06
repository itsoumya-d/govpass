export const theme = {
  colors: {
    primary: '#1D4ED8',
    secondary: '#059669',
    background: '#1C1C1E',
    surface: '#2C2C2E',
    card: '#2C2C2E',
    border: '#38383A',
    text: '#FFFFFF',
    textSecondary: '#94A3B8',
    textMuted: '#64748B',
    success: '#22C55E',
    warning: '#F59E0B',
    error: '#EF4444',
    biometric: '#1D4ED8',
    skeleton: { base: '#1C1C1E', highlight: '#2C2C2E' },
    status: {
      active: '#22C55E',
      pending: '#F59E0B',
      inactive: '#94A3B8',
      error: '#EF4444',
    },
  },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 },
  radius: { sm: 8, md: 12, lg: 16, xl: 24, full: 9999 },
  typography: {
    fontSize: { xs: 11, sm: 13, base: 15, md: 17, lg: 20, xl: 24, '2xl': 28, '3xl': 34 },
    lineHeight: { tight: 1.2, normal: 1.5, relaxed: 1.75 },
    fontWeight: { normal: '400' as const, medium: '500' as const, semiBold: '600' as const, bold: '700' as const },
  },
  animation: {
    spring: { damping: 15, stiffness: 300, mass: 0.6 },
    fast: 150,
    normal: 300,
    slow: 500,
  },
  elevation: {
    sm: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.15, shadowRadius: 2, elevation: 2 },
    md: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 6 },
    lg: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 16, elevation: 10 },
    primary: { shadowColor: '#1D4ED8', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 8 },
  },
} as const;

export type Theme = typeof theme;

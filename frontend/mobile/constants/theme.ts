export const colors = {
  primary: '#1B2A4A',      // Deep navy
  primaryLight: '#2D4A7A',
  secondary: '#0D9488',    // Teal
  secondaryLight: '#14B8A6',
  accent: '#06B6D4',       // Cyan accent
  
  success: '#16A34A',      // Green — non-diagnostic positive
  warning: '#F59E0B',      // Amber — caution
  danger: '#DC2626',       // Red — urgent/emergency
  dangerLight: '#FEE2E2',
  
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceSecondary: '#F1F5F9',
  
  text: '#0F172A',
  textSecondary: '#64748B',
  textTertiary: '#94A3B8',
  textInverse: '#FFFFFF',
  
  border: '#E2E8F0',
  borderFocus: '#0D9488',
  
  heart: '#EF4444',        // Heart icon color
  emergency: '#DC2626',    // Emergency red
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 24,
  xxl: 32,
  hero: 40,
};

export const shadows = {
  sm: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  lg: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
};

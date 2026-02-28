export const theme = {
  colors: {
    bgPrimary: '#0E1114',
    surface: '#161B20',
    card: '#1C2228',
    border: '#262E36',

    primary: '#1F8A5B',
    primaryHover: '#25A46B',
    primaryPressed: '#176B47',

    textPrimary: '#F3F4F6',
    textSecondary: '#9CA3AF',
    textMuted: '#6B7280',

    success: '#22C55E',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
  },
  radius: {
    sm: '8px',
    md: '12px',
    lg: '16px',
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
  },
} as const;

export type Theme = typeof theme;

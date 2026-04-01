'use client';

import { theme } from '@/lib/theme';

export default function ProLockBadge() {
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '2px 6px',
      borderRadius: 5,
      background: theme.colors.primary,
      color: '#FFFFFF',
      fontSize: 9,
      fontWeight: 700,
      letterSpacing: '0.06em',
      textTransform: 'uppercase' as const,
      lineHeight: 1.4,
      flexShrink: 0,
    }}>
      PRO
    </span>
  );
}

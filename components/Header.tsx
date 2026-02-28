import React from 'react';
import { theme } from '@/lib/theme';

interface HeaderProps {
  greeting: string;
  streak: number;
}

export default function Header({ greeting, streak }: HeaderProps) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: `${theme.spacing.md} 0`,
      }}
    >
      <div>
        <h1
          style={{
            color: theme.colors.textPrimary,
            fontSize: '24px',
            fontWeight: 700,
            margin: 0,
            lineHeight: 1.3,
          }}
        >
          {greeting}
        </h1>
        <p
          style={{
            color: theme.colors.textSecondary,
            fontSize: '14px',
            margin: '4px 0 0 0',
          }}
        >
          Let&apos;s crush it today
        </p>
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          backgroundColor: theme.colors.surface,
          border: `1px solid ${theme.colors.border}`,
          borderRadius: theme.radius.sm,
          padding: '6px 12px',
        }}
      >
        <span style={{ fontSize: '16px' }}>🔥</span>
        <span
          style={{
            color: theme.colors.warning,
            fontSize: '14px',
            fontWeight: 600,
          }}
        >
          {streak}
        </span>
      </div>
    </div>
  );
}

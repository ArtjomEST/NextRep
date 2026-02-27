import React from 'react';
import { theme } from '@/lib/theme';

interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
}

export default function StatCard({ label, value, unit }: StatCardProps) {
  return (
    <div
      style={{
        backgroundColor: theme.colors.card,
        borderRadius: theme.radius.md,
        border: `1px solid ${theme.colors.border}`,
        padding: '14px',
        flex: 1,
        minWidth: 0,
      }}
    >
      <p
        style={{
          color: theme.colors.textMuted,
          fontSize: '12px',
          margin: 0,
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}
      >
        {label}
      </p>
      <p
        style={{
          color: theme.colors.textPrimary,
          fontSize: '20px',
          fontWeight: 700,
          margin: '6px 0 0 0',
        }}
      >
        {value}
        {unit && (
          <span
            style={{
              fontSize: '13px',
              fontWeight: 400,
              color: theme.colors.textSecondary,
              marginLeft: '3px',
            }}
          >
            {unit}
          </span>
        )}
      </p>
    </div>
  );
}

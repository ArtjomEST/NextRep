import React from 'react';
import { theme } from '@/lib/theme';

interface CardProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
  onClick?: () => void;
}

export default function Card({ children, style, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      style={{
        backgroundColor: theme.colors.card,
        borderRadius: theme.radius.md,
        border: `1px solid ${theme.colors.border}`,
        padding: theme.spacing.md,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'border-color 0.15s ease',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

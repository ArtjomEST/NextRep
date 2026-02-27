'use client';

import React from 'react';
import { theme } from '@/lib/theme';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  fullWidth?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function Button({
  children,
  variant = 'primary',
  fullWidth = false,
  size = 'md',
  style,
  ...props
}: ButtonProps) {
  const sizeStyles: Record<string, React.CSSProperties> = {
    sm: { padding: '8px 16px', fontSize: '14px' },
    md: { padding: '14px 24px', fontSize: '16px' },
    lg: { padding: '18px 32px', fontSize: '18px' },
  };

  const variantStyles: Record<string, React.CSSProperties> = {
    primary: {
      backgroundColor: theme.colors.primary,
      color: theme.colors.textPrimary,
      border: 'none',
    },
    secondary: {
      backgroundColor: 'transparent',
      color: theme.colors.primary,
      border: `1px solid ${theme.colors.primary}`,
    },
    ghost: {
      backgroundColor: 'transparent',
      color: theme.colors.textSecondary,
      border: 'none',
    },
  };

  return (
    <button
      style={{
        ...sizeStyles[size],
        ...variantStyles[variant],
        borderRadius: theme.radius.md,
        fontWeight: 600,
        cursor: 'pointer',
        width: fullWidth ? '100%' : 'auto',
        transition: 'background-color 0.15s ease, opacity 0.15s ease',
        letterSpacing: '0.01em',
        ...style,
      }}
      {...props}
    >
      {children}
    </button>
  );
}

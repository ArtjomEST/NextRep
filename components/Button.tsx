'use client';

import React from 'react';
import { theme } from '@/lib/theme';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  fullWidth?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg';
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
    xs: { padding: '6px 10px', fontSize: '12px' },
    sm: { padding: '8px 14px', fontSize: '13px' },
    md: { padding: '13px 20px', fontSize: '15px' },
    lg: { padding: '15px 20px', fontSize: '16px' },
  };

  const variantStyles: Record<string, React.CSSProperties> = {
    primary: {
      backgroundColor: theme.colors.primary,
      color: theme.colors.textPrimary,
      border: 'none',
    },
    secondary: {
      backgroundColor: 'transparent',
      color: theme.colors.textMuted,
      border: `1px dashed ${theme.colors.border}`,
    },
    ghost: {
      backgroundColor: 'transparent',
      color: theme.colors.textMuted,
      border: 'none',
    },
  };

  return (
    <button
      style={{
        ...sizeStyles[size],
        ...variantStyles[variant],
        borderRadius: '10px',
        fontWeight: 700,
        cursor: props.disabled ? 'not-allowed' : 'pointer',
        width: fullWidth ? '100%' : 'auto',
        transition: 'opacity 0.15s ease',
        letterSpacing: '0.01em',
        ...style,
      }}
      {...props}
    >
      {children}
    </button>
  );
}

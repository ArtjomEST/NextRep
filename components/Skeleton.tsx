'use client';

import React from 'react';
import { theme } from '@/lib/theme';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string;
  style?: React.CSSProperties;
}

export default function Skeleton({
  width,
  height = 16,
  borderRadius = theme.radius.sm,
  style,
}: SkeletonProps) {
  return (
    <div
      style={{
        width: width ?? '100%',
        height: typeof height === 'number' ? `${height}px` : height,
        borderRadius,
        backgroundColor: theme.colors.surface,
        ...style,
      }}
    />
  );
}

'use client';

import React from 'react';
import { theme } from '@/lib/theme';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export default function Modal({ open, onClose, children }: ModalProps) {
  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 300,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
        }}
      />
      <div
        style={{
          position: 'relative',
          backgroundColor: theme.colors.card,
          border: `1px solid ${theme.colors.border}`,
          borderRadius: theme.radius.lg,
          padding: '24px',
          maxWidth: '360px',
          width: '100%',
        }}
      >
        {children}
      </div>
    </div>
  );
}

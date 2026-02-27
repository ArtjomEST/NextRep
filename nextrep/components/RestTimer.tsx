'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { theme } from '@/lib/theme';
import { formatDuration } from '@/lib/workout/metrics';

interface RestTimerProps {
  visible: boolean;
  onDismiss: () => void;
}

const DEFAULT_REST = 120;

export default function RestTimer({ visible, onDismiss }: RestTimerProps) {
  const [remaining, setRemaining] = useState(DEFAULT_REST);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clear = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (visible) {
      setRemaining(DEFAULT_REST);
      setRunning(true);
    } else {
      setRunning(false);
      clear();
    }
  }, [visible, clear]);

  useEffect(() => {
    clear();
    if (running && remaining > 0) {
      intervalRef.current = setInterval(() => {
        setRemaining((prev) => {
          if (prev <= 1) {
            setRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return clear;
  }, [running, remaining > 0, clear]);

  if (!visible) return null;

  const progress = remaining / DEFAULT_REST;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '16px',
        left: 0,
        right: 0,
        zIndex: 90,
        display: 'flex',
        justifyContent: 'center',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <div
        style={{
          maxWidth: '480px',
          width: '100%',
          margin: '0 16px',
          backgroundColor: theme.colors.card,
          border: `1px solid ${theme.colors.border}`,
          borderRadius: theme.radius.md,
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ color: theme.colors.textSecondary, fontSize: '12px', fontWeight: 500 }}>
              Rest Timer
            </span>
            <span
              style={{
                color: remaining === 0 ? theme.colors.success : theme.colors.textPrimary,
                fontSize: '18px',
                fontWeight: 700,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {formatDuration(remaining)}
            </span>
          </div>
          <div
            style={{
              height: '3px',
              backgroundColor: theme.colors.surface,
              borderRadius: '2px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${progress * 100}%`,
                backgroundColor: remaining === 0 ? theme.colors.success : theme.colors.primary,
                borderRadius: '2px',
                transition: 'width 1s linear',
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '4px' }}>
          <button onClick={() => setRemaining((r) => Math.max(0, r - 30))} style={{ ...timerBtn }}>
            −30
          </button>
          <button
            onClick={() => setRunning((r) => !r)}
            style={{ ...timerBtn, backgroundColor: theme.colors.primary, color: theme.colors.textPrimary }}
          >
            {running ? '⏸' : '▶'}
          </button>
          <button onClick={() => setRemaining((r) => r + 30)} style={{ ...timerBtn }}>
            +30
          </button>
          <button onClick={onDismiss} style={{ ...timerBtn, color: theme.colors.textMuted }}>
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}

const timerBtn: React.CSSProperties = {
  backgroundColor: 'rgba(255,255,255,0.06)',
  border: 'none',
  borderRadius: '6px',
  padding: '6px 8px',
  color: '#9CA3AF',
  fontSize: '12px',
  fontWeight: 600,
  cursor: 'pointer',
  minWidth: '36px',
  textAlign: 'center',
};

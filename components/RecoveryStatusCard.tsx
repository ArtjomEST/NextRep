'use client';

import React from 'react';
import { theme } from '@/lib/theme';

export type DeloadStatus = 'good' | 'warning' | 'recommended';

const SIGNAL_LABELS: Record<string, string> = {
  rapid_volume_increase: 'Volume increased rapidly for 3+ weeks',
  volume_drop_from_peak: 'Volume dropped from your recent peak',
  long_training_block: '6+ consecutive weeks of training',
  weight_stagnation: 'Key lifts have stalled for 3+ sessions',
};

interface WeeklyVolume {
  weekStart: string;
  volume: number;
}

interface RecoveryStatusCardProps {
  status: DeloadStatus;
  signals: string[];
  weeklyVolumes: WeeklyVolume[];
  isPro: boolean;
  onOpenPlan: () => void;
  onDismiss: () => void;
}

export default function RecoveryStatusCard({
  status,
  signals,
  weeklyVolumes,
  isPro,
  onOpenPlan,
  onDismiss,
}: RecoveryStatusCardProps) {
  const consecutiveWeeks = weeklyVolumes.filter((w) => w.volume > 0).length;
  const firstSignal = signals[0] ?? null;
  const signalLabel = firstSignal ? SIGNAL_LABELS[firstSignal] : null;

  const cardStyle: React.CSSProperties = {
    background: theme.colors.card,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.radius.md,
    padding: '14px 14px 14px 16px',
    position: 'relative',
    ...(status === 'recommended' && {
      borderLeft: `3px solid ${theme.colors.warning}`,
    }),
  };

  // Status dot color
  const dotColor =
    status === 'good'
      ? theme.colors.success
      : status === 'warning'
      ? theme.colors.warning
      : '#F97316'; // orange for recommended

  // Status title
  const title =
    status === 'good'
      ? 'Recovery status: Good'
      : status === 'warning'
      ? 'Consider a deload soon'
      : 'Deload recommended';

  return (
    <div style={cardStyle}>
      {/* Dismiss button */}
      <button
        onClick={onDismiss}
        aria-label="Dismiss recovery card"
        style={{
          position: 'absolute',
          top: 10,
          right: 10,
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: theme.colors.textMuted,
          fontSize: 16,
          lineHeight: 1,
          padding: '2px 4px',
        }}
      >
        ×
      </button>

      {status === 'good' ? (
        /* ── Good: single compact row ── */
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingRight: 24 }}>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: dotColor,
              flexShrink: 0,
              boxShadow: `0 0 0 3px ${dotColor}33`,
            }}
          />
          <span style={{ color: theme.colors.textPrimary, fontSize: 14, fontWeight: 600 }}>
            {title}
          </span>
          <span style={{ color: theme.colors.textMuted, fontSize: 12 }}>
            · Week {consecutiveWeeks} of block
          </span>
        </div>
      ) : (
        /* ── Warning / Recommended ── */
        <div style={{ paddingRight: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: dotColor,
                flexShrink: 0,
                boxShadow: `0 0 0 3px ${dotColor}33`,
              }}
            />
            <span
              style={{
                color: theme.colors.textPrimary,
                fontSize: 14,
                fontWeight: 700,
              }}
            >
              {title}
            </span>
          </div>

          {signalLabel && (
            <p
              style={{
                color: theme.colors.textMuted,
                fontSize: 12,
                margin: '0 0 10px',
                lineHeight: 1.4,
              }}
            >
              {signalLabel}
            </p>
          )}

          {status === 'recommended' && (
            <button
              onClick={isPro ? onOpenPlan : undefined}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                background: isPro ? theme.colors.primary : 'rgba(255,255,255,0.06)',
                border: isPro ? 'none' : `1px solid ${theme.colors.border}`,
                borderRadius: theme.radius.sm,
                padding: '7px 14px',
                color: theme.colors.textPrimary,
                fontSize: 13,
                fontWeight: 600,
                cursor: isPro ? 'pointer' : 'default',
              }}
            >
              {isPro ? 'See your plan →' : '🔒 Upgrade to PRO'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

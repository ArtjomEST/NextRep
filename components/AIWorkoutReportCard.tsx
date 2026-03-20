'use client';

import React, { useEffect, useState } from 'react';
import { theme } from '@/lib/theme';
import type { AiWorkoutReportScores } from '@/lib/api/client';

function scoreStrokeColor(total: number): string {
  if (total >= 80) return '#22C55E';
  if (total >= 60) return '#EAB308';
  return '#EF4444';
}

function CircularScore({ score }: { score: number }) {
  const r = 46;
  const c = 2 * Math.PI * r;
  const pct = Math.min(100, Math.max(0, score)) / 100;
  const [offset, setOffset] = useState(c);

  useEffect(() => {
    const t = requestAnimationFrame(() => setOffset(c * (1 - pct)));
    return () => cancelAnimationFrame(t);
  }, [c, pct]);

  const color = scoreStrokeColor(score);

  return (
    <svg width="112" height="112" viewBox="0 0 112 112">
      <circle
        cx="56"
        cy="56"
        r={r}
        fill="none"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth="8"
      />
      <circle
        cx="56"
        cy="56"
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={offset}
        transform="rotate(-90 56 56)"
        style={{
          transition: 'stroke-dashoffset 0.9s ease-out',
        }}
      />
      <text
        x="56"
        y="54"
        textAnchor="middle"
        fill={theme.colors.textPrimary}
        fontSize="28"
        fontWeight={800}
      >
        {score}
      </text>
      <text
        x="56"
        y="74"
        textAnchor="middle"
        fill={theme.colors.textMuted}
        fontSize="12"
        fontWeight={600}
      >
        /100
      </text>
    </svg>
  );
}

function BreakdownRow({
  label,
  value,
  suffix,
}: {
  label: string;
  value: number;
  suffix?: string;
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 12,
        fontSize: 13,
      }}
    >
      <span style={{ color: theme.colors.textSecondary }}>{label}</span>
      <span style={{ color: theme.colors.textPrimary, fontWeight: 700 }}>
        {suffix ?? value}
      </span>
    </div>
  );
}

export default function AIWorkoutReportCard({
  loading,
  error,
  report,
  scores,
}: {
  loading: boolean;
  error: string | null;
  report: string | null;
  scores: AiWorkoutReportScores | null;
}) {
  if (loading) {
    return (
      <div
        style={{
          borderRadius: theme.radius.lg,
          border: `1px solid ${theme.colors.border}`,
          backgroundColor: theme.colors.card,
          padding: 18,
        }}
      >
        <div
          style={{
            height: 18,
            width: '55%',
            borderRadius: 6,
            backgroundColor: theme.colors.surface,
            marginBottom: 16,
          }}
        />
        <div style={{ display: 'flex', gap: 20, marginBottom: 16 }}>
          <div
            style={{
              width: 112,
              height: 112,
              borderRadius: '50%',
              backgroundColor: theme.colors.surface,
            }}
          />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                style={{
                  height: 12,
                  borderRadius: 4,
                  backgroundColor: theme.colors.surface,
                  opacity: 0.85,
                }}
              />
            ))}
          </div>
        </div>
        <div
          style={{
            height: 12,
            borderRadius: 4,
            backgroundColor: theme.colors.surface,
            marginBottom: 8,
          }}
        />
        <div
          style={{
            height: 12,
            width: '92%',
            borderRadius: 4,
            backgroundColor: theme.colors.surface,
            marginBottom: 8,
          }}
        />
        <div
          style={{
            height: 12,
            width: '78%',
            borderRadius: 4,
            backgroundColor: theme.colors.surface,
          }}
        />
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          borderRadius: theme.radius.lg,
          border: `1px solid ${theme.colors.border}`,
          backgroundColor: 'rgba(239,68,68,0.08)',
          padding: 16,
          color: theme.colors.error,
          fontSize: 14,
        }}
      >
        {error}
      </div>
    );
  }

  if (!report || !scores) return null;

  return (
    <div
      style={{
        borderRadius: theme.radius.lg,
        border: `1px solid ${theme.colors.border}`,
        backgroundColor: theme.colors.card,
        padding: 18,
      }}
    >
      <div
        style={{
          color: theme.colors.textPrimary,
          fontWeight: 700,
          fontSize: 16,
          marginBottom: 16,
        }}
      >
        🤖 AI Coach Analysis
      </div>

      <div
        style={{
          display: 'flex',
          gap: 16,
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        <CircularScore score={scores.total} />
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            minWidth: 0,
          }}
        >
          <BreakdownRow label="Volume" value={scores.volume} />
          <BreakdownRow label="Intensity" value={scores.intensity} />
          <BreakdownRow label="Consist." value={scores.consistency} />
          <BreakdownRow label="Duration" value={scores.duration} />
          <BreakdownRow
            label="PR Bonus"
            value={scores.prBonus}
            suffix={scores.prBonus > 0 ? `+${scores.prBonus}` : '0'}
          />
        </div>
      </div>

      <p
        style={{
          margin: 0,
          color: theme.colors.textSecondary,
          fontSize: 14,
          lineHeight: 1.55,
        }}
      >
        {report}
      </p>
    </div>
  );
}

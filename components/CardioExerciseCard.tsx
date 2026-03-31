'use client';

import { useState, useEffect, useRef } from 'react';
import { theme } from '@/lib/theme';
import { getCardioParams } from '@/lib/cardio-params';
import type { CardioTimerState } from '@/lib/types';

interface CardioExerciseCardProps {
  workoutExerciseId: string;
  exerciseName: string;
  timerState: CardioTimerState;
  onStart: () => void;
  onStop: () => void;
  onSetParam: (paramKey: string, value: number) => void;
}

export default function CardioExerciseCard({
  workoutExerciseId,
  exerciseName,
  timerState,
  onStart,
  onStop,
  onSetParam,
}: CardioExerciseCardProps) {
  const [displaySec, setDisplaySec] = useState(timerState.elapsed);
  const rafRef = useRef<number | null>(null);
  const paramConfigs = getCardioParams(exerciseName);
  const isRunning = timerState.startedAt !== null;

  useEffect(() => {
    if (timerState.startedAt === null) {
      setDisplaySec(timerState.elapsed);
      return;
    }
    const tick = () => {
      setDisplaySec(timerState.elapsed + (Date.now() - timerState.startedAt!) / 1000);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [timerState.startedAt, timerState.elapsed]);

  const formatTime = (sec: number) => {
    const s = Math.floor(sec);
    const m = Math.floor(s / 60);
    return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  };

  // Suppress unused variable warning
  void workoutExerciseId;

  return (
    <div style={{
      background: theme.colors.card,
      border: `1px solid ${theme.colors.border}`,
      borderRadius: theme.radius.lg,
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ padding: '12px 14px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: theme.colors.textPrimary }}>{exerciseName}</span>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.25)',
          borderRadius: 6, padding: '2px 8px',
        }}>
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#3B82F6' }} />
          <span style={{ fontSize: 9, fontWeight: 600, color: '#3B82F6', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            CARDIO
          </span>
        </div>
      </div>

      {/* Timer */}
      <div style={{ padding: '4px 14px 12px' }}>
        <div style={{
          fontSize: 40, fontWeight: 700, color: theme.colors.textPrimary,
          letterSpacing: '-0.03em', lineHeight: 1, fontVariantNumeric: 'tabular-nums',
        }}>
          {formatTime(displaySec)}
        </div>
        <div style={{ fontSize: 11, color: theme.colors.textMuted, marginTop: 3 }}>
          {isRunning ? 'active' : displaySec > 0 ? 'paused' : 'not started'}
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <button
            onClick={isRunning ? onStop : onStart}
            style={{
              flex: 1, padding: '10px 0', cursor: 'pointer',
              background: isRunning ? 'rgba(255,255,255,0.07)' : displaySec > 0 ? 'rgba(255,255,255,0.07)' : theme.colors.primary,
              border: `1px solid ${theme.colors.border}`, borderRadius: theme.radius.sm,
              fontSize: 13, fontWeight: 600,
              color: isRunning || displaySec > 0 ? theme.colors.textSecondary : '#fff',
              transition: 'background 0.15s ease',
            }}
          >
            {isRunning ? 'Pause' : displaySec > 0 ? 'Resume' : 'Start'}
          </button>
          <button
            onClick={displaySec > 0 ? onStop : undefined}
            disabled={displaySec === 0}
            style={{
              flex: 1, padding: '10px 0',
              cursor: displaySec > 0 ? 'pointer' : 'default',
              background: displaySec > 0 ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.04)',
              border: displaySec > 0 ? '1px solid rgba(34,197,94,0.3)' : `1px solid ${theme.colors.border}`,
              borderRadius: theme.radius.sm, fontSize: 13, fontWeight: 600,
              color: displaySec > 0 ? theme.colors.success : theme.colors.textMuted,
              opacity: displaySec > 0 ? 1 : 0.4, transition: 'all 0.15s ease',
            }}
          >
            Done
          </button>
        </div>
      </div>

      <div style={{ height: 1, background: theme.colors.border, margin: '0 14px 12px' }} />

      {/* Params */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${Math.min(paramConfigs.length, 2)}, 1fr)`,
        gap: 8, padding: '0 14px 14px',
      }}>
        {paramConfigs.map((cfg) => {
          const value = timerState.params[cfg.key] ?? cfg.default;
          return (
            <div key={cfg.key} style={{
              background: 'rgba(255,255,255,0.04)', border: `1px solid ${theme.colors.border}`,
              borderRadius: 10, padding: '8px 10px',
            }}>
              <div style={{ fontSize: 9, fontWeight: 600, color: theme.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>
                {cfg.label}
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
                <span style={{ fontSize: 20, fontWeight: 700, color: theme.colors.textPrimary, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>
                  {cfg.step < 1 ? value.toFixed(1) : value}
                </span>
                <span style={{ fontSize: 10, color: theme.colors.textMuted }}>{cfg.unit}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', marginTop: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 7, overflow: 'hidden' }}>
                <button
                  onClick={() => onSetParam(cfg.key, Math.max(cfg.min, parseFloat((value - cfg.step).toFixed(2))))}
                  style={{ width: 30, height: 26, background: 'transparent', border: 'none', color: theme.colors.textSecondary, fontSize: 18, fontWeight: 300, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >−</button>
                <div style={{ flex: 1, textAlign: 'center', fontSize: 9, color: theme.colors.textMuted }}>×{cfg.step}</div>
                <button
                  onClick={() => onSetParam(cfg.key, Math.min(cfg.max, parseFloat((value + cfg.step).toFixed(2))))}
                  style={{ width: 30, height: 26, background: 'transparent', border: 'none', color: theme.colors.textSecondary, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >+</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

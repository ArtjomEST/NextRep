'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { theme } from '@/lib/theme';

interface RestTimerProps {
  visible: boolean;
  workoutName: string;
  exerciseName: string;
  setIndex: number;
  onAddSet: () => void;
  onFinishExercise: () => void;
  onDismiss: () => void;
}

const DEFAULT_REST = 120;
const RADIUS = 88;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function RestTimer({
  visible,
  workoutName,
  exerciseName,
  setIndex,
  onAddSet,
  onFinishExercise,
  onDismiss,
}: RestTimerProps) {
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
  const dashOffset = CIRCUMFERENCE * (1 - progress);
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  const isDone = remaining === 0;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: theme.colors.bgPrimary,
        zIndex: 80,
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
      }}
    >
      {/* ─── Header ─── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          padding: '16px 16px 0',
        }}
      >
        <div>
          <h1
            style={{
              color: theme.colors.textPrimary,
              fontSize: '24px',
              fontWeight: 800,
              margin: '0 0 5px',
              letterSpacing: '-0.02em',
              lineHeight: 1.1,
            }}
          >
            {workoutName}
          </h1>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              color: theme.colors.success,
              fontSize: '13px',
              fontWeight: 600,
            }}
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Set #{setIndex + 1} logged
          </div>
        </div>
        <button
          onClick={onDismiss}
          style={{
            backgroundColor: theme.colors.primary,
            color: theme.colors.textPrimary,
            border: 'none',
            borderRadius: '8px',
            padding: '10px 22px',
            fontSize: '14px',
            fontWeight: 700,
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          Finish
        </button>
      </div>

      {/* ─── Current Exercise ─── */}
      <div
        style={{
          padding: '20px 16px 0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <p
            style={{
              color: theme.colors.textMuted,
              fontSize: '10px',
              fontWeight: 700,
              letterSpacing: '0.10em',
              textTransform: 'uppercase',
              margin: '0 0 4px',
            }}
          >
            Current Exercise
          </p>
          <h2
            style={{
              color: theme.colors.textPrimary,
              fontSize: '17px',
              fontWeight: 700,
              margin: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {exerciseName}
          </h2>
        </div>
        <span
          style={{
            backgroundColor: theme.colors.primary,
            color: theme.colors.textPrimary,
            fontSize: '12px',
            fontWeight: 700,
            padding: '5px 14px',
            borderRadius: '20px',
            flexShrink: 0,
          }}
        >
          Set #{setIndex + 1}
        </span>
      </div>

      {/* ─── Circular Timer ─── */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '28px 0 20px',
        }}
      >
        <div style={{ position: 'relative', width: 220, height: 220 }}>
          <svg
            width={220}
            height={220}
            viewBox="0 0 220 220"
            style={{ transform: 'rotate(-90deg)', display: 'block' }}
          >
            {/* Track ring */}
            <circle
              cx={110}
              cy={110}
              r={RADIUS}
              fill="none"
              stroke={theme.colors.border}
              strokeWidth={10}
            />
            {/* Progress ring */}
            <circle
              cx={110}
              cy={110}
              r={RADIUS}
              fill="none"
              stroke={isDone ? theme.colors.success : '#22C55E'}
              strokeWidth={10}
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={dashOffset}
              style={{ transition: 'stroke-dashoffset 1s linear' }}
            />
          </svg>
          {/* Center text */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
            }}
          >
            <span
              style={{
                color: isDone ? theme.colors.success : theme.colors.textPrimary,
                fontSize: '46px',
                fontWeight: 800,
                fontVariantNumeric: 'tabular-nums',
                letterSpacing: '-0.02em',
                lineHeight: 1,
              }}
            >
              {timeStr}
            </span>
            <span
              style={{
                color: theme.colors.textMuted,
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.10em',
                textTransform: 'uppercase',
              }}
            >
              {isDone ? 'Done!' : 'Rest'}
            </span>
          </div>
        </div>

        {/* −30 / Pause / +30 */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
          <button
            onClick={() => setRemaining((r) => Math.max(0, r - 30))}
            style={controlBtn}
          >
            −30
          </button>
          <button
            onClick={() => setRunning((r) => !r)}
            style={{
              ...controlBtn,
              width: '56px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {running ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill={theme.colors.textPrimary}>
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill={theme.colors.textPrimary}>
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            )}
          </button>
          <button
            onClick={() => setRemaining((r) => r + 30)}
            style={controlBtn}
          >
            +30
          </button>
        </div>
      </div>

      {/* ─── Action Buttons ─── */}
      <div
        style={{
          padding: '0 16px 32px',
          display: 'flex',
          gap: '10px',
          paddingBottom: 'max(32px, env(safe-area-inset-bottom, 32px))',
        }}
      >
        <button
          onClick={onAddSet}
          style={{
            flex: 1,
            padding: '15px',
            backgroundColor: theme.colors.card,
            border: `1px solid ${theme.colors.border}`,
            borderRadius: '12px',
            color: theme.colors.textPrimary,
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          + Add Set
        </button>
        <button
          onClick={onFinishExercise}
          style={{
            flex: 2,
            padding: '15px',
            backgroundColor: theme.colors.primary,
            border: 'none',
            borderRadius: '12px',
            color: theme.colors.textPrimary,
            fontSize: '14px',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Finish Exercise →
        </button>
      </div>
    </div>
  );
}

const controlBtn: React.CSSProperties = {
  width: '80px',
  height: '50px',
  backgroundColor: theme.colors.card,
  border: `1px solid ${theme.colors.border}`,
  borderRadius: '12px',
  color: theme.colors.textPrimary,
  fontSize: '15px',
  fontWeight: 700,
  cursor: 'pointer',
};

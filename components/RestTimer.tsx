'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { theme } from '@/lib/theme';
import {
  armTimerApi,
  updateTimerApi,
  pauseTimerApi,
  resumeTimerApi,
} from '@/lib/api/client';

interface RestTimerProps {
  visible: boolean;
  isMinimized?: boolean;
  /** Compact in-flow layout (e.g. onboarding) — same mini-bar UI, not fixed to viewport. */
  embedded?: boolean;
  /** Countdown length in seconds (default 120). */
  durationSeconds?: number;
  /** When true, timer does not call onDismiss at 0. */
  suppressAutoDismiss?: boolean;
  /** Workout draft ID — used to sync timer state with the server for push notifications. */
  workoutId?: string;
  workoutName: string;
  exerciseName: string;
  setIndex: number;
  onMinimize?: () => void;
  onExpand?: () => void;
  onAddSet: () => void;
  onFinishExercise: () => void;
  onDismiss: () => void;
}

const DEFAULT_REST_SEC = 120;
const TICK_MS = 500;
const RADIUS = 88;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function RestTimer({
  visible,
  isMinimized = false,
  embedded = false,
  durationSeconds,
  suppressAutoDismiss = false,
  workoutId,
  workoutName,
  exerciseName,
  setIndex,
  onMinimize,
  onExpand,
  onAddSet,
  onFinishExercise,
  onDismiss,
}: RestTimerProps) {
  const durationSec = durationSeconds ?? DEFAULT_REST_SEC;
  const [restEndsAt, setRestEndsAt] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [remainingWhenPaused, setRemainingWhenPaused] = useState(0);
  const [tick, setTick] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasAutoClosedRef = useRef(false);
  const justBecameVisibleRef = useRef(false);

  const clearIntervalRef = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const forceRecalc = useCallback(() => setTick((t) => t + 1), []);

  // Initialize when visible (and not just minimizing)
  useEffect(() => {
    if (visible) {
      justBecameVisibleRef.current = true;
      setRestEndsAt(Date.now() + durationSec * 1000);
      setIsPaused(false);
      setRemainingWhenPaused(0);
      hasAutoClosedRef.current = false;
      if (workoutId) {
        armTimerApi(workoutId, durationSec).catch(console.error);
      }
    } else {
      clearIntervalRef();
    }
  }, [visible, clearIntervalRef, durationSec, workoutId]);

  // Tick interval for UI refresh (only when running, not paused)
  useEffect(() => {
    clearIntervalRef();
    if (visible && !isPaused) {
      intervalRef.current = setInterval(forceRecalc, TICK_MS);
    }
    return clearIntervalRef;
  }, [visible, isPaused, forceRecalc, clearIntervalRef]);

  // visibilitychange and focus: force immediate recalculation
  useEffect(() => {
    if (!visible) return;
    const onVisibilityChange = () => forceRecalc();
    const onFocus = () => forceRecalc();
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('focus', onFocus);
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('focus', onFocus);
    };
  }, [visible, forceRecalc]);

  // Auto-close when timer reaches 0 (full and minimized)
  // Skip on first run after visible becomes true: init effect schedules setRestEndsAt
  // but auto-close runs in same cycle and would see stale restEndsAt (0 or past) → immediate dismiss
  useEffect(() => {
    if (!visible || hasAutoClosedRef.current || suppressAutoDismiss) return;
    if (justBecameVisibleRef.current) {
      justBecameVisibleRef.current = false;
      return;
    }
    const remainingSecs = isPaused
      ? remainingWhenPaused
      : Math.max(0, Math.ceil((restEndsAt - Date.now()) / 1000));
    if (remainingSecs === 0) {
      hasAutoClosedRef.current = true;
      onDismiss();
    }
  }, [visible, isPaused, restEndsAt, remainingWhenPaused, tick, onDismiss, suppressAutoDismiss]);

  // Compute remaining seconds for display (timestamp-based)
  const remaining = isPaused
    ? remainingWhenPaused
    : Math.max(0, Math.ceil((restEndsAt - Date.now()) / 1000));

  const handleMinus30 = () => {
    if (isPaused) {
      const newRemaining = Math.max(0, remainingWhenPaused - 30);
      setRemainingWhenPaused(newRemaining);
      if (workoutId) {
        updateTimerApi(new Date(Date.now() + newRemaining * 1000).toISOString()).catch(console.error);
      }
    } else {
      const newEnd = Math.max(Date.now(), restEndsAt - 30000);
      setRestEndsAt(newEnd);
      if (workoutId) {
        updateTimerApi(new Date(newEnd).toISOString()).catch(console.error);
      }
    }
  };

  const handlePlus30 = () => {
    if (isPaused) {
      const newRemaining = remainingWhenPaused + 30;
      setRemainingWhenPaused(newRemaining);
      if (workoutId) {
        updateTimerApi(new Date(Date.now() + newRemaining * 1000).toISOString()).catch(console.error);
      }
    } else {
      const newEnd = restEndsAt + 30000;
      setRestEndsAt(newEnd);
      if (workoutId) {
        updateTimerApi(new Date(newEnd).toISOString()).catch(console.error);
      }
    }
  };

  const handlePauseResume = () => {
    if (isPaused) {
      setRestEndsAt(Date.now() + remainingWhenPaused * 1000);
      setIsPaused(false);
      if (workoutId) {
        resumeTimerApi(remainingWhenPaused * 1000).catch(console.error);
      }
    } else {
      const secs = Math.max(0, Math.ceil((restEndsAt - Date.now()) / 1000));
      setRemainingWhenPaused(secs);
      setIsPaused(true);
      if (workoutId) {
        pauseTimerApi(secs * 1000).catch(console.error);
      }
    }
  };

  if (!visible) return null;

  const progress = remaining / durationSec;
  const dashOffset = CIRCUMFERENCE * (1 - progress);
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  const isDone = remaining === 0;

  // ─── Embedded (in-flow mini bar — same styles as minimized, not fixed) ───
  if (embedded) {
    return (
      <div
        style={{
          borderRadius: 12,
          border: `1px solid ${theme.colors.border}`,
          backgroundColor: theme.colors.card,
          padding: '12px 14px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            width: '100%',
          }}
        >
          <span
            style={{
              color: isDone ? theme.colors.success : theme.colors.textPrimary,
              fontSize: '20px',
              fontWeight: 800,
              fontVariantNumeric: 'tabular-nums',
              minWidth: 52,
            }}
          >
            {timeStr}
          </span>
          <div
            style={{
              flex: 1,
              height: 4,
              backgroundColor: theme.colors.border,
              borderRadius: 2,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${progress * 100}%`,
                backgroundColor: isDone ? theme.colors.success : theme.colors.primary,
                borderRadius: 2,
                transition: 'width 0.3s ease-out',
              }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              type="button"
              onClick={handleMinus30}
              style={miniBtn}
              aria-label="Subtract 30 seconds"
            >
              −30
            </button>
            <button
              type="button"
              onClick={handlePauseResume}
              style={{ ...miniBtn, width: 40, padding: '8px 0' }}
              aria-label={isPaused ? 'Resume' : 'Pause'}
            >
              {isPaused ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill={theme.colors.textPrimary}>
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill={theme.colors.textPrimary}>
                  <rect x="6" y="4" width="4" height="16" rx="1" />
                  <rect x="14" y="4" width="4" height="16" rx="1" />
                </svg>
              )}
            </button>
            <button
              type="button"
              onClick={handlePlus30}
              style={miniBtn}
              aria-label="Add 30 seconds"
            >
              +30
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Mini-timer bar (when minimized) ───
  if (isMinimized) {
    return (
      <div
        style={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 90,
          padding: '10px 16px',
          paddingBottom: 'max(10px, env(safe-area-inset-bottom, 10px))',
          backgroundColor: theme.colors.card,
          borderTop: `1px solid ${theme.colors.border}`,
          boxShadow: '0 -4px 20px rgba(0,0,0,0.3)',
          animation: 'rest-mini-slide-up 0.25s ease-out',
        }}
      >
        <style>{`
          @keyframes rest-mini-slide-up {
            from { opacity: 0; transform: translateY(100%); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            maxWidth: 480,
            margin: '0 auto',
          }}
        >
          {/* Time */}
          <span
            style={{
              color: isDone ? theme.colors.success : theme.colors.textPrimary,
              fontSize: '20px',
              fontWeight: 800,
              fontVariantNumeric: 'tabular-nums',
              minWidth: 52,
            }}
          >
            {timeStr}
          </span>

          {/* Progress bar */}
          <div
            style={{
              flex: 1,
              height: 4,
              backgroundColor: theme.colors.border,
              borderRadius: 2,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${progress * 100}%`,
                backgroundColor: isDone ? theme.colors.success : theme.colors.primary,
                borderRadius: 2,
                transition: 'width 0.3s ease-out',
              }}
            />
          </div>

          {/* −30 / Pause / +30 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              onClick={handleMinus30}
              style={miniBtn}
              aria-label="Subtract 30 seconds"
            >
              −30
            </button>
            <button
              onClick={handlePauseResume}
              style={{ ...miniBtn, width: 40, padding: '8px 0' }}
              aria-label={isPaused ? 'Resume' : 'Pause'}
            >
              {isPaused ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill={theme.colors.textPrimary}>
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill={theme.colors.textPrimary}>
                  <rect x="6" y="4" width="4" height="16" rx="1" />
                  <rect x="14" y="4" width="4" height="16" rx="1" />
                </svg>
              )}
            </button>
            <button
              onClick={handlePlus30}
              style={miniBtn}
              aria-label="Add 30 seconds"
            >
              +30
            </button>
          </div>

          {/* Expand */}
          <button
            onClick={onExpand}
            style={{
              ...miniBtn,
              backgroundColor: theme.colors.primary,
              border: 'none',
              padding: '8px 14px',
              minWidth: 44,
            }}
            aria-label="Expand timer"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke={theme.colors.textPrimary}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="18 15 12 9 6 15" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  // ─── Full overlay ───
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
        animation: 'rest-full-fade-in 0.2s ease-out',
      }}
    >
      <style>{`
        @keyframes rest-full-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>

      {/* ─── Header with Minimize ─── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          padding: '16px 16px 0',
          gap: 12,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
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
        {onMinimize && (
          <button
            onClick={onMinimize}
            style={{
              background: 'none',
              border: `1px solid ${theme.colors.border}`,
              borderRadius: '8px',
              color: theme.colors.textMuted,
              cursor: 'pointer',
              padding: '8px 10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
            aria-label="Minimize timer"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
        )}
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
            <circle
              cx={110}
              cy={110}
              r={RADIUS}
              fill="none"
              stroke={theme.colors.border}
              strokeWidth={10}
            />
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
              style={{ transition: 'stroke-dashoffset 0.3s ease-out' }}
            />
          </svg>
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
              {isDone ? 'Done!' : isPaused ? 'Paused' : 'Rest'}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
          <button onClick={handleMinus30} style={controlBtn}>
            −30
          </button>
          <button
            onClick={handlePauseResume}
            style={{
              ...controlBtn,
              width: '56px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {isPaused ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill={theme.colors.textPrimary}>
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill={theme.colors.textPrimary}>
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            )}
          </button>
          <button onClick={handlePlus30} style={controlBtn}>
            +30
          </button>
        </div>
      </div>

      {/* ─── Guidance ─── */}
      <div
        style={{
          padding: '0 16px 20px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <p
          style={{
            color: theme.colors.textMuted,
            fontSize: '12px',
            fontWeight: 500,
            margin: 0,
            textAlign: 'center',
            lineHeight: 1.4,
          }}
        >
          Wait for the timer to end, or add a new set, or finish the exercise.
        </p>
        <div
          style={{
            width: '100%',
            height: 1,
            backgroundColor: theme.colors.border,
          }}
        />
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

const miniBtn: React.CSSProperties = {
  backgroundColor: theme.colors.surface,
  border: `1px solid ${theme.colors.border}`,
  borderRadius: '8px',
  color: theme.colors.textPrimary,
  fontSize: '12px',
  fontWeight: 700,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '8px 12px',
  minWidth: 44,
  minHeight: 36,
};

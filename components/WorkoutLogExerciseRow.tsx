'use client';

import React, { useState } from 'react';
import { theme } from '@/lib/theme';

/** Workout log line — same layout as Community feed “Workout log” exercise rows. */
export function WorkoutLogExerciseRow({
  exerciseImageUrl,
  exerciseName,
  completedSets,
  thumbSize = 32,
  nameFontWeight = 400,
  setsLabel,
  onInfoClick,
}: {
  exerciseImageUrl: string | null;
  exerciseName: string;
  /** When omitted, use `setsLabel` or hide the right column. */
  completedSets?: number;
  thumbSize?: number;
  nameFontWeight?: number;
  /** Overrides the default "{completedSets} sets" text. */
  setsLabel?: string;
  /** Opens exercise details (e.g. preset preview sheet). */
  onInfoClick?: () => void;
}) {
  const [imgBroken, setImgBroken] = useState(false);
  const showImg = Boolean(exerciseImageUrl && !imgBroken);
  const radius = theme.radius.sm;

  const rightText =
    setsLabel !== undefined
      ? setsLabel
      : completedSets !== undefined
        ? `${completedSets} sets`
        : null;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
      }}
    >
      {showImg ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={exerciseImageUrl!}
          alt=""
          width={thumbSize}
          height={thumbSize}
          onError={() => setImgBroken(true)}
          style={{
            width: thumbSize,
            height: thumbSize,
            borderRadius: radius,
            objectFit: 'cover',
            backgroundColor: theme.colors.card,
            flexShrink: 0,
          }}
        />
      ) : (
        <div
          aria-hidden
          style={{
            width: thumbSize,
            height: thumbSize,
            borderRadius: radius,
            backgroundColor: theme.colors.border,
            flexShrink: 0,
          }}
        />
      )}
      <span
        style={{
          flex: 1,
          color: theme.colors.textPrimary,
          fontSize: '14px',
          fontWeight: nameFontWeight,
          minWidth: 0,
        }}
      >
        {exerciseName}
      </span>
      {rightText !== null ? (
        <span
          style={{
            color: theme.colors.textMuted,
            fontSize: '13px',
            flexShrink: 0,
          }}
        >
          {rightText}
        </span>
      ) : null}
      {onInfoClick ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onInfoClick();
          }}
          style={{
            background: 'none',
            border: `1px solid ${theme.colors.border}`,
            borderRadius: '6px',
            color: theme.colors.textMuted,
            cursor: 'pointer',
            padding: '4px 8px',
            fontSize: '11px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '3px',
            flexShrink: 0,
          }}
          aria-label="Exercise info"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          Info
        </button>
      ) : null}
    </div>
  );
}

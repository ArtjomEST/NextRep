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
}: {
  exerciseImageUrl: string | null;
  exerciseName: string;
  /** When omitted, use `setsLabel` or hide the right column. */
  completedSets?: number;
  thumbSize?: number;
  nameFontWeight?: number;
  /** Overrides the default "{completedSets} sets" text. */
  setsLabel?: string;
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
    </div>
  );
}

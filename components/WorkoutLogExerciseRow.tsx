'use client';

import React from 'react';
import { theme } from '@/lib/theme';

/** Workout log line — same layout as Community feed “Workout log” exercise rows. */
export function WorkoutLogExerciseRow({
  exerciseImageUrl,
  exerciseName,
  completedSets,
}: {
  exerciseImageUrl: string | null;
  exerciseName: string;
  completedSets: number;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
      }}
    >
      {exerciseImageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={exerciseImageUrl}
          alt=""
          width={32}
          height={32}
          style={{
            width: 32,
            height: 32,
            borderRadius: theme.radius.sm,
            objectFit: 'cover',
            backgroundColor: theme.colors.card,
          }}
        />
      ) : (
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: theme.radius.sm,
            backgroundColor: theme.colors.border,
          }}
        />
      )}
      <span
        style={{
          flex: 1,
          color: theme.colors.textPrimary,
          fontSize: '14px',
          minWidth: 0,
        }}
      >
        {exerciseName}
      </span>
      <span
        style={{
          color: theme.colors.textMuted,
          fontSize: '13px',
          flexShrink: 0,
        }}
      >
        {completedSets} sets
      </span>
    </div>
  );
}

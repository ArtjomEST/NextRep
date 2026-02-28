'use client';

import React from 'react';
import { theme } from '@/lib/theme';
import type { WorkoutExercise } from '@/lib/types';

interface WorkoutExerciseCardProps {
  entry: WorkoutExercise;
  onRemove: () => void;
  isDragging?: boolean;
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
}

export default function WorkoutExerciseCard({
  entry,
  onRemove,
  isDragging,
  dragHandleProps,
}: WorkoutExerciseCardProps) {
  return (
    <div
      style={{
        backgroundColor: theme.colors.card,
        borderRadius: theme.radius.md,
        border: `1px solid ${isDragging ? theme.colors.primary : theme.colors.border}`,
        padding: '14px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        boxShadow: isDragging ? '0 8px 24px rgba(0,0,0,0.4)' : 'none',
        transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
      }}
    >
      {/* Drag handle */}
      <div
        {...dragHandleProps}
        style={{
          color: theme.colors.textMuted,
          cursor: 'grab',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '4px 2px',
          touchAction: 'none',
          flexShrink: 0,
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <rect x="4" y="5" width="4" height="4" rx="1.5" />
          <rect x="10" y="5" width="4" height="4" rx="1.5" />
          <rect x="16" y="5" width="4" height="4" rx="1.5" />
          <rect x="4" y="11" width="4" height="4" rx="1.5" />
          <rect x="10" y="11" width="4" height="4" rx="1.5" />
          <rect x="16" y="11" width="4" height="4" rx="1.5" />
          <rect x="4" y="17" width="4" height="4" rx="1.5" />
          <rect x="10" y="17" width="4" height="4" rx="1.5" />
          <rect x="16" y="17" width="4" height="4" rx="1.5" />
        </svg>
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{ color: theme.colors.textPrimary, fontSize: '15px', fontWeight: 600 }}>
          {entry.exerciseName}
        </span>
        <div style={{ display: 'flex', gap: '5px', marginTop: '6px', flexWrap: 'wrap' }}>
          {entry.muscleGroups.map((mg) => (
            <span
              key={mg}
              style={{
                backgroundColor: theme.colors.surface,
                color: theme.colors.textSecondary,
                fontSize: '10px',
                fontWeight: 500,
                padding: '2px 7px',
                borderRadius: '5px',
                border: `1px solid ${theme.colors.border}`,
              }}
            >
              {mg}
            </span>
          ))}
          <span
            style={{
              backgroundColor: 'rgba(31,138,91,0.12)',
              color: theme.colors.primary,
              fontSize: '10px',
              fontWeight: 500,
              padding: '2px 7px',
              borderRadius: '5px',
            }}
          >
            {entry.equipment}
          </span>
        </div>
      </div>

      {/* Remove */}
      <button
        onClick={onRemove}
        style={{
          background: 'none',
          border: 'none',
          color: theme.colors.textMuted,
          cursor: 'pointer',
          padding: '8px',
          margin: '-8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}

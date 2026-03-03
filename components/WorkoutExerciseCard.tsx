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
        borderRadius: '14px',
        border: `1.5px solid ${isDragging ? theme.colors.primary : theme.colors.border}`,
        padding: '13px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        boxShadow: isDragging ? '0 8px 28px rgba(0,0,0,0.45)' : 'none',
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
          opacity: 0.5,
        }}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
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
        <span
          style={{
            color: theme.colors.textPrimary,
            fontSize: '15px',
            fontWeight: 600,
            display: 'block',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {entry.exerciseName}
        </span>
        <div style={{ display: 'flex', gap: '5px', marginTop: '6px', flexWrap: 'wrap' }}>
          {entry.muscleGroups.map((mg) => (
            <span key={mg} style={muscleTagStyle}>{mg}</span>
          ))}
          {entry.equipment && (
            <span style={equipTagStyle}>{entry.equipment}</span>
          )}
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
          padding: '6px 4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          fontSize: '16px',
          opacity: 0.4,
          transition: 'opacity 0.15s ease',
          lineHeight: 1,
        }}
        onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
        onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.4'; }}
      >
        ✕
      </button>
    </div>
  );
}

const muscleTagStyle: React.CSSProperties = {
  backgroundColor: theme.colors.surface,
  color: theme.colors.textMuted,
  fontSize: '10px',
  fontWeight: 600,
  padding: '3px 8px',
  borderRadius: '5px',
  border: `1px solid ${theme.colors.border}`,
};

const equipTagStyle: React.CSSProperties = {
  backgroundColor: 'rgba(31,138,91,0.14)',
  color: theme.colors.primary,
  fontSize: '10px',
  fontWeight: 600,
  padding: '3px 8px',
  borderRadius: '5px',
};
